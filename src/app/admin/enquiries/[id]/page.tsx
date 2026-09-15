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
import ConfirmDeleteEnquiry from "@/app/admin/enquiries/ConfirmDeleteEnquiry";

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
        reviewed_at,
        media_external_url,
        media_output_options,
        media_notes
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

        {enquiry.document_type ===
          "Audio / Video Translation" && (
          <section className="mt-6 rounded-2xl border border-[#b9d8c7] bg-[#f8fbf9] p-6 shadow-sm">

            <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#087f5b]">
              Audio / Video Translation
            </div>

            <h2 className="mt-2 text-xl font-bold">
              Media Requirements
            </h2>


            <div className="mt-6 grid gap-6 sm:grid-cols-2">

              <div>
                <div className="text-sm font-semibold text-[#65736b]">
                  Requested Output
                </div>

                {Array.isArray(
                  enquiry.media_output_options
                ) &&
                enquiry.media_output_options.length >
                  0 ? (
                  <ul className="mt-3 space-y-2">
                    {enquiry.media_output_options.map(
                      (
                        option:
                          string
                      ) => (
                        <li
                          key={option}
                          className="rounded-lg border border-[#dce6df] bg-white px-4 py-3 text-sm"
                        >
                          {option}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[#69766f]">
                    No output option supplied.
                  </p>
                )}
              </div>


              <div>
                <div className="text-sm font-semibold text-[#65736b]">
                  External File Link
                </div>

                {enquiry.media_external_url ? (
                  <a
                    href={
                      enquiry.media_external_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block break-all rounded-lg border border-[#087f5b] bg-white px-4 py-3 text-sm font-semibold text-[#087f5b] hover:bg-[#eef8f2]"
                  >
                    Open External File
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-[#69766f]">
                    No external file link supplied.
                  </p>
                )}
              </div>

            </div>


            <div className="mt-6">
              <div className="text-sm font-semibold text-[#65736b]">
                Additional Requirements
              </div>

              <div className="mt-3 rounded-xl border border-[#dce6df] bg-white p-4 text-sm leading-6 text-[#536259]">
                {enquiry.media_notes ||
                  "No additional requirements supplied."}
              </div>
            </div>

          </section>
        )}

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

          <form
            action={`/api/admin/enquiries/${enquiry.id}/documents`}
            method="post"
            encType="multipart/form-data"
            className="mt-6 rounded-xl border border-[#dce6df] bg-[#f8fbf9] p-5"
          >
            <h3 className="font-bold">
              Add Documents
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#69766f]">
              Add one or several source documents to this enquiry.
            </p>

            <input
              name="files"
              type="file"
              multiple
              required
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              className="mt-4 block w-full rounded-xl border border-[#d7e1da] bg-white p-3"
            />

            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold">
                Number of Pages
              </label>

              <input
                name="pageCount"
                type="number"
                min="1"
                step="1"
                placeholder="Optional"
                className="w-full max-w-xs rounded-xl border border-[#d7e1da] bg-white px-4 py-3"
              />
            </div>

            <button
              type="submit"
              className="mt-5 rounded-xl bg-[#087f5b] px-6 py-3 font-semibold text-white"
            >
              Upload Documents
            </button>
          </form>

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

        {enquiry.status !== "paid" && (
          <section className="mt-6 rounded-2xl border border-[#ead8d8] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              Enquiry Management
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#69766f]">
              Extend the retention period by seven days or permanently delete this unpaid enquiry and its temporary source documents.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <form
                action={`/api/admin/enquiries/${enquiry.id}/lifecycle`}
                method="post"
              >
                <input
                  type="hidden"
                  name="action"
                  value="extend"
                />

                <button
                  type="submit"
                  className="rounded-xl border border-[#087f5b] px-5 py-3 font-semibold text-[#087f5b]"
                >
                  Extend +7 Days
                </button>
              </form>

              <ConfirmDeleteEnquiry
                enquiryId={
                  enquiry.id
                }
              />
            </div>
          </section>
        )}


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