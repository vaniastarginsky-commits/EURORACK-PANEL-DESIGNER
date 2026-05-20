#!/usr/bin/env node

import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error("Missing dependency: playwright");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, "design-review/after");
const BASE_URL = process.env.BASE_URL || "http://localhost:4173/";
const LOCAL_REACT = "/Users/weedhash/Desktop/PANEL+SITE/vendor/react.production.min.js";
const LOCAL_REACT_DOM = "/Users/weedhash/Desktop/PANEL+SITE/vendor/react-dom.production.min.js";

const MOBILE_VIEWPORTS = [
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "mobile-412x915", width: 412, height: 915 },
];

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const viewport of MOBILE_VIEWPORTS) {
    results.push(await captureSelectedComponent(viewport));
  }
  results.push(await captureGridSnapCheck());
} finally {
  await browser.close();
}

const report = {
  baseUrl: BASE_URL,
  capturedAt: new Date().toISOString(),
  results,
};

await writeFile(
  path.join(OUT_DIR, "mobile-selected-fix-results.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

console.log(`Captured ${results.length} mobile selected/grid checks in ${OUT_DIR}`);
for (const result of results) {
  if (result.issues.length) {
    console.log(`- ${result.name}: ${result.issues.join("; ")}`);
  }
}

async function captureSelectedComponent(viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const diagnostics = attachDiagnostics(page);
  await installLocalReactRoutes(page);

  try {
    await gotoReady(page, `${BASE_URL}?selected-fix=${Date.now()}`, diagnostics, `debug-${viewport.name}`);
    await addAndSelectPot(page, viewport);

    const basename = `${viewport.name}--mobile-selected-component`;
    await page.screenshot({
      path: path.join(OUT_DIR, `${basename}.png`),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(OUT_DIR, `${basename}-top.png`),
      clip: { x: 0, y: 0, width: viewport.width, height: 180 },
    });
    await page.screenshot({
      path: path.join(OUT_DIR, `${basename}-bottom.png`),
      clip: { x: 0, y: viewport.height - 180, width: viewport.width, height: 180 },
    });

    const metrics = await collectMobileSelectedMetrics(page);
    return {
      name: basename,
      viewport: viewport.name,
      files: [`${basename}.png`, `${basename}-top.png`, `${basename}-bottom.png`],
      metrics,
      issues: metricsToIssues(metrics),
    };
  } finally {
    await context.close();
  }
}

async function captureGridSnapCheck() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const diagnostics = attachDiagnostics(page);
  await installLocalReactRoutes(page);

  try {
    await gotoReady(page, `${BASE_URL}?grid-snap=${Date.now()}`, diagnostics, "debug-grid-snap");

    const before = await gridSnapState(page);
    await page.locator('.mobile-toolbar-quick[title="Toggle grid visibility"]').click();
    const afterGrid = await gridSnapState(page);
    await page.getByRole("button", { name: /Snap/i }).click();
    await page.locator(".toolbar-popover").waitFor({ state: "visible" });
    const afterSnap = await gridSnapState(page);

    const basename = "mobile-390x844--grid-snap-separated";
    await page.screenshot({
      path: path.join(OUT_DIR, `${basename}.png`),
      fullPage: false,
    });

    const issues = [];
    if (afterGrid.hasPopover) issues.push("Grid opened a popover");
    if (!afterSnap.hasPopover) issues.push("Snap did not open the grid/snap popover");

    return {
      name: basename,
      viewport: "mobile-390x844",
      files: [`${basename}.png`],
      metrics: { before, afterGrid, afterSnap },
      issues,
    };
  } finally {
    await context.close();
  }
}

async function installLocalReactRoutes(page) {
  const react = await readFile(LOCAL_REACT, "utf8");
  const reactDom = await readFile(LOCAL_REACT_DOM, "utf8");
  await page.route(/https:\/\/unpkg\.com\/react@.*\/umd\/react\.production\.min\.js/, route => {
    route.fulfill({ status: 200, contentType: "application/javascript", body: react });
  });
  await page.route(/https:\/\/unpkg\.com\/react-dom@.*\/umd\/react-dom\.production\.min\.js/, route => {
    route.fulfill({ status: 200, contentType: "application/javascript", body: reactDom });
  });
}

function attachDiagnostics(page) {
  const diagnostics = { console: [], pageErrors: [] };
  page.on("console", message => {
    diagnostics.console.push(`${message.type()}: ${message.text()}`.slice(0, 500));
  });
  page.on("pageerror", error => {
    diagnostics.pageErrors.push(String(error?.stack || error?.message || error).slice(0, 1000));
  });
  return diagnostics;
}

async function gotoReady(page, url, diagnostics, debugName) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  try {
    await page.locator(".workspace").waitFor({ state: "visible", timeout: 20000 });
  } catch (error) {
    const debug = {
      url,
      title: await page.title().catch(() => ""),
      bodyText: await page.locator("body").innerText({ timeout: 1000 }).catch(() => ""),
      diagnostics,
      error: String(error?.message || error),
    };
    await page.screenshot({
      path: path.join(OUT_DIR, `${debugName}-load-failure.png`),
      fullPage: false,
    }).catch(() => {});
    await writeFile(
      path.join(OUT_DIR, `${debugName}-load-failure.json`),
      `${JSON.stringify(debug, null, 2)}\n`,
    );
    throw error;
  }
}

async function addAndSelectPot(page, viewport) {
  await page.getByRole("button", { name: /Add/i }).click();
  await page.waitForTimeout(500);

  const pot = page.locator("button, [role='button']").filter({ hasText: /9mm Pot|Pot/i }).first();
  await pot.click();
  await page.waitForTimeout(300);

  await page.mouse.click(Math.round(viewport.width / 2), Math.round(viewport.height * 0.52));
  await page.locator(".app.has-mobile-selection").waitFor({ state: "visible" });
}

async function gridSnapState(page) {
  return page.evaluate(() => {
    const grid = document.querySelector('.mobile-toolbar-quick[title="Toggle grid visibility"]');
    const popover = document.querySelector(".toolbar-popover");
    const rectOf = el => {
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        width: Math.round(r.width),
        height: Math.round(r.height),
        right: Math.round(r.right),
        bottom: Math.round(r.bottom),
      };
    };
    const gridStyle = grid ? getComputedStyle(grid) : null;
    return {
      gridClass: grid?.className || null,
      gridText: grid?.textContent || null,
      gridRect: grid ? rectOf(grid) : null,
      gridColor: gridStyle?.color || null,
      gridTextFill: gridStyle?.webkitTextFillColor || null,
      gridFontSize: gridStyle?.fontSize || null,
      hasPopover: !!popover,
      popoverText: (popover?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 180),
    };
  });
}

async function collectMobileSelectedMetrics(page) {
  return page.evaluate(() => {
    const rectOf = el => {
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        width: Math.round(r.width),
        height: Math.round(r.height),
        right: Math.round(r.right),
        bottom: Math.round(r.bottom),
      };
    };
    const app = document.querySelector(".app");
    const actions = document.querySelector(".mobile-selection-actions");
    const dock = document.querySelector(".mobile-main-dock");
    const selectedButtons = actions
      ? [...actions.querySelectorAll("button")].map(button => ({
          text: (button.textContent || "").trim(),
          rect: rectOf(button),
          clipped:
            button.scrollWidth > Math.ceil(button.clientWidth) ||
            button.scrollHeight > Math.ceil(button.clientHeight),
        }))
      : [];
    const topButtons = [...document.querySelectorAll(".mobile-toolbar-quick, .mobile-menu-trigger")].map(button => ({
      text: (button.textContent || "").trim(),
      title: button.getAttribute("title"),
      className: button.className,
      rect: rectOf(button),
      clipped:
        button.scrollWidth > Math.ceil(button.clientWidth) ||
        button.scrollHeight > Math.ceil(button.clientHeight),
    }));
    const dockStyle = dock ? getComputedStyle(dock) : null;

    return {
      appClass: app?.className || "",
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
      },
      selectedActions: !!actions,
      selectedActionsRect: actions ? rectOf(actions) : null,
      selectedButtons,
      topButtons,
      dock: dock
        ? {
            opacity: dockStyle.opacity,
            pointerEvents: dockStyle.pointerEvents,
            transform: dockStyle.transform,
            rect: rectOf(dock),
          }
        : null,
    };
  });
}

function metricsToIssues(metrics) {
  const issues = [];
  if (!metrics.selectedActions) issues.push("selected actions bar missing");
  if (metrics.viewport.scrollWidth > metrics.viewport.width) {
    issues.push(`horizontal overflow ${metrics.viewport.scrollWidth - metrics.viewport.width}px`);
  }
  const hiddenButtons = metrics.selectedButtons
    .filter(button => {
      const rect = button.rect;
      return (
        rect.x < 0 ||
        rect.right > metrics.viewport.width ||
        rect.y < 0 ||
        rect.bottom > metrics.viewport.height
      );
    })
    .map(button => button.text);
  if (hiddenButtons.length) issues.push(`hidden selected buttons: ${hiddenButtons.join(", ")}`);
  const clippedButtons = metrics.selectedButtons.filter(button => button.clipped).map(button => button.text);
  if (clippedButtons.length) issues.push(`clipped selected buttons: ${clippedButtons.join(", ")}`);
  if (metrics.dock && metrics.dock.opacity !== "0") issues.push("main dock still visible while selected");
  if (metrics.dock && metrics.dock.pointerEvents !== "none") issues.push("main dock still receives pointer events");
  return issues;
}
