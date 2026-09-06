import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { promoteSourceDocuments } from "@/lib/orders/promote-source-documents";
import { createOrderAccessToken } from "@/lib/orders/access-token";
import { sendOrderConfirmedEmail } from "@/lib/email/send-order-confirmed";

export const runtime = "nodejs";



export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { ok: false, message: "Webhook configuration missing." },
      { status: 400 }
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);

    return NextResponse.json(
      { ok: false, message: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  try {
    if (session.payment_status !== "paid") {
      return NextResponse.json({ ok: true });
    }

    const enquiryId = session.metadata?.enquiryId;

    if (!enquiryId) {
      throw new Error("Stripe session does not contain enquiryId.");
    }

    /*
      Idempotency check:
      if this Stripe Checkout Session has already created a payment/order,
      do not create another one.
    */
    const { data: existingPayment, error: existingPaymentError } =
      await supabaseAdmin
        .from("payments")
        .select("id")
        .eq("provider_payment_id", session.id)
        .maybeSingle();
    
    if (existingPaymentError) {
      throw new Error("Unable to check existing payment.");
    }
    
    if (existingPayment) {
      const { data: existingOrder, error: existingOrderError } =
        await supabaseAdmin
          .from("orders")
          .select("id, order_reference")
          .eq("payment_id", existingPayment.id)
          .maybeSingle();
    
      if (existingOrderError) {
        throw new Error("Unable to check existing order.");
      }
    
      if (existingOrder) {
        return NextResponse.json({
          ok: true,
          orderReference: existingOrder.order_reference,
        });
      }
    
      throw new Error(
        "Payment exists but the corresponding order has not been created."
      );
    }

    const { data: enquiry, error: enquiryError } =
      await supabaseAdmin
        .from("enquiries")
        .select(
          "id, indicative_price, requires_manual_review, status"
        )
        .eq("id", enquiryId)
        .single();

    if (enquiryError || !enquiry) {
      throw new Error("Enquiry not found.");
    }

    if (enquiry.requires_manual_review) {
      throw new Error(
        "Manual-review enquiry cannot automatically create an order."
      );
    }

    const amountPaid =
      typeof session.amount_total === "number"
        ? session.amount_total / 100
        : Number(enquiry.indicative_price);

    const { data: payment, error: paymentError } =
      await supabaseAdmin
        .from("payments")
        .insert({
          enquiry_id: enquiryId,
          provider: "stripe",
          provider_payment_id: session.id,
          amount: amountPaid,
          currency: "GBP",
          status: "paid",
        })
        .select("id")
        .single();

    if (paymentError || !payment) {
      throw new Error("Unable to create payment record.");
    }

    /*
      Generate next public order number.
      For MVP we derive the sequence from the number of existing orders.
      Later we will replace this with a database sequence for stronger
      concurrency guarantees.
    */
    const { data: orderReference, error: referenceError } =
      await supabaseAdmin.rpc("generate_gth_order_reference");
    
    if (referenceError || !orderReference) {
      console.error(
        "Order reference generation failed:",
        referenceError
      );
    
      throw new Error("Unable to generate order reference.");
    }

    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .insert({
          order_reference: orderReference,
          enquiry_id: enquiryId,
          payment_id: payment.id,
          status: "awaiting_processing",
          paid_at: new Date().toISOString(),
        })
        .select("id, order_reference")
        .single();

    if (orderError || !order) {
      throw new Error("Unable to create order.");
    }

    const { error: enquiryUpdateError } =
      await supabaseAdmin
        .from("enquiries")
        .update({
          status: "paid",
          expires_at: null,
        })
        .eq("id", enquiryId);

    if (enquiryUpdateError) {
      throw new Error("Unable to update enquiry.");
    }

    const { error: documentUpdateError } =
      await supabaseAdmin
        .from("documents")
        .update({
          status: "paid",
          expires_at: null,
        })
        .eq("enquiry_id", enquiryId);

    if (documentUpdateError) {
      throw new Error("Unable to update document retention status.");
    }

    await supabaseAdmin
      .from("order_status_history")
      .insert({
        order_id: order.id,
        previous_status: null,
        new_status: "awaiting_processing",
        notes: "Order created automatically after confirmed Stripe payment.",
      });

    try {
      await promoteSourceDocuments(
        enquiryId,
        order.order_reference
      );

    } catch (error) {
      console.error(
        "Paid source document promotion failed:",
        error
      );
    }
    let clientAccessToken: string | null = null;
    
    try {
      clientAccessToken = await createOrderAccessToken(order.id);
    } catch (error) {
      console.error(
        "Client order access token creation failed:",
        error
      );
    }
    
      if (clientAccessToken) {
        try {
          const { data: enquiryDetails } = await supabaseAdmin
            .from("enquiries")
            .select("full_name, email")
            .eq("id", enquiryId)
            .maybeSingle();
      
          if (enquiryDetails?.email) {
            const appUrl =
              process.env.NEXT_PUBLIC_APP_URL ||
              "http://localhost:3000";
      
            const orderUrl =
              `${appUrl}/order?token=${encodeURIComponent(
                clientAccessToken
              )}`;
      
            await sendOrderConfirmedEmail({
              to: enquiryDetails.email,
              clientName:
                enquiryDetails.full_name ||
                "Client",
              orderReference:
                order.order_reference,
              orderUrl,
            });
          }
        } catch (error) {
          console.error(
            "Order confirmation email failed:",
            error
          );
        }
      }

    
    return NextResponse.json({
      ok: true,
      orderReference: order.order_reference,
    });
  } catch (error) {
    console.error("Stripe webhook processing failed:", error);

    return NextResponse.json(
      { ok: false, message: "Webhook processing failed." },
      { status: 500 }
    );
  }
}