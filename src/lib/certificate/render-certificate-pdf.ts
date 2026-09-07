import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";


export async function renderCertificatePdf(
  html: string
) {
  const browser =
    await puppeteer.launch({
      args: chromium.args,

      executablePath:
        await chromium.executablePath(),

      headless: true,
    });

  try {
    const page =
      await browser.newPage();


    await page.setContent(
      html,
      {
        waitUntil: "load",
      }
    );


    await page.emulateMediaType(
      "screen"
    );


    const pdf =
      await page.pdf({
        format: "A4",

        printBackground: true,

        preferCSSPageSize: true,

        margin: {
          top: "0mm",
          right: "0mm",
          bottom: "0mm",
          left: "0mm",
        },
      });


    return new Uint8Array(
      pdf
    );
  } finally {
    await browser.close();
  }
}