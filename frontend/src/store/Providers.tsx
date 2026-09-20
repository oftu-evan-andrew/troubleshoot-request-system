"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store/store";
import { authHydrated, readStoredAuth } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";

function AuthHydrator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(authHydrated(readStoredAuth()));
  }, [dispatch]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());

  return (
    <Provider store={store}>
      <AuthHydrator />
      {children}
    </Provider>
  );
}
