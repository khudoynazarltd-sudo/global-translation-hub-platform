import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export const runtime =
  "nodejs";


function clean(
  value: unknown,
  maxLength = 500
) {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const trimmed =
    value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(
    0,
    maxLength
  );
}


function hostnameFromUrl(
  value: string | null
) {
  if (!value) {
    return null;
  }

  try {
    return new URL(
      value
    ).hostname
      .toLowerCase()
      .replace(
        /^www\./,
        ""
      );
  } catch {
    return null;
  }
}


function detectTrafficSource({
  referrer,
  utmSource,
  utmMedium,
  gclid,
  fbclid,
  msclkid,
}: {
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
}) {
  /*
    Explicit campaign parameters always win.
  */

  if (utmSource) {
    return {
      source:
        utmSource.toLowerCase(),

      medium:
        utmMedium
          ? utmMedium.toLowerCase()
          : "campaign",
    };
  }


  /*
    Advertising click IDs.
  */

  if (gclid) {
    return {
      source:
        "google",

      medium:
        "cpc",
    };
  }


  if (fbclid) {
    return {
      source:
        "facebook",

      medium:
        "paid_social",
    };
  }


  if (msclkid) {
    return {
      source:
        "bing",

      medium:
        "cpc",
    };
  }


  const hostname =
    hostnameFromUrl(
      referrer
    );


  if (!hostname) {
    return {
      source:
        "direct",

      medium:
        null,
    };
  }


  if (
    hostname ===
      "google.com" ||
    hostname.endsWith(
      ".google.com"
    ) ||
    hostname.includes(
      "google."
    )
  ) {
    return {
      source:
        "google",

      medium:
        "organic",
    };
  }


  if (
    hostname ===
      "bing.com" ||
    hostname.endsWith(
      ".bing.com"
    )
  ) {
    return {
      source:
        "bing",

      medium:
        "organic",
    };
  }


  if (
    hostname.includes(
      "facebook.com"
    )
  ) {
    return {
      source:
        "facebook",

      medium:
        "referral",
    };
  }


  if (
    hostname.includes(
      "instagram.com"
    )
  ) {
    return {
      source:
        "instagram",

      medium:
        "referral",
    };
  }


  if (
    hostname.includes(
      "linkedin.com"
    )
  ) {
    return {
      source:
        "linkedin",

      medium:
        "referral",
    };
  }


  return {
    source:
      hostname,

    medium:
      "referral",
  };
}


export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const sessionId =
      clean(
        body.sessionId,
        100
      );

    const path =
      clean(
        body.path,
        500
      );


    if (
      !path ||
      !path.startsWith(
        "/"
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Invalid page path.",
        },
        {
          status: 400,
        }
      );
    }


    /*
      Do not count internal administration,
      translator or API traffic.
    */

    if (
      path.startsWith(
        "/admin"
      ) ||
      path.startsWith(
        "/translator"
      ) ||
      path.startsWith(
        "/api"
      )
    ) {
      return NextResponse.json({
        ok: true,
        ignored: true,
      });
    }


    const referrer =
      clean(
        body.referrer,
        1000
      );

    const utmSource =
      clean(
        body.utmSource,
        200
      );

    const utmMedium =
      clean(
        body.utmMedium,
        200
      );

    const utmCampaign =
      clean(
        body.utmCampaign,
        300
      );

    const utmTerm =
      clean(
        body.utmTerm,
        300
      );

    const utmContent =
      clean(
        body.utmContent,
        300
      );

    const gclid =
      clean(
        body.gclid,
        300
      );

    const fbclid =
      clean(
        body.fbclid,
        300
      );

    const msclkid =
      clean(
        body.msclkid,
        300
      );


    const detected =
      detectTrafficSource({
        referrer,
        utmSource,
        utmMedium,
        gclid,
        fbclid,
        msclkid,
      });


    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "website_visits"
        )
        .insert({
          session_id:
            sessionId,

          path,

          referrer,

          source:
            detected.source,

          medium:
            detected.medium,

          campaign:
            utmCampaign,

          term:
            utmTerm,

          content:
            utmContent,

          gclid,
          fbclid,
          msclkid,
        });


    if (error) {
      console.error(
        "Website analytics insert failed:",
        error
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to record visit.",
        },
        {
          status: 500,
        }
      );
    }


    return NextResponse.json({
      ok: true,
    });

  } catch (error) {
    console.error(
      "Website analytics failed:",
      error
    );


    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to record visit.",
      },
      {
        status: 500,
      }
    );
  }
}