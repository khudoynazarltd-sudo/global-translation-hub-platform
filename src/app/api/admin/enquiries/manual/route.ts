import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_FILE_SIZE =
  25 * 1024 * 1024;

const ALLOWED_TYPES =
  new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);

function extensionForFile(file: File) {
  const original =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase();

  if (
    original &&
    /^[a-z0-9]{1,10}$/.test(original)
  ) {
    return `.${original}`;
  }

  return "";
}

export async function POST(
  request: Request
) {
  await requireAdmin();

  try {
    const formData =
      await request.formData();

    const file =
      formData.get("file");

    const fullName =
      String(
        formData.get("fullName") ?? ""
      ).trim();

    const email =
      String(
        formData.get("email") ?? ""
      )
        .trim()
        .toLowerCase();

    const telephone =
      String(
        formData.get("telephone") ?? ""
      ).trim();

    const sourceLanguage =
      String(
        formData.get(
          "sourceLanguage"
        ) ?? ""
      ).trim();

    const targetLanguage =
      String(
        formData.get(
          "targetLanguage"
        ) ?? ""
      ).trim();

    const documentType =
      String(
        formData.get(
          "documentType"
        ) ?? ""
      ).trim();

    const purpose =
      String(
        formData.get("purpose") ?? ""
      ).trim();

    const turnaround =
      String(
        formData.get("turnaround") ?? ""
      ).trim();

    const price =
      Number(
        formData.get("price")
      );

    if (
      !fullName ||
      !email ||
      !sourceLanguage ||
      !targetLanguage ||
      !documentType ||
      !turnaround
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Please enter a valid quotation amount.",
        },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "A source document is required.",
        },
        { status: 400 }
      );
    }

    if (
      file.size <= 0 ||
      file.size > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "The source document must not exceed 25 MB.",
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_TYPES.has(file.type)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Only PDF, JPG, PNG and DOCX files are accepted.",
        },
        { status: 400 }
      );
    }

    const expiresAt =
      new Date(
        Date.now() +
          24 * 60 * 60 * 1000
      ).toISOString();

    const {
      data: enquiry,
      error: enquiryError,
    } = await supabaseAdmin
      .from("enquiries")
      .insert({
        full_name: fullName,
        email,
        telephone:
          telephone || null,

        source_language:
          sourceLanguage,

        target_language:
          targetLanguage,

        document_type:
          documentType,

        purpose:
          purpose || null,

        turnaround,

        indicative_price:
          price,

        requires_manual_review:
          false,

        status:
          "quoted",

        expires_at:
          expiresAt,
      })
      .select("id")
      .single();

    if (
      enquiryError ||
      !enquiry
    ) {
      console.error(
        "Manual enquiry creation failed:",
        enquiryError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to create manual enquiry.",
        },
        { status: 500 }
      );
    }

    const extension =
      extensionForFile(file);

    const storagePath =
      `${enquiry.id}/${randomUUID()}${extension}`;

    const fileBytes =
      await file.arrayBuffer();

    const {
      error: uploadError,
    } = await supabaseAdmin.storage
      .from("temporary-enquiries")
      .upload(
        storagePath,
        fileBytes,
        {
          contentType:
            file.type,

          upsert: false,
        }
      );

    if (uploadError) {
      await supabaseAdmin
        .from("enquiries")
        .delete()
        .eq("id", enquiry.id);

      console.error(
        "Manual enquiry document upload failed:",
        uploadError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to store source document.",
        },
        { status: 500 }
      );
    }

    const {
      error: documentError,
    } = await supabaseAdmin
      .from("documents")
      .insert({
        enquiry_id:
          enquiry.id,

        storage_path:
          storagePath,

        original_filename:
          file.name,

        mime_type:
          file.type,

        file_size:
          file.size,

        status:
          "temporary",

        expires_at:
          expiresAt,
      });

    if (documentError) {
      await supabaseAdmin.storage
        .from("temporary-enquiries")
        .remove([
          storagePath,
        ]);

      await supabaseAdmin
        .from("enquiries")
        .delete()
        .eq("id", enquiry.id);

      console.error(
        "Manual enquiry document record failed:",
        documentError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to save document record.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      enquiryId:
        enquiry.id,

      amount:
        price,
    });
  } catch (error) {
    console.error(
      "Manual enquiry failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to create manual enquiry.",
      },
      { status: 500 }
    );
  }
}
