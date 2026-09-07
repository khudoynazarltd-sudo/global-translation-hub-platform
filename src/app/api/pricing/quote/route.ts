import {
  NextResponse,
} from "next/server";

import {
  calculateServerQuote,
} from "@/lib/pricing/server";


export const dynamic =
  "force-dynamic";


export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();


    const sourceLanguage =
      String(
        body.sourceLanguage ??
          ""
      ).trim();

    const targetLanguage =
      String(
        body.targetLanguage ??
          ""
      ).trim();

    const documentType =
      String(
        body.documentType ??
          ""
      ).trim();

    const turnaround =
      String(
        body.turnaround ??
          ""
      ).trim();


    if (
      !sourceLanguage ||
      !targetLanguage ||
      !documentType ||
      !turnaround
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Incomplete quotation details.",
        },
        {
          status: 400,
        }
      );
    }


    const quote =
      await calculateServerQuote({
        sourceLanguage,
        targetLanguage,
        documentType,
        turnaround,
      });


    return NextResponse.json({
      ok: true,

      requiresManualReview:
        quote.requiresManualReview,

      amount:
        quote.amount,

      currency:
        quote.currency,
    });

  } catch (error) {
    console.error(
      "Pricing quote failed:",
      error
    );


    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to calculate quotation.",
      },
      {
        status: 500,
      }
    );
  }
}