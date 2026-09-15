import {
  getResendClient,
} from "@/lib/email/resend";


export async function sendEmailVerificationCode(
  input: {
    to: string;
    code: string;
  }
) {
  const resend =
    getResendClient();


  const from =
    process.env.EMAIL_FROM ||
    "GLOBAL TRANSLATION HUB <orders@send.globaltranslationhub.co.uk>";


  const {
    error,
  } =
    await resend.emails.send({
      from,

      to:
        input.to,

      subject:
        "Verify your email address",

      html: `
        <div style="font-family:Arial,sans-serif;color:#13201a;line-height:1.6">
          <h2>GLOBAL TRANSLATION HUB</h2>

          <p>
            Please use the verification code below to confirm your email address.
          </p>

          <div style="margin:24px 0;font-size:32px;font-weight:700;letter-spacing:8px;color:#087f5b">
            ${input.code}
          </div>

          <p>
            This code will expire in 10 minutes.
          </p>

          <p>
            If you did not request this code, you can ignore this email.
          </p>

          <p>
            Kind regards,<br />
            GLOBAL TRANSLATION HUB
          </p>
        </div>
      `,
    });


  if (error) {
    console.error(
      "Email verification delivery failed:",
      error
    );

    throw new Error(
      "Unable to send verification email."
    );
  }
}
