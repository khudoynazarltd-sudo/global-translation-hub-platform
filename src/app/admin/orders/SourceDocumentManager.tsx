"use client";

import {
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type SourceDocument = {
  id: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  status: string;
};

function readableStatus(
  status: string
) {
  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

export default function SourceDocumentManager({
  orderId,
  documents,
}: {
  orderId: string;
  documents: SourceDocument[];
}) {
  const router =
    useRouter();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [files, setFiles] =
    useState<File[]>([]);

  const [uploading, setUploading] =
    useState(false);

  const [
    deletingDocumentId,
    setDeletingDocumentId,
  ] =
    useState<string | null>(
      null
    );

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  async function uploadDocuments() {
    if (
      files.length === 0
    ) {
      return;
    }

    setUploading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const formData =
        new FormData();

      for (const file of files) {
        formData.append(
          "files",
          file
        );
      }

      const response =
        await fetch(
          `/api/admin/orders/${orderId}/source-documents`,
          {
            method: "POST",
            body:
              formData,
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
            "Unable to add source documents."
        );
      }

      setFiles([]);

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }

      setMessage(
        "Source documents added successfully. Regenerate the certified bundle before delivery."
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to add source documents."
      );
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(
    document: SourceDocument
  ) {
    const confirmed =
      window.confirm(
        `Delete "${document.original_filename}"? If a certified bundle already exists, it will need to be generated again.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingDocumentId(
      document.id
    );

    setMessage("");
    setErrorMessage("");

    try {
      const response =
        await fetch(
          `/api/admin/orders/${orderId}/source-documents?documentId=${encodeURIComponent(
            document.id
          )}`,
          {
            method:
              "DELETE",
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
            "Unable to delete the source document."
        );
      }

      setMessage(
        "Source document deleted successfully. Regenerate the certified bundle before delivery."
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete the source document."
      );
    } finally {
      setDeletingDocumentId(
        null
      );
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">
        Source Documents
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#65736b]">
        Add source documents or photographs received from the client.
        Changes to source documents require the certified bundle to be
        generated again before delivery.
      </p>

      <div className="mt-5 rounded-xl border border-[#dce6df] bg-[#fafcfb] p-4">
        <input
          ref={
            fileInputRef
          }
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.docx"
          onChange={(event) =>
            setFiles(
              Array.from(
                event.target.files ??
                  []
              )
            )
          }
          className="block w-full rounded-xl border border-[#d7e1da] bg-white p-3"
        />

        {files.length > 0 && (
          <div className="mt-3 text-sm text-[#607067]">
            Selected:{" "}
            <strong>
              {files.length}
            </strong>{" "}
            file
            {files.length === 1
              ? ""
              : "s"}
          </div>
        )}

        <button
          type="button"
          onClick={
            uploadDocuments
          }
          disabled={
            files.length === 0 ||
            uploading
          }
          className="mt-4 rounded-xl bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {uploading
            ? "Uploading..."
            : "Add Documents / Photos"}
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {documents.map(
          (document) => (
            <div
              key={
                document.id
              }
              className="flex flex-col gap-3 rounded-xl border border-[#e3ebe6] bg-[#fafcfb] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-semibold">
                  {
                    document.original_filename
                  }
                </div>

                <div className="mt-1 text-xs text-[#69766f]">
                  {
                    document.mime_type
                  }{" "}
                  ·{" "}
                  {(
                    Number(
                      document.file_size
                    ) /
                    1024 /
                    1024
                  ).toFixed(
                    2
                  )}{" "}
                  MB
                </div>

                <div className="mt-1 text-xs font-medium text-[#65736b]">
                  {readableStatus(
                    document.status
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`/api/admin/documents/${document.id}/view`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-[#087f5b] px-4 py-2 text-sm font-semibold text-white"
                >
                  View
                </a>

                <button
                  type="button"
                  onClick={() =>
                    deleteDocument(
                      document
                    )
                  }
                  disabled={
                    deletingDocumentId ===
                    document.id
                  }
                  className="rounded-lg border border-[#d7a59c] px-4 py-2 text-sm font-semibold text-[#a53d2d] disabled:opacity-50"
                >
                  {deletingDocumentId ===
                  document.id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </div>
          )
        )}

        {documents.length === 0 && (
          <div className="text-sm text-[#69766f]">
            No source documents found.
          </div>
        )}
      </div>

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
