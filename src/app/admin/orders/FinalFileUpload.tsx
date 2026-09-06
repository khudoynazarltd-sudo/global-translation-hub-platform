"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FinalFileUpload({
  orderId,
}: {
  orderId: string;
}) {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function uploadFile() {
    if (!file) return;

    setUploading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/admin/orders/${orderId}/final-file`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message || "Unable to upload final translation."
        );
      }

      setMessage("Final translation uploaded successfully.");
      setFile(null);

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload final translation."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">
        Upload Final Translation
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#65736b]">
        Upload the completed translation file after translation and quality
        control.
      </p>

      <input
        type="file"
        accept=".pdf,.docx"
        onChange={(event) =>
          setFile(event.target.files?.[0] ?? null)
        }
        className="mt-5 block w-full rounded-xl border border-[#d7e1da] bg-white p-3"
      />

      {file && (
        <div className="mt-3 text-sm text-[#607067]">
          Selected: <strong>{file.name}</strong>
        </div>
      )}

      <button
        onClick={uploadFile}
        disabled={!file || uploading}
        className="mt-5 rounded-xl bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload Final Translation"}
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