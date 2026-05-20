#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  const require = createRequire(import.meta.url);
  try {
    ({ chromium } = require("/Users/weedhash/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));
  } catch {
    console.error("Missing dependency: playwright");
    console.error("Install it with: npm install --save-dev playwright && npx playwright install chromium");
    process.exit(1);
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(
  ROOT,
  process.env.DESIGN_REVIEW_OUT || "design-review/current",
);
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:4173/";
const LOCAL_REACT = "/Users/weedhash/Desktop/PANEL+SITE/vendor/react.production.min.js";
const LOCAL_REACT_DOM = "/Users/weedhash/Desktop/PANEL+SITE/vendor/react-dom.production.min.js";

const VIEWPORTS = {
  desktop: [
    { name: "desktop-1024x768", width: 1024, height: 768 },
    { name: "desktop-1440x900", width: 1440, height: 900 },
    { name: "desktop-1920x1080", width: 1920, height: 1080 },
  ],
  mobile: [
    { name: "mobile-390x844", width: 390, height: 844, isMobile: true },
    { name: "mobile-412x915", width: 412, height: 915, isMobile: true },
    { name: "tablet-820x1180", width: 820, height: 1180, isMobile: true },
  ],
};

const DESKTOP_STATES = [
  ["empty-workspace", async () => {}],
  ["left-sidebar-hidden", async page => setDesktopPanels(page, { left: false, right: true })],
  ["right-sidebar-hidden", async page => setDesktopPanels(page, { left: true, right: false })],
  [
    "both-sidebars-hidden",
    async page => setDesktopPanels(page, { left: false, right: false }),
  ],
  ["topbar-templates-menu-open", async page => clickButton(page, "Templates ▾")],
  ["topbar-file-menu-open", async page => clickButton(page, "File ▾")],
  [
    "rail-grid-snap-menu-open",
    async page => {
      await page.locator(".canvas-tool-rail").getByTitle("Snap").click();
      await page.locator(".canvas-tool-popover").waitFor({ state: "visible" });
    },
  ],
  [
    "rail-view-menu-open",
    async page => {
      await page.locator(".canvas-tool-rail").getByTitle("View").click();
      await page.locator(".canvas-tool-popover").waitFor({ state: "visible" });
    },
  ],
  [
    "templates-dialog-open",
    async page => {
      await clickButton(page, "Templates ▾");
      await clickButton(page, "Load / Manage templates");
      await page.locator(".template-manager-panel").waitFor({ state: "visible" });
    },
  ],
  ["export-dialog-svg-tab", async page => openExportTab(page, "SVG")],
  ["export-dialog-package-tab", async page => openExportTab(page, "Package")],
  ["export-dialog-report-tab", async page => openExportTab(page, "Report")],
  [
    "right-sidebar-layer-manager-tab",
    async page => {
      const tabs = page.locator(".right-tab-strip.primary");
      await tabs.getByRole("button", { name: "Layers", exact: true }).click();
      await page.locator(".compact-layer-manager").waitFor({ state: "visible" });
    },
  ],
  [
    "view-contrast-open",
    async page => {
      await page.locator(".canvas-tool-rail").getByTitle("Tone").click();
      await page.locator(".view-contrast-panel").waitFor({ state: "visible" });
    },
  ],
];

const MOBILE_STATES = [
  ["mobile-empty-workspace", async () => {}],
  [
    "mobile-more-sheet-open",
    async page => {
      await page.locator(".mobile-main-dock button").last().click();
      await page.locator(".mobile-bottom-sheet").waitFor({ state: "visible" });
    },
  ],
  [
    "mobile-left-panel-open",
    async page => {
      await openMobilePanel(page, "Left panel", ".sidebar-left");
    },
  ],
  [
    "mobile-right-panel-open",
    async page => {
      await openMobilePanel(page, "Right panel", ".sidebar-right");
    },
  ],
];

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const results = [];

try {
  for (const viewport of VIEWPORTS.desktop) {
    for (const [stateName, prepare] of DESKTOP_STATES) {
      results.push(await captureState(browser, viewport, stateName, prepare));
    }
  }

  for (const viewport of VIEWPORTS.mobile) {
    for (const [stateName, prepare] of MOBILE_STATES) {
      results.push(await captureState(browser, viewport, stateName, prepare));
    }
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(OUT_DIR, "visual-review-results.json"),
  `${JSON.stringify({ baseUrl: BASE_URL, capturedAt: new Date().toISOString(), results }, null, 2)}\n`,
);

const problemScreens = results.filter(result => result.issues.length);
console.log(`Captured ${results.length} screenshots in ${OUT_DIR}`);
if (!problemScreens.length) {
  console.log("No automated layout issues detected.");
} else {
  console.log("Screenshots with automated layout issues:");
  for (const result of problemScreens) {
    console.log(`- ${result.file}: ${result.issues.join("; ")}`);
  }
}

async function captureState(browser, viewport, stateName, prepare) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: !!viewport.isMobile,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  await installLocalReactRoutes(page);
  const diagnostics = [];
  page.on("console", msg => diagnostics.push(`${msg.type()}: ${msg.text()}`));
  page.on("pageerror", error => diagnostics.push(`pageerror: ${error.message}`));

  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    try {
      await page.locator(".workspace").waitFor({ state: "visible" });
    } catch (error) {
      const bodyText = await page.locator("body").innerText().catch(() => "");
      console.error(`Failed to load workspace for ${viewport.name}--${stateName}`);
      console.error(diagnostics.join("\n"));
      console.error(bodyText.slice(0, 1600));
      throw error;
    }
    await prepare(page);
    await page.locator(".workspace").waitFor({ state: "visible" });
    await page.screenshot({
      path: path.join(OUT_DIR, `${viewport.name}--${stateName}.png`),
      fullPage: false,
    });

    return {
      viewport: viewport.name,
      state: stateName,
      file: `${viewport.name}--${stateName}.png`,
      issues: await collectLayoutIssues(page),
    };
  } finally {
    await context.close();
  }
}

async function installLocalReactRoutes(page) {
  let react = null;
  let reactDom = null;

  try {
    [react, reactDom] = await Promise.all([
      readFile(LOCAL_REACT, "utf8"),
      readFile(LOCAL_REACT_DOM, "utf8"),
    ]);
  } catch {
    return;
  }

  await page.route("**/react@*/umd/react.production.min.js", route =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: react }),
  );
  await page.route("**/react-dom@*/umd/react-dom.production.min.js", route =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: reactDom }),
  );
}

