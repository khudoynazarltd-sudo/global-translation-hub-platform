import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export const runtime =
  "nodejs";


async function runCleanup(
  request: Request
) {
  try {
    const manualSecret =
      request.headers.get(
        "x-cleanup-secret"
      );

    const authorization =
      request.headers.get(
        "authorization"
      );

    const expectedManualSecret =
      process.env.CLEANUP_SECRET;

    const cronSecret =
      process.env.CRON_SECRET;

    const authorisedManualRequest =
      Boolean(
        expectedManualSecret &&
          manualSecret ===
            expectedManualSecret
      );

    const authorisedCronRequest =
      Boolean(
        cronSecret &&
          authorization ===
            `Bearer ${cronSecret}`
      );

    if (
      !authorisedManualRequest &&
      !authorisedCronRequest
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Unauthorised.",
        },
        {
          status: 401,
        }
      );
    }


    const now =
      new Date().toISOString();


    const {
      data: expiredDocuments,
      error: documentQueryError,
    } =
      await supabaseAdmin
        .from("documents")
        .select(
          "id, enquiry_id, storage_path"
        )
        .eq(
          "status",
          "temporary"
        )
        .lt(
          "expires_at",
          now
        );


    if (documentQueryError) {
      console.error(
        documentQueryError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to query expired documents.",
        },
        {
          status: 500,
        }
      );
    }


    const paths =
      (
        expiredDocuments ??
        []
      )
        .map(
          (item) =>
            item.storage_path
        )
        .filter(Boolean);


    if (paths.length > 0) {
      const {
        error:
          storageDeleteError,
      } =
        await supabaseAdmin.storage
          .from(
            "temporary-enquiries"
          )
          .remove(
            paths
          );


      if (storageDeleteError) {
        console.error(
          storageDeleteError
        );

        return NextResponse.json(
          {
            ok: false,
            message:
              "Unable to delete expired files.",
          },
          {
            status: 500,
          }
        );
      }


      const documentIds =
        (
          expiredDocuments ??
          []
        ).map(
          (item) =>
            item.id
        );


      const {
        error:
          metadataDeleteError,
      } =
        await supabaseAdmin
          .from(
            "documents"
          )
          .delete()
          .in(
            "id",
            documentIds
          );


      if (
        metadataDeleteError
      ) {
        console.error(
          metadataDeleteError
        );

        return NextResponse.json(
          {
            ok: false,
            message:
              "Unable to delete document metadata.",
          },
          {
            status: 500,
          }
        );
      }
    }


    const {
      data:
        expiredEnquiries,
      error:
        enquiryQueryError,
    } =
      await supabaseAdmin
        .from(
          "enquiries"
        )
        .select("id")
        .neq(
          "status",
          "paid"
        )
        .not(
          "expires_at",
          "is",
          null
        )
        .lt(
          "expires_at",
          now
        );


    if (
      enquiryQueryError
    ) {
      console.error(
        enquiryQueryError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to query expired enquiries.",
        },
        {
          status: 500,
        }
      );
    }


    const enquiryIds =
      (
        expiredEnquiries ??
        []
      ).map(
        (item) =>
          item.id
      );


    let deletedEnquiries =
      0;


    for (
      const enquiryId of
      enquiryIds
    ) {
      const {
        data:
          remainingDocuments,
        error:
          remainingDocumentsError,
      } =
        await supabaseAdmin
          .from(
            "documents"
          )
          .select("id")
          .eq(
            "enquiry_id",
            enquiryId
          )
          .limit(1);


      if (
        remainingDocumentsError
      ) {
        console.error(
          "Unable to check remaining enquiry documents:",
          remainingDocumentsError
        );

        continue;
      }


      if (
        !remainingDocuments ||
        remainingDocuments.length ===
          0
      ) {
        const {
          error:
            enquiryDeleteError,
        } =
          await supabaseAdmin
            .from(
              "enquiries"
            )
            .delete()
            .eq(
              "id",
              enquiryId
            )
            .neq(
              "status",
              "paid"
            )
            .lt(
              "expires_at",
              now
            );


        if (
          enquiryDeleteError
        ) {
          console.error(
            "Expired enquiry deletion failed:",
            enquiryDeleteError
          );
        } else {
          deletedEnquiries +=
            1;
        }
      }
    }


    return NextResponse.json({
      ok: true,
      deletedFiles:
        paths.length,
      deletedEnquiries,
    });
  } catch (error) {
    console.error(
      "Cleanup failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unexpected cleanup error.",
      },
      {
        status: 500,
      }
    );
  }
}


export async function POST(
  request: Request
) {
  return runCleanup(
    request
  );
}


export async function GET(
  request: Request
) {
  return runCleanup(
    request
  );
}