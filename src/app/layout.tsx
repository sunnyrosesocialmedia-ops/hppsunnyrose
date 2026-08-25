import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";

export const metadata: Metadata = {
  title: "Sunny Rose Photo Store",
  description: "Galeri foto — lihat gratis, download bayar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
