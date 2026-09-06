import { getResendClient } from "@/lib/email/resend";

export async function sendTranslationReadyEmail(input: {
  to: string;
  clientName: string;
  orderReference: string;
  orderUrl: string;
}) {
  const resend = getResendClient();

  const from =
    process.env.EMAIL_FROM ||
    "GLOBAL TRANSLATION HUB <orders@send.globaltranslationhub.co.uk>";

  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `Your Translation Is Ready - ${input.orderReference}`,

    html: `
      <div style="font-family: Arial, sans-serif; color: #13201a; line-height: 1.6;">
        <h2>GLOBAL TRANSLATION HUB</h2>

        <p>Dear ${input.clientName},</p>

        <p>
          Your translation has been completed and is now available through your secure order portal.
        </p>

        <p>
          <strong>Order Reference:</strong>
          ${input.orderReference}
        </p>

        <p>
          <a href="${input.orderUrl}">
            View and Download Your Translation
          </a>
        </p>

        <p>
          Please keep your order reference for future correspondence.
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
      "Translation ready email failed:",
      error
    );

    throw new Error(
      "Unable to send translation ready email."
    );
  }
}
