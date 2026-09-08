import {
  randomUUID,
} from "crypto";

import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export const runtime =
  "nodejs";


const MAX_MEDIA_SIZE =
  50 * 1024 * 1024;


const ALLOWED_MEDIA_TYPES =
  new Set([
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/aac",
    "audio/x-m4a",

    "video/mp4",
    "video/quicktime",
    "video/webm",
  ]);


function extensionFromFilename(
  filename: string
) {
  const extension =
    filename
      .split(".")
      .pop()
      ?.toLowerCase();


  if (
    !extension ||
    !/^[a-z0-9]{1,10}$/.test(
      extension
    )
  ) {
    return "";
  }


  return `.${extension}`;
}


export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();


    const filename =
      String(
        body.filename ?? ""
      ).trim();


    const mimeType =
      String(
        body.mimeType ?? ""
      ).trim();


    const fileSize =
      Number(
        body.fileSize
      );


    if (
      !filename ||
      !mimeType ||
      !Number.isFinite(fileSize)
    ) {
      return NextResponse.json(
        {
          ok: false,

          message:
            "File information is incomplete.",
        },
        {
          status:
            400,
        }
      );
    }


    if (
      fileSize <= 0 ||
      fileSize >
        MAX_MEDIA_SIZE
    ) {
      return NextResponse.json(
        {
          ok: false,

          message:
            "Audio and video files uploaded directly through the website must not exceed 50 MB.",
        },
        {
          status:
            400,
        }
      );
    }


    if (
      !ALLOWED_MEDIA_TYPES.has(
        mimeType
      )
    ) {
      return NextResponse.json(
        {
          ok: false,

          message:
            "Unsupported audio or video file type.",
        },
        {
          status:
            400,
        }
      );
    }


    const extension =
      extensionFromFilename(
        filename
      );


    if (!extension) {
      return NextResponse.json(
        {
          ok: false,

          message:
            "Unable to determine the file extension.",
        },
        {
          status:
            400,
        }
      );
    }


    /*
      Files are initially uploaded to a temporary
      staging location.

      The final enquiry submission will associate
      the uploaded object with the newly created
      enquiry.
    */

    const storagePath =
      `pending-media/${randomUUID()}${extension}`;


    const {
      data,
      error,
    } =
      await supabaseAdmin
        .storage
        .from(
          "temporary-enquiries"
        )
        .createSignedUploadUrl(
          storagePath,
          {
            upsert:
              false,
          }
        );


    if (
      error ||
      !data
    ) {
      console.error(
        "Unable to create signed media upload URL:",
        error
      );


      return NextResponse.json(
        {
          ok: false,

          message:
            "Unable to prepare secure media upload.",
        },
        {
          status:
            500,
        }
      );
    }


    return NextResponse.json({
      ok:
        true,

      path:
        data.path,

      token:
        data.token,
    });
  } catch (error) {
    console.error(
      "Media upload preparation failed:",
      error
    );


    return NextResponse.json(
      {
        ok: false,

        message:
          "Unable to prepare secure media upload.",
      },
      {
        status:
          500,
      }
    );
  }
}