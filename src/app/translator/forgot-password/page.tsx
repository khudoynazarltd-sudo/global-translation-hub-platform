"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  createClient,
} from "@/lib/supabase/client";


export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");


  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");


    const supabase =
      createClient();


    const siteUrl =
      window.location.origin;


    const {
      error,
    } =
      await supabase.auth
        .resetPasswordForEmail(
          email.trim(),
          {
            redirectTo:
              `${siteUrl}/auth/callback?next=${encodeURIComponent(
                "/translator/set-password"
              )}`,
          }
        );


    if (error) {
      setMessage(
        error.message
      );
    } else {
      setMessage(
        "Password reset email sent. Please check your inbox."
      );
    }


    setLoading(false);
  }


  return (
    <main className="min-h-screen bg-[#f3f7f4] px-6 py-20 text-[#13201a]">

      <div className="mx-auto max-w-md">

        <div className="text-center">

          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
            GLOBAL TRANSLATION HUB
          </div>

          <h1 className="mt-3 text-3xl font-bold">
            Reset Translator Password
          </h1>

        </div>


        <form
          onSubmit={submit}
          className="mt-8 rounded-3xl border border-[#dce6df] bg-white p-8 shadow-sm"
        >

          <label className="block font-semibold">
            Email address
          </label>

          <input
            type="email"
            required
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            className="mt-2 w-full rounded-xl border border-[#d5e0d8] px-4 py-4 outline-none focus:border-[#087f5b]"
          />


          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-[#087f5b] px-5 py-4 font-semibold text-white disabled:opacity-50"
          >
            {loading
              ? "Sending..."
              : "Send Reset Link"}
          </button>


          {message && (
            <div className="mt-5 text-sm text-[#607067]">
              {message}
            </div>
          )}

        </form>

      </div>

    </main>
  );
}