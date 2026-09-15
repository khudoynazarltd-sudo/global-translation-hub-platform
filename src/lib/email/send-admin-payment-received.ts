import { getResendClient } from "@/lib/email/resend";

export async function sendAdminPaymentReceivedEmail(input: {
  orderReference: string;
  amountPaid: number;
  clientName: string;
  clientEmail: string;
  source: string;
  adminOrderUrl: string;
}) {
  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!adminEmail) {
    throw new Error(
      "ADMIN_NOTIFICATION_EMAIL is not configured."
    );
  }

  const resend =
    getResendClient();

  const from =
    process.env.EMAIL_FROM ||
    "GLOBAL TRANSLATION HUB <orders@send.globaltranslationhub.co.uk>";

  const { error } =
    await resend.emails.send({
      from,
      to: adminEmail,
      subject:
        `Payment Received - ${input.orderReference}`,

      html: `
        <div style="font-family: Arial, sans-serif; color: #13201a; line-height: 1.6;">
          <h2>GLOBAL TRANSLATION HUB</h2>

          <p>
            A Stripe payment has been received and a new order has been created.
          </p>

          <p>
            <strong>Order Reference:</strong>
            ${input.orderReference}
          </p>

          <p>
            <strong>Amount Paid:</strong>
            £${input.amountPaid.toFixed(2)}
          </p>

          <p>
            <strong>Client:</strong>
            ${input.clientName}
          </p>

          <p>
            <strong>Client Email:</strong>
            ${input.clientEmail}
          </p>

          <p>
            <strong>Source:</strong>
            ${input.source}
          </p>

          <p>
            <a href="${input.adminOrderUrl}">
              Open Order in Admin
            </a>
          </p>

          <p>
            GLOBAL TRANSLATION HUB
          </p>
        </div>
      `,
    });

  if (error) {
    console.error(
      "Admin payment notification email failed:",
      error
    );

    throw new Error(
      "Unable to send admin payment notification email."
    );
  }
}