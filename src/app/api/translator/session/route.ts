import {
  NextResponse,
} from "next/server";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export async function GET() {
  const supabase =
    await createServerSupabaseClient();


  const {
    data: {
      user,
    },

    error: authError,
  } =
    await supabase.auth
      .getUser();


  if (
    authError ||
    !user
  ) {
    return NextResponse.json(
      {
        ok: false,
      },
      {
        status: 401,
      }
    );
  }


  const {
    data: translator,
    error:
      translatorError,
  } =
    await supabaseAdmin
      .from("translators")
      .select(`
        id,
        display_name,
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
      },
      {
        status: 403,
      }
    );
  }


  return NextResponse.json({
    ok: true,

    translator: {
      id:
        translator.id,

      displayName:
        translator.display_name,
    },
  });
}