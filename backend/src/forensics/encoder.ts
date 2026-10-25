/**
 * Forensic Steganography Encoder & Decoder
 * Uses Zero-Width Unicode Characters to embed and extract cryptographically
 * unique issuance tokens into human-readable document text.
 */

export const ZW_CHARS = {
  START: "\uFEFF",      // Zero-width no-break space / BOM
  BIT_0: "\u200B",      // Zero-width space
  BIT_1: "\u200C",      // Zero-width non-joiner
  END: "\u2060",        // Word joiner
} as const;

export interface ExtractedMarker {
  tokenHex: string;
  isValid: boolean;
  bitLength: number;
  error?: string;
}

/**
 * Encodes a 32-byte hex token (e.g. '0xabcd...') into a zero-width Unicode string.
 */
export function encodeTokenToZeroWidth(tokenHex: string): string {
  const cleanHex = tokenHex.startsWith("0x") ? tokenHex.slice(2) : tokenHex;
  if (cleanHex.length !== 64) {
    throw new Error(`Invalid token length: expected 64 hex characters (32 bytes), received ${cleanHex.length}`);
  }

  const bytes = Buffer.from(cleanHex, "hex");
  let bitString = "";

  for (const byte of bytes) {
    for (let i = 7; i >= 0; i--) {
      const bit = (byte >> i) & 1;
      bitString += bit === 1 ? ZW_CHARS.BIT_1 : ZW_CHARS.BIT_0;
    }
  }

  return `${ZW_CHARS.START}${bitString}${ZW_CHARS.END}`;
}

/**
 * Embeds zero-width markers into plain text.
 * Places markers at the end of each paragraph for recovery from partial text leaks.
 */
export function embedWatermark(text: string, tokenHex: string): string {
  const zeroWidthMarker = encodeTokenToZeroWidth(tokenHex);
  const paragraphs = text.split(/(\r?\n\r?\n)/);

  if (paragraphs.length <= 1) {
    // Single line or single block of text: embed at the end
    return text + zeroWidthMarker;
  }

  // Embed at the end of non-separator paragraphs
  return paragraphs
    .map((chunk) => {
      if (chunk.trim().length > 0) {
        return chunk + zeroWidthMarker;
      }
      return chunk;
    })
    .join("");
}

/**
 * Extracts and decodes all zero-width markers from leaked text.
 * Handles complete frames, malformed lengths, and corrupted bits.
 */
export function extractMarkers(text: string): ExtractedMarker[] {
  const results: ExtractedMarker[] = [];
  const startChar = ZW_CHARS.START;
  const endChar = ZW_CHARS.END;

  let startIndex = text.indexOf(startChar);

  while (startIndex !== -1) {
    const endIndex = text.indexOf(endChar, startIndex + 1);
    if (endIndex === -1) {
      // Incomplete frame (marker cut off at end of pasted text)
      results.push({
        tokenHex: "",
        isValid: false,
        bitLength: text.length - startIndex - 1,
        error: "Incomplete marker frame: START delimiter found without matching END delimiter.",
      });
      break;
    }

    const payload = text.slice(startIndex + 1, endIndex);
    let isPayloadValid = true;
    let bits = "";

    for (const char of payload) {
      if (char === ZW_CHARS.BIT_0) {
        bits += "0";
      } else if (char === ZW_CHARS.BIT_1) {
        bits += "1";
      } else {
        isPayloadValid = false;
        break;
      }
    }

    if (!isPayloadValid) {
      results.push({
        tokenHex: "",
        isValid: false,
        bitLength: payload.length,
        error: "Malformed payload: Contains characters other than valid zero-width bit markers.",
      });
    } else if (bits.length !== 256) {
      results.push({
        tokenHex: "",
        isValid: false,
        bitLength: bits.length,
        error: `Invalid bit length: Expected 256 bits (32 bytes), found ${bits.length} bits.`,
      });
    } else {
      // Decode 256 bits into 32 bytes hex
      const byteArray: number[] = [];
      for (let i = 0; i < 256; i += 8) {
        const byteBits = bits.slice(i, i + 8);
        byteArray.push(parseInt(byteBits, 2));
      }
      const tokenHex = "0x" + Buffer.from(byteArray).toString("hex");

      // Avoid duplicate reports in identical text
      if (!results.some((r) => r.tokenHex === tokenHex)) {
        results.push({
          tokenHex,
          isValid: true,
          bitLength: 256,
        });
      }
    }

    startIndex = text.indexOf(startChar, endIndex + 1);
  }

  return results;
}

/**
 * Strips all zero-width characters to obtain the clean visual text.
 */
export function stripZeroWidthCharacters(text: string): string {
  const regex = new RegExp(`[${ZW_CHARS.START}${ZW_CHARS.BIT_0}${ZW_CHARS.BIT_1}${ZW_CHARS.END}]`, "g");
  return text.replace(regex, "");
}
