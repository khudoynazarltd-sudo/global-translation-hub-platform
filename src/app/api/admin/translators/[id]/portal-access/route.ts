import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";


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
    const {
      data: translator,
      error: translatorError,
    } = await supabaseAdmin
      .from("translators")
      .select(`
        id,
        active,
        email,
        auth_user_id
      `)
      .eq("id", id)
      .maybeSingle();


    if (
      translatorError ||
      !translator
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Translator not found.",
        },
        { status: 404 }
      );
    }


    if (!translator.active) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Portal access cannot be created for an inactive translator.",
        },
        { status: 400 }
      );
    }


    if (translator.auth_user_id) {
      return NextResponse.json(
        {
          ok: true,
          message:
            "Portal access is already connected.",
        }
      );
    }


    const email =
      translator.email
        ?.trim()
        .toLowerCase();


    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "The translator does not have an email address.",
        },
        { status: 400 }
      );
    }


    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";


    const inviteCallbackUrl =
      `${siteUrl.replace(/\/$/, "")}` +
      `/auth/callback?next=${encodeURIComponent(
        "/translator/set-password"
      )}`;


    const {
      data: invitedUser,
      error: inviteError,
    } =
      await supabaseAdmin.auth.admin
        .inviteUserByEmail(
          email,
          {
            redirectTo:
              inviteCallbackUrl,
          }
        );

    if (
      inviteError ||
      !invitedUser.user
    ) {
      console.error(
        "Translator invitation failed:",
        inviteError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            inviteError?.message ||
            "Unable to send translator invitation.",
        },
        { status: 500 }
      );
    }


    const {
      error: updateError,
    } = await supabaseAdmin
      .from("translators")
      .update({
        auth_user_id:
          invitedUser.user.id,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .is(
        "auth_user_id",
        null
      );


    if (updateError) {
      console.error(
        "Translator authentication link failed:",
        updateError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "The invitation was created, but the translator profile could not be connected.",
        },
        { status: 500 }
      );
    }


    return NextResponse.json({
      ok: true,
      message:
        `Invitation sent to ${email}.`,
    });

  } catch (error) {
    console.error(
      "Translator portal access creation failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to create translator portal access.",
      },
      { status: 500 }
    );
  }
}