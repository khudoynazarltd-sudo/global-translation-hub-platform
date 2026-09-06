import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createOrderAccessToken } from "@/lib/orders/access-token";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await requireAdmin();

  const { id: orderId } = await context.params;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, order_reference")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json(
      { ok: false, message: "Order not found." },
      { status: 404 }
    );
  }

  await supabaseAdmin
    .from("order_access_tokens")
    .update({
      revoked_at: new Date().toISOString(),
    })
    .eq("order_id", order.id)
    .is("revoked_at", null);

  const token = await createOrderAccessToken(order.id);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const url = `${appUrl}/order?token=${encodeURIComponent(token)}`;

  return NextResponse.json({
    ok: true,
    orderReference: order.order_reference,
    url,
  });
}