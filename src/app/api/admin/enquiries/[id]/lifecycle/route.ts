import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  await requireAdmin();

  const { id: enquiryId } =
    await context.params;

  const formData =
    await request.formData();

  const action =
    String(
      formData.get("action") ?? ""
    ).trim();

  const { data: enquiry, error: enquiryError } =
    await supabaseAdmin
      .from("enquiries")
      .select("id, status, expires_at")
      .eq("id", enquiryId)
      .maybeSingle();

  if (enquiryError || !enquiry) {
    return NextResponse.json(
      {
        ok: false,
        message: "Enquiry not found.",
      },
      { status: 404 }
    );
  }

  if (enquiry.status === "paid") {
    return NextResponse.json(
      {
        ok: false,
        message:
          "A paid enquiry cannot be deleted or extended from this page.",
      },
      { status: 400 }
    );
  }

  if (action === "extend") {
    const currentExpiry =
      enquiry.expires_at
        ? new Date(enquiry.expires_at)
        : new Date();

    const baseTime =
      currentExpiry.getTime() > Date.now()
        ? currentExpiry.getTime()
        : Date.now();

    const extendedExpiry =
      new Date(
        baseTime +
          7 *
            24 *
            60 *
            60 *
            1000
      ).toISOString();

    const { error: updateError } =
      await supabaseAdmin
        .from("enquiries")
        .update({
          expires_at: extendedExpiry,
        })
        .eq("id", enquiryId)
        .neq("status", "paid");

    if (updateError) {
      console.error(
        "Unable to extend enquiry:",
        updateError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to extend enquiry.",
        },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("documents")
      .update({
        expires_at: extendedExpiry,
      })
      .eq("enquiry_id", enquiryId)
      .eq("status", "temporary");

    return NextResponse.redirect(
      new URL(
        `/admin/enquiries/${enquiryId}`,
        request.url
      ),
      303
    );
  }

  if (action === "delete") {
    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("enquiry_id", enquiryId)
        .limit(1)
        .maybeSingle();

    if (orderError) {
      console.error(
        "Unable to check enquiry order:",
        orderError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to verify enquiry payment state.",
        },
        { status: 500 }
      );
    }

    if (order) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "An enquiry linked to an order cannot be deleted.",
        },
        { status: 400 }
      );
    }

    const {
      data: documents,
      error: documentsError,
    } =
      await supabaseAdmin
        .from("documents")
        .select("id, storage_path, status")
        .eq("enquiry_id", enquiryId);

    if (documentsError) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to load enquiry documents.",
        },
        { status: 500 }
      );
    }

    const temporaryPaths =
      (documents ?? [])
        .filter(
          (document) =>
            document.status === "temporary"
        )
        .map(
          (document) =>
            document.storage_path
        )
        .filter(Boolean);

    if (temporaryPaths.length > 0) {
      const { error: storageError } =
        await supabaseAdmin.storage
          .from("temporary-enquiries")
          .remove(temporaryPaths);

      if (storageError) {
        console.error(
          "Unable to delete enquiry files:",
          storageError
        );

        return NextResponse.json(
          {
            ok: false,
            message:
              "Unable to delete enquiry files.",
          },
          { status: 500 }
        );
      }
    }

    const { error: documentDeleteError } =
      await supabaseAdmin
        .from("documents")
        .delete()
        .eq("enquiry_id", enquiryId);

    if (documentDeleteError) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to delete enquiry documents.",
        },
        { status: 500 }
      );
    }

    const { error: deleteError } =
      await supabaseAdmin
        .from("enquiries")
        .delete()
        .eq("id", enquiryId)
        .neq("status", "paid");

    if (deleteError) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to delete enquiry.",
        },
        { status: 500 }
      );
    }

    return NextResponse.redirect(
      new URL(
        "/admin/enquiries",
        request.url
      ),
      303
    );
  }

  return NextResponse.json(
    {
      ok: false,
      message: "Invalid lifecycle action.",
    },
    { status: 400 }
  );
}