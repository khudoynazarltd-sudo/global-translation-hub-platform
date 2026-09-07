"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";


type Translator = {
  id: string;
  active: boolean;
  legal_name: string;
  display_name: string;
  email: string | null;
  telephone: string | null;
  credentials: string | null;
  membership_body: string | null;
  membership_number: string | null;
  notes: string | null;
};


export default function TranslatorProfileForm({
  translator,
}: {
  translator: Translator;
}) {
  const router =
    useRouter();

  const [legalName, setLegalName] =
    useState(
      translator.legal_name
    );

  const [displayName, setDisplayName] =
    useState(
      translator.display_name
    );

  const [email, setEmail] =
    useState(
      translator.email ?? ""
    );

  const [telephone, setTelephone] =
    useState(
      translator.telephone ?? ""
    );

  const [credentials, setCredentials] =
    useState(
      translator.credentials ?? ""
    );

  const [membershipBody, setMembershipBody] =
    useState(
      translator.membership_body ?? ""
    );

  const [membershipNumber, setMembershipNumber] =
    useState(
      translator.membership_number ?? ""
    );

  const [notes, setNotes] =
    useState(
      translator.notes ?? ""
    );

  const [active, setActive] =
    useState(
      translator.active
    );

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");


  async function saveProfile(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response =
        await fetch(
          `/api/admin/translators/${translator.id}`,
          {
            method: "PATCH",

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
              active,
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
            "Unable to update translator."
        );
      }

      setMessage(
        "Translator profile updated."
      );

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update translator."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <form
      onSubmit={saveProfile}
      className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-bold">
        Edit Translator
      </h2>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">

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


      <label className="mt-5 flex items-center gap-3">

        <input
          type="checkbox"
          checked={active}
          onChange={(event) =>
            setActive(
              event.target.checked
            )
          }
          className="h-4 w-4"
        />

        <span className="font-semibold">
          Active Translator
        </span>

      </label>


      {message && (
        <div className="mt-4 text-sm text-[#607067]">
          {message}
        </div>
      )}


      <button
        type="submit"
        disabled={loading}
        className="mt-6 rounded-xl bg-[#087f5b] px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : "Save Changes"}
      </button>

    </form>
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