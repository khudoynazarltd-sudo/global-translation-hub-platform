import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createOrderAccessToken } from "@/lib/orders/access-token";
import { sendTranslationReadyEmail } from "@/lib/email/send-translation-ready";

const ALLOWED_STATUSES = new Set([
  "awaiting_processing",
  "assigned",
  "in_translation",
  "quality_check",
  "certification",
  "ready",
  "delivered",
  "cancelled",
  "refunded",
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { user } = await requireAdmin();
  const { id } = await context.params;

  const body = await request.json();
  const newStatus = String(body.status ?? "").trim();

  if (!ALLOWED_STATUSES.has(newStatus)) {
    return NextResponse.json(
      { ok: false, message: "Invalid order status." },
      { status: 400 }
    );
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      status,
      order_reference,
      enquiry_id
    `)
    .eq("id", id)
    .maybeSingle();


  if (orderError || !order) {
    return NextResponse.json(
      { ok: false, message: "Order not found." },
      { status: 404 }
    );
  }

  if (order.status === newStatus) {
    return NextResponse.json({
      ok: true,
      status: newStatus,
    });
  }

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({
      status: newStatus,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { ok: false, message: "Unable to update order status." },
      { status: 500 }
    );
  }

  await supabaseAdmin
    .from("order_status_history")
    .insert({
      order_id: id,
      previous_status: order.status,
      new_status: newStatus,
      changed_by: user.id,
      notes: "Status updated through the administration panel.",
    });

  if (newStatus === "ready") {
    try {
      const { data: enquiryDetails, error: enquiryError } =
        await supabaseAdmin
          .from("enquiries")
          .select(`
            full_name,
            email
          `)
          .eq("id", order.enquiry_id)
          .maybeSingle();

      if (enquiryError) {
        console.error(
          "Unable to load client details for ready email:",
          enquiryError
        );
      }

      if (enquiryDetails?.email) {
        /*
          Revoke previous client access links.

          A fresh secure link is issued when the translation
          becomes ready for collection.
        */
        await supabaseAdmin
          .from("order_access_tokens")
          .update({
            revoked_at: new Date().toISOString(),
          })
          .eq("order_id", order.id)
          .is("revoked_at", null);

        const clientAccessToken =
          await createOrderAccessToken(order.id);

        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          "http://localhost:3000";

        const orderUrl =
          `${appUrl}/order?token=${encodeURIComponent(
            clientAccessToken
          )}`;

        await sendTranslationReadyEmail({
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
      /*
        Email failure must never roll back or invalidate
        the legitimate order status change.
      */
      console.error(
        "Translation ready email failed:",
        error
      );
    }
  }

  return NextResponse.json({
    ok: true,
    status: newStatus,
  });
}