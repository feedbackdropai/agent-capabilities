# Refactor Plan — Analysis Method, Severity, and Output Format

This document defines how to analyze the target code and how to present the result. The calling SKILL.md handles input modes and Required Reading; this file owns the deliverable.

## Analysis Method

For each target file:

1. Read the file in full — never analyze from a summary or a diff hunk alone.
2. Compare what you observe against every loaded standards doc (architecture, style guide, documentation, React thresholds).
3. Record each deviation as a candidate suggestion with: the file and line(s), the rule it violates (cite the doc), what is wrong, and the concrete change to make.
4. Analyze each file directly — do not delegate analysis to sub-agents or summarizers.

Only report deviations from a loaded standard or a clear correctness/maintainability defect. Do not invent stylistic preferences that no loaded doc supports.

## Empty Input

If no target files are found — an empty/non-existent folder in Mode 1, or a clean working tree (no diff) in Mode 2 — do not fabricate suggestions. Report `No files to analyze.` and stop.

## Severity Classification

| Severity | Meaning |
| --- | --- |
| **Critical** | Correctness bug, data loss, or security issue introduced or present in the code. |
| **Major** | Clear violation of an architecture or structure rule (wrong file placement, broken module boundary, banned `any`/`as`, missing barrel export) or a size threshold breach requiring extraction. |
| **Minor** | Style, naming, casing, doc-comment, or import-ordering deviation that does not affect behavior. |

## Output Format

Produce a single Markdown report with this structure:

```
## Refactor Plan: <target>

| # | Severity | File:Line | Issue | Suggested Change | Rule |
|---|----------|-----------|-------|------------------|------|
| 1 | Major    | src/foo.ts:42 | `as` assertion bypasses narrowing | Replace with a type guard | typescript/type-assertions.md |
| 2 | Minor    | src/foo.ts:8  | camelCase file name | Rename to kebab-case | conventions/file-naming.md |

### Verdict: <one of the verdict values below>

<one-paragraph rationale referencing the highest-severity findings>
```

Order rows by severity (Critical → Major → Minor), then by file. Every row must cite the specific rule doc in the `Rule` column. If there are no findings, output the heading, `No refactor suggestions — code complies with all loaded standards.`, and the `Ship as-is` verdict.

## Verdict

Choose exactly one based on the highest-severity finding:

| Verdict | When |
| --- | --- |
| **Ship as-is** | No findings, or only Minor findings the author may safely defer. |
| **Refactor recommended** | One or more Major findings; the code works but violates standards. |
| **Block — fix required** | Any Critical finding. |
