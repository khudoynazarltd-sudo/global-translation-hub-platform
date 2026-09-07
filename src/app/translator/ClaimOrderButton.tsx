"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";


export default function ClaimOrderButton({
  orderId,
}: {
  orderId: string;
}) {
  const router =
    useRouter();

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");


  async function claimOrder() {
    const confirmed =
      window.confirm(
        "Claim this translation order?"
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response =
        await fetch(
          `/api/translator/orders/${orderId}/claim`,
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.message ||
            "Unable to claim order."
        );
      }

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to claim order."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <div>

      <button
        type="button"
        disabled={loading}
        onClick={claimOrder}
        className="rounded-xl bg-[#087f5b] px-5 py-3 font-semibold text-white transition hover:bg-[#066a4c] disabled:opacity-50"
      >
        {loading
          ? "Claiming..."
          : "Claim Order"}
      </button>

      {message && (
        <div className="mt-2 max-w-xs text-sm text-[#9a3f2f]">
          {message}
        </div>
      )}

    </div>
  );
}