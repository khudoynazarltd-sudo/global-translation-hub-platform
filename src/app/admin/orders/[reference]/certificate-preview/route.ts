import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { buildCertificateHtml } from "@/lib/certificate/build-certificate-html";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      reference: string;
    }>;
  }
) {
  await requireAdmin();

  const { reference } =
    await context.params;


  const {
    data: order,
    error: orderError,
  } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      order_reference
    `)
    .eq(
      "order_reference",
      reference
    )
    .maybeSingle();


  if (
    orderError ||
    !order
  ) {
    notFound();
  }


  const {
    data: certificate,
    error: certificateError,
  } = await supabaseAdmin
    .from("certificates")
    .select("*")
    .eq(
      "order_id",
      order.id
    )
    .maybeSingle();


  if (
    certificateError ||
    !certificate
  ) {
    notFound();
  }


  const html =
    await buildCertificateHtml({
      certificate,
      order: {
        order_reference:
          order.order_reference,
      },
    });


  return new Response(
    html,
    {
      headers: {
        "Content-Type":
          "text/html; charset=utf-8",

        "Cache-Control":
          "no-store, max-age=0",
      },
    }
  );
}