import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  DOCUMENT_TYPES,
  PURPOSES,
  SOURCE_LANGUAGES,
  TARGET_LANGUAGES,
  TURNAROUNDS,
} from "@/lib/pricing";

import {
  calculateServerQuote,
} from "@/lib/pricing/server";
export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const MAX_FILE_SIZE = 15 * 1024 * 1024;

function getExtension(mimeType: string) {
  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    default:
      return null;
  }
}

function allowed(value: string, values: readonly string[]) {
  return values.includes(value);
}

export async function POST(request: Request) {
  let enquiryId: string | null = null;
  let storagePath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, message: "A document file is required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { ok: false, message: "Only PDF, JPG and PNG files are accepted." },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          ok: false,
          message:
            file.size <= 0
              ? "The uploaded file is empty."
              : "The maximum permitted file size is 15 MB.",
        },
        { status: 400 }
      );
    }

    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const telephone = String(formData.get("telephone") ?? "").trim();

    const sourceLanguage = String(
      formData.get("sourceLanguage") ?? ""
    ).trim();

    const targetLanguage = String(
      formData.get("targetLanguage") ?? ""
    ).trim();

    const documentType = String(
      formData.get("documentType") ?? ""
    ).trim();

    const purpose = String(formData.get("purpose") ?? "").trim();
    const turnaround = String(formData.get("turnaround") ?? "").trim();

    if (!fullName || !email) {
      return NextResponse.json(
        { ok: false, message: "Full name and email address are required." },
        { status: 400 }
      );
    }

    if (!allowed(sourceLanguage, SOURCE_LANGUAGES)) {
      return NextResponse.json(
        { ok: false, message: "Invalid source language." },
        { status: 400 }
      );
    }

    if (!allowed(targetLanguage, TARGET_LANGUAGES)) {
      return NextResponse.json(
        { ok: false, message: "Invalid target language." },
        { status: 400 }
      );
    }

    if (!allowed(documentType, DOCUMENT_TYPES)) {
      return NextResponse.json(
        { ok: false, message: "Invalid document type." },
        { status: 400 }
      );
    }

    if (!allowed(purpose, PURPOSES)) {
      return NextResponse.json(
        { ok: false, message: "Invalid translation purpose." },
        { status: 400 }
      );
    }

    if (!allowed(turnaround, TURNAROUNDS)) {
      return NextResponse.json(
        { ok: false, message: "Invalid turnaround option." },
        { status: 400 }
      );
    }

    if (sourceLanguage === targetLanguage) {
      return NextResponse.json(
        {
          ok: false,
          message: "Source and target languages must be different.",
        },
        { status: 400 }
      );
    }

const quote =
  await calculateServerQuote({
    sourceLanguage,
    targetLanguage,
    documentType,
    turnaround,
  });

    const expiresAt = new Date(
      Date.now() +
        (quote.requiresManualReview
          ? 72 * 60 * 60 * 1000
          : 60 * 60 * 1000)
    );

    const { data: enquiry, error: enquiryError } = await supabaseAdmin
      .from("enquiries")
      .insert({
        status: quote.requiresManualReview
          ? "manual_review"
          : "quotation_pending_payment",
        source: "website",
        full_name: fullName,
        email,
        telephone: telephone || null,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        document_type: documentType,
        purpose,
        turnaround,
        requires_manual_review: quote.requiresManualReview,
        indicative_price: quote.amount,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (enquiryError || !enquiry) {
      console.error("Enquiry creation failed:", enquiryError);

      return NextResponse.json(
        { ok: false, message: "Unable to create the temporary enquiry." },
        { status: 500 }
      );
    }

    enquiryId = enquiry.id;

    const extension = getExtension(file.type);

    if (!extension) {
      throw new Error("Unable to determine file extension.");
    }

    storagePath = `${enquiryId}/${randomUUID()}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from("temporary-enquiries")
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload failed:", uploadError);
      throw new Error("Unable to store the temporary document.");
    }

    const { error: documentError } = await supabaseAdmin
      .from("documents")
      .insert({
        enquiry_id: enquiryId,
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type,
        file_size: file.size,
        status: "temporary",
        expires_at: expiresAt.toISOString(),
      });

    if (documentError) {
      console.error("Document metadata insert failed:", documentError);
      throw new Error("Unable to save document metadata.");
    }

    return NextResponse.json(
      {
        ok: true,
        enquiryId,
        requiresManualReview: quote.requiresManualReview,
        amount: quote.amount,
        currency: quote.currency,
        expiresAt: expiresAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/enquiries failed:", error);

    if (storagePath) {
      await supabaseAdmin.storage
        .from("temporary-enquiries")
        .remove([storagePath]);
    }

    if (enquiryId) {
      await supabaseAdmin.from("enquiries").delete().eq("id", enquiryId);
    }

    return NextResponse.json(
      {
        ok: false,
        message: "The temporary enquiry could not be created.",
      },
      { status: 500 }
    );
  }
}