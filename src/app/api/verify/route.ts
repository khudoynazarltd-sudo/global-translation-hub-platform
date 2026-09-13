import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const reference =
      String(
        searchParams.get("reference") ?? ""
      )
        .trim()
        .toUpperCase();

    if (!reference) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Certificate reference is required.",
        },
        { status: 400 }
      );
    }

    const { data: certificate, error } =
      await supabaseAdmin
        .from("certificates")
        .select(`
          certificate_reference,
          document_title,
          source_language,
          target_language,
          certification_date,
          status,
          orders (
            order_reference
          )
        `)
        .eq(
          "certificate_reference",
          reference
        )
        .maybeSingle();

    if (error) {
      console.error(
        "Certificate verification lookup failed:",
        error
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to verify certificate.",
        },
        { status: 500 }
      );
    }

    if (
      !certificate ||
      certificate.status !== "issued"
    ) {
      return NextResponse.json(
        {
          ok: true,
          valid: false,
        }
      );
    }

    const order =
      Array.isArray(certificate.orders)
        ? certificate.orders[0]
        : certificate.orders;

    return NextResponse.json({
      ok: true,
      valid: true,

      certificate: {
        reference:
          certificate.certificate_reference,

        orderReference:
          order?.order_reference ?? null,

        documentTitle:
          certificate.document_title,

        sourceLanguage:
          certificate.source_language,

        targetLanguage:
          certificate.target_language,

        certificationDate:
          certificate.certification_date,

        company:
          "GLOBAL TRANSLATION HUB / KHUDOYNAZAR LTD",

        companyNumber:
          "16122617",
      },
    });
  } catch (error) {
    console.error(
      "Certificate verification failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to verify certificate.",
      },
      { status: 500 }
    );
  }
}