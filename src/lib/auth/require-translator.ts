import {
  redirect,
} from "next/navigation";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export async function requireTranslator() {
  const supabase =
    await createServerSupabaseClient();


  const {
    data: {
      user,
    },

    error,
  } =
    await supabase.auth.getUser();


  if (
    error ||
    !user
  ) {
    redirect(
      "/translator/login"
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
        active,
        legal_name,
        display_name,
        email,
        credentials,
        membership_body,
        membership_number,
        signature_storage_path
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
    redirect(
      "/translator/login"
    );
  }


  return {
    user,
    translator,
  };
}