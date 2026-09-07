import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


const MAX_SIGNATURE_SIZE =
  2 * 1024 * 1024;


export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  await requireAdmin();

  const { id } =
    await context.params;

  try {
    const formData =
      await request.formData();

    const file =
      formData.get("file");


    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Signature file is required.",
        },
        { status: 400 }
      );
    }


    if (
      file.type !==
      "image/png"
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Signature must be a PNG image.",
        },
        { status: 400 }
      );
    }


    if (
      file.size <= 0 ||
      file.size >
        MAX_SIGNATURE_SIZE
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Signature image must not exceed 2 MB.",
        },
        { status: 400 }
      );
    }


    const {
      data: translator,
      error: translatorError,
    } = await supabaseAdmin
      .from("translators")
      .select(`
        id,
        signature_storage_path
      `)
      .eq(
        "id",
        id
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
            "Translator not found.",
        },
        { status: 404 }
      );
    }


    const storagePath =
      `${id}/signature.png`;


    const bytes =
      await file.arrayBuffer();


    const {
      error: uploadError,
    } = await supabaseAdmin.storage
      .from(
        "translator-signatures"
      )
      .upload(
        storagePath,
        bytes,
        {
          contentType:
            "image/png",

          upsert:
            true,
        }
      );


    if (uploadError) {
      console.error(
        "Translator signature upload failed:",
        uploadError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to store signature.",
        },
        { status: 500 }
      );
    }


    const {
      error: updateError,
    } = await supabaseAdmin
      .from("translators")
      .update({
        signature_storage_path:
          storagePath,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        id
      );


    if (updateError) {
      console.error(
        "Translator signature record update failed:",
        updateError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Signature uploaded but translator record could not be updated.",
        },
        { status: 500 }
      );
    }


    return NextResponse.json({
      ok: true,
      storagePath,
    });
  } catch (error) {
    console.error(
      "Translator signature upload failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to upload signature.",
      },
      { status: 500 }
    );
  }
}