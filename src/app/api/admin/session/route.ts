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
    await supabase.auth.getUser();


  if (
    authError ||
    !user
  ) {
    return NextResponse.json(
      {
        ok: false,
        stage: "auth",
        message:
          "No authenticated Supabase user.",
      },
      {
        status: 401,
      }
    );
  }


  const {
    data: adminUser,
    error: adminError,
  } =
    await supabaseAdmin
      .from("admin_users")
      .select(`
        user_id,
        role,
        is_active
      `)
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();


  if (adminError) {
    console.error(
      "Admin session lookup failed:",
      adminError
    );

    return NextResponse.json(
      {
        ok: false,
        stage: "admin_lookup",
        message:
          "Admin record lookup failed.",
      },
      {
        status: 500,
      }
    );
  }


  if (!adminUser) {
    return NextResponse.json(
      {
        ok: false,
        stage: "admin_record",
        message:
          "Authenticated user is not linked to an admin record.",
        email:
          user.email ?? null,
      },
      {
        status: 403,
      }
    );
  }


  if (!adminUser.is_active) {
    return NextResponse.json(
      {
        ok: false,
        stage: "inactive",
        message:
          "Admin account is inactive.",
      },
      {
        status: 403,
      }
    );
  }


  return NextResponse.json({
    ok: true,
    email:
      user.email ?? null,
    role:
      adminUser.role,
  });
}