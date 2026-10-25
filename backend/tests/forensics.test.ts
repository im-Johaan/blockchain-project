import { expect } from "chai";
import { generateIssuanceToken, computeCommitment } from "../src/forensics/token";
import {
  encodeTokenToZeroWidth,
  extractMarkers,
  embedWatermark,
  stripZeroWidthCharacters,
  ZW_CHARS,
} from "../src/forensics/encoder";
import { canonicalizeText, computeContentHash } from "../src/storage/metadataStorage";

describe("Forensic Steganography & Token Engine", () => {
  it("should generate cryptographically random 256-bit token and matching Keccak-256 commitment", () => {
    const { tokenHex, commitment } = generateIssuanceToken();

    expect(tokenHex).to.be.a("string");
    expect(tokenHex.startsWith("0x")).to.be.true;
    expect(tokenHex.length).to.equal(66); // '0x' + 64 hex characters (32 bytes)

    const recomputedCommitment = computeCommitment(tokenHex);
    expect(commitment).to.equal(recomputedCommitment);

    // Two tokens generated successively must be completely different
    const token2 = generateIssuanceToken();
    expect(tokenHex).to.not.equal(token2.tokenHex);
    expect(commitment).to.not.equal(token2.commitment);
  });

  it("should correctly encode and decode 256-bit token to and from zero-width Unicode", () => {
    const { tokenHex } = generateIssuanceToken();
    const encoded = encodeTokenToZeroWidth(tokenHex);

    // Frame: 1 start character + 256 bits + 1 end character = 258 chars
    expect(encoded.length).to.equal(258);
    expect(encoded.startsWith(ZW_CHARS.START)).to.be.true;
    expect(encoded.endsWith(ZW_CHARS.END)).to.be.true;

    // Embedded in text
    const sampleText = "This is a confidential board policy on merger procedures.";
    const watermarkedText = embedWatermark(sampleText, tokenHex);

    expect(watermarkedText).to.include(sampleText);
    expect(watermarkedText.length).to.be.greaterThan(sampleText.length);

    // Extraction
    const extracted = extractMarkers(watermarkedText);
    expect(extracted).to.have.lengthOf(1);
    expect(extracted[0].isValid).to.be.true;
    expect(extracted[0].bitLength).to.equal(256);
    expect(extracted[0].tokenHex.toLowerCase()).to.equal(tokenHex.toLowerCase());

    // Stripping invisible characters restores exact original text
    const stripped = stripZeroWidthCharacters(watermarkedText);
    expect(stripped).to.equal(sampleText);
  });

  it("should detect and report malformed markers and incomplete frames", () => {
    // 1. Incomplete frame (marker cut off at the end of partial copied leak)
    const incompleteFrame = `Some leaked snippet... ${ZW_CHARS.START}${ZW_CHARS.BIT_0}${ZW_CHARS.BIT_1}`;
    const res1 = extractMarkers(incompleteFrame);
    expect(res1).to.have.lengthOf(1);
    expect(res1[0].isValid).to.be.false;
    expect(res1[0].error).to.include("Incomplete marker frame");

    // 2. Corrupted frame with invalid bit length (e.g. 10 bits instead of 256)
    const shortPayload = `${ZW_CHARS.START}${"\u200B".repeat(10)}${ZW_CHARS.END}`;
    const res2 = extractMarkers(shortPayload);
    expect(res2).to.have.lengthOf(1);
    expect(res2[0].isValid).to.be.false;
    expect(res2[0].error).to.include("Invalid bit length");

    // 3. Plain text with zero markers
    const cleanText = "Just regular text with absolutely no markers.";
    const res3 = extractMarkers(cleanText);
    expect(res3).to.have.lengthOf(0);
  });

  it("should survive multi-paragraph text and recover from partial text leak", () => {
    const { tokenHex } = generateIssuanceToken();
    const docText = `Paragraph 1: Top secret strategic roadmap.

Paragraph 2: Financial projections and asset valuations.

Paragraph 3: Executive sign-off and approval stamps.`;

    const markedDoc = embedWatermark(docText, tokenHex);

    // Simulate leaking ONLY the second paragraph
    const leakedParagraph = markedDoc.split("\n\n")[1];
    const extracted = extractMarkers(leakedParagraph);

    expect(extracted).to.have.lengthOf(1);
    expect(extracted[0].isValid).to.be.true;
    expect(extracted[0].tokenHex.toLowerCase()).to.equal(tokenHex.toLowerCase());
  });
});

describe("Deterministic Content Canonicalization", () => {
  it("should produce identical SHA-256 hashes regardless of CRLF or trailing line whitespace", () => {
    const textUnix = "Line 1\nLine 2    \nLine 3\n";
    const textWindows = "Line 1\r\nLine 2\r\nLine 3\r\n";
    const textTrimmed = "Line 1\nLine 2\nLine 3";

    const hash1 = computeContentHash(textUnix);
    const hash2 = computeContentHash(textWindows);
    const hash3 = computeContentHash(textTrimmed);

    expect(hash1).to.equal(hash2);
    expect(hash2).to.equal(hash3);
  });

  it("should produce different hash when content is modified (tamper detection)", () => {
    const original = "Confidential transfer: send $10,000 to account A.";
    const tampered = "Confidential transfer: send $90,000 to account A.";

    const hashOriginal = computeContentHash(original);
    const hashTampered = computeContentHash(tampered);

    expect(hashOriginal).to.not.equal(hashTampered);
  });
});
