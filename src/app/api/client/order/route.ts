import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashOrderAccessToken } from "@/lib/orders/access-token";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token || token.length < 30) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid order access link.",
        },
        { status: 400 }
      );
    }

    const tokenHash = hashOrderAccessToken(token);

    const { data: access, error: accessError } =
      await supabaseAdmin
        .from("order_access_tokens")
        .select("id, order_id, expires_at, revoked_at")
        .eq("token_hash", tokenHash)
        .maybeSingle();

    if (accessError || !access || access.revoked_at) {
      return NextResponse.json(
        {
          ok: false,
          message: "Order access is unavailable.",
        },
        { status: 404 }
      );
    }

    if (
      access.expires_at &&
      new Date(access.expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "This order access link has expired.",
        },
        { status: 410 }
      );
    }

    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select(`
          id,
          order_reference,
          status,
          paid_at,
          enquiry_id,
          enquiries (
            source_language,
            target_language,
            document_type,
            turnaround
          )
        `)
        .eq("id", access.order_id)
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

    await supabaseAdmin
      .from("order_access_tokens")
      .update({
        last_used_at: new Date().toISOString(),
      })
      .eq("id", access.id);

    const enquiry = Array.isArray(order.enquiries)
      ? order.enquiries[0]
      : order.enquiries;

    let finalDocuments: Array<{
      id: string;
      original_filename: string | null;
    }> = [];

    if (["ready", "delivered"].includes(order.status)) {
      const { data: files, error: filesError } =
        await supabaseAdmin
          .from("documents")
          .select("id, original_filename")
          .eq("enquiry_id", order.enquiry_id)
          .eq("status", "final_translation");

      if (filesError) {
        console.error(
          "Unable to load final translation files:",
          filesError
        );
      } else {
        finalDocuments = files ?? [];
      }
    }

    const { data: certificate, error: certificateError } =
      await supabaseAdmin
        .from("certificates")
        .select(`
          status,
          certificate_reference,
          bundle_storage_path
        `)
        .eq("order_id", order.id)
        .maybeSingle();

    if (certificateError) {
      console.error(
        "Unable to load certificate for client portal:",
        certificateError
      );
    }

    return NextResponse.json({
      ok: true,
      order: {
        reference: order.order_reference,
        status: order.status,
        paidAt: order.paid_at,
        sourceLanguage: enquiry?.source_language,
        targetLanguage: enquiry?.target_language,
        documentType: enquiry?.document_type,
        turnaround: enquiry?.turnaround,
        finalDocuments,
        certificate:
          certificate?.status === "issued" &&
          certificate.bundle_storage_path
            ? {
                status: certificate.status,
                reference: certificate.certificate_reference,
                bundleAvailable: true,
              }
            : null,
      },
    });
  } catch (error) {
    console.error("Client order lookup failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Unable to retrieve order.",
      },
      { status: 500 }
    );
  }
}