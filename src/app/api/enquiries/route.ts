import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import {
  sendEnquiryReceivedEmail,
} from "@/lib/email/send-enquiry-received";
import {
  sendManualReviewEnquiryEmail,
} from "@/lib/email/send-manual-review-enquiry";
import {
  PURPOSES,
  TURNAROUNDS,
} from "@/lib/pricing";
import {
  calculateServerQuote,
} from "@/lib/pricing/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const MAX_FILE_SIZE =
  15 * 1024 * 1024;

type MediaUploadItem = {
  path: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
};

type DocumentUploadMetadata = {
  documentType: string;
  label: string;
  pageCount: number | null;
};

function getExtension(
  mimeType: string
) {
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

function allowed(
  value: string,
  values: readonly string[]
) {
  return values.includes(value);
}

function parseDocumentItems(
  raw: FormDataEntryValue | null
): DocumentUploadMetadata[] {
  if (raw == null) {
    return [];
  }

  try {
    const parsed = JSON.parse(
      String(raw)
    );

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item) => {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return {
          documentType: "",
          label: "",
          pageCount: null,
        };
      }

      const record = item as Record<
        string,
        unknown
      >;

      const documentType = String(
        record.documentType ?? ""
      )
        .trim()
        .slice(0, 200);

      const label = String(
        record.label ?? ""
      )
        .trim()
        .slice(0, 1000);

      const rawPageCount = String(
        record.pageCount ?? ""
      ).trim();

      const parsedPageCount =
        rawPageCount === ""
          ? null
          : Number(rawPageCount);

      const pageCount =
        parsedPageCount != null &&
        Number.isInteger(
          parsedPageCount
        ) &&
        parsedPageCount > 0
          ? parsedPageCount
          : null;

      return {
        documentType,
        label,
        pageCount,
      };
    });
  } catch {
    return [];
  }
}

function parseMediaItems(
  raw: FormDataEntryValue | null
): MediaUploadItem[] {
  if (raw == null) {
    return [];
  }

  try {
    const parsed = JSON.parse(
      String(raw)
    );

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (
          !item ||
          typeof item !== "object"
        ) {
          return null;
        }

        const record = item as Record<
          string,
          unknown
        >;

        const path = String(
          record.path ?? ""
        ).trim();
        const originalFilename = String(
          record.originalFilename ?? ""
        ).trim();
        const mimeType = String(
          record.mimeType ?? ""
        ).trim();
        const fileSize = Number(
          record.fileSize ?? 0
        );

        if (!path) {
          return null;
        }

        return {
          path,
          originalFilename,
          mimeType,
          fileSize,
        };
      })
      .filter(
        (
          item
        ): item is MediaUploadItem =>
          item !== null
      );
  } catch {
    return [];
  }
}

