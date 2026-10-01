// POST /api/orders — saves an order server-side.
// The browser never sends prices: we re-fetch them from the products
// table and calculate the total here, on the server.
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import {
  isValidNigerianPhone,
  NIGERIAN_PHONE_ERROR,
} from "@/lib/validatePhone";
import { getCurrentUser } from "@/lib/supabaseServerAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonError(status, message) {
  return Response.json({ error: message }, { status });
}

export async function POST(request) {
  // ---- 0. Read the request body ----
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const customer = body && typeof body === "object" ? body.customer : null;
  const items = body && Array.isArray(body.items) ? body.items : null;

  // ---- 1. Validate the customer fields (never trust the browser) ----
  if (!customer || typeof customer !== "object") {
    return jsonError(400, "Customer details are missing.");
  }

  const name =
    typeof customer.fullName === "string" ? customer.fullName.trim() : "";
  const email = typeof customer.email === "string" ? customer.email.trim() : "";
  const phone = typeof customer.phone === "string" ? customer.phone.trim() : "";
  const address =
    typeof customer.address === "string" ? customer.address.trim() : "";
  const city = typeof customer.city === "string" ? customer.city.trim() : "";
  const state = typeof customer.state === "string" ? customer.state.trim() : "";

  if (!name || !email || !phone || !address || !city || !state) {
    return jsonError(400, "All fields are required.");
  }
  if (!EMAIL_RE.test(email)) {
    return jsonError(400, "Please provide a valid email address.");
  }
  if (!isValidNigerianPhone(phone)) {
    return jsonError(400, NIGERIAN_PHONE_ERROR);
  }

  // ---- 2. Validate the items — product id and quantity only ----
  if (!items || items.length === 0) {
    return jsonError(400, "Your cart is empty.");
  }

  const cleaned = [];
  for (const item of items) {
    const productId = item && item.product_id;
    const quantity = item && item.quantity;
    if (typeof productId !== "string" || !UUID_RE.test(productId)) {
      return jsonError(400, "A cart item has an invalid product id.");
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
      return jsonError(400, "A cart item has an invalid quantity.");
    }
    cleaned.push({ product_id: productId, quantity });
  }

  // ---- 3. Fetch the REAL prices from the products table ----
  const supabase = getSupabaseAdmin();
  const ids = cleaned.map((item) => item.product_id);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, price")
    .in("id", ids);

  if (productsError) {
    console.error("orders: products lookup failed:", productsError.message);
    return jsonError(500, "Could not check product prices. Please try again.");
  }

  const priceById = new Map(
    (products || []).map((product) => [product.id, Number(product.price)])
  );
  for (const item of cleaned) {
    if (!priceById.has(item.product_id)) {
      return jsonError(
        400,
        "One of the products in your cart no longer exists."
      );
    }
  }

  // The total is calculated HERE — the browser's subtotal is never trusted.
  const total = cleaned.reduce(
    (sum, item) => sum + priceById.get(item.product_id) * item.quantity,
    0
  );

  // ---- 4. Read the signed-in user from the server session ----
  // This reads the login cookie (public anon key), never a user id sent by
  // the browser and never the service-role key. Guests get null.
  const user = await getCurrentUser();
  const userId = user ? user.id : null;

  // ---- 5. Insert one orders row (status "pending") ----
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      shipping_address: address,
      city,
      state,
      total,
      status: "pending",
      user_id: userId,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("orders: insert failed:", orderError && orderError.message);
    return jsonError(500, "Could not save your order. Please try again.");
  }

  // ---- 6. Insert the order_items rows; on failure remove the order ----
  const rows = cleaned.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: priceById.get(item.product_id),
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(rows);

  if (itemsError) {
    console.error("orders: items insert failed:", itemsError.message);
    // Compensating delete so no half-saved order remains.
    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", order.id);
    if (deleteError) {
      console.error("orders: cleanup delete failed:", deleteError.message);
    }
    return jsonError(500, "Could not save your order items. Please try again.");
  }

  // ---- 7. Done — return the new order id ----
  return Response.json({ orderId: order.id }, { status: 201 });
}
