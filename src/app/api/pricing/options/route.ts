import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export const dynamic =
  "force-dynamic";


export async function GET() {
  const [
    languagesResult,
    servicesResult,
  ] =
    await Promise.all([
      supabaseAdmin
        .from("languages")
        .select(`
          code,
          name,
          sort_order
        `)
        .eq(
          "active",
          true
        )
        .order(
          "sort_order",
          {
            ascending: true,
          }
        ),

      supabaseAdmin
        .from("service_types")
        .select(`
          code,
          name,
          sort_order
        `)
        .eq(
          "active",
          true
        )
        .order(
          "sort_order",
          {
            ascending: true,
          }
        ),
    ]);


  if (
    languagesResult.error ||
    servicesResult.error
  ) {
    console.error(
      "Unable to load public pricing options:",
      {
        languagesError:
          languagesResult.error,

        servicesError:
          servicesResult.error,
      }
    );


    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to load quotation options.",
      },
      {
        status: 500,
      }
    );
  }


  return NextResponse.json({
    ok: true,

    languages:
      languagesResult.data ??
      [],

    services:
      servicesResult.data ??
      [],
  });
}