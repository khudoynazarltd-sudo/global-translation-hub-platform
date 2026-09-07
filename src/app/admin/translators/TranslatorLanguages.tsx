"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";


type LanguagePair = {
  id: string;
  source_language: string;
  target_language: string;
  active: boolean;
};


export default function TranslatorLanguages({
  translatorId,
  initialPairs,
}: {
  translatorId: string;
  initialPairs: LanguagePair[];
}) {
  const router =
    useRouter();

  const [sourceLanguage, setSourceLanguage] =
    useState("");

  const [targetLanguage, setTargetLanguage] =
    useState("English");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");


  async function addPair() {
    if (
      !sourceLanguage.trim() ||
      !targetLanguage.trim()
    ) {
      setMessage(
        "Please enter both languages."
      );

      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response =
        await fetch(
          `/api/admin/translators/${translatorId}/languages`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              sourceLanguage:
                sourceLanguage.trim(),

              targetLanguage:
                targetLanguage.trim(),
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
            "Unable to add language pair."
        );
      }

      setSourceLanguage("");
      setMessage(
        "Language pair added."
      );

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to add language pair."
      );
    } finally {
      setLoading(false);
    }
  }


  async function removePair(
    pairId: string
  ) {
    const confirmed =
      window.confirm(
        "Remove this language pair from the translator?"
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response =
        await fetch(
          `/api/admin/translators/${translatorId}/languages?pairId=${encodeURIComponent(
            pairId
          )}`,
          {
            method: "DELETE",
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
            "Unable to remove language pair."
        );
      }

      setMessage(
        "Language pair removed."
      );

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to remove language pair."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <section className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">
        Language Pairs
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#69766f]">
        The translator will only see available orders
        matching one of these active language directions.
      </p>


      <div className="mt-6 space-y-3">
        {initialPairs.map(
          (pair) => (
            <div
              key={pair.id}
              className="flex flex-col gap-3 rounded-xl border border-[#e3ebe6] bg-[#fafcfb] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-semibold">
                  {pair.source_language}
                  {" → "}
                  {pair.target_language}
                </div>

                <div className="mt-1 text-xs text-[#69766f]">
                  {pair.active
                    ? "Active"
                    : "Inactive"}
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  removePair(
                    pair.id
                  )
                }
                className="rounded-lg border border-[#d8aaa2] px-4 py-2 text-sm font-semibold text-[#9a3f2f] disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          )
        )}

        {initialPairs.length === 0 && (
          <div className="rounded-xl bg-[#fff4d8] p-4 text-sm text-[#8a6418]">
            No language pairs have been assigned.
          </div>
        )}
      </div>


      <div className="mt-7 border-t border-[#e3ebe6] pt-6">
        <div className="font-semibold">
          Add Language Pair
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Source Language
            </label>

            <input
              value={sourceLanguage}
              onChange={(event) =>
                setSourceLanguage(
                  event.target.value
                )
              }
              placeholder="e.g. Tajik"
              className="w-full rounded-xl border border-[#d7e1da] px-4 py-3 outline-none focus:border-[#087f5b]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Target Language
            </label>

            <input
              value={targetLanguage}
              onChange={(event) =>
                setTargetLanguage(
                  event.target.value
                )
              }
              placeholder="e.g. English"
              className="w-full rounded-xl border border-[#d7e1da] px-4 py-3 outline-none focus:border-[#087f5b]"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={addPair}
          className="mt-4 rounded-xl bg-[#087f5b] px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : "Add Language Pair"}
        </button>

        {message && (
          <div className="mt-3 text-sm text-[#607067]">
            {message}
          </div>
        )}
      </div>
    </section>
  );
}