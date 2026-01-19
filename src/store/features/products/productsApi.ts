import { apiSlice } from "../api/apiSlice";

export const productsApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    // Fetch all products
    fetchProducts: build.query({
      query: () => ({
        url: "products",
        method: "GET",
        headers: {
          endpoint: "products",
          method: "GET",
        },
      }),
      transformResponse: (response: any) => ({
        data: response.data || []
      }),
      providesTags: ["Products"],
    }),

    // Fetch single product by ID
    fetchProduct: build.query({
      query: (id: string) => ({
        url: `products/${id}`,
        method: "GET",
        headers: {
          endpoint: `products/${id}`,
          method: "GET",
        },
      }),
      transformResponse: (response: any) => ({
        data: response.data
      }),
      providesTags: (result, error, id) => [{ type: "Products", id }],
    }),

    // Create product (mutation)
    createProduct: build.mutation({
      query: (formData: ProductInput) => ({
        url: "",
        method: "POST",
        body: { product: formData },
        headers: {
          endpoint: "products",
          method: "POST",
        },
      }),
      invalidatesTags: ["Products"],
    }),

    // Update product (mutation)
    updateProduct: build.mutation({
      query: ({ id, ...formData }: { id: number } & Partial<ProductInput>) => ({
        url: "",
        method: "PUT",
        body: { product: formData },
        headers: {
          endpoint: `products/${id}`,
          method: "PUT",
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Products", id },
        "Products",
      ],
    }),

    // Delete product (mutation)
    deleteProduct: build.mutation({
      query: (id: number) => ({
        url: "",
        method: "DELETE",
        headers: {
          endpoint: `products/${id}`,
          method: "DELETE",
        },
      }),
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
