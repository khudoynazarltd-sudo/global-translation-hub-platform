import {
  createHmac,
  timingSafeEqual,
} from "crypto";

import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";


export const runtime =
  "nodejs";


function normaliseEmail(
  value: unknown
) {
  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase();
}


function hashCode(
  email: string,
  code: string
) {
  const secret =
    process.env.EMAIL_VERIFICATION_SECRET;

  if (!secret) {
    throw new Error(
      "EMAIL_VERIFICATION_SECRET is not configured."
    );
  }

  return createHmac(
    "sha256",
    secret
  )
    .update(
      `${email}:${code}`
    )
    .digest("hex");
}


function hashesMatch(
  left: string,
  right: string
) {
  const leftBuffer =
    Buffer.from(
      left,
      "hex"
    );

  const rightBuffer =
    Buffer.from(
      right,
      "hex"
    );

  if (
    leftBuffer.length !==
    rightBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    leftBuffer,
    rightBuffer
  );
}


export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const verificationId =
      String(
        body.verificationId ??
          ""
      ).trim();

    const email =
      normaliseEmail(
        body.email
      );

    const code =
      String(
        body.code ?? ""
      ).trim();


    if (
      !verificationId ||
      !email ||
      !/^\d{6}$/.test(
        code
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Please enter the six-digit verification code.",
        },
        {
          status: 400,
        }
      );
    }


    const {
      data:
        verification,
      error:
        verificationError,
    } =
      await supabaseAdmin
        .from(
          "email_verifications"
        )
        .select(`
          id,
          email,
          code_hash,
          attempts,
          expires_at,
          verified_at,
          consumed_at
        `)
        .eq(
          "id",
          verificationId
        )
        .maybeSingle();


    if (
      verificationError ||
      !verification
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Verification request not found.",
        },
        {
          status: 404,
        }
      );
    }


    if (
      verification.email !==
      email
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "The email address has changed. Please request a new verification code.",
        },
        {
          status: 400,
        }
      );
    }


    if (
      verification.consumed_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "This verification has already been used.",
        },
        {
          status: 409,
        }
      );
    }


    if (
      verification.verified_at
    ) {
      return NextResponse.json({
        ok: true,
        verified: true,
      });
    }


    if (
      verification.attempts >=
      5
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Too many incorrect attempts. Please request a new verification code.",
        },
        {
          status: 429,
        }
      );
    }


    const expiresAt =
      new Date(
        verification.expires_at
      ).getTime();


    if (
      !Number.isFinite(
        expiresAt
      ) ||
      expiresAt <=
        Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "This verification code has expired. Please request a new code.",
        },
        {
          status: 410,
        }
      );
    }


    const submittedHash =
      hashCode(
        email,
        code
      );


    if (
      !hashesMatch(
        verification.code_hash,
        submittedHash
      )
    ) {
      await supabaseAdmin
        .from(
          "email_verifications"
        )
        .update({
          attempts:
            verification.attempts +
            1,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          verification.id
        );

      return NextResponse.json(
        {
          ok: false,
          message:
            "The verification code is incorrect.",
        },
        {
          status: 400,
        }
      );
    }


    const verifiedAt =
      new Date().toISOString();


    const {
      error:
        updateError,
    } =
      await supabaseAdmin
        .from(
          "email_verifications"
        )
        .update({
          verified_at:
            verifiedAt,

          updated_at:
            verifiedAt,
        })
        .eq(
          "id",
          verification.id
        );


    if (updateError) {
      console.error(
        "Unable to mark email as verified:",
        updateError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to complete email verification.",
        },
        {
          status: 500,
        }
      );
    }


    return NextResponse.json({
      ok: true,
      verified: true,
      verifiedAt,
    });

  } catch (error) {
    console.error(
      "Email verification failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to verify email address.",
      },
      {
        status: 500,
      }
    );
  }
}