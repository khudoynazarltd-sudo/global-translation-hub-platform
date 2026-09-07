
import StatusControls from "../StatusControls";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import FinalFileUpload from "@/app/admin/orders/FinalFileUpload";
import ClientAccessLink from "@/app/admin/orders/ClientAccessLink";
import CertificateDetails from "@/app/admin/orders/CertificateDetails";
import CertificateActions from "@/app/admin/orders/CertificateActions";
import TranslatorAssignment from "@/app/admin/orders/TranslatorAssignment";

export const dynamic = "force-dynamic";

function readableStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function AdminOrderDetailsPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  await requireAdmin();

  const { reference } = await params;

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      order_reference,
      status,
      paid_at,
      created_at,
      payment_id,
      enquiry_id,
      assigned_translator_id,
      enquiries (
        id,
        full_name,
        email,
        telephone,
        source_language,
        target_language,
        document_type,
        purpose,
        turnaround,
        indicative_price,
        status,
        created_at
      ),
      payments (
        id,
        provider,
        provider_payment_id,
        amount,
        currency,
        status,
        created_at
      )
    `)
    .eq("order_reference", reference)
    .maybeSingle();

  if (error) {
    console.error("Order lookup failed:", error);
    throw new Error("Unable to load order.");
  }

  if (!order) {
    notFound();
  }

  const enquiry = Array.isArray(order.enquiries)
    ? order.enquiries[0]
    : order.enquiries;

  const payment = Array.isArray(order.payments)
    ? order.payments[0]
    : order.payments;

  const { data: sourceDocuments, error: sourceDocumentsError } =
    await supabaseAdmin
      .from("documents")
      .select(`
        id,
        original_filename,
        mime_type,
        file_size,
        status,
        storage_path,
        created_at
      `)
      .eq("enquiry_id", order.enquiry_id)
      .neq("status", "final_translation");

  if (sourceDocumentsError) {
    console.error(
      "Unable to load source documents:",
      sourceDocumentsError
    );
  }

  const { data: finalDocuments, error: finalDocumentsError } =
    await supabaseAdmin
      .from("documents")
      .select(`
        id,
        original_filename,
        mime_type,
        file_size,
        status,
        storage_path,
        created_at
      `)
      .eq("enquiry_id", order.enquiry_id)
      .eq("status", "final_translation");

  if (finalDocumentsError) {
    console.error(
      "Unable to load final translation files:",
      finalDocumentsError
    );
  }

  const { data: history } = await supabaseAdmin
    .from("order_status_history")
    .select(`
      id,
      previous_status,
      new_status,
      notes,
      created_at
    `)
    .eq("order_id", order.id)
    .order("created_at", { ascending: false });

  const { data: certificate } =
    await supabaseAdmin
      .from("certificates")
      .select("status, bundle_storage_path")
      .eq("order_id", order.id)
      .maybeSingle();


  const {
    data: translators,
    error: translatorsError,
  } = await supabaseAdmin
    .from("translators")
    .select(`
      id,
      display_name,
      credentials,
      membership_body,
      membership_number
    `)
    .eq(
      "active",
      true
    )
    .order(
      "display_name",
      {
        ascending: true,
      }
    );

  if (translatorsError) {
    console.error(
      "Unable to load translators:",
      translatorsError
    );
  }


  return (
    <main className="min-h-screen bg-[#f5f8f6] px-6 py-10 text-[#13201a]">

      <div className="mx-auto max-w-7xl">
        <a
          href="/admin/orders"
          className="text-sm font-semibold text-[#087f5b]"
        >
          в†ђ Orders
        </a>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#087f5b]">
              Translation Order
            </div>

            <h1 className="mt-2 text-4xl font-bold">
              {order.order_reference}
            </h1>
          </div>

          <div className="inline-flex rounded-full bg-[#eaf8f0] px-4 py-2 text-sm font-semibold text-[#087f5b]">
            {readableStatus(order.status)}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-bold">
              Order Details
            </h2>

            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <Info label="Client" value={enquiry?.full_name} />
              <Info label="Email" value={enquiry?.email} />
              <Info label="Telephone" value={enquiry?.telephone || "Not provided"} />
              <Info
                label="Language Pair"
                value={`${enquiry?.source_language ?? ""} в†’ ${enquiry?.target_language ?? ""}`}
              />
              <Info label="Document Type" value={enquiry?.document_type} />
              <Info label="Purpose" value={enquiry?.purpose} />
              <Info label="Turnaround" value={enquiry?.turnaround} />
              <Info
                label="Amount"
                value={`ВЈ${Number(payment?.amount ?? enquiry?.indicative_price ?? 0).toFixed(2)}`}
              />
            </dl>
          </section>

          <section className="rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              Payment
            </h2>

            <dl className="mt-6 space-y-4">
              <Info
                label="Status"
                value={payment?.status ? readableStatus(payment.status) : "Unknown"}
              />
              <Info
                label="Provider"
                value={payment?.provider ?? "Stripe"}
              />
              <Info
                label="Paid At"
                value={
                  order.paid_at
                    ? new Date(order.paid_at).toLocaleString("en-GB")
                    : "Not available"
                }
              />
            </dl>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Source Documents
          </h2>

          <div className="mt-5 space-y-3">
            {(sourceDocuments ?? []).map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-2 rounded-xl border border-[#e3ebe6] bg-[#fafcfb] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-semibold">
                    {document.original_filename}
                  </div>

                  <div className="mt-1 text-xs text-[#69766f]">
                    {document.mime_type} В·{" "}
                    {(Number(document.file_size) / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#65736b]">
                    {readableStatus(document.status)}
                  </span>

                  <a
                    href={`/api/admin/documents/${document.id}/view`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-[#087f5b] px-4 py-2 text-sm font-semibold text-white"
                  >
                    View Document
                  </a>
                </div>
              </div>
            ))}

            {(sourceDocuments ?? []).length === 0 && (
              <div className="text-sm text-[#69766f]">
                No source documents found.
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Final Translation Files
          </h2>

          <div className="mt-5 space-y-3">
            {(finalDocuments ?? []).map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-3 rounded-xl border border-[#e3ebe6] bg-[#fafcfb] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-semibold">
                    {document.original_filename}
                  </div>

                  <div className="mt-1 text-xs text-[#69766f]">
                    {document.mime_type} В·{" "}
                    {(Number(document.file_size) / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                <a
                  href={`/api/admin/documents/${document.id}/view`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-[#087f5b] px-4 py-2 text-center text-sm font-semibold text-white"
                >
                  View Final Translation
                </a>
              </div>
            ))}

            {(finalDocuments ?? []).length === 0 && (
              <div className="text-sm text-[#69766f]">
                No final translation has been uploaded yet.
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#dce6df] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Status History
          </h2>
          <TranslatorAssignment
            orderId={order.id}
            assignedTranslatorId={
              order.assigned_translator_id
            }
            translators={
              translators ?? []
            }
          />
          <StatusControls
            orderId={order.id}
            currentStatus={order.status}
          />
          <FinalFileUpload orderId={order.id} />
          <ClientAccessLink orderId={order.id} />
          <CertificateDetails orderId={order.id} />
          {certificate && (
            <CertificateActions
              orderId={order.id}
              certificateStatus={certificate.status}
            />
          )}

          {certificate?.status === "issued" &&
            certificate.bundle_storage_path && (
              <div className="mt-4">
                <a
                  href={`/api/admin/orders/${order.id}/certificate/bundle`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl bg-[#102b20] px-6 py-3 font-semibold text-white"
                >
                  View Certified Bundle
                </a>
              </div>
            )}
          <div className="mt-4">
            <a
              href={`/admin/orders/${order.order_reference}/certificate-preview`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-xl border border-[#087f5b] px-6 py-3 font-semibold text-[#087f5b]"
            >
              Preview Certificate
            </a>
          </div>
          <div className="mt-5 space-y-4">
            {(history ?? []).map((item) => (
              <div
                key={item.id}
                className="border-l-2 border-[#b9d8c7] pl-4"
              >
                <div className="font-semibold">
                  {readableStatus(item.new_status)}
                </div>

                <div className="mt-1 text-sm text-[#69766f]">
                  {new Date(item.created_at).toLocaleString("en-GB")}
                </div>

                {item.notes && (
                  <div className="mt-2 text-sm text-[#607067]">
                    {item.notes}
                  </div>
                )}
              </div>
            ))}

            {(history ?? []).length === 0 && (
              <div className="text-sm text-[#69766f]">
                No status history available.
              </div>
            )}
          </div>
        </section>
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
