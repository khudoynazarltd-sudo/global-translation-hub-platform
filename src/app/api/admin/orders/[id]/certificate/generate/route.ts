import { NextResponse } from "next/server";
import { buildCertificateHtml } from "@/lib/certificate/build-certificate-html";

import { renderCertificatePdf } from "@/lib/certificate/render-certificate-pdf";

import {
  PDFDocument,
  StandardFonts,
} from "pdf-lib";

import fs from "fs/promises";
import path from "path";

import { requireAdmin } from "@/lib/auth/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import QRCode from "qrcode";

export const runtime = "nodejs";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;



async function loadBrandingFile(
  filename: string
) {
  const filePath = path.join(
    process.cwd(),
    "public",
    "branding",
    filename
  );

  return fs.readFile(filePath);
}

export async function POST(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  await requireAdmin();

  const { id: orderId } =
    await context.params;

  try {
    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select(`
          id,
          order_reference,
          enquiry_id,
          status
        `)
        .eq("id", orderId)
        .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        {
          ok: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    const {
      data: certificate,
      error: certificateError,
    } = await supabaseAdmin
      .from("certificates")
      .select("*")
      .eq("order_id", order.id)
      .maybeSingle();

    if (
      certificateError ||
      !certificate
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Certificate not found.",
        },
        { status: 404 }
      );
    }

    if (
      !["approved", "issued"].includes(
        certificate.status
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "The certificate must be approved before a certified bundle can be generated.",
        },
        { status: 400 }
      );
    }
    const {
      data: finalDocuments,
      error: finalDocumentsError,
    } = await supabaseAdmin
      .from("documents")
      .select(`
        id,
        storage_path,
        original_filename,
        mime_type
      `)
      .eq(
        "enquiry_id",
        order.enquiry_id
      )
      .eq(
        "status",
        "final_translation"
      );

    if (finalDocumentsError) {
      throw new Error(
        "Unable to retrieve final translation files."
      );
    }

    const finalPdf =
      (finalDocuments ?? []).find(
        (document) =>
          document.mime_type ===
          "application/pdf"
      );

    if (!finalPdf) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "A final translation in PDF format is required before generating the certified bundle.",
        },
        { status: 400 }
      );
    }

    const {
      data: sourceDocuments,
      error: sourceDocumentsError,
    } = await supabaseAdmin
      .from("documents")
      .select(`
        id,
        storage_path,
        original_filename,
        mime_type
      `)
      .eq(
        "enquiry_id",
        order.enquiry_id
      )
      .eq(
        "status",
        "order_source"
      );

    if (sourceDocumentsError) {
      throw new Error(
        "Unable to retrieve source documents."
      );
    }

    const {
      data: finalFileData,
      error: finalDownloadError,
    } =
      await supabaseAdmin.storage
        .from("order-final-files")
        .download(
          finalPdf.storage_path
        );

    if (
      finalDownloadError ||
      !finalFileData
    ) {
      throw new Error(
        "Unable to download the final translation."
      );
    }

    const outputDocument =
      await PDFDocument.create();

    const regularFont =
      await outputDocument.embedFont(
        StandardFonts.Helvetica
      );

    const boldFont =
      await outputDocument.embedFont(
        StandardFonts.HelveticaBold
      );

    const logoBytes =
      await loadBrandingFile(
        "gth-logo.png"
      );

    const watermarkBytes =
      await loadBrandingFile(
        "gth-watermark.png"
      );

    const ciolBytes =
      await loadBrandingFile(
        "ciol-member-mark.png"
      );

    const signatureBytes =
      await loadBrandingFile(
        "signature.png"
      );
    
    const stampBytes =
      await loadBrandingFile(
        "company-stamp.png"
      );

    const logo =
      await outputDocument.embedPng(
        logoBytes
      );

    const watermark =
      await outputDocument.embedPng(
        watermarkBytes
      );

    const ciol =
      await outputDocument.embedPng(
        ciolBytes
      );

    const signature =
      await outputDocument.embedPng(
        signatureBytes
      );
    
    const stamp =
      await outputDocument.embedPng(
        stampBytes
      );

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";
    
    const verificationUrl =
      `${siteUrl.replace(/\/$/, "")}` +
      `/verify?reference=${encodeURIComponent(
        certificate.certificate_reference
      )}`;
    
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
    
    const qrBase64 =
      qrDataUrl.split(",")[1];
    
    if (!qrBase64) {
      throw new Error(
        "Unable to generate certificate verification QR code."
      );
    }
    
    const qrBytes =
      Buffer.from(
        qrBase64,
        "base64"
      );
    
    const qrImage =
      await outputDocument.embedPng(
        qrBytes
      );
    
    /*
      PAGE 1
      Certificate of Translation Accuracy
    
      Generated from the same HTML template
      used by the administrative preview.
    */
    
    const certificateHtml =
      await buildCertificateHtml({
        certificate,
    
        order: {
          order_reference:
            order.order_reference,
        },
      });
    
    
    const certificatePdfBytes =
      await renderCertificatePdf(
        certificateHtml
      );
    
    
    const certificatePdf =
      await PDFDocument.load(
        certificatePdfBytes
      );
    
    
    const certificatePages =
      await outputDocument.copyPages(
        certificatePdf,
        certificatePdf.getPageIndices()
      );
    
    
    for (
      const certificatePage of
      certificatePages
    ) {
      outputDocument.addPage(
        certificatePage
      );
    }


    const finalPdfBytes =
      new Uint8Array(
        await finalFileData.arrayBuffer()
      );

    const finalTranslationPdf =
      await PDFDocument.load(
        finalPdfBytes
      );

    const finalPageIndices =
      finalTranslationPdf.getPageIndices();

    const copiedFinalPages =
      await outputDocument.copyPages(
        finalTranslationPdf,
        finalPageIndices
      );

    for (
      let index = 0;
      index < copiedFinalPages.length;
      index++
    ) {
      const copiedPage =
        copiedFinalPages[index];
    
      const {
        width,
        height,
      } = copiedPage.getSize();
    
      const pageStampScale =
        Math.min(
          78 / stamp.width,
          78 / stamp.height
        );
    
      copiedPage.drawImage(stamp, {
        x:
          width -
          stamp.width *
            pageStampScale -
          28,
    
        y: 24,
    
        width:
          stamp.width *
          pageStampScale,
    
        height:
          stamp.height *
          pageStampScale,
    
        opacity: 0.9,
      });
    
   
      outputDocument.addPage(
        copiedPage
      );
    }

    /*
      LAST PAGES
      Source documents
    */

    for (
      const sourceDocument of
      sourceDocuments ?? []
    ) {
      const {
        data: sourceFileData,
        error: sourceDownloadError,
      } =
        await supabaseAdmin.storage
          .from(
            "order-source-files"
          )
          .download(
            sourceDocument.storage_path
          );

      if (
        sourceDownloadError ||
        !sourceFileData
      ) {
        throw new Error(
          `Unable to download source document ${sourceDocument.id}.`
        );
      }

      const sourceBytes =
        new Uint8Array(
          await sourceFileData.arrayBuffer()
        );

      if (
        sourceDocument.mime_type ===
        "application/pdf"
      ) {
        const sourcePdf =
          await PDFDocument.load(
            sourceBytes
          );

        const sourcePageIndices =
          sourcePdf.getPageIndices();

        const copiedSourcePages =
          await outputDocument.copyPages(
            sourcePdf,
            sourcePageIndices
          );

        for (
          const copiedPage of
          copiedSourcePages
        ) {
          outputDocument.addPage(
            copiedPage
          );
        }

        continue;
      }

      if (
        sourceDocument.mime_type ===
          "image/jpeg" ||
        sourceDocument.mime_type ===
          "image/png"
      ) {
        const image =
          sourceDocument.mime_type ===
          "image/png"
            ? await outputDocument.embedPng(
                sourceBytes
              )
            : await outputDocument.embedJpg(
                sourceBytes
              );

        const imagePage =
          outputDocument.addPage([
            A4_WIDTH,
            A4_HEIGHT,
          ]);

        const maxWidth =
          A4_WIDTH - 70;

        const maxHeight =
          A4_HEIGHT - 70;

        const scale =
          Math.min(
            maxWidth / image.width,
            maxHeight / image.height,
            1
          );

        const imageWidth =
          image.width * scale;

        const imageHeight =
          image.height * scale;

        imagePage.drawImage(
          image,
          {
            x:
              (A4_WIDTH -
                imageWidth) /
              2,

            y:
              (A4_HEIGHT -
                imageHeight) /
              2,

            width:
              imageWidth,

            height:
              imageHeight,
          }
        );

        continue;
      }

      throw new Error(
        `Unsupported source document format: ${sourceDocument.mime_type}`
      );
    }

    const bundleBytes =
      await outputDocument.save();

    const bundleVersion =
      new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "")
        .replace("T", "-");
    
    const storagePath =
      `${order.order_reference}/` +
      `${order.order_reference}-Certified-Translation-${bundleVersion}.pdf`;

    /*
      If an older bundle exists for this certificate,
      overwrite the approved bundle.
    */

    const {
      error: uploadError,
    } =
      await supabaseAdmin.storage
        .from("certified-bundles")
        .upload(
          storagePath,
          bundleBytes,
          {
            contentType:
              "application/pdf",

            upsert: false,
          }
        );

    if (uploadError) {
      console.error(
        "Certified bundle upload failed:",
        uploadError
      );

      throw new Error(
        "Unable to store certified bundle."
      );
    }

    const {
      data: issuedCertificate,
      error: updateError,
    } = await supabaseAdmin
      .from("certificates")
      .update({
        status: "issued",

        bundle_storage_path:
          storagePath,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        certificate.id
      )
      .select("*")
      .single();

    if (
      updateError ||
      !issuedCertificate
    ) {
      throw new Error(
        "Unable to update certificate record."
      );
    }

    return NextResponse.json({
      ok: true,

      certificate:
        issuedCertificate,

      storagePath,
    });
  } catch (error) {
    console.error(
      "Certified bundle generation failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to generate certified bundle.",
      },
      { status: 500 }
    );
  }
}