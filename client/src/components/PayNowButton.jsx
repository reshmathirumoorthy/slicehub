import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from './ui/Button';
import {
  createRazorpayCheckout,
  markPaymentFailed,
  verifyRazorpayPayment,
} from '../services/paymentService';
import { openRazorpayCheckout } from '../utils/razorpay';

/**
 * Pay Now control for unpaid online orders.
 * States: idle | loading | success | failed | cancelled
 */
function PayNowButton({
  orderId,
  disabled = false,
  onPaid,
  className = '',
  autoHint = false,
}) {
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');

  const handlePay = async () => {
    setState('loading');
    setMessage('Opening secure checkout…');
    try {
      const checkout = await createRazorpayCheckout(orderId);

      let response;
      try {
        response = await openRazorpayCheckout({ checkout });
      } catch (err) {
        if (err.cancelled) {
          setState('cancelled');
          setMessage('Payment cancelled. You can try again anytime.');
          await markPaymentFailed(orderId, 'Customer cancelled checkout').catch(
            () => {},
          );
          toast('Payment cancelled');
          return;
        }
        setState('failed');
        setMessage(err.message || 'Payment failed');
        await markPaymentFailed(orderId, err.message || 'Payment failed').catch(
          () => {},
        );
        toast.error(err.message || 'Payment failed');
        return;
      }

      setMessage('Verifying payment…');
      const result = await verifyRazorpayPayment({
        orderId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      setState('success');
      setMessage(
        result.alreadyPaid
          ? 'Already paid — you are all set.'
          : 'Payment successful!',
      );
      toast.success('Payment verified');
      onPaid?.(result);
    } catch (err) {
      setState('failed');
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Could not complete payment';
      setMessage(msg);
      toast.error(msg);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        type="button"
        className="w-full"
        disabled={disabled || state === 'loading' || state === 'success'}
        onClick={handlePay}
      >
        {state === 'loading'
          ? 'Processing…'
          : state === 'success'
            ? 'Paid'
            : 'Pay Now'}
      </Button>
      {autoHint && state === 'idle' ? (
        <p className="text-xs text-[var(--muted)]">
          Test mode: use Razorpay test cards / UPI from their docs.
        </p>
      ) : null}
      {message ? (
        <p
          className={`text-xs ${
            state === 'success'
              ? 'text-[var(--success)]'
              : state === 'failed'
                ? 'text-[var(--danger)]'
                : state === 'cancelled'
                  ? 'text-[var(--muted)]'
                  : 'text-[var(--muted)]'
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

export default PayNowButton;
