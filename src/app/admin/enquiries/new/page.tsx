"use client";

import {
  FormEvent,
  useState,
} from "react";

type Result = {
  enquiryId: string;
  amount: number;
  checkoutUrl?: string;
};

export default function NewManualEnquiryPage() {
  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [telephone, setTelephone] =
    useState("");

  const [
    sourceLanguage,
    setSourceLanguage,
  ] = useState("");

  const [
    targetLanguage,
    setTargetLanguage,
  ] = useState("English");

  const [
    documentType,
    setDocumentType,
  ] = useState("");

  const [purpose, setPurpose] =
    useState("");

  const [
    turnaround,
    setTurnaround,
  ] = useState("Standard");

  const [price, setPrice] =
    useState("");

  const [file, setFile] =
    useState<File | null>(null);

  const [result, setResult] =
    useState<Result | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  async function createEnquiry(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!file) {
      setErrorMessage(
        "Please select the source document."
      );

      return;
    }

    setLoading(true);
    setErrorMessage("");
    setResult(null);
    setCopied(false);

    try {
      const formData =
        new FormData();

      formData.append(
        "fullName",
        fullName.trim()
      );

      formData.append(
        "email",
        email.trim()
      );

      formData.append(
        "telephone",
        telephone.trim()
      );

      formData.append(
        "sourceLanguage",
        sourceLanguage.trim()
      );

      formData.append(
        "targetLanguage",
        targetLanguage.trim()
      );

      formData.append(
        "documentType",
        documentType.trim()
      );

      formData.append(
        "purpose",
        purpose.trim()
      );

      formData.append(
        "turnaround",
        turnaround
      );

      formData.append(
        "price",
        price
      );

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/admin/enquiries/manual",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.ok ||
        !data.enquiryId
      ) {
        throw new Error(
          data.message ||
            "Unable to create enquiry."
        );
      }

      const checkoutResponse =
        await fetch(
          "/api/checkout",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              enquiryId:
                data.enquiryId,
            }),
          }
        );

      const checkoutData =
        await checkoutResponse.json();

      if (
        !checkoutResponse.ok ||
        !checkoutData.ok ||
        !checkoutData.checkoutUrl
      ) {
        throw new Error(
          checkoutData.message ||
            "The enquiry was created, but the payment link could not be generated."
        );
      }

      setResult({
        enquiryId:
          data.enquiryId,

        amount:
          data.amount,

        checkoutUrl:
          checkoutData.checkoutUrl,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create enquiry."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyPaymentLink() {
    if (!result?.checkoutUrl) {
      return;
    }

    await navigator.clipboard.writeText(
      result.checkoutUrl
    );

    setCopied(true);
  }

  return (
    <main className="min-h-screen bg-[#f5f8f6] px-6 py-10 text-[#13201a]">
      <div className="mx-auto max-w-4xl">
        <a
          href="/admin"
          className="text-sm font-semibold text-[#087f5b]"
        >
          ← Dashboard
        </a>

        <div className="mt-4">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
            Administration
          </div>

          <h1 className="mt-2 text-4xl font-bold">
            New Manual Enquiry
          </h1>

          <p className="mt-3 leading-7 text-[#607067]">
            Create a quotation for a client who contacted
            GLOBAL TRANSLATION HUB directly by email,
            telephone or another offline channel.
          </p>
        </div>

        <form
          onSubmit={createEnquiry}
          className="mt-8 rounded-3xl border border-[#dce6df] bg-white p-8 shadow-sm"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Client Name"
              value={fullName}
              required
              onChange={setFullName}
            />

            <Field
              label="Email"
              value={email}
              type="email"
              required
              onChange={setEmail}
            />

            <Field
              label="Telephone"
              value={telephone}
              onChange={setTelephone}
            />

            <Field
              label="Source Language"
              value={sourceLanguage}
              required
              onChange={setSourceLanguage}
            />

            <Field
              label="Target Language"
              value={targetLanguage}
              required
              onChange={setTargetLanguage}
            />

            <Field
              label="Document Type"
              value={documentType}
              required
              onChange={setDocumentType}
            />

            <Field
              label="Purpose"
              value={purpose}
              onChange={setPurpose}
            />

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Turnaround
              </label>

              <select
                value={turnaround}
                onChange={(event) =>
                  setTurnaround(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-[#d7e1da] bg-white px-4 py-3"
              >
                <option value="Standard">
                  Standard
                </option>

                <option value="Priority">
                  Priority
                </option>
              </select>
            </div>

            <Field
              label="Price (£)"
              value={price}
              type="number"
              required
              onChange={setPrice}
            />
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold">
              Source Document
            </label>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              required
              onChange={(event) =>
                setFile(
                  event.target.files?.[0] ??
                    null
                )
              }
              className="block w-full rounded-xl border border-[#d7e1da] bg-white p-3"
            />
          </div>

          {errorMessage && (
            <div className="mt-5 rounded-xl bg-[#fff0ed] px-4 py-3 text-sm text-[#9a3f2f]">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-7 rounded-xl bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading
              ? "Creating..."
              : "Create Enquiry & Payment Link"}
          </button>
        </form>

        {result?.checkoutUrl && (
          <section className="mt-6 rounded-3xl border border-[#b9d8c7] bg-white p-8 shadow-sm">
            <div className="inline-flex rounded-full bg-[#eaf8f0] px-4 py-2 text-sm font-semibold text-[#087f5b]">
              Payment Link Ready
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              Send this secure payment link to the client
            </h2>

            <div className="mt-5 rounded-xl bg-[#f5f8f6] p-4">
              <div className="text-sm text-[#65736b]">
                Quotation
              </div>

              <div className="mt-1 text-2xl font-bold">
                £{Number(
                  result.amount
                ).toFixed(2)}
              </div>
            </div>

            <div className="mt-5 break-all rounded-xl border border-[#dce6df] p-4 text-sm">
              {result.checkoutUrl}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={copyPaymentLink}
                type="button"
                className="rounded-xl border border-[#087f5b] px-5 py-3 font-semibold text-[#087f5b]"
              >
                {copied
                  ? "Copied"
                  : "Copy Payment Link"}
              </button>

              <a
                href={result.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-[#102b20] px-5 py-3 font-semibold text-white"
              >
                Open Payment Page
              </a>
            </div>

            <p className="mt-5 text-sm leading-6 text-[#65736b]">
              No order reference has been created yet.
              The GTH order reference will only be issued
              after Stripe confirms successful payment.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        step={
          type === "number"
            ? "0.01"
            : undefined
        }
        min={
          type === "number"
            ? "0.01"
            : undefined
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-[#d7e1da] px-4 py-3 outline-none focus:border-[#087f5b]"
      />
    </div>
  );
}
