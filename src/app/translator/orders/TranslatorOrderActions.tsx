"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";


export default function TranslatorOrderActions({
  orderId,
  currentStatus,
  hasFinalTranslation,
}: {
  orderId: string;
  currentStatus: string;
  hasFinalTranslation: boolean;
}) {
  const router =
    useRouter();

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");


  async function changeStatus(
    status: string
  ) {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response =
        await fetch(
          `/api/translator/orders/${orderId}/status`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status,
            }),
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
            "Unable to update order status."
        );
      }


      setMessage(
        "Order status updated."
      );

      router.refresh();

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update order status."
      );
    } finally {
      setLoading(false);
    }
  }


  const canStartTranslation =
    currentStatus ===
      "awaiting_processing" ||
    currentStatus ===
      "assigned";


  const canSubmitQualityCheck =
    currentStatus ===
      "in_translation" &&
    hasFinalTranslation;


  return (
    <section className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

      <h2 className="text-xl font-bold">
        Translation Workflow
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#69766f]">
        Update the order only when the corresponding
        stage of translation work has been completed.
      </p>


      <div className="mt-5">

        <div className="text-sm text-[#69766f]">
          Current Status
        </div>

        <div className="mt-1 font-semibold">
          {currentStatus}
        </div>

      </div>


      {canStartTranslation && (
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            changeStatus(
              "in_translation"
            )
          }
          className="mt-5 rounded-xl bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading
            ? "Updating..."
            : "Start Translation"}
        </button>
      )}


      {currentStatus ===
        "in_translation" &&
        !hasFinalTranslation && (
          <div className="mt-5 rounded-xl bg-[#fff4d8] px-4 py-3 text-sm text-[#795c1b]">
            Upload the completed translation before
            submitting the order for Quality Check.
          </div>
        )}


      {canSubmitQualityCheck && (
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            changeStatus(
              "quality_check"
            )
          }
          className="mt-5 rounded-xl bg-[#102b20] px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading
            ? "Submitting..."
            : "Submit for Quality Check"}
        </button>
      )}


      {currentStatus ===
        "quality_check" && (
          <div className="mt-5 rounded-xl bg-[#eef7f2] px-4 py-3 text-sm font-medium text-[#087f5b]">
            This translation has been submitted for
            Quality Check. Further changes require
            administrative review.
          </div>
        )}


      {message && (
        <div className="mt-4 rounded-xl bg-[#eaf8f0] px-4 py-3 text-sm text-[#087f5b]">
          {message}
        </div>
      )}


      {errorMessage && (
        <div className="mt-4 rounded-xl bg-[#fff0ed] px-4 py-3 text-sm text-[#9a3f2f]">
          {errorMessage}
        </div>
      )}

    </section>
  );
}