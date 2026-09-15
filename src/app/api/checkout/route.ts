import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { stripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const enquiryId = String(body.enquiryId ?? "").trim();

    if (!enquiryId) {
      return NextResponse.json(
        { ok: false, message: "Enquiry ID is required." },
        { status: 400 }
      );
    }

    const { data: enquiry, error } = await supabaseAdmin
      .from("enquiries")
      .select(
        "id, email, full_name, indicative_price, requires_manual_review, status"
      )
      .eq("id", enquiryId)
      .single();

if (error || !enquiry) {
  return NextResponse.json(
    { ok: false, message: "Enquiry not found." },
    { status: 404 }
  );
}

const { data: existingOrder, error: existingOrderError } =
  await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("enquiry_id", enquiry.id)
    .limit(1)
    .maybeSingle();

if (existingOrderError) {
  console.error(
    "Unable to check existing order:",
    existingOrderError
  );

  return NextResponse.json(
    {
      ok: false,
      message:
        "Unable to verify the payment status of this enquiry.",
    },
    { status: 500 }
  );
}

if (
  existingOrder ||
  enquiry.status === "paid"
) {
  return NextResponse.json(
    {
      ok: false,
      message:
        "This enquiry has already been paid. A new payment link cannot be created.",
    },
    { status: 409 }
  );
}

if (enquiry.requires_manual_review) {
  return NextResponse.json(
    {
      ok: false,
      message: "This enquiry requires manual review before payment.",
        },
        { status: 400 }
      );
    }

    if (
      enquiry.indicative_price === null ||
      Number(enquiry.indicative_price) <= 0
    ) {
      return NextResponse.json(
        { ok: false, message: "A valid quotation is required." },
        { status: 400 }
      );
    }

    const amountPence = Math.round(
      Number(enquiry.indicative_price) * 100
    );

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      customer_email: enquiry.email ?? undefined,

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: amountPence,
            product_data: {
              name: "Professional Translation Service",
              description: "GLOBAL TRANSLATION HUB",
            },
          },
        },
      ],

      metadata: {
        enquiryId: enquiry.id,
      },

      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment/cancelled?enquiry=${enquiry.id}`,
    });

if (!session.url) {
  return NextResponse.json(
    {
      ok: false,
      message: "Stripe did not return a Checkout URL.",
    },
    { status: 500 }
  );
}

const shortCode =
  randomBytes(5)
    .toString("hex")
    .toUpperCase();

const shortPaymentUrl =
  `${appUrl}/p/${shortCode}`;

const expiresAt =
  new Date(
    Date.now() +
      7 *
        24 *
        60 *
        60 *
        1000
  ).toISOString();

const { error: paymentLinkError } =
  await supabaseAdmin
    .from("payment_links")
    .upsert(
      {
        enquiry_id:
          enquiry.id,

        short_code:
          shortCode,

        stripe_session_id:
          session.id,

        stripe_checkout_url:
          session.url,

        status:
          "active",

        expires_at:
          expiresAt,

        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          "enquiry_id",
      }
    );

if (paymentLinkError) {
  console.error(
    "Payment link record creation failed:",
    paymentLinkError
  );

  return NextResponse.json(
    {
      ok: false,
      message:
        "The Stripe payment page was created, but the short payment link could not be saved.",
    },
    { status: 500 }
  );
}

return NextResponse.json({
  ok: true,
  checkoutUrl: shortPaymentUrl,
});
  } catch (error) {
    console.error("Checkout creation failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Unable to create secure checkout.",
      },
      { status: 500 }
    );
  }
}