import PDFDocument from "pdfkit";
import { embedWatermark } from "../forensics/encoder";

export interface GeneratePdfOptions {
  title: string;
  version: number;
  content: string;
  tokenHex: string;
  documentId: string;
  userAddress: string;
  issuedAt: string;
}

/**
 * Generates a professionally formatted watermarked PDF document.
 * The invisible zero-width marker is embedded into the extracted text content.
 */
export async function generateWatermarkedPdf(options: GeneratePdfOptions): Promise<Buffer> {
  const { title, version, content, tokenHex, documentId, userAddress, issuedAt } = options;

  // Embed zero-width watermark into content
  const markedContent = embedWatermark(content, tokenHex);

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        info: {
          Title: title,
          Author: "DataLeak Ledger",
          Subject: `Document ${documentId} v${version}`,
          Keywords: "Blockchain, Forensic Audit, Steganography",
          CreationDate: new Date(),
        },
      });

      const buffers: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: Error) => reject(err));

      // Header Banner
      doc
        .rect(50, 45, 512, 4)
        .fill("#2563eb");

      doc
        .fontSize(22)
        .fillColor("#0f172a")
        .text(title, 50, 65, { align: "left" });

      doc
        .fontSize(10)
        .fillColor("#64748b")
        .text(`Document ID: ${documentId}`, 50, 95);

      doc
        .text(`Version: ${version}   |   Issued: ${issuedAt}`, 50, 110);

      doc
        .text(`Authorized Recipient: ${userAddress}`, 50, 125);

      doc
        .moveTo(50, 145)
        .lineTo(562, 145)
        .strokeColor("#e2e8f0")
        .lineWidth(1)
        .stroke();

      // Main Document Content with Embedded Zero-Width Watermark
      doc.moveDown(2);
      doc
        .fontSize(11)
        .fillColor("#1e293b")
        .lineGap(5)
        .text(markedContent, 50, 160, {
          width: 512,
          align: "left",
        });

      // Footer
      const bottomY = doc.page.height - 50;
      doc
        .fontSize(8)
        .fillColor("#94a3b8")
        .text(
          "DataLeak Ledger — Immutable On-Chain Audit & Forensic Watermarking System",
          50,
          bottomY,
          { align: "center", width: 512 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Returns watermarked plain text for 100% reliable Unicode zero-width marker copy-paste tests.
 */
export function generateWatermarkedText(content: string, tokenHex: string): string {
  return embedWatermark(content, tokenHex);
}
