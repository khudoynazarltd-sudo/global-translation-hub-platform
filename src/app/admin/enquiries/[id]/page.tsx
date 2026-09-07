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

import ManualReviewActions from "@/app/admin/enquiries/ManualReviewActions";


export const dynamic =
  "force-dynamic";

export default async function AdminEnquiryDetailsPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  await requireAdmin();

  const {
    id,
  } =
    await params;


  const {
    data: enquiry,
    error: enquiryError,
  } =
    await supabaseAdmin
      .from("enquiries")
      .select(`
        id,
        created_at,
        status,
        full_name,
        email,
        telephone,
        source_language,
        target_language,
        document_type,
        purpose,
        turnaround,
        indicative_price,
        requires_manual_review,
        admin_notes,
        reviewed_at
      `)
      .eq(
        "id",
        id
      )
      .maybeSingle();


  if (
    enquiryError ||
    !enquiry
  ) {
    notFound();
  }


  const {
    data: documents,
    error: documentsError,
  } =
    await supabaseAdmin
      .from("documents")
      .select(`
        id,
        original_filename,
        mime_type,
        file_size,
        storage_path,
        status,
        created_at
      `)
      .eq(
        "enquiry_id",
        enquiry.id
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );


  if (documentsError) {
    console.error(
      "Unable to load enquiry documents:",
      documentsError
    );
  }


  return (
    <main className="min-h-screen bg-[#f5f8f6] px-6 py-10 text-[#13201a]">

      <div className="mx-auto max-w-6xl">

        <Link
          href="/admin/enquiries"
          className="text-sm font-semibold text-[#087f5b]"
        >
          ← Manual Review Enquiries
        </Link>


        <div className="mt-5">

          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
            Manual Review
          </div>

          <h1 className="mt-2 text-4xl font-bold">
            {enquiry.document_type ||
              "Enquiry"}
          </h1>

        </div>


        <section className="mt-8 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold">
            Enquiry Details
          </h2>


          <dl className="mt-6 grid gap-5 sm:grid-cols-2">

            <Info
              label="Client"
              value={
                enquiry.full_name
              }
            />

            <Info
              label="Email"
              value={
                enquiry.email
              }
            />

            <Info
              label="Telephone"
              value={
                enquiry.telephone
              }
            />

            <Info
              label="Language Pair"
              value={
                `${enquiry.source_language ?? ""} → ${enquiry.target_language ?? ""}`
              }
            />

            <Info
              label="Document Type"
              value={
                enquiry.document_type
              }
            />

            <Info
              label="Purpose"
              value={
                enquiry.purpose
              }
            />

            <Info
              label="Turnaround"
              value={
                enquiry.turnaround
              }
            />

            <Info
              label="Current Price"
              value={
                enquiry.indicative_price != null
                  ? `£${Number(
                      enquiry.indicative_price
                    ).toFixed(2)}`
                  : "Not set"
              }
            />

            <Info
              label="Status"
              value={
                enquiry.status
              }
            />

            <Info
              label="Created"
              value={
                new Date(
                  enquiry.created_at
                ).toLocaleString(
                  "en-GB"
                )
              }
            />

          </dl>

        </section>


        <section className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold">
            Source Documents
          </h2>


          <div className="mt-5 space-y-3">

            {(documents ?? []).map(
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
                    href={`/api/admin/enquiries/${enquiry.id}/documents/${document.id}/view`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-[#087f5b] px-5 py-3 text-center font-semibold text-white"
                  >
                    View / Download
                  </a>

                </div>
              )
            )}


            {(documents ?? []).length === 0 && (
              <div className="text-sm text-[#69766f]">
                No source documents are attached.
              </div>
            )}

          </div>

        </section>


        <ManualReviewActions
          enquiryId={
            enquiry.id
          }
          currentPrice={
            enquiry.indicative_price != null
              ? Number(
                  enquiry.indicative_price
                )
              : null
          }
          currentTurnaround={
            enquiry.turnaround
          }
          currentNotes={
            enquiry.admin_notes
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