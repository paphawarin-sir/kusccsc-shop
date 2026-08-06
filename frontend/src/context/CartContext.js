import { createContext, useContext, useState } from "react";

const CartContext = createContext();

// ── helper ──
const CART_KEY = "kusccsc_cart";
const loadCart = () => {
  try {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};
const saveCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export function CartProvider({ children }) {
  // 1. โหลดจาก localStorage ตอน init
  const [cart, setCart] = useState(loadCart);

  // 2. ทุก setter ต้อง saveCart ด้วย
  const setAndSave = (updater) => {
    setCart((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveCart(next);
      return next;
    });
  };

  const addToCart = (product, qty = 1) => {
    setAndSave((prev) => {
      const existing = prev.find(
        (i) => i._id === product._id && i.selectedColor === (product.selectedColor || null)
      );
      if (existing) {
        return prev.map((i) =>
          i._id === product._id && i.selectedColor === (product.selectedColor || null)
            ? { ...i, quantity: i.quantity + qty, price: product.price }
            : i
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const removeFromCart = (id, color) =>
    setAndSave((prev) => prev.filter((i) => !(i._id === id && i.selectedColor === color)));

  const updateQty = (id, qty, color) => {
    if (qty < 1) return removeFromCart(id, color);
    setAndSave((prev) =>
      prev.map((i) =>
        i._id === id && i.selectedColor === color ? { ...i, quantity: qty } : i
      )
    );
  };

  const clearCart = () => {
    localStorage.removeItem(CART_KEY);
    setCart([]);
  };

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);