import {
  NextResponse,
} from "next/server";

import {
  requireTranslator,
} from "@/lib/auth/require-translator";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const {
    translator,
  } =
    await requireTranslator();


  const {
    id: documentId,
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


  const {
    data: order,
  } =
    await supabaseAdmin
      .from("orders")
      .select(`
        id,
        assigned_translator_id
      `)
      .eq(
        "enquiry_id",
        document.enquiry_id
      )
      .eq(
        "assigned_translator_id",
        translator.id
      )
      .maybeSingle();


  if (!order) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "You do not have access to this document.",
      },
      {
        status: 403,
      }
    );
  }


  const storageBucket =
    document.status ===
      "final_translation"
      ? "order-final-files"
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
            document.original_filename
          )}"`,

        "Cache-Control":
          "private, no-store",
      },
    }
  );
}