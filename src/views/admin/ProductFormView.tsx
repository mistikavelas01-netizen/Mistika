"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Package,
  Image as ImageIcon,
  DollarSign,
  Box,
  Tag,
  Link as LinkIcon,
  Check,
  X,
  Percent,
  Eye,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  useFetchProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/store/features/products/productsApi";
import { useFetchCategoriesQuery } from "@/store/features/categories/categoriesApi";
import { getApiErrorMessage } from "@/store/features/api/getApiErrorMessage";
import toast from "react-hot-toast";
import { CloudinaryUploadWidget } from "@/components/widget/Cloudinary";
import { PLACEHOLDER_IMAGE } from "@/constant";

export function ProductFormView() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam ?? "";
  const isEditing = !!id;

  const { data: productData, isLoading } = useFetchProductQuery(id, {
    skip: !isEditing,
  });
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useFetchCategoriesQuery(true);

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
    imageUrl: PLACEHOLDER_IMAGE,
    slug: "",
    categoryId: "",
    stock: "1",
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
        categoryId:
          product.categoryId?.toString() ||
          (typeof product.category === "object"
            ? product.category?.id?.toString()
            : "") ||
          categories[0]?.id?.toString() ||
          "",
        stock: product.stock?.toString() || "1",
        isActive: product.isActive ?? true,
      });
    }
  }, [product, isEditing]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  /** Only allow digits and at most one decimal point (for price fields) */
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(",", ".");
    const valid = raw === "" || /^\d*\.?\d*$/.test(raw);
    if (valid) setFormData((prev) => ({ ...prev, [e.target.name]: raw }));
  };

  /** Only allow non-negative integers (for stock) */
  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const valid = raw === "" || /^\d+$/.test(raw);
    if (valid) setFormData((prev) => ({ ...prev, stock: raw }));
  };

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const stockNum = parseInt(formData.stock, 10);
    if (!Number.isFinite(stockNum) || stockNum < 1) {
      toast.error("La cantidad (stock) debe ser al menos 1");
      return;
    }

    try {
      const imageUrl =
        (typeof formData.imageUrl === "string" && formData.imageUrl.trim() !== "")
          ? formData.imageUrl.trim()
          : PLACEHOLDER_IMAGE;

      const productData: ProductInput = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price ? parseFloat(formData.price) : null,
        discountPrice: formData.discountPrice
          ? parseFloat(formData.discountPrice)
          : null,
        isOnSale: formData.isOnSale,
        imageUrl: imageUrl || PLACEHOLDER_IMAGE,
        slug: formData.slug || null,
        categoryId: formData.categoryId || undefined,
        stock: Math.max(1, parseInt(formData.stock, 10) || 1),
        isActive: formData.isActive,
      };

      if (isEditing) {
        await updateProduct({ id, ...productData }).unwrap();
        toast.success("Producto actualizado correctamente");
      } else {
        await createProduct(productData).unwrap();
        toast.success("Producto creado correctamente");
      }

      router.push("/admin/products");
    } catch (error) {
      const message = getApiErrorMessage(error as Parameters<typeof getApiErrorMessage>[0]);
      toast.error(message || "Error al guardar el producto");
    }
  };

  const formatPrice = (price: string) => {
    if (!price) return "$0.00";
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const categoryName =
    categories.find((c: Category) => c.id.toString() === formData.categoryId)
      ?.name || "Sin categoría";

  if (isEditing && isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-black/10 border-t-black" />
              <p className="text-black/60">Cargando producto...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-white to-black/5 pb-24 lg:pb-8">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/admin/products"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-black"
          >
            <ArrowLeft size={18} />
            <span className="uppercase tracking-[0.2em]">Productos</span>
          </Link>

          <h1 className="text-3xl font-semibold tracking-[0.05em] sm:text-4xl">
            {isEditing ? "Editar producto" : "Nuevo producto"}
          </h1>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Form Fields */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6 lg:col-span-2"
            >
              {/* Basic Info Card */}
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Package size={18} className="text-black/70" />
                    <h2 className="font-semibold">Información básica</h2>
                  </div>
                </div>
                <div className="space-y-5 p-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-black/70">
                      Nombre del producto *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Ej: Vela aromática de canela"
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-black/70">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Describe las características del producto..."
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-black/70">
                        <div className="flex items-center gap-2">
                          <Tag size={14} />
                          Categoría *
                        </div>
                      </label>
                      {isLoadingCategories ? (
                        <div className="rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-black/50">
                          Cargando...
                        </div>
                      ) : categories.length === 0 ? (
                        <Link
                          href="/admin/categories/new"
                          className="flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
                        >
                          + Crear categoría primero
                        </Link>
                      ) : (
                        <select
                          name="categoryId"
                          value={formData.categoryId}
                          onChange={handleChange}
                          required
                          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                        >
                          <option value="">Seleccionar</option>
                          {categories.map((cat: Category) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-black/70">
                        <div className="flex items-center gap-2">
                          <LinkIcon size={14} />
                          Slug
                        </div>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="slug"
                          value={formData.slug}
                          onChange={handleChange}
                          placeholder="url-amigable"
                          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                        />
                        <button
                          type="button"
                          onClick={generateSlug}
                          className="shrink-0 rounded-xl border border-black/10 px-3 text-xs font-medium text-black/60 transition hover:bg-black/5"
                          title="Generar desde nombre"
                        >
                          Auto
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Card */}
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <DollarSign size={18} className="text-black/70" />
                    <h2 className="font-semibold">Precio</h2>
                  </div>
                </div>
                <div className="space-y-5 p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-black/70">
                        Precio regular (MXN)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40">
                          $
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          name="price"
                          value={formData.price}
                          onChange={handlePriceChange}
                          placeholder="0.00"
                          className="w-full rounded-xl border border-black/10 bg-white py-3 pl-8 pr-4 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-black/70">
                        <Percent size={14} />
                        Precio de oferta (MXN)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40">
                          $
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          name="discountPrice"
                          value={formData.discountPrice}
                          onChange={handlePriceChange}
                          placeholder="0.00"
                          disabled={!formData.isOnSale}
                          className="w-full rounded-xl border border-black/10 bg-white py-3 pl-8 pr-4 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-black/30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* On Sale Toggle */}
                  <div
                    className={`flex items-center justify-between rounded-xl border p-4 transition ${
                      formData.isOnSale
                        ? "border-red-200 bg-red-50"
                        : "border-black/10 bg-black/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          formData.isOnSale ? "bg-red-500 text-white" : "bg-black/10"
                        }`}
                      >
                        <Percent size={16} />
                      </div>
                      <div>
                        <p className="font-medium">Producto en oferta</p>
                        <p className="text-xs text-black/50">
                          Mostrar precio con descuento
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, isOnSale: !prev.isOnSale }))
                      }
                      className={`relative h-7 w-12 rounded-full transition ${
                        formData.isOnSale ? "bg-red-500" : "bg-black/20"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          formData.isOnSale ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Inventory Card */}
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Box size={18} className="text-black/70" />
                    <h2 className="font-semibold">Inventario y estado</h2>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-black/70">
                        Stock disponible
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        name="stock"
                        value={formData.stock}
                        onChange={handleStockChange}
                        placeholder="1"
                        minLength={1}
                        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-black/70">
                        Estado del producto
                      </label>
                      <div
                        className={`flex items-center justify-between rounded-xl border p-3 ${
                          formData.isActive
                            ? "border-green-200 bg-green-50"
                            : "border-black/10 bg-black/5"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {formData.isActive ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <X size={16} className="text-black/40" />
                          )}
                          <span
                            className={
                              formData.isActive
                                ? "font-medium text-green-700"
                                : "text-black/50"
                            }
                          >
                            {formData.isActive ? "Activo" : "Inactivo"}
                          </span>
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
                </div>
              </div>
            </motion.div>

            {/* Right Column - Image & Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6 lg:col-span-1"
            >
              {/* Image Upload */}
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <ImageIcon size={18} className="text-black/70" />
                    <h2 className="font-semibold">Imagen</h2>
                  </div>
                </div>
                <div className="p-5">
                  <CloudinaryUploadWidget
                    currentImageUrl={formData.imageUrl}
                    defaultImageUrl={PLACEHOLDER_IMAGE}
                    onUploadSuccess={(url) => {
                      setFormData((prev) => ({ ...prev, imageUrl: url }));
                    }}
                    folder="products"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                <div className="border-b border-black/10 bg-black/5 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Eye size={18} className="text-black/70" />
                    <h2 className="font-semibold">Vista previa</h2>
                  </div>
                </div>
                <div className="p-5">
                  {/* Mini Product Card Preview */}
                  <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
                    <div className="relative aspect-square bg-black/5">
                      {formData.imageUrl ? (
                        <Image
                          src={formData.imageUrl}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package size={40} className="text-black/20" />
                        </div>
                      )}
                      {formData.isOnSale && (
                        <div className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          OFERTA
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="truncate font-semibold text-sm">
                        {formData.name || "Nombre del producto"}
                      </h4>
                      <p className="text-xs text-black/50">{categoryName}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {formData.isOnSale && formData.discountPrice ? (
                          <>
                            <span className="font-semibold text-red-600">
                              {formatPrice(formData.discountPrice)}
                            </span>
                            <span className="text-xs text-black/40 line-through">
                              {formatPrice(formData.price)}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold">
                            {formatPrice(formData.price)}
                          </span>
                        )}
                      </div>
                      {!formData.isActive && (
                        <div className="mt-2 rounded bg-black/10 px-2 py-1 text-center text-[10px] font-medium text-black/50">
                          INACTIVO
                        </div>
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
                      : "Crear producto"}
                </button>
                <Link
                  href="/admin/products"
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
              href="/admin/products"
              className="flex flex-1 items-center justify-center rounded-xl border border-black/10 py-3 font-medium text-black/70"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              form="product-form"
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
