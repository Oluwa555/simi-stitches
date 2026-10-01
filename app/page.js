/* eslint-disable @next/next/no-img-element */
// A plain <img> is used because product image URLs come from the database and
// can point to any host. next/image would need a list of allowed hosts first.
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatNaira } from "@/lib/format";
import { useCart } from "@/context/CartContext";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedId, setAddedId] = useState(null);
  const { addToCart } = useCart();

  // Adds the product to the cart and shows a short "Added ✓" confirmation.
  const handleAddToCart = (product) => {
    addToCart(product);
    setAddedId(product.id);
    window.setTimeout(() => {
      setAddedId((current) => (current === product.id ? null : current));
    }, 1500);
  };

  const loadProducts = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });

    if (queryError) {
      setProducts([]);
      setError(queryError.message);
    } else {
      setProducts(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // The fetch runs async (everything after `await` happens later, not
    // in the effect body), and loading once on mount is exactly what
    // this effect is for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, [loadProducts]);

  // Called by the "Try again" button: show the spinner, clear the old
  // error, then fetch again. Setting state in an event handler is fine.
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    loadProducts();
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-rose-600 sm:text-4xl">
          Simi Stitches
        </h1>
        <p className="mt-2 text-gray-600">
          Nigerian clothing materials for women — by the yard, per 6 yards, or
          per set.
        </p>
      </header>

      {loading && (
        <div className="flex flex-col items-center gap-4 py-16" role="status">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-600" />
          <p className="text-gray-600">Loading products…</p>
        </div>
      )}

      {!loading && error && (
        <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="font-semibold text-red-700">
            Could not load products
          </h2>
          <p className="mt-2 break-words text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 rounded-full bg-red-600 px-6 py-2 font-medium text-white transition hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="py-16 text-center text-gray-600">
          No products yet — please check back soon.
        </p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="group overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-amber-700">
                    Simi Stitches
                  </div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                  {product.category}
                </span>
                <h2 className="text-lg font-semibold text-gray-900">
                  {product.name}
                </h2>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xl font-bold text-rose-600">
                    {formatNaira(product.price)}
                  </p>
                  <p className="text-sm text-gray-500">{product.unit}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  className="w-full rounded-full bg-rose-600 px-4 py-2 font-medium text-white transition hover:bg-rose-700 active:scale-[0.98]"
                >
                  {addedId === product.id ? "Added ✓" : "Add to cart"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
