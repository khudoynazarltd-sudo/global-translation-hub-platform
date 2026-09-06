import { getResendClient } from "@/lib/email/resend";

export async function sendOrderConfirmedEmail(input: {
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
    subject: `Order Confirmed - ${input.orderReference}`,

    html: `
      <div style="font-family: Arial, sans-serif; color: #13201a; line-height: 1.6;">
        <h2>GLOBAL TRANSLATION HUB</h2>

        <p>Dear ${input.clientName},</p>

        <p>
          Thank you for your payment. Your translation order has been confirmed.
        </p>

        <p>
          <strong>Order Reference:</strong>
          ${input.orderReference}
        </p>

        <p>
          You can securely track your order using the link below:
        </p>

        <p>
          <a href="${input.orderUrl}">
            View Your Order
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
    console.error("Order confirmation email failed:", error);

    throw new Error(
      "Unable to send order confirmation email."
    );
  }
}
