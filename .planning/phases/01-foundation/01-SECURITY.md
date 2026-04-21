---
phase: "01"
slug: foundation
status: verified
threats_open: 0
asvs_level: L1
created: 2026-04-21
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| User input → CodeMirror buffer | User pastes/types arbitrary text into the editor. CodeMirror treats it as a string and renders it syntactically. | Untrusted string (low sensitivity — no PII, no secrets) |
| User input → React render tree (TreeNode JSX) | Tree view renders JSON string values as text via JSX text interpolation. React auto-escapes all characters. | Untrusted string values rendered as read-only text |
| Local file → editor buffer | `<input type="file">` reads an arbitrary user-selected text file. Content is untrusted; placed in editor buffer only. | Untrusted file contents (string) |
| Editor buffer → system clipboard | User-initiated copy action writes editor content to the OS clipboard. | Arbitrary string (user-owned) |
| Editor buffer → jsonrepair parser | Untrusted string is parsed and reconstructed by `jsonrepair`. | Untrusted JSON string |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-01-01 | Tampering | CodeMirrorEditor — rendering untrusted JSON text | mitigate | No `eval`, `Function`, `innerHTML`, or `dangerouslySetInnerHTML` in any file. CodeMirror renders content as editor text via `value` prop. JSX escapes all React-rendered text nodes. Evidence: `src/components/CodeMirrorEditor.tsx:1-51` | closed |
| T-01-02 | Tampering | jsonParseLinter — parsing untrusted JSON during lint | accept | `JSON.parse` (used internally by `jsonParseLinter`) is safe against prototype pollution — does not assign `__proto__` and does not execute code. | closed |
| T-01-03 | Information Disclosure | Clipboard API (reserved for Plan 02) | transfer | Not in scope for Plan 01 — deferred to Plan 02 where the Copy button is implemented. Resolved as T-02-03/T-02-04. | closed |
| T-01-04 | DoS | CodeMirror with very large pasted JSON | accept | CodeMirror 6 uses built-in line virtualization; documents up to tens of MB render without freezing. Tree view 2 MB gate lands in Plan 03 (T-03-03). | closed |
| T-01-05 | Spoofing | Dependency supply chain | accept | All packages installed at pinned versions verified on npm registry 2026-04-21. `package-lock.json` committed in Plan 01 freezes transitive versions. ASVS L1 does not require SBOM generation. | closed |
| T-02-01 | Tampering | FileReader loading arbitrary local file | accept | `reader.readAsText(file)` produces a string placed in the editor buffer; never executed. Binary files render as garbage but cannot execute. | closed |
| T-02-02 | Tampering | `jsonrepair()` on malformed input | accept | `jsonrepair` is a string transformer — it does not execute code. Library pinned at 3.14.0; no known CVEs. On failure, caught exception surfaces a benign error message. | closed |
| T-02-03 | Information Disclosure | Clipboard write via `writeToClipboard` | mitigate | `writeToClipboard` called only from `handleCopy()`, bound exclusively to the Copy button `onClick`. No timer or programmatic call path. Primary API (`navigator.clipboard.writeText`) requires secure context + user gesture. Evidence: `src/components/Toolbar.tsx:174,238` and `src/lib/clipboard.ts:9` | closed |
| T-02-04 | Information Disclosure | Clipboard read | not applicable | No `navigator.clipboard.readText`, no `paste` event listener, no clipboard read of any kind exists in the codebase. | closed |
| T-02-05 | DoS | Very large file load (e.g., 500 MB) | accept | Main-thread `FileReader.readAsText` may block UI on extreme sizes. Target: typical developer files (<50 MB). Tree view 2 MB gate in Plan 03. ASVS L1 does not require file-size validation for a local developer tool. | closed |
| T-02-06 | Tampering | `document.execCommand('copy')` fallback | accept | API is deprecated but still supported across all target browsers in 2026. No security risk — just potential future removal. Fallback only activates when `navigator.clipboard` is unavailable. | closed |
| T-02-07 | Spoofing | `accept` attribute on file input is advisory | accept | The file picker's `accept=".json,application/json,text/plain"` is a convenience filter only. Browsers allow users to override it. Non-JSON content surfaces as lint errors in CodeMirror, not crashes. | closed |
| T-03-01 | Tampering | `JSON.parse` on untrusted editor content (TreeView) | accept | `JSON.parse` is the W3C standard parser; no code execution, no prototype-pollution surface when reading values via `Object.entries` and index access. | closed |
| T-03-02 | Tampering | Rendering string values via JSX `{JSON.stringify(value)}` | mitigate | JSX text interpolation HTML-escapes all characters (`<`, `>`, `&`, quotes). `JSON.stringify` converts embedded HTML-like strings to quoted JSON text. No `dangerouslySetInnerHTML` anywhere. Evidence: `src/components/TreeNode.tsx:47` | closed |
| T-03-03 | DoS | Deeply nested JSON (>1000 levels) triggering stack overflow | mitigate | 2 MB size gate applied before `JSON.parse` (`SIZE_GATE_BYTES = 2_000_000`). Initial auto-expand limited to `depth < 2` — deeper nodes collapsed by default. Evidence: `src/components/TreeView.tsx:9,19` and `src/components/TreeNode.tsx:21` | closed |
| T-03-04 | DoS | Wide JSON arrays (>100k items) rendering on expand | accept | Collapsed-by-default for depth ≥ 2 — user must click to expand. A 100k-item array at depth 2+ is user-initiated. ASVS L1 does not require throttling for local developer tools. Windowing deferred to v2. | closed |
| T-03-05 | Information Disclosure | Prototype-chain leak via `Object.entries` | mitigate | `Object.entries` returns only own enumerable properties by ECMAScript spec — inherited prototype chain keys are excluded by definition. Evidence: `src/components/TreeNode.tsx:54` | closed |
| T-03-06 | Tampering | `Object.entries` on array producing wrong key types | mitigate | `Array.isArray(value)` checked first; arrays use `value.map((v, i) => [i, v])` for numeric index iteration. `Object.entries` only reached for confirmed non-array objects. Evidence: `src/components/TreeNode.tsx:23,52-54` | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party) · not applicable*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01-01 | T-01-02 | JSON.parse prototype-pollution is a non-issue per ECMAScript spec and confirmed by RESEARCH.md security domain analysis | gsd-security-auditor | 2026-04-21 |
| AR-01-02 | T-01-04 | CodeMirror 6 has built-in virtualization; no practical main-thread freeze for typical JSON sizes | gsd-security-auditor | 2026-04-21 |
| AR-01-03 | T-01-05 | Package versions pinned at verified npm hashes; lockfile committed; ASVS L1 does not require SBOM | gsd-security-auditor | 2026-04-21 |
| AR-02-01 | T-02-01 | FileReader produces a string only — no execution path exists regardless of file content | gsd-security-auditor | 2026-04-21 |
| AR-02-02 | T-02-02 | jsonrepair@3.14.0 is a string transformer with no eval surface; no known CVEs at audit date | gsd-security-auditor | 2026-04-21 |
| AR-02-03 | T-02-05 | Local developer tool; 50 MB practical limit; ASVS L1 does not require file-size gate here | gsd-security-auditor | 2026-04-21 |
| AR-02-04 | T-02-06 | execCommand is deprecated, not removed; clipboard-copy fallback has no security implications | gsd-security-auditor | 2026-04-21 |
| AR-02-05 | T-02-07 | Accept attribute is UI convenience only; non-JSON files surface as lint errors, not vulnerabilities | gsd-security-auditor | 2026-04-21 |
| AR-03-01 | T-03-01 | JSON.parse is a standard parser with no code-execution surface | gsd-security-auditor | 2026-04-21 |
| AR-03-02 | T-03-04 | Wide arrays are user-initiated (depth ≥ 2 collapsed by default); windowing is a v2 concern | gsd-security-auditor | 2026-04-21 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-21 | 18 | 18 | 0 | gsd-security-auditor (agent) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer / not applicable)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-21
