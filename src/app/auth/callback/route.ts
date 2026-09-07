import {
  NextResponse,
} from "next/server";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";


export async function GET(
  request: Request
) {
  const requestUrl =
    new URL(request.url);

  const code =
    requestUrl.searchParams.get(
      "code"
    );

  const next =
    requestUrl.searchParams.get(
      "next"
    ) ||
    "/translator/set-password";


  if (code) {
    const supabase =
      await createServerSupabaseClient();

    const {
      error,
    } =
      await supabase.auth
        .exchangeCodeForSession(
          code
        );


    if (!error) {
      return NextResponse.redirect(
        new URL(
          next,
          requestUrl.origin
        )
      );
    }


    console.error(
      "Supabase auth callback failed:",
      error
    );
  }


  return NextResponse.redirect(
    new URL(
      "/translator/login?error=invite",
      requestUrl.origin
    )
  );
}