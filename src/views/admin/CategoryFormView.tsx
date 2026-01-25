"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Tag,
  Link as LinkIcon,
  FileText,
  Check,
  X,
  Eye,
} from "lucide-react";
import {
  useFetchCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "@/store/features/categories/categoriesApi";
import toast from "react-hot-toast";

export function CategoryFormView() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam ?? "";
  const isEditing = !!id && id !== "new";

  const { data: categoryData, isLoading } = useFetchCategoryQuery(id, {
    skip: !isEditing,
  });

  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();

  const category = categoryData?.data;
  const isSubmitting = isCreating || isUpdating;

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    isActive: true,
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  useEffect(() => {
    if (category && isEditing) {
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        isActive: category.isActive ?? true,
      });
    }
  }, [category, isEditing]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]:
          type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      };

      if (
        name === "name" &&
        (!prev.slug || prev.slug === generateSlug(prev.name))
      ) {
        newData.slug = generateSlug(value);
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const categoryPayload = {
        ...formData,
        description: formData.description || null,
      };

      if (isEditing) {
        await updateCategory({ id: parseInt(id), ...categoryPayload }).unwrap();
        toast.success("Categoría actualizada");
      } else {
        await createCategory(categoryPayload).unwrap();
        toast.success("Categoría creada");
      }

      router.push("/admin/categories");
    } catch (error: any) {
      toast.error(error?.data?.error || "Error al guardar la categoría");
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-black/10 border-t-black" />
              <p className="text-black/60">Cargando categoría...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5 pb-24 lg:pb-8">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/admin/categories"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-black"
          >
            <ArrowLeft size={18} />
            <span className="uppercase tracking-[0.2em]">Categorías</span>
          </Link>

          <h1 className="text-3xl font-semibold tracking-[0.05em] sm:text-4xl">
            {isEditing ? "Editar categoría" : "Nueva categoría"}
          </h1>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Left Column - Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6 lg:col-span-3"
            >
              {/* Basic Info */}
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Tag size={18} className="text-black/70" />
                    <h2 className="font-semibold">Información</h2>
                  </div>
                </div>
                <div className="space-y-5 p-5">
                  {/* Name */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-black/70">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Ej: Velas aromáticas"
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-black/70">
                      <LinkIcon size={14} />
                      Slug
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        required
                        placeholder="velas-aromaticas"
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 font-mono text-sm transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            slug: generateSlug(prev.name),
                          }))
                        }
                        className="shrink-0 rounded-xl border border-black/10 px-3 text-xs font-medium text-black/60 transition hover:bg-black/5"
                        title="Generar desde nombre"
                      >
                        Auto
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-black/40">
                      URL amigable para la categoría
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-black/70">
                      <FileText size={14} />
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Descripción opcional..."
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                <div className="p-5">
                  <div
                    className={`flex items-center justify-between rounded-xl border p-4 transition ${
                      formData.isActive
                        ? "border-green-200 bg-green-50"
                        : "border-black/10 bg-black/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          formData.isActive
                            ? "bg-green-500 text-white"
                            : "bg-black/10 text-black/40"
                        }`}
                      >
                        {formData.isActive ? (
                          <Check size={20} />
                        ) : (
                          <X size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {formData.isActive
                            ? "Categoría activa"
                            : "Categoría inactiva"}
                        </p>
                        <p className="text-xs text-black/50">
                          {formData.isActive
                            ? "Visible en el selector de productos"
                            : "No aparecerá en el selector"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          isActive: !prev.isActive,
                        }))
                      }
                      className={`relative h-7 w-12 rounded-full transition ${
                        formData.isActive ? "bg-green-500" : "bg-black/20"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          formData.isActive ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Preview & Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6 lg:col-span-2"
            >
              {/* Preview */}
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Eye size={18} className="text-black/70" />
                    <h2 className="font-semibold">Vista previa</h2>
                  </div>
                </div>
                <div className="p-5">
                  <div className="rounded-xl border border-black/10 bg-white p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5">
                        <Tag size={18} className="text-black/60" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-semibold">
                          {formData.name || "Nombre de la categoría"}
                        </h4>
                        <code className="text-xs text-black/40">
                          /{formData.slug || "slug"}
                        </code>
                      </div>
                    </div>
                    {formData.description && (
                      <p className="mb-3 text-sm text-black/60 line-clamp-2">
                        {formData.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      {formData.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          Inactiva
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Actions */}
              <div className="hidden space-y-3 lg:block">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-6 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={18} />
                  {isSubmitting
                    ? "Guardando..."
                    : isEditing
                      ? "Guardar cambios"
                      : "Crear categoría"}
                </button>
                <Link
                  href="/admin/categories"
                  className="flex w-full items-center justify-center rounded-xl border border-black/10 px-6 py-4 font-medium text-black/70 transition hover:bg-black/5"
                >
                  Cancelar
                </Link>
              </div>
            </motion.div>
          </div>
        </form>

        {/* Mobile Fixed Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 bg-white p-4 lg:hidden">
          <div className="flex gap-3">
            <Link
              href="/admin/categories"
              className="flex flex-1 items-center justify-center rounded-xl border border-black/10 py-3 font-medium text-black/70"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black py-3 font-semibold text-white disabled:opacity-50"
            >
              <Save size={18} />
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
