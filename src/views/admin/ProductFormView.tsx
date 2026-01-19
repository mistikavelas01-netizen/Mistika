"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Package, Image as ImageIcon, DollarSign, Box } from "lucide-react";
import Link from "next/link";
import { useFetchProductQuery, useCreateProductMutation, useUpdateProductMutation } from "@/store/features/products/productsApi";
import { useFetchCategoriesQuery } from "@/store/features/categories/categoriesApi";
import toast from "react-hot-toast";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

export function ProductFormView() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam ?? "";
  const isEditing = !!id;

  const { data: productData, isLoading } = useFetchProductQuery(id, {
    skip: !isEditing,
  });
  const { data: categoriesData, isLoading: isLoadingCategories } = useFetchCategoriesQuery(true); // Only active categories for product form

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const product = productData?.data;
  const categories = categoriesData?.data ?? [];
  const isSubmitting = isCreating || isUpdating;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    isOnSale: false,
    imageUrl: "",
    slug: "",
    categoryId: "",
    stock: "0",
    isActive: true,
  });

  useEffect(() => {
    if (product && isEditing) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        discountPrice: product.discountPrice?.toString() || "",
        isOnSale: product.isOnSale || false,
        imageUrl: product.imageUrl || "",
        slug: product.slug || "",
        categoryId: product.categoryId?.toString() || (typeof product.category === "object" ? product.category?.id?.toString() : "") || categories[0]?.id?.toString() || "",
        stock: product.stock?.toString() || "0",
        isActive: product.isActive ?? true,
      });
    }
  }, [product, isEditing]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const productData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        discountPrice: formData.discountPrice
          ? parseFloat(formData.discountPrice)
          : null,
        stock: parseInt(formData.stock) || 0,
        categoryId: parseInt(formData.categoryId) || undefined,
      };

      if (isEditing) {
        await updateProduct({ id: parseInt(id), ...productData }).unwrap();
        toast.success("Producto actualizado correctamente");
      } else {
        await createProduct(productData).unwrap();
        toast.success("Producto creado correctamente");
      }

      router.push("/admin/products");
    } catch (error: any) {
      toast.error(error?.data?.error || "Error al guardar el producto");
    }
  };

  if (isEditing && isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-black/10 bg-white p-16 text-center shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-black" />
            <p className="text-black/60">Cargando producto...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <Link
              href="/admin/products"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-black"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              <span className="uppercase tracking-[0.2em]">Volver a productos</span>
            </Link>
            <div className="mb-2">
              <p className="text-xs uppercase tracking-[0.4em] text-black/50">
                {isEditing ? "Edición" : "Creación"}
              </p>
            </div>
            <h1 className="text-4xl font-semibold tracking-[0.05em] sm:text-5xl">
              {isEditing ? "Editar producto" : "Nuevo producto"}
            </h1>
            <p className="mt-3 text-base text-black/60">
              {isEditing ? "Modifica la información del producto" : "Completa la información para crear un nuevo producto"}
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Form */}
              <motion.div
                variants={itemVariants}
                className="lg:col-span-2 space-y-6"
              >
                {/* Basic Info */}
                <div className="rounded-[32px] border border-black/10 bg-white p-4 shadow-[0_16px_36px_rgba(0,0,0,0.08)] sm:p-6 lg:p-8">
                  <div className="mb-4 flex items-center gap-3 sm:mb-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-black/5 sm:h-12 sm:w-12">
                      <Package size={20} className="text-black/80 sm:w-6 sm:h-6" aria-hidden="true" />
                    </div>
                    <h2 className="text-lg font-semibold tracking-[0.05em] sm:text-xl">Información básica</h2>
                  </div>
                  
                  <div className="space-y-4 sm:space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-black/80">
                        Nombre del producto *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Ej: Vela aromática de canela"
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-black/80">
                        Descripción
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Describe el producto..."
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-black/80">
                          Categoría *
                        </label>
                        {isLoadingCategories ? (
                          <div className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-black/60">
                            Cargando categorías...
                          </div>
                        ) : categories.length === 0 ? (
                          <div className="w-full rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3.5 text-sm text-yellow-800">
                            No hay categorías disponibles.{" "}
                            <Link
                              href="/admin/categories/new"
                              className="font-semibold underline hover:text-yellow-900"
                            >
                              Crear una categoría
                            </Link>
                          </div>
                        ) : (
                          <select
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleChange}
                            required
                            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                          >
                            <option value="">Selecciona una categoría</option>
                            {categories.map((cat: Category) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-black/80">
                          Slug (URL amigable)
                        </label>
                        <input
                          type="text"
                          name="slug"
                          value={formData.slug}
                          onChange={handleChange}
                          placeholder="producto-slug"
                          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="rounded-[32px] border border-black/10 bg-white p-4 shadow-[0_16px_36px_rgba(0,0,0,0.08)] sm:p-6 lg:p-8">
                  <div className="mb-4 flex items-center gap-3 sm:mb-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-black/5 sm:h-12 sm:w-12">
                      <DollarSign size={20} className="text-black/80 sm:w-6 sm:h-6" aria-hidden="true" />
                    </div>
                    <h2 className="text-lg font-semibold tracking-[0.05em] sm:text-xl">Precios y ofertas</h2>
                  </div>
                  
                  <div className="space-y-4 sm:space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-black/80">
                        Precio (MXN)
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                      />
                    </div>

                    <div className="rounded-xl border border-black/10 bg-black/5 p-4">
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          name="isOnSale"
                          checked={formData.isOnSale}
                          onChange={handleChange}
                          className="h-5 w-5 rounded border-black/20 text-black focus:ring-2 focus:ring-black/20"
                        />
                        <div>
                          <span className="block font-semibold text-black/90">Producto en oferta</span>
                          <span className="text-sm text-black/60">Activa esta opción para ofrecer un precio especial</span>
                        </div>
                      </label>
                    </div>

                    {formData.isOnSale && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="mb-2 block text-sm font-semibold text-black/80">
                          Precio con descuento (MXN)
                        </label>
                        <input
                          type="number"
                          name="discountPrice"
                          value={formData.discountPrice}
                          onChange={handleChange}
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="w-full rounded-xl border border-red-300 bg-red-50 px-4 py-3.5 text-black transition focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                        />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Inventory */}
                <div className="rounded-[32px] border border-black/10 bg-white p-4 shadow-[0_16px_36px_rgba(0,0,0,0.08)] sm:p-6 lg:p-8">
                  <div className="mb-4 flex items-center gap-3 sm:mb-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-black/5 sm:h-12 sm:w-12">
                      <Box size={20} className="text-black/80 sm:w-6 sm:h-6" aria-hidden="true" />
                    </div>
                    <h2 className="text-lg font-semibold tracking-[0.05em] sm:text-xl">Inventario</h2>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-black/80">
                        Stock disponible
                      </label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        min="0"
                        placeholder="0"
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="w-full rounded-xl border border-black/10 bg-black/5 p-4">
                        <label className="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="h-5 w-5 rounded border-black/20 text-black focus:ring-2 focus:ring-black/20"
                          />
                          <div>
                            <span className="block font-semibold text-black/90">Producto activo</span>
                            <span className="text-sm text-black/60">Visible en la tienda</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Sidebar */}
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <div className="lg:sticky lg:top-8 space-y-6">
                  {/* Image Preview */}
                  <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-black/5">
                        <ImageIcon size={20} className="text-black/80" aria-hidden="true" />
                      </div>
                      <h3 className="font-semibold tracking-[0.05em]">Imagen</h3>
                    </div>
                    
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-black/80">
                        URL de la imagen
                      </label>
                      <input
                        type="url"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                      />
                      {formData.imageUrl && (
                        <div className="mt-4 overflow-hidden rounded-xl border border-black/10 bg-black/5">
                          <img
                            src={formData.imageUrl}
                            alt="Preview"
                            className="aspect-square w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="rounded-[32px] border border-black/10 bg-white p-4 shadow-[0_16px_36px_rgba(0,0,0,0.08)] sm:p-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-4 sm:text-base"
                  >
                    <Save size={18} aria-hidden="true" />
                    <span className="hidden sm:inline">
                      {isSubmitting
                        ? "Guardando..."
                        : isEditing
                          ? "Actualizar producto"
                          : "Crear producto"}
                    </span>
                    <span className="sm:hidden">
                      {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
                    </span>
                  </button>
                    <Link
                      href="/admin/products"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-black/5 sm:px-6 sm:py-4 sm:text-base"
                    >
                      Cancelar
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
