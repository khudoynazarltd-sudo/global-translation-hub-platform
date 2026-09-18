import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createOrderAccessToken } from "@/lib/orders/access-token";
import { sendTranslationReadyEmail } from "@/lib/email/send-translation-ready";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  await requireAdmin();

  const { id: orderId } =
    await context.params;

  const {
    data: order,
    error: orderError,
  } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      order_reference,
      enquiry_id,
      enquiries (
        full_name,
        email
      )
    `)
    .eq(
      "id",
      orderId
    )
    .maybeSingle();

  if (
    orderError ||
    !order
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Order not found.",
      },
      {
        status: 404,
      }
    );
  }

  const enquiry =
    Array.isArray(
      order.enquiries
    )
      ? order.enquiries[0]
      : order.enquiries;

  if (
    !enquiry?.email
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "The client does not have an email address.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    data: certificate,
    error: certificateError,
  } = await supabaseAdmin
    .from("certificates")
    .select(`
      status,
      bundle_storage_path
    `)
    .eq(
      "order_id",
      order.id
    )
    .maybeSingle();

  if (
    certificateError ||
    !certificate ||
    certificate.status !==
      "issued" ||
    !certificate.bundle_storage_path
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "The certified bundle must be generated before it can be sent to the client.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    error: revokeError,
  } = await supabaseAdmin
    .from(
      "order_access_tokens"
    )
    .update({
      revoked_at:
        new Date().toISOString(),
    })
    .eq(
      "order_id",
      order.id
    )
    .is(
      "revoked_at",
      null
    );

  if (revokeError) {
    console.error(
      "Unable to revoke previous client access links:",
      revokeError
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to prepare secure client access.",
      },
      {
        status: 500,
      }
    );
  }

  const token =
    await createOrderAccessToken(
      order.id
    );

  const appUrl =
    process.env
      .NEXT_PUBLIC_APP_URL ||
    process.env
      .NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const url =
    `${appUrl.replace(/\/$/, "")}` +
    `/order?token=${encodeURIComponent(
      token
    )}`;

  try {
    await sendTranslationReadyEmail({
      to:
        enquiry.email,

      clientName:
        enquiry.full_name ||
        "Client",

      orderReference:
        order.order_reference,

      orderUrl:
        url,
    });
  } catch (error) {
    console.error(
      "Final delivery email failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "The secure link was created, but the email could not be sent.",
        url,
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Final translation email sent successfully.",
    url,
  });
}
