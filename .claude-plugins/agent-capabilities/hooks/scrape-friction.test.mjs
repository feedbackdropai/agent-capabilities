#!/usr/bin/env node
// Tests for scrape-friction.mjs marker extraction. No deps — run with:
//   node scrape-friction.test.mjs
// Exits non-zero on first failure.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { extractReportMarkers, extractLogMarkers } from "./scrape-friction.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const skillPath = join(here, "..", "skills", "fdrop:protocol:friction", "SKILL.md");

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ok - ${name}`);
}

// --- The regression that motivated the fix -------------------------------
test("the friction protocol skill itself yields zero markers", () => {
  const skill = readFileSync(skillPath, "utf8");
  assert.deepEqual(extractReportMarkers(skill), []);
});

test("example markers outside a ## Friction section are ignored", () => {
  const text = [
    "## Marker syntax",
    "FRICTION[plan]: plan referenced a path that no longer exists",
    "### Examples",
    "DECISION[plan]: inferred the target package from file paths",
  ].join("\n");
  assert.deepEqual(extractReportMarkers(text), []);
});

// --- A real agent report -------------------------------------------------
test("markers under a ## Friction heading are captured", () => {
  const report = [
    "# Implementation report",
    "Did the thing.",
    "## Friction",
    "FRICTION[plan]: plan named oldUtil.ts which no longer exists",
    "DECISION[config]: override was silent, defaulted to web",
  ].join("\n");
  const got = extractReportMarkers(report).map((m) => m.canonical);
  assert.deepEqual(got, [
    "FRICTION[plan]: plan named oldUtil.ts which no longer exists",
    "DECISION[config]: override was silent, defaulted to web",
  ]);
});

test("list- and quote-prefixed markers under the section are captured", () => {
  const report = ["## Friction", "- FRICTION[orchestrator]: spawned with no target", "> DECISION[plan]: guessed"].join("\n");
  const got = extractReportMarkers(report).map((m) => m.canonical);
  assert.deepEqual(got, ["FRICTION[orchestrator]: spawned with no target", "DECISION[plan]: guessed"]);
});

test("a later heading closes the Friction section", () => {
  const report = ["## Friction", "FRICTION[plan]: real one", "## Next steps", "FRICTION[plan]: should be ignored"].join("\n");
  const got = extractReportMarkers(report).map((m) => m.canonical);
  assert.deepEqual(got, ["FRICTION[plan]: real one"]);
});

test('"## Friction Protocol" heading does not open the section', () => {
  const text = ["# Friction Protocol", "FRICTION[plan]: not a real report marker"].join("\n");
  assert.deepEqual(extractReportMarkers(text), []);
});

// --- Dedup parse of the run file ----------------------------------------
test("extractLogMarkers parses the run-file line format for dedup", () => {
  const log = [
    "## Run: abc",
    "- [agent:feature-executor] FRICTION[plan]: real one",
    "- DECISION[config]: defaulted to web",
  ].join("\n");
  const got = extractLogMarkers(log).map((m) => m.canonical);
  assert.deepEqual(got, ["FRICTION[plan]: real one", "DECISION[config]: defaulted to web"]);
});

console.log(`\n${passed} passed`);
