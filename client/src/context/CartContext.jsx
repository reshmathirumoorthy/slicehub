import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CartContext } from './cartContextInstance';
import {
  addToCartApi,
  applyCouponApi,
  clearCartApi,
  fetchCart,
  mergeCartApi,
  removeCartItemApi,
  removeCouponApi,
  updateCartItemApi,
} from '../services/cartService';
import { getUserToken } from '../services/api';

const emptyTotals = {
  subtotal: 0,
  discount: 0,
  deliveryFee: 0,
  tax: 0,
  taxRate: 0.05,
  grandTotal: 0,
  itemCount: 0,
  freeDeliveryMin: 999,
  couponCode: null,
  couponValid: false,
};

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [totals, setTotals] = useState(emptyTotals);
  const [couponCode, setCouponCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mutating, setMutating] = useState(false);

  const applyCart = useCallback((cart) => {
    setItems(cart?.items || []);
    setTotals(cart?.totals || emptyTotals);
    setCouponCode(cart?.couponCode || null);
    setError('');
  }, []);

  const refreshCart = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const cart = await fetchCart();
      applyCart(cart);
      return cart;
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load cart');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [applyCart]);

  useEffect(() => {
    refreshCart().catch(() => {});
  }, [refreshCart]);

  const runMutation = useCallback(
    async (fn) => {
      setMutating(true);
      setError('');
      try {
        const cart = await fn();
        applyCart(cart);
        return cart;
      } catch (err) {
        const message = err.response?.data?.message || 'Cart update failed';
        setError(message);
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [applyCart],
  );

  const addItem = useCallback(
    async (payload) => runMutation(() => addToCartApi(payload)),
    [runMutation],
  );

  const updateQuantity = useCallback(
    async (itemId, quantity) =>
      runMutation(() => updateCartItemApi(itemId, quantity)),
    [runMutation],
  );

  const removeItem = useCallback(
    async (itemId) => runMutation(() => removeCartItemApi(itemId)),
    [runMutation],
  );

  const clearCart = useCallback(
    async () => runMutation(() => clearCartApi()),
    [runMutation],
  );

  const applyCoupon = useCallback(
    async (code) => runMutation(() => applyCouponApi(code)),
    [runMutation],
  );

  const removeCoupon = useCallback(
    async () => runMutation(() => removeCouponApi()),
    [runMutation],
  );

  const mergeGuestCart = useCallback(async () => {
    if (!getUserToken()) return refreshCart();
    return runMutation(() => mergeCartApi());
  }, [refreshCart, runMutation]);

  const count = totals.itemCount || items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = totals.subtotal || 0;

  const value = useMemo(
    () => ({
      items,
      totals,
      couponCode,
      count,
      subtotal,
      loading,
      error,
      mutating,
      refreshCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      applyCoupon,
      removeCoupon,
      mergeGuestCart,
    }),
    [
      items,
      totals,
      couponCode,
      count,
      subtotal,
      loading,
      error,
      mutating,
      refreshCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      applyCoupon,
      removeCoupon,
      mergeGuestCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
