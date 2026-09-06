"use client";

import { useState } from "react";

export default function ClientAccessLink({
  orderId,
}: {
  orderId: string;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function generateLink() {
    setLoading(true);
    setUrl("");
    setCopied(false);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/client-link`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok || !data.url) {
        throw new Error(
          data.message || "Unable to generate client access link."
        );
      }

      setUrl(data.url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate client access link."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!url) return;

    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <section className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">
        Client Secure Access
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#65736b]">
        Generate a private order-tracking link for the client. Generating a
        new link revokes previously issued links for this order.
      </p>

      <button
        onClick={generateLink}
        disabled={loading}
        className="mt-5 rounded-xl bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Client Access Link"}
      </button>

      {url && (
        <div className="mt-5 rounded-xl bg-[#f5f8f6] p-4">
          <div className="break-all text-sm text-[#4f5f56]">
            {url}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={copyLink}
              className="rounded-lg border border-[#b9cec0] px-4 py-2 text-sm font-semibold"
            >
              {copied ? "Copied" : "Copy Link"}
            </button>

            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-[#102b20] px-4 py-2 text-sm font-semibold text-white"
            >
              Open Client Portal
            </a>
          </div>
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