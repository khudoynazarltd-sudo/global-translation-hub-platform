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
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const {
    user,
  } =
    await requireAdmin();


  const {
    id,
  } =
    await context.params;


  try {
    const body =
      await request.json();


    const price =
      Number(
        body.price
      );


    const turnaround =
      String(
        body.turnaround ??
          ""
      ).trim();


    const notes =
      String(
        body.notes ??
          ""
      ).trim();


    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Please enter a valid quotation amount.",
        },
        {
          status: 400,
        }
      );
    }


    if (!turnaround) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Please select a turnaround.",
        },
        {
          status: 400,
        }
      );
    }


    const {
      data: enquiry,
      error: enquiryError,
    } =
      await supabaseAdmin
        .from("enquiries")
        .select(`
          id,
          status
        `)
        .eq(
          "id",
          id
        )
        .maybeSingle();


    if (
      enquiryError ||
      !enquiry
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Enquiry not found.",
        },
        {
          status: 404,
        }
      );
    }


    const expiresAt =
      new Date(
        Date.now() +
          24 *
            60 *
            60 *
            1000
      ).toISOString();


    const {
      error: updateError,
    } =
      await supabaseAdmin
        .from("enquiries")
        .update({
          indicative_price:
            price,

          turnaround,

          admin_notes:
            notes || null,

          status:
            "quoted",

          requires_manual_review:
            false,

          reviewed_at:
            new Date().toISOString(),

          reviewed_by:
            user.id,

          expires_at:
            expiresAt,
        })
        .eq(
          "id",
          id
        );


    if (updateError) {
      console.error(
        "Manual review update failed:",
        updateError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to save manual review.",
        },
        {
          status: 500,
        }
      );
    }


    return NextResponse.json({
      ok: true,
      amount:
        price,
    });

  } catch (error) {
    console.error(
      "Manual review failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to save manual review.",
      },
      {
        status: 500,
      }
    );
  }
}