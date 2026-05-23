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
const LOCAL_REACT = path.resolve(ROOT, "vendor/react.production.min.js");
const LOCAL_REACT_DOM = path.resolve(ROOT, "vendor/react-dom.production.min.js");

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844, isMobile: true };

const states = [
  ["desktop-default", desktop, async () => {}],
  ["desktop-left-closed", desktop, async page => setDesktopPanels(page, { left: false, right: true })],
  ["desktop-right-closed", desktop, async page => setDesktopPanels(page, { left: true, right: false })],
  ["desktop-both-closed", desktop, async page => setDesktopPanels(page, { left: false, right: false })],
  ["desktop-topbar-section-popover", desktop, async page => {
    await clickButton(page, "Panel ▾");
    await page.locator(".toolbar-popover.topbar-section-popover").waitFor({ state: "visible" });
  }],
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

  // Safe-zones overlay: enables MobileSafeZonesLayer which renders SVG <rect class="rail"> elements.
  // Required before any CSS cleanup of .rail compound selectors (Codex blocker).
  ["desktop-safe-zones", desktop, async page => {
    await page.locator('.canvas-tool-rail button[title="View"]').click();
    await page.locator(".canvas-tool-popover").waitFor({ state: "visible" });
    await page.locator(".canvas-tool-popover").getByRole("button", { name: "Safe zones", exact: true }).click();
    await page.locator("rect.rail").first().waitFor({ state: "attached" });
  }],

  // P1: export dialog – KiCad tab (default tab; recommended banner + package card only appear here)
  ["desktop-export-kicad", desktop, async page => {
    await clickButton(page, "File ▾");
    await clickButton(page, "Export...");
    await page.locator(".export-dialog-panel").waitFor({ state: "visible" });
    await page.locator(".export-tabs").getByRole("button", { name: "KiCad", exact: true }).click();
  }],

  // P1: export dialog – PNG tab (checkboxes + DPI select; export-dialog-actions footer in view)
  ["desktop-export-png", desktop, async page => {
    await clickButton(page, "File ▾");
    await clickButton(page, "Export...");
    await page.locator(".export-dialog-panel").waitFor({ state: "visible" });
    await page.locator(".export-tabs").getByRole("button", { name: "PNG", exact: true }).click();
    await page.locator(".export-tab-body").waitFor({ state: "visible" });
  }],

  // P1: export dialog – Package tab (export-recommended-banner + package card + action grid)
  ["desktop-export-package", desktop, async page => {
    await clickButton(page, "File ▾");
    await clickButton(page, "Export...");
    await page.locator(".export-dialog-panel").waitFor({ state: "visible" });
    await page.locator(".export-tabs").getByRole("button", { name: "Package", exact: true }).click();
    await page.locator(".export-recommended-banner").waitFor({ state: "visible" });
  }],

  // P1: export dialog – Report tab (runtime-diagnostics-card + production checklist)
  ["desktop-export-report", desktop, async page => {
    await clickButton(page, "File ▾");
    await clickButton(page, "Export...");
    await page.locator(".export-dialog-panel").waitFor({ state: "visible" });
    await page.locator(".export-tabs").getByRole("button", { name: "Report", exact: true }).click();
    await page.locator(".runtime-diagnostics-card").waitFor({ state: "visible" });
  }],

  // P1: layer manager (lives in right sidebar Layers tab; the canvas-layer-panel / layer-panel-trigger
  //     component in Canvas.js is defined but never instantiated — this is the real layer manager)
  ["desktop-layer-manager", desktop, async page => {
    await page.locator(".sidebar-right").getByRole("button", { name: "Layers", exact: true }).first().click();
    await page.locator(".compact-layer-manager").waitFor({ state: "visible" });
  }],

  // P1: component library popover (fixed-position grid overlay above canvas)
  ["desktop-component-library-popover", desktop, async page => {
    await openComponentLibraryPopover(page);
  }],

  // P1: inline modal layered inside templates dialog (edit-metadata form)
  ["desktop-templates-inline-edit", desktop, async page => {
    await clickButton(page, "Templates ▾");
    await clickButton(page, "Load / Manage templates");
    await page.locator(".template-manager-panel").waitFor({ state: "visible" });
    await page.locator(".template-manager-panel").getByRole("button", { name: "Edit", exact: true }).first().click();
    await page.locator(".inline-modal-layer").waitFor({ state: "visible" });
  }],

  // P1: template delete confirmation — danger inline modal (.inline-modal-actions button.danger)
  ["desktop-inline-modal-danger", desktop, async page => {
    await clickButton(page, "Templates ▾");
    await clickButton(page, "Load / Manage templates");
    await page.locator(".template-manager-panel").waitFor({ state: "visible" });
    await page.locator(".template-manager-panel").getByRole("button", { name: "Delete", exact: true }).first().click();
    await page.locator(".inline-modal-actions button.danger").waitFor({ state: "visible" });
  }],

  // P1: component hover card (positioned float over SVG component)
  ["desktop-component-hover-card", desktop, async page => {
    await placeComponentOnCanvas(page);
    const group = page.locator(".panel-canvas-svg [data-id]").first();
    await group.waitFor({ state: "visible" });
    const box = await group.boundingBox();
    if (!box || box.width < 1 || box.height < 1) throw new Error("component SVG group has no bounding box");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.locator(".component-hover-card").waitFor({ state: "visible" });
  }],

  ["mobile-default", mobile, async () => {}],
  ["mobile-right-drawer", mobile, async page => {
    await page.locator(".canvas-tool-rail button[title='Right']").click();
    await page.locator(".sidebar-right").waitFor({ state: "visible" });
  }],

  // P1: mobile component library — tests that cards don't overlap (row sizing regression)
  ["mobile-component-library-all", mobile, async page => {
    await page.evaluate(() => window.dispatchEvent(new CustomEvent("open-component-library-picker")));
    await page.locator(".component-library-popover").waitFor({ state: "visible" });
  }],
  ["mobile-component-library-switches", mobile, async page => {
    await page.evaluate(() => window.dispatchEvent(new CustomEvent("open-component-library-picker")));
    await page.locator(".component-library-popover").waitFor({ state: "visible" });
    await page.locator(".library-category-select-wide").selectOption("switch");
    await page.waitForTimeout(150);
  }],
  ["mobile-component-library-pots", mobile, async page => {
    await page.evaluate(() => window.dispatchEvent(new CustomEvent("open-component-library-picker")));
    await page.locator(".component-library-popover").waitFor({ state: "visible" });
    await page.locator(".library-category-select-wide").selectOption("potentiometer");
    await page.waitForTimeout(150);
  }],
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

async function openComponentLibraryPopover(page) {
  // Open the left sidebar first so the library launcher is visible and the popover has a valid anchor.
  const workspace = page.locator(".workspace");
  const leftOpen = (await workspace.getAttribute("data-left-open")) === "true";
  if (!leftOpen) {
    await clickButton(page, "Left");
    await page.waitForFunction(v => document.querySelector(".workspace")?.dataset.leftOpen === v, "true");
  }
  await page.locator(".component-library-launcher").click();
  await page.locator(".component-library-popover").waitFor({ state: "visible" });
}

async function placeComponentOnCanvas(page) {
  // Dispatch the internal placement event with a minimal Thonkiconn jack definition.
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("start-part-placement", {
      detail: {
        def: {
          type: "jack",
          name: "Thonkiconn Jack",
          holeDiameter: 6.1,
          frontDiameter: 8.0,
          rearBodyW: 8.5,
          rearBodyH: 10.5,
          rearDepth: 12.0,
          keepoutW: 10.5,
          keepoutH: 12.5,
          minSpacing: 1.5,
          category: "jack",
          verificationStatus: "datasheet",
        },
      },
    }));
  });
  // Click the canvas at its visual center to place the pending component.
  const svg = page.locator(".panel-canvas-svg");
  await svg.waitFor({ state: "visible" });
  const box = await svg.boundingBox();
  if (!box) throw new Error(".panel-canvas-svg bounding box not available");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  // Wait for the component SVG group to appear in the DOM.
  await page.locator(".panel-canvas-svg [data-id]").first().waitFor({ state: "visible" });
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
