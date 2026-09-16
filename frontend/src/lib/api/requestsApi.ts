import { baseApi } from "@/lib/api/baseApi";
import { RequestDto, RequestStatus, SubmitRequestDto } from "@/lib/types";

export const requestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitRequest: builder.mutation<RequestDto, SubmitRequestDto>({
      query: (body) => ({
        url: "/requests",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Queue", "Requests"],
    }),

    getRequestById: builder.query<RequestDto, number>({
      query: (id) => `/requests/${id}`,
    }),

    listRequests: builder.query<RequestDto[], { status?: RequestStatus } | void>({
      query: (args) => ({
        url: "/requests",
        params: args?.status ? { status: args.status } : undefined,
      }),
      providesTags: ["Requests"],
    }),

    // Polled from the staff dashboard so the queue stays live without a
    // separate push/notification channel, matching the documented design.
    getQueue: builder.query<RequestDto[], void>({
      query: () => "/requests/queue",
      providesTags: ["Queue"],
    }),

    processNext: builder.mutation<RequestDto | { message: string }, void>({
      query: () => ({
        url: "/requests/process-next",
        method: "POST",
      }),
      invalidatesTags: ["Queue", "Requests"],
    }),

    resolveRequest: builder.mutation<RequestDto, number>({
      query: (id) => ({
        url: `/requests/${id}/resolve`,
        method: "POST",
      }),
      invalidatesTags: ["Queue", "Requests"],
    }),

    escalateRequest: builder.mutation<RequestDto, number>({
      query: (id) => ({
        url: `/requests/${id}/escalate`,
        method: "POST",
      }),
      invalidatesTags: ["Queue", "Requests"],
    }),

    cancelRequest: builder.mutation<RequestDto, number>({
      query: (id) => ({
        url: `/requests/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["Queue", "Requests"],
    }),
  }),
});

export const {
  useSubmitRequestMutation,
  useGetRequestByIdQuery,
  useListRequestsQuery,
  useGetQueueQuery,
  useProcessNextMutation,
  useResolveRequestMutation,
  useEscalateRequestMutation,
  useCancelRequestMutation,
} = requestsApi;
