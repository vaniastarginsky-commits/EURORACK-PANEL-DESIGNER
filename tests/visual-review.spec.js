const { mkdir, readFile, writeFile } = require("node:fs/promises");
const { createRequire } = require("node:module");
const { spawn } = require("node:child_process");
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
const OUT_DIR = path.resolve(
  ROOT,
  process.env.DESIGN_REVIEW_OUT || "design-review/after",
);
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:4173/";
const LOCAL_REACT = path.resolve(ROOT, "vendor/react.production.min.js");
const LOCAL_REACT_DOM = path.resolve(
  ROOT,
  "vendor/react-dom.production.min.js",
);

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844, isMobile: true, hasTouch: true };

const states = [
  ["desktop-default", desktop, async () => {}],
  [
    "desktop-left-closed",
    desktop,
    async (page) => setDesktopPanels(page, { left: false, right: true }),
  ],
  [
    "desktop-right-closed",
    desktop,
    async (page) => setDesktopPanels(page, { left: true, right: false }),
  ],
  [
    "desktop-both-closed",
    desktop,
    async (page) => setDesktopPanels(page, { left: false, right: false }),
  ],
  [
    "desktop-topbar-section-popover",
    desktop,
    async (page) => {
      await clickButton(page, "Panel ▾");
      await page
        .locator(".toolbar-popover.topbar-section-popover")
        .waitFor({ state: "visible" });
    },
  ],
  [
    "desktop-templates-dialog",
    desktop,
    async (page) => {
      await clickButton(page, "Templates ▾");
      await clickButton(page, "Load / Manage templates");
      await page
        .locator(".template-manager-panel")
        .waitFor({ state: "visible" });
    },
  ],
  [
    "desktop-export-svg",
    desktop,
    async (page) => {
      await clickButton(page, "File ▾");
      await clickButton(page, "Export...");
      await page.locator(".export-dialog-panel").waitFor({ state: "visible" });
      await page
        .locator(".export-tabs")
        .getByRole("button", { name: "SVG", exact: true })
        .click();
    },
  ],

  // Safe-zones overlay: enables MobileSafeZonesLayer which renders SVG <rect class="rail"> elements.
  // Required before any CSS cleanup of .rail compound selectors (Codex blocker).
  [
    "desktop-safe-zones",
    desktop,
    async (page) => {
      await page.locator('.canvas-tool-rail button[title="View"]').click();
      await page.locator(".canvas-tool-popover").waitFor({ state: "visible" });
      await page
        .locator(".canvas-tool-popover")
        .getByRole("button", { name: "Safe zones", exact: true })
        .click();
      await page.locator("rect.rail").first().waitFor({ state: "attached" });
    },
  ],

  // P1: export dialog – KiCad tab (default tab; recommended banner + package card only appear here)
  [
    "desktop-export-kicad",
    desktop,
    async (page) => {
      await clickButton(page, "File ▾");
      await clickButton(page, "Export...");
      await page.locator(".export-dialog-panel").waitFor({ state: "visible" });
      await page
        .locator(".export-tabs")
        .getByRole("button", { name: "KiCad", exact: true })
        .click();
    },
  ],

  // P1: export dialog – PNG tab (checkboxes + DPI select; export-dialog-actions footer in view)
  [
    "desktop-export-png",
    desktop,
    async (page) => {
      await clickButton(page, "File ▾");
      await clickButton(page, "Export...");
      await page.locator(".export-dialog-panel").waitFor({ state: "visible" });
      await page
        .locator(".export-tabs")
        .getByRole("button", { name: "PNG", exact: true })
        .click();
      await page.locator(".export-tab-body").waitFor({ state: "visible" });
    },
  ],

  // P1: export dialog – Package tab (export-recommended-banner + package card + action grid)
  [
    "desktop-export-package",
    desktop,
    async (page) => {
      await clickButton(page, "File ▾");
      await clickButton(page, "Export...");
      await page.locator(".export-dialog-panel").waitFor({ state: "visible" });
      await page
        .locator(".export-tabs")
        .getByRole("button", { name: "Package", exact: true })
        .click();
      await page
        .locator(".export-recommended-banner")
        .waitFor({ state: "visible" });
    },
  ],

  // P1: export dialog – Report tab (runtime-diagnostics-card + production checklist)
  [
    "desktop-export-report",
    desktop,
    async (page) => {
      await clickButton(page, "File ▾");
      await clickButton(page, "Export...");
      await page.locator(".export-dialog-panel").waitFor({ state: "visible" });
      await page
        .locator(".export-tabs")
        .getByRole("button", { name: "Report", exact: true })
        .click();
      await page
        .locator(".runtime-diagnostics-card")
        .waitFor({ state: "visible" });
    },
  ],

  // P1: layer manager (lives in right sidebar Layers tab; the canvas-layer-panel / layer-panel-trigger
  //     component in Canvas.js is defined but never instantiated — this is the real layer manager)
  [
    "desktop-layer-manager",
    desktop,
    async (page) => {
      await page
        .locator(".sidebar-right")
        .getByRole("button", { name: "Layers", exact: true })
        .first()
        .click();
      await page
        .locator(".compact-layer-manager")
        .waitFor({ state: "visible" });
    },
  ],

  // P1: component library popover (fixed-position grid overlay above canvas)
  [
    "desktop-component-library-popover",
    desktop,
    async (page) => {
      await openComponentLibraryPopover(page);
    },
  ],

  // P1: inline modal layered inside templates dialog (edit-metadata form)
  [
    "desktop-templates-inline-edit",
    desktop,
    async (page) => {
      await clickButton(page, "Templates ▾");
      await clickButton(page, "Load / Manage templates");
      await page
        .locator(".template-manager-panel")
        .waitFor({ state: "visible" });
      await page
        .locator(".template-manager-panel")
        .getByRole("button", { name: "Edit", exact: true })
        .first()
        .click();
      await page.locator(".inline-modal-layer").waitFor({ state: "visible" });
    },
  ],

  // P1: template delete confirmation — danger inline modal (.inline-modal-actions button.danger)
  [
    "desktop-inline-modal-danger",
    desktop,
    async (page) => {
      await clickButton(page, "Templates ▾");
      await clickButton(page, "Load / Manage templates");
      await page
        .locator(".template-manager-panel")
        .waitFor({ state: "visible" });
      await page
        .locator(".template-manager-panel")
        .getByRole("button", { name: "Delete", exact: true })
        .first()
        .click();
      await page
        .locator(".inline-modal-actions button.danger")
        .waitFor({ state: "visible" });
    },
  ],

  // P1: component hover card (positioned float over SVG component)
  [
    "desktop-component-hover-card",
    desktop,
    async (page) => {
      await placeComponentOnCanvas(page);
      const group = page.locator(".panel-canvas-svg [data-id]").first();
      await group.waitFor({ state: "visible" });
      const box = await group.boundingBox();
      if (!box || box.width < 1 || box.height < 1)
        throw new Error("component SVG group has no bounding box");
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.locator(".component-hover-card").waitFor({ state: "visible" });
    },
  ],
  [
    "desktop-selection-workflow",
    desktop,
    async (page) => {
      await placeComponentOnCanvas(page, { xOffset: -14 });
      await placeComponentOnCanvas(page, { xOffset: 14 });
      const components = page.locator(".component-node");
      await components.nth(0).click();
      await components.nth(1).click({ modifiers: ["Shift"] });
      await components.nth(1).click({ button: "right" });
      const selectedCount = await page
        .locator(".component-node.is-selected")
        .count();
      if (selectedCount !== 2)
        throw new Error("Right click collapsed the multi-selection");
      await page.locator(".component-menu").getByText("2 selected").waitFor();
      if ((await page.locator(".selection-action-toolbar").count()) !== 0)
        throw new Error("Desktop selection toolbar should not be rendered");
    },
  ],
  [
    "desktop-artwork-mount-holes",
    desktop,
    async (page) => {
      const imageDataUrl =
        "data:image/svg+xml;base64," +
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#8b2442"/></svg>',
        ).toString("base64");
      await page.locator("#project-file-input").setInputFiles({
        name: "artwork-mount-holes.json",
        mimeType: "application/json",
        buffer: Buffer.from(
          JSON.stringify({
            projectVersion: 4,
            panel: { widthHP: 12, customHP: false },
            components: [],
            artworks: [
              {
                id: "artwork-cover",
                name: "Panel artwork",
                imageDataUrl,
                x: 30.48,
                y: 64.25,
                width: 60.96,
                height: 128.5,
                rotation: 0,
                opacity: 1,
                layer: "background",
                visible: true,
                locked: true,
              },
            ],
          }),
        ),
      });
      const artwork = page.locator('[data-artwork-id="artwork-cover"]');
      const mountingHoles = page.locator(".mounting-holes-layer");
      await artwork.waitFor({ state: "visible" });
      await mountingHoles.waitFor({ state: "visible" });
      const mountingHoleNodes = page.locator(
        ".mounting-holes-layer > [data-mounting-hole-id]",
      );
      if ((await mountingHoleNodes.count()) !== 4)
        throw new Error("12HP panel should use four mounting holes");
      const mountingXs = await mountingHoleNodes.evaluateAll((nodes) =>
        Array.from(
          new Set(
            nodes.map((node) =>
              Number(node.getAttribute("data-mounting-hole-x")),
            ),
          ),
        ).sort((a, b) => a - b),
      );
      const pitchCount = (mountingXs[1] - mountingXs[0]) / 5.08;
      if (Math.abs(pitchCount - Math.round(pitchCount)) > 0.001)
        throw new Error(
          "Wide-panel mounting-hole spacing must follow HP pitch",
        );
      const artworkAboveMountingHoles = await artwork.evaluate((node) => {
        const holes = document.querySelector(".mounting-holes-layer");
        return !!(
          holes &&
          holes.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING
        );
      });
      if (artworkAboveMountingHoles)
        throw new Error("Background artwork renders above mounting holes");
    },
  ],
  [
    "desktop-dfm-fix-preview",
    desktop,
    async (page) => {
      await placeComponentOnCanvas(page, { xOffset: -14 });
      await placeComponentOnCanvas(page, { xOffset: 14 });
      await page
        .locator(".sidebar-right")
        .getByRole("button", { name: "Warnings", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Preview fix", exact: true })
        .first()
        .click();
      await page.locator(".warning-fix-preview").waitFor({ state: "visible" });
    },
  ],
  [
    "desktop-dfm-click-away",
    desktop,
    async (page) => {
      await placeComponentOnCanvas(page);
      await page.locator(".dfm-status-main").click();
      await page.locator(".dfm-status-drawer").waitFor({ state: "visible" });
      await page.mouse.click(900, 400);
      await page.locator(".dfm-status-drawer").waitFor({ state: "detached" });
    },
  ],
  [
    "desktop-manufacturing-preview",
    desktop,
    async (page) => {
      await placeComponentOnCanvas(page);
      await page.keyboard.press("p");
      await page
        .getByRole("button", { name: "Exit manufacturing view", exact: true })
        .waitFor({ state: "visible" });
    },
  ],
  [
    "desktop-large-layout",
    desktop,
    async (page) => {
      const components = Array.from({ length: 180 }, (_, index) => ({
        id: `perf-${index}`,
        type: "jack",
        name: "6mm Jack",
        ref: `J${index + 1}`,
        label: "",
        x: 12 + (index % 30) * 13.6,
        y: 12 + Math.floor(index / 30) * 20,
        rotation: 0,
        locked: false,
      }));
      await page.locator("#project-file-input").setInputFiles({
        name: "large-layout.json",
        mimeType: "application/json",
        buffer: Buffer.from(
          JSON.stringify({
            projectVersion: 4,
            panel: { widthHP: 84, customHP: false },
            components,
          }),
        ),
      });
      await page.waitForFunction(
        () => document.querySelectorAll(".component-node").length === 180,
      );
      await page
        .locator(".canvas-wrap.large-layout-mode")
        .waitFor({ state: "visible" });
    },
  ],
  [
    "desktop-kicad-panel-parts-only",
    desktop,
    async (page) => {
      const footprint = (name, ref, value, x, y, pads) => `
        (footprint "${name}"
          (at ${x} ${y})
          (property "Reference" "${ref}")
          (property "Value" "${value}")
          ${pads}
        )`;
      const smdPads = `
        (pad "1" smd rect (at -0.8 0) (size 1 1) (layers "F.Cu"))
        (pad "2" smd rect (at 0.8 0) (size 1 1) (layers "F.Cu"))`;
      const throughHolePads = `
        (pad "1" thru_hole circle (at 0 0) (size 2 2) (drill 1) (layers "*.Cu" "*.Mask"))
        (pad "2" thru_hole circle (at 2.5 0) (size 2 2) (drill 1) (layers "*.Cu" "*.Mask"))
        (pad "3" thru_hole circle (at 5 0) (size 2 2) (drill 1) (layers "*.Cu" "*.Mask"))`;
      const board = `(kicad_pcb
        (gr_rect (start 0 0) (end 40.64 128.5) (layer "Edge.Cuts"))
        ${footprint("Resistor_SMD:R_0603_1608Metric", "R1", "10k", 6, 20, smdPads)}
        ${footprint("Capacitor_SMD:C_0603_1608Metric", "C1", "100nF", 12, 20, smdPads)}
        ${footprint("Potentiometer_THT:Potentiometer_Alpha_RD901F-40", "RV1", "B100K", 10, 48, throughHolePads)}
        ${footprint("Connector_Audio:Jack_3.5mm_QingPu_WQP-PJ398SM_Vertical", "J1", "AudioJack", 20, 70, throughHolePads)}
        ${footprint("Button_Switch_THT:SW_PUSH_6mm", "SW1", "SW_Push", 30, 48, throughHolePads)}
      )`;
      await page.locator("#kicad-pcb-file-input").setInputFiles({
        name: "panel-parts-only.kicad_pcb",
        mimeType: "text/plain",
        buffer: Buffer.from(board),
      });
      await page.waitForFunction(
        () => document.querySelectorAll(".component-node").length === 3,
      );
      const labels = await page
        .locator(".component-node")
        .evaluateAll((nodes) => nodes.map((node) => node.textContent || ""));
      if (labels.some((label) => /R1|C1/.test(label)))
        throw new Error("KiCad import included PCB-only resistor/capacitor");
      const mountingHoles = page.locator(
        ".mounting-holes-layer > [data-mounting-hole-id]",
      );
      if ((await mountingHoles.count()) !== 2)
        throw new Error("8HP KiCad import should use two mounting holes");
      const mountingX = await mountingHoles.evaluateAll((nodes) =>
        nodes.map((node) => Number(node.getAttribute("data-mounting-hole-x"))),
      );
      if (mountingX.some((x) => Math.abs(x - 7.5) > 0.001))
        throw new Error("Narrow-panel mounting holes must be at X=7.5mm");
    },
  ],
  [
    "desktop-eagle-mechanical-faceplate",
    desktop,
    async (page) => {
      const board = `<?xml version="1.0" encoding="utf-8"?>
        <eagle version="9.6.2"><drawing><board><plain>
          <wire x1="0" y1="0" x2="40.3" y2="0" width="0" layer="20"/>
          <wire x1="40.3" y1="0" x2="40.3" y2="128.5" width="0" layer="20"/>
          <wire x1="40.3" y1="128.5" x2="0" y2="128.5" width="0" layer="20"/>
          <wire x1="0" y1="128.5" x2="0" y2="0" width="0" layer="20"/>
          <hole x="7.33" y="125.5" drill="3.2"/>
          <hole x="7.33" y="3" drill="3.2"/>
          <hole x="14" y="82" drill="7.2"/>
          <circle x="27" y="46" radius="3.05" width="0" layer="46"/>
          <rectangle x1="4" y1="20" x2="36" y2="108" layer="1"/>
          <circle x="20" y="64" radius="5" width="1" layer="1"/>
          <wire x1="8" y1="24" x2="32" y2="104" width="1.2" layer="29"/>
          <circle x="20" y="64" radius="8" width="1.2" layer="29"/>
          <text x="9" y="32" size="3" layer="29">MASK ART</text>
          <wire x1="7" y1="116" x2="33" y2="116" width="0.5" layer="21"/>
        </plain><elements/></board></drawing></eagle>`;
      await page.locator("#eagle-brd-file-input").setInputFiles({
        name: "mechanical-faceplate.brd",
        mimeType: "application/xml",
        buffer: Buffer.from(board),
      });
      await page.waitForFunction(
        () => document.querySelectorAll(".component-node").length === 2,
      );
      if (
        (await page
          .locator(".mounting-holes-layer > [data-mounting-hole-id]")
          .count()) !== 2
      )
        throw new Error("Eagle rail holes duplicated automatic mounting holes");
      const cutoutLabels = await page
        .locator(".component-node")
        .evaluateAll((nodes) => nodes.map((node) => node.textContent || ""));
      if (!cutoutLabels.some((label) => label.includes("Ø7.20")))
        throw new Error("Eagle <hole> cutout was not imported");
      if (!cutoutLabels.some((label) => label.includes("Ø6.10")))
        throw new Error("Eagle milling circle cutout was not imported");
      const artwork = page.locator("[data-artwork-id]");
      if ((await artwork.count()) !== 1)
        throw new Error(
          "Eagle front copper/mask/silkscreen artwork was not imported",
        );
      const artworkImage = artwork.locator("image");
      const artworkHref = await artworkImage.getAttribute("href");
      if (!artworkHref?.startsWith("data:image/svg+xml"))
        throw new Error("Eagle front artwork should remain vector SVG");
      const artworkSvg = decodeURIComponent(artworkHref.split(",", 2)[1]);
      if (!artworkSvg.includes('r="5" fill="none" stroke="#c99a4a"'))
        throw new Error("Eagle copper circles must remain stroked outlines");
    },
  ],
  [
    "desktop-kicad-mechanical-faceplate",
    desktop,
    async (page) => {
      const npth = (x, y, drill) => `
        (footprint "MountingHole:MountingHole_${drill}mm"
          (at ${x} ${y})
          (property "Reference" "H")
          (property "Value" "MountingHole")
          (pad "" np_thru_hole circle (at 0 0) (size ${drill} ${drill}) (drill ${drill}) (layers "*.Cu" "*.Mask"))
        )`;
      const board = `(kicad_pcb
        (gr_rect (start 0 0) (end 40.64 128.5) (layer "Edge.Cuts"))
        ${npth(7.5, 3, 3.2)}
        ${npth(7.5, 125.5, 3.2)}
        ${npth(14, 48, 7.2)}
        (gr_circle (center 27 82) (end 30.05 82) (layer "Edge.Cuts"))
      )`;
      await page.locator("#kicad-pcb-file-input").setInputFiles({
        name: "mechanical-faceplate.kicad_pcb",
        mimeType: "text/plain",
        buffer: Buffer.from(board),
      });
      await page.waitForFunction(
        () => document.querySelectorAll(".component-node").length === 2,
      );
      if (
        (await page
          .locator(".mounting-holes-layer > [data-mounting-hole-id]")
          .count()) !== 2
      )
        throw new Error("KiCad rail holes duplicated automatic mounting holes");
      const cutoutLabels = await page
        .locator(".component-node")
        .evaluateAll((nodes) => nodes.map((node) => node.textContent || ""));
      if (!cutoutLabels.some((label) => label.includes("Ø7.20")))
        throw new Error("KiCad NPTH cutout was not imported");
      if (!cutoutLabels.some((label) => label.includes("Ø6.10")))
        throw new Error("KiCad Edge.Cuts circle was not imported");
    },
  ],

  ["mobile-default", mobile, async () => {}],
  [
    "mobile-right-drawer",
    mobile,
    async (page) => {
      await page.locator("button[title='Toggle right panel']").click();
      await page.locator(".sidebar-right").waitFor({ state: "visible" });
    },
  ],

  // P1: mobile component library — tests that cards don't overlap (row sizing regression)
  [
    "mobile-component-library-all",
    mobile,
    async (page) => {
      await page.evaluate(() =>
        window.dispatchEvent(new CustomEvent("open-component-library-picker")),
      );
      await page
        .locator(".component-library-popover")
        .waitFor({ state: "visible" });
    },
  ],
  [
    "mobile-component-library-switches",
    mobile,
    async (page) => {
      await page.evaluate(() =>
        window.dispatchEvent(new CustomEvent("open-component-library-picker")),
      );
      await page
        .locator(".component-library-popover")
        .waitFor({ state: "visible" });
      await page
        .locator(".library-category-select-wide")
        .selectOption("switch");
      await page.waitForTimeout(150);
    },
  ],
  [
    "mobile-component-library-pots",
    mobile,
    async (page) => {
      await page.evaluate(() =>
        window.dispatchEvent(new CustomEvent("open-component-library-picker")),
      );
      await page
        .locator(".component-library-popover")
        .waitFor({ state: "visible" });
      await page
        .locator(".library-category-select-wide")
        .selectOption("potentiometer");
      await page.waitForTimeout(150);
    },
  ],
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const devServer = await ensureDevServer();
  const chromium = await loadChromium();
  const browser = await chromium.launch();
  const results = [];

  try {
    for (const [name, viewport, prepare] of states) {
      results.push(await captureState(browser, name, viewport, prepare));
    }
  } finally {
    await browser.close();
    devServer?.kill("SIGTERM");
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

async function ensureDevServer() {
  if (await canReachBaseUrl()) return null;
  const url = new URL(BASE_URL);
  if (!["127.0.0.1", "localhost"].includes(url.hostname)) {
    throw new Error(`Visual QA base URL is unavailable: ${BASE_URL}`);
  }
  const port = url.port || (url.protocol === "https:" ? "443" : "80");
  const child = spawn(
    "python3",
    ["-m", "http.server", port, "--bind", "127.0.0.1"],
    {
      cwd: ROOT,
      stdio: "ignore",
    },
  );
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await canReachBaseUrl()) return child;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  child.kill("SIGTERM");
  throw new Error(`Could not start visual QA server at ${BASE_URL}`);
}

async function canReachBaseUrl() {
  try {
    const response = await fetch(BASE_URL);
    return response.ok;
  } catch {
    return false;
  }
}

async function captureState(browser, name, viewport, prepare) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: !!viewport.isMobile,
    hasTouch: !!viewport.hasTouch,
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

    await page.route("**/react@*/umd/react.production.min.js", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: react,
      }),
    );
    await page.route(
      "**/react-dom@*/umd/react-dom.production.min.js",
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/javascript",
          body: reactDom,
        }),
    );
  } catch {
    // The app can still load from CDN in a normal local environment.
  }
}

