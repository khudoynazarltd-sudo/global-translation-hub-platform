import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-cleanup-secret");
    const expectedSecret = process.env.CLEANUP_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        { ok: false, message: "Unauthorised." },
        { status: 401 }
      );
    }

    const now = new Date().toISOString();

    const { data: expiredDocuments, error: documentQueryError } =
      await supabaseAdmin
        .from("documents")
        .select("id, enquiry_id, storage_path")
        .eq("status", "temporary")
        .lt("expires_at", now);

    if (documentQueryError) {
      console.error(documentQueryError);

      return NextResponse.json(
        { ok: false, message: "Unable to query expired documents." },
        { status: 500 }
      );
    }

    if (!expiredDocuments || expiredDocuments.length === 0) {
      return NextResponse.json({
        ok: true,
        deletedFiles: 0,
        deletedEnquiries: 0,
      });
    }

    const paths = expiredDocuments.map((item) => item.storage_path);

    const { error: storageDeleteError } =
      await supabaseAdmin.storage
        .from("temporary-enquiries")
        .remove(paths);

    if (storageDeleteError) {
      console.error(storageDeleteError);

      return NextResponse.json(
        { ok: false, message: "Unable to delete expired files." },
        { status: 500 }
      );
    }

    const documentIds = expiredDocuments.map((item) => item.id);

    const { error: metadataDeleteError } =
      await supabaseAdmin
        .from("documents")
        .delete()
        .in("id", documentIds);

    if (metadataDeleteError) {
      console.error(metadataDeleteError);

      return NextResponse.json(
        { ok: false, message: "Unable to delete document metadata." },
        { status: 500 }
      );
    }

    const enquiryIds = [
      ...new Set(
        expiredDocuments
          .map((item) => item.enquiry_id)
          .filter(Boolean)
      ),
    ];

    let deletedEnquiries = 0;

    for (const enquiryId of enquiryIds) {
      const { data: remainingDocuments } =
        await supabaseAdmin
          .from("documents")
          .select("id")
          .eq("enquiry_id", enquiryId)
          .limit(1);

      if (!remainingDocuments || remainingDocuments.length === 0) {
        const { error: enquiryDeleteError } =
          await supabaseAdmin
            .from("enquiries")
            .delete()
            .eq("id", enquiryId)
            .lt("expires_at", now);

        if (!enquiryDeleteError) {
          deletedEnquiries += 1;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      deletedFiles: paths.length,
      deletedEnquiries,
    });
  } catch (error) {
    console.error("Cleanup failed:", error);

    return NextResponse.json(
      { ok: false, message: "Unexpected cleanup error." },
      { status: 500 }
    );
  }
}