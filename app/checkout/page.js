"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatNaira } from "@/lib/format";
import {
  isValidNigerianPhone,
  NIGERIAN_PHONE_ERROR,
} from "@/lib/validatePhone";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INPUT_CLASS =
  "w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, hydrated, clearCart } = useCart();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const subtotal = items.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );

  // Empty cart -> back to /cart, but only AFTER the saved cart has loaded
  // (otherwise localStorage would look empty on the very first render).
  useEffect(() => {
    if (hydrated && items.length === 0) {
      router.replace("/cart");
    }
  }, [hydrated, items.length, router]);

  // If the shopper is signed in, fill in their name and email. They can
  // still edit both. Guests simply see the blank form as before.
  useEffect(() => {
    let active = true;

    getSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data }) => {
        const user = data?.user;
        if (!active || !user) return;
        const metadata = user.user_metadata || {};
        const name = metadata.full_name || metadata.name || "";
        setForm((current) => ({
          ...current,
          fullName: current.fullName || name,
          email: current.email || user.email || "",
        }));
      })
      .catch(() => {
        // Ignore — the shopper can still type their details.
      });

    return () => {
      active = false;
    };
  }, []);

  const setField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = "Enter your full name.";
    if (!form.email.trim()) next.email = "Enter your email address.";
    else if (!EMAIL_RE.test(form.email.trim()))
      next.email = "That email address looks wrong.";
    if (!form.phone.trim()) next.phone = "Enter your phone number.";
    else if (!isValidNigerianPhone(form.phone.trim()))
      next.phone = NIGERIAN_PHONE_ERROR;
    if (!form.address.trim()) next.address = "Enter your delivery address.";
    if (!form.city.trim()) next.city = "Enter your city.";
    if (!form.state.trim()) next.state = "Enter your state.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
          },
          // Product id and quantity ONLY — prices are checked on the server.
          items: items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setServerError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      clearCart();
      router.push(`/order-confirmation/${data.orderId}`);
    } catch {
      setSubmitting(false);
      setServerError("Network error — check your connection and try again.");
    }
  };

  // While the saved cart loads (or if it is empty) show only a spinner;
  // the effect above will redirect an empty cart to /cart.
  if (!hydrated || items.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center" role="status">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-600" />
        <p className="mt-4 text-gray-600">Loading your cart…</p>
      </main>
    );
  }
  const field = (name, label, type, placeholder) => (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={form[name]}
        onChange={setField(name)}
        placeholder={placeholder}
        aria-invalid={errors[name] ? "true" : undefined}
        className={INPUT_CLASS}
      />
      {errors[name] && (
        <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-rose-600 sm:text-3xl">
        Checkout
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* ----------------------- FORM ----------------------- */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {serverError && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {serverError}
            </div>
          )}

          <div className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5 sm:p-6">
            <h2 className="mb-4 font-semibold text-gray-900">
              Delivery details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("fullName", "Full name", "text", "Chinedu Okafor")}
              {field("email", "Email", "email", "you@example.com")}
              {field("phone", "Phone number", "tel", "0803 000 0000")}
              <div className="sm:col-span-2">
                {field("address", "Delivery address", "text", "12 Awolowo Road")}
              </div>
              {field("city", "City", "text", "Lagos")}
              {field("state", "State", "text", "Lagos")}
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 px-6 py-3 font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {submitting ? "Placing order…" : "Place order"}
          </button>
          <p className="text-center text-xs text-gray-400">
            No payment needed yet — your order is saved and confirmed next.
          </p>
        </form>

        {/* --------------------- SUMMARY --------------------- */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5 sm:p-6">
            <h2 className="mb-4 font-semibold text-gray-900">
              Order summary
            </h2>
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-gray-900">
                      {item.name}
                    </span>
                    <span className="text-gray-500">
                      {item.quantity} × {formatNaira(item.price)} · {item.unit}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold text-gray-900">
                    {formatNaira(Number(item.price) * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-rose-100 pt-4">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-xl font-bold text-rose-600">
                {formatNaira(subtotal)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