async function setDesktopPanels(page, desired) {
  const workspace = page.locator(".workspace");
  // Left panel is always closed on desktop — no LeftSidebar rendered.
  const currentRight =
    (await workspace.getAttribute("data-right-open")) === "true";
  if (currentRight !== desired.right) {
    // Right panel toggle is in the topbar on desktop.
    await page.locator(".topbar-inspect-btn").click();
    await page.waitForFunction(
      (value) =>
        document.querySelector(".workspace")?.dataset.rightOpen === value,
      String(desired.right),
    );
  }
}

async function openComponentLibraryPopover(page) {
  // Fire the custom event that the headless ComponentLibraryPanel listens to.
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent("open-component-library-picker")),
  );
  await page
    .locator(".component-library-popover")
    .waitFor({ state: "visible" });
}

async function placeComponentOnCanvas(page, { xOffset = 0, yOffset = 0 } = {}) {
  // Dispatch the internal placement event with a minimal Thonkiconn jack definition.
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent("start-part-placement", {
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
      }),
    );
  });
  // Click the canvas at its visual center to place the pending component.
  const svg = page.locator(".panel-canvas-svg");
  await svg.waitFor({ state: "visible" });
  const box = await svg.boundingBox();
  if (!box) throw new Error(".panel-canvas-svg bounding box not available");
  await page.mouse.click(
    box.x + box.width / 2 + xOffset,
    box.y + box.height / 2 + yOffset,
  );
  // Wait for the component SVG group to appear in the DOM.
  await page
    .locator(".panel-canvas-svg [data-id]")
    .last()
    .waitFor({ state: "visible" });
}

async function openMobilePanel(page, buttonName, panelSelector) {
  await page.locator(".mobile-main-dock button").last().click();
  await page.locator(".mobile-bottom-sheet").waitFor({ state: "visible" });
  await page.getByRole("button", { name: buttonName, exact: true }).click();
  await page.locator(panelSelector).waitFor({ state: "visible" });
  await page
    .locator(".mobile-sheet-backdrop")
    .click({ position: { x: 4, y: 4 } })
    .catch(() => {});
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
