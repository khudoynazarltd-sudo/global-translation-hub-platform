"use client";

import { useState } from "react";

export default function ClientAccessLink({
  orderId,
  bundleReady,
  clientEmail,
}: {
  orderId: string;
  bundleReady: boolean;
  clientEmail?: string | null;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function generateLink() {
    setLoading(true);
    setUrl("");
    setCopied(false);
    setMessage("");
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

  async function sendByEmail() {
    if (
      !bundleReady ||
      !clientEmail
    ) {
      return;
    }

    setSending(true);
    setCopied(false);
    setMessage("");
    setErrorMessage("");

    try {
      const response =
        await fetch(
          `/api/admin/orders/${orderId}/delivery`,
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (data.url) {
        setUrl(
          data.url
        );
      }

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.message ||
            "Unable to send the final translation email."
        );
      }

      setMessage(
        "Final translation email sent successfully."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to send the final translation email."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">
        Client Secure Access
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#65736b]">
        Generate or send a secure client link for the completed certified
        translation. Generating a new link revokes previously issued links
        for this order.
      </p>

      {!bundleReady && (
        <div className="mt-4 rounded-xl bg-[#f3f5f4] px-4 py-3 text-sm text-[#607067]">
          Generate the certified bundle before sending the final translation
          to the client.
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={generateLink}
          disabled={
            loading ||
            !bundleReady
          }
          className="rounded-xl bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Client Link"}
        </button>

        <button
          onClick={sendByEmail}
          disabled={
            sending ||
            !bundleReady ||
            !clientEmail
          }
          className="rounded-xl border border-[#087f5b] px-6 py-3 font-semibold text-[#087f5b] disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send to Client by Email"}
        </button>
      </div>

      {!clientEmail && (
        <div className="mt-3 text-sm text-[#9a6b32]">
          No client email address is available for this order.
        </div>
      )}

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
              Open Client Link
            </a>
          </div>
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