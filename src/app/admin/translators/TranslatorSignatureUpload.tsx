"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";


export default function TranslatorSignatureUpload({
  translatorId,
  hasSignature,
}: {
  translatorId: string;
  hasSignature: boolean;
}) {
  const router =
    useRouter();

  const [file, setFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");


  async function uploadSignature() {
    if (!file) {
      setMessage(
        "Please select a PNG signature image."
      );

      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          `/api/admin/translators/${translatorId}/signature`,
          {
            method: "POST",
            body: formData,
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
            "Unable to upload signature."
        );
      }

      setFile(null);

      setMessage(
        "Signature uploaded."
      );

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload signature."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <section className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

      <h2 className="text-xl font-bold">
        Translator Signature
      </h2>

      <p className="mt-2 text-sm text-[#69766f]">
        This signature will be used on certificates
        issued for orders assigned to this translator.
      </p>


      <div className="mt-4 text-sm font-semibold">
        Current status:{" "}
        {hasSignature
          ? "Uploaded"
          : "Not uploaded"}
      </div>


      <input
        type="file"
        accept="image/png"
        onChange={(event) =>
          setFile(
            event.target.files?.[0] ??
              null
          )
        }
        className="mt-5 block w-full rounded-xl border border-[#d7e1da] bg-white p-3"
      />


      <button
        type="button"
        disabled={loading}
        onClick={uploadSignature}
        className="mt-4 rounded-xl bg-[#087f5b] px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading
          ? "Uploading..."
          : hasSignature
            ? "Replace Signature"
            : "Upload Signature"}
      </button>


      {message && (
        <div className="mt-3 text-sm text-[#607067]">
          {message}
        </div>
      )}

    </section>
  );
}