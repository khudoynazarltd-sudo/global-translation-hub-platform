import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json(
        { ok: false, message: "Invalid payment session." },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({
        ok: true,
        confirmed: false,
        status: "payment_pending",
      });
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("id, status")
      .eq("provider_payment_id", session.id)
      .maybeSingle();

    if (paymentError) {
      console.error("Payment lookup failed:", paymentError);

      return NextResponse.json(
        { ok: false, message: "Unable to verify payment record." },
        { status: 500 }
      );
    }

    if (!payment) {
      return NextResponse.json({
        ok: true,
        confirmed: true,
        orderReady: false,
      });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("order_reference, status, paid_at")
      .eq("payment_id", payment.id)
      .maybeSingle();

    if (orderError) {
      console.error("Order lookup failed:", orderError);

      return NextResponse.json(
        { ok: false, message: "Unable to retrieve order." },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json({
        ok: true,
        confirmed: true,
        orderReady: false,
      });
    }

    return NextResponse.json({
      ok: true,
      confirmed: true,
      orderReady: true,
      orderReference: order.order_reference,
      orderStatus: order.status,
      paidAt: order.paid_at,
    });
  } catch (error) {
    console.error("Payment confirmation failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Unable to confirm the payment.",
      },
      { status: 500 }
    );
  }
}
