"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const statuses = [
  ["awaiting_processing", "Awaiting Processing"],
  ["assigned", "Assigned"],
  ["in_translation", "In Translation"],
  ["quality_check", "Quality Check"],
  ["certification", "Certification"],
  ["ready", "Ready"],
  ["delivered", "Delivered"],
];

export default function StatusControls({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function updateStatus() {
    setSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message || "Unable to update status."
        );
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update status."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">
        Update Order Status
      </h2>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="flex-1 rounded-xl border border-[#d7e1da] bg-white px-4 py-3"
        >
          {statuses.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button
          onClick={updateStatus}
          disabled={saving}
          className="rounded-xl bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Updating..." : "Update Status"}
        </button>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-xl bg-[#fff0ed] px-4 py-3 text-sm text-[#9a3f2f]">
          {errorMessage}
        </div>
      )}
    </div>
  );
}