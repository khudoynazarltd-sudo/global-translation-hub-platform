import {
  getResendClient,
} from "@/lib/email/resend";


function escapeHtml(
  value: string
) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


export async function sendQuotationReadyEmail(
  input: {
    to: string;
    clientName: string;
    amount: number;
    sourceLanguage: string;
    targetLanguage: string;
    documentType: string;
    turnaround: string;
    checkoutUrl: string;
  }
) {
  const resend =
    getResendClient();


  const from =
    process.env.EMAIL_FROM ||
    "GLOBAL TRANSLATION HUB <orders@send.globaltranslationhub.co.uk>";


  const amount =
    new Intl.NumberFormat(
      "en-GB",
      {
        style:
          "currency",

        currency:
          "GBP",
      }
    ).format(
      input.amount
    );


  const {
    error,
  } =
    await resend.emails.send({
      from,

      to:
        input.to,

      subject:
        "Your GLOBAL TRANSLATION HUB quotation is ready",

      html: `
        <div style="font-family:Arial,sans-serif;color:#13201a;line-height:1.6">
          <h2>GLOBAL TRANSLATION HUB</h2>

          <p>
            Dear ${escapeHtml(input.clientName)},
          </p>

          <p>
            We have reviewed your translation enquiry and your quotation is now ready.
          </p>

          <p>
            <strong>Document:</strong>
            ${escapeHtml(input.documentType)}
            <br />

            <strong>Language:</strong>
            ${escapeHtml(input.sourceLanguage)}
            →
            ${escapeHtml(input.targetLanguage)}
            <br />

            <strong>Turnaround:</strong>
            ${escapeHtml(input.turnaround)}
            <br />

            <strong>Quotation:</strong>
            ${amount}
          </p>

          <p>
            Payment can be made securely using the link below:
          </p>

          <p>
            <a
              href="${input.checkoutUrl}"
              style="display:inline-block;background:#087f5b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600"
            >
              Pay ${amount}
            </a>
          </p>

          <p>
            Your translation order will be created and an order reference issued after successful payment.
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
      "Quotation email failed:",
      error
    );

    throw new Error(
      "Unable to send quotation email."
    );
  }
}