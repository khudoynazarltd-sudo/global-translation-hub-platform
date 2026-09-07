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

  const { id } =
    await context.params;

  try {
    const body =
      await request.json();


    const legalName =
      String(
        body.legalName ?? ""
      ).trim();

    const displayName =
      String(
        body.displayName ?? ""
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
      error,
    } = await supabaseAdmin
      .from("translators")
      .update({
        legal_name:
          legalName,

        display_name:
          displayName,

        email:
          String(
            body.email ?? ""
          )
            .trim()
            .toLowerCase() ||
          null,

        telephone:
          String(
            body.telephone ?? ""
          ).trim() ||
          null,

        credentials:
          String(
            body.credentials ?? ""
          ).trim() ||
          null,

        membership_body:
          String(
            body.membershipBody ?? ""
          ).trim() ||
          null,

        membership_number:
          String(
            body.membershipNumber ?? ""
          ).trim() ||
          null,

        notes:
          String(
            body.notes ?? ""
          ).trim() ||
          null,

        active:
          body.active === true,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        id
      );


    if (error) {
      console.error(
        "Translator update failed:",
        error
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to update translator.",
        },
        { status: 500 }
      );
    }


    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Translator update failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to update translator.",
      },
      { status: 500 }
    );
  }
}