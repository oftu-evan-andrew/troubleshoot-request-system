import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/lib/api/baseApi";
import authReducer from "@/store/authSlice";
import toastReducer from "@/store/toastSlice";

// A factory (rather than a module-level singleton) so each client mount gets
// its own store instance, per the recommended Redux Toolkit + Next.js App
// Router pattern (avoids leaking state across server-rendered requests).
export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      toast: toastReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
