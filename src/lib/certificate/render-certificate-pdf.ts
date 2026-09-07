import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

import {
  existsSync,
} from "fs";

import {
  join,
} from "path";

function getLocalChromeExecutable() {
  if (process.platform === "win32") {
    const candidates = [
      process.env.PROGRAMFILES
        ? join(
            process.env.PROGRAMFILES,
            "Google",
            "Chrome",
            "Application",
            "chrome.exe"
          )
        : null,

      process.env["PROGRAMFILES(X86)"]
        ? join(
            process.env["PROGRAMFILES(X86)"],
            "Google",
            "Chrome",
            "Application",
            "chrome.exe"
          )
        : null,

      process.env.LOCALAPPDATA
        ? join(
            process.env.LOCALAPPDATA,
            "Google",
            "Chrome",
            "Application",
            "chrome.exe"
          )
        : null,

      process.env.LOCALAPPDATA
        ? join(
            process.env.LOCALAPPDATA,
            "Chromium",
            "Application",
            "chrome.exe"
          )
        : null,
    ];


    for (const candidate of candidates) {
      if (
        candidate &&
        existsSync(candidate)
      ) {
        return candidate;
      }
    }
  }


  if (process.platform === "darwin") {
    const macChrome =
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

    if (existsSync(macChrome)) {
      return macChrome;
    }
  }


  return null;
}

export async function renderCertificatePdf(
  html: string
) {

  const isProduction =
    process.env.NODE_ENV ===
    "production";


  const localChromeExecutable =
    getLocalChromeExecutable();


  const executablePath =
    isProduction
      ? await chromium.executablePath()
      : localChromeExecutable;


  if (!executablePath) {
    throw new Error(
      "A local Chrome installation could not be found. Install Google Chrome or configure the local Chromium executable path."
    );
  }


  console.log(
    "Certificate PDF browser:",
    {
      environment:
        isProduction
          ? "production"
          : "local",

      executablePath,
    }
  );


  const browser =
    await puppeteer.launch({
      executablePath,

      args:
        isProduction
          ? chromium.args
          : [
              "--no-sandbox",
              "--disable-setuid-sandbox",
            ],

      headless:
        true,
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
