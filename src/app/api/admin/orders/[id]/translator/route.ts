import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  await requireAdmin();

  const { id: orderId } =
    await context.params;

  try {
    const body =
      await request.json();

    const translatorId =
      typeof body.translatorId ===
        "string" &&
      body.translatorId
        ? body.translatorId
        : null;


    if (translatorId) {
      const {
        data: translator,
        error:
          translatorError,
      } = await supabaseAdmin
        .from("translators")
        .select("id, active")
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

      if (!translator.active) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "This translator is inactive.",
          },
          { status: 400 }
        );
      }
    }


    const {
      error:
        updateError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        assigned_translator_id:
          translatorId,

        claimed_at:
          translatorId
            ? new Date().toISOString()
            : null,
      })
      .eq(
        "id",
        orderId
      );

    if (updateError) {
      console.error(
        "Translator assignment failed:",
        updateError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to save translator assignment.",
        },
        { status: 500 }
      );
    }


    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Translator assignment failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to save translator assignment.",
      },
      { status: 500 }
    );
  }
}