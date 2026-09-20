import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LoginResponse, StaffSummary } from "@/lib/types";

const TOKEN_STORAGE_KEY = "trs_token";
const STAFF_STORAGE_KEY = "trs_staff";

interface AuthState {
  token: string | null;
  staff: StaffSummary | null;
  // False until saved credentials have been read from localStorage on the
  // client, so the first client render matches the server-rendered HTML.
  hydrated: boolean;
}

export function readStoredAuth(): Pick<AuthState, "token" | "staff"> {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  const staffRaw = window.localStorage.getItem(STAFF_STORAGE_KEY);

  try {
    return {
      token,
      staff: staffRaw ? (JSON.parse(staffRaw) as StaffSummary) : null,
    };
  } catch {
    return { token: null, staff: null };
  }
}

const initialState: AuthState = { token: null, staff: null, hydrated: false };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authHydrated: (state, action: PayloadAction<Pick<AuthState, "token" | "staff">>) => {
      state.token = action.payload.token;
      state.staff = action.payload.staff;
      state.hydrated = true;
    },
    credentialsReceived: (state, action: PayloadAction<LoginResponse>) => {
      state.token = action.payload.token;
      state.staff = action.payload.staff;

      window.localStorage.setItem(TOKEN_STORAGE_KEY, action.payload.token);
      window.localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(action.payload.staff));
    },
    loggedOut: (state) => {
      state.token = null;
      state.staff = null;

      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(STAFF_STORAGE_KEY);
    },
  },
});

export const { authHydrated, credentialsReceived, loggedOut } = authSlice.actions;
export default authSlice.reducer;
