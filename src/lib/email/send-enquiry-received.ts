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


export async function sendEnquiryReceivedEmail(
  input: {
    to: string;
    clientName: string;
    sourceLanguage: string;
    targetLanguage: string;
    documentType: string;
    turnaround: string;
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
        "We have received your translation enquiry",

      html: `
        <div style="font-family:Arial,sans-serif;color:#13201a;line-height:1.6">

          <h2>GLOBAL TRANSLATION HUB</h2>

          <p>
            Dear ${escapeHtml(input.clientName)},
          </p>

          <p>
            Thank you for submitting your translation enquiry.
            We have received your document successfully.
          </p>

          <p>
            Your document requires professional review before
            we can confirm the final quotation and turnaround.
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

            <strong>Requested turnaround:</strong>
            ${escapeHtml(input.turnaround)}
          </p>

          <p>
            No payment is required at this stage.
          </p>

          <p>
            Once our team has reviewed the document, we will
            send you a separate email containing the confirmed
            quotation and secure payment link.
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
      "Enquiry received email failed:",
      error
    );

    throw new Error(
      "Unable to send enquiry acknowledgement."
    );
  }
}