import {
NextResponse,
} from "next/server";

import {
randomBytes,
} from "crypto";

import {
requireAdmin,
} from "@/lib/auth/require-admin";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

import {
  stripe,
} from "@/lib/stripe/server";

import {
  sendQuotationReadyEmail,
} from "@/lib/email/send-quotation-ready";


export const runtime =
  "nodejs";


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
          full_name,
          email,
          source_language,
          target_language,
          document_type,
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


    if (!enquiry.email) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "The client email address is missing.",
        },
        {
          status: 400,
        }
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
      enquiry.id
    )
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
    {
      status: 500,
    }
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
    {
      status: 409,
    }
  );
}


const expiresAt =
  new Date(
    Date.now() +
      7 *
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
            notes ||
            null,

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
            "Unable to approve quotation.",
        },
        {
          status: 500,
        }
      );
    }


    const amountPence =
      Math.round(
        price *
          100
      );


    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";


    const session =
      await stripe.checkout.sessions.create({
        mode:
          "payment",

        customer_email:
          enquiry.email,

        line_items: [
          {
            quantity:
              1,

            price_data: {
              currency:
                "gbp",

              unit_amount:
                amountPence,

              product_data: {
                name:
                  "Professional Translation Service",

                description:
                  "GLOBAL TRANSLATION HUB",
              },
            },
          },
        ],

        metadata: {
          enquiryId:
            enquiry.id,
        },

        success_url:
          `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${appUrl}/payment/cancelled?enquiry=${enquiry.id}`,
      });


    if (!session.url) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Stripe did not return a Checkout URL.",
        },
        {
          status: 500,
        }
  );
}

const shortCode =
  randomBytes(5)
    .toString("hex")
    .toUpperCase();


const shortPaymentUrl =
  `${appUrl}/p/${shortCode}`;


const {
  error: paymentLinkError,
} =
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
    {
      status: 500,
    }
  );
}


try {
  await sendQuotationReadyEmail({
    to:
      enquiry.email,

        clientName:
          enquiry.full_name ||
          "Client",

        amount:
          price,

        sourceLanguage:
          enquiry.source_language ||
          "",

        targetLanguage:
          enquiry.target_language ||
          "",

    documentType:
      enquiry.document_type ||
      "Translation",

    turnaround,

    checkoutUrl:
      shortPaymentUrl,
  });
} catch (emailError) {
  console.error(
    "Quotation payment email failed:",
    emailError
  );

      return NextResponse.json(
        {
          ok: false,

      message:
        "The quotation was approved and the payment link was created, but the email could not be sent.",

      checkoutUrl:
        shortPaymentUrl,
    },
    {
      status: 500,
    }
  );
    }


return NextResponse.json({
  ok:
    true,

  checkoutUrl:
    shortPaymentUrl,

  message:
    "Quotation approved and emailed to the client.",
});

  } catch (error) {
    console.error(
      "Quotation approval failed:",
      error
    );


    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to approve and send the quotation.",
      },
      {
        status: 500,
      }
    );
  }
}