import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export const runtime =
  "nodejs";


export async function GET(
  request: Request,
  context: {
    params: Promise<{
      code: string;
    }>;
  }
) {
  const {
    code,
  } =
    await context.params;


  const shortCode =
    String(
      code ?? ""
    )
      .trim()
      .toUpperCase();


  if (!shortCode) {
    return NextResponse.redirect(
      new URL(
        "/payment/cancelled",
        request.url
      )
    );
  }


  const {
    data: paymentLink,
    error: paymentLinkError,
  } =
    await supabaseAdmin
      .from("payment_links")
      .select(`
        id,
        enquiry_id,
        stripe_checkout_url,
        status,
        expires_at
      `)
      .eq(
        "short_code",
        shortCode
      )
      .maybeSingle();


  if (
    paymentLinkError ||
    !paymentLink
  ) {
    return NextResponse.redirect(
      new URL(
        "/payment/cancelled?reason=invalid_link",
        request.url
      )
    );
  }


  const {
    data: existingOrder,
    error: existingOrderError,
  } =
    await supabaseAdmin
      .from("orders")
      .select("id")
      .eq(
        "enquiry_id",
        paymentLink.enquiry_id
      )
      .limit(1)
      .maybeSingle();


  if (existingOrderError) {
    console.error(
      "Unable to verify payment link order state:",
      existingOrderError
    );

    return NextResponse.redirect(
      new URL(
        "/payment/cancelled?reason=verification_failed",
        request.url
      )
    );
  }


  if (existingOrder) {
    await supabaseAdmin
      .from("payment_links")
      .update({
        status:
          "paid",

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        paymentLink.id
      );

    return NextResponse.redirect(
      new URL(
        "/payment/success?already_paid=1",
        request.url
      )
    );
  }


  if (
    paymentLink.status !==
    "active"
  ) {
    const reason =
      paymentLink.status ===
      "paid"
        ? "already_paid"
        : paymentLink.status;

    return NextResponse.redirect(
      new URL(
        `/payment/cancelled?reason=${encodeURIComponent(
          reason
        )}`,
        request.url
      )
    );
  }


  const expiresAt =
    new Date(
      paymentLink.expires_at
    );


  if (
    Number.isNaN(
      expiresAt.getTime()
    ) ||
    expiresAt.getTime() <=
      Date.now()
  ) {
    await supabaseAdmin
      .from("payment_links")
      .update({
        status:
          "expired",

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        paymentLink.id
      );

    return NextResponse.redirect(
      new URL(
        "/payment/cancelled?reason=expired",
        request.url
      )
    );
  }


  return NextResponse.redirect(
    paymentLink.stripe_checkout_url,
    303
  );
}