import { apiSlice } from "../api/apiSlice";

export const categoriesApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    // Fetch all categories
    fetchCategories: build.query({
      query: (activeOnly?: boolean) => 
        activeOnly ? "/categories?activeOnly=true" : "/categories",
      transformResponse: (response: ApiListResponse<Category>) => {
        if (Array.isArray(response)) {
          return { data: response };
        }
        if ("success" in response) {
          if (response.success && response.data) {
            return { data: response.data };
          }
          return { data: [] };
        }
        if ("data" in response) {
          return {
            data: Array.isArray(response.data) ? response.data : [],
          };
        }
        return { data: [] };
      },
      providesTags: ["Categories"],
    }),

    // Fetch single category by ID
    fetchCategory: build.query({
      query: (id: string) => `/categories/${id}`,
      transformResponse: (response: ApiItemResponse<Category>) => {
        if ("success" in response && response.success && response.data) {
          return { data: response.data };
        }
        if ("data" in response) {
          return { data: response.data };
        }
        return { data: response as Category };
      },
      providesTags: (result, error, id) => [{ type: "Categories", id }],
    }),

    // Create category (mutation)
    createCategory: build.mutation({
      query: (categoryData: CategoryInput) => ({
        url: "/categories",
        method: "POST",
        body: categoryData,
      }),
      transformResponse: (response: ApiMutationResponse<Category>) => {
        if ("success" in response && response.success) {
          return { success: true, data: response.data };
        }
        return response;
      },
      invalidatesTags: ["Categories"],
    }),

    // Update category (mutation)
    updateCategory: build.mutation({
      query: ({ id, ...updateData }: { id: string } & CategoryUpdateInput) => ({
        url: `/categories/${id}`,
        method: "PUT",
        body: updateData,
      }),
      transformResponse: (response: ApiMutationResponse<Category>) => {
        if ("success" in response && response.success) {
          return { success: true, data: response.data };
        }
        return response;
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Categories", id },
        "Categories",
      ],
    }),

    // Delete category (mutation)
    deleteCategory: build.mutation({
      query: (id: string) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiMutationResponse<Category>) => {
        if ("success" in response && response.success) {
          return { success: true };
        }
        return response;
      },
      invalidatesTags: ["Categories"],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useFetchCategoriesQuery,
  useFetchCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
