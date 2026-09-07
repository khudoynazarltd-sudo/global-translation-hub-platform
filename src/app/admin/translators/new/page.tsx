"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";


export default function NewTranslatorPage() {
  const router =
    useRouter();

  const [legalName, setLegalName] =
    useState("");

  const [displayName, setDisplayName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [telephone, setTelephone] =
    useState("");

  const [credentials, setCredentials] =
    useState("");

  const [membershipBody, setMembershipBody] =
    useState("");

  const [membershipNumber, setMembershipNumber] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");


  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response =
        await fetch(
          "/api/admin/translators",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              legalName,
              displayName,
              email,
              telephone,
              credentials,
              membershipBody,
              membershipNumber,
              notes,
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
            "Unable to create translator."
        );
      }

      router.push(
        `/admin/translators/${data.translator.id}`
      );

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create translator."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="min-h-screen bg-[#f5f8f6] px-6 py-10 text-[#13201a]">
      <div className="mx-auto max-w-3xl">

        <a
          href="/admin/translators"
          className="text-sm font-semibold text-[#087f5b]"
        >
          ← Translators
        </a>

        <div className="mt-5">

          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
            Administration
          </div>

          <h1 className="mt-2 text-4xl font-bold">
            Add Translator
          </h1>

          <p className="mt-3 text-[#69766f]">
            Create a translator profile for order
            assignment and certificate generation.
          </p>

        </div>


        <form
          onSubmit={submit}
          className="mt-8 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm"
        >

          <div className="grid gap-5 sm:grid-cols-2">

            <Field
              label="Legal Name"
              value={legalName}
              required
              onChange={setLegalName}
            />

            <Field
              label="Certificate Display Name"
              value={displayName}
              required
              onChange={setDisplayName}
            />

            <Field
              label="Email"
              value={email}
              type="email"
              onChange={setEmail}
            />

            <Field
              label="Telephone"
              value={telephone}
              onChange={setTelephone}
            />

            <Field
              label="Credentials"
              value={credentials}
              onChange={setCredentials}
            />

            <Field
              label="Membership Body"
              value={membershipBody}
              onChange={setMembershipBody}
            />

            <Field
              label="Membership Number"
              value={membershipNumber}
              onChange={setMembershipNumber}
            />

          </div>


          <div className="mt-5">

            <label className="mb-2 block text-sm font-semibold">
              Notes
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              rows={4}
              className="w-full rounded-xl border border-[#d7e1da] px-4 py-3 outline-none focus:border-[#087f5b]"
            />

          </div>


          {message && (
            <div className="mt-5 rounded-xl bg-[#fff0ed] px-4 py-3 text-sm text-[#9a3f2f]">
              {message}
            </div>
          )}


          <button
            type="submit"
            disabled={loading}
            className="mt-6 rounded-xl bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading
              ? "Creating..."
              : "Create Translator"}
          </button>

        </form>

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