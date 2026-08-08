const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/**
 * Opens Razorpay Checkout (TEST MODE keys from server).
 */
export const openRazorpayCheckout = async ({ checkout, onDismiss }) => {
  const ready = await loadRazorpayScript();
  if (!ready || !window.Razorpay) {
    throw new Error('Could not load Razorpay checkout');
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const rzp = new window.Razorpay({
      key: checkout.keyId,
      amount: checkout.amount,
      currency: checkout.currency || 'INR',
      name: checkout.name || 'SliceHub',
      description: checkout.description || 'Pizza order',
      order_id: checkout.razorpayOrderId,
      prefill: checkout.prefill || {},
      theme: { color: '#e85d04' },
      handler(response) {
        settled = true;
        resolve(response);
      },
      modal: {
        ondismiss() {
          if (settled) return;
          settled = true;
          if (onDismiss) onDismiss();
          reject(
            Object.assign(new Error('Payment cancelled'), { cancelled: true }),
          );
        },
      },
    });

    rzp.on('payment.failed', (response) => {
      if (settled) return;
      settled = true;
      const message =
        response?.error?.description ||
        response?.error?.reason ||
        'Payment failed';
      reject(Object.assign(new Error(message), { failed: true, response }));
    });

    rzp.open();
  });
};
