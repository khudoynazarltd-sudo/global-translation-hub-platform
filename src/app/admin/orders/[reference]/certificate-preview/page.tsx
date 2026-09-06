import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) {
    return "Not specified";
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

export default async function CertificatePreviewPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  await requireAdmin();

  const { reference } = await params;

  const { data: order, error: orderError } =
    await supabaseAdmin
      .from("orders")
      .select(`
        id,
        order_reference
      `)
      .eq("order_reference", reference)
      .maybeSingle();

  if (orderError || !order) {
    notFound();
  }

  const { data: certificate, error: certificateError } =
    await supabaseAdmin
      .from("certificates")
      .select("*")
      .eq("order_id", order.id)
      .maybeSingle();

  if (certificateError || !certificate) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#eef3f0] px-6 py-10 text-[#13201a]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <a
              href={`/admin/orders/${order.order_reference}`}
              className="text-sm font-semibold text-[#087f5b]"
            >
              ← Back to Order
            </a>

            <h1 className="mt-3 text-3xl font-bold">
              Certificate Preview
            </h1>
          </div>

          <div className="rounded-full bg-[#eaf8f0] px-4 py-2 text-sm font-semibold text-[#087f5b]">
            {certificate.status}
          </div>
        </div>

        <section
          className="relative mx-auto overflow-hidden bg-white shadow-xl"
          style={{
            width: "794px",
            minHeight: "1123px",
          }}
        >
          <img
            src="/branding/gth-watermark.png"
            alt=""
            className="pointer-events-none absolute left-1/2 top-[52%] w-[620px] -translate-x-1/2 -translate-y-1/2 opacity-[0.08]"
          />

          <div className="relative z-10 px-12 py-10">
            <header className="grid grid-cols-3 items-start gap-6">
              <div className="flex justify-start">
                <img
                  src="/branding/gth-logo.png"
                  alt="GLOBAL TRANSLATION HUB"
                  className="max-h-[125px] max-w-[180px] object-contain"
                />
              </div>

              <div className="text-center">
                <div className="text-lg font-bold leading-tight">
                  KHUDOYNAZAR LTD,
                  <br />
                  trading as
                  <br />
                  GLOBAL TRANSLATION HUB
                </div>

                <div className="mt-3 text-sm leading-5">
                  <div className="underline">
                    Correspondence Address:
                  </div>

                  <div>
                    6 Lyndewode Road,
                    <br />
                    Cambridge, CB1 2HL,
                    <br />
                    United Kingdom
                  </div>

                  <div className="mt-1">
                    Email: corporate email to be confirmed
                  </div>

                  <div>
                    Tel: 07723 681 637
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <img
                  src="/branding/ciol-member-mark.png"
                  alt="CIOL Member"
                  className="max-h-[125px] max-w-[150px] object-contain"
                />
              </div>
            </header>

            <div className="mt-8 border-t border-black" />

            <div className="mt-10 text-center">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[#087f5b]">
                GLOBAL TRANSLATION HUB
              </div>

              <h2 className="mt-3 text-3xl font-bold uppercase">
                Certificate of Translation Accuracy
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-x-10 gap-y-4 text-[15px]">
              <Info
                label="Certificate Reference"
                value={certificate.certificate_reference}
              />

              <Info
                label="Order Reference"
                value={order.order_reference}
              />

              <Info
                label="Client Name"
                value={certificate.client_name}
              />

              <Info
                label="Document Title"
                value={certificate.document_title}
              />

              <Info
                label="Source Language"
                value={certificate.source_language}
              />

              <Info
                label="Target Language"
                value={certificate.target_language}
              />

              <Info
                label="Number of Pages"
                value={String(
                  certificate.number_of_pages ?? 1
                )}
              />

              <Info
                label="Date Assigned"
                value={formatDate(
                  certificate.date_assigned
                )}
              />

              <Info
                label="Date Returned"
                value={formatDate(
                  certificate.date_returned
                )}
              />

              <Info
                label="Certification Date"
                value={formatDate(
                  certificate.certification_date
                )}
              />
            </div>

            <section className="mt-10">
              <h3 className="text-lg font-bold uppercase">
                Certification Statement
              </h3>

              <p className="mt-4 text-[15px] leading-7">
                {certificate.certification_statement}
              </p>
            </section>

            <section className="mt-8">
              <h3 className="text-lg font-bold uppercase">
                Source Document Disclaimer
              </h3>

              <p className="mt-4 text-[14px] leading-6 text-[#34443b]">
                This certification relates solely to the
                accuracy of the translation. GLOBAL
                TRANSLATION HUB / KHUDOYNAZAR LTD does not
                certify, authenticate or verify the
                authenticity, validity, provenance or legal
                effect of the source document supplied by
                the client.
              </p>
            </section>

            <section className="mt-10 grid grid-cols-2 gap-10">
              <div>
                <div className="text-sm text-[#69766f]">
                  Translator
                </div>

                <div className="mt-1 font-bold">
                  Dr Zulfiyor Bakhtiyorov ACIL
                </div>

                <div className="mt-2 text-sm leading-5">
                  Associate Member of the Chartered
                  Institute of Linguists
                  <br />
                  CIOL Membership No. 95203
                </div>
              </div>

              <div>
                <div className="text-sm text-[#69766f]">
                  For and on behalf of
                </div>

                <div className="mt-1 font-bold">
                  GLOBAL TRANSLATION HUB
                </div>

                <div className="mt-2 text-sm leading-5">
                  KHUDOYNAZAR LTD
                  <br />
                  Company No. 16122617
                </div>
              </div>
            </section>

            <section className="mt-12">
              <div className="w-[280px] border-b border-black pb-2">
                Signature
              </div>

              <div className="mt-6 text-sm">
                Certification Date:{" "}
                <strong>
                  {formatDate(
                    certificate.certification_date
                  )}
                </strong>
              </div>
            </section>

            <footer className="mt-14 border-t border-[#cedbd3] pt-5 text-xs leading-5 text-[#607067]">
              <div>
                Certificate Verification Reference:
              </div>

              <div className="font-semibold text-[#13201a]">
                {certificate.certificate_reference}
              </div>

              <div className="mt-2">
                Online verification will be available via
                the GLOBAL TRANSLATION HUB verification
                service.
              </div>
            </footer>
          </div>
        </section>

        <div className="mx-auto mt-6 max-w-[794px] rounded-xl border border-[#dce6df] bg-white p-5 text-sm leading-6 text-[#607067]">
          This is an administrative preview only. It is not
          yet an approved or issued certificate.
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
      <div className="text-xs font-medium uppercase tracking-wide text-[#69766f]">
        {label}
      </div>

      <div className="mt-1 font-semibold">
        {value || "Not specified"}
      </div>
    </div>
  );
}