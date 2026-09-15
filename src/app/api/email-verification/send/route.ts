import {
  createHmac,
  randomInt,
} from "crypto";

import {
  NextResponse,
} from "next/server";

import {
  sendEmailVerificationCode,
} from "@/lib/email/send-email-verification-code";

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


function isValidEmail(
  email: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
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


export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const email =
      normaliseEmail(
        body.email
      );


    if (
      !email ||
      !isValidEmail(email)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }


    const {
      data:
        latestVerification,
      error:
        latestVerificationError,
    } =
      await supabaseAdmin
        .from(
          "email_verifications"
        )
        .select(`
          id,
          resend_available_at
        `)
        .eq(
          "email",
          email
        )
        .is(
          "consumed_at",
          null
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();


    if (
      latestVerificationError
    ) {
      console.error(
        "Unable to check email verification rate limit:",
        latestVerificationError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to start email verification.",
        },
        {
          status: 500,
        }
      );
    }


    if (
      latestVerification
    ) {
      const resendAvailableAt =
        new Date(
          latestVerification.resend_available_at
        ).getTime();

      if (
        Number.isFinite(
          resendAvailableAt
        ) &&
        resendAvailableAt >
          Date.now()
      ) {
        const retryAfter =
          Math.max(
            1,
            Math.ceil(
              (
                resendAvailableAt -
                Date.now()
              ) /
                1000
            )
          );

        return NextResponse.json(
          {
            ok: false,
            message:
              `Please wait ${retryAfter} seconds before requesting another verification code.`,
            retryAfter,
          },
          {
            status: 429,
          }
        );
      }
    }


    const code =
      String(
        randomInt(
          0,
          1000000
        )
      ).padStart(
        6,
        "0"
      );


    const now =
      Date.now();

    const expiresAt =
      new Date(
        now +
          10 *
            60 *
            1000
      ).toISOString();

    const resendAvailableAt =
      new Date(
        now +
          60 *
            1000
      ).toISOString();


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
        .insert({
          email,

          code_hash:
            hashCode(
              email,
              code
            ),

          expires_at:
            expiresAt,

          resend_available_at:
            resendAvailableAt,
        })
        .select("id")
        .single();


    if (
      verificationError ||
      !verification
    ) {
      console.error(
        "Email verification creation failed:",
        verificationError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Unable to start email verification.",
        },
        {
          status: 500,
        }
      );
    }


    try {
      await sendEmailVerificationCode({
        to:
          email,

        code,
      });
    } catch (error) {
      await supabaseAdmin
        .from(
          "email_verifications"
        )
        .delete()
        .eq(
          "id",
          verification.id
        );

      throw error;
    }


    return NextResponse.json({
      ok: true,

      verificationId:
        verification.id,

      expiresAt,

      resendAvailableAt,
    });

  } catch (error) {
    console.error(
      "Email verification send failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Unable to send verification code.",
      },
      {
        status: 500,
      }
    );
  }
}