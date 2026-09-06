import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function promoteSourceDocuments(
  enquiryId: string,
  orderReference: string
) {
  const { data: documents, error } = await supabaseAdmin
    .from("documents")
    .select(`
      id,
      storage_path,
      original_filename,
      mime_type,
      status
    `)
    .eq("enquiry_id", enquiryId)
    .neq("status", "final_translation");

  if (error) {
    throw new Error("Unable to retrieve source documents.");
  }

  for (const document of documents ?? []) {
    if (document.status === "order_source") {
      continue;
    }

    const { data: fileData, error: downloadError } =
      await supabaseAdmin.storage
        .from("temporary-enquiries")
        .download(document.storage_path);

    if (downloadError || !fileData) {
      throw new Error(
        `Unable to retrieve temporary source document ${document.id}.`
      );
    }

    const originalExtension =
      document.original_filename?.split(".").pop()?.toLowerCase();

    const safeExtension =
      originalExtension &&
      /^[a-z0-9]{1,10}$/.test(originalExtension)
        ? `.${originalExtension}`
        : "";

    const newStoragePath =
      `${orderReference}/${randomUUID()}${safeExtension}`;

    const fileBuffer = await fileData.arrayBuffer();

    const { error: uploadError } =
      await supabaseAdmin.storage
        .from("order-source-files")
        .upload(newStoragePath, fileBuffer, {
          contentType:
            document.mime_type || "application/octet-stream",
          upsert: false,
        });

    if (uploadError) {
      throw new Error(
        `Unable to promote source document ${document.id}.`
      );
    }

    const { error: metadataError } = await supabaseAdmin
      .from("documents")
      .update({
        storage_path: newStoragePath,
        status: "order_source",
        expires_at: null,
      })
      .eq("id", document.id);

    if (metadataError) {
      await supabaseAdmin.storage
        .from("order-source-files")
        .remove([newStoragePath]);

      throw new Error(
        `Unable to update source document ${document.id}.`
      );
    }

    const { error: deleteError } =
      await supabaseAdmin.storage
        .from("temporary-enquiries")
        .remove([document.storage_path]);

    if (deleteError) {
      console.error(
        "Temporary source deletion failed:",
        document.id,
        deleteError
      );
    }
  }
}