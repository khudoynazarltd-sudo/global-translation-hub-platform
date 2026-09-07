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
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const {
    id: orderId,
  } =
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


  const body =
    await request.json();

  const newStatus =
    String(
      body.status ?? ""
    ).trim();


  const {
    data: order,
    error: orderError,
  } =
    await supabaseAdmin
      .from("orders")
      .select(`
        id,
        status,
        enquiry_id,
        assigned_translator_id
      `)
      .eq(
        "id",
        orderId
      )
      .eq(
        "assigned_translator_id",
        translator.id
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
          "Order not found or no longer assigned to you.",
      },
      {
        status: 404,
      }
    );
  }


  const allowedTransition =
    (
      (
        order.status ===
          "awaiting_processing" ||
        order.status ===
          "assigned"
      ) &&
      newStatus ===
        "in_translation"
    ) ||
    (
      order.status ===
        "in_translation" &&
      newStatus ===
        "quality_check"
    );


  if (!allowedTransition) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "This status transition is not permitted for translators.",
      },
      {
        status: 400,
      }
    );
  }


  /*
    A translation cannot be submitted for Quality Check
    until at least one final translation file exists.
  */

  if (
    newStatus ===
    "quality_check"
  ) {
    const {
      count,
      error:
        documentCheckError,
    } =
      await supabaseAdmin
        .from("documents")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "enquiry_id",
          order.enquiry_id
        )
        .eq(
          "status",
          "final_translation"
        );


    if (documentCheckError) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to verify the final translation file.",
        },
        {
          status: 500,
        }
      );
    }


    if (!count) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Upload the final translation before submitting for Quality Check.",
        },
        {
          status: 400,
        }
      );
    }
  }


  const {
    error: updateError,
  } =
    await supabaseAdmin
      .from("orders")
      .update({
        status:
          newStatus,
      })
      .eq(
        "id",
        order.id
      )
      .eq(
        "assigned_translator_id",
        translator.id
      );


  if (updateError) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to update order status.",
      },
      {
        status: 500,
      }
    );
  }


  await supabaseAdmin
    .from(
      "order_status_history"
    )
    .insert({
      order_id:
        order.id,

      previous_status:
        order.status,

      new_status:
        newStatus,

      changed_by:
        user.id,

      notes:
        newStatus ===
          "in_translation"
          ? "Translation work started by the assigned translator."
          : "Final translation submitted by the assigned translator for Quality Check.",
    });


  return NextResponse.json({
    ok: true,
    status:
      newStatus,
  });
}