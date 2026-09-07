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
  request: Request
) {
  await requireAdmin();

  try {
    const body =
      await request.json();

    const legalName =
      String(
        body.legalName ??
          ""
      ).trim();

    const displayName =
      String(
        body.displayName ??
          ""
      ).trim();

    const email =
      String(
        body.email ??
          ""
      )
        .trim()
        .toLowerCase();

    const telephone =
      String(
        body.telephone ??
          ""
      ).trim();

    const credentials =
      String(
        body.credentials ??
          ""
      ).trim();

    const membershipBody =
      String(
        body.membershipBody ??
          ""
      ).trim();

    const membershipNumber =
      String(
        body.membershipNumber ??
          ""
      ).trim();

    const notes =
      String(
        body.notes ??
          ""
      ).trim();


    if (
      !legalName ||
      !displayName
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Legal name and certificate display name are required.",
        },
        { status: 400 }
      );
    }


    const {
      data: translator,
      error,
    } = await supabaseAdmin
      .from("translators")
      .insert({
        active:
          true,

        legal_name:
          legalName,

        display_name:
          displayName,

        email:
          email ||
          null,

        telephone:
          telephone ||
          null,

        credentials:
          credentials ||
          null,

        membership_body:
          membershipBody ||
          null,

        membership_number:
          membershipNumber ||
          null,

        notes:
          notes ||
          null,
      })
      .select(`
        id,
        display_name
      `)
      .single();


    if (
      error ||
      !translator
    ) {
      console.error(
        "Translator creation failed:",
        error
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to create translator.",
        },
        { status: 500 }
      );
    }


    return NextResponse.json({
      ok: true,
      translator,
    });
  } catch (error) {
    console.error(
      "Translator creation failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to create translator.",
      },
      { status: 500 }
    );
  }
}