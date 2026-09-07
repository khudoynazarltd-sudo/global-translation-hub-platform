import {
  NextResponse,
} from "next/server";

import {
  randomUUID,
} from "crypto";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export const runtime =
  "nodejs";


const ALLOWED_TYPES =
  new Set([
    "application/pdf",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);


const MAX_FILE_SIZE =
  25 * 1024 * 1024;


function extensionForType(
  type: string
) {
  if (
    type ===
    "application/pdf"
  ) {
    return "pdf";
  }


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
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const {
    id: orderId,
  } =
    await context.params;


  const supabase =
    await createServerSupabaseClient();


  const {
    data: {
      user,
    },

    error: authError,
  } =
    await supabase.auth.getUser();


  if (
    authError ||
    !user
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Authentication required.",
      },
      {
        status: 401,
      }
    );
  }


  const {
    data: translator,
    error: translatorError,
  } =
    await supabaseAdmin
      .from("translators")
      .select(`
        id,
        active
      `)
      .eq(
        "auth_user_id",
        user.id
      )
      .eq(
        "active",
        true
      )
      .maybeSingle();


  if (
    translatorError ||
    !translator
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Translator access is not authorised.",
      },
      {
        status: 403,
      }
    );
  }


  const {
    data: order,
    error: orderError,
  } =
    await supabaseAdmin
      .from("orders")
      .select(`
        id,
        order_reference,
        enquiry_id,
        status
      `)
      .eq(
        "id",
        orderId
      )
      .eq(
        "assigned_translator_id",
        translator.id
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
          "Order not found or no longer assigned to you.",
      },
      {
        status: 404,
      }
    );
  }


  if (
    order.status !==
    "in_translation"
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Final translation files may only be uploaded while the order is In Translation.",
      },
      {
        status: 400,
      }
    );
  }


  const formData =
    await request.formData();

  const file =
    formData.get(
      "file"
    );


  if (
    !(file instanceof File)
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "A final translation file is required.",
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
          "Only PDF and DOCX files are accepted.",
      },
      {
        status: 400,
      }
    );
  }


  if (
    file.size <= 0 ||
    file.size >
      MAX_FILE_SIZE
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "The maximum permitted file size is 25 MB.",
      },
      {
        status: 400,
      }
    );
  }


  const extension =
    extensionForType(
      file.type
    );


  if (!extension) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Unsupported file type.",
      },
      {
        status: 400,
      }
    );
  }


  const storagePath =
    `${order.order_reference}/` +
    `${randomUUID()}.${extension}`;


  const arrayBuffer =
    await file.arrayBuffer();


  const {
    error: uploadError,
  } =
    await supabaseAdmin.storage
      .from(
        "order-final-files"
      )
      .upload(
        storagePath,
        arrayBuffer,
        {
          contentType:
            file.type,

          upsert:
            false,
        }
      );


  if (uploadError) {
    console.error(
      "Translator final file upload failed:",
      uploadError
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to store final translation.",
      },
      {
        status: 500,
      }
    );
  }


  const {
    error: documentError,
  } =
    await supabaseAdmin
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
          "final_translation",

        expires_at:
          null,
      });


  if (documentError) {
    await supabaseAdmin.storage
      .from(
        "order-final-files"
      )
      .remove([
        storagePath,
      ]);


    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to save final file metadata.",
      },
      {
        status: 500,
      }
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
        order.status,

      new_status:
        "final_file_uploaded",

      changed_by:
        user.id,

      notes:
        "Final translation file uploaded by the assigned translator.",
    });


  return NextResponse.json({
    ok: true,

    message:
      "Final translation uploaded successfully.",
  });
}