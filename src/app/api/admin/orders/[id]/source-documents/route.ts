import {
  randomUUID,
} from "crypto";

import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

export const runtime =
  "nodejs";

const MAX_FILE_SIZE =
  25 * 1024 * 1024;

const ALLOWED_TYPES =
  new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);

function extensionForFile(
  file: File
) {
  const name =
    file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    return ".pdf";
  }

  if (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg")
  ) {
    return ".jpg";
  }

  if (name.endsWith(".png")) {
    return ".png";
  }

  if (name.endsWith(".docx")) {
    return ".docx";
  }

  return "";
}

async function invalidateCertifiedBundle(
  orderId: string
) {
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
    .eq(
      "order_id",
      orderId
    )
    .maybeSingle();

  if (
    certificateError ||
    !certificate ||
    !certificate.bundle_storage_path
  ) {
    return;
  }

  const oldBundlePath =
    certificate.bundle_storage_path;

  const {
    error: updateError,
  } = await supabaseAdmin
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

  if (updateError) {
    throw new Error(
      "Unable to invalidate the existing certified bundle."
    );
  }

  const {
    error: storageError,
  } = await supabaseAdmin.storage
    .from(
      "certified-bundles"
    )
    .remove([
      oldBundlePath,
    ]);

  if (storageError) {
    console.error(
      "Old certified bundle removal failed:",
      storageError
    );
  }
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  await requireAdmin();

  const {
    id: orderId,
  } =
    await context.params;

  const {
    data: order,
    error: orderError,
  } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      order_reference,
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

  const formData =
    await request.formData();

  const files =
    formData
      .getAll("files")
      .filter(
        (item): item is File =>
          item instanceof File &&
          item.size > 0
      );

  if (
    files.length === 0
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Please select at least one source document.",
      },
      {
        status: 400,
      }
    );
  }

  for (const file of files) {
    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            `The file "${file.name}" exceeds 25 MB.`,
        },
        {
          status: 400,
        }
      );
    }

    if (
      !ALLOWED_TYPES.has(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            `The file "${file.name}" is not supported.`,
        },
        {
          status: 400,
        }
      );
    }
  }

  const createdDocuments:
    {
      id: string;
      storagePath: string;
    }[] =
    [];

  try {
    for (const file of files) {
      const extension =
        extensionForFile(
          file
        );

      const storagePath =
        `${order.order_reference}/` +
        `${randomUUID()}${extension}`;

      const fileBytes =
        await file.arrayBuffer();

      const {
        error: uploadError,
      } =
        await supabaseAdmin.storage
          .from(
            "order-source-files"
          )
          .upload(
            storagePath,
            fileBytes,
            {
              contentType:
                file.type,

              upsert:
                false,
            }
          );

      if (uploadError) {
        throw new Error(
          `Unable to upload "${file.name}".`
        );
      }

      const {
        data: document,
        error: documentError,
      } = await supabaseAdmin
        .from("documents")
        .insert({
          enquiry_id:
            order.enquiry_id,

          storage_path:
            storagePath,

          original_filename:
            file.name,

          mime_type:
            file.type,

          file_size:
            file.size,

          status:
            "order_source",

          expires_at:
            null,
        })
        .select(`
          id
        `)
        .single();

      if (
        documentError ||
        !document
      ) {
        await supabaseAdmin.storage
          .from(
            "order-source-files"
          )
          .remove([
            storagePath,
          ]);

        throw new Error(
          `Unable to save "${file.name}".`
        );
      }

      createdDocuments.push({
        id:
          document.id,

        storagePath,
      });
    }

    await invalidateCertifiedBundle(
      order.id
    );

    return NextResponse.json({
      ok: true,
      message:
        "Source documents added successfully.",
    });
  } catch (error) {
    if (
      createdDocuments.length >
      0
    ) {
      await supabaseAdmin
        .from("documents")
        .delete()
        .in(
          "id",
          createdDocuments.map(
            (document) =>
              document.id
          )
        );

      await supabaseAdmin.storage
        .from(
          "order-source-files"
        )
        .remove(
          createdDocuments.map(
            (document) =>
              document.storagePath
          )
        );
    }

    console.error(
      "Admin source document upload failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to add source documents.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  await requireAdmin();

  const {
    id: orderId,
  } =
    await context.params;

  const {
    searchParams,
  } =
    new URL(
      request.url
    );

  const documentId =
    searchParams.get(
      "documentId"
    );

  if (!documentId) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "A source document ID is required.",
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
      "order_source"
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
          "Source document not found.",
      },
      {
        status: 404,
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
      "Source document deletion failed:",
      deleteError
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to delete the source document.",
      },
      {
        status: 500,
      }
    );
  }

  const {
    error: storageError,
  } =
    await supabaseAdmin.storage
      .from(
        "order-source-files"
      )
      .remove([
        document.storage_path,
      ]);

  if (storageError) {
    console.error(
      "Source document storage removal failed:",
      storageError
    );
  }

  try {
    await invalidateCertifiedBundle(
      order.id
    );
  } catch (error) {
    console.error(
      "Certified bundle invalidation failed after source deletion:",
      error
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      `Source document "${document.original_filename}" deleted successfully.`,
  });
}
