# A3LAM | PHASE 02 — EXTERNAL VERIFICATION CHECKLIST

**Current status:** **PHASE 02 — CONDITIONALLY CLOSED / PENDING EXTERNAL VERIFICATION**  
**Scope:** External verification only. Do not modify implementation code or begin Phase 03.

All items below are currently:

> **PENDING EXTERNAL VERIFICATION**

## 1. GitHub Actions Execution

**Test objective:** Confirm that the repository CI workflow executes successfully against the committed project and enforces the required reproducibility checks.

**Exact environment/tool required:** GitHub Actions on the repository’s configured runner using `actions/checkout@v4`, `pnpm/action-setup@v4` with pnpm `11.21.0`, and `actions/setup-node@v4` with Node.js `22.13.0`.

**Exact route or component to test:** `.github/workflows/ci.yml` on a test push or pull request.

**Expected result:** The workflow completes successfully with `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`; no secret appears in logs and the lockfile is not modified.

**Status:** **PENDING EXTERNAL VERIFICATION**  
**PASS/FAIL evidence:** `____________________________________________`  
**Reviewer/date:** `____________________________________________`

## 2. Chromium Verification

**Test objective:** Verify the foundation route’s RTL rendering, semantic structure, keyboard focus, accessible names, responsive layout, mixed Arabic/Latin text, loading state, error state, and reduced-motion behavior in Chromium.

**Exact environment/tool required:** Current stable Chromium or Chrome, with keyboard-only navigation and browser developer tools available.

**Exact route or component to test:** `/`, `/api/health`, `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`, and `components/foundation/Primitives.tsx` as rendered by the foundation route.

**Expected result:** `lang="ar"` and `dir="rtl"` are correct; heading hierarchy is valid; buttons and links have accessible names and correct semantics; focus is visible; no overflow or RTL ordering defect appears; `/api/health` returns a safe `status: "ok"` response; reduced-motion behavior is respected.

**Status:** **PENDING EXTERNAL VERIFICATION**  
**PASS/FAIL evidence:** `____________________________________________`  
**Reviewer/date:** `____________________________________________`

## 3. Firefox Verification

**Test objective:** Confirm that the same foundation behavior and accessibility baseline remain consistent in Firefox.

**Exact environment/tool required:** Current stable Firefox on a desktop operating system, with keyboard-only navigation and developer tools available.

**Exact route or component to test:** `/`, `/api/health`, `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`, and `components/foundation/Primitives.tsx`.

**Expected result:** The page renders without layout, font, direction, focus, semantic, or interaction regressions; the health response remains safe and successful; no browser-specific console error prevents the foundation from functioning.

**Status:** **PENDING EXTERNAL VERIFICATION**  
**PASS/FAIL evidence:** `____________________________________________`  
**Reviewer/date:** `____________________________________________`

## 4. Safari/WebKit Verification

**Test objective:** Verify RTL layout, typography, focus behavior, mixed-script rendering, reduced-motion handling, and responsive foundation behavior in WebKit.

**Exact environment/tool required:** Current stable Safari on macOS or an approved Safari/WebKit test environment with keyboard navigation available.

**Exact route or component to test:** `/`, `app/globals.css`, `app/layout.tsx`, `app/loading.tsx`, `app/error.tsx`, and `components/foundation/Primitives.tsx`.

**Expected result:** Arabic direction and logical CSS properties behave correctly; font fallback and mixed Arabic/Latin text remain readable; focus is visible; no Safari/WebKit-specific rendering or interaction defect appears.

**Status:** **PENDING EXTERNAL VERIFICATION**  
**PASS/FAIL evidence:** `____________________________________________`  
**Reviewer/date:** `____________________________________________`

## 5. Mobile Viewport Verification

**Test objective:** Verify mobile-first layout, RTL ordering, text wrapping, focus visibility, touch target usability, and absence of horizontal overflow at both required mobile sizes.

**Exact environment/tool required:** Chromium device emulation or a real mobile device at **390 × 844** and **393 × 852**. Use touch and keyboard/accessibility inspection where the device supports it.

