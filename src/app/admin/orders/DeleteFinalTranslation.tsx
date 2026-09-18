"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

export default function DeleteFinalTranslation({
  orderId,
  documentId,
  filename,
}: {
  orderId: string;
  documentId: string;
  filename: string;
}) {
  const router =
    useRouter();

  const [deleting, setDeleting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function deleteTranslation() {
    const confirmed =
      window.confirm(
        `Delete "${filename}"? If a certified bundle already exists, it will also be invalidated and must be generated again.`
      );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");

    try {
      const response =
        await fetch(
          `/api/admin/orders/${orderId}/final-file?documentId=${encodeURIComponent(
            documentId
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
            "Unable to delete translation."
        );
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete translation."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={
          deleteTranslation
        }
        disabled={
          deleting
        }
        className="rounded-lg border border-[#d7a59c] px-4 py-2 text-sm font-semibold text-[#a53d2d] disabled:opacity-50"
      >
        {deleting
          ? "Deleting..."
          : "Delete Translation"}
      </button>

      {errorMessage && (
        <div className="mt-2 max-w-xs text-xs text-[#9a3f2f]">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
