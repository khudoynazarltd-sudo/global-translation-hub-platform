import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
      documentId: string;
    }>;
  }
) {
  await requireAdmin();


  const {
    id: enquiryId,
    documentId,
  } =
    await context.params;


  const {
    data: document,
    error: documentError,
  } =
    await supabaseAdmin
      .from("documents")
      .select(`
        id,
        enquiry_id,
        storage_path,
        original_filename,
        mime_type,
        status
      `)
      .eq(
        "id",
        documentId
      )
      .eq(
        "enquiry_id",
        enquiryId
      )
      .maybeSingle();


  if (
    documentError ||
    !document
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Document not found.",
      },
      {
        status: 404,
      }
    );
  }


  const storageBucket =
    document.status === "temporary"
      ? "temporary-enquiries"
      : "order-source-files";


  const {
    data: file,
    error: fileError,
  } =
    await supabaseAdmin.storage
      .from(
        storageBucket
      )
      .download(
        document.storage_path
      );


  if (
    fileError ||
    !file
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to download document.",
      },
      {
        status: 500,
      }
    );
  }


  return new NextResponse(
    file,
    {
      headers: {
        "Content-Type":
          document.mime_type ||
          "application/octet-stream",

        "Content-Disposition":
          `inline; filename="${encodeURIComponent(
            document.original_filename ||
              "document"
          )}"`,

        "Cache-Control":
          "private, no-store",
      },
    }
  );
}