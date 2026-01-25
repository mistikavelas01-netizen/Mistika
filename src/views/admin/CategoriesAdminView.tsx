"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  ArrowLeft,
  AlertTriangle,
  Check,
  Layers,
  Package,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  useFetchCategoriesQuery,
  useDeleteCategoryMutation,
} from "@/store/features/categories/categoriesApi";
import { ServerError } from "@/components/ui/ServerError";
import toast from "react-hot-toast";

export function CategoriesAdminView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const {
    data: categoriesData,
    isLoading,
    isError,
    refetch,
  } = useFetchCategoriesQuery(undefined, { skip: false });

  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const categories = categoriesData?.data ?? [];

  const filteredCategories = categories.filter(
    (category: Category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c: Category) => c.isActive).length;
  const inactiveCategories = totalCategories - activeCategories;

  const handleDelete = async () => {
    if (!showDeleteModal) return;

    try {
      await deleteCategory(showDeleteModal.id).unwrap();
      toast.success(`Categoría "${showDeleteModal.name}" eliminada`);
      setShowDeleteModal(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.error || "Error al eliminar la categoría");
    }
  };

  const stats = [
    {
      label: "Total",
      value: totalCategories,
      icon: Layers,
      color: "bg-black/5 text-black/70",
    },
    {
      label: "Activas",
      value: activeCategories,
      icon: Check,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Inactivas",
      value: inactiveCategories,
      icon: EyeOff,
      color: "bg-gray-100 text-gray-500",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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
                Categorías
              </h1>
              <p className="mt-1 text-black/60">
                Organiza tus productos en categorías
              </p>
            </div>
            <Link
              href="/admin/categories/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus size={18} />
              Nueva categoría
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid grid-cols-3 gap-4"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.color}`}
              >
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-black/50">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40"
            />
            <input
              type="text"
              placeholder="Buscar categorías..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white py-3 pl-11 pr-10 transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-black/40 transition hover:bg-black/5 hover:text-black/70"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-black/10 border-t-black" />
              <p className="text-black/60">Cargando categorías...</p>
            </div>
          </div>
        ) : isError ? (
          <ServerError
            title="Error de conexión"
            message="No pudimos cargar las categorías. Por favor, verifica tu conexión o intenta más tarde."
            onRetry={refetch}
            showHomeButton={false}
          />
        ) : filteredCategories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-black/10 bg-white p-12 text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
              <Tag size={32} className="text-black/30" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">
              {searchQuery ? "Sin resultados" : "No hay categorías"}
            </h2>
            <p className="mb-6 text-black/60">
              {searchQuery
                ? "Intenta con otros términos de búsqueda"
                : "Crea tu primera categoría para organizar tus productos"}
            </p>
            {!searchQuery && (
              <Link
                href="/admin/categories/new"
                className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Plus size={18} />
                Crear categoría
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="overflow-hidden rounded-2xl border border-black/10 bg-white"
          >
            {/* Table Header */}
            <div className="hidden border-b border-black/10 bg-black/5 px-6 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
              <div className="col-span-5 text-xs font-semibold uppercase tracking-wider text-black/50">
                Categoría
              </div>
              <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-black/50">
                Slug
              </div>
              <div className="col-span-2 text-center text-xs font-semibold uppercase tracking-wider text-black/50">
                Estado
              </div>
              <div className="col-span-2 text-right text-xs font-semibold uppercase tracking-wider text-black/50">
                Acciones
              </div>
            </div>

            {/* Category List */}
            <div className="divide-y divide-black/5">
              {filteredCategories.map((category: Category, index: number) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group px-4 py-4 transition hover:bg-black/[0.02] sm:grid sm:grid-cols-12 sm:items-center sm:gap-4 sm:px-6"
                >
                  {/* Category Info */}
                  <div className="col-span-5 mb-3 flex items-center gap-3 sm:mb-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-black/5">
                      <Tag size={18} className="text-black/60" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{category.name}</h3>
                      {category.description && (
                        <p className="truncate text-sm text-black/50">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Slug */}
                  <div className="col-span-3 mb-3 sm:mb-0">
                    <code className="rounded bg-black/5 px-2 py-1 text-xs text-black/60">
                      {category.slug}
                    </code>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 mb-3 flex justify-start sm:mb-0 sm:justify-center">
                    {category.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        Inactiva
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/categories/${category.id}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-black/60 transition hover:bg-black hover:text-white"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() =>
                        setShowDeleteModal({
                          id: category.id,
                          name: category.name,
                        })
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-500 hover:text-white"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Results count */}
        {!isLoading && !isError && filteredCategories.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-center text-sm text-black/50"
          >
            {filteredCategories.length} de {totalCategories} categoría
            {totalCategories !== 1 ? "s" : ""}
          </motion.p>
        )}

        {/* Delete Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowDeleteModal(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4"
              >
                <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                  <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                      <AlertTriangle size={28} className="text-red-500" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">
                      Eliminar categoría
                    </h3>
                    <p className="text-sm text-black/60">
                      ¿Eliminar{" "}
                      <span className="font-semibold">
                        "{showDeleteModal.name}"
                      </span>
                      ? Esta acción no se puede deshacer.
                    </p>
                  </div>
                  <div className="flex border-t border-black/10">
                    <button
                      onClick={() => setShowDeleteModal(null)}
                      className="flex-1 border-r border-black/10 py-3 font-medium text-black/70 transition hover:bg-black/5"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {isDeleting ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
