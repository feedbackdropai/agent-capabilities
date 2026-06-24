#!/usr/bin/env node
// Friction-protocol capture hook (see skills/fdrop:protocol:friction).
//
// Fires on SubagentStop (per subagent) and Stop (per turn, backstop). Reads the
// main session transcript, extracts FRICTION[...]/DECISION[...] markers that
// agents emit in their final reports, and appends any not-yet-recorded ones to
// .fdrop/runs/<session-id>.md. Idempotent: re-runs dedup against the existing
// file, so the frequent Stop firings are harmless. Never blocks the agent —
// any error is swallowed and the process exits 0.

import { readFileSync, existsSync, mkdirSync, appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// A marker line: optional list/quote prefix, then FRICTION[target]: note (line-anchored).
const LINE_MARKER = /^[ \t]*(?:[-*>][ \t]+)?(FRICTION|DECISION)\[([^\]]+)\]:[ \t]*(.+)$/;
// Loose form — matches a marker anywhere in a line. Used only to re-parse the
// run file (whose lines look like "- [agent] FRICTION[...]: ...") for dedup.
const LOOSE_MARKER = /(FRICTION|DECISION)\[([^\]]+)\]:[ \t]*(.+)$/;
// A markdown heading whose title is exactly "Friction" (the section the
// friction protocol mandates). Not "Friction Protocol", not inline mentions.
const FRICTION_HEADING = /^[ \t]{0,3}#{1,6}[ \t]+Friction[ \t]*$/i;
// Any markdown heading — ends the current section.
const ANY_HEADING = /^[ \t]{0,3}#{1,6}[ \t]+/;

/** Read all of stdin as a string. */
function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

/** Recursively collect every string value in a parsed JSON object. */
function collectStrings(node, out) {
  if (typeof node === "string") {
    out.push(node);
  } else if (Array.isArray(node)) {
    for (const item of node) collectStrings(item, out);
  } else if (node && typeof node === "object") {
    for (const value of Object.values(node)) collectStrings(value, out);
  }
}

function toMarker(m) {
  const type = m[1];
  const target = m[2].trim();
  const note = m[3].trim();
  if (!note) return null;
  return { type, target, note, canonical: `${type}[${target}]: ${note}` };
}

/**
 * Extract markers an agent emitted in its report. Markers count ONLY when they
 * sit under a `## Friction` heading (per the friction protocol's placement
 * rule). This deliberately ignores the protocol skill's own example markers and
 * any agent-def references, which the transcript carries verbatim but which live
 * under other headings — they must not be scraped as real friction.
 */
function extractReportMarkers(text) {
  const found = [];
  let inSection = false;
  for (const rawLine of text.split("\n")) {
    if (ANY_HEADING.test(rawLine)) {
      inSection = FRICTION_HEADING.test(rawLine);
      continue;
    }
    if (!inSection) continue;
    const m = LINE_MARKER.exec(rawLine);
    if (m) {
      const marker = toMarker(m);
      if (marker) found.push(marker);
    }
  }
  return found;
}

/** Re-parse the existing run file (a flat list of marker lines) for dedup. */
function extractLogMarkers(text) {
  const found = [];
  for (const rawLine of text.split("\n")) {
    const m = LOOSE_MARKER.exec(rawLine);
    if (m) {
      const marker = toMarker(m);
      if (marker) found.push(marker);
    }
  }
  return found;
}

function main() {
  const input = readStdin();
  if (!input.trim()) return;

  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    return;
  }

  const { session_id, transcript_path, cwd, agent_type } = payload;
  if (!session_id || !transcript_path || !existsSync(transcript_path)) return;

  // Pull every marker out of every string in the transcript.
  const transcript = readFileSync(transcript_path, "utf8");
  const markers = [];
  for (const line of transcript.split("\n")) {
    if (!line.trim()) continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    const strings = [];
    collectStrings(obj, strings);
    for (const s of strings) markers.push(...extractReportMarkers(s));
  }
  if (markers.length === 0) return;

  // Prepare the per-run log file.
  const baseDir = cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const runsDir = join(baseDir, ".fdrop", "runs");
  const safeSession = String(session_id).replace(/[^A-Za-z0-9._-]/g, "_");
  const runFile = join(runsDir, `${safeSession}.md`);

  // Dedup against markers already written.
  let existing = "";
  if (existsSync(runFile)) existing = readFileSync(runFile, "utf8");
  const seen = new Set(extractLogMarkers(existing).map((m) => m.canonical));

  const fresh = [];
  for (const m of markers) {
    if (seen.has(m.canonical)) continue;
    seen.add(m.canonical);
    fresh.push(m);
  }
  if (fresh.length === 0) return;

  mkdirSync(runsDir, { recursive: true });
  if (!existing) {
    writeFileSync(runFile, `## Run: ${safeSession}\n\nStarted ${new Date().toISOString()}\n\n`);
  }

  const who = agent_type ? `[${agent_type}] ` : "";
  const lines = fresh.map((m) => `- ${who}${m.canonical}`).join("\n") + "\n";
  appendFileSync(runFile, lines);
}

// Run only when invoked directly as a hook — importing for tests must not fire main().
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  try {
    main();
  } catch {
    // Never block the agent on a logging failure.
  }
  process.exit(0);
}

export { extractReportMarkers, extractLogMarkers, collectStrings };
