"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CertificateActions({
  orderId,
  certificateStatus,
}: {
  orderId: string;
  certificateStatus: string;
}) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  async function approveCertificate() {
    const confirmed = window.confirm(
      "Approve this Certificate of Translation Accuracy? Please confirm that you have reviewed all certificate details before approval."
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/certificate/approve`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ||
            "Unable to approve certificate."
        );
      }

      setMessage(
        "Certificate approved successfully."
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to approve certificate."
      );
    } finally {
      setLoading(false);
    }
  }

  async function generateBundle() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/certificate/generate`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ||
            "Unable to generate certified bundle."
        );
      }

      setMessage(
        "Certified bundle generated successfully."
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate certified bundle."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">
        Certificate Approval & Bundle
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#65736b]">
        Approval confirms that you have reviewed the
        certificate details. The certified bundle can only
        be generated after approval.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        {certificateStatus === "draft" && (
          <button
            onClick={approveCertificate}
            disabled={loading}
            className="rounded-xl border border-[#087f5b] px-6 py-3 font-semibold text-[#087f5b] disabled:opacity-50"
          >
            Approve Certificate
          </button>
        )}

        {certificateStatus === "approved" && (
          <button
            onClick={generateBundle}
            disabled={loading}
            className="rounded-xl bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            Generate Certified Bundle
          </button>
        )}
        
        {certificateStatus === "issued" && (
          <button
            onClick={generateBundle}
            disabled={loading}
            className="rounded-xl bg-[#102b20] px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            Regenerate Certified Bundle
          </button>
        )}
      </div>

      {loading && (
        <div className="mt-4 text-sm text-[#65736b]">
          Processing...
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-xl bg-[#eaf8f0] px-4 py-3 text-sm font-medium text-[#087f5b]">
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