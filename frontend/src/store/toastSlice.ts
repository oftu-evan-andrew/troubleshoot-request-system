import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ToastItem {
  id: number;
  message: string;
}

interface ToastState {
  items: ToastItem[];
  nextId: number;
}

const initialState: ToastState = { items: [], nextId: 1 };

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    toastShown: (state, action: PayloadAction<string>) => {
      state.items.push({ id: state.nextId, message: action.payload });
      state.nextId += 1;
    },
    toastDismissed: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
  },
});

export const { toastShown, toastDismissed } = toastSlice.actions;
export default toastSlice.reducer;
