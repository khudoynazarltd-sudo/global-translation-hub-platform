type CertificateHtmlInput = {
  certificateReference: string;
  orderReference: string;

  clientName: string | null;
  documentTitle: string | null;

  sourceLanguage: string;
  targetLanguage: string;

  numberOfPages: number | null;

  dateAssigned: string | null;
  dateReturned: string | null;
  certificationDate: string | null;

  certificationStatement: string | null;

  logoDataUrl: string;
  watermarkDataUrl: string;
  ciolDataUrl: string;
  signatureDataUrl: string;
  stampDataUrl: string;
  qrDataUrl: string;

  contactEmail?: string | null;
};


function escapeHtml(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatDate(value: string | null) {
  if (!value) {
    return "Not specified";
  }

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}


export function renderCertificateHtml(
  input: CertificateHtmlInput
) {
  const emailLine =
    input.contactEmail
      ? `Email: ${escapeHtml(
          input.contactEmail
        )}`
      : "Email: corporate email to be confirmed";

  return `
<!doctype html>

<html lang="en">
<head>
  <meta charset="utf-8" />

  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: white;
      font-family:
        Arial,
        Helvetica,
        sans-serif;
      color: #13201a;
    }

    .certificate-page {
      position: relative;

      width: 210mm;
      height: 297mm;

      overflow: hidden;

      background: white;

      padding:
        10mm
        12mm
        9mm
        12mm;
    }

    .watermark {
      position: absolute;

      width: 164mm;
      height: 164mm;

      object-fit: contain;

      left: 50%;
      top: 52%;

      transform:
        translate(
          -50%,
          -50%
        );

      opacity: 0.08;

      z-index: 0;
    }

    .content {
      position: relative;
      z-index: 1;
    }

    .header {
      display: grid;

      grid-template-columns:
        1fr
        1.35fr
        1fr;

      gap: 6mm;

      align-items: start;
    }

    .header-logo-left {
      display: flex;
      justify-content: flex-start;
    }

    .header-logo-right {
      display: flex;
      justify-content: flex-end;
    }

    .gth-logo {
      width: 47mm;
      height: 33mm;
      object-fit: contain;
    }

    .ciol-logo {
      width: 40mm;
      height: 33mm;
      object-fit: contain;
    }

    .company-header {
      text-align: center;
    }

    .company-name {
      font-size: 14px;
      line-height: 1.25;
      font-weight: 700;
    }

    .company-contact {
      margin-top: 7px;

      font-size: 10px;
      line-height: 1.45;
    }

    .company-contact-title {
      text-decoration: underline;
    }

    .header-divider {
      margin-top: 9mm;

      border-top:
        1px
        solid
        #13201a;
    }

    .title-block {
      margin-top: 9mm;
      text-align: center;
    }

    .brand-kicker {
      color: #087f5b;

      font-size: 10px;
      font-weight: 700;

      letter-spacing: 2px;

      text-transform: uppercase;
    }

    .certificate-title {
      margin-top: 7px;

      font-size: 22px;
      line-height: 1.15;

      font-weight: 700;

      text-transform: uppercase;
    }

    .info-grid {
      margin-top: 9mm;

      display: grid;

      grid-template-columns:
        1fr
        1fr;

      column-gap: 14mm;
      row-gap: 5mm;
    }

    .info-label {
      color: #69766f;

      font-size: 8px;
      line-height: 1;

      font-weight: 500;

      text-transform: uppercase;

      letter-spacing: 0.7px;
    }

    .info-value {
      margin-top: 4px;

      font-size: 11px;
      line-height: 1.25;

      font-weight: 700;
    }

    .text-section {
      margin-top: 8mm;
    }

    .section-title {
      margin: 0;

      font-size: 12px;
      line-height: 1.2;

      font-weight: 700;

      text-transform: uppercase;
    }

    .section-text {
      margin:
        4mm
        0
        0
        0;

      font-size: 10.5px;
      line-height: 1.58;
    }

    .disclaimer-text {
      font-size: 9.5px;
      line-height: 1.5;

      color: #34443b;
    }

    .identity-grid {
      margin-top: 8mm;

      display: grid;

      grid-template-columns:
        1fr
        1fr;

      gap: 14mm;
    }

    .identity-label {
      color: #69766f;

      font-size: 9px;
    }

    .identity-name {
      margin-top: 4px;

      font-size: 11px;

      font-weight: 700;
    }

    .identity-details {
      margin-top: 6px;

      font-size: 9px;
      line-height: 1.45;
    }

    .company-website {
      margin-top: 4px;

      color: #087f5b;

      font-weight: 700;
    }

    .signature-stamp-row {
      position: relative;

      margin-top: 8mm;

      min-height: 29mm;
    }

    .signature-area {
      position: absolute;

      left: 0;
      top: 0;

      width: 78mm;
    }

    .signature-label {
      color: #69766f;

      font-size: 9px;
    }

    .signature-image {
      display: block;

      margin:
        2px
        0
        -1px
        4mm;

      width: 43mm;
      height: 15mm;

      object-fit: contain;

      object-position:
        left
        bottom;
    }

    .signature-line {
      width: 72mm;

      border-top:
        1px
        solid
        #13201a;
    }

    .stamp-area {
      position: absolute;

      left: 108mm;
      top: -3mm;

      width: 31mm;
      height: 31mm;
    }

    .company-stamp {
      width: 31mm;
      height: 31mm;

      object-fit: contain;

      opacity: 0.93;
    }

    .certification-date {
      margin-top: 1mm;

      font-size: 9px;
    }

    .verification {
      position: absolute;

      left: 12mm;
      right: 12mm;
      bottom: 8mm;

      min-height: 24mm;

      padding-top: 4mm;

      border-top:
        1px
        solid
        #cedbd3;
    }

    .verification-grid {
      display: grid;

      grid-template-columns:
        1fr
        1.45fr
        25mm;

      gap: 6mm;

      align-items: start;
    }

    .verification-label {
      color: #69766f;

      font-size: 8px;
    }

    .verification-value {
      margin-top: 3px;

      font-size: 9px;

      font-weight: 700;
    }

    .verification-url {
      color: #087f5b;
    }

    .qr-box {
      text-align: center;
    }

    .qr {
      display: block;

      width: 20mm;
      height: 20mm;

      margin:
        -2mm
        auto
        0
        auto;
    }

    .qr-label {
      margin-top: 1px;

      color: #087f5b;

      font-size: 6px;
      font-weight: 700;

      letter-spacing: 0.5px;
    }
  </style>
</head>

<body>

  <section class="certificate-page">

    <img
      class="watermark"
      src="${input.watermarkDataUrl}"
      alt=""
    />

    <div class="content">

      <header class="header">

        <div class="header-logo-left">
          <img
            class="gth-logo"
            src="${input.logoDataUrl}"
            alt="GLOBAL TRANSLATION HUB"
          />
        </div>

        <div class="company-header">

          <div class="company-name">
            KHUDOYNAZAR LTD,
            <br />
            trading as
            <br />
            GLOBAL TRANSLATION HUB
          </div>

          <div class="company-contact">

            <div class="company-contact-title">
              Correspondence Address:
            </div>

            <div>
              6 Lyndewode Road,
              <br />
              Cambridge, CB1 2HL,
              <br />
              United Kingdom
            </div>

            <div>
              ${emailLine}
            </div>

            <div>
              Tel: 07723 681 637
            </div>

          </div>

        </div>

        <div class="header-logo-right">

          <img
            class="ciol-logo"
            src="${input.ciolDataUrl}"
            alt="CIOL Member"
          />

        </div>

      </header>


      <div class="header-divider"></div>


      <div class="title-block">

        <div class="brand-kicker">
          GLOBAL TRANSLATION HUB
        </div>

        <div class="certificate-title">
          Certificate of Translation Accuracy
        </div>

      </div>


      <div class="info-grid">

        ${info(
          "Certificate Reference",
          input.certificateReference
        )}

        ${info(
          "Order Reference",
          input.orderReference
        )}

        ${info(
          "Client Name",
          input.clientName
        )}

        ${info(
          "Document Title",
          input.documentTitle
        )}

        ${info(
          "Source Language",
          input.sourceLanguage
        )}

        ${info(
          "Target Language",
          input.targetLanguage
        )}

        ${info(
          "Number of Pages",
          String(
            input.numberOfPages ??
              1
          )
        )}

        ${info(
          "Date Assigned",
          formatDate(
            input.dateAssigned
          )
        )}

        ${info(
          "Date Returned",
          formatDate(
            input.dateReturned
          )
        )}

        ${info(
          "Certification Date",
          formatDate(
            input.certificationDate
          )
        )}

      </div>


      <section class="text-section">

        <h3 class="section-title">
          Certification Statement
        </h3>

        <p class="section-text">
          ${escapeHtml(
            input.certificationStatement
          )}
        </p>

      </section>


      <section class="text-section">

        <h3 class="section-title">
          Source Document Disclaimer
        </h3>

        <p class="section-text disclaimer-text">
          This certification relates solely to the accuracy
          of the translation. GLOBAL TRANSLATION HUB /
          KHUDOYNAZAR LTD does not certify, authenticate or
          verify the authenticity, validity, provenance or
          legal effect of the source document supplied by
          the client.
        </p>

      </section>


      <section class="identity-grid">

        <div>

          <div class="identity-label">
            Translator
          </div>

          <div class="identity-name">
            Dr Zulfiyor Bakhtiyorov ACIL
          </div>

          <div class="identity-details">
            Associate Member of the Chartered
            Institute of Linguists
            <br />
            CIOL Membership No. 95203
          </div>

        </div>


        <div>

          <div class="identity-label">
            For and on behalf of
          </div>

          <div class="identity-name">
            GLOBAL TRANSLATION HUB
          </div>

          <div class="identity-details">
            KHUDOYNAZAR LTD
            <br />
            Company No. 16122617

            <div class="company-website">
              globaltranslationhub.co.uk
            </div>

            ${
              input.contactEmail
                ? `
                  <div>
                    ${escapeHtml(
                      input.contactEmail
                    )}
                  </div>
                `
                : ""
            }

          </div>

        </div>

      </section>


      <section class="signature-stamp-row">

        <div class="signature-area">

          <div class="signature-label">
            Signature
          </div>

          <img
            class="signature-image"
            src="${input.signatureDataUrl}"
            alt="Translator signature"
          />

          <div class="signature-line"></div>

          <div class="certification-date">
            Certification Date:
            <strong>
              ${escapeHtml(
                formatDate(
                  input.certificationDate
                )
              )}
            </strong>
          </div>

        </div>


        <div class="stamp-area">

          <img
            class="company-stamp"
            src="${input.stampDataUrl}"
            alt="Company stamp"
          />

        </div>

      </section>

    </div>


    <footer class="verification">

      <div class="verification-grid">

        <div>

          <div class="verification-label">
            Certificate Verification Reference:
          </div>

          <div class="verification-value">
            ${escapeHtml(
              input.certificateReference
            )}
          </div>

        </div>


        <div>

          <div class="verification-label">
            Online verification:
          </div>

          <div class="verification-value verification-url">
            globaltranslationhub.co.uk/verify
          </div>

        </div>


        <div class="qr-box">

          <img
            class="qr"
            src="${input.qrDataUrl}"
            alt="Certificate verification QR code"
          />

          <div class="qr-label">
            SCAN TO VERIFY
          </div>

        </div>

      </div>

    </footer>

  </section>

</body>
</html>
  `;
}


function info(
  label: string,
  value: string | null | undefined
) {
  return `
    <div>
      <div class="info-label">
        ${escapeHtml(label)}
      </div>

      <div class="info-value">
        ${escapeHtml(
          value ||
            "Not specified"
        )}
      </div>
    </div>
  `;
}