**Exact route or component to test:** `/`, especially the header, hero, action row, neutral sample cards, semantic token list, and footer.

**Expected result:** The foundation route remains readable and usable at both viewports; no content is clipped or horizontally overflowing; Arabic and mixed-script content wrap correctly; focus and controls remain visible and reachable.

**Status:** **PENDING EXTERNAL VERIFICATION**  
**PASS/FAIL evidence:** `390 × 844: ____________________   393 × 852: ____________________`  
**Reviewer/date:** `____________________________________________`

## 6. Tablet Viewport Verification

**Test objective:** Verify responsive transition and layout stability at the required tablet size.

**Exact environment/tool required:** Chromium or an approved tablet device at **768 × 1024**.

**Exact route or component to test:** `/`, including the responsive hero grid, sample-card grid, token panel, primitives, and footer.

**Expected result:** The two-column hero and three-card sample layout transition without overlap or overflow; RTL direction remains correct; typography and controls remain accessible and visually stable.

**Status:** **PENDING EXTERNAL VERIFICATION**  
**PASS/FAIL evidence:** `____________________________________________`  
**Reviewer/date:** `____________________________________________`

## 7. Screen-Reader Verification

**Test objective:** Verify reading order, landmark discovery, heading navigation, accessible names, control semantics, live status behavior, loading announcement, and error announcement in Arabic RTL.

**Exact environment/tool required:** A real screen reader such as VoiceOver on macOS/iOS, NVDA on Windows, or TalkBack on Android, paired with a supported browser/device.

**Exact route or component to test:** `/`, `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`, and the interactive primitives in `components/foundation/Primitives.tsx`.

**Expected result:** The screen reader announces the page in logical RTL order; landmarks and headings are discoverable; the status chip and alert/error content are announced appropriately; buttons and links are named and distinguishable; no hidden or duplicated content causes confusion.

**Status:** **PENDING EXTERNAL VERIFICATION**  
**PASS/FAIL evidence:** `____________________________________________`  
**Reviewer/date:** `____________________________________________`

## 8. Measured WCAG 2.2 AA Contrast Evidence

**Test objective:** Produce measured contrast evidence for text, backgrounds, controls, borders where applicable, visible focus indicators, and interactive states used by the foundation tokens.

**Exact environment/tool required:** An approved contrast analyzer such as axe DevTools, Accessibility Insights, Lighthouse, or Colour Contrast Analyser, using the rendered page rather than source colors alone.

**Exact route or component to test:** `/`, with focus, hover, active, default, muted, surface, brand, accent, danger, and error states represented by `app/globals.css` and the foundation primitives.

**Expected result:** All applicable normal text, large text, controls, focus indicators, and state combinations meet the project’s WCAG 2.2 AA foundation target, with a saved report or screenshots showing the measured values.

**Status:** **PENDING EXTERNAL VERIFICATION**  
**PASS/FAIL evidence:** `Tool/report URL or file: ______________________________`  
**Reviewer/date:** `____________________________________________`

## 9. Typography / Font Licensing and Cross-Browser Verification

**Test objective:** Verify that the selected Arabic and Latin fonts load as intended, render consistently across supported browsers, preserve readable Arabic shaping and mixed-script behavior, and have an approved licensing record for the intended use.

**Exact environment/tool required:** Chromium, Firefox, Safari/WebKit, and the approved mobile/tablet environments; network panel or equivalent font-loading inspection; and a documented license/source review for IBM Plex Sans Arabic and IBM Plex Sans or their approved fallback strategy.

**Exact route or component to test:** `/`, `app/globals.css`, and the typography tokens `--font-arabic` and `--font-latin`.

**Expected result:** Font requests and fallbacks behave deterministically; Arabic glyph shaping, weights, line height, punctuation, numerals, and mixed Arabic/Latin content remain correct across environments; no unacceptable layout shift or licensing uncertainty remains.

**Status:** **PENDING EXTERNAL VERIFICATION**  
**PASS/FAIL evidence:** `License/source record and cross-browser evidence: ____________________`  
**Reviewer/date:** `____________________________________________`
