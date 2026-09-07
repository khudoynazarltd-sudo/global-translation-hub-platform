import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  requireTranslator,
} from "@/lib/auth/require-translator";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

import TranslatorOrderActions from "@/app/translator/orders/TranslatorOrderActions";

import TranslatorFinalFileUpload from "@/app/translator/orders/TranslatorFinalFileUpload";


export const dynamic =
  "force-dynamic";

export default async function TranslatorOrderPage({
  params,
}: {
  params: Promise<{
    reference: string;
  }>;
}) {
  const {
    translator,
  } =
    await requireTranslator();


  const {
    reference,
  } =
    await params;


  const {
    data: order,
    error: orderError,
  } =
    await supabaseAdmin
      .from("orders")
      .select(`
        id,
        order_reference,
        status,
        claimed_at,
        enquiry_id,

        enquiries (
          source_language,
          target_language,
          document_type,
          turnaround,
          purpose
        )
      `)
      .eq(
        "order_reference",
        reference
      )
      .eq(
        "assigned_translator_id",
        translator.id
      )
      .maybeSingle();


  if (
    orderError ||
    !order
  ) {
    notFound();
  }


  const enquiry =
    Array.isArray(order.enquiries)
      ? order.enquiries[0]
      : order.enquiries;


  const {
    data: sourceDocuments,
    error: sourceError,
  } =
    await supabaseAdmin
      .from("documents")
      .select(`
        id,
        original_filename,
        mime_type,
        file_size,
        status,
        created_at
      `)
      .eq(
        "enquiry_id",
        order.enquiry_id
      )
      .neq(
        "status",
        "final_translation"
      );


  if (sourceError) {
    console.error(
      "Unable to load translator source files:",
      sourceError
    );
  }


  const {
    data: finalDocuments,
  } =
    await supabaseAdmin
      .from("documents")
      .select(`
        id,
        original_filename,
        mime_type,
        file_size,
        created_at
      `)
      .eq(
        "enquiry_id",
        order.enquiry_id
      )
      .eq(
        "status",
        "final_translation"
      );


  return (
    <main className="min-h-screen bg-[#f4f7f5] px-6 py-10 text-[#13201a]">

      <div className="mx-auto max-w-6xl">

        <Link
          href="/translator"
          className="text-sm font-semibold text-[#087f5b]"
        >
          ← Translator Portal
        </Link>


        <div className="mt-5">

          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
            Translation Order
          </div>

          <h1 className="mt-2 text-4xl font-bold">
            {order.order_reference}
          </h1>

        </div>


        <section className="mt-8 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold">
            Order Details
          </h2>


          <dl className="mt-6 grid gap-5 sm:grid-cols-2">

            <Info
              label="Language Pair"
              value={
                `${enquiry?.source_language ?? ""} → ${enquiry?.target_language ?? ""}`
              }
            />

            <Info
              label="Document Type"
              value={
                enquiry?.document_type
              }
            />

            <Info
              label="Turnaround"
              value={
                enquiry?.turnaround
              }
            />

            <Info
              label="Purpose"
              value={
                enquiry?.purpose
              }
            />

            <Info
              label="Order Status"
              value={
                order.status
              }
            />

            <Info
              label="Claimed"
              value={
                order.claimed_at
                  ? new Date(
                      order.claimed_at
                    ).toLocaleString(
                      "en-GB"
                    )
                  : "Not available"
              }
            />

          </dl>

        </section>


        <TranslatorOrderActions
          orderId={
            order.id
          }
          currentStatus={
            order.status
          }
          hasFinalTranslation={
            (finalDocuments ?? [])
              .length > 0
          }
        />


        <section className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold">
            Source Documents
          </h2>


          <div className="mt-5 space-y-3">

            {(sourceDocuments ?? []).map(
              (document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-3 rounded-xl border border-[#e3ebe6] bg-[#fafcfb] p-4 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div>

                    <div className="font-semibold">
                      {document.original_filename}
                    </div>

                    <div className="mt-1 text-xs text-[#69766f]">
                      {document.mime_type}
                      {" · "}
                      {(
                        Number(
                          document.file_size
                        ) /
                        1024 /
                        1024
                      ).toFixed(2)}
                      {" MB"}
                    </div>

                  </div>


                  <a
                    href={`/api/translator/documents/${document.id}/view`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-[#087f5b] px-5 py-3 text-center font-semibold text-white"
                  >
                    View / Download
                  </a>

                </div>
              )
            )}

          </div>

        </section>


        <section className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold">
            Translation Files
          </h2>

          <p className="mt-2 text-sm text-[#69766f]">
            Uploaded final translation files will appear here.
          </p>


          <div className="mt-5 space-y-3">

            {(finalDocuments ?? []).map(
              (document) => (
              <div
                key={document.id}
                className="flex flex-col gap-3 rounded-xl border border-[#e3ebe6] bg-[#fafcfb] p-4 sm:flex-row sm:items-center sm:justify-between"
              >

                <div>

                  <div className="font-semibold">
                    {document.original_filename}
                  </div>

                  <div className="mt-1 text-xs text-[#69766f]">
                    {document.mime_type}
                    {" · "}
                    {(
                      Number(
                        document.file_size
                      ) /
                      1024 /
                      1024
                    ).toFixed(2)}
                    {" MB"}
                  </div>

                </div>


                <a
                  href={`/api/translator/documents/${document.id}/view`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-[#087f5b] px-5 py-3 text-center font-semibold text-[#087f5b]"
                >
                  View / Download
                </a>

              </div>
              )
            )}


            {(finalDocuments ?? []).length === 0 && (
              <div className="text-sm text-[#69766f]">
                No translation file has been uploaded yet.
              </div>
            )}

          </div>

        </section>


        <TranslatorFinalFileUpload
          orderId={
            order.id
          }
          currentStatus={
            order.status
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
        {value || "Not available"}
      </dd>

    </div>
  );
}