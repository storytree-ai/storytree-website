// Chapter 1's handoff as a first-time visitor meets it (ADR-0879 D1), from the locally built site, at 1440×900 and 390×844:
// its finale, then the turn onto the map.
// pnpm --filter @storytree/website build && node testing/journey/capture.mjs [--check]
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { capturePath } from "../../testing/capture-path.mjs";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, "../../dist");
// --check asserts without rewriting the committed pictures: they go to a fresh temporary folder instead (named at the end).
// Pictures go to the package's evidence set of this name (a scratch folder with --check); nothing here reads them.
const evidence = path.join(here, "../../evidence", "journey");
const pictures = process.argv.includes("--check") ? await mkdtemp(path.join(tmpdir(), "journey-check-")) : evidence;
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".json": "application/json", ".svg": "image/svg+xml" };
const server = createServer(async (req, res) => {
  const { file, status } = capturePath(dist, req.url);
  if (status) { res.writeHead(status).end(); return; }
  try { res.setHeader("Content-Type", types[path.extname(file)] ?? "application/octet-stream"); res.end(await readFile(file)); }
  catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"] });
const errors = [], written = [];

const shot = async (page, tag, name) => { const file = `${tag}-${name}.png`; await page.screenshot({ path: path.join(pictures, file) }); written.push(file); };

/** A first-time visitor: chapter 1 to its finale, then the turn onto the map. */
async function handoff(page, tag) {
  await page.locator("#opening-run").click();
  await page.locator("#opening-better").waitFor({ state: "visible", timeout: 90_000 });
  await shot(page, tag, "0a-finale");
  await page.locator("#opening-better").click();
  await page.waitForTimeout(1000); await shot(page, tag, "0b-turn");
}

try {
  for (const [tag, viewport] of [["1440", { width: 1440, height: 900 }], ["390", { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(url);
    try { await handoff(page, tag); console.log("captured", tag, "handoff"); } finally { await page.close(); }
  }
  assert.deepEqual(errors, [], "the browser reports no errors");
  // A picture this record no longer takes is stale: it goes.
  if (pictures === evidence) for (const name of await readdir(evidence)) if (name.endsWith(".png") && !written.includes(name)) await rm(path.join(evidence, name));
  if (pictures !== evidence) console.log(`--check: ${written.length} pictures in ${pictures}, nothing committed was written`);
} finally { await browser.close(); server.close(); }
