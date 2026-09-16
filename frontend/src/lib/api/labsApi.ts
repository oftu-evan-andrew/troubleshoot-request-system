import { baseApi } from "@/lib/api/baseApi";
import { ComputerUnitDto, ComputerUnitStatus, LabDto, SeatDto } from "@/lib/types";

export interface CreateLabRequest {
  labName: string;
  location: string;
}

export interface CreateSeatRequest {
  labId: number;
  seatNumber: string;
}

export interface CreateUnitRequest {
  assetTag: string;
}

export const labsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Public: the reporter form needs this to populate lab/seat selection.
    listLabs: builder.query<LabDto[], void>({
      query: () => "/labs",
      providesTags: ["Labs"],
    }),

    // Staff-only: every unit and where (if anywhere) it's currently
    // seated — backs the units management list and the assignment dropdown.
    listUnits: builder.query<ComputerUnitDto[], void>({
      query: () => "/labs/units",
      providesTags: ["Units"],
    }),

    createLab: builder.mutation<LabDto, CreateLabRequest>({
      query: (body) => ({
        url: "/labs",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Labs"],
    }),

    createSeat: builder.mutation<SeatDto, CreateSeatRequest>({
      query: (body) => ({
        url: "/labs/seats",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Labs"],
    }),

    createUnit: builder.mutation<ComputerUnitDto, CreateUnitRequest>({
      query: (body) => ({
        url: "/labs/units",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Units"],
    }),

    updateUnitStatus: builder.mutation<ComputerUnitDto, { id: number; status: ComputerUnitStatus }>({
      query: ({ id, status }) => ({
        url: `/labs/units/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["Labs", "Units"],
    }),

    // seatId: null unassigns the unit, returning it to inventory.
    assignUnit: builder.mutation<ComputerUnitDto, { id: number; seatId: number | null }>({
      query: ({ id, seatId }) => ({
        url: `/labs/units/${id}/assign`,
        method: "PUT",
        body: { seatId },
      }),
      invalidatesTags: ["Labs", "Units"],
    }),

    // Blocked server-side (409) if the lab/seat/unit has request history, to
    // preserve maintenance-pattern reporting data.
    deleteLab: builder.mutation<void, number>({
      query: (id) => ({
        url: `/labs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Labs", "Units"],
    }),

    deleteSeat: builder.mutation<void, number>({
      query: (id) => ({
        url: `/labs/seats/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Labs", "Units"],
    }),

    deleteUnit: builder.mutation<void, number>({
      query: (id) => ({
        url: `/labs/units/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Labs", "Units"],
    }),
  }),
});

export const {
  useListLabsQuery,
  useListUnitsQuery,
  useCreateLabMutation,
  useCreateSeatMutation,
  useCreateUnitMutation,
  useUpdateUnitStatusMutation,
  useAssignUnitMutation,
  useDeleteLabMutation,
  useDeleteSeatMutation,
  useDeleteUnitMutation,
} = labsApi;
