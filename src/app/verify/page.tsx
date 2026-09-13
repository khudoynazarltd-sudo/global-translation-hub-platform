"use client";

import {
  FormEvent,
  useState,
} from "react";

type VerificationResult = {
  ok: boolean;
  valid?: boolean;

  certificate?: {
    reference: string;
    orderReference: string | null;
    documentTitle: string | null;
    sourceLanguage: string;
    targetLanguage: string;
    certificationDate: string | null;
    company: string;
    companyNumber: string;
  };

  message?: string;
};

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Not specified";
  }

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

export default function VerifyPage() {
  const [reference, setReference] =
    useState("");

  const [result, setResult] =
    useState<VerificationResult | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  async function verifyCertificate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/verify?reference=${encodeURIComponent(
          reference.trim()
        )}`,
        {
          cache: "no-store",
        }
      );

      const data: VerificationResult =
        await response.json();

      setResult(data);
    } catch {
      setResult({
        ok: false,
        message:
          "Unable to verify certificate.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f8f6] px-6 py-16 text-[#13201a]">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
            GLOBAL TRANSLATION HUB
          </div>

          <h1 className="mt-3 text-4xl font-bold">
            Verify a Translation Certificate
          </h1>

          <p className="mt-4 leading-7 text-[#607067]">
            Enter the Certificate Reference shown
            on the Certificate of Translation Accuracy.
          </p>
        </div>

        <form
          onSubmit={verifyCertificate}
          className="mt-10 rounded-3xl border border-[#dce6df] bg-white p-8 shadow-sm"
        >
          <label className="block text-sm font-semibold">
            Certificate Reference
          </label>

          <input
            value={reference}
            onChange={(event) =>
              setReference(
                event.target.value
              )
            }
            placeholder="GTH-CERT-2026-09-001"
            required
            className="mt-3 w-full rounded-xl border border-[#d7e1da] px-4 py-4 uppercase outline-none focus:border-[#087f5b]"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-[#087f5b] px-6 py-4 font-semibold text-white disabled:opacity-50"
          >
            {loading
              ? "Verifying..."
              : "Verify Certificate"}
          </button>
        </form>

        {result?.ok &&
          result.valid &&
          result.certificate && (
            <section className="mt-8 rounded-3xl border border-[#b9d8c7] bg-white p-8 shadow-sm">
              <div className="inline-flex rounded-full bg-[#eaf8f0] px-4 py-2 text-sm font-semibold text-[#087f5b]">
                Valid Certificate
              </div>

              <h2 className="mt-5 text-2xl font-bold">
                Certificate verified
              </h2>

              <p className="mt-3 leading-7 text-[#607067]">
                This certificate was issued by
                GLOBAL TRANSLATION HUB.
              </p>

              <dl className="mt-7 grid gap-5 sm:grid-cols-2">
                <Info
                  label="Certificate Reference"
                  value={
                    result.certificate
                      .reference
                  }
                />

                <Info
                  label="Order Reference"
                  value={
                    result.certificate
                      .orderReference
                  }
                />

                <Info
                  label="Document Title"
                  value={
                    result.certificate
                      .documentTitle
                  }
                />

                <Info
                  label="Language Pair"
                  value={`${result.certificate.sourceLanguage} → ${result.certificate.targetLanguage}`}
                />

                <Info
                  label="Certification Date"
                  value={formatDate(
                    result.certificate
                      .certificationDate
                  )}
                />

                <Info
                  label="Translation Provider"
                  value={
                    result.certificate
                      .company
                  }
                />

                <Info
                  label="Company No."
                  value={
                    result.certificate
                      .companyNumber
                  }
                />
              </dl>
            </section>
          )}

        {result?.ok &&
          result.valid === false && (
            <section className="mt-8 rounded-3xl border border-[#ead9d6] bg-white p-8 shadow-sm">
              <div className="inline-flex rounded-full bg-[#fff0ed] px-4 py-2 text-sm font-semibold text-[#9a3f2f]">
                Certificate Not Verified
              </div>

              <h2 className="mt-5 text-2xl font-bold">
                No valid issued certificate was found
              </h2>

              <p className="mt-3 leading-7 text-[#607067]">
                Please check the Certificate Reference
                carefully. If you require assistance,
                contact GLOBAL TRANSLATION HUB.
              </p>
            </section>
          )}

        {result &&
          !result.ok && (
            <section className="mt-8 rounded-3xl border border-[#ead9d6] bg-white p-8 text-[#9a3f2f] shadow-sm">
              {result.message ||
                "Unable to verify certificate."}
            </section>
          )}

        <p className="mt-8 text-center text-xs leading-5 text-[#69766f]">
          Verification confirms that the stated
          Certificate of Translation Accuracy was issued
          through the GLOBAL TRANSLATION HUB system.
          It does not authenticate the source document
          itself.
        </p>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-[#69766f]">
        {label}
      </dt>

      <dd className="mt-1 font-semibold">
        {value || "Not specified"}
      </dd>
    </div>
  );
}