"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";


type Translator = {
  id: string;
  display_name: string;
  credentials: string | null;
  membership_body: string | null;
  membership_number: string | null;
};


export default function TranslatorAssignment({
  orderId,
  assignedTranslatorId,
  translators,
}: {
  orderId: string;
  assignedTranslatorId: string | null;
  translators: Translator[];
}) {
  const router =
    useRouter();

  const [selectedId, setSelectedId] =
    useState(
      assignedTranslatorId ?? ""
    );

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");


  async function saveAssignment() {
    setSaving(true);
    setMessage("");

    try {
      const response =
        await fetch(
          `/api/admin/orders/${orderId}/translator`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              translatorId:
                selectedId ||
                null,
            }),
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
            "Unable to assign translator."
        );
      }

      setMessage(
        "Translator assignment saved."
      );

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to assign translator."
      );
    } finally {
      setSaving(false);
    }
  }


  const selectedTranslator =
    translators.find(
      (translator) =>
        translator.id ===
        selectedId
    );


  return (
    <div className="mt-6 rounded-2xl border border-[#dce6df] bg-[#fafcfb] p-5">
      <div className="text-sm font-semibold uppercase tracking-[0.12em] text-[#087f5b]">
        Assigned Translator
      </div>

      <select
        value={selectedId}
        onChange={(event) =>
          setSelectedId(
            event.target.value
          )
        }
        className="mt-4 w-full rounded-xl border border-[#d7e1da] bg-white px-4 py-3"
      >
        <option value="">
          Select translator
        </option>

        {translators.map(
          (translator) => (
            <option
              key={translator.id}
              value={translator.id}
            >
              {translator.display_name}
            </option>
          )
        )}
      </select>


      {selectedTranslator && (
        <div className="mt-4 rounded-xl bg-white p-4 text-sm leading-6">
          <div className="font-semibold">
            {
              selectedTranslator.display_name
            }
          </div>

          {selectedTranslator.membership_body && (
            <div className="mt-1 text-[#607067]">
              {
                selectedTranslator.membership_body
              }
            </div>
          )}

          {selectedTranslator.membership_number && (
            <div className="text-[#607067]">
              Membership No.{" "}
              {
                selectedTranslator.membership_number
              }
            </div>
          )}

          {selectedTranslator.credentials && (
            <div className="text-[#607067]">
              Credentials:{" "}
              {
                selectedTranslator.credentials
              }
            </div>
          )}
        </div>
      )}


      <button
        type="button"
        onClick={saveAssignment}
        disabled={saving}
        className="mt-4 rounded-xl bg-[#087f5b] px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {saving
          ? "Saving..."
          : "Save Translator"}
      </button>


      {message && (
        <div className="mt-3 text-sm text-[#607067]">
          {message}
        </div>
      )}
    </div>
  );
}