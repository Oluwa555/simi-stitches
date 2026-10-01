/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatNaira } from "@/lib/format";

export default function CartPage() {
  const { items, count, increase, decrease, removeFromCart } = useCart();

  const subtotal = items.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-rose-600">
          Your cart is empty
        </h1>
        <p className="mt-2 text-gray-600">
          Add some beautiful fabric to get started.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-rose-600 px-6 py-3 font-medium text-white transition hover:bg-rose-700"
        >
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-rose-600 sm:text-3xl">
        Your cart{" "}
        <span className="text-base font-medium text-gray-500">
          ({count} {count === 1 ? "item" : "items"})
        </span>
      </h1>

      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5 sm:flex-row sm:items-center"
          >
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-amber-100 to-rose-100">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-gray-900">
                {item.name}
              </p>
              <p className="text-sm text-gray-500">{item.unit}</p>
              <p className="text-sm text-gray-500">
                {formatNaira(item.price)} each
              </p>
              <button
                type="button"
                onClick={() => removeFromCart(item.id)}
                className="mt-1 text-sm font-medium text-red-500 underline-offset-2 transition hover:text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="flex items-center rounded-full border border-rose-200">
                <button
                  type="button"
                  onClick={() => decrease(item.id)}
                  disabled={item.quantity <= 1}
                  aria-label={`Decrease quantity of ${item.name}`}
                  className="h-9 w-9 rounded-full text-lg font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-gray-300"
                >
                  −
                </button>
                <span className="w-8 text-center font-semibold">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => increase(item.id)}
                  aria-label={`Increase quantity of ${item.name}`}
                  className="h-9 w-9 rounded-full text-lg font-bold text-rose-600 transition hover:bg-rose-50"
                >
                  +
                </button>
              </div>

              <p className="w-24 text-right font-bold text-rose-600">
                {formatNaira(Number(item.price) * item.quantity)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-2xl font-bold text-rose-600">
            {formatNaira(subtotal)}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Shipping and payment are handled at checkout.
        </p>
        <Link
          href="/checkout"
          className="mt-4 block rounded-full bg-rose-600 px-6 py-3 text-center font-medium text-white transition hover:bg-rose-700"
        >
          Proceed to checkout
        </Link>
        <Link
          href="/"
          className="mt-3 block text-center text-sm font-medium text-rose-600 hover:underline"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
