import { baseApi } from "@/lib/api/baseApi";
import { LoginResponse, StaffSummary } from "@/lib/types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterStaffRequest {
  name: string;
  email: string;
  password: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),
    me: builder.query<StaffSummary, void>({
      query: () => "/auth/me",
    }),
    listStaff: builder.query<StaffSummary[], void>({
      query: () => "/auth/staff",
      providesTags: ["Staff"],
    }),
    registerStaff: builder.mutation<StaffSummary, RegisterStaffRequest>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Staff"],
    }),
  }),
});

export const { useLoginMutation, useMeQuery, useListStaffQuery, useRegisterStaffMutation } =
  authApi;
