// Order confirmation — fetched on the SERVER with the service-role
// client, so it works even if table policies hide rows from the public.
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { formatNaira } from "@/lib/format";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = {
  title: "Order confirmed — Simi Stitches",
};

export default async function OrderConfirmationPage({ params }) {
  const { id } = await params;

  if (typeof id !== "string" || !UUID_RE.test(id)) {
    notFound();
  }

  let order = null;
  let items = [];
  let loadError = null;

  try {
    const supabase = getSupabaseAdmin();

    const { data: orderRow, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, status, total, created_at, customer_name, customer_email, " +
          "customer_phone, shipping_address, city, state"
      )
      .eq("id", id)
      .maybeSingle();

    if (orderError) {
      console.error("confirmation: order lookup failed:", orderError.message);
      loadError = "Could not load your order.";
    } else if (!orderRow) {
      notFound();
    } else {
      order = orderRow;
    }

    if (order) {
      const { data: itemRows, error: itemsError } = await supabase
        .from("order_items")
        .select("id, product_id, quantity, unit_price")
        .eq("order_id", id);

      if (itemsError) {
        console.error("confirmation: items lookup failed:", itemsError.message);
        loadError = "Could not load your order items.";
      } else {
        items = itemRows || [];
      }
    }

    if (order && items.length > 0) {
      const productIds = items.map((item) => item.product_id);
      const { data: products } = await supabase
        .from("products")
        .select("id, name, image_url, unit")
        .in("id", productIds);

      const productById = new Map(
        (products || []).map((product) => [product.id, product])
      );
      items = items.map((item) => ({
        ...item,
        product: productById.get(item.product_id) || null,
      }));
    }
  } catch {
    // Thrown by getSupabaseAdmin() when the server env vars are missing.
    loadError =
      "The order service is not configured yet (server keys missing).";
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"
        >
          {loadError}
        </div>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-rose-600 px-6 py-3 font-medium text-white transition hover:bg-rose-700"
        >
          Back to shop
        </Link>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/5 sm:p-8">
        <div className="text-center">
          {/* Green check drawn as inline SVG — no icon library needed. */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto h-14 w-14 text-green-600"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m8 12 3 3 5-6" />
          </svg>
          <h1 className="mt-4 text-2xl font-bold text-rose-600 sm:text-3xl">
            Thank you{order ? `, ${order.customer_name}` : ""}!
          </h1>
          <p className="mt-2 text-gray-600">
            Your order has been received and saved. We&apos;ll be in touch.
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Order ID: <span className="font-mono">{order ? order.id : ""}</span>
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-rose-50 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-gray-700">Status</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
              {order ? order.status : ""}
            </span>
          </div>
          {order && (
            <>
              <p className="mt-2 text-gray-600">
                {order.shipping_address}, {order.city}, {order.state}
              </p>
              <p className="text-gray-600">
                {order.customer_phone} · {order.customer_email}
              </p>
              <p className="text-gray-500">
                Placed{" "}
                {new Date(order.created_at).toLocaleString("en-NG", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </>
          )}
        </div>

        <ul className="mt-6 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium text-gray-900">
                  {item.product ? item.product.name : "Product"}
                </span>
                <span className="text-gray-500">
                  {item.quantity} × {formatNaira(item.unit_price)}
                  {item.product ? ` · ${item.product.unit}` : ""}
                </span>
              </span>
              <span className="shrink-0 font-semibold text-gray-900">
                {formatNaira(Number(item.unit_price) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-rose-100 pt-4">
          <span className="text-gray-600">Total</span>
          <span className="text-xl font-bold text-rose-600">
            {formatNaira(order ? Number(order.total) : 0)}
          </span>
        </div>

        <Link
          href="/"
          className="mt-6 block rounded-full bg-rose-600 px-6 py-3 text-center font-medium text-white transition hover:bg-rose-700"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
