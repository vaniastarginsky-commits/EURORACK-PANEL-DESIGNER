const { mkdir, readFile, writeFile } = require("node:fs/promises");
const { createRequire } = require("node:module");
const path = require("node:path");

async function loadChromium() {
  try {
    return (await import("playwright")).chromium;
  } catch {
    const requireFromHere = createRequire(__filename);
    return requireFromHere(
      "/Users/weedhash/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
    ).chromium;
  }
}

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, process.env.DESIGN_REVIEW_OUT || "design-review/after");
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:4173/";
const LOCAL_REACT = "/Users/weedhash/Desktop/PANEL+SITE/vendor/react.production.min.js";
const LOCAL_REACT_DOM = "/Users/weedhash/Desktop/PANEL+SITE/vendor/react-dom.production.min.js";

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844, isMobile: true };

const states = [
  ["desktop-default", desktop, async () => {}],
  ["desktop-left-closed", desktop, async page => setDesktopPanels(page, { left: false, right: true })],
  ["desktop-right-closed", desktop, async page => setDesktopPanels(page, { left: true, right: false })],
  ["desktop-both-closed", desktop, async page => setDesktopPanels(page, { left: false, right: false })],
  ["desktop-templates-dialog", desktop, async page => {
    await clickButton(page, "Templates ▾");
    await clickButton(page, "Load / Manage templates");
    await page.locator(".template-manager-panel").waitFor({ state: "visible" });
  }],
  ["desktop-export-svg", desktop, async page => {
    await clickButton(page, "File ▾");
    await clickButton(page, "Export...");
    await page.locator(".export-dialog-panel").waitFor({ state: "visible" });
    await page.locator(".export-tabs").getByRole("button", { name: "SVG", exact: true }).click();
  }],
  ["mobile-default", mobile, async () => {}],
  ["mobile-more-sheet", mobile, async page => {
    await page.locator(".mobile-main-dock button").last().click();
    await page.locator(".mobile-bottom-sheet").waitFor({ state: "visible" });
  }],
  ["mobile-left-drawer", mobile, async page => openMobilePanel(page, "Left panel", ".sidebar-left")],
  ["mobile-right-drawer", mobile, async page => openMobilePanel(page, "Right panel", ".sidebar-right")],
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const chromium = await loadChromium();
  const browser = await chromium.launch();
  const results = [];

  try {
    for (const [name, viewport, prepare] of states) {
      results.push(await captureState(browser, name, viewport, prepare));
    }
  } finally {
    await browser.close();
  }

  await writeFile(
    path.join(OUT_DIR, "visual-review-spec-results.json"),
    `${JSON.stringify({ baseUrl: BASE_URL, outputDir: OUT_DIR, results }, null, 2)}\n`,
  );

  console.log(`Captured ${results.length} screenshots in ${OUT_DIR}`);
  for (const result of results) {
    console.log(`- ${result.file}`);
  }
}

async function captureState(browser, name, viewport, prepare) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: !!viewport.isMobile,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  await installLocalReactRoutes(page);

  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.locator(".workspace").waitFor({ state: "visible" });
    await prepare(page);
    await page.locator(".workspace").waitFor({ state: "visible" });

    const file = `${name}.png`;
    await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: false });
    return { state: name, file: path.join(OUT_DIR, file) };
  } finally {
    await context.close();
  }
}

async function installLocalReactRoutes(page) {
  try {
    const [react, reactDom] = await Promise.all([
      readFile(LOCAL_REACT, "utf8"),
      readFile(LOCAL_REACT_DOM, "utf8"),
    ]);

    await page.route("**/react@*/umd/react.production.min.js", route =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: react }),
    );
    await page.route("**/react-dom@*/umd/react-dom.production.min.js", route =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: reactDom }),
    );
  } catch {
    // The app can still load from CDN in a normal local environment.
  }
}

async function setDesktopPanels(page, desired) {
  const workspace = page.locator(".workspace");
  const currentLeft = (await workspace.getAttribute("data-left-open")) === "true";
  const currentRight = (await workspace.getAttribute("data-right-open")) === "true";

  if (currentLeft !== desired.left) {
    await clickButton(page, "Left");
    await page.waitForFunction(value => document.querySelector(".workspace")?.dataset.leftOpen === value, String(desired.left));
  }
  if (currentRight !== desired.right) {
    await clickButton(page, "Right");
    await page.waitForFunction(value => document.querySelector(".workspace")?.dataset.rightOpen === value, String(desired.right));
  }
}

async function openMobilePanel(page, buttonName, panelSelector) {
  await page.locator(".mobile-main-dock button").last().click();
  await page.locator(".mobile-bottom-sheet").waitFor({ state: "visible" });
  await page.getByRole("button", { name: buttonName, exact: true }).click();
  await page.locator(panelSelector).waitFor({ state: "visible" });
  await page.locator(".mobile-sheet-backdrop").click({ position: { x: 4, y: 4 } }).catch(() => {});
}

async function clickButton(page, name) {
  const stableSelectors = {
    Left: '.canvas-tool-rail button[title="Left"]',
    Right: '.canvas-tool-rail button[title="Right"]',
  };

  if (stableSelectors[name]) {
    const button = page.locator(stableSelectors[name]);
    if ((await button.count()) === 1) {
      await button.click();
      return;
    }
  }

  const byRole = page.getByRole("button", { name, exact: true });
  if ((await byRole.count()) === 1) {
    await byRole.click();
    return;
  }

  const byText = page.locator("button").filter({ hasText: name });
  if ((await byText.count()) === 1) {
    await byText.click();
    return;
  }

  throw new Error(`Could not find a unique visible button for: ${name}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
