"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        throw error;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMessage(
        "The email address or password is incorrect."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f7f4] px-6 py-20 text-[#13201a]">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
            GLOBAL TRANSLATION HUB
          </div>

          <h1 className="mt-3 text-3xl font-bold">
            Administration
          </h1>

          <p className="mt-3 text-sm text-[#647269]">
            Authorised personnel only
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[#dce6df] bg-white p-8 shadow-sm"
        >
          <div>
            <label className="mb-2 block font-semibold">
              Email address
            </label>

            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="w-full rounded-xl border border-[#d5e0d8] px-4 py-4 outline-none focus:border-[#087f5b]"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block font-semibold">
              Password
            </label>

            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="w-full rounded-xl border border-[#d5e0d8] px-4 py-4 outline-none focus:border-[#087f5b]"
            />
          </div>

          {errorMessage && (
            <div className="mt-5 rounded-xl bg-[#fff0ed] px-4 py-3 text-sm font-medium text-[#9a3f2f]">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full rounded-xl bg-[#087f5b] px-5 py-4 font-semibold text-white transition hover:bg-[#066a4c] disabled:opacity-50"
          >
            {loading
              ? "Signing in..."
              : "Sign in securely"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-[#6b776f]">
          Access is restricted to authorised GLOBAL
          TRANSLATION HUB personnel.
        </p>
      </div>
    </main>
  );
}