import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import AuthMessage from "@/components/AuthMessage";

export const metadata = {
  title: "Simi Stitches — Nigerian Fabrics for Women",
  description:
    "Shop colorful Nigerian clothing materials: buy fabric by the yard, per 6 yards, or per set.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-rose-50 text-gray-900 antialiased">
        <CartProvider>
          <Header />
          <AuthMessage />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
