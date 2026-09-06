import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { error } = await supabaseAdmin
      .from("enquiries")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Supabase health check failed:", error);

      return NextResponse.json(
        {
          ok: false,
          message: "Supabase connection failed.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "GLOBAL TRANSLATION HUB database connection is working.",
    });
  } catch (error) {
    console.error("Unexpected health check error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}