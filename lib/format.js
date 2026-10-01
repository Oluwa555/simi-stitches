// Formats a number as Nigerian Naira, e.g. 15000 -> ₦15,000 (no kobo).
// Shared by the home page and the cart page so money always looks the same.
export function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
