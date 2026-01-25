"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Minus, Package, Plus, ShoppingBag, Sparkles, Trash2 } from "lucide-react";
import { useFetchProductQuery } from "@/store/features/products/productsApi";
import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { useCart } from "@/context/cart-context";
import { ServerError } from "@/components/ui/ServerError";



const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function ProductPage() {
  const params = useParams();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam ?? "";

  const { data: productData, isLoading: isLoadingProduct, isError: isErrorProduct, refetch } = useFetchProductQuery(id, { skip: !id });
  const product = productData?.data;
  const categoryName =
    typeof product?.category === "string"
      ? product.category
      : product?.category?.name ?? "—";

  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();

  // Find if product is in cart
  const cartItem = useMemo(() => {
    if (!product) return null;
    return cart.find(
      (item) =>
        (item.id != null && product.id != null && item.id === product.id) ||
        item.name === product.name
    ) || null;
  }, [cart, product]);

  const currentQuantity = cartItem?.quantity || 0;
  const isInCart = currentQuantity > 0;

  useEffect(() => {
    if (isErrorProduct) {
      toast.error("Error al cargar el producto");
    }
  }, [isErrorProduct]);

  const handleQuantityChange = (newQuantity: number) => {
    if (!product) return;

    if (newQuantity <= 0) {
      removeFromCart(product.name);
      toast.success(`${product.name} eliminado del carrito`);
    } else {
      updateQuantity(product.name, newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price?.toString() ?? "0",
      imageUrl: product.imageUrl ?? null,
    });
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleRemoveFromCart = () => {
    if (!product) return;
    removeFromCart(product.name);
    toast.success(`${product.name} eliminado del carrito`);
  };

  if (!id) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-neutral-600">Producto inválido.</p>
      </main>
    );
  }

  if (isLoadingProduct) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center py-20">
          <p className="text-neutral-600">Cargando producto...</p>
        </div>
      </main>
    );
  }

  if (isErrorProduct) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
        <ServerError
          title="Error de conexión"
          message="No pudimos cargar el producto. Por favor, verifica tu conexión o intenta más tarde."
          onRetry={refetch}
        />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center py-20">
          <p className="text-neutral-600">Producto no encontrado.</p>
        </div>
      </main>
    );
  }

  const stock = Number(product.stock ?? 0);
  const isInactive = !product.isActive;
  const isAvailable = !isInactive && stock > 0;

  const stockColor = isInactive
    ? "text-black/30"
    : isAvailable
      ? "text-black/70"
      : "text-black/50";

  return (
    <main className="min-h-screen bg-white">
      <motion.div
        className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header with back button */}
        <motion.div variants={itemVariants} className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-black"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            <span className="uppercase tracking-[0.2em]">Volver</span>
          </Link>
        </motion.div>

        {/* Main content grid */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Image section */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-[32px] border border-black/10 bg-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={product.imageUrl ?? "/images/products/placeholder.jpg"}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className={`scale-105 object-cover ${!isAvailable ? "grayscale opacity-60" : ""
                  }`}
              />
            </div>
          </motion.div>

          {/* Product info section */}
          <motion.div variants={itemVariants} className="flex flex-col">
            {/* Category badge */}
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-black/70 backdrop-blur-sm">
                <Sparkles size={12} aria-hidden="true" />
                {categoryName}
              </span>
            </div>

            {/* Product name */}
            <h1 className="mb-4 text-4xl font-semibold tracking-[0.05em] sm:text-5xl lg:text-6xl">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mb-6 flex flex-col gap-2">
              {product.isOnSale && product.discountPrice && product.price ? (
                <div className="flex items-baseline gap-3">
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-semibold tracking-[0.05em] text-red-600 sm:text-4xl">
                      ${product.discountPrice.toString()}
                    </p>
                    <span className="text-sm uppercase tracking-[0.3em] text-black/50">
                      MXN
                    </span>
                  </div>
                  <span className="text-lg text-black/50 line-through">
                    ${product.price.toString()}
                  </span>
                  <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-700">
                    En oferta
                  </span>
                </div>
              ) : (
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-semibold tracking-[0.05em] sm:text-4xl">
                    ${product.price?.toString() ?? "—"}
                  </p>
                  <span className="text-sm uppercase tracking-[0.3em] text-black/50">
                    MXN
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-8 rounded-[24px] border border-black/10 bg-black/5 p-6">
              {product.description ? (
                <p className="leading-relaxed text-black/70">
                  {product.description}
                </p>
              ) : (
                <p className="text-black/50 italic">
                  Sin descripción por el momento.
                </p>
              )}
            </div>

            {/* Add to cart button or quantity controls */}
            <div className="mt-auto space-y-4">
              {isInCart ? (
                <>
                  <div className="rounded-[24px] border border-black/10 bg-black/5 p-6">
                    <div className="mb-4 text-center">
                      <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                        Cantidad en carrito
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(currentQuantity - 1)}
                        aria-label="Disminuir cantidad"
                        className="grid h-12 w-12 place-items-center rounded-full border border-black/10 bg-white text-black transition hover:scale-105 hover:bg-black/5"
                      >
                        <Minus size={20} aria-hidden="true" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={currentQuantity}
                        onChange={(e) =>
                          handleQuantityChange(Number(e.target.value) || 0)
                        }
                        className="w-20 bg-transparent text-center text-2xl font-semibold text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(currentQuantity + 1)}
                        aria-label="Aumentar cantidad"
                        className="grid h-12 w-12 place-items-center rounded-full border border-black/10 bg-white text-black transition hover:scale-105 hover:bg-black/5"
                      >
                        <Plus size={20} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href="/cart"
                      className="flex flex-1 items-center justify-center gap-2 rounded-[24px] border border-black/10 bg-white px-6 py-4 text-sm font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-black/5"
                    >
                      <ShoppingBag size={18} aria-hidden="true" />
                      Ver carrito
                    </Link>
                    <button
                      type="button"
                      onClick={handleRemoveFromCart}
                      aria-label="Quitar del carrito"
                      className="flex items-center justify-center gap-2 rounded-[24px] border border-black/10 bg-white px-6 py-4 text-sm font-semibold uppercase tracking-[0.25em] text-black/60 transition hover:bg-black/5"
                    >
                      <Trash2 size={18} aria-hidden="true" />
                      Quitar
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full rounded-[24px] bg-black px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Agregar al carrito
                </button>
              )}
            </div>

            {/* Additional info */}
            <div className="mt-8 space-y-3 border-t border-black/10 pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-black/50 uppercase tracking-[0.2em]">
                  Categoría
                </span>
                <span className="font-medium text-black/70">
                  {categoryName}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-black/50 uppercase tracking-[0.2em]">
                  Estado
                </span>
                <span className={`font-medium ${stockColor}`}>
                  {product.isActive ? "Disponible" : "No disponible"}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}
