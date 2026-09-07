import fs from "fs/promises";
import path from "path";

import QRCode from "qrcode";

import { renderCertificateHtml } from "@/lib/certificate/render-certificate-html";


type CertificateInput = {
  certificate_reference: string;
  client_name: string | null;
  document_title: string | null;
  source_language: string;
  target_language: string;
  number_of_pages: number | null;
  date_assigned: string | null;
  date_returned: string | null;
  certification_date: string | null;
  certification_statement: string | null;
};


type OrderInput = {
  order_reference: string;
};


async function fileToDataUrl(
  filename: string,
  mimeType: string
) {
  const filePath =
    path.join(
      process.cwd(),
      "public",
      "branding",
      filename
    );

  const buffer =
    await fs.readFile(
      filePath
    );

  return (
    `data:${mimeType};base64,` +
    buffer.toString("base64")
  );
}


export async function buildCertificateHtml({
  certificate,
  order,
}: {
  certificate: CertificateInput;
  order: OrderInput;
}) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const verificationUrl =
    `${siteUrl.replace(/\/$/, "")}` +
    `/verify?reference=${encodeURIComponent(
      certificate.certificate_reference
    )}`;


  const [
    logoDataUrl,
    watermarkDataUrl,
    ciolDataUrl,
    signatureDataUrl,
    stampDataUrl,
  ] = await Promise.all([
    fileToDataUrl(
      "gth-logo.png",
      "image/png"
    ),

    fileToDataUrl(
      "gth-watermark.png",
      "image/png"
    ),

    fileToDataUrl(
      "ciol-member-mark.png",
      "image/png"
    ),

    fileToDataUrl(
      "signature.png",
      "image/png"
    ),

    fileToDataUrl(
      "company-stamp.png",
      "image/png"
    ),
  ]);


  const qrDataUrl =
    await QRCode.toDataURL(
      verificationUrl,
      {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 400,

        color: {
          dark: "#102B20",
          light: "#FFFFFF",
        },
      }
    );


  const contactEmail =
    process.env
      .CERTIFICATE_CONTACT_EMAIL
      ?.trim() ||
    null;


  return renderCertificateHtml({
    certificateReference:
      certificate.certificate_reference,

    orderReference:
      order.order_reference,

    clientName:
      certificate.client_name,

    documentTitle:
      certificate.document_title,

    sourceLanguage:
      certificate.source_language,

    targetLanguage:
      certificate.target_language,

    numberOfPages:
      certificate.number_of_pages,

    dateAssigned:
      certificate.date_assigned,

    dateReturned:
      certificate.date_returned,

    certificationDate:
      certificate.certification_date,

    certificationStatement:
      certificate.certification_statement,

    logoDataUrl,
    watermarkDataUrl,
    ciolDataUrl,
    signatureDataUrl,
    stampDataUrl,
    qrDataUrl,

    contactEmail,
  });
}