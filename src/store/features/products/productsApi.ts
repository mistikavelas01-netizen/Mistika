import { apiSlice } from "../api/apiSlice";

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "price_asc" | "price_desc" | "newest";
  categoryId?: string | number;
}

export const productsApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    // Fetch products with pagination, sorting and filtering
    fetchProducts: build.query({
      query: ({ page = 1, limit = 12, sortBy, categoryId }: ProductsQueryParams = {}) => {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", limit.toString());
        if (sortBy) params.set("sortBy", sortBy);
        if (categoryId && categoryId !== "all") params.set("categoryId", categoryId.toString());
        return `/products?${params.toString()}`;
      },
      transformResponse: (response: any) => {
        // Handle the response structure from Next.js API route
        if (response.success && response.data) {
          return {
            data: response.data,
            pagination: response.pagination || null,
          };
        }
        if (Array.isArray(response)) {
          return { data: response, pagination: null };
        }
        if (response.data) {
          return {
            data: Array.isArray(response.data) ? response.data : [],
            pagination: response.pagination || null,
          };
        }
        return { data: [], pagination: null };
      },
      providesTags: ["Products"],
    }),

    // Fetch single product by ID
    fetchProduct: build.query({
      query: (id: string) => `/products/${id}`,
      transformResponse: (response: any) => {
        // Handle the response structure from Next.js API route
        if (response.success && response.data) {
          return { data: response.data };
        }
        if (response.data) {
          return { data: response.data };
        }
        return { data: response };
      },
      providesTags: (result, error, id) => [{ type: "Products", id }],
    }),

    // Create product (mutation)
    createProduct: build.mutation({
      query: (formData: ProductInput) => ({
        url: "/products",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return { success: true, data: response.data };
        }
        return response;
      },
      invalidatesTags: ["Products"],
    }),

    // Update product (mutation)
    updateProduct: build.mutation({
      query: ({ id, ...formData }: { id: number } & Partial<ProductInput>) => ({
        url: `/products/${id}`,
        method: "PUT",
        body: formData,
      }),
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return { success: true, data: response.data };
        }
        return response;
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Products", id },
        "Products",
      ],
    }),

    // Delete product (mutation)
    deleteProduct: build.mutation({
      query: (id: number) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: any) => {
        if (response.success) {
          return { success: true };
        }
        return response;
      },
      invalidatesTags: ["Products"],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useFetchProductsQuery,
  useFetchProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
