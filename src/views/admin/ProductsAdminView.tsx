"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit,
  Plus,
  Trash2,
  Package,
  Search,
  ArrowLeft,
  AlertTriangle,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Tag,
  DollarSign,
} from "lucide-react";
import {
  useFetchProductsQuery,
  useDeleteProductMutation,
} from "@/store/features/products/productsApi";
import { ServerError } from "@/components/ui/ServerError";
import toast from "react-hot-toast";

export function ProductsAdminView() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const limit = 12;

  const { data: productsData, isLoading, isError, refetch } = useFetchProductsQuery(
    { page, limit },
    { skip: false }
  );

  const products = productsData?.data ?? [];
  const pagination = productsData?.pagination;

  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  // Stats
  const totalProducts = products.length;
  const activeProducts = products.filter((p: Product) => p.isActive).length;
  const onSaleProducts = products.filter((p: Product) => p.isOnSale).length;
  const lowStockProducts = products.filter((p: Product) => p.stock <= 5).length;

  const filteredProducts = products.filter((product: Product) => {
    const categoryName =
      typeof product.category === "object"
        ? product.category?.name
        : product.category || "";
    return (
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleDelete = async () => {
    if (!showDeleteModal) return;

    try {
      await deleteProduct(showDeleteModal.id).unwrap();
      toast.success(`"${showDeleteModal.name}" eliminado correctamente`);
      setShowDeleteModal(null);
    } catch (err) {
      toast.error("Error al eliminar el producto");
    }
  };

  const formatPrice = (price: number | null | string) => {
    if (price === null || price === undefined) return "—";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "—";
    return `$${numPrice.toFixed(2)}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-black"
          >
            <ArrowLeft size={18} />
            <span className="uppercase tracking-[0.2em]">Dashboard</span>
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-[0.05em] sm:text-4xl">
                Productos
              </h1>
              <p className="mt-1 text-sm text-black/60">
                {pagination?.total ?? 0} productos en total
              </p>
            </div>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus size={18} />
              Nuevo producto
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5">
                <Package size={20} className="text-black/70" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pagination?.total ?? "..."}</p>
                <p className="text-xs text-black/50">Total</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <TrendingUp size={20} className="text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">{activeProducts}</p>
                <p className="text-xs text-green-700">Activos</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <DollarSign size={20} className="text-red-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-900">{onSaleProducts}</p>
                <p className="text-xs text-red-700">En oferta</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <AlertTriangle size={20} className="text-amber-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-900">{lowStockProducts}</p>
                <p className="text-xs text-amber-700">Stock bajo</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40"
            />
            <input
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-12 py-3 text-black placeholder:text-black/40 transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Products List */}
        {isLoading ? (
          <div className="rounded-2xl border border-black/10 bg-white p-16 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-black/10 border-t-black" />
            <p className="text-black/60">Cargando productos...</p>
          </div>
        ) : isError ? (
          <ServerError
            title="Error de conexión"
            message="No pudimos cargar los productos. Por favor, verifica tu conexión o intenta más tarde."
            onRetry={refetch}
            showHomeButton={false}
          />
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
              <Package size={32} className="text-black/30" />
            </div>
            <h2 className="mb-2 text-lg font-semibold">No hay productos</h2>
            <p className="mb-6 text-sm text-black/60">
              {searchQuery
                ? "No se encontraron productos con ese criterio"
                : "Comienza agregando tu primer producto"}
            </p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black/80"
            >
              <Plus size={18} />
              Agregar producto
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Table View */}
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
              {/* Table Header */}
              <div className="hidden border-b border-black/10 bg-black/5 px-6 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
                <div className="col-span-5 text-xs font-semibold uppercase tracking-wider text-black/50">
                  Producto
                </div>
                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-black/50">
                  Precio
                </div>
                <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-black/50">
                  Stock
                </div>
                <div className="col-span-1 text-xs font-semibold uppercase tracking-wider text-black/50">
                  Estado
                </div>
                <div className="col-span-2 text-right text-xs font-semibold uppercase tracking-wider text-black/50">
                  Acciones
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-black/5">
                <AnimatePresence>
                  {filteredProducts.map((product: Product, index: number) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.03 }}
                      className="group grid grid-cols-1 gap-4 px-4 py-4 transition hover:bg-black/5 sm:grid-cols-12 sm:items-center sm:px-6"
                    >
                      {/* Product Info */}
                      <div className="col-span-5 flex items-center gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-black/5">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package size={24} className="text-black/30" />
                            </div>
                          )}
                          {product.isOnSale && (
                            <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-red-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold">{product.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs text-black/50">
                              <Tag size={12} />
                              {typeof product.category === "object"
                                ? product.category?.name
                                : product.category || "Sin categoría"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2 sm:block">
                          <span className="text-xs text-black/50 sm:hidden">Precio:</span>
                          {product.isOnSale && product.discountPrice ? (
                            <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
                              <span className="font-semibold text-red-600">
                                {formatPrice(product.discountPrice)}
                              </span>
                              <span className="text-xs text-black/40 line-through">
                                {formatPrice(product.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-semibold">{formatPrice(product.price)}</span>
                          )}
                        </div>
                      </div>

                      {/* Stock */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2 sm:block">
                          <span className="text-xs text-black/50 sm:hidden">Stock:</span>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              product.stock <= 0
                                ? "bg-red-100 text-red-700"
                                : product.stock <= 5
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-green-100 text-green-700"
                            }`}
                          >
                            {product.stock} unidades
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-1">
                        <div className="flex items-center gap-2 sm:block">
                          <span className="text-xs text-black/50 sm:hidden">Estado:</span>
                          <span
                            className={`inline-flex h-2.5 w-2.5 rounded-full ${
                              product.isActive ? "bg-green-500" : "bg-gray-300"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <Link
                          href={`/${product.id}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-black/50 transition hover:bg-black/5 hover:text-black"
                          title="Ver producto"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-black/50 transition hover:bg-black hover:text-white"
                          title="Editar producto"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() =>
                            setShowDeleteModal({ id: product.id, name: product.name })
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-500 hover:text-white"
                          title="Eliminar producto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <p className="text-sm text-black/60">
                  Mostrando {(page - 1) * limit + 1} -{" "}
                  {Math.min(page * limit, pagination.total)} de {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.hasPreviousPage || isLoading}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="px-3 text-sm font-medium">
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNextPage || isLoading}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Delete Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowDeleteModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Eliminar producto</h3>
                <p className="mb-6 text-sm text-black/60">
                  ¿Estás seguro de que deseas eliminar{" "}
                  <span className="font-semibold text-black">"{showDeleteModal.name}"</span>?
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    disabled={isDeleting}
                    className="flex-1 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
