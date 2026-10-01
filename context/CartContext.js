"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "simi-stitches-cart";

const CartContext = createContext(null);

// The cart lives in memory (React Context) and is mirrored to localStorage
// so it survives a page refresh. Item shape:
// { id, name, price, unit, image_url, quantity }
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  // 1) Load the saved cart once, in the browser, after the page mounts.
  //    We start empty on the server so the first HTML always matches.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved)) {
          // localStorage can only be read in the browser (after mount),
          // so loading it here is the standard React pattern. The rule
          // below guards against repeated cascading renders — this runs
          // exactly once on mount, so it is safe.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(saved);
        }
      }
    } catch {
      // Corrupt data — fall back to an empty cart.
    }
    setHydrated(true);
  }, []);

  // 2) Save the cart after every change (only once it has loaded, so we
  //    never overwrite the saved cart with the initial empty state).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage unavailable — cart still works for this visit.
    }
  }, [items, hydrated]);

  // Adding a product that is already in the cart increases its quantity.
  const addToCart = useCallback((product) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          image_url: product.image_url,
          quantity: 1,
        },
      ];
    });
  }, []);

  const increase = useCallback((id) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }, []);

  const decrease = useCallback((id) => {
    setItems((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  // Used after a successful order — the items now live in Supabase.
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Badge number = sum of all quantities in the cart.
  const count = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      count,
      hydrated,
      addToCart,
      increase,
      decrease,
      removeFromCart,
      clearCart,
    }),
    [
      items,
      count,
      hydrated,
      addToCart,
      increase,
      decrease,
      removeFromCart,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside a <CartProvider>.");
  }
  return context;
}
