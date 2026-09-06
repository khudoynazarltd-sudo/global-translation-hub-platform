import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashOrderAccessToken } from "@/lib/orders/access-token";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const token = searchParams.get("token");
    const documentId = searchParams.get("document");

    if (!token || !documentId) {
      return NextResponse.json(
        { ok: false, message: "Invalid download request." },
        { status: 400 }
      );
    }

    const tokenHash = hashOrderAccessToken(token);

    const { data: access, error: accessError } = await supabaseAdmin
      .from("order_access_tokens")
      .select("order_id, expires_at, revoked_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (accessError || !access || access.revoked_at) {
      return NextResponse.json(
        { ok: false, message: "Secure access is unavailable." },
        { status: 404 }
      );
    }

    if (
      access.expires_at &&
      new Date(access.expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json(
        { ok: false, message: "This access link has expired." },
        { status: 410 }
      );
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, enquiry_id, status")
      .eq("id", access.order_id)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { ok: false, message: "Order not found." },
        { status: 404 }
      );
    }

    if (!["ready", "delivered"].includes(order.status)) {
      return NextResponse.json(
        {
          ok: false,
          message: "The translation is not yet available for download.",
        },
        { status: 403 }
      );
    }

    const { data: document, error: documentError } = await supabaseAdmin
      .from("documents")
      .select("id, storage_path, status, enquiry_id")
      .eq("id", documentId)
      .eq("enquiry_id", order.enquiry_id)
      .eq("status", "final_translation")
      .maybeSingle();

    if (documentError || !document) {
      return NextResponse.json(
        { ok: false, message: "Final translation not found." },
        { status: 404 }
      );
    }

    const { data, error: signedUrlError } =
      await supabaseAdmin.storage
        .from("order-final-files")
        .createSignedUrl(document.storage_path, 60);

    if (signedUrlError || !data?.signedUrl) {
      return NextResponse.json(
        { ok: false, message: "Unable to create secure download link." },
        { status: 500 }
      );
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error("Client download failed:", error);

    return NextResponse.json(
      { ok: false, message: "Unable to download translation." },
      { status: 500 }
    );
  }
}