async function openExportTab(page, tabName) {
  await clickButton(page, "File ▾");
  await clickButton(page, "Export...");
  await page.locator(".export-dialog-panel").waitFor({ state: "visible" });
  await page
    .locator(".export-tabs")
    .getByRole("button", { name: tabName, exact: true })
    .click();
}

async function openMobilePanel(page, buttonName, panelSelector) {
  await page.locator(".mobile-main-dock button").last().click();
  await page.locator(".mobile-bottom-sheet").waitFor({ state: "visible" });
  await page.getByRole("button", { name: buttonName, exact: true }).click();
  await page.locator(panelSelector).waitFor({ state: "visible" });
  await page.locator(".mobile-sheet-backdrop").click({ position: { x: 4, y: 4 } }).catch(() => {});
}

async function setDesktopPanels(page, desired) {
  const workspace = page.locator(".workspace");
  const readState = async key => (await workspace.getAttribute(`data-${key}-open`)) === "true";
  const currentLeft = await readState("left");
  const currentRight = await readState("right");

  if (currentLeft !== desired.left) {
    await clickButton(page, "Left");
    await page.waitForFunction(value => document.querySelector(".workspace")?.dataset.leftOpen === value, String(desired.left));
  }
  if (currentRight !== desired.right) {
    await clickButton(page, "Right");
    await page.waitForFunction(value => document.querySelector(".workspace")?.dataset.rightOpen === value, String(desired.right));
  }
}

async function clickButton(page, name) {
  const stableSelectors = {
    "Left": '.canvas-tool-rail button[title="Left"]',
    "Right": '.canvas-tool-rail button[title="Right"]',
  };
  if (stableSelectors[name]) {
    const bySelector = page.locator(stableSelectors[name]);
    if (await bySelector.count() === 1) {
      await bySelector.click();
      return;
    }
  }

  const byRole = page.getByRole("button", { name, exact: true });
  if (await byRole.count() === 1) {
    await byRole.click();
    return;
  }

  const byText = page.locator("button").filter({ hasText: name });
  if (await byText.count() === 1) {
    await byText.click();
    return;
  }

  throw new Error(`Could not find a unique visible button for: ${name}`);
}

async function collectLayoutIssues(page) {
  return page.evaluate(() => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const visible = el => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        style.opacity !== "0"
      );
    };
    const inViewport = el => {
      const rect = el.getBoundingClientRect();
      return rect.right > 0 && rect.bottom > 0 && rect.left < viewport.width && rect.top < viewport.height;
    };
    const label = el =>
      (el.innerText || el.textContent || el.getAttribute("aria-label") || el.className || el.tagName)
        .toString()
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 72);
    const rectOf = el => {
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        width: Math.round(r.width),
        height: Math.round(r.height),
      };
    };

    const issues = [];
    const overflow = Math.max(
      0,
      document.documentElement.scrollWidth - viewport.width,
      document.body.scrollWidth - viewport.width,
    );
    if (overflow > 1) issues.push(`horizontal overflow ${overflow}px`);

    const controls = [...document.querySelectorAll("button, input, select, textarea, [role='button']")]
      .filter(visible)
      .filter(inViewport)
      .map(el => ({ el, rect: el.getBoundingClientRect(), label: label(el) }));

    const hiddenControls = controls.filter(({ rect }) => {
      return rect.left < -1 || rect.right > viewport.width + 1 || rect.top < -1 || rect.bottom > viewport.height + 1;
    });
    if (hiddenControls.length) {
      issues.push(
        `controls outside viewport: ${hiddenControls
          .slice(0, 6)
          .map(item => item.label || JSON.stringify(rectOf(item.el)))
          .join(", ")}`,
      );
    }

    const clipped = [...document.querySelectorAll("button, label, .toolbar-menu-trigger, .app-modal-title, .export-tabs button")]
      .filter(visible)
      .filter(inViewport)
      .filter(el => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    if (clipped.length) {
      issues.push(`clipped text: ${clipped.slice(0, 6).map(label).join(", ")}`);
    }

    const overlapPairs = [];
    for (let i = 0; i < controls.length; i += 1) {
      for (let j = i + 1; j < controls.length; j += 1) {
        const a = controls[i];
        const b = controls[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const x = Math.max(0, Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left));
        const y = Math.max(0, Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top));
        if (x * y > 24) overlapPairs.push(`${a.label} / ${b.label}`);
      }
    }
    if (overlapPairs.length) issues.push(`overlapping controls: ${overlapPairs.slice(0, 6).join(", ")}`);

    const blackReserved = [...document.querySelectorAll(".sidebar-left.closed, .sidebar-right.closed")]
      .filter(visible)
      .map(rectOf);
    if (blackReserved.length) issues.push(`visible collapsed sidebar holes: ${JSON.stringify(blackReserved.slice(0, 3))}`);

    return issues;
  });
}
