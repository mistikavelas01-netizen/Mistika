import type { Metadata } from "next";
import { CartPage } from "@/views/CartPage";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisa tu carrito de compras.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <CartPage />;
}
