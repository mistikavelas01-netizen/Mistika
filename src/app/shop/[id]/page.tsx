import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/cart/AddToCartButton";    

type Props = { params: { id: string } };

export default async function ProductPage({ params }: Props) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const producto = await prisma.productos.findUnique({
    where: { id },
  });

  if (!producto) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <a href="/shop" className="text-sm text-neutral-600 hover:underline">
        ← Volver
      </a>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-3xl bg-neutral-100">
          <div
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${producto.imagen ?? "/images/placeholder.jpg"})`,
            }}
          />
        </div>

        <div>
          <h1 className="text-3xl font-semibold">{producto.nombre}</h1>

          {producto.descripcion ? (
            <p className="mt-2 text-neutral-600">{producto.descripcion}</p>
          ) : (
            <p className="mt-2 text-neutral-600">Sin descripción por el momento.</p>
          )}

          <p className="mt-6 text-2xl font-medium">
            ${producto.precio?.toString() ?? "—"} MXN
          </p>

          <AddToCartButton
            id={producto.id}
            name={producto.nombre}
            price={producto.precio?.toString() ?? 0}
            image={producto.imagen ?? null}
          />
        </div>
      </div>
    </main>
  );
}
