import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await requireAdmin();

  const { id } = await context.params;

  const { data: document, error } = await supabaseAdmin
    .from("documents")
    .select("id, storage_path, status")
    .eq("id", id)
    .maybeSingle();

  if (error || !document) {
    return NextResponse.json(
      { ok: false, message: "Document not found." },
      { status: 404 }
    );
  }

  let bucket = "temporary-enquiries";

  if (document.status === "order_source") {
    bucket = "order-source-files";
  }

  if (document.status === "final_translation") {
    bucket = "order-final-files";
  }

  const { data, error: signedUrlError } =
    await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(document.storage_path, 60);

  if (signedUrlError || !data?.signedUrl) {
    console.error("Signed URL error:", signedUrlError);

    return NextResponse.json(
      {
        ok: false,
        message: "Unable to create secure document link.",
      },
      { status: 500 }
    );
  }

  return NextResponse.redirect(data.signedUrl);
}