#!/usr/bin/env python3
"""
DataLeak Ledger — Comprehensive Architecture Presentation Generator
Generates a 12-slide modern, minimal PPTX covering the full system architecture,
data flows, smart contract mechanics, forensic steganography, and security guarantees.
"""

import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from copy import deepcopy


def create_presentation():
    prs = Presentation()
    # 16:9 Widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank = prs.slide_layouts[6]

    # ─── Modern Dark Palette ───
    BG       = RGBColor(8, 12, 28)       # Deep navy
    BG2      = RGBColor(12, 18, 38)      # Slightly lighter card
    CARD     = RGBColor(16, 24, 50)      # Card background
    BORDER   = RGBColor(32, 48, 96)      # Card border accent
    PRIMARY  = RGBColor(99, 102, 241)    # Indigo-500
    CYAN     = RGBColor(34, 211, 238)    # Cyan-400
    EMERALD  = RGBColor(52, 211, 153)    # Emerald-400
    AMBER    = RGBColor(251, 191, 36)    # Amber-400
    ROSE     = RGBColor(251, 113, 133)   # Rose-400
    VIOLET   = RGBColor(167, 139, 250)   # Violet-400
    WHITE    = RGBColor(248, 250, 252)   # Slate-50
    MUTED    = RGBColor(148, 163, 184)   # Slate-400
    LIGHT    = RGBColor(203, 213, 225)   # Slate-300
    DIM      = RGBColor(100, 116, 139)   # Slate-500
    
    FONT = "Inter"
    MONO = "JetBrains Mono"

    # ─── Helper Functions ───

    def bg_rect(slide):
        r = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        r.fill.solid()
        r.fill.fore_color.rgb = BG
        r.line.fill.background()
        return r

    def accent_line(slide, x, y, w, color=PRIMARY):
        """Thin horizontal accent line"""
        r = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Pt(3))
        r.fill.solid()
        r.fill.fore_color.rgb = color
        r.line.fill.background()

    def add_tag(slide, x, y, text, color=CYAN):
        """Small category tag"""
        tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(10), Inches(0.35))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = text.upper()
        p.font.size = Pt(9)
        p.font.bold = True
        p.font.color.rgb = color
        p.font.name = FONT
        run = p.runs[0]
        run.font.letter_spacing = Pt(2)

    def add_title(slide, x, y, text, size=28, color=WHITE, w=11):
        tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(1))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = text
        p.font.size = Pt(size)
        p.font.bold = True
        p.font.color.rgb = color
        p.font.name = FONT

    def add_subtitle(slide, x, y, text, size=14, color=MUTED, w=10):
        tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = text
        p.font.size = Pt(size)
        p.font.color.rgb = color
        p.font.name = FONT

    def add_body(slide, x, y, text, size=13, color=LIGHT, w=5.5, line_spacing=1.5):
        tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(4))
        tf = tb.text_frame
        tf.word_wrap = True
        for i, line in enumerate(text.split("\n")):
            if i == 0:
                p = tf.paragraphs[0]
            else:
                p = tf.add_paragraph()
            p.text = line
            p.font.size = Pt(size)
            p.font.color.rgb = color
            p.font.name = FONT
            p.space_after = Pt(line_spacing * 6)
        return tf

    def add_card(slide, x, y, w, h, title_text, body_lines, accent=PRIMARY, icon_text=""):
        """Rounded card with title and bullets"""
        r = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
        r.fill.solid()
        r.fill.fore_color.rgb = CARD
        r.line.color.rgb = BORDER
        r.line.width = Pt(1)
        
        # Icon/emoji indicator
        if icon_text:
            tb = slide.shapes.add_textbox(Inches(x + 0.3), Inches(y + 0.25), Inches(0.5), Inches(0.5))
            tf = tb.text_frame
            p = tf.paragraphs[0]
            p.text = icon_text
            p.font.size = Pt(18)
        
        # Title
        title_y = y + 0.25 if not icon_text else y + 0.2
        title_x = x + 0.3 if not icon_text else x + 0.85
        tb = slide.shapes.add_textbox(Inches(title_x), Inches(title_y), Inches(w - 0.6), Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = accent
        p.font.name = FONT

        # Accent line under title
        lr = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x + 0.3), Inches(title_y + 0.45), Inches(w - 0.6), Pt(1.5))
        lr.fill.solid()
        lr.fill.fore_color.rgb = BORDER
        lr.line.fill.background()
        
        # Body bullets
        bullet_y = title_y + 0.6
        tb = slide.shapes.add_textbox(Inches(x + 0.3), Inches(bullet_y), Inches(w - 0.6), Inches(h - bullet_y + y - 0.1))
        tf = tb.text_frame
        tf.word_wrap = True
        for i, line in enumerate(body_lines):
            if i == 0:
                p = tf.paragraphs[0]
            else:
                p = tf.add_paragraph()
            p.text = line
            p.font.size = Pt(10.5)
            p.font.color.rgb = LIGHT
            p.font.name = FONT
            p.space_after = Pt(4)

    def add_flow_arrow(slide, x, y, direction="right", color=PRIMARY):
        """Simple arrow indicator"""
        if direction == "right":
            shape = MSO_SHAPE.RIGHT_ARROW
            w, h = Inches(0.5), Inches(0.3)
        else:
            shape = MSO_SHAPE.DOWN_ARROW
            w, h = Inches(0.3), Inches(0.4)
        r = slide.shapes.add_shape(shape, Inches(x), Inches(y), w, h)
        r.fill.solid()
        r.fill.fore_color.rgb = color
        r.line.fill.background()

    def slide_number(slide, num):
        """Add slide number"""
        tb = slide.shapes.add_textbox(Inches(12.4), Inches(7.0), Inches(0.7), Inches(0.3))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = f"{num:02d}"
        p.font.size = Pt(10)
        p.font.color.rgb = DIM
        p.font.name = MONO
        p.alignment = PP_ALIGN.RIGHT

    # ═══════════════════════════════════════════════════════════
    # SLIDE 1: TITLE
    # ═══════════════════════════════════════════════════════════
    s = prs.slides.add_slide(blank)
    bg_rect(s)
    
    # Large gradient accent bar at top
    bar = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, Inches(0.06))
    bar.fill.solid()
    bar.fill.fore_color.rgb = PRIMARY
    bar.line.fill.background()

    # Decorative circles
    for cx, cy, sz, clr in [(11.5, 1.0, 2.5, CARD), (12.0, 5.5, 1.8, CARD), (0.5, 6.0, 1.2, CARD)]:
        c = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(cx), Inches(cy), Inches(sz), Inches(sz))
        c.fill.solid()
        c.fill.fore_color.rgb = clr
        c.line.color.rgb = BORDER
        c.line.width = Pt(1)

    add_tag(s, 1.2, 1.8, "Blockchain Architecture · Smart Contracts · Information Security", CYAN)
    
    tb = s.shapes.add_textbox(Inches(1.2), Inches(2.4), Inches(9), Inches(1.5))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "DataLeak Ledger"
    p.font.size = Pt(48)
    p.font.bold = True
    p.font.color.rgb = WHITE
    p.font.name = FONT
    p2 = tf.add_paragraph()
    p2.text = "Blockchain Audit & Forensic Steganography Platform"
    p2.font.size = Pt(22)
    p2.font.color.rgb = MUTED
    p2.font.name = FONT

    accent_line(s, 1.2, 4.2, 3.0, PRIMARY)
    
    # Tech stack badges
    badges = ["Solidity 0.8.24", "Hardhat 2", "Ethers.js v6", "React 18", "Express.js", "TypeScript"]
    for i, badge_text in enumerate(badges):
        bx = 1.2 + i * 1.7
        r = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(bx), Inches(4.6), Inches(1.5), Inches(0.35))
        r.fill.solid()
        r.fill.fore_color.rgb = CARD
        r.line.color.rgb = BORDER
        r.line.width = Pt(0.75)
        tb = s.shapes.add_textbox(Inches(bx), Inches(4.62), Inches(1.5), Inches(0.35))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = badge_text
        p.font.size = Pt(9)
        p.font.color.rgb = CYAN
        p.font.name = MONO
        p.alignment = PP_ALIGN.CENTER

    add_subtitle(s, 1.2, 5.5, "Johaan Sam Sanil  ·  26 Automated Tests Passing  ·  Full-Stack Monorepo", 13, DIM, 10)
    slide_number(s, 1)

    # ═══════════════════════════════════════════════════════════
    # SLIDE 2: PROBLEM STATEMENT
    # ═══════════════════════════════════════════════════════════
    s = prs.slides.add_slide(blank)
    bg_rect(s)
    add_tag(s, 0.8, 0.5, "Problem Statement", ROSE)
    add_title(s, 0.8, 0.9, "The Dual Vulnerability in Document Security", 30)
    accent_line(s, 0.8, 1.65, 2.5, ROSE)

    add_card(s, 0.8, 2.1, 5.5, 4.5, "Vulnerability 1: Privileged Log Tampering", [
        "► Audit logs live in centralized SQL/NoSQL databases",
        "► A rogue DBA or root-access attacker can silently",
        "   ALTER or DELETE access records with zero trace",
        "► Logs can be backdated — no mathematical proof",
        "   of external integrity or non-repudiation",
        "",
        "► Result: 'Who accessed what & when' becomes",
        "   completely unreliable and legally worthless",
    ], ROSE)

    add_card(s, 6.8, 2.1, 5.5, 4.5, "Vulnerability 2: Untraceable Copy-Paste Leaks", [
        "► Visual watermarks (stamps, headers) disappear",
        "   completely when text is copy-pasted to clipboard",
        "► Servers issue identical document copies to all",
        "   authorized users — no per-user differentiation",
        "► When leaked text surfaces in emails or forums,",
        "   logs show WHO downloaded but CANNOT identify",
        "   WHICH specific copy was leaked",
        "",
        "► Result: No forensic attribution is possible",
    ], AMBER)
    slide_number(s, 2)

    # ═══════════════════════════════════════════════════════════
    # SLIDE 3: HIGH-LEVEL ARCHITECTURE
    # ═══════════════════════════════════════════════════════════
    s = prs.slides.add_slide(blank)
    bg_rect(s)
    add_tag(s, 0.8, 0.5, "System Architecture", CYAN)
    add_title(s, 0.8, 0.9, "Hybrid On-Chain / Off-Chain Design", 30)
    accent_line(s, 0.8, 1.65, 2.5, CYAN)

    # 4 architecture pillars
    pillars = [
        ("React 18 Frontend", CYAN, [
            "Dark cybersecurity UI with Tailwind CSS",
            "8 pages: Admin, Documents, Access Control,",
            "User Portal, Forensics, Blockchain Explorer,",
            "Audit Timeline, Login",
            "Real-time WebSocket event streaming",
            "Role-based route guards (admin vs user)",
        ]),
        ("Express.js Backend", EMERALD, [
            "REST API gateway with JWT authentication",
            "6 controller modules handling all business logic",
            "Atomic on-chain permission checks before",
            "streaming any file to clients",
            "Socket.IO for real-time blockchain events",
            "In-memory metadata store for quick lookups",
        ]),
        ("Smart Contract (Solidity)", PRIMARY, [
            "DataLeakLedger.sol — single source of truth",
            "Document registration with SHA-256 hashing",
            "Immutable version chaining (linked hash tree)",
            "On-chain access permissions (grant/revoke)",
            "Issuance commitment registry (Keccak-256)",
            "OpenZeppelin AccessControl RBAC",
        ]),
        ("Forensic Engine", VIOLET, [
            "CSPRNG 256-bit token generation (crypto.randomBytes)",
            "Keccak-256 commitment scheme (one-way hash)",
            "Zero-width Unicode steganographic encoder",
            "Multi-paragraph redundant marker embedding",
            "Extraction & decoder for leaked text analysis",
            "On-chain commitment lookup for attribution",
        ]),
    ]

    for i, (title, color, lines) in enumerate(pillars):
        col = 0.8 + i * 3.05
        add_card(s, col, 2.1, 2.85, 4.8, title, lines, color)
    
    slide_number(s, 3)

    # ═══════════════════════════════════════════════════════════
    # SLIDE 4: PROJECT STRUCTURE / MONOREPO
    # ═══════════════════════════════════════════════════════════
    s = prs.slides.add_slide(blank)
    bg_rect(s)
    add_tag(s, 0.8, 0.5, "Codebase Architecture", EMERALD)
    add_title(s, 0.8, 0.9, "Monorepo Structure & File Map", 30)
    accent_line(s, 0.8, 1.65, 2.5, EMERALD)

    # Left: directory tree
    tree_text = """blockchain/
├── contracts/
│   └── DataLeakLedger.sol        (371 lines)
├── test/
│   └── DataLeakLedger.test.ts    (20 contract tests)
├── scripts/
│   └── deploy.ts                 (deployment automation)
├── backend/src/
│   ├── blockchain/
│   │   ├── contractClient.ts     (228 lines)
│   │   └── eventListener.ts      (149 lines)
│   ├── controllers/
│   │   ├── documentController.ts (uploads & registration)
│   │   ├── downloadController.ts (watermarked delivery)
│   │   ├── forensicsController.ts(leak attribution)
│   │   ├── accessController.ts   (grant/revoke)
│   │   ├── authController.ts     (JWT login)
│   │   └── blockchainController.ts(explorer API)
│   ├── forensics/
│   │   ├── encoder.ts            (steganography codec)
│   │   └── token.ts              (CSPRNG + Keccak-256)
│   ├── watermark/
│   │   └── pdfGenerator.ts       (watermarked PDF output)
│   └── routes/ (6 route modules)
├── frontend/src/
│   ├── pages/ (8 page components)
│   ├── components/ (3 shared UI components)
│   ├── hooks/ (useAuth context)
│   └── layouts/ (AppLayout shell)
└── shared/types.ts (shared TypeScript interfaces)"""

    tb = s.shapes.add_textbox(Inches(0.8), Inches(2.1), Inches(6.5), Inches(5.0))
    tf = tb.text_frame
    tf.word_wrap = True
    for i, line in enumerate(tree_text.split("\n")):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        p.text = line
        p.font.size = Pt(9.5)
        p.font.color.rgb = LIGHT if not line.strip().startswith("(") else MUTED
        p.font.name = MONO
        p.space_after = Pt(1)

    # Right: key metrics
    add_card(s, 7.8, 2.1, 4.5, 2.0, "Key Metrics", [
        "► 371 lines of Solidity smart contract",
        "► 26 automated tests (20 contract + 6 forensic)",
        "► 6 REST controllers, 6 route modules",
        "► 8 frontend pages with dark cybersecurity theme",
        "► Socket.IO real-time blockchain event streaming",
    ], EMERALD)

    add_card(s, 7.8, 4.4, 4.5, 2.2, "Technology Stack", [
        "► Hardhat 2 + Solidity 0.8.24 + OpenZeppelin 5",
        "► ethers.js v6 (contract interaction)",
        "► Express.js + Socket.IO (backend)",
        "► React 18 + TypeScript + Tailwind CSS (frontend)",
        "► Vite (dev server & bundler)",
        "► Node.js crypto CSPRNG (token generation)",
    ], CYAN)
    slide_number(s, 4)

    # ═══════════════════════════════════════════════════════════
    # SLIDE 5: SMART CONTRACT DEEP-DIVE
    # ═══════════════════════════════════════════════════════════
    s = prs.slides.add_slide(blank)
    bg_rect(s)
    add_tag(s, 0.8, 0.5, "Smart Contract", PRIMARY)
    add_title(s, 0.8, 0.9, "DataLeakLedger.sol — On-Chain Logic", 30)
    accent_line(s, 0.8, 1.65, 2.5, PRIMARY)

    # Left: RBAC
    add_card(s, 0.8, 2.1, 3.7, 2.2, "Role-Based Access Control (RBAC)", [
        "► ADMIN_ROLE: Document registration, versioning,",
        "   and user access permission management",
        "► ISSUER_ROLE: Restricted to backend signing",
        "   service for recording issuance commitments",
        "► DEFAULT_ADMIN_ROLE: OpenZeppelin role admin",
        "► All roles enforced via onlyRole() modifier",
    ], PRIMARY)

    # Middle: Core Functions
    add_card(s, 4.8, 2.1, 3.7, 2.2, "Core Write Functions", [
        "► registerDocument(docId, contentHash)",
        "   Creates doc record + seals Version 1 hash",
        "► addVersion(docId, newContentHash)",
        "   Increments version, links previousHash chain",
        "► grantAccess / revokeAccess(docId, user)",
        "► recordIssuance(commitment, docId, ver, user)",
    ], CYAN)

    # Right: Data structures
    add_card(s, 8.8, 2.1, 3.7, 2.2, "On-Chain Data Structures", [
        "► DocumentRecord: id, admin, createdAt, version",
        "► DocumentVersion: contentHash, previousHash, ts",
        "► IssuanceRecord: commitment, docId, ver, user, ts",
        "► Mappings: _documents, _versions, _accessPerms,",
        "   _issuances + arrays for enumeration",
    ], EMERALD)

    # Bottom: Events & Errors
    add_card(s, 0.8, 4.6, 5.7, 2.4, "Events (Emitted On-Chain)", [
        "► FileRegistered(documentId, contentHash, admin, timestamp)",
        "► VersionAdded(documentId, version, contentHash, previousHash, admin, timestamp)",
        "► AccessGranted(documentId, user, admin, timestamp)",
        "► AccessRevoked(documentId, user, admin, timestamp)",
        "► IssuanceRecorded(issuanceCommitment, documentId, version, user, timestamp)",
        "",
        "Every event is indexed for efficient log filtering and real-time WebSocket streaming",
    ], VIOLET)

    add_card(s, 6.8, 4.6, 5.7, 2.4, "Custom Error Selectors (Gas-Optimized)", [
        "► InvalidIdentifier() / InvalidContentHash() / InvalidUserAddress()",
        "► DocumentAlreadyExists(bytes32) / DocumentNotFound(bytes32)",
        "► VersionNotFound(bytes32, uint256) / CommitmentAlreadyExists(bytes32)",
        "► AccessDenied(bytes32, address)",
        "",
        "Custom 4-byte selectors cost ~200 gas vs ~6000+ gas for revert strings",
        "Reducing transaction costs by ~97% on error paths",
    ], ROSE)
    slide_number(s, 5)

    # ═══════════════════════════════════════════════════════════
    # SLIDE 6: VERSION CHAINING & CANONICALIZATION
    # ═══════════════════════════════════════════════════════════
    s = prs.slides.add_slide(blank)
    bg_rect(s)
    add_tag(s, 0.8, 0.5, "Cryptographic Integrity", AMBER)
    add_title(s, 0.8, 0.9, "Deterministic Hashing & Immutable Version Chain", 30)
    accent_line(s, 0.8, 1.65, 2.5, AMBER)

    # Left: canonicalization
    add_card(s, 0.8, 2.1, 5.5, 2.6, "Deterministic Canonicalization Pipeline", [
        "1. Normalize line endings: \\r\\n and \\r → \\n",
        "2. Strip trailing whitespace per line",
        "3. Enforce UTF-8 encoding",
        "4. Compute SHA-256 hash of normalized content",
        "",
        "Eliminates cross-platform hash discrepancies",
        "(Windows CRLF vs Mac CR vs Linux LF)",
        "Avalanche effect: 1-bit change → completely different hash",
    ], AMBER)

    # Right: version chain diagram (text-based)
    add_card(s, 6.8, 2.1, 5.5, 2.6, "Immutable Version Chain (Linked Hash Tree)", [
        "Version 1:",
        "  contentHash = SHA256(v1_content)",
        "  previousHash = 0x0000...0000 (genesis)",
        "",
        "Version 2:",
        "  contentHash = SHA256(v2_content)",
        "  previousHash = SHA256(v1_content)  ← links back",
        "",
        "Version N: Each links to N-1, never overwritten",
    ], CYAN)

    # Bottom: why this matters
    add_card(s, 0.8, 5.0, 11.5, 2.0, "Why This Architecture Matters", [
        "► Any modification to a historical version breaks the forward hash chain — instantly detectable by any node",
        "► The contract stores only 32-byte SHA-256 hashes (not raw files) — ~45,000 gas fixed cost per registration vs ~640M gas for 1MB file storage",
        "► Version chain provides complete audit trail: every revision is permanently linked to its predecessor with cryptographic proof",
    ], PRIMARY)
    slide_number(s, 6)

    # ═══════════════════════════════════════════════════════════
    # SLIDE 7: COMMITMENT SCHEME (ZERO-KNOWLEDGE ATTRIBUTION)
    # ═══════════════════════════════════════════════════════════
    s = prs.slides.add_slide(blank)
    bg_rect(s)
    add_tag(s, 0.8, 0.5, "Cryptographic Commitment Scheme", VIOLET)
    add_title(s, 0.8, 0.9, "256-Bit CSPRNG Tokens & Keccak-256 Commitments", 30)
    accent_line(s, 0.8, 1.65, 2.5, VIOLET)

    # Step 1: Token generation
    add_card(s, 0.8, 2.1, 3.7, 3.0, "Step 1: Token Generation", [
        "Node.js crypto.randomBytes(32) generates",
        "a cryptographically secure 256-bit (32-byte)",
        "random token T for each document issuance",
        "",
        "CSPRNG guarantees:",
        "► Not predictable (unlike Math.random())",
        "► Unique per issuance event",
        "► 2²⁵⁶ possible values (astronomically large)",
        "",
        "token.ts → generateIssuanceToken()",
    ], CYAN)

    # Step 2: Commitment
    add_card(s, 4.8, 2.1, 3.7, 3.0, "Step 2: One-Way Commitment", [
        "C = Keccak-256(T)",
        "",
        "Only commitment C is submitted to the",
        "DataLeakLedger smart contract on-chain",
        "",
        "Properties:",
        "► Pre-image resistant: Cannot derive T from C",
        "► Collision resistant: No two tokens share C",
        "► Deterministic: Same T always yields same C",
        "",
        "token.ts → computeCommitment()",
    ], PRIMARY)

    # Step 3: Why this matters
    add_card(s, 8.8, 2.1, 3.7, 3.0, "Why Not Store Raw Tokens?", [
        "If raw tokens were stored on-chain or in DB:",
        "",
        "► A rogue admin could steal token T from",
        "   the database and plant it in fake leaks",
        "► Innocent users could be falsely framed",
        "",
        "By storing only C = Keccak-256(T):",
        "► Token T exists ONLY inside the issued",
        "   document copy held by the recipient",
        "► No one else can produce T from C",
    ], ROSE)

    # Bottom: flow
    add_card(s, 0.8, 5.4, 11.5, 1.6, "Complete Issuance Flow: token.ts → downloadController.ts → DataLeakLedger.sol", [
        "generateIssuanceToken() → { tokenHex, commitment }  →  recordIssuance(commitment, docId, version, user)  →  Mined TX receipt confirmed  →  embedWatermark(text, tokenHex)  →  Stream to user",
    ], EMERALD)
    slide_number(s, 7)

    # ═══════════════════════════════════════════════════════════
    # SLIDE 8: ZERO-WIDTH STEGANOGRAPHY
    # ═══════════════════════════════════════════════════════════
    s = prs.slides.add_slide(blank)
    bg_rect(s)
    add_tag(s, 0.8, 0.5, "Forensic Steganography", EMERALD)
    add_title(s, 0.8, 0.9, "Zero-Width Unicode Invisible Watermarking", 30)
    accent_line(s, 0.8, 1.65, 2.5, EMERALD)

    # Character mapping
    add_card(s, 0.8, 2.1, 5.5, 2.2, "Zero-Width Character Encoding (encoder.ts)", [
        "\\u200B  (Zero Width Space)        → Binary bit 0",
        "\\u200C  (Zero Width Non-Joiner)    → Binary bit 1",
        "\\uFEFF  (Byte Order Mark)          → START frame delimiter",
        "\\u2060  (Word Joiner)              → END frame delimiter",
        "",
        "Frame: START + 256 bits + END = 258 invisible characters",
    ], EMERALD)

    # Embedding strategy
    add_card(s, 6.8, 2.1, 5.5, 2.2, "Multi-Paragraph Redundancy", [
        "Marker frame is embedded at the END of EVERY",
        "paragraph in the document, not just once",
        "",
        "If a leaker copies only a single paragraph:",
        "  → Full 256-bit token is STILL 100% recoverable",
        "",
        "embedWatermark(text, tokenHex) in encoder.ts",
        "splits by paragraph breaks and appends marker to each",
    ], CYAN)

    # Encoding process detail
    add_card(s, 0.8, 4.6, 5.5, 2.5, "Encoding Process (encodeTokenToZeroWidth)", [
        "1. Strip '0x' prefix from 64-char hex token",
        "2. Convert to 32-byte Buffer",
        "3. For each byte, extract 8 bits (MSB first)",
        "4. Map each bit: 0 → \\u200B, 1 → \\u200C",
        "5. Wrap with \\uFEFF...\\u2060 delimiters",
        "6. Result: 258-char invisible Unicode string",
        "",
        "Completely invisible to human eyes in any viewer",
    ], VIOLET)

    # Decoding process
    add_card(s, 6.8, 4.6, 5.5, 2.5, "Extraction Process (extractMarkers)", [
        "1. Scan text for \\uFEFF START delimiter",
        "2. Find matching \\u2060 END delimiter",
        "3. Decode payload: \\u200B → 0, \\u200C → 1",
        "4. Validate: exactly 256 bits required",
        "5. Convert 256 bits → 32-byte hex token",
        "6. Handle: incomplete frames, malformed payloads,",
        "   duplicate markers (deduplication built-in)",
        "",
        "Returns: ExtractedMarker[] with validity status",
    ], AMBER)
    slide_number(s, 8)

    # ═══════════════════════════════════════════════════════════
    # SLIDE 9: DOWNLOAD PIPELINE (ATOMIC ENFORCEMENT)
    # ═══════════════════════════════════════════════════════════
    s = prs.slides.add_slide(blank)
    bg_rect(s)
    add_tag(s, 0.8, 0.5, "Atomic Enforcement Pipeline", PRIMARY)
    add_title(s, 0.8, 0.9, "Secure Watermarked Document Delivery", 30)
    accent_line(s, 0.8, 1.65, 2.5, PRIMARY)

    steps = [
        ("Step 1", "JWT Auth", CYAN, [
            "Authenticate user via JWT token",
            "Resolve Ethereum wallet address",
            "authController.ts validates session",
        ]),
        ("Step 2", "On-Chain Permission", EMERALD, [
            "Backend calls hasAccess(docId, user)",
            "Queries LIVE contract state on-chain",
            "If revoked → HTTP 403 Forbidden",
        ]),
        ("Step 3", "Token + Commitment", PRIMARY, [
            "crypto.randomBytes(32) → token T",
            "C = ethers.keccak256(T)",
            "generateIssuanceToken() in token.ts",
        ]),
        ("Step 4", "Blockchain TX", VIOLET, [
            "recordIssuance(C, docId, ver, user)",
            "Wait for mined receipt (status == 1)",
            "issuerContract sends signed TX",
        ]),
        ("Step 5", "Watermark & Deliver", AMBER, [
            "embedWatermark(content, tokenHex)",
            "Generate PDF or TXT with markers",
            "Stream with X-Issuance-Tx header",
        ]),
    ]

    for i, (label, title, color, lines) in enumerate(steps):
        x = 0.5 + i * 2.5
        # Step number circle
        c = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x + 0.05), Inches(2.2), Inches(0.5), Inches(0.5))
        c.fill.solid()
        c.fill.fore_color.rgb = color
        c.line.fill.background()
        tb = s.shapes.add_textbox(Inches(x + 0.05), Inches(2.22), Inches(0.5), Inches(0.5))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = str(i + 1)
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = WHITE
        p.font.name = FONT
        p.alignment = PP_ALIGN.CENTER

        add_card(s, x, 2.9, 2.3, 3.2, title, lines, color)

        # Arrow between steps
        if i < len(steps) - 1:
            add_flow_arrow(s, x + 2.35, 4.2, "right", DIM)

    # Bottom: the key insight
    add_card(s, 0.8, 6.3, 11.5, 0.9, "Key Security Guarantee: downloadController.ts", [
        "No file bytes leave the server until the blockchain transaction is CONFIRMED MINED — the commitment is permanently recorded BEFORE the watermarked document is streamed",
    ], ROSE)
    slide_number(s, 9)

    # ═══════════════════════════════════════════════════════════
    # SLIDE 10: FORENSIC ATTRIBUTION PIPELINE
    # ═══════════════════════════════════════════════════════════
    s = prs.slides.add_slide(blank)
    bg_rect(s)
    add_tag(s, 0.8, 0.5, "Forensic Attribution", ROSE)
    add_title(s, 0.8, 0.9, "Catching the Leaker — End-to-End Flow", 30)
    accent_line(s, 0.8, 1.65, 2.5, ROSE)

    forensic_steps = [
        ("1. Delimiter Scan", CYAN, [
            "forensicsController.ts receives",
            "suspect leaked text via POST API",
            "extractMarkers() scans for \\uFEFF",
            "(START) and \\u2060 (END) delimiters",
        ]),
        ("2. Bit Decode", EMERALD, [
            "Reconstructs 256 bits from payload:",
            "\\u200B → 0, \\u200C → 1",
            "Validates exactly 256 bits present",
            "Converts to 32-byte hex token T",
        ]),
        ("3. Hash Commitment", PRIMARY, [
            "computeCommitment(T) computes:",
            "C = ethers.keccak256(T)",
            "This is the same commitment that",
            "was stored on-chain during issuance",
        ]),
        ("4. Blockchain Lookup", VIOLET, [
            "blockchain.getIssuance(C) queries",
            "the DataLeakLedger smart contract",
            "Returns: documentId, version, user",
            "address, timestamp, and exists flag",
        ]),
    ]

    for i, (title, color, lines) in enumerate(forensic_steps):
        x = 0.8 + i * 3.05
        add_card(s, x, 2.1, 2.85, 3.0, title, lines, color)
        if i < len(forensic_steps) - 1:
            add_flow_arrow(s, x + 2.9, 3.3, "right", DIM)

    # Result card
    add_card(s, 0.8, 5.4, 11.5, 1.7, "5. Irrefutable Proof — IssuanceVerificationResult", [
        "► matched: true  ► commitment: 0x3a7f...  ► documentId: 0xab12...  ► documentTitle: 'Confidential Policy v3'",
        "► version: 2  ► userAddress: 0x3C44...93BC (Alice)  ► username: 'alice'  ► timestamp: 1698345600 (block timestamp)",
        "► Cryptographic commitment matched in DataLeakLedger on-chain registry — mathematically irrefutable attribution to the specific user's wallet address",
    ], ROSE)
    slide_number(s, 10)

    # ═══════════════════════════════════════════════════════════
    # SLIDE 11: REAL-TIME EVENTS & FRONTEND PAGES
    # ═══════════════════════════════════════════════════════════
    s = prs.slides.add_slide(blank)
    bg_rect(s)
    add_tag(s, 0.8, 0.5, "Frontend & Real-Time Events", CYAN)
    add_title(s, 0.8, 0.9, "React 18 UI & WebSocket Event Architecture", 30)
    accent_line(s, 0.8, 1.65, 2.5, CYAN)

    # Left: Pages
    pages = [
        ("LoginPage", "JWT auth with wallet address resolution"),
        ("AdminDashboardPage", "Overview metrics, recent activity, quick actions"),
        ("DocumentsPage", "Upload, register, SHA-256 hash, version management"),
        ("AccessControlPage", "Grant/revoke per-user permissions on-chain"),
        ("UserPortalPage", "User's accessible docs, download with watermark"),
        ("ForensicsPage", "Paste leaked text → extract → attribute to user"),
        ("BlockchainExplorerPage", "Inspect blocks, transactions, gas, receipts"),
        ("AuditTimelinePage", "Chronological event log from blockchain events"),
    ]

    add_card(s, 0.8, 2.1, 5.5, 5.0, "8 Frontend Pages (frontend/src/pages/)", 
        [f"► {name}: {desc}" for name, desc in pages], CYAN)

    # Right: Event system
    add_card(s, 6.8, 2.1, 5.5, 2.3, "Real-Time WebSocket Events (eventListener.ts)", [
        "► BlockchainEventListener class subscribes to all 5",
        "   contract events using ethers.js event filters",
        "► Socket.IO broadcasts to all connected frontends",
        "► Events: blockchain:event, document:registered,",
        "   version:added, access:granted, access:revoked,",
        "   access-revoked, issuance:recorded",
    ], EMERALD)

    add_card(s, 6.8, 4.7, 5.5, 2.4, "Frontend Architecture Patterns", [
        "► AuthProvider context (useAuth hook) manages",
        "   user state, JWT tokens, and role detection",
        "► ProtectedRoute component guards admin-only pages",
        "► AppLayout shell with responsive sidebar navigation",
        "► Shared UI components: Badge, Card, HashDisplay",
        "► Vite dev server with HMR for rapid development",
        "► Tailwind CSS dark mode theme throughout",
    ], VIOLET)
    slide_number(s, 11)

    # ═══════════════════════════════════════════════════════════
    # SLIDE 12: SCOPE, LIMITATIONS & DEFENSE
    # ═══════════════════════════════════════════════════════════
    s = prs.slides.add_slide(blank)
    bg_rect(s)
    add_tag(s, 0.8, 0.5, "Scope & Limitations", AMBER)
    add_title(s, 0.8, 0.9, "Security Guarantees, Known Limits & Testing", 30)
    accent_line(s, 0.8, 1.65, 2.5, AMBER)

    add_card(s, 0.8, 2.1, 3.7, 2.8, "What It Mathematically Guarantees", [
        "✓ Proves leaked text originated from a specific",
        "   copy issued to a specific wallet address",
        "✓ Tamper-proof audit trail: EVM blocks are",
        "   cryptographically linked via parentHash",
        "✓ Non-repudiation: ECDSA-signed transactions",
        "   mean signers cannot deny their actions",
        "✓ Commitment scheme prevents framing attacks",
    ], EMERALD)

    add_card(s, 4.8, 2.1, 3.7, 2.8, "Known Limitations (Analog Hole)", [
        "✗ Photographing screen bypasses zero-width chars",
        "✗ Manually re-typing text on keyboard removes",
        "   all embedded markers",
        "✗ Regex scripts filtering non-printable Unicode",
        "   can strip the watermark",
        "✗ Hardhat simulates single-node; production needs",
        "   QBFT consensus across independent auditors",
    ], ROSE)

    add_card(s, 8.8, 2.1, 3.7, 2.8, "Test Coverage (26 Tests)", [
        "Smart Contract (20 tests):",
        "► Document registration & duplicate rejection",
        "► Version chaining & previousHash validation",
        "► Access grant/revoke/check flows",
        "► Issuance commitments & duplicate rejection",
        "► All 8 custom error conditions tested",
        "",
        "Forensic Engine (6 tests):",
        "► Encode, embed, extract, decode, edge cases",
    ], CYAN)

    # Bottom: academic disclaimer
    add_card(s, 0.8, 5.2, 11.5, 2.0, "Academic Context & Production Considerations", [
        "► This is a complete working prototype deployed on Hardhat local network for academic demonstration purposes",
        "► Production deployment would require: QBFT consensus (e.g., Hyperledger Besu), proper key management (HSM), database persistence (PostgreSQL), IPFS for file storage",
        "► The core cryptographic guarantees (hash integrity, commitment scheme, steganographic encoding) are mathematically sound and production-applicable",
        "► All 26 automated tests pass — the system is verified against its specification",
    ], AMBER)
    slide_number(s, 12)

    # ─── Save ───
    out_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "DataLeak_Ledger_Architecture.pptx"
    )
    prs.save(out_path)
    print(f"✅ Presentation saved to: {out_path}")
    print(f"   Slides: {len(prs.slides)}")
    return out_path


if __name__ == "__main__":
    create_presentation()
