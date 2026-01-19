"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Tag } from "lucide-react";
import {
  useFetchCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "@/store/features/categories/categoriesApi";
import toast from "react-hot-toast";

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

export function CategoryFormView() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam ?? "";
  const isEditing = !!id && id !== "new";

  const { data: categoryData, isLoading } = useFetchCategoryQuery(id, {
    skip: !isEditing,
  });

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

  const category = categoryData?.data;
  const isSubmitting = isCreating || isUpdating;

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    isActive: true,
  });

  // Generate slug from name
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

      // Auto-generate slug when name changes (only if slug is empty or matches previous generated slug)
      if (name === "name" && (!prev.slug || prev.slug === generateSlug(prev.name))) {
        newData.slug = generateSlug(value);
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const categoryData = {
        ...formData,
        description: formData.description || null,
      };

      if (isEditing) {
        await updateCategory({ id: parseInt(id), ...categoryData }).unwrap();
        toast.success("Categoría actualizada correctamente");
      } else {
        await createCategory(categoryData).unwrap();
        toast.success("Categoría creada correctamente");
      }

      router.push("/admin/categories");
    } catch (error: any) {
      toast.error(error?.data?.error || "Error al guardar la categoría");
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-black/10 bg-white p-16 text-center shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-black" />
            <p className="text-black/60">Cargando categoría...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <motion.div
        className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <Link
            href="/admin/categories"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-black"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            <span className="uppercase tracking-[0.2em]">Volver a categorías</span>
          </Link>
          <div className="mb-2">
            <p className="text-xs uppercase tracking-[0.4em] text-black/50">
              {isEditing ? "Editar" : "Nueva"} categoría
            </p>
          </div>
          <h1 className="text-4xl font-semibold tracking-[0.05em] sm:text-5xl">
            {isEditing ? "Editar categoría" : "Nueva categoría"}
          </h1>
        </motion.div>

        {/* Form */}
        <motion.div
          variants={itemVariants}
          className="rounded-[32px] border border-black/10 bg-white p-8 shadow-[0_16px_36px_rgba(0,0,0,0.08)] sm:p-10"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-black/80">
                Nombre *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Ej: Velas aromáticas"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-black/80">
                Slug *
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10 font-mono text-sm"
                placeholder="Ej: velas-aromaticas"
              />
              <p className="mt-2 text-xs text-black/50">
                URL amigable (se genera automáticamente desde el nombre)
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-black/80">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Descripción opcional de la categoría"
              />
            </div>

            {/* Active Status */}
            <div className="flex flex-col gap-2 rounded-xl border border-black/10 bg-black/5 p-4 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-5 w-5 shrink-0 rounded border-black/20 text-black focus:ring-2 focus:ring-black/20"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-black/80">
                  Categoría activa
                </label>
              </div>
              <p className="text-xs text-black/50 sm:ml-auto">
                Las categorías inactivas no aparecerán en el selector de productos
              </p>
            </div>

            {/* Submit */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
              <Link
                href="/admin/categories"
                className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-black/5 sm:px-6 sm:py-4"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-4"
              >
                <Save size={18} aria-hidden="true" />
                <span className="hidden sm:inline">
                  {isSubmitting
                    ? "Guardando..."
                    : isEditing
                      ? "Actualizar categoría"
                      : "Crear categoría"}
                </span>
                <span className="sm:hidden">
                  {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </main>
  );
}
