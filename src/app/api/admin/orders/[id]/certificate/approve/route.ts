import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await requireAdmin();

  const { id: orderId } = await context.params;

  const { data: certificate, error: certificateError } =
    await supabaseAdmin
      .from("certificates")
      .select(`
        id,
        document_title,
        number_of_pages,
        client_name,
        source_language,
        target_language,
        date_assigned,
        date_returned,
        certification_date,
        certification_statement,
        status
      `)
      .eq("order_id", orderId)
      .maybeSingle();

  if (certificateError || !certificate) {
    return NextResponse.json(
      {
        ok: false,
        message: "Certificate not found.",
      },
      { status: 404 }
    );
  }

  if (
    !certificate.document_title ||
    !certificate.number_of_pages ||
    !certificate.client_name ||
    !certificate.source_language ||
    !certificate.target_language ||
    !certificate.date_assigned ||
    !certificate.date_returned ||
    !certificate.certification_date ||
    !certificate.certification_statement
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Certificate details are incomplete. Please review all required fields before approval.",
      },
      { status: 400 }
    );
  }

  const approvedAt = new Date().toISOString();

  const { data: approvedCertificate, error: updateError } =
    await supabaseAdmin
      .from("certificates")
      .update({
        status: "approved",
        approved_at: approvedAt,
        updated_at: approvedAt,
      })
      .eq("id", certificate.id)
      .select("*")
      .single();

  if (updateError || !approvedCertificate) {
    console.error(
      "Certificate approval failed:",
      updateError
    );

    return NextResponse.json(
      {
        ok: false,
        message: "Unable to approve certificate.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    certificate: approvedCertificate,
  });
}