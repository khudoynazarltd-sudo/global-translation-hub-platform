import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export async function POST(
  request: Request
) {
  await requireAdmin();


  const body =
    await request.json();

  const action =
    String(
      body.action ?? ""
    );

  if (
    action ===
    "update_pair_price"
  ) {
    const price =
      Number(
        body.price
      );


    if (
      !body.id ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return errorResponse(
        "Invalid language pair price."
      );
    }


    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "language_pair_prices"
        )
        .update({
          base_price:
            price,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          body.id
        );


    if (error) {
      console.error(
        "Language pair price update failed:",
        error
      );

      return errorResponse(
        "Unable to update language pair price.",
        500
      );
    }


    return ok(
      "Language pair price updated."
    );
  }


  if (
    action ===
    "move_service"
  ) {
    const id =
      String(
        body.id ?? ""
      ).trim();

    const direction =
      String(
        body.direction ?? ""
      );


    if (
      !id ||
      ![
        "up",
        "down",
      ].includes(
        direction
      )
    ) {
      return errorResponse(
        "Invalid service move request."
      );
    }


    const {
      data: serviceRows,
      error: servicesError,
    } =
      await supabaseAdmin
        .from("service_types")
        .select(`
          id,
          sort_order
        `)
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        )
        .order(
          "id",
          {
            ascending:
              true,
          }
        );


    if (
      servicesError ||
      !serviceRows
    ) {
      console.error(
        "Unable to load services for reordering:",
        servicesError
      );

      return errorResponse(
        "Unable to reorder services.",
        500
      );
    }


    const currentIndex =
      serviceRows.findIndex(
        (service) =>
          service.id === id
      );


    if (
      currentIndex < 0
    ) {
      return errorResponse(
        "Service not found."
      );
    }


    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;


    if (
      targetIndex < 0 ||
      targetIndex >=
        serviceRows.length
    ) {
      return ok(
        "Service is already at the edge of the list."
      );
    }


    const currentService =
      serviceRows[
        currentIndex
      ];

    const targetService =
      serviceRows[
        targetIndex
      ];


    const currentSortOrder =
      Number(
        currentService.sort_order
      );

    const targetSortOrder =
      Number(
        targetService.sort_order
      );


    const {
      error:
        currentUpdateError,
    } =
      await supabaseAdmin
        .from("service_types")
        .update({
          sort_order:
            targetSortOrder,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          currentService.id
        );


    if (
      currentUpdateError
    ) {
      console.error(
        "Unable to move service:",
        currentUpdateError
      );

      return errorResponse(
        "Unable to reorder services.",
        500
      );
    }


    const {
      error:
        targetUpdateError,
    } =
      await supabaseAdmin
        .from("service_types")
        .update({
          sort_order:
            currentSortOrder,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          targetService.id
        );


    if (
      targetUpdateError
    ) {
      console.error(
        "Unable to move adjacent service:",
        targetUpdateError
      );

      return errorResponse(
        "Unable to reorder services.",
        500
      );
    }


    return ok(
      "Service order updated."
    );
  }



  if (
    action ===
    "update_service"
  ) {
    const priceText =
      String(
        body.basePrice ?? ""
      ).trim();

    const price =
      priceText
        ? Number(priceText)
        : null;


    if (
      price !== null &&
      (
        !Number.isFinite(price) ||
        price < 0
      )
    ) {
      return errorResponse(
        "Invalid base price."
      );
    }


    const {
      error,
    } =
      await supabaseAdmin
        .from("service_types")
        .update({
          name:
            String(
              body.name ?? ""
            ).trim(),

          base_price:
            price,

          manual_review:
            Boolean(
              body.manualReview
            ),

          active:
            Boolean(
              body.active
            ),

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          body.id
        );


    if (error) {
      return errorResponse(
        "Unable to update service.",
        500
      );
    }


    return ok(
      "Service updated."
    );
  }


  if (
    action ===
    "add_service"
  ) {
    const name =
      String(
        body.name ?? ""
      ).trim();

    const code =
      String(
        body.code ?? ""
      )
        .trim()
        .toLowerCase();


    const price =
      Number(
        body.basePrice
      );


    if (
      !name ||
      !code
    ) {
      return errorResponse(
        "Service name and code are required."
      );
    }


    const {
      error,
    } =
      await supabaseAdmin
        .from("service_types")
        .insert({
          name,
          code,

          base_price:
            Number.isFinite(price)
              ? price
              : null,

          manual_review:
            !Number.isFinite(price),

          active:
            true,
        });


    if (error) {
      console.error(error);

      return errorResponse(
        "Unable to add service.",
        500
      );
    }


    return ok(
      "Service added."
    );
  }


  if (
    action ===
    "add_language"
  ) {
    const name =
      String(
        body.name ?? ""
      ).trim();

    const code =
      String(
        body.code ?? ""
      )
        .trim()
        .toLowerCase();


    if (
      !name ||
      !code
    ) {
      return errorResponse(
        "Language name and code are required."
      );
    }


    const {
      error,
    } =
      await supabaseAdmin
        .from("languages")
        .insert({
          name,
          code,
          active:
            true,
        });


    if (error) {
      console.error(error);

      return errorResponse(
        "Unable to add language.",
        500
      );
    }


    return ok(
      "Language added."
    );
  }

  if (
    action ===
    "delete_language_price"
  ) {
    const id =
      String(
        body.id ?? ""
      ).trim();


    if (!id) {
      return errorResponse(
        "Price override ID is required."
      );
    }


    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "service_language_prices"
        )
        .delete()
        .eq(
          "id",
          id
        );


    if (error) {
      console.error(
        "Language price deletion failed:",
        error
      );

      return errorResponse(
        "Unable to delete language-specific price.",
        500
      );
    }


    return ok(
      "Language-specific price deleted."
    );
  }



  if (
    action ===
    "add_language_price"
  ) {
    const price =
      Number(
        body.price
      );


    if (
      !body.serviceId ||
      !body.sourceLanguageId ||
      !body.targetLanguageId ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return errorResponse(
        "Complete all language pricing fields."
      );
    }


    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "service_language_prices"
        )
        .upsert(
          {
            service_id:
              body.serviceId,

            source_language_id:
              body.sourceLanguageId,

            target_language_id:
              body.targetLanguageId,

            price,

            manual_review:
              false,

            active:
              true,

            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "service_id,source_language_id,target_language_id",
          }
        );


    if (error) {
      console.error(error);

      return errorResponse(
        "Unable to save language-specific price.",
        500
      );
    }


    return ok(
      "Language-specific price saved."
    );
  }


  if (
    action ===
    "update_settings"
  ) {
    const standard =
      Number(
        body.standard
      );

    const priority =
      Number(
        body.priority
      );

    const urgent =
      Number(
        body.urgent
      );


    if (
      !Number.isFinite(standard) ||
      !Number.isFinite(priority) ||
      !Number.isFinite(urgent) ||
      standard <= 0 ||
      priority <= 0 ||
      urgent <= 0
    ) {
      return errorResponse(
        "Invalid turnaround multipliers."
      );
    }


    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "pricing_settings"
        )
        .update({
          standard_multiplier:
            standard,

          priority_multiplier:
            priority,

          urgent_multiplier:
            urgent,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          1
        );


    if (error) {
      return errorResponse(
        "Unable to update pricing settings.",
        500
      );
    }


    return ok(
      "Turnaround pricing updated."
    );
  }


  return errorResponse(
    "Unknown pricing action."
  );
}


function ok(
  message: string
) {
  return NextResponse.json({
    ok: true,
    message,
  });
}


function errorResponse(
  message: string,
  status = 400
) {
  return NextResponse.json(
    {
      ok: false,
      message,
    },
    {
      status,
    }
  );
}