export async function POST(
  request: Request
) {
  let enquiryId: string | null =
    null;

  const storagePathsToCleanup:
    string[] = [];

  try {
    const formData =
      await request.formData();

    const documentFiles =
      formData
        .getAll("files")
        .filter(
          (
            item
          ): item is File =>
            item instanceof File
        );

    // Backward compatibility with the old single-file client.
    if (documentFiles.length === 0) {
      const legacyFile =
        formData.get("file");

      if (legacyFile instanceof File) {
        documentFiles.push(
          legacyFile
        );
      }
    }

    const documentItems =
      parseDocumentItems(
        formData.get(
          "documentItems"
        )
      );

    const fullName = String(
      formData.get("fullName") ?? ""
    ).trim();
    const email = String(
      formData.get("email") ?? ""
    ).trim();
    const telephone = String(
      formData.get("telephone") ?? ""
    ).trim();

    const sourceLanguage = String(
      formData.get(
        "sourceLanguage"
      ) ?? ""
    ).trim();

    const targetLanguage = String(
      formData.get(
        "targetLanguage"
      ) ?? ""
    ).trim();

    const documentType = String(
      formData.get(
        "documentType"
      ) ?? ""
    ).trim();

    const purpose = String(
      formData.get("purpose") ?? ""
    ).trim();

    const turnaround = String(
      formData.get(
        "turnaround"
      ) ?? ""
    ).trim();


    const consentValue = formData.get("googleAdsConsent");
    const googleAdsConsent = consentValue === "accepted" || consentValue === "rejected"
      ? consentValue : null;

    const attributionSessionId =
      String(
        formData.get(
          "attributionSessionId"
        ) ?? ""
      )
        .trim()
        .slice(0, 200);

    const utmSource =
      String(
        formData.get(
          "utmSource"
        ) ?? ""
      )
        .trim()
        .slice(0, 500);

    const utmMedium =
      String(
        formData.get(
          "utmMedium"
        ) ?? ""
      )
        .trim()
        .slice(0, 500);

    const utmCampaign =
      String(
        formData.get(
          "utmCampaign"
        ) ?? ""
      )
        .trim()
        .slice(0, 500);

    const utmTerm =
      String(
        formData.get(
          "utmTerm"
        ) ?? ""
      )
        .trim()
        .slice(0, 500);

    const utmContent =
      String(
        formData.get(
          "utmContent"
        ) ?? ""
      )
        .trim()
        .slice(0, 500);

    const gclid =
      String(
        formData.get(
          "gclid"
        ) ?? ""
      )
        .trim()
        .slice(0, 1000);

    const fbclid =
      String(
        formData.get(
          "fbclid"
        ) ?? ""
      )
        .trim()
        .slice(0, 1000);

    const msclkid =
      String(
        formData.get(
          "msclkid"
        ) ?? ""
      )
        .trim()
        .slice(0, 1000);


    const mediaExternalUrl =
      String(
        formData.get(
          "mediaExternalUrl"
        ) ?? ""
      ).trim();

    const mediaNotes = String(
      formData.get(
        "mediaNotes"
      ) ?? ""
    ).trim();

    let mediaOutputOptions:
      string[] = [];

    try {
      const parsed = JSON.parse(
        String(
          formData.get(
            "mediaOutputOptions"
          ) ?? "[]"
        )
      );

      if (Array.isArray(parsed)) {
        mediaOutputOptions = parsed
          .map(String)
          .map((item) =>
            item.trim()
          )
          .filter(Boolean);
      }
    } catch {
      mediaOutputOptions = [];
    }

    const mediaItems =
      parseMediaItems(
        formData.get("mediaItems")
      );

    // Backward compatibility with the old single-media client.
    if (mediaItems.length === 0) {
      const legacyMediaPath =
        String(
          formData.get(
            "mediaStoragePath"
          ) ?? ""
        ).trim();

      if (legacyMediaPath) {
        mediaItems.push({
          path: legacyMediaPath,
          originalFilename:
            String(
              formData.get(
                "mediaOriginalFilename"
              ) ?? ""
            ).trim(),
          mimeType:
            String(
              formData.get(
                "mediaMimeType"
              ) ?? ""
            ).trim(),
          fileSize:
            Number(
              formData.get(
                "mediaFileSize"
              ) ?? 0
            ),
        });
      }
    }

    const isMediaService =
      documentType ===
      "Audio / Video Translation";

    if (
      !isMediaService &&
      documentFiles.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "At least one document file is required.",
        },
        { status: 400 }
      );
    }

    if (
      isMediaService &&
      mediaItems.length === 0 &&
      !mediaExternalUrl
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Please upload at least one audio/video file or provide a secure file-sharing link.",
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

    for (const file of documentFiles) {
      if (
        !ALLOWED_TYPES.has(
          file.type
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Only PDF, JPG and PNG files are accepted.",
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
              file.size <= 0
                ? `The uploaded file \"${file.name}\" is empty.`
                : `The file \"${file.name}\" exceeds the 15 MB limit.`,
          },
          { status: 400 }
        );
      }
    }

    for (const item of mediaItems) {
      if (
        !item.path.startsWith(
          "pending-media/"
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Invalid media storage path.",
          },
          { status: 400 }
        );
      }
    }

    if (!fullName || !email) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Full name and email address are required.",
        },
        { status: 400 }
      );
    }

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
        .eq(
          "name",
          sourceLanguage
        )
        .eq("active", true)
        .maybeSingle();

      if (
        sourceLanguageError ||
        !sourceLanguageRecord
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Invalid source language.",
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
      .eq(
        "name",
        targetLanguage
      )
      .eq("active", true)
      .maybeSingle();

    if (
      targetLanguageError ||
      !targetLanguageRecord
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Invalid target language.",
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
      .eq(
        "name",
        documentType
      )
      .eq("active", true)
      .maybeSingle();

    if (
      serviceError ||
      !serviceRecord
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Invalid document type.",
        },
        { status: 400 }
      );
    }

    if (
      !allowed(
        purpose,
        PURPOSES
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Invalid translation purpose.",
        },
        { status: 400 }
      );
    }

    if (
      !allowed(
        turnaround,
        TURNAROUNDS
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Invalid turnaround option.",
        },
        { status: 400 }
      );
    }

    if (
      sourceLanguage ===
      targetLanguage
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Source and target languages must be different.",
        },
        { status: 400 }
      );
    }

    if (isMediaService) {
      storagePathsToCleanup.push(
        ...mediaItems.map(
          (item) => item.path
        )
      );
    }

    const quote =
      await calculateServerQuote({
        sourceLanguage,
        targetLanguage,
        documentType,
        turnaround,
      });

    const requiresManualReview =
      isMediaService ||
      documentFiles.length > 1 ||
      serviceRecord.manual_review ===
        true ||
      quote.requiresManualReview;

    const expiresAt = new Date(
      Date.now() +
        (requiresManualReview
          ? 72 * 60 * 60 * 1000
          : 60 * 60 * 1000)
    );

    const {
      data: enquiry,
      error: enquiryError,
    } = await supabaseAdmin
      .from("enquiries")
      .insert({
        status: requiresManualReview
          ? "manual_review"
          : "quotation_pending_payment",
        source: "website",
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
        purpose,
        turnaround,

        google_ads_consent: googleAdsConsent,
        google_ads_consent_recorded_at: googleAdsConsent ? new Date().toISOString() : null,

        attribution_session_id:
          attributionSessionId ||
          null,

        utm_source:
          utmSource ||
          null,

        utm_medium:
          utmMedium ||
          null,

        utm_campaign:
          utmCampaign ||
          null,

        utm_term:
          utmTerm ||
          null,

        utm_content:
          utmContent ||
          null,

        gclid:
          gclid ||
          null,

        fbclid:
          fbclid ||
          null,

        msclkid:
          msclkid ||
          null,

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
        indicative_price:
          requiresManualReview
            ? null
            : quote.amount,
        expires_at:
          expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (
      enquiryError ||
      !enquiry
    ) {
      console.error(
        "Enquiry creation failed:",
        enquiryError
      );

      throw new Error(
        "Unable to create the temporary enquiry."
      );
    }

    enquiryId = enquiry.id;

    if (!isMediaService) {
      for (
        const [
          index,
          file,
        ] of documentFiles.entries()
      ) {
        const metadata =
          documentItems[index] ??
          null;

        const extension =
          getExtension(file.type);

        if (!extension) {
          throw new Error(
            "Unable to determine file extension."
          );
        }

        const storagePath =
          `${enquiryId}/${randomUUID()}.${extension}`;

        const arrayBuffer =
          await file.arrayBuffer();

        const {
          error: uploadError,
        } = await supabaseAdmin.storage
          .from(
            "temporary-enquiries"
          )
          .upload(
            storagePath,
            arrayBuffer,
            {
              contentType:
                file.type,
              upsert: false,
            }
          );

        if (uploadError) {
          console.error(
            "Storage upload failed:",
            uploadError
          );

          throw new Error(
            "Unable to store a temporary document."
          );
        }

        storagePathsToCleanup.push(
          storagePath
        );

        const {
          error: documentError,
        } = await supabaseAdmin
          .from("documents")
          .insert({
            enquiry_id:
              enquiryId,
            storage_path:
              storagePath,
            original_filename:
              file.name,
            mime_type:
              file.type,
            file_size:
              file.size,
            document_type:
              metadata?.documentType ||
              null,
            label:
              metadata?.label ||
              null,
            page_count:
              metadata?.pageCount ??
              null,
            status:
              "temporary",
            expires_at:
              expiresAt.toISOString(),
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
    }

    if (isMediaService) {
      for (const item of mediaItems) {
        const {
          error: mediaDocumentError,
        } = await supabaseAdmin
          .from("documents")
          .insert({
            enquiry_id:
              enquiry.id,
            storage_path:
              item.path,
            original_filename:
              item.originalFilename ||
              "Audio / Video file",
            mime_type:
              item.mimeType ||
              "application/octet-stream",
            file_size:
              Number.isFinite(
                item.fileSize
              )
                ? item.fileSize
                : null,
            status:
              "temporary",
            expires_at:
              expiresAt.toISOString(),
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
    }

    if (requiresManualReview) {
      try {
        await sendEnquiryReceivedEmail({
          to: email,
          clientName: fullName,
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

      try {
        await sendManualReviewEnquiryEmail({
          clientName: fullName,
          clientEmail: email,
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

    // From this point the storage objects belong to the enquiry.
    storagePathsToCleanup.length = 0;

    return NextResponse.json(
      {
        ok: true,
        enquiryId,
        requiresManualReview,
        amount:
          requiresManualReview
            ? null
            : quote.amount,
        currency:
          quote.currency,
        expiresAt:
          expiresAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/enquiries failed:",
      error
    );

    if (
      storagePathsToCleanup.length > 0
    ) {
      await supabaseAdmin.storage
        .from(
          "temporary-enquiries"
        )
        .remove(
          Array.from(
            new Set(
              storagePathsToCleanup
            )
          )
        );
    }

    if (enquiryId) {
      await supabaseAdmin
        .from("enquiries")
        .delete()
        .eq("id", enquiryId);
    }

    return NextResponse.json(
      {
        ok: false,
        message:
          "The temporary enquiry could not be created.",
      },
      { status: 500 }
    );
  }
}
