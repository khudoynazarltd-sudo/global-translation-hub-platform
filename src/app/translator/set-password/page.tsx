"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";


export default function TranslatorSetPasswordPage() {
  const router =
    useRouter();

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");


    if (password.length < 10) {
      setMessage(
        "Password must contain at least 10 characters."
      );
      return;
    }


    if (
      password !==
      confirmPassword
    ) {
      setMessage(
        "The passwords do not match."
      );
      return;
    }


    setLoading(true);

    try {
      const supabase =
        createClient();

      const {
        error,
      } =
        await supabase.auth
          .updateUser({
            password,
          });


      if (error) {
        throw error;
      }


      router.push(
        "/translator"
      );

      router.refresh();

    } catch {
      setMessage(
        "Unable to set the password. The invitation may have expired. Please request a new invitation."
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
            Set Portal Password
          </h1>

          <p className="mt-3 text-sm text-[#647269]">
            Create your secure Translator Portal password.
          </p>

        </div>


        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[#dce6df] bg-white p-8 shadow-sm"
        >

          <div>

            <label className="mb-2 block font-semibold">
              New password
            </label>

            <input
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-[#d5e0d8] px-4 py-4 outline-none focus:border-[#087f5b]"
            />

          </div>


          <div className="mt-5">

            <label className="mb-2 block font-semibold">
              Confirm password
            </label>

            <input
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-[#d5e0d8] px-4 py-4 outline-none focus:border-[#087f5b]"
            />

          </div>


          {message && (
            <div className="mt-5 rounded-xl bg-[#fff4d8] px-4 py-3 text-sm text-[#795c1b]">
              {message}
            </div>
          )}


          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full rounded-xl bg-[#087f5b] px-5 py-4 font-semibold text-white disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : "Set Password"}
          </button>

        </form>

      </div>

    </main>
  );
}