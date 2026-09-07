"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TranslatorPortalAccess({
  translatorId,
  email,
  connected,
}: {
  translatorId: string;
  email: string | null;
  connected: boolean;
}) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");


  async function createAccess() {
    if (!email) {
      setMessage(
        "Please add the translator's email address first."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Send Translator Portal invitation to ${email}?`
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response =
        await fetch(
          `/api/admin/translators/${translatorId}/portal-access`,
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ||
            "Unable to create portal access."
        );
      }

      setMessage(
        data.message ||
          "Portal invitation sent."
      );

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create portal access."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <section
      id="portal-access"
      className="mt-6 scroll-mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm"
    >

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>

          <h2 className="text-xl font-bold">
            Translator Portal Access
          </h2>

          <p className="mt-2 text-sm text-[#69766f]">
            Secure login access for the Translator Portal.
          </p>
        </div>

        <span
          className={
            connected
              ? "rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-semibold text-[#087f5b]"
              : "rounded-full bg-[#fff4d8] px-3 py-1 text-xs font-semibold text-[#8a6418]"
          }
        >
          {connected
            ? "Connected"
            : "Not connected"}
        </span>

      </div>


      <div className="mt-5 rounded-xl bg-[#f7faf8] p-4">

        <div className="text-xs font-semibold uppercase tracking-wide text-[#69766f]">
          Login Email
        </div>

        <div className="mt-1 font-semibold">
          {email || "No email address provided"}
        </div>

      </div>


      {!connected && (
        <button
          type="button"
          disabled={loading || !email}
          onClick={createAccess}
          className="mt-5 rounded-xl bg-[#087f5b] px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading
            ? "Sending invitation..."
            : "Create Portal Access"}
        </button>
      )}


      {connected && (
        <div className="mt-5 text-sm leading-6 text-[#607067]">
          This translator profile is connected to a
          Supabase authentication account.
        </div>
      )}


      {message && (
        <div className="mt-4 text-sm text-[#607067]">
          {message}
        </div>
      )}

    </section>
  );
}