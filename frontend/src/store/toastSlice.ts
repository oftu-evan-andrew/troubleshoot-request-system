import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ToastTone = "info" | "success" | "error";

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  items: ToastItem[];
  nextId: number;
}

const MAX_VISIBLE_TOASTS = 5;

const initialState: ToastState = { items: [], nextId: 1 };

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    // A bare string is an info toast, so existing call sites stay unchanged.
    toastShown: (state, action: PayloadAction<string | { message: string; tone?: ToastTone }>) => {
      const { message, tone = "info" } =
        typeof action.payload === "string" ? { message: action.payload } : action.payload;
      state.items.push({ id: state.nextId, message, tone });
      state.nextId += 1;
      state.items = state.items.slice(-MAX_VISIBLE_TOASTS);
    },
    toastDismissed: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
  },
});

export const { toastShown, toastDismissed } = toastSlice.actions;
export default toastSlice.reducer;
