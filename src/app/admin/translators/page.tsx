import Link from "next/link";

import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";


export const dynamic = "force-dynamic";


export default async function TranslatorsPage() {
  await requireAdmin();

  const {
    data: translators,
    error,
  } = await supabaseAdmin
    .from("translators")
    .select(`
      id,
      created_at,
      active,
      legal_name,
      display_name,
      email,
      auth_user_id,
      credentials,
      membership_body,
      membership_number,
      signature_storage_path,

      translator_language_pairs (
        id,
        source_language,
        target_language,
        active
      )
    `)
    .order(
      "display_name",
      {
        ascending: true,
      }
    );


  if (error) {
    console.error(
      "Unable to load translators:",
      error
    );

    throw new Error(
      "Unable to load translators."
    );
  }


  return (
    <main className="min-h-screen bg-[#f5f8f6] px-6 py-10 text-[#13201a]">
      <div className="mx-auto max-w-7xl">

        <Link
          href="/admin/orders"
          className="text-sm font-semibold text-[#087f5b]"
        >
          ← Orders
        </Link>


        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
              GLOBAL TRANSLATION HUB
            </div>

            <h1 className="mt-2 text-4xl font-bold">
              Translators
            </h1>

            <p className="mt-3 max-w-2xl text-[#69766f]">
              Manage translators who may be assigned
              to translation orders and certificates.
            </p>
          </div>


          <Link
            href="/admin/translators/new"
            className="inline-flex rounded-xl bg-[#087f5b] px-6 py-3 font-semibold text-white"
          >
            Add Translator
          </Link>

        </div>


        <div className="mt-10 space-y-4">

          {(translators ?? []).map(
            (translator) => (
              <section
                key={translator.id}
                className="rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm"
              >

                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                  <div>

                    <div className="flex flex-wrap items-center gap-3">

                      <h2 className="text-xl font-bold">
                        {translator.display_name}
                      </h2>


                      {translator.active ? (
                        <span className="rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-semibold text-[#087f5b]">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#f1f3f2] px-3 py-1 text-xs font-semibold text-[#69766f]">
                          Inactive
                        </span>
                      )}

                    </div>


                    <dl className="mt-5 grid gap-x-10 gap-y-4 sm:grid-cols-2">

                      <Info
                        label="Legal Name"
                        value={
                          translator.legal_name
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

                        <div className="mt-5">
                          <div className="text-sm text-[#69766f]">
                            Language Pairs
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {(translator.translator_language_pairs ?? [])
                              .filter((pair) => pair.active)
                              .map((pair) => (
                                <span
                                  key={pair.id}
                                  className="rounded-full bg-[#eef7f2] px-3 py-1 text-xs font-semibold text-[#087f5b]"
                                >
                                  {pair.source_language}
                                  {" → "}
                                  {pair.target_language}
                                </span>
                              ))}

                            {(translator.translator_language_pairs ?? [])
                              .filter((pair) => pair.active)
                              .length === 0 && (
                                <span className="text-sm text-[#69766f]">
                                  No active language pairs
                                </span>
                              )}
                          </div>
                        </div>

                    </dl>

                  </div>


                  <div className="flex shrink-0 flex-col items-stretch gap-3">

                    <Link
                      href={`/admin/translators/${translator.id}`}
                      className="inline-flex justify-center rounded-xl border border-[#087f5b] px-5 py-3 font-semibold text-[#087f5b]"
                    >
                      Manage Translator
                    </Link>


                    {!translator.auth_user_id && translator.email && (
                      <Link
                        href={`/admin/translators/${translator.id}#portal-access`}
                        className="inline-flex justify-center rounded-xl bg-[#087f5b] px-5 py-3 font-semibold text-white"
                      >
                        Invite to Portal
                      </Link>
                    )}


                    {translator.auth_user_id && (
                      <div className="rounded-xl bg-[#eaf8f0] px-4 py-2 text-center text-sm font-semibold text-[#087f5b]">
                        Portal Connected
                      </div>
                    )}


                    {!translator.auth_user_id && !translator.email && (
                      <div className="rounded-xl bg-[#fff4d8] px-4 py-2 text-center text-sm font-semibold text-[#8a6418]">
                        Email Required
                      </div>
                    )}

                  </div>

                </div>

              </section>

            )
          )}


          {(translators ?? []).length === 0 && (
            <section className="rounded-2xl border border-[#dce6df] bg-white p-8 text-center shadow-sm">

              <div className="text-lg font-semibold">
                No translators found.
              </div>

              <p className="mt-2 text-sm text-[#69766f]">
                Add the first translator to begin
                assigning translation work.
              </p>

            </section>
          )}

        </div>

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