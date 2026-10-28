import api from './api';
import { getToken } from './authStore';

const CART_EVENT = 'svrp:cart_updated';
const CART_ANIMATE_EVENT = 'svrp:cart_animate';

let _cartCount = 0;

export const getCartCount = () => _cartCount;

export const setCartCount = (count) => {
    _cartCount = Math.max(0, count);
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { count: _cartCount } }));
    }
};

export const fetchCartCount = async () => {
    const token = getToken();
    if (!token) {
        setCartCount(0);
        return 0;
    }
    try {
        const res = await api.get('/cart', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const items = res.data?.items || [];
        const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
        setCartCount(total);
        return total;
    } catch {
        return _cartCount;
    }
};

export const notifyCartItemAdded = (productName = '') => {
    _cartCount += 1;
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(CART_ANIMATE_EVENT, { detail: { count: _cartCount, productName } }));
        window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { count: _cartCount } }));
    }
    // Also sync in background with server
    fetchCartCount();
};

export const subscribeCart = (onCountChange, onAnimate) => {
    if (typeof window === 'undefined') return () => {};

    const handleCount = (e) => {
        if (onCountChange) onCountChange(e.detail?.count ?? _cartCount);
    };

    const handleAnimate = (e) => {
        if (onAnimate) onAnimate(e.detail);
    };

    window.addEventListener(CART_EVENT, handleCount);
    if (onAnimate) window.addEventListener(CART_ANIMATE_EVENT, handleAnimate);

    return () => {
        window.removeEventListener(CART_EVENT, handleCount);
        if (onAnimate) window.removeEventListener(CART_ANIMATE_EVENT, handleAnimate);
    };
};
