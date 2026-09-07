import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  await requireAdmin();

  const { id: translatorId } =
    await context.params;

  try {
    const body =
      await request.json();

    const sourceLanguage =
      String(
        body.sourceLanguage ??
          ""
      ).trim();

    const targetLanguage =
      String(
        body.targetLanguage ??
          ""
      ).trim();


    if (
      !sourceLanguage ||
      !targetLanguage
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Both source and target languages are required.",
        },
        { status: 400 }
      );
    }


    const {
      data: translator,
      error: translatorError,
    } = await supabaseAdmin
      .from("translators")
      .select("id")
      .eq(
        "id",
        translatorId
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


    const {
      error: insertError,
    } = await supabaseAdmin
      .from(
        "translator_language_pairs"
      )
      .upsert(
        {
          translator_id:
            translatorId,

          source_language:
            sourceLanguage,

          target_language:
            targetLanguage,

          active:
            true,
        },
        {
          onConflict:
            "translator_id,source_language,target_language",
        }
      );


    if (insertError) {
      console.error(
        "Language pair creation failed:",
        insertError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to add language pair.",
        },
        { status: 500 }
      );
    }


    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Language pair creation failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to add language pair.",
      },
      { status: 500 }
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

  const { id: translatorId } =
    await context.params;

  try {
    const { searchParams } =
      new URL(request.url);

    const pairId =
      searchParams.get(
        "pairId"
      );


    if (!pairId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Language pair ID is required.",
        },
        { status: 400 }
      );
    }


    const {
      error: deleteError,
    } = await supabaseAdmin
      .from(
        "translator_language_pairs"
      )
      .delete()
      .eq(
        "id",
        pairId
      )
      .eq(
        "translator_id",
        translatorId
      );


    if (deleteError) {
      console.error(
        "Language pair removal failed:",
        deleteError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to remove language pair.",
        },
        { status: 500 }
      );
    }


    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Language pair removal failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to remove language pair.",
      },
      { status: 500 }
    );
  }
}