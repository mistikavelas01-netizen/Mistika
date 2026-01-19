import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AddToCartIconButton } from "@/components/cart/AddToCartIconButton";
import ProductCarousel from "@/components/shop/ProductCarousel";

export default async function ShopPage() {
  const productos = await prisma.productos.findMany({
    orderBy: { id: "desc" },
  });
  const carouselImages = productos
    .filter((p) => p.imagen)
    .slice(0, 10)
    .map((p) => ({ src: p.imagen as string, alt: p.nombre }));

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10">
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
        <ProductCarousel />
      </div>

      <div className="relative mb-10">
        <div className="absolute right-0 top-0">
          <br></br>
          <Link
            href="/cart"
            className="rounded-full bg-black px-7 py-3 text-base font-medium text-white hover:opacity-90"
          >
            Ver carrito
          </Link>
        </div>
        <div className="text-center">
          <br></br>
          <br></br>
          <h1 className="text-4xl font-semibold tracking-[0.25em]">MISTIKA</h1>

          <h3 className="mx-auto mt-3 max-w-xl text-sm text-neutral-900">
            Aromas que abrazan tu espacio: velas y rituales que convierten lo
            cotidiano en magia.
          </h3>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {productos.map((p) => (
          <Link
            key={p.id}
            href={`/shop/${p.id}`}
            className="group overflow-hidden rounded-2xl border hover:bg-neutral-50"
          >
            <div className="relative aspect-square w-full bg-neutral-100">
              <div
                className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]"
                style={{
                  backgroundImage: `url(${p.imagen ?? "/images/products/placeholder.jpg"})`,
                }}
              />

              <div className="absolute right-3 top-3">
                <AddToCartIconButton
                  id={p.id}
                  name={p.nombre}
                  price={p.precio?.toString() ?? 0}
                  image={p.imagen ?? null}
                />
              </div>
            </div>

            <div className="p-4">
              <h2 className="text-lg font-medium">{p.nombre}</h2>
              <p className="mt-1 text-neutral-600">
                ${p.precio?.toString() ?? "—"} MXN
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
