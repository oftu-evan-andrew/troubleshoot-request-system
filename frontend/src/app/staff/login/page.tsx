"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/lib/api/authApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { credentialsReceived } from "@/store/authSlice";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fieldClass, labelClass } from "@/lib/ui";

export default function StaffLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const alreadyLoggedIn = useAppSelector((state) => Boolean(state.auth.token));

  useEffect(() => {
    if (alreadyLoggedIn) {
      router.replace("/staff/dashboard");
    }
  }, [alreadyLoggedIn, router]);

  if (alreadyLoggedIn) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const result = await login({ email, password }).unwrap();
      dispatch(credentialsReceived(result));
      router.replace("/staff/dashboard");
    } catch (err) {
      if (err && typeof err === "object" && "status" in err && err.status === 429) {
        setError("Too many login attempts. Please wait a moment and try again.");
      } else {
        setError("Invalid email or password.");
      }
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <h1 className="text-xl font-semibold text-ink">IT Staff login</h1>
        <p className="mt-1 text-sm text-ink-muted">Sign in to manage lab requests.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className={labelClass}>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className={labelClass}>
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
          </label>

          {error && <p className="text-sm text-red-ink">{error}</p>}

          <Button type="submit" disabled={isLoading} className="mt-2 w-full">
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
