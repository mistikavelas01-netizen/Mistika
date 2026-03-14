import { apiSlice, asPublicRequest } from "../api/apiSlice";

export const carouselApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    // Fetch carousel items
    fetchCarouselItems: build.query({
      query: (activeOnly: boolean = true) =>
        activeOnly
          ? asPublicRequest("/carousel?activeOnly=true")
          : "/carousel?activeOnly=false",
      transformResponse: (response: ApiListResponse<CarouselItem>) => {
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
      providesTags: ["Carousel"],
    }),

    // Create carousel item
    createCarouselItem: build.mutation({
      query: (payload: CarouselItemInput) => ({
        url: "/carousel",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: ApiMutationResponse<CarouselItem>) => {
        if ("success" in response && response.success) {
          return { success: true, data: response.data };
        }
        return response;
      },
      invalidatesTags: ["Carousel"],
    }),

    // Update carousel item
    updateCarouselItem: build.mutation({
      query: ({ id, ...payload }: { id: string } & CarouselItemUpdateInput) => ({
        url: `/carousel/${id}`,
        method: "PUT",
        body: payload,
      }),
      transformResponse: (response: ApiMutationResponse<CarouselItem>) => {
        if ("success" in response && response.success) {
          return { success: true, data: response.data };
        }
        return response;
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Carousel", id },
        "Carousel",
      ],
    }),

    // Delete carousel item
    deleteCarouselItem: build.mutation({
      query: (id: string) => ({
        url: `/carousel/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiMutationResponse<CarouselItem>) => {
        if ("success" in response && response.success) {
          return { success: true };
        }
        return response;
      },
      invalidatesTags: ["Carousel"],
    }),
  }),
});

export const {
  useFetchCarouselItemsQuery,
  useCreateCarouselItemMutation,
  useUpdateCarouselItemMutation,
  useDeleteCarouselItemMutation,
} = carouselApi;
