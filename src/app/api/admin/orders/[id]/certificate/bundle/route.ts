import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  await requireAdmin();

  const { id: orderId } =
    await context.params;

  const {
    data: certificate,
    error: certificateError,
  } = await supabaseAdmin
    .from("certificates")
    .select(`
      id,
      status,
      bundle_storage_path
    `)
    .eq("order_id", orderId)
    .maybeSingle();

  if (
    certificateError ||
    !certificate
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: "Certificate not found.",
      },
      { status: 404 }
    );
  }

  if (
    certificate.status !== "issued" ||
    !certificate.bundle_storage_path
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "The certified bundle has not yet been generated.",
      },
      { status: 400 }
    );
  }

  const {
    data,
    error: signedUrlError,
  } = await supabaseAdmin.storage
    .from("certified-bundles")
    .createSignedUrl(
      certificate.bundle_storage_path,
      120
    );

  if (
    signedUrlError ||
    !data?.signedUrl
  ) {
    console.error(
      "Certified bundle signed URL failed:",
      signedUrlError
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to create secure bundle link.",
      },
      { status: 500 }
    );
  }

  return NextResponse.redirect(
    data.signedUrl
  );
}