#!/usr/bin/env node
// Drives the Jekyll dev server with headless Chromium: navigate, wait, screenshot, report console errors.
// Usage:
//   node driver.mjs --path "/#deadlock" --selector "#deadlock" --out shot.png [--width 1440] [--height 1000] [--base http://localhost:4000]
import { chromium } from 'playwright';

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? def : process.argv[i + 1];
}

const base = arg('base', 'http://localhost:4000');
const path = arg('path', '/');
const selector = arg('selector', null);
const out = arg('out', 'screenshot.png');
const width = parseInt(arg('width', '1440'), 10);
const height = parseInt(arg('height', '1000'), 10);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto(base + path, { waitUntil: 'networkidle' });

if (selector) {
  await page.waitForSelector(selector);
  const el = await page.$(selector);
  await el.screenshot({ path: out });
} else {
  await page.screenshot({ path: out, fullPage: true });
}

await browser.close();

if (errors.length) {
  console.error('Console errors:');
  for (const e of errors) console.error(' -', e);
  process.exitCode = 1;
} else {
  console.log(`Screenshot saved to ${out}, no console errors.`);
}
