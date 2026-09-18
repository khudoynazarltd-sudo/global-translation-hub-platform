import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function extensionForType(type: string) {
  if (type === "application/pdf") return "pdf";

  if (
    type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }

  return null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { user } = await requireAdmin();
  const { id: orderId } = await context.params;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, message: "A final translation file is required." },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Only PDF and DOCX files are accepted.",
      },
      { status: 400 }
    );
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        ok: false,
        message: "The maximum permitted file size is 25 MB.",
      },
      { status: 400 }
    );
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, order_reference, enquiry_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json(
      { ok: false, message: "Order not found." },
      { status: 404 }
    );
  }

  const extension = extensionForType(file.type);

  if (!extension) {
    return NextResponse.json(
      { ok: false, message: "Unsupported file type." },
      { status: 400 }
    );
  }

  const storagePath = `${order.order_reference}/${randomUUID()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from("order-final-files")
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error(uploadError);

    return NextResponse.json(
      { ok: false, message: "Unable to store final translation." },
      { status: 500 }
    );
  }

  const { error: documentError } = await supabaseAdmin
    .from("documents")
    .insert({
      enquiry_id: order.enquiry_id,
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
      status: "final_translation",
      expires_at: null,
    });

  if (documentError) {
    await supabaseAdmin.storage
      .from("order-final-files")
      .remove([storagePath]);

    return NextResponse.json(
      { ok: false, message: "Unable to save final file metadata." },
      { status: 500 }
    );
  }

  await supabaseAdmin
    .from("order_status_history")
    .insert({
      order_id: order.id,
      previous_status: null,
      new_status: "final_file_uploaded",
      changed_by: user.id,
      notes: "Final translation file uploaded through the administration panel.",
    });

  return NextResponse.json({
    ok: true,
    message: "Final translation uploaded successfully.",
  });
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  const { user } =
    await requireAdmin();

  const { id: orderId } =
    await context.params;

  const { searchParams } =
    new URL(request.url);

  const documentId =
    searchParams.get(
      "documentId"
    );

  if (!documentId) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "A translation document ID is required.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    data: order,
    error: orderError,
  } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      enquiry_id
    `)
    .eq(
      "id",
      orderId
    )
    .maybeSingle();

  if (
    orderError ||
    !order
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Order not found.",
      },
      {
        status: 404,
      }
    );
  }

  const {
    data: document,
    error: documentError,
  } = await supabaseAdmin
    .from("documents")
    .select(`
      id,
      storage_path,
      original_filename
    `)
    .eq(
      "id",
      documentId
    )
    .eq(
      "enquiry_id",
      order.enquiry_id
    )
    .eq(
      "status",
      "final_translation"
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
          "Final translation not found.",
      },
      {
        status: 404,
      }
    );
  }

  const {
    error: storageError,
  } =
    await supabaseAdmin.storage
      .from(
        "order-final-files"
      )
      .remove([
        document.storage_path,
      ]);

  if (storageError) {
    console.error(
      "Final translation storage deletion failed:",
      storageError
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to remove the final translation file.",
      },
      {
        status: 500,
      }
    );
  }

  const {
    error: deleteError,
  } = await supabaseAdmin
    .from("documents")
    .delete()
    .eq(
      "id",
      document.id
    );

  if (deleteError) {
    console.error(
      "Final translation metadata deletion failed:",
      deleteError
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to remove the final translation record.",
      },
      {
        status: 500,
      }
    );
  }

  const {
    data: certificate,
  } = await supabaseAdmin
    .from("certificates")
    .select(`
      id,
      status,
      bundle_storage_path
    `)
    .eq(
      "order_id",
      order.id
    )
    .maybeSingle();

  if (
    certificate?.bundle_storage_path
  ) {
    await supabaseAdmin.storage
      .from(
        "certified-bundles"
      )
      .remove([
        certificate.bundle_storage_path,
      ]);

    await supabaseAdmin
      .from("certificates")
      .update({
        status:
          "approved",

        bundle_storage_path:
          null,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        certificate.id
      );
  }

  await supabaseAdmin
    .from(
      "order_status_history"
    )
    .insert({
      order_id:
        order.id,

      previous_status:
        null,

      new_status:
        "final_file_removed",

      changed_by:
        user.id,

      notes:
        `Final translation removed by administrator: ${document.original_filename}`,
    });

  return NextResponse.json({
    ok: true,
    message:
      "Final translation removed successfully.",
  });
}