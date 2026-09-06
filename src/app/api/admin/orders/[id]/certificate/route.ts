import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function buildCertificateReference(
  orderReference: string
) {
  return orderReference.replace(
    /^GTH-/,
    "GTH-CERT-"
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await requireAdmin();

  const { id: orderId } =
    await context.params;

  const { data: order, error: orderError } =
    await supabaseAdmin
      .from("orders")
      .select(`
        id,
        order_reference,
        enquiry_id,
        created_at,
        enquiries (
          full_name,
          source_language,
          target_language,
          document_type
        )
      `)
      .eq("id", orderId)
      .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json(
      {
        ok: false,
        message: "Order not found.",
      },
      { status: 404 }
    );
  }

  const enquiry = Array.isArray(order.enquiries)
    ? order.enquiries[0]
    : order.enquiries;

  const { data: existingCertificate } =
    await supabaseAdmin
      .from("certificates")
      .select("*")
      .eq("order_id", order.id)
      .maybeSingle();

  if (existingCertificate) {
    return NextResponse.json({
      ok: true,
      certificate: existingCertificate,
    });
  }

  const certificateReference =
    buildCertificateReference(
      order.order_reference
    );

  const today =
    new Date().toISOString().slice(0, 10);

  const certificationStatement =
    `I, Dr Zulfiyor Bakhtiyorov ACIL, hereby certify that I am proficient in ` +
    `${enquiry?.source_language ?? ""} and ${enquiry?.target_language ?? ""} ` +
    `and that I have translated the accompanying document from ` +
    `${enquiry?.source_language ?? ""} into ${enquiry?.target_language ?? ""}. ` +
    `To the best of my knowledge and ability, the translation is a true and accurate ` +
    `representation of the source document presented to me.`;

  const {
    data: certificate,
    error: certificateError,
  } = await supabaseAdmin
    .from("certificates")
    .insert({
      order_id: order.id,

      certificate_reference:
        certificateReference,

      document_title:
        enquiry?.document_type ?? null,

      number_of_pages: 1,

      client_name:
        enquiry?.full_name ?? null,

      source_language:
        enquiry?.source_language ?? "",

      target_language:
        enquiry?.target_language ?? "",

      date_assigned: today,
      date_returned: today,
      certification_date: today,

      certification_statement:
        certificationStatement,

      status: "draft",
    })
    .select("*")
    .single();

  if (
    certificateError ||
    !certificate
  ) {
    console.error(
      "Certificate draft creation failed:",
      certificateError
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to create certificate draft.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    certificate,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await requireAdmin();

  const { id: orderId } =
    await context.params;

  const body =
    await request.json();

  const {
    documentTitle,
    numberOfPages,
    clientName,
    sourceLanguage,
    targetLanguage,
    dateAssigned,
    dateReturned,
    certificationDate,
    certificationStatement,
  } = body;

  const {
    data: certificate,
    error,
  } = await supabaseAdmin
    .from("certificates")
    .update({
      document_title:
        documentTitle || null,

      number_of_pages:
        Number(numberOfPages) || 1,

      client_name:
        clientName || null,

      source_language:
        sourceLanguage,

      target_language:
        targetLanguage,

      date_assigned:
        dateAssigned || null,

      date_returned:
        dateReturned || null,

      certification_date:
        certificationDate || null,

      certification_statement:
        certificationStatement,

      updated_at:
        new Date().toISOString(),
    })
    .eq("order_id", orderId)
    .select("*")
    .single();

  if (
    error ||
    !certificate
  ) {
    console.error(
      "Certificate update failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to update certificate.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    certificate,
  });
}