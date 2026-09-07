import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

import TranslatorLanguages from "@/app/admin/translators/TranslatorLanguages";
import TranslatorProfileForm from "@/app/admin/translators/TranslatorProfileForm";
import TranslatorSignatureUpload from "@/app/admin/translators/TranslatorSignatureUpload";
import TranslatorPortalAccess from "@/app/admin/translators/TranslatorPortalAccess";


export const dynamic =
  "force-dynamic";


export default async function ManageTranslatorPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  await requireAdmin();

  const { id } =
    await params;


  const {
    data: translator,
    error: translatorError,
  } = await supabaseAdmin
    .from("translators")
    .select(`
      id,
      active,
      legal_name,
      display_name,
      email,
      telephone,
      credentials,
      membership_body,
      membership_number,
      signature_storage_path,
      auth_user_id,
      notes
    `)
    .eq(
      "id",
      id
    )
    .maybeSingle();


  if (
    translatorError ||
    !translator
  ) {
    notFound();
  }


  const {
    data: languagePairs,
    error: languagePairsError,
  } = await supabaseAdmin
    .from(
      "translator_language_pairs"
    )
    .select(`
      id,
      source_language,
      target_language,
      active
    `)
    .eq(
      "translator_id",
      translator.id
    )
    .order(
      "source_language",
      {
        ascending: true,
      }
    );


  if (languagePairsError) {
    console.error(
      "Unable to load translator languages:",
      languagePairsError
    );
  }


  return (
    <main className="min-h-screen bg-[#f5f8f6] px-6 py-10 text-[#13201a]">
      <div className="mx-auto max-w-5xl">

        <Link
          href="/admin/translators"
          className="text-sm font-semibold text-[#087f5b]"
        >
          ← Translators
        </Link>


        <div className="mt-5">

          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
            Translator Profile
          </div>

          <h1 className="mt-2 text-4xl font-bold">
            {translator.display_name}
          </h1>

        </div>


        <section className="mt-8 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

          <div className="flex flex-wrap items-center gap-3">

            <h2 className="text-xl font-bold">
              Professional Details
            </h2>

            <span
              className={
                translator.active
                  ? "rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-semibold text-[#087f5b]"
                  : "rounded-full bg-[#f1f3f2] px-3 py-1 text-xs font-semibold text-[#69766f]"
              }
            >
              {translator.active
                ? "Active"
                : "Inactive"}
            </span>

          </div>


          <dl className="mt-6 grid gap-5 sm:grid-cols-2">

            <Info
              label="Legal Name"
              value={
                translator.legal_name
              }
            />

            <Info
              label="Certificate Display Name"
              value={
                translator.display_name
              }
            />

            <Info
              label="Email"
              value={
                translator.email
              }
            />

            <Info
              label="Telephone"
              value={
                translator.telephone
              }
            />

            <Info
              label="Credentials"
              value={
                translator.credentials
              }
            />

            <Info
              label="Membership Body"
              value={
                translator.membership_body
              }
            />

            <Info
              label="Membership Number"
              value={
                translator.membership_number
              }
            />

            <Info
              label="Signature"
              value={
                translator.signature_storage_path
                  ? "Uploaded"
                  : "Not uploaded"
              }
            />

            <Info
              label="Portal Login"
              value={
                translator.auth_user_id
                  ? "Connected"
                  : "Not connected"
              }
            />

          </dl>

        </section>


        <TranslatorProfileForm
          translator={{
            id: translator.id,
            active: translator.active,
            legal_name: translator.legal_name,
            display_name: translator.display_name,
            email: translator.email,
            telephone: translator.telephone,
            credentials: translator.credentials,
            membership_body: translator.membership_body,
            membership_number: translator.membership_number,
            notes: translator.notes,
          }}
        />

        <TranslatorPortalAccess
          translatorId={translator.id}
          email={translator.email}
          connected={Boolean(
            translator.auth_user_id
          )}
        />

        <TranslatorSignatureUpload
          translatorId={
            translator.id
          }
          hasSignature={
            Boolean(
              translator.signature_storage_path
            )
          }
        />

        <TranslatorLanguages
          translatorId={
            translator.id
          }
          initialPairs={
            languagePairs ?? []
          }
        />

      </div>
    </main>
  );
}


function Info({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>

      <dt className="text-sm text-[#69766f]">
        {label}
      </dt>

      <dd className="mt-1 font-semibold">
        {value || "Not provided"}
      </dd>

    </div>
  );
}