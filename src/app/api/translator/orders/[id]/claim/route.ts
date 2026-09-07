import {
  NextResponse,
} from "next/server";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export async function POST(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id: orderId } =
    await context.params;


  const supabase =
    await createServerSupabaseClient();


  const {
    data: {
      user,
    },

    error: authError,
  } =
    await supabase.auth.getUser();


  if (
    authError ||
    !user
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Authentication required.",
      },
      {
        status: 401,
      }
    );
  }


  /*
    Resolve the translator from the authenticated
    Supabase user. Never trust a translator ID
    supplied by the browser.
  */

  const {
    data: translator,
    error: translatorError,
  } =
    await supabaseAdmin
      .from("translators")
      .select(`
        id,
        active
      `)
      .eq(
        "auth_user_id",
        user.id
      )
      .eq(
        "active",
        true
      )
      .maybeSingle();


  if (
    translatorError ||
    !translator
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Translator access is not authorised.",
      },
      {
        status: 403,
      }
    );
  }


  /*
    Load the order and its language pair.
  */

  const {
    data: order,
    error: orderError,
  } =
    await supabaseAdmin
      .from("orders")
      .select(`
        id,
        paid_at,
        assigned_translator_id,

        enquiries (
          source_language,
          target_language
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


  if (!order.paid_at) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "This order is not eligible for translation.",
      },
      {
        status: 400,
      }
    );
  }


  if (
    order.assigned_translator_id
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "This order has already been claimed by another translator.",
      },
      {
        status: 409,
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
    !enquiry?.source_language ||
    !enquiry?.target_language
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Order language information is incomplete.",
      },
      {
        status: 400,
      }
    );
  }


  /*
    Verify that this translator is approved for
    exactly this language direction.
  */

  const {
    data: allowedPair,
    error: pairError,
  } =
    await supabaseAdmin
      .from(
        "translator_language_pairs"
      )
      .select("id")
      .eq(
        "translator_id",
        translator.id
      )
      .eq(
        "source_language",
        enquiry.source_language
      )
      .eq(
        "target_language",
        enquiry.target_language
      )
      .eq(
        "active",
        true
      )
      .maybeSingle();


  if (
    pairError ||
    !allowedPair
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "This order does not match your approved language pairs.",
      },
      {
        status: 403,
      }
    );
  }


  /*
    Atomic database claim.

    Only one translator can succeed because the
    database function updates the order only where
    assigned_translator_id IS NULL.
  */

  const {
    data: claimed,
    error: claimError,
  } =
    await supabaseAdmin.rpc(
      "claim_translation_order",
      {
        p_order_id:
          order.id,

        p_translator_id:
          translator.id,
      }
    );


  if (claimError) {
    console.error(
      "Order claim failed:",
      claimError
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to claim order.",
      },
      {
        status: 500,
      }
    );
  }


  if (!claimed) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Another translator has already claimed this order.",
      },
      {
        status: 409,
      }
    );
  }


  return NextResponse.json({
    ok: true,
  });
}