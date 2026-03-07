"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Image as ImageIcon,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { CloudinaryUploadWidget } from "@/components/widget/Cloudinary";
import { ServerError } from "@/components/ui/ServerError";
import { getApiErrorMessage } from "@/store/features/api/getApiErrorMessage";
import {
  useCreateCarouselItemMutation,
  useDeleteCarouselItemMutation,
  useFetchCarouselItemsQuery,
  useUpdateCarouselItemMutation,
} from "@/store/features/carousel/carouselApi";
import toast from "react-hot-toast";

export function CarouselAdminView() {
  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
    isActive: true,
  });
  const [showDeleteModal, setShowDeleteModal] = useState<{
    id: string;
    name?: string | null;
  } | null>(null);

  const {
    data: carouselData,
    isLoading,
    isError,
    refetch,
  } = useFetchCarouselItemsQuery(false, { skip: false });

  const [createCarouselItem, { isLoading: isCreating }] = useCreateCarouselItemMutation();
  const [updateCarouselItem, { isLoading: isUpdating }] = useUpdateCarouselItemMutation();
  const [deleteCarouselItem, { isLoading: isDeleting }] = useDeleteCarouselItemMutation();

  const items = carouselData?.data ?? [];
  const orderedItems = useMemo(() => {
    return [...items].sort(
      (a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0)
    );
  }, [items]);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((item) => item.isActive).length;
    const inactive = total - active;
    return [
      { label: "Total", value: total, icon: Layers, color: "bg-black/5 text-black/70" },
      { label: "Activas", value: active, icon: Check, color: "bg-green-50 text-green-600" },
      { label: "Inactivas", value: inactive, icon: EyeOff, color: "bg-gray-100 text-gray-500" },
    ];
  }, [items]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const imageUrl = formData.imageUrl.trim();
    if (!imageUrl) {
      toast.error("Sube una imagen para el carrusel");
      return;
    }

    try {
      await createCarouselItem({
        name: formData.name.trim() || null,
        imageUrl,
        isActive: formData.isActive,
      }).unwrap();

      toast.success("Foto agregada correctamente");
      setFormData({ name: "", imageUrl: "", isActive: true });
    } catch (error) {
      const message = getApiErrorMessage(error as Parameters<typeof getApiErrorMessage>[0]);
      toast.error(message || "Error al agregar la foto");
    }
  };

  const handleToggleActive = async (item: CarouselItem) => {
    try {
      await updateCarouselItem({ id: item.id, isActive: !item.isActive }).unwrap();
      toast.success(item.isActive ? "Foto desactivada" : "Foto activada");
    } catch (error) {
      const message = getApiErrorMessage(error as Parameters<typeof getApiErrorMessage>[0]);
      toast.error(message || "Error al actualizar la foto");
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;

    try {
      await deleteCarouselItem(showDeleteModal.id).unwrap();
      toast.success("Foto eliminada correctamente");
      setShowDeleteModal(null);
    } catch (error) {
      const message = getApiErrorMessage(error as Parameters<typeof getApiErrorMessage>[0]);
      toast.error(message || "Error al eliminar la foto");
    }
  };

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
                Carrusel de inicio
              </h1>
              <p className="mt-1 text-black/60">
                Administra las fotos visibles en el carrusel principal
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-black/5 px-4 py-2 text-sm text-black/70">
              <ImageIcon size={16} />
              {items.length} fotos registradas
            </div>
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
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-black/50">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Create */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 overflow-hidden rounded-2xl border border-black/10 bg-white"
        >
          <div className="border-b border-black/10 bg-black/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <Plus size={18} className="text-black/70" />
              <h2 className="font-semibold">Agregar nueva foto</h2>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-6 p-5 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <CloudinaryUploadWidget
                currentImageUrl={formData.imageUrl}
                onUploadSuccess={(url) =>
                  setFormData((prev) => ({ ...prev, imageUrl: url }))
                }
                defaultImageUrl=""
                folder="carousel"
              />
            </div>
            <div className="space-y-4 lg:col-span-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-black/70">
                  Nombre (opcional)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Ej: Andrea, Cliente 2024"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              <label className="flex items-center gap-3 text-sm font-medium text-black/70">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, isActive: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-black/20 text-black focus:ring-black/20"
                />
                Mostrar en carrusel
              </label>
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={16} />
                {isCreating ? "Guardando..." : "Guardar foto"}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-black/10 border-t-black" />
              <p className="text-black/60">Cargando fotos...</p>
            </div>
          </div>
        ) : isError ? (
          <ServerError
            title="Error de conexión"
            message="No pudimos cargar las fotos. Por favor, verifica tu conexión o intenta más tarde."
            onRetry={refetch}
            showHomeButton={false}
          />
        ) : orderedItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-black/10 bg-white p-12 text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
              <ImageIcon size={32} className="text-black/30" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">Sin fotos</h2>
            <p className="text-black/60">
              Sube la primera foto para mostrarla en el carrusel.
            </p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {orderedItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.name ?? "Foto del carrusel"}
                      fill
                      className={`object-cover ${item.isActive ? "" : "opacity-60"}`}
                    />
                    {!item.isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                        Inactiva
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {item.name?.trim() ? item.name : "Sin nombre"}
                        </p>
                        <p className="text-xs text-black/50">
                          {item.isActive ? "Visible en carrusel" : "Oculta"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.isActive
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {item.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                        {item.isActive ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(item)}
                        disabled={isUpdating}
                        className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                          item.isActive
                            ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                            : "border-green-200 text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {item.isActive ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() =>
                          setShowDeleteModal({ id: item.id, name: item.name })
                        }
                        className="flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
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
                      Eliminar foto
                    </h3>
                    <p className="text-sm text-black/60">
                      ¿Eliminar{" "}
                      <span className="font-semibold">
                        "{showDeleteModal.name?.trim() || "esta foto"}"
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
