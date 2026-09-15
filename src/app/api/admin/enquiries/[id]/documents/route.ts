import {
  randomUUID,
} from "crypto";

import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


const MAX_FILE_SIZE =
  25 * 1024 * 1024;


const ALLOWED_TYPES =
  new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);


function extensionForFile(
  file: File
) {
  const name =
    file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    return ".pdf";
  }

  if (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg")
  ) {
    return ".jpg";
  }

  if (name.endsWith(".png")) {
    return ".png";
  }

  if (name.endsWith(".docx")) {
    return ".docx";
  }

  return "";
}


export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  await requireAdmin();


  const {
    id: enquiryId,
  } =
    await context.params;


  const {
    data: enquiry,
    error: enquiryError,
  } =
    await supabaseAdmin
      .from("enquiries")
      .select(`
        id,
        expires_at
      `)
      .eq(
        "id",
        enquiryId
      )
      .maybeSingle();


  if (
    enquiryError ||
    !enquiry
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Enquiry not found.",
      },
      {
        status: 404,
      }
    );
  }


  const formData =
    await request.formData();


  const files =
    formData
      .getAll("files")
      .filter(
        (item): item is File =>
          item instanceof File &&
          item.size > 0
      );


  if (
    files.length === 0
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Please select at least one document.",
      },
      {
        status: 400,
      }
    );
  }


  const rawPageCount =
    String(
      formData.get(
        "pageCount"
      ) ?? ""
    ).trim();


  const parsedPageCount =
    rawPageCount === ""
      ? null
      : Number(
          rawPageCount
        );


  const pageCount =
    parsedPageCount != null &&
    Number.isInteger(
      parsedPageCount
    ) &&
    parsedPageCount > 0
      ? parsedPageCount
      : null;


  for (const file of files) {
    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            `The file "${file.name}" exceeds 25 MB.`,
        },
        {
          status: 400,
        }
      );
    }


    if (
      !ALLOWED_TYPES.has(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            `The file "${file.name}" is not supported.`,
        },
        {
          status: 400,
        }
      );
    }
  }


  const expiresAt =
    enquiry.expires_at ??
    new Date(
      Date.now() +
        24 *
          60 *
          60 *
          1000
    ).toISOString();


  const uploadedPaths:
    string[] =
    [];


  for (const file of files) {
    const extension =
      extensionForFile(
        file
      );


    const storagePath =
      `${enquiryId}/${randomUUID()}${extension}`;


    const fileBytes =
      await file.arrayBuffer();


    const {
      error: uploadError,
    } =
      await supabaseAdmin.storage
        .from(
          "temporary-enquiries"
        )
        .upload(
          storagePath,
          fileBytes,
          {
            contentType:
              file.type,

            upsert:
              false,
          }
        );


    if (uploadError) {
      if (
        uploadedPaths.length >
        0
      ) {
        await supabaseAdmin.storage
          .from(
            "temporary-enquiries"
          )
          .remove(
            uploadedPaths
          );
      }


      console.error(
        "Admin enquiry document upload failed:",
        uploadError
      );


      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to upload documents.",
        },
        {
          status: 500,
        }
      );
    }


    uploadedPaths.push(
      storagePath
    );


    const {
      error: documentError,
    } =
      await supabaseAdmin
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

          page_count:
            pageCount,

          status:
            "temporary",

          expires_at:
            expiresAt,
        });


    if (documentError) {
      await supabaseAdmin.storage
        .from(
          "temporary-enquiries"
        )
        .remove(
          uploadedPaths
        );


      console.error(
        "Admin enquiry document record failed:",
        documentError
      );


      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to save document records.",
        },
        {
          status: 500,
        }
      );
    }
  }


  return NextResponse.redirect(
    new URL(
      `/admin/enquiries/${enquiryId}`,
      request.url
    ),
    303
  );
}