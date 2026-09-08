import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  PURPOSES,
  TURNAROUNDS,
} from "@/lib/pricing";
import {
  calculateServerQuote,
} from "@/lib/pricing/server";

import {
  sendManualReviewEnquiryEmail,
} from "@/lib/email/send-manual-review-enquiry";

import {
  sendEnquiryReceivedEmail,
} from "@/lib/email/send-enquiry-received";

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

    const purpose = String(
      formData.get("purpose") ?? ""
    ).trim();

    const turnaround = String(
      formData.get("turnaround") ?? ""
    ).trim();

    const mediaExternalUrl = String(
      formData.get("mediaExternalUrl") ?? ""
    ).trim();

    if (
      mediaExternalUrl &&
      !/^https?:\/\//i.test(
        mediaExternalUrl
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Please provide a valid HTTP or HTTPS file-sharing link.",
        },
        {
          status: 400,
        }
      );
    }

    const mediaStoragePath = String(
      formData.get("mediaStoragePath") ?? ""
    ).trim();

    const mediaOriginalFilename = String(
      formData.get("mediaOriginalFilename") ?? ""
    ).trim();

    const mediaMimeType = String(
      formData.get("mediaMimeType") ?? ""
    ).trim();

    const mediaFileSize = Number(
      formData.get("mediaFileSize") ?? 0
    );

    const mediaNotes = String(
      formData.get("mediaNotes") ?? ""
    ).trim();

    let mediaOutputOptions: string[] = [];

    try {
      const parsed = JSON.parse(
        String(formData.get("mediaOutputOptions") ?? "[]")
      );

      if (Array.isArray(parsed)) {
        mediaOutputOptions = parsed
          .map(String)
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } catch {
      mediaOutputOptions = [];
    }

    const isMediaService =
      documentType === "Audio / Video Translation";

    if (
      !isMediaService &&
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "A document file is required.",
        },
        { status: 400 }
      );
    }

    if (
      isMediaService &&
      !mediaStoragePath &&
      !mediaExternalUrl
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Please upload an audio/video file or provide a secure file-sharing link.",
        },
        { status: 400 }
      );
    }

    if (
      isMediaService &&
      mediaOutputOptions.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Please select at least one required audio/video output.",
        },
        { status: 400 }
      );
    }

    if (
      !isMediaService &&
      file instanceof File &&
      !ALLOWED_TYPES.has(file.type)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Only PDF, JPG and PNG files are accepted.",
        },
        { status: 400 }
      );
    }

    if (
      !isMediaService &&
      file instanceof File &&
      (file.size <= 0 || file.size > MAX_FILE_SIZE)
    ) {
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

    if (!fullName || !email) {
      return NextResponse.json(
        { ok: false, message: "Full name and email address are required." },
        { status: 400 }
      );
    }

    /*
      Languages and services are managed through
      Admin Pricing, so validate them against
      Supabase rather than hard-coded arrays.
    */

    if (
      sourceLanguage !== "Other" &&
      sourceLanguage !== "Not sure"
    ) {
      const {
        data: sourceLanguageRecord,
        error: sourceLanguageError,
      } = await supabaseAdmin
        .from("languages")
        .select("id")
        .eq("name", sourceLanguage)
        .eq("active", true)
        .maybeSingle();

      if (
        sourceLanguageError ||
        !sourceLanguageRecord
      ) {
        return NextResponse.json(
          {
            ok: false,
            message: "Invalid source language.",
          },
          { status: 400 }
        );
      }
    }


    const {
      data: targetLanguageRecord,
      error: targetLanguageError,
    } = await supabaseAdmin
      .from("languages")
      .select("id")
      .eq("name", targetLanguage)
      .eq("active", true)
      .maybeSingle();


    if (
      targetLanguageError ||
      !targetLanguageRecord
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid target language.",
        },
        { status: 400 }
      );
    }


    const {
      data: serviceRecord,
      error: serviceError,
    } = await supabaseAdmin
      .from("service_types")
      .select(`
        id,
        manual_review
      `)
      .eq("name", documentType)
      .eq("active", true)
      .maybeSingle();


    if (
      serviceError ||
      !serviceRecord
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid document type.",
        },
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

    const quote = await calculateServerQuote({
      sourceLanguage,
      targetLanguage,
      documentType,
      turnaround,
    });

    const requiresManualReview =
      isMediaService ||
      serviceRecord.manual_review === true ||
      quote.requiresManualReview;

    const expiresAt = new Date(
      Date.now() +
        (requiresManualReview
          ? 72 * 60 * 60 * 1000
          : 60 * 60 * 1000)
    );

    const { data: enquiry, error: enquiryError } = await supabaseAdmin
      .from("enquiries")
      .insert({
        status: requiresManualReview
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

        media_external_url:
          isMediaService &&
          mediaExternalUrl
            ? mediaExternalUrl
            : null,

        media_output_options:
          isMediaService
            ? mediaOutputOptions
            : null,

        media_notes:
          isMediaService &&
          mediaNotes
            ? mediaNotes
            : null,

        requires_manual_review:
          requiresManualReview,
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

    if (
      !isMediaService &&
      file instanceof File
    ) {
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
        console.error(
          "Document metadata insert failed:",
          documentError
        );

        throw new Error(
          "Unable to save document metadata."
        );
      }
    }

    if (
      isMediaService &&
      mediaStoragePath
    ) {
      if (
        !mediaStoragePath.startsWith("pending-media/")
      ) {
        throw new Error("Invalid media storage path.");
      }

      const { error: mediaDocumentError } = await supabaseAdmin
        .from("documents")
        .insert({
          enquiry_id: enquiry.id,
          storage_path: mediaStoragePath,
          original_filename:
            mediaOriginalFilename || "Audio / Video file",
          mime_type:
            mediaMimeType || "application/octet-stream",
          file_size: Number.isFinite(mediaFileSize)
            ? mediaFileSize
            : null,
          status: "temporary",
          expires_at: expiresAt.toISOString(),
        });

      if (mediaDocumentError) {
        console.error(
          "Media document metadata insert failed:",
          mediaDocumentError
        );

        throw new Error(
          "Unable to save media file metadata."
        );
      }
    }

    if (requiresManualReview) {
      /*
        Client acknowledgement.
      */

      try {
        await sendEnquiryReceivedEmail({
          to:
            email,

          clientName:
            fullName,

          sourceLanguage,

          targetLanguage,

          documentType,

          turnaround,
        });
      } catch (emailError) {
        console.error(
          "Client enquiry acknowledgement failed:",
          emailError
        );
      }


      /*
        Internal administration notification.
      */

      try {
        await sendManualReviewEnquiryEmail({
          clientName:
            fullName,

          clientEmail:
            email,

          sourceLanguage,

          targetLanguage,

          documentType,

          purpose,

          turnaround,

          enquiryId:
            enquiry.id,
        });
      } catch (emailError) {
        console.error(
          "Manual review administration notification failed:",
          emailError
        );
      }
    }


    return NextResponse.json(
      {
        ok: true,
        enquiryId,
        requiresManualReview,
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
