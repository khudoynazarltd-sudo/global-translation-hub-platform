"use client";

import { useEffect, useState } from "react";

type Certificate = {
  certificate_reference: string;
  document_title: string | null;
  number_of_pages: number | null;
  client_name: string | null;
  source_language: string;
  target_language: string;
  date_assigned: string | null;
  date_returned: string | null;
  certification_date: string | null;
  certification_statement: string | null;
  status: string;
};

export default function CertificateDetails({
  orderId,
}: {
  orderId: string;
}) {
  const [certificate, setCertificate] =
    useState<Certificate | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    async function loadCertificate() {
      try {
        const response = await fetch(
          `/api/admin/orders/${orderId}/certificate`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(
            data.message ||
              "Unable to load certificate."
          );
        }

        setCertificate(data.certificate);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load certificate."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCertificate();
  }, [orderId]);

  async function saveCertificate() {
    if (!certificate) {
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/certificate`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            documentTitle:
              certificate.document_title,

            numberOfPages:
              certificate.number_of_pages,

            clientName:
              certificate.client_name,

            sourceLanguage:
              certificate.source_language,

            targetLanguage:
              certificate.target_language,

            dateAssigned:
              certificate.date_assigned,

            dateReturned:
              certificate.date_returned,

            certificationDate:
              certificate.certification_date,

            certificationStatement:
              certificate.certification_statement,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ||
            "Unable to save certificate."
        );
      }

      setCertificate(data.certificate);

      setMessage(
        "Certificate details saved successfully."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save certificate."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">
        Loading certificate details...
      </section>
    );
  }

  if (!certificate) {
    return (
      <section className="mt-6 rounded-2xl border border-[#ead9d6] bg-white p-6 shadow-sm">
        {errorMessage ||
          "Certificate draft is unavailable."}
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">
            Certificate Details
          </h2>

          <p className="mt-2 text-sm text-[#65736b]">
            Review these details before generating
            the certified bundle.
          </p>
        </div>

        <div className="rounded-full bg-[#f0f6f2] px-4 py-2 text-sm font-semibold text-[#087f5b]">
          {certificate.status}
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-[#f5f8f6] p-4">
        <div className="text-sm text-[#69766f]">
          Certificate Reference
        </div>

        <div className="mt-1 font-bold text-[#087f5b]">
          {certificate.certificate_reference}
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field
          label="Document Title"
          value={
            certificate.document_title ?? ""
          }
          onChange={(value) =>
            setCertificate({
              ...certificate,
              document_title: value,
            })
          }
        />

        <Field
          label="Number of Pages"
          value={String(
            certificate.number_of_pages ?? 1
          )}
          type="number"
          onChange={(value) =>
            setCertificate({
              ...certificate,
              number_of_pages:
                Number(value) || 1,
            })
          }
        />

        <Field
          label="Client Name"
          value={
            certificate.client_name ?? ""
          }
          onChange={(value) =>
            setCertificate({
              ...certificate,
              client_name: value,
            })
          }
        />

        <Field
          label="Source Language"
          value={
            certificate.source_language
          }
          onChange={(value) =>
            setCertificate({
              ...certificate,
              source_language: value,
            })
          }
        />

        <Field
          label="Target Language"
          value={
            certificate.target_language
          }
          onChange={(value) =>
            setCertificate({
              ...certificate,
              target_language: value,
            })
          }
        />

        <Field
          label="Date Assigned"
          value={
            certificate.date_assigned ?? ""
          }
          type="date"
          onChange={(value) =>
            setCertificate({
              ...certificate,
              date_assigned: value,
            })
          }
        />

        <Field
          label="Date Returned"
          value={
            certificate.date_returned ?? ""
          }
          type="date"
          onChange={(value) =>
            setCertificate({
              ...certificate,
              date_returned: value,
            })
          }
        />

        <Field
          label="Certification Date"
          value={
            certificate.certification_date ??
            ""
          }
          type="date"
          onChange={(value) =>
            setCertificate({
              ...certificate,
              certification_date: value,
            })
          }
        />
      </div>

      <div className="mt-6">
        <label className="mb-2 block text-sm font-semibold">
          Certification Statement
        </label>

        <textarea
          rows={7}
          value={
            certificate.certification_statement ??
            ""
          }
          onChange={(event) =>
            setCertificate({
              ...certificate,
              certification_statement:
                event.target.value,
            })
          }
          className="w-full rounded-xl border border-[#d7e1da] px-4 py-3 leading-6 outline-none focus:border-[#087f5b]"
        />
      </div>

      <button
        onClick={saveCertificate}
        disabled={saving}
        className="mt-6 rounded-xl bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {saving
          ? "Saving..."
          : "Save Certificate Details"}
      </button>

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

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-[#d7e1da] px-4 py-3 outline-none focus:border-[#087f5b]"
      />
    </div>
  );
}
