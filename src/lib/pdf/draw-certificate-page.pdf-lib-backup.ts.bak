import {
  PDFFont,
  PDFImage,
  PDFPage,
  rgb,
} from "pdf-lib";


type CertificateData = {
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


type OrderData = {
  order_reference: string;
};


type DrawCertificatePageInput = {
  page: PDFPage;

  certificate: CertificateData;
  order: OrderData;

  regularFont: PDFFont;
  boldFont: PDFFont;

  logo: PDFImage;
  watermark: PDFImage;
  ciol: PDFImage;
  signature: PDFImage;
  stamp: PDFImage;
  qrImage: PDFImage;

  contactEmail?: string | null;
};


const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;


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


function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
) {
  const words =
    text.trim().split(/\s+/);

  const lines: string[] = [];

  let currentLine = "";

  for (const word of words) {
    const candidate =
      currentLine
        ? `${currentLine} ${word}`
        : word;

    const width =
      font.widthOfTextAtSize(
        candidate,
        fontSize
      );

    if (
      width > maxWidth &&
      currentLine
    ) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}


function drawCentredText(
  page: PDFPage,
  text: string,
  y: number,
  size: number,
  font: PDFFont,
  colour = rgb(
    0.07,
    0.12,
    0.09
  )
) {
  const width =
    font.widthOfTextAtSize(
      text,
      size
    );

  page.drawText(
    text,
    {
      x:
        (A4_WIDTH - width) /
        2,

      y,
      size,
      font,
      color: colour,
    }
  );
}


export function drawCertificatePage({
  page,
  certificate,
  order,
  regularFont,
  boldFont,
  logo,
  watermark,
  ciol,
  signature,
  stamp,
  qrImage,
  contactEmail,
}: DrawCertificatePageInput) {
  /*
    BACKGROUND WATERMARK
  */

  const watermarkScale =
    Math.min(
      465 / watermark.width,
      465 / watermark.height
    );

  const watermarkWidth =
    watermark.width *
    watermarkScale;

  const watermarkHeight =
    watermark.height *
    watermarkScale;

  page.drawImage(
    watermark,
    {
      x:
        (A4_WIDTH -
          watermarkWidth) /
        2,

      y:
        (A4_HEIGHT -
          watermarkHeight) /
          2 -
        25,

      width:
        watermarkWidth,

      height:
        watermarkHeight,

      opacity: 0.08,
    }
  );


  /*
    HEADER
  */

  const logoScale =
    Math.min(
      138 / logo.width,
      96 / logo.height
    );

  page.drawImage(
    logo,
    {
      x: 34,
      y: 724,

      width:
        logo.width *
        logoScale,

      height:
        logo.height *
        logoScale,
    }
  );


  const ciolScale =
    Math.min(
      112 / ciol.width,
      96 / ciol.height
    );

  page.drawImage(
    ciol,
    {
      x:
        A4_WIDTH -
        ciol.width *
          ciolScale -
        34,

      y: 724,

      width:
        ciol.width *
        ciolScale,

      height:
        ciol.height *
        ciolScale,
    }
  );


  drawCentredText(
    page,
    "KHUDOYNAZAR LTD,",
    797,
    10.5,
    boldFont
  );

  drawCentredText(
    page,
    "trading as",
    782,
    7.5,
    regularFont
  );

  drawCentredText(
    page,
    "GLOBAL TRANSLATION HUB",
    765,
    10,
    boldFont
  );


  drawCentredText(
    page,
    "Correspondence Address:",
    744,
    7.3,
    regularFont
  );

  drawCentredText(
    page,
    "6 Lyndewode Road,",
    732,
    7.3,
    regularFont
  );

  drawCentredText(
    page,
    "Cambridge, CB1 2HL, United Kingdom",
    720,
    7.3,
    regularFont
  );


  const headerEmail =
    contactEmail
      ? `Email: ${contactEmail}`
      : "Email: corporate email to be confirmed";

  drawCentredText(
    page,
    headerEmail,
    706,
    7,
    regularFont
  );

  drawCentredText(
    page,
    "Tel: 07723 681 637",
    694,
    7,
    regularFont
  );


  page.drawLine({
    start: {
      x: 36,
      y: 681,
    },

    end: {
      x: A4_WIDTH - 36,
      y: 681,
    },

    thickness: 0.8,

    color: rgb(
      0.08,
      0.11,
      0.09
    ),
  });


  /*
    TITLE
  */

  drawCentredText(
    page,
    "GLOBAL TRANSLATION HUB",
    650,
    8,
    boldFont,
    rgb(
      0.03,
      0.50,
      0.35
    )
  );

  drawCentredText(
    page,
    "CERTIFICATE OF TRANSLATION ACCURACY",
    625,
    17,
    boldFont
  );


  /*
    CERTIFICATE DETAILS
  */

  const infoRows: Array<
    [string, string]
  > = [
    [
      "CERTIFICATE REFERENCE",
      certificate.certificate_reference,
    ],

    [
      "ORDER REFERENCE",
      order.order_reference,
    ],

    [
      "CLIENT NAME",
      certificate.client_name ??
        "Not specified",
    ],

    [
      "DOCUMENT TITLE",
      certificate.document_title ??
        "Not specified",
    ],

    [
      "SOURCE LANGUAGE",
      certificate.source_language,
    ],

    [
      "TARGET LANGUAGE",
      certificate.target_language,
    ],

    [
      "NUMBER OF PAGES",
      String(
        certificate.number_of_pages ??
          1
      ),
    ],

    [
      "DATE ASSIGNED",
      formatDate(
        certificate.date_assigned
      ),
    ],

    [
      "DATE RETURNED",
      formatDate(
        certificate.date_returned
      ),
    ],

    [
      "CERTIFICATION DATE",
      formatDate(
        certificate.certification_date
      ),
    ],
  ];


  const leftX = 44;
  const rightX = 314;

  const infoStartY = 588;
  const infoRowGap = 35;


  for (
    let index = 0;
    index < infoRows.length;
    index++
  ) {
    const [label, value] =
      infoRows[index];

    const column =
      index % 2;

    const row =
      Math.floor(index / 2);

    const x =
      column === 0
        ? leftX
        : rightX;

    const y =
      infoStartY -
      row *
        infoRowGap;

    page.drawText(
      label,
      {
        x,
        y,
        size: 6.7,
        font: regularFont,

        color: rgb(
          0.39,
          0.45,
          0.41
        ),
      }
    );

    page.drawText(
      value,
      {
        x,
        y: y - 13,
        size: 9.2,
        font: boldFont,
      }
    );
  }


  /*
    CERTIFICATION STATEMENT
  */

  let contentY = 406;

  page.drawText(
    "CERTIFICATION STATEMENT",
    {
      x: 44,
      y: contentY,
      size: 10.5,
      font: boldFont,
    }
  );

  contentY -= 21;


  const statementLines =
    wrapText(
      certificate.certification_statement ??
        "",
      regularFont,
      9.2,
      507
    );


  for (
    const line of statementLines
  ) {
    page.drawText(
      line,
      {
        x: 44,
        y: contentY,
        size: 9.2,
        font: regularFont,
      }
    );

    contentY -= 13.5;
  }


  contentY -= 14;


  /*
    SOURCE DOCUMENT DISCLAIMER
  */

  page.drawText(
    "SOURCE DOCUMENT DISCLAIMER",
    {
      x: 44,
      y: contentY,
      size: 10,
      font: boldFont,
    }
  );

  contentY -= 19;


  const disclaimer =
    "This certification relates solely to the accuracy of the translation. " +
    "GLOBAL TRANSLATION HUB / KHUDOYNAZAR LTD does not certify, authenticate " +
    "or verify the authenticity, validity, provenance or legal effect of the " +
    "source document supplied by the client.";


  const disclaimerLines =
    wrapText(
      disclaimer,
      regularFont,
      8.2,
      507
    );


  for (
    const line of disclaimerLines
  ) {
    page.drawText(
      line,
      {
        x: 44,
        y: contentY,
        size: 8.2,
        font: regularFont,

        color: rgb(
          0.18,
          0.24,
          0.20
        ),
      }
    );

    contentY -= 11.5;
  }


  /*
    TRANSLATOR DETAILS
  */

  const lowerY = 244;


  page.drawText(
    "Translator",
    {
      x: 44,
      y: lowerY,
      size: 7.2,
      font: regularFont,

      color: rgb(
        0.39,
        0.45,
        0.41
      ),
    }
  );

  page.drawText(
    "Dr Zulfiyor Bakhtiyorov ACIL",
    {
      x: 44,
      y: lowerY - 16,
      size: 9.5,
      font: boldFont,
    }
  );

  page.drawText(
    "Associate Member of the Chartered Institute of Linguists",
    {
      x: 44,
      y: lowerY - 32,
      size: 7.5,
      font: regularFont,
    }
  );

  page.drawText(
    "CIOL Membership No. 95203",
    {
      x: 44,
      y: lowerY - 45,
      size: 7.5,
      font: regularFont,
    }
  );


  /*
    COMPANY DETAILS
  */

  page.drawText(
    "For and on behalf of",
    {
      x: 326,
      y: lowerY,
      size: 7.2,
      font: regularFont,

      color: rgb(
        0.39,
        0.45,
        0.41
      ),
    }
  );

  page.drawText(
    "GLOBAL TRANSLATION HUB",
    {
      x: 326,
      y: lowerY - 16,
      size: 9.5,
      font: boldFont,
    }
  );

  page.drawText(
    "KHUDOYNAZAR LTD",
    {
      x: 326,
      y: lowerY - 32,
      size: 7.5,
      font: regularFont,
    }
  );

  page.drawText(
    "Company No. 16122617",
    {
      x: 326,
      y: lowerY - 45,
      size: 7.5,
      font: regularFont,
    }
  );

  page.drawText(
    "globaltranslationhub.co.uk",
    {
      x: 326,
      y: lowerY - 59,
      size: 7.5,
      font: boldFont,

      color: rgb(
        0.03,
        0.50,
        0.35
      ),
    }
  );


  if (contactEmail) {
    page.drawText(
      contactEmail,
      {
        x: 326,
        y: lowerY - 72,
        size: 7.3,
        font: regularFont,
      }
    );
  }


  /*
    SIGNATURE
  */

  page.drawText(
    "Signature",
    {
      x: 44,
      y: 169,
      size: 7.5,
      font: regularFont,

      color: rgb(
        0.39,
        0.45,
        0.41
      ),
    }
  );


  const signatureScale =
    Math.min(
      140 / signature.width,
      48 / signature.height
    );


  page.drawImage(
    signature,
    {
      x: 54,
      y: 116,

      width:
        signature.width *
        signatureScale,

      height:
        signature.height *
        signatureScale,
    }
  );


  page.drawLine({
    start: {
      x: 44,
      y: 111,
    },

    end: {
      x: 245,
      y: 111,
    },

    thickness: 0.8,

    color: rgb(
      0.08,
      0.11,
      0.09
    ),
  });


  page.drawText(
    `Certification Date: ${formatDate(
      certificate.certification_date
    )}`,
    {
      x: 44,
      y: 92,
      size: 7.5,
      font: regularFont,
    }
  );


  /*
    COMPANY STAMP

    Under the company details and immediately
    to the right of the signature line.
  */

  const stampScale =
    Math.min(
      92 / stamp.width,
      92 / stamp.height
    );


  page.drawImage(
    stamp,
    {
      x: 340,
      y: 100,

      width:
        stamp.width *
        stampScale,

      height:
        stamp.height *
        stampScale,

      opacity: 0.92,
    }
  );


  /*
    VERIFICATION FOOTER
  */

  page.drawLine({
    start: {
      x: 44,
      y: 72,
    },

    end: {
      x: A4_WIDTH - 44,
      y: 72,
    },

    thickness: 0.5,

    color: rgb(
      0.78,
      0.84,
      0.80
    ),
  });


  page.drawText(
    "Certificate Verification Reference:",
    {
      x: 44,
      y: 56,
      size: 6.8,
      font: regularFont,

      color: rgb(
        0.39,
        0.45,
        0.41
      ),
    }
  );

  page.drawText(
    certificate.certificate_reference,
    {
      x: 44,
      y: 43,
      size: 7.8,
      font: boldFont,
    }
  );


  page.drawText(
    "Online verification:",
    {
      x: 205,
      y: 56,
      size: 6.8,
      font: regularFont,

      color: rgb(
        0.39,
        0.45,
        0.41
      ),
    }
  );

  page.drawText(
    "globaltranslationhub.co.uk/verify",
    {
      x: 205,
      y: 43,
      size: 7.2,
      font: boldFont,

      color: rgb(
        0.03,
        0.50,
        0.35
      ),
    }
  );


  /*
    QR CODE
    Dedicated bottom-right verification position.
  */

  const qrSize = 52;


  page.drawImage(
    qrImage,
    {
      x:
        A4_WIDTH -
        qrSize -
        37,

      y: 13,

      width:
        qrSize,

      height:
        qrSize,
    }
  );


  const qrLabel =
    "SCAN TO VERIFY";

  const qrLabelWidth =
    boldFont.widthOfTextAtSize(
      qrLabel,
      5.2
    );


  page.drawText(
    qrLabel,
    {
      x:
        A4_WIDTH -
        37 -
        qrSize /
          2 -
        qrLabelWidth /
          2,

      y: 5,

      size: 5.2,
      font: boldFont,

      color: rgb(
        0.03,
        0.50,
        0.35
      ),
    }
  );
}