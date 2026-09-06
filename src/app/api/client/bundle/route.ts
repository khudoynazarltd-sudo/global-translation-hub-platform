import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashOrderAccessToken } from "@/lib/orders/access-token";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const token =
      searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Invalid secure access link.",
        },
        { status: 400 }
      );
    }

    const tokenHash =
      hashOrderAccessToken(token);

    const {
      data: access,
      error: accessError,
    } = await supabaseAdmin
      .from("order_access_tokens")
      .select(`
        order_id,
        expires_at,
        revoked_at
      `)
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (
      accessError ||
      !access ||
      access.revoked_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Secure access is unavailable.",
        },
        { status: 404 }
      );
    }

    if (
      access.expires_at &&
      new Date(
        access.expires_at
      ).getTime() < Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "This secure access link has expired.",
        },
        { status: 410 }
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
      .eq("order_id", access.order_id)
      .maybeSingle();

    if (
      certificateError ||
      !certificate ||
      certificate.status !== "issued" ||
      !certificate.bundle_storage_path
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "The certified translation bundle is not yet available.",
        },
        { status: 404 }
      );
    }

    const {
      data,
      error: signedUrlError,
    } = await supabaseAdmin.storage
      .from("certified-bundles")
      .createSignedUrl(
        certificate.bundle_storage_path,
        120
      );

    if (
      signedUrlError ||
      !data?.signedUrl
    ) {
      console.error(
        "Client bundle signed URL failed:",
        signedUrlError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to create secure bundle download link.",
        },
        { status: 500 }
      );
    }

    return NextResponse.redirect(
      data.signedUrl
    );
  } catch (error) {
    console.error(
      "Client bundle download failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to download certified bundle.",
      },
      { status: 500 }
    );
  }
}