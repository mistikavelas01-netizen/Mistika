import { apiSlice } from "../api/apiSlice";

export const ordersApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    // Fetch all orders with pagination
    fetchOrders: build.query({
      query: ({ page = 1, limit = 20, status }: { page?: number; limit?: number; status?: OrderStatus } = {}) => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (status) params.append("status", status);
        return `/orders?${params.toString()}`;
      },
      transformResponse: (response: ApiListResponse<Order>) => {
        if (Array.isArray(response)) {
          return { data: response, pagination: null };
        }
        if ("success" in response) {
          if (response.success && response.data) {
            return {
              data: response.data,
              pagination: response.pagination || null,
            };
          }
          return { data: [], pagination: null };
        }
        if ("data" in response) {
          return {
            data: Array.isArray(response.data) ? response.data : [],
            pagination: response.pagination || null,
          };
        }
        return { data: [], pagination: null };
      },
      providesTags: ["Orders"],
    }),

    // Fetch single order by ID
    fetchOrder: build.query({
      query: (id: string) => `/orders/${id}`,
      transformResponse: (response: ApiItemResponse<Order>) => {
        if ("success" in response && response.success && response.data) {
          return { data: response.data };
        }
        if ("data" in response) {
          return { data: response.data };
        }
        return { data: response as Order };
      },
      providesTags: (result, error, id) => [{ type: "Orders", id }],
    }),

    // Fetch order by order number
    fetchOrderByNumber: build.query({
      query: (orderNumber: string) => `/orders/number/${orderNumber}`,
      transformResponse: (response: ApiItemResponse<Order>) => {
        if ("success" in response && response.success && response.data) {
          return { data: response.data };
        }
        if ("data" in response) {
          return { data: response.data };
        }
        return { data: response as Order };
      },
      providesTags: (result, error, orderNumber) => [{ type: "Orders", id: orderNumber }],
    }),

    // Fetch order details by ID with token (public access)
    fetchOrderDetailsWithToken: build.query({
      query: ({ id, token, expires }: { id: string; token: string; expires: string }) =>
        `/orders/details/${id}?token=${encodeURIComponent(token)}&expires=${encodeURIComponent(expires)}`,
      transformResponse: (response: ApiItemResponse<Order>) => {
        if ("success" in response && response.success && response.data) {
          return { data: response.data };
        }
        if ("data" in response) {
          return { data: response.data };
        }
        return { data: response as Order };
      },
      providesTags: (result, error, { id }) => [{ type: "Orders", id: String(id) }],
    }),

    // Create checkout draft (order data before payment)
    createCheckoutDraft: build.mutation({
      query: (orderData: OrderInput) => ({
        url: "/checkout/draft",
        method: "POST",
        body: orderData,
      }),
      transformResponse: (response: { success?: boolean; data?: { id: string } }) => {
        if (response.success && response.data) return { success: true, data: response.data };
        return response;
      },
    }),

    // Create Mercado Pago preference for a draft (returns init_point)
    createMercadoPagoPreference: build.mutation({
      query: (params: { draftId: string; payer?: { email?: string; name?: string } }) => ({
        url: "/payments/mercadopago/preference",
        method: "POST",
        body: params,
      }),
      transformResponse: (response: { success?: boolean; data?: { init_point: string; sandbox_init_point?: string | null; preferenceId: string } }) => {
        if (response.success && response.data) {
          return { success: true, data: response.data };
        }
        return response;
      },
    }),

    // Create order (mutation)
    createOrder: build.mutation({
      query: (orderData: OrderInput) => ({
        url: "/orders",
        method: "POST",
        body: orderData,
      }),
      transformResponse: (response: ApiMutationResponse<Order>) => {
        if ("success" in response && response.success) {
          return { success: true, data: response.data };
        }
        return response;
      },
      invalidatesTags: ["Orders"],
    }),

    // Update order (mutation)
    updateOrder: build.mutation({
      query: ({ id, ...updateData }: { id: string } & OrderUpdateInput) => ({
        url: `/orders/${id}`,
        method: "PUT",
        body: updateData,
      }),
      transformResponse: (response: ApiMutationResponse<Order>) => {
        if ("success" in response && response.success) {
          return { success: true, data: response.data };
        }
        return response;
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Orders", id },
        "Orders",
      ],
    }),

    // Delete order (mutation)
    deleteOrder: build.mutation({
      query: (id: string) => ({
        url: `/orders/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiMutationResponse<Order>) => {
        if ("success" in response && response.success) {
          return { success: true };
        }
        return response;
      },
      invalidatesTags: ["Orders"],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useFetchOrdersQuery,
  useFetchOrderQuery,
  useFetchOrderByNumberQuery,
  useFetchOrderDetailsWithTokenQuery,
  useCreateOrderMutation,
  useCreateCheckoutDraftMutation,
  useCreateMercadoPagoPreferenceMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} = ordersApi;
