// Core state, reducers, utilities, exports, and secondary panels extracted from index.html.
if (!window.React || !window.ReactDOM) {
  throw new Error(
    "React CDN did not load. Check internet/CDN access or host React locally.",
  );
}
document.documentElement.setAttribute("data-panel-designer-cdn", "loaded");
const {
  useState,
  useReducer,
  useContext,
  createContext,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} = React;
const APP_VERSION = "v451_mobile_canvas_dock_cleanup";
window.__EURORACK_PANEL_DESIGNER_BUILD__ = {
  version: "v451_mobile_canvas_dock_cleanup",
  built: "2026-05-18T20:46:01Z",
  base: "index_v393_fixed_stable_rebuild.html",
  precompiled: true,
  browserPrompts: 0,
  browserConfirms: 0,
  minified: true,
};
document.documentElement.setAttribute(
  "data-panel-designer-build",
  window.__EURORACK_PANEL_DESIGNER_BUILD__.version,
);
const HP_TO_MM = 5.08;
const PANEL_HEIGHT_MM = 128.5;
const MOUNTING_HOLE_TOP_Y_MM = 3.0;
const MOUNTING_HOLE_BOTTOM_Y_MM = PANEL_HEIGHT_MM - 3.0;
const MOUNTING_HOLE_DIAMETER_MM = 3.2;
const MOUNTING_HOLE_KEEPOUT_R_MM = 1.0;
const MAX_UNDO = 50;
const STANDARD_HP = [2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20];
const DEFAULT_EXPORT_OPTIONS = {
  drillOnly: false,
  labels: true,
  rearKeepout: false,
  rearBody: false,
  centerMarks: true,
  mountingKeepouts: true,
  includeArtwork: true,
  svgLayeredPanelBase: true,
  svgLayeredComponents: true,
  svgLayeredHoles: true,
  svgLayeredArtwork: true,
  svgLayeredText: true,
  pngCombined: true,
  pngSeparateComponents: false,
  pngSeparateHoles: false,
  pngSeparateArtwork: false,
  pngSeparateText: false,
  pngTransparentBg: true,
  pngDpi: 300,
  psdPanelBase: true,
  psdComponents: true,
  psdHoles: true,
  psdArtwork: true,
  psdText: true,
  psdDpi: 300,
  kicadPanelOutline: true,
  kicadMountingHoles: true,
  kicadComponentHoles: true,
  kicadRectCutouts: true,
  kicadVisualOutlines: false,
  kicadKeepoutHints: false,
  kicadRefs: false,
  kicadTextLabels: false,
  kicadOrigin: "top-left",
};
function defaultSnapSettings() {
  return {
    grid: true,
    panelEdges: true,
    pcbEdges: true,
    componentCenters: true,
    componentBodyEdges: false,
    distance: 1.0,
  };
}
const DFM_PROFILES = {
  generic: {
    key: "generic",
    name: "Generic CNC / prototype",
    minHole: 2.5,
    minSlot: 2.5,
    minEdge: 1.5,
    minHoleToHole: 1.5,
    minText: 1.2,
  },
  cnc_aluminum: {
    key: "cnc_aluminum",
    name: "CNC aluminum panel",
    minHole: 2.5,
    minSlot: 2.5,
    minEdge: 2.0,
    minHoleToHole: 2.0,
    minText: 1.5,
  },
  laser_acrylic: {
    key: "laser_acrylic",
    name: "Laser acrylic",
    minHole: 2.0,
    minSlot: 2.0,
    minEdge: 2.0,
    minHoleToHole: 2.0,
    minText: 1.8,
  },
  fr4_panel: {
    key: "fr4_panel",
    name: "FR4 / PCB front panel",
    minHole: 0.8,
    minSlot: 1.0,
    minEdge: 0.6,
    minHoleToHole: 0.6,
    minText: 0.8,
  },
};
function defaultLayerVisibility() {
  return {
    grid: true,
    panelOutline: true,
    mountingHoles: true,
    artwork: true,
    text: true,
    labels: true,
    componentHoles: true,
    frontShapes: true,
    topHardware: true,
    rearBodies: true,
    rearKeepouts: true,
    pcb: true,
  };
}
function inferCategoryForType(type) {
  if (
    type === "pot9mm" ||
    type === "pot16mm" ||
    type === "pot9mm_ra" ||
    type === "trimmer6mm"
  )
    return "potentiometer";
  if (type === "jack" || type === "slimjack") return "jack";
  if (
    type === "toggle" ||
    type === "slideSwitchMini" ||
    type === "tact6mm" ||
    type === "momentary12" ||
    type === "tactled"
  )
    return "switch";
  if (type === "led3mm") return "led";
  if (type === "encoder") return "encoder";
  if (
    type === "fader20" ||
    type === "fader20led" ||
    type === "fader35" ||
    type === "fader45"
  )
    return "fader";
  if (type === "dip8socket") return "custom";
  return "custom";
}
function isSamePartType(a, b) {
  return (
    a.type === b.type ||
    (!!a.category &&
      !!b.category &&
      a.category === b.category &&
      a.name === b.name)
  );
}
const REF_PREFIX_BY_TYPE = {
  pot9mm: "RV",
  pot16mm: "RV",
  pot9mm_ra: "RV",
  encoder: "ENC",
  jack: "J",
  slimjack: "J",
  toggle: "SW",
  toggleSpdt: "SW",
  toggleSplash: "SW",
  slideSwitchMini: "SW",
  slideSwitch8pos: "SW",
  tact6mm: "SW",
  momentary12: "SW",
  tactled: "SW",
  led3mm: "LED",
  fader20: "FDR",
  fader20led: "FDR",
  fader35: "FDR",
  fader45: "FDR",
  trimmer6mm: "TR",
  custom: "H",
  customrect: "CUT",
};
function refPrefixForType(type) {
  return REF_PREFIX_BY_TYPE[type] ?? "X";
}
function nextRefForComponent(type, components) {
  const prefix = refPrefixForType(type);
  const nums = components
    .map((c) => c.ref || "")
    .filter((r) => r.startsWith(prefix))
    .map((r) => parseInt(r.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n));
  return `${prefix}${nums.length ? Math.max(...nums) + 1 : 1}`;
}
function renumberRefs(components) {
  const counts = {};
  return components.map((c) => {
    const prefix = refPrefixForType(c.type);
    counts[prefix] = (counts[prefix] || 0) + 1;
    return { ...c, ref: `${prefix}${counts[prefix]}` };
  });
}
function defaultAttachedLabelFor(c) {
  const offsetY = getFrontBottomOffset(c) + 4.0;
  return {
    id: crypto.randomUUID(),
    text: c.label && c.label !== c.name ? c.label : c.ref || c.name,
    x: c.x,
    y: c.y + offsetY,
    rotation: 0,
    fontSizeMm: 2.2,
    fontFamily: TEXT_FONT_OPTIONS[0].value,
    align: "center",
    layer: "foreground",
    locked: false,
    visible: true,
    opacity: 1,
    componentId: c.id,
    offsetX: 0,
    offsetY,
  };
}
function verificationLabel(v) {
  if (v === "production") return "Production verified";
  if (v === "measured") return "Measured";
  if (v === "datasheet") return "From datasheet";
  return "Approximate";
}
function verificationColor(v) {
  if (v === "production") return "#55dd88";
  if (v === "measured") return "#72b7ff";
  if (v === "datasheet") return "#ffd166";
  return "#ff9966";
}
function isPartVerified(c) {
  return (
    c.verificationStatus === "datasheet" ||
    c.verificationStatus === "measured" ||
    c.verificationStatus === "production"
  );
}
function shortPartName(def) {
  const t = def.type;
  if (t === "pot9mm") return "9mm Pot";
  if (t === "pot16mm") return "16mm Pot";
  if (t === "pot9mm_ra") return "9mm RA Pot";
  if (t === "trimmer6mm") return "Trim Pot 9mm";
  if (t === "jack") return "6mm Jack";
  if (t === "slimjack") return "1/4 Slim Jack";
  if (t === "toggle") return "DPDT Toggle";
  if (t === "toggleSpdt") return "SPDT Toggle";
  if (t === "toggleSplash") return "T88B52 Toggle";
  if (t === "slideSwitchMini") return "DPDT Slide";
  if (t === "slideSwitch8pos") return "SS-18F08";
  if (t === "subMiniSwitch") return "Sub-mini Switch";
  if (t === "rotary8pos") return "8-pos Rotary";
  if (t === "led3mm") return "3mm CVD LED";
  if (t === "tactled") return "LED Button 7.5";
  if (t === "tact6mm") return "6mm Tact";
  if (t === "momentary12") return "12mm Button";
  if (t === "encoder") return "Encoder EC12";
  if (t === "fader20led") return "LED Fader 20mm";
  if (t === "fader20") return "Fader 20mm";
  if (t === "fader35") return "Fader 35mm";
  if (t === "fader45") return "Fader 45mm";
  if (t === "customrect") return "Rect Cutout";
  if (t === "custom") return "Custom Hole";
  return def.name
    .replace(/^Alpha\s+/i, "")
    .replace(/^ALPS\s+/i, "")
    .replace(/^Low Profile\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}
function defaultLabelForComponentDef(def) {
  if (def.type === "slideSwitch8pos") return "SS-18F08";
  return def.name;
}
function partTooltip(def) {
  const status = verificationLabel(def.verificationStatus);
  const hole =
    def.holeType === "slot"
      ? `${def.holeDiameter} × ${def.slotLength ?? def.holeDiameter} mm slot`
      : def.holeType === "rect"
        ? `${def.holeW ?? def.frontW ?? def.holeDiameter} × ${def.holeH ?? def.frontH ?? def.holeDiameter} mm cut`
        : `Ø ${def.holeDiameter} mm hole`;
  return [
    def.name,
    def.manufacturer || "",
    def.partNumber || "",
    hole,
    `rear ${def.rearBodyW} × ${def.rearBodyH} mm · depth ${def.rearDepth} mm`,
    status,
    def.verification || "",
  ]
    .filter(Boolean)
    .join("\n");
}
function PartIcon({ def }) {
  const cat = def.category ?? inferCategoryForType(def.type);
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  if (cat === "fader" || isFaderLike(def)) {
    return React.createElement(
      "svg",
      { className: "part-icon", viewBox: "0 0 24 24", "aria-hidden": "true" },
      React.createElement("rect", {
        x: "9",
        y: "3",
        width: "6",
        height: "18",
        rx: "3",
        ...common,
      }),
      React.createElement("rect", {
        x: "6",
        y: "10",
        width: "12",
        height: "5",
        rx: "1.5",
        fill: "currentColor",
        opacity: ".75",
      }),
    );
  }
  if (cat === "potentiometer" || cat === "encoder" || isPotLike(def)) {
    return React.createElement(
      "svg",
      { className: "part-icon", viewBox: "0 0 24 24", "aria-hidden": "true" },
      React.createElement("circle", { cx: "12", cy: "12", r: "8", ...common }),
      React.createElement("path", { d: "M12 12V5", ...common }),
      React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "3",
        fill: "currentColor",
        opacity: ".20",
      }),
    );
  }
  if (cat === "jack" || isJackLike(def)) {
    return React.createElement(
      "svg",
      { className: "part-icon", viewBox: "0 0 24 24", "aria-hidden": "true" },
      React.createElement("circle", { cx: "12", cy: "12", r: "8", ...common }),
      React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "3.4",
        fill: "currentColor",
        opacity: ".7",
      }),
      React.createElement("path", { d: "M5 19l4-4", ...common }),
    );
  }
  if (cat === "switch" || isButtonLike(def)) {
    if (def.type === "slideSwitch8pos") {
      return React.createElement(
        "svg",
        { className: "part-icon", viewBox: "0 0 24 24", "aria-hidden": "true" },
        React.createElement("rect", {
          x: "3",
          y: "9",
          width: "18",
          height: "6",
          rx: "1.5",
          ...common,
        }),
        React.createElement("rect", {
          x: "4",
          y: "9.4",
          width: "5.2",
          height: "5.2",
          rx: ".6",
          fill: "currentColor",
          opacity: ".7",
        }),
        React.createElement("path", { d: "M11 11h7M11 13h7", ...common }),
      );
    }
    if (def.type === "slideSwitchMini") {
      return React.createElement(
        "svg",
        { className: "part-icon", viewBox: "0 0 24 24", "aria-hidden": "true" },
        React.createElement("rect", {
          x: "4",
          y: "8",
          width: "16",
          height: "8",
          rx: "2",
          ...common,
        }),
        React.createElement("rect", {
          x: "11",
          y: "9.5",
          width: "5.5",
          height: "5",
          rx: "1",
          fill: "currentColor",
          opacity: ".7",
        }),
      );
    }
    return React.createElement(
      "svg",
      { className: "part-icon", viewBox: "0 0 24 24", "aria-hidden": "true" },
      React.createElement("circle", { cx: "12", cy: "12", r: "7", ...common }),
      React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "4",
        fill: "currentColor",
        opacity: ".55",
      }),
    );
  }
  if (cat === "led" || isLedLike(def)) {
    return React.createElement(
      "svg",
      { className: "part-icon", viewBox: "0 0 24 24", "aria-hidden": "true" },
      React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "6",
        fill: "currentColor",
        opacity: ".55",
      }),
      React.createElement("path", {
        d: "M17 7l3-3M19 11l3-1M7 17l-3 3",
        ...common,
      }),
    );
  }
  return React.createElement(
    "svg",
    { className: "part-icon", viewBox: "0 0 24 24", "aria-hidden": "true" },
    React.createElement("rect", {
      x: "6",
      y: "6",
      width: "12",
      height: "12",
      rx: "2",
      ...common,
    }),
    React.createElement("path", { d: "M9 12h6M12 9v6", ...common }),
  );
}
function PartPickerLabel({ def }) {
  return React.createElement(
    "span",
    { className: "part-picker-label" },
    React.createElement(PartIcon, { def: def }),
    React.createElement("span", null, shortPartName(def)),
  );
}
function LibraryPartPreview({ def }) {
  const placed = {
    ...sanitizePart(def),
    id: `preview-${def.type}-${def.name}`,
    ref: "",
    label: "",
    x: 18,
    y: 18,
    rotation: 0,
    notes: "",
    locked: false,
  };
  const b = getFrontBounds(placed);
  const maxDim = Math.max(
    b.w || placed.frontDiameter || placed.holeDiameter || 6,
    b.h || placed.frontDiameter || placed.holeDiameter || 6,
    placed.slotLength || 0,
    placed.knobDiameter || 0,
    8,
  );
  const pad = Math.max(5, maxDim * 0.26);
  const size = Math.max(24, maxDim + pad * 2);
  const cx = size / 2;
  const cy = size / 2;
  const c = { ...placed, x: cx, y: cy };
  return React.createElement(
    "svg",
    {
      className: "library-real-preview",
      viewBox: `0 0 ${size} ${size}`,
      "aria-hidden": "true",
    },
    React.createElement(
      "defs",
      null,
      React.createElement(
        "radialGradient",
        { id: `lib-glow-${def.type}`, cx: "38%", cy: "30%", r: "70%" },
        React.createElement("stop", {
          offset: "0%",
          stopColor: "rgba(255,255,255,.28)",
        }),
        React.createElement("stop", {
          offset: "48%",
          stopColor: "rgba(201,154,74,.08)",
        }),
        React.createElement("stop", {
          offset: "100%",
          stopColor: "rgba(0,0,0,0)",
        }),
      ),
    ),
    React.createElement("rect", {
      x: "0",
      y: "0",
      width: size,
      height: size,
      rx: size * 0.18,
      fill: "rgba(255,255,255,.025)",
    }),
    React.createElement("circle", {
      cx: cx,
      cy: cy,
      r: size * 0.42,
      fill: `url(#lib-glow-${def.type})`,
    }),
    isFaderLike(c)
      ? React.createElement(
          "g",
          { transform: `rotate(${c.rotation}, ${cx}, ${cy})` },
          React.createElement("rect", {
            x: cx - (c.holeDiameter || 3) / 2,
            y: cy - (c.slotLength || 20) / 2,
            width: c.holeDiameter || 3,
            height: c.slotLength || 20,
            rx: (c.holeDiameter || 3) / 2,
            fill: "#050505",
            stroke: "rgba(255,255,255,.45)",
            strokeWidth: ".35",
          }),
          React.createElement("rect", {
            x: cx - Math.max(7, c.faderHandleW || 8) / 2,
            y: cy - (c.faderHandleH || 5) / 2,
            width: Math.max(7, c.faderHandleW || 8),
            height: c.faderHandleH || 5,
            rx: "1.4",
            fill: c.type === "fader20led" ? "#ff3838" : "#dfe4e8",
            stroke: "rgba(0,0,0,.72)",
            strokeWidth: ".32",
          }),
          c.type === "fader20led" &&
            React.createElement("rect", {
              x: cx - 1.5,
              y: cy - 1.0,
              width: "3",
              height: "1.5",
              rx: ".35",
              fill: "rgba(255,255,255,.35)",
            }),
        )
      : isJackLike(c)
        ? React.createElement(
            "g",
            null,
            React.createElement("circle", {
              cx: cx,
              cy: cy,
              r: Math.max(4, c.frontDiameter * 0.44),
              fill: "#1a1d20",
              stroke: "#050505",
              strokeWidth: ".32",
            }),
            React.createElement("circle", {
              cx: cx,
              cy: cy,
              r: Math.max(2.7, c.frontDiameter * 0.3),
              fill: "#8e969c",
              stroke: "rgba(255,255,255,.20)",
              strokeWidth: ".12",
            }),
            React.createElement("circle", {
              cx: cx,
              cy: cy,
              r: Math.max(2.0, c.holeDiameter * 0.32),
              fill: "#050505",
              stroke: "rgba(255,255,255,.25)",
              strokeWidth: ".16",
            }),
            React.createElement("circle", {
              cx: cx - 1.2,
              cy: cy - 1.2,
              r: Math.max(0.65, c.frontDiameter * 0.055),
              fill: "rgba(255,255,255,.34)",
            }),
          )
        : isPotLike(c) || c.category === "encoder"
          ? React.createElement(
              "g",
              null,
              React.createElement("circle", {
                cx: cx,
                cy: cy,
                r: Math.max(5, visualKnobDiameter(c) / 2),
                fill: "#101010",
                stroke: "none",
                strokeWidth: "0",
              }),
              React.createElement("circle", {
                cx: cx,
                cy: cy,
                r: Math.max(4, visualKnobDiameter(c) * 0.38),
                fill: "#1d1d1d",
                stroke: "rgba(255,255,255,.18)",
                strokeWidth: ".25",
              }),
              React.createElement("line", {
                x1: cx,
                y1: cy,
                x2: cx,
                y2: cy - Math.max(3.5, visualKnobDiameter(c) * 0.32),
                stroke: "#f2f2ee",
                strokeWidth: ".85",
                strokeLinecap: "round",
              }),
            )
          : isMiniSlideSwitch(c)
            ? React.createElement(
                "g",
                null,
                c.type === "slideSwitch8pos"
                  ? React.createElement(
                      React.Fragment,
                      null,
                      React.createElement("rect", {
                        x: cx - 9.8,
                        y: cy - 2.2,
                        width: "19.6",
                        height: "4.4",
                        rx: ".75",
                        fill: "#020202",
                        stroke: "rgba(255,255,255,.35)",
                        strokeWidth: ".22",
                      }),
                      React.createElement("rect", {
                        x: cx - 8.8,
                        y: cy - 3.6,
                        width: "5.8",
                        height: "7.2",
                        rx: ".8",
                        fill: "#20272c",
                        stroke: "rgba(255,255,255,.28)",
                        strokeWidth: ".18",
                      }),
                      Array.from({ length: 4 }, (_, i) =>
                        React.createElement("line", {
                          key: i,
                          x1: cx - 7.8 + i * 1.1,
                          x2: cx - 7.8 + i * 1.1,
                          y1: cy - 2.3,
                          y2: cy + 2.3,
                          stroke: "#050505",
                          strokeWidth: ".32",
                          strokeLinecap: "round",
                        }),
                      ),
                    )
                  : React.createElement(
                      React.Fragment,
                      null,
                      React.createElement("rect", {
                        x: cx - 5.2,
                        y: cy - 2.0,
                        width: "10.4",
                        height: "4.0",
                        rx: ".65",
                        fill: "#020202",
                        stroke: "rgba(255,255,255,.34)",
                        strokeWidth: ".22",
                      }),
                      React.createElement("rect", {
                        x: cx - 4.3,
                        y: cy - 3.1,
                        width: "3.5",
                        height: "6.2",
                        rx: ".55",
                        fill: "#151a1f",
                        stroke: "rgba(255,255,255,.28)",
                        strokeWidth: ".18",
                      }),
                      Array.from({ length: 3 }, (_, i) =>
                        React.createElement("line", {
                          key: i,
                          x1: cx - 3.65 + i * 0.75,
                          x2: cx - 3.65 + i * 0.75,
                          y1: cy - 2.0,
                          y2: cy + 2.0,
                          stroke: "#030303",
                          strokeWidth: ".20",
                          strokeLinecap: "round",
                        }),
                      ),
                    ),
              )
            : c.type === "tact6mm"
              ? React.createElement(
                  "g",
                  null,
                  React.createElement("circle", {
                    cx: cx,
                    cy: cy,
                    r: 2.55,
                    fill: "rgba(0,0,0,.45)",
                    stroke: "rgba(255,255,255,.18)",
                    strokeWidth: ".18",
                  }),
                  React.createElement("circle", {
                    cx: cx,
                    cy: cy,
                    r: 1.75,
                    fill: topColor(c),
                    stroke: "rgba(255,255,255,.45)",
                    strokeWidth: ".16",
                  }),
                  React.createElement("circle", {
                    cx: cx - 0.42,
                    cy: cy - 0.52,
                    r: ".46",
                    fill: "rgba(255,255,255,.42)",
                  }),
                )
              : isButtonLike(c) || isLedLike(c)
                ? React.createElement(
                    "g",
                    null,
                    React.createElement("circle", {
                      cx: cx,
                      cy: cy,
                      r: Math.max(3, c.frontDiameter / 2),
                      fill: isLedLike(c) ? "#ff4141" : "#777",
                      stroke: "rgba(255,255,255,.55)",
                      strokeWidth: ".35",
                    }),
                    React.createElement("circle", {
                      cx: cx - 1.2,
                      cy: cy - 1.4,
                      r: Math.max(0.9, c.frontDiameter * 0.16),
                      fill: "rgba(255,255,255,.5)",
                    }),
                  )
                : c.type === "dip8socket"
                  ? React.createElement(
                      "g",
                      null,
                      React.createElement("rect", {
                        x: cx - 6.4,
                        y: cy - 6.4,
                        width: "12.8",
                        height: "12.8",
                        rx: "1.0",
                        fill: "#090a0c",
                        stroke: "rgba(235,245,248,.70)",
                        strokeWidth: ".28",
                      }),
                      React.createElement("rect", {
                        x: cx - 3.2,
                        y: cy - 3.2,
                        width: "6.4",
                        height: "6.4",
                        rx: ".35",
                        fill: "#050607",
                        stroke: "rgba(185,246,255,.24)",
                        strokeWidth: ".16",
                      }),
                      dip8SocketHoleCenters({ ...c, x: cx, y: cy }).map(
                        (p, i) =>
                          React.createElement("circle", {
                            key: `dip8-prev-${i}`,
                            cx: p.x,
                            cy: p.y,
                            r: ".58",
                            fill: "#b8b0a0",
                            stroke: "#2d261f",
                            strokeWidth: ".13",
                          }),
                      ),
                      React.createElement("path", {
                        d: `M ${cx - 1.3} ${cy - 6.4} A 1.3 1.3 0 0 0 ${cx + 1.3} ${cy - 6.4}`,
                        fill: "none",
                        stroke: "rgba(235,245,248,.70)",
                        strokeWidth: ".22",
                        strokeLinecap: "round",
                      }),
                    )
                  : React.createElement(
                      "g",
                      null,
                      React.createElement("rect", {
                        x: cx - 6,
                        y: cy - 6,
                        width: "12",
                        height: "12",
                        rx: "2",
                        fill: "#151515",
                        stroke: "rgba(185,246,255,.65)",
                        strokeWidth: ".45",
                      }),
                      React.createElement("path", {
                        d: `M ${cx - 3} ${cy} H ${cx + 3} M ${cx} ${cy - 3} V ${cy + 3}`,
                        stroke: "#f3dfb2",
                        strokeWidth: ".7",
                        strokeLinecap: "round",
                      }),
                    ),
  );
}
const COMPONENT_TYPE_SORT_ORDER = {
  potentiometer: 10,
  pot9mm: 11,
  pot16mm: 12,
  pot9mm_ra: 13,
  trimmer6mm: 14,
  jack: 20,
  slimjack: 21,
  switch: 30,
  toggle: 31,
  toggleSpdt: 32,
  toggleSplash: 33,
  slideSwitchMini: 34,
  subMiniSwitch: 35,
  rotary8pos: 36,
  tact6mm: 37,
  tactled: 38,
  momentary12: 39,
  led: 40,
  led3mm: 41,
  encoder: 50,
  fader: 60,
  fader20: 61,
  fader20led: 62,
  fader35: 63,
  fader45: 64,
  custom: 90,
  customrect: 91,
  dip8socket: 92,
};
function componentSortKey(def) {
  const cat = def.category ?? inferCategoryForType(def.type) ?? "custom";
  const order =
    COMPONENT_TYPE_SORT_ORDER[def.type] ??
    COMPONENT_TYPE_SORT_ORDER[cat] ??
    999;
  return `${String(order).padStart(3, "0")}|${shortPartName(def).toLowerCase()}|${def.name.toLowerCase()}`;
}
function sortComponentDefs(parts) {
  return [...parts].sort((a, b) =>
    componentSortKey(a).localeCompare(componentSortKey(b)),
  );
}
function panelWidthMM(panel) {
  return panel.widthHP * HP_TO_MM;
}
function snapToGrid(val, grid) {
  return Math.round(val / grid) * grid;
}
function mountingHoleRailY(side) {
  return side === "top" ? MOUNTING_HOLE_TOP_Y_MM : MOUNTING_HOLE_BOTTOM_Y_MM;
}
function mountingHoleSide(h) {
  const id = String(h.id || "").toLowerCase();
  if (id.includes("-b") || id.endsWith("b") || id.includes("bottom"))
    return "bottom";
  if (id.includes("-t") || id.endsWith("t") || id.includes("top")) return "top";
  return h.y > PANEL_HEIGHT_MM / 2 ? "bottom" : "top";
}
function normalizeMountingHoleRail(h) {
  const side = mountingHoleSide(h);
  return { ...h, y: mountingHoleRailY(side) };
}
function mountingHolesForPreset(widthMM, preset = "four") {
  const xL = 7.5;
  const xR = Math.max(xL, widthMM - 7.5);
  const xC = widthMM / 2;
  const yT = mountingHoleRailY("top");
  const yB = mountingHoleRailY("bottom");
  if (preset === "none") return [];
  if (preset === "two" || preset === "twoOval") {
    return [
      { id: "mh-t", x: xC, y: yT },
      { id: "mh-b", x: xC, y: yB },
    ];
  }
  return [
    { id: "mh-tl", x: xL, y: yT },
    { id: "mh-tr", x: xR, y: yT },
    { id: "mh-bl", x: xL, y: yB },
    { id: "mh-br", x: xR, y: yB },
  ];
}
function defaultMountingHoles(widthMM) {
  return mountingHolesForPreset(widthMM, "four");
}
function defaultMountingHoleConfig(widthMM) {
  return {
    enabled: true,
    showKeepouts: true,
    keepoutRadius: 1.0,
    holeShape: "oval",
    ovalLength: 4.8,
    preset: "fourOval",
    holes: mountingHolesForPreset(widthMM, "fourOval"),
  };
}
function normalizeMountingHoleConfig(raw, widthMM) {
  const obj = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const preset =
    obj.preset === "two" ||
    obj.preset === "twoOval" ||
    obj.preset === "fourOval" ||
    obj.preset === "none" ||
    obj.preset === "custom" ||
    obj.preset === "four"
      ? obj.preset
      : "four";
  let holes = Array.isArray(obj.holes)
    ? obj.holes
        .filter((h) => h && typeof h === "object")
        .map((h, i) =>
          normalizeMountingHoleRail({
            id: typeof h.id === "string" && h.id ? h.id : `mh-${i + 1}`,
            x: typeof h.x === "number" ? h.x : widthMM / 2,
            y: typeof h.y === "number" ? h.y : PANEL_HEIGHT_MM / 2,
          }),
        )
    : mountingHolesForPreset(widthMM, preset);
  if (
    preset !== "custom" &&
    (!Array.isArray(obj.holes) || holes.length === 0)
  ) {
    holes = mountingHolesForPreset(widthMM, preset);
  }
  return {
    enabled: typeof obj.enabled === "boolean" ? obj.enabled : true,
    showKeepouts:
      typeof obj.showKeepouts === "boolean" ? obj.showKeepouts : true,
    keepoutRadius:
      typeof obj.keepoutRadius === "number"
        ? Math.max(0, obj.keepoutRadius)
        : 1.0,
    holeShape:
      obj.holeShape === "oval" || preset === "fourOval" || preset === "twoOval"
        ? "oval"
        : "circle",
    ovalLength:
      typeof obj.ovalLength === "number"
        ? Math.max(MOUNTING_HOLE_DIAMETER_MM, obj.ovalLength)
        : 4.8,
    preset,
    holes,
  };
}
function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return (
    ax - aw / 2 < bx + bw / 2 &&
    ax + aw / 2 > bx - bw / 2 &&
    ay - ah / 2 < by + bh / 2 &&
    ay + ah / 2 > by - bh / 2
  );
}
function circleOverlap(ax, ay, ar, bx, by, br) {
  const dist = Math.hypot(bx - ax, by - ay);
  return ar + br - dist;
}
function getFrontShape(c) {
  if (
    c.frontShape === "rect" ||
    c.frontShape === "slot" ||
    c.frontShape === "circle"
  )
    return c.frontShape;
  if (
    c.holeType === "slot" ||
    (c.frontW !== undefined && c.frontH !== undefined)
  )
    return "slot";
  return "circle";
}
function dip8SocketBodyBounds() {
  return { w: 10.2, h: 10.2 };
}
function getFrontBounds(c) {
  if (isDip8Socket(c)) return dip8SocketBodyBounds();
  const shape = getFrontShape(c);
  if (shape !== "circle") {
    return {
      w: typeof c.frontW === "number" ? c.frontW : c.frontDiameter,
      h: typeof c.frontH === "number" ? c.frontH : c.frontDiameter,
    };
  }
  return { w: c.frontDiameter, h: c.frontDiameter };
}
function isDip8Socket(c) {
  return c.type === "dip8socket";
}
function dip8SocketPinOffsets() {
  const row = 7.62 / 2;
  const pitch = 2.54;
  return [-1.5, -0.5, 0.5, 1.5].flatMap((n) => [
    { x: -row, y: n * pitch },
    { x: row, y: n * pitch },
  ]);
}
function rotatePointLocal(x, y, deg) {
  const a = degToRad(deg || 0);
  const co = Math.cos(a);
  const si = Math.sin(a);
  return { x: x * co - y * si, y: x * si + y * co };
}
function dip8SocketPinHoles(c, x = c.x, y = c.y) {
  const r = Math.max(0.25, (c.holeDiameter || 1.0) / 2);
  return dip8SocketPinOffsets().map((o) => {
    const q = rotatePointLocal(o.x, o.y, c.rotation || 0);
    return { x: x + q.x, y: y + q.y, r };
  });
}
function dip8SocketHoleCenters(c, cx, cy) {
  const x0 = cx ?? c.x ?? 0;
  const y0 = cy ?? c.y ?? 0;
  const rot = ((c.rotation || 0) * Math.PI) / 180;
  const ca = Math.cos(rot),
    sa = Math.sin(rot);
  return dip8SocketPinOffsets().map((p) => ({
    x: x0 + p.x * ca - p.y * sa,
    y: y0 + p.x * sa + p.y * ca,
  }));
}
function getFrontOBB(c) {
  const b = getFrontBounds(c);
  return {
    cx: c.x,
    cy: c.y,
    hw: b.w / 2,
    hh: b.h / 2,
    angle: getFrontShape(c) === "circle" ? 0 : c.rotation,
  };
}
function getFrontExtents(c) {
  return obbEdgeExtents(getFrontOBB(c));
}
function getFrontBottomOffset(c) {
  const b = getFrontBounds(c);
  const shape = getFrontShape(c);
  const rotation =
    shape !== "circle" && typeof c.rotation === "number" ? c.rotation : 0;
  let face = b.h / 2;
  if (shape !== "circle" && rotation !== 0) {
    const r = degToRad(rotation);
    face =
      Math.abs(Math.sin(r)) * (b.w / 2) + Math.abs(Math.cos(r)) * (b.h / 2);
  }
  const knob = c.knobEnabled && c.knobDiameter ? c.knobDiameter / 2 : 0;
  return Math.max(face, knob);
}
function frontClearance(a, b) {
  if (getFrontShape(a) === "circle" && getFrontShape(b) === "circle") {
    return (
      Math.hypot(b.x - a.x, b.y - a.y) -
      a.frontDiameter / 2 -
      b.frontDiameter / 2
    );
  }
  const ae = getFrontExtents(a);
  const be = getFrontExtents(b);
  const dx = Math.max(ae.x1 - be.x2, be.x1 - ae.x2, 0);
  const dy = Math.max(ae.y1 - be.y2, be.y1 - ae.y2, 0);
  if (dx === 0 && dy === 0) {
    const overlapX = Math.min(ae.x2, be.x2) - Math.max(ae.x1, be.x1);
    const overlapY = Math.min(ae.y2, be.y2) - Math.max(ae.y1, be.y1);
    return -Math.min(overlapX, overlapY);
  }
  return Math.hypot(dx, dy);
}
function pcbHeightWarnings(pcb) {
  if (!pcb.enabled) return [];
  const out = [];
  const h = pcb.height;
  const top = pcb.y;
  const bottom = pcb.y + pcb.height;
  if (top < 0 || bottom > PANEL_HEIGHT_MM) {
    out.push({
      ids: ["__pcb__"],
      message: `PCB outline exceeds panel height bounds: y=${top.toFixed(1)}…${bottom.toFixed(1)} mm`,
      severity: "error",
      tone: "red",
    });
  }
  if (h > 113) {
    out.push({
      ids: ["__pcb__"],
      message: `PCB outline height ${h.toFixed(1)} mm exceeds 113 mm practical maximum`,
      severity: "error",
      tone: "red",
    });
  } else if (h > 110) {
    out.push({
      ids: ["__pcb__"],
      message: `PCB outline height ${h.toFixed(1)} mm is very tall (110–113 mm caution range)`,
      severity: "warn",
      tone: "orange",
    });
  } else if (h >= 108) {
    out.push({
      ids: ["__pcb__"],
      message: `PCB outline height ${h.toFixed(1)} mm is near the practical limit (108–110 mm)`,
      severity: "warn",
      tone: "yellow",
    });
  }
  return out;
}
function mergeBroadAABB(a, b) {
  return {
    x1: Math.min(a.x1, b.x1),
    x2: Math.max(a.x2, b.x2),
    y1: Math.min(a.y1, b.y1),
    y2: Math.max(a.y2, b.y2),
  };
}
function inflateBroadAABB(a, amount) {
  return {
    x1: a.x1 - amount,
    x2: a.x2 + amount,
    y1: a.y1 - amount,
    y2: a.y2 + amount,
  };
}
function componentWarningBroadAABB(c, spacingInflate) {
  let bounds = obbEdgeExtents(makeHoleOBB(c));
  bounds = mergeBroadAABB(bounds, getFrontExtents(c));
  if (c.rearBodyW > 0 && c.rearBodyH > 0) {
    bounds = mergeBroadAABB(bounds, obbEdgeExtents(makeBodyOBB(c)));
  }
  if (c.keepoutW > 0 && c.keepoutH > 0) {
    bounds = mergeBroadAABB(bounds, obbEdgeExtents(makeKeepoutOBB(c)));
  }
  const ergoD = ergonomicDiameter(c);
  if (ergoD > 0) {
    const r = ergoD / 2;
    bounds = mergeBroadAABB(bounds, {
      x1: c.x - r,
      x2: c.x + r,
      y1: c.y - r,
      y2: c.y + r,
    });
  }
  return inflateBroadAABB(bounds, spacingInflate);
}
function buildWarningPairCandidateMap(components) {
  const byStart = new Map();
  const n = components.length;
  if (n < 2) return byStart;
  if (n <= 40) {
    for (let i = 0; i < n; i++) {
      const js = [];
      for (let j = i + 1; j < n; j++) js.push(j);
      if (js.length) byStart.set(i, js);
    }
    return byStart;
  }
  const maxSpacing = Math.max(
    2,
    ...components.map((c) => Number(c.minSpacing) || 0),
  );
  const bounds = components.map((c) =>
    componentWarningBroadAABB(c, maxSpacing),
  );
  const maxSpan = Math.max(
    ...bounds.map((b) => Math.max(b.x2 - b.x1, b.y2 - b.y1)),
    1,
  );
  const cellSize = Math.max(16, Math.min(32, maxSpan));
  const buckets = new Map();
  const seenPairs = new Set();
  for (let i = 0; i < n; i++) {
    const b = bounds[i];
    const ix1 = Math.floor(b.x1 / cellSize);
    const ix2 = Math.floor(b.x2 / cellSize);
    const iy1 = Math.floor(b.y1 / cellSize);
    const iy2 = Math.floor(b.y2 / cellSize);
    for (let ix = ix1; ix <= ix2; ix++) {
      for (let iy = iy1; iy <= iy2; iy++) {
        const key = `${ix},${iy}`;
        const bucket = buckets.get(key);
        if (bucket) {
          for (const prev of bucket) {
            const a = Math.min(prev, i);
            const bIdx = Math.max(prev, i);
            const pairKey = `${a}:${bIdx}`;
            if (seenPairs.has(pairKey)) continue;
            seenPairs.add(pairKey);
            const list = byStart.get(a);
            if (list) list.push(bIdx);
            else byStart.set(a, [bIdx]);
          }
          bucket.push(i);
        } else {
          buckets.set(key, [i]);
        }
      }
    }
  }
  for (const list of byStart.values()) list.sort((a, b) => a - b);
  return byStart;
}
function computeWarnings(components, widthMM, mountingHoles, pcb) {
  const warnings = [];
  warnings.push(...pcbHeightWarnings(pcb));
  const pairCandidatesByStart = buildWarningPairCandidateMap(components);
  for (let i = 0; i < components.length; i++) {
    const a = components[i];
    const holeExt = obbEdgeExtents(makeHoleOBB(a));
    if (holeExt.x1 < 0)
      warnings.push({
        ids: [a.id],
        message: `"${a.label || a.name}" hole exceeds left panel edge`,
        severity: "error",
      });
    if (holeExt.x2 > widthMM)
      warnings.push({
        ids: [a.id],
        message: `"${a.label || a.name}" hole exceeds right panel edge`,
        severity: "error",
      });
    if (holeExt.y1 < 0)
      warnings.push({
        ids: [a.id],
        message: `"${a.label || a.name}" hole exceeds top panel edge`,
        severity: "error",
      });
    if (holeExt.y2 > PANEL_HEIGHT_MM)
      warnings.push({
        ids: [a.id],
        message: `"${a.label || a.name}" hole exceeds bottom panel edge`,
        severity: "error",
      });
    const aName = a.label || a.name;
    const fe = getFrontExtents(a);
    if (fe.x1 < 0)
      warnings.push({
        ids: [a.id],
        message: `"${aName}" front shape exceeds/violates left panel edge`,
        severity: "warn",
      });
    if (fe.x2 > widthMM)
      warnings.push({
        ids: [a.id],
        message: `"${aName}" front shape exceeds/violates right panel edge`,
        severity: "warn",
      });
    if (fe.y1 < 0)
      warnings.push({
        ids: [a.id],
        message: `"${aName}" front shape exceeds/violates top panel edge`,
        severity: "warn",
      });
    if (fe.y2 > PANEL_HEIGHT_MM)
      warnings.push({
        ids: [a.id],
        message: `"${aName}" front shape exceeds/violates bottom panel edge`,
        severity: "warn",
      });
    if (a.rearBodyW > 0) {
      const be = obbEdgeExtents(makeBodyOBB(a));
      if (be.x1 < 0)
        warnings.push({
          ids: [a.id],
          message: `"${aName}" rear body exceeds left panel edge`,
          severity: "error",
        });
      if (be.x2 > widthMM)
        warnings.push({
          ids: [a.id],
          message: `"${aName}" rear body exceeds right panel edge`,
          severity: "error",
        });
      if (be.y1 < 0)
        warnings.push({
          ids: [a.id],
          message: `"${aName}" rear body exceeds top panel edge`,
          severity: "error",
        });
      if (be.y2 > PANEL_HEIGHT_MM)
        warnings.push({
          ids: [a.id],
          message: `"${aName}" rear body exceeds bottom panel edge`,
          severity: "error",
        });
    }
    if (a.keepoutW > 0) {
      const ke = obbEdgeExtents(makeKeepoutOBB(a));
      if (ke.x1 < 0)
        warnings.push({
          ids: [a.id],
          message: `"${aName}" rear keepout exceeds left panel edge`,
          severity: "warn",
        });
      if (ke.x2 > widthMM)
        warnings.push({
          ids: [a.id],
          message: `"${aName}" rear keepout exceeds right panel edge`,
          severity: "warn",
        });
      if (ke.y1 < 0)
        warnings.push({
          ids: [a.id],
          message: `"${aName}" rear keepout exceeds top panel edge`,
          severity: "warn",
        });
      if (ke.y2 > PANEL_HEIGHT_MM)
        warnings.push({
          ids: [a.id],
          message: `"${aName}" rear keepout exceeds bottom panel edge`,
          severity: "warn",
        });
    }
    if (mountingHoles.enabled) {
      for (const mh of mountingHoles.holes) {
        const dist = Math.hypot(a.x - mh.x, a.y - mh.y);
        const approxHoleRadius = Math.max(
          holeExt.x2 - a.x,
          a.x - holeExt.x1,
          holeExt.y2 - a.y,
          a.y - holeExt.y1,
        );
        const minDist =
          (mountingHoles.keepoutRadius ?? MOUNTING_HOLE_KEEPOUT_R_MM) +
          approxHoleRadius;
        if (dist < minDist) {
          warnings.push({
            ids: [a.id],
            message: `"${a.label || a.name}" too close to mounting hole (${(minDist - dist).toFixed(1)}mm overlap)`,
            severity: "error",
          });
        }
      }
    }
    for (const j of pairCandidatesByStart.get(i) ?? []) {
      const b = components[j];
      const nameA = `"${a.label || a.name}"`;
      const nameB = `"${b.label || b.name}"`;
      const koA = makeKeepoutOBB(a);
      const koB = makeKeepoutOBB(b);
      if (obbOverlap(koA, koB)) {
        const overlapX = a.keepoutW / 2 + b.keepoutW / 2 - Math.abs(a.x - b.x);
        const overlapY = a.keepoutH / 2 + b.keepoutH / 2 - Math.abs(a.y - b.y);
        const ovlp = Math.max(0, Math.min(overlapX, overlapY)).toFixed(1);
        warnings.push({
          ids: [a.id, b.id],
          message: `${nameA} and ${nameB} rear keepout zones overlap by ~${ovlp}mm`,
          severity: "error",
        });
      }
      if (a.rearBodyW > 0 && b.rearBodyW > 0) {
        const bdA = makeBodyOBB(a);
        const bdB = makeBodyOBB(b);
        if (obbOverlap(bdA, bdB)) {
          warnings.push({
            ids: [a.id, b.id],
            message: `${nameA} and ${nameB} rear bodies overlap`,
            severity: "error",
          });
        }
      }
      let edgeGap = frontClearance(a, b);
      if (getFrontShape(a) === "circle" && getFrontShape(b) === "circle") {
        const frontOverlap = -edgeGap;
        if (frontOverlap > 0) {
          warnings.push({
            ids: [a.id, b.id],
            message: `${nameA} and ${nameB} front diameters overlap by ${frontOverlap.toFixed(1)}mm`,
            severity: "error",
          });
        }
      } else if (obbOverlap(getFrontOBB(a), getFrontOBB(b))) {
        warnings.push({
          ids: [a.id, b.id],
          message: `${nameA} and ${nameB} front shapes overlap`,
          severity: "error",
        });
      }
      const minNeeded = Math.max(a.minSpacing, b.minSpacing);
      if (edgeGap >= 0 && edgeGap < minNeeded) {
        warnings.push({
          ids: [a.id, b.id],
          message: `${nameA} and ${nameB} closer than recommended spacing (${edgeGap.toFixed(1)}mm gap, ${minNeeded}mm recommended)`,
          severity: "warn",
        });
      }
      const ergoA = ergonomicDiameter(a);
      const ergoB = ergonomicDiameter(b);
      if (ergoA > 0 && ergoB > 0) {
        const knobOvlp = circleOverlap(
          a.x,
          a.y,
          ergoA / 2,
          b.x,
          b.y,
          ergoB / 2,
        );
        if (knobOvlp > 0) {
          const label =
            a.ergonomicEnabled || b.ergonomicEnabled
              ? "ergonomic/knob zones"
              : "knob diameters";
          warnings.push({
            ids: [a.id, b.id],
            message: `${nameA} and ${nameB} ${label} overlap by ${knobOvlp.toFixed(1)}mm`,
            severity: "warn",
          });
        }
      }
    }
  }
  if (pcb.enabled) {
    for (const c of components) {
      const inBounds =
        c.x - c.rearBodyW / 2 >= pcb.x &&
        c.x + c.rearBodyW / 2 <= pcb.x + pcb.width &&
        c.y - c.rearBodyH / 2 >= pcb.y &&
        c.y + c.rearBodyH / 2 <= pcb.y + pcb.height;
      if (!inBounds && c.rearBodyW > 0) {
        warnings.push({
          ids: [c.id],
          message: `"${c.label || c.name}" rear body is outside PCB bounds`,
          severity: "warn",
        });
      }
      if (c.rearDepth > pcb.depthLimit) {
        warnings.push({
          ids: [c.id],
          message: `"${c.label || c.name}" rear depth ${c.rearDepth}mm exceeds PCB depth limit ${pcb.depthLimit}mm`,
          severity: "warn",
        });
      }
    }
  }
  return warnings;
}
function computeMaxDepth(components) {
  return components.reduce((m, c) => Math.max(m, c.rearDepth), 0);
}
function distanceBetween(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
function edgeClearance(a, b) {
  return frontClearance(a, b);
}
function getScaleReferenceRadius(c) {
  const knobD =
    c.knobEnabled && typeof c.knobDiameter === "number" && c.knobDiameter > 0
      ? c.knobDiameter
      : typeof c.frontDiameter === "number" && c.frontDiameter > 0
        ? c.frontDiameter
        : c.holeDiameter;
  return Math.max(0.1, knobD / 2);
}
function makeCompactKnobScale(c, labelMode) {
  const knobR = getScaleReferenceRadius(c);
  return {
    id: crypto.randomUUID(),
    kind: "knob",
    componentId: c.id,
    x: c.x,
    y: c.y,
    radius: knobR + 1.0,
    startAngle: -135,
    endAngle: 135,
    ticks: 11,
    majorEvery: 2,
    tickLength: 0.85,
    labelMode,
    fontSizeMm: 1.05,
    layer: "foreground",
    visible: true,
    locked: false,
  };
}
function makeFaderScale(c, side, labelMode) {
  const slotH = c.slotLength ?? getFrontBounds(c).h;
  return {
    id: crypto.randomUUID(),
    kind: "fader",
    side,
    componentId: c.id,
    x: c.x,
    y: c.y,
    radius: Math.max(slotH / 2, 1),
    startAngle: 0,
    endAngle: 0,
    ticks: 11,
    majorEvery: 2,
    tickLength: 1.0,
    labelMode,
    fontSizeMm: 1.1,
    layer: "foreground",
    visible: true,
    locked: false,
  };
}
function degToRad(deg) {
  return (deg * Math.PI) / 180;
}
function obbVertices(o) {
  const r = degToRad(o.angle);
  const cos = Math.cos(r),
    sin = Math.sin(r);
  return [
    [o.hw, o.hh],
    [-o.hw, o.hh],
    [-o.hw, -o.hh],
    [o.hw, -o.hh],
  ].map(([x, y]) => [o.cx + x * cos - y * sin, o.cy + x * sin + y * cos]);
}
function obbAxes(o) {
  const r = degToRad(o.angle);
  const cos = Math.cos(r),
    sin = Math.sin(r);
  return [
    [cos, sin],
    [-sin, cos],
  ];
}
function projectOntoAxis(verts, axis) {
  const dots = verts.map(([x, y]) => x * axis[0] + y * axis[1]);
  return [Math.min(...dots), Math.max(...dots)];
}
function obbOverlap(a, b) {
  const va = obbVertices(a);
  const vb = obbVertices(b);
  for (const axis of [...obbAxes(a), ...obbAxes(b)]) {
    const [minA, maxA] = projectOntoAxis(va, axis);
    const [minB, maxB] = projectOntoAxis(vb, axis);
    if (maxA < minB || maxB < minA) return false;
  }
  return true;
}
function obbEdgeExtents(o) {
  const r = degToRad(o.angle);
  const cos = Math.abs(Math.cos(r)),
    sin = Math.abs(Math.sin(r));
  const extX = o.hw * cos + o.hh * sin;
  const extY = o.hh * cos + o.hw * sin;
  return { x1: o.cx - extX, x2: o.cx + extX, y1: o.cy - extY, y2: o.cy + extY };
}
function makeBodyOBB(c) {
  return {
    cx: c.x,
    cy: c.y,
    hw: c.rearBodyW / 2,
    hh: c.rearBodyH / 2,
    angle: c.rotation,
  };
}
function makeKeepoutOBB(c) {
  return {
    cx: c.x,
    cy: c.y,
    hw: c.keepoutW / 2,
    hh: c.keepoutH / 2,
    angle: c.rotation,
  };
}
function makeRearBodyFootprintOBBAt(c, x, y) {
  if (c.rearBodyW > 0 && c.rearBodyH > 0) {
    return {
      cx: x,
      cy: y,
      hw: c.rearBodyW / 2,
      hh: c.rearBodyH / 2,
      angle: c.rotation,
    };
  }
  if (c.keepoutW > 0 && c.keepoutH > 0 && c.type !== "customrect") {
    return {
      cx: x,
      cy: y,
      hw: c.keepoutW / 2,
      hh: c.keepoutH / 2,
      angle: c.rotation,
    };
  }
  const b = getFrontBounds(c);
  return {
    cx: x,
    cy: y,
    hw: b.w / 2,
    hh: b.h / 2,
    angle: getFrontShape(c) === "circle" ? 0 : c.rotation,
  };
}
function getRearBodyFootprintExtentsAt(c, x, y) {
  return obbEdgeExtents(makeRearBodyFootprintOBBAt(c, x, y));
}
function makeHoleOBB(c) {
  if (c.holeType === "slot") {
    return {
      cx: c.x,
      cy: c.y,
      hw: c.holeDiameter / 2,
      hh: (c.slotLength ?? c.holeDiameter) / 2,
      angle: c.rotation,
    };
  }
  if (c.holeType === "rect") {
    return {
      cx: c.x,
      cy: c.y,
      hw: (c.holeW ?? c.frontW ?? c.holeDiameter) / 2,
      hh: (c.holeH ?? c.frontH ?? c.holeDiameter) / 2,
      angle: c.rotation,
    };
  }
  return {
    cx: c.x,
    cy: c.y,
    hw: c.holeDiameter / 2,
    hh: c.holeDiameter / 2,
    angle: 0,
  };
}
function makeInitialState() {
  const panel = { widthHP: 8, customHP: false };
  const widthMM = panelWidthMM(panel);
  return {
    projectMeta: {
      name: "Untitled panel",
      revision: "A",
      author: "",
      notes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    panel,
    components: [],
    artworks: [],
    textItems: [],
    scaleItems: [],
    customParts: [],
    selected: [],
    selectedArtwork: null,
    selectedText: null,
    viewMode: "front",
    topHardwareStyle: "classic",
    hardwareRenderMode: "auto",
    mobilePerformanceMode: true,
    grid: { size: 1, showMajor: true },
    pcb: {
      enabled: false,
      x: 0,
      y: 9,
      width: widthMM,
      height: 110,
      depthLimit: 50,
    },
    mountingHoles: defaultMountingHoleConfig(widthMM),
    clipArtworkToPanel: true,
    ignoreLockedArtworkClicks: true,
    showArtworkInDrillView: false,
    drillArtworkOpacity: 0.3,
    layerVisibility: defaultLayerVisibility(),
    layerOpacity: {},
    layerExport: {},
    depthSettings: {
      caseDepthLimitMm: 45,
      pcbDistanceBehindPanelMm: 12,
      showPCBPlane: true,
    },
    dfmProfile: "generic",
    history: [],
    future: [],
  };
}
function snapshot(s) {
  const { history: _h, future: _f, ...rest } = s;
  return rest;
}
function withHistory(prev, next) {
  const history = [...prev.history.slice(-MAX_UNDO + 1), snapshot(prev)];
  return { ...next, history, future: [] };
}
function layerVisibilityForViewMode(prev, mode) {
  if (mode === "front") {
    return {
      ...prev,
      componentHoles: true,
      frontShapes: true,
      topHardware: true,
      rearBodies: false,
      rearKeepouts: false,
      labels: true,
    };
  }
  if (mode === "rear") {
    return {
      ...prev,
      componentHoles: true,
      frontShapes: false,
      topHardware: false,
      rearBodies: true,
      rearKeepouts: true,
      pcb: true,
      labels: true,
    };
  }
  if (mode === "drill") {
    return {
      ...prev,
      componentHoles: true,
      frontShapes: false,
      topHardware: false,
      rearBodies: false,
      rearKeepouts: false,
      pcb: false,
      labels: false,
      artwork: false,
      text: false,
    };
  }
  return {
    ...prev,
    componentHoles: true,
    frontShapes: true,
    topHardware: true,
    rearBodies: true,
    rearKeepouts: true,
    labels: true,
  };
}
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { error, info: null };
  }
  componentDidCatch(error, info) {
    console.error("Panel Designer render error:", error, info);
    this.setState({ error, info });
  }
  render() {
    if (this.state.error) {
      const message = this.state.error.message || String(this.state.error);
      const stack = this.state.error.stack || "";
      return React.createElement(
        "div",
        { className: "error-boundary-screen" },
        React.createElement(
          "div",
          { className: "error-boundary-card" },
          React.createElement("h1", null, "Panel Designer crashed safely"),
          React.createElement(
            "p",
            null,
            "The app hit a render error, but the page did not go black. Your browser autosave/local project data should still be available.",
          ),
          React.createElement(
            "div",
            { className: "error-boundary-message" },
            message,
          ),
          React.createElement(
            "div",
            { className: "error-boundary-actions" },
            React.createElement(
              "button",
              { onClick: () => window.location.reload() },
              "Reload app",
            ),
            React.createElement(
              "button",
              {
                onClick: () => {
                  const text = `Panel Designer crash\n\n${message}\n\n${stack}`;
                  if (navigator.clipboard && window.isSecureContext)
                    navigator.clipboard.writeText(text).catch(() => {});
                },
              },
              "Copy error",
            ),
          ),
          stack && React.createElement("pre", null, stack),
        ),
      );
    }
    return this.props.children;
  }
}
/* GridLayer moved to Canvas.js */

/* HPGuideLayer moved to Canvas.js */

/* MountingHolesLayer moved to Canvas.js */

/* PCBLayer moved to Canvas.js */

/* ArtworksLayer moved to Canvas.js */
/* TopHardwareLayer moved to Canvas.js */

/* TextLayer moved to Canvas.js */
/* ComponentsLayer moved to Canvas.js */

/* RearBodySnapFootprintLayer moved to Canvas.js */

/* DistanceGuidesLayer moved to Canvas.js */

/* RulerLayer moved to Canvas.js */
/* SelectionActionToolbar moved to Canvas.js */
/* ModeQuickSwitch moved to MobileDock.js */

/* CanvasLayerPanel moved to Canvas.js */

/* InspectorRail moved to Canvas.js */
/* SelectionMeasureFloat moved to Canvas.js */

/* CanvasMiniMap moved to Canvas.js */

/* SelectionHandles moved to Canvas.js */

/* MobileSafeZonesLayer moved to Canvas.js */

/* SVGCanvas moved to Canvas.js */
/* MobileQuickAdd moved to MobileDock.js */
/* ComponentLibraryPanel moved to LeftSidebarPanels.js */ /* TextPanel moved to LeftSidebarPanels.js */ /* ArtworkPanel moved to LeftSidebarPanels.js */
/* LeftSidebar moved to LeftSidebar.js */
/* NumField moved to RightSidebarPanels.js */ /* ComponentSourceCard moved to RightSidebarPanels.js */ /* PropertiesPanel moved to RightSidebarPanels.js */ /* downscaleArtworkImage moved to RightSidebarPanels.js */ /* ArtworkPropertiesPanel moved to RightSidebarPanels.js */ /* TextPropertiesPanel moved to RightSidebarPanels.js */
/* LayersPanel moved to LayerManager.js */
/* DepthViewPanel moved to RightSidebarPanels.js */ /* LayoutAssistantPanel moved to RightSidebarPanels.js */ /* DrillTablePanel moved to RightSidebarPanels.js */ /* AutosavePanel moved to RightSidebarPanels.js */ /* historySummary moved to RightSidebarPanels.js */ /* UndoHistoryPanel moved to RightSidebarPanels.js */ /* BOMPanel moved to RightSidebarPanels.js */ /* ManufacturingCheckPanel moved to RightSidebarPanels.js */ /* buildSelfCheckItems moved to RightSidebarPanels.js */ function runRuntimeSelfTest(
  state,
  warnings,
) {
  const out = [];
  function ok(message) {
    out.push({ level: "ok", message });
  }
  function warn(message) {
    out.push({ level: "warn", message });
  }
  function err(message) {
    out.push({ level: "error", message });
  }
  try {
    const widthMM = panelWidthMM(state.panel);
    Number.isFinite(widthMM) && widthMM > 0
      ? ok(`Panel width resolves to ${widthMM.toFixed(2)} mm.`)
      : err("Panel width is invalid.");
    const requiredTypes = [
      "jack",
      "pot9mm",
      "fader20",
      "fader20led",
      "slideSwitchMini",
      "tactled",
      "trimmer6mm",
      "led3mm",
    ];
    const libraryTypes = new Set(COMPONENT_LIBRARY.map((c) => c.type));
    const missingTypes = requiredTypes.filter((t) => !libraryTypes.has(t));
    missingTypes.length
      ? err(
          `Component library missing required type(s): ${missingTypes.join(", ")}.`,
        )
      : ok(
          `Component library contains ${requiredTypes.length} required baseline part types.`,
        );
    const normalized = validateAndNormalize(
      JSON.parse(serializeProject(state, true)),
    );
    normalized.ok
      ? ok("Project JSON serialize/load validation passes.")
      : err(`Project JSON validation failed: ${normalized.error}`);
    const hasLayerState =
      !!state.layerVisibility && !!state.layerOpacity && !!state.layerExport;
    hasLayerState
      ? ok("Layer Manager state is present: visibility/opacity/export flags.")
      : err("Layer Manager state is missing required fields.");
    const hwModeOk = ["auto", "classic", "realistic", "off"].includes(
      state.hardwareRenderMode || "auto",
    );
    hwModeOk
      ? ok(
          `Hardware render mode is valid: ${state.hardwareRenderMode || "auto"}.`,
        )
      : err("Hardware render mode is invalid.");
    const classicOk =
      state.topHardwareStyle === "classic" ||
      state.topHardwareStyle === "realistic";
    classicOk
      ? ok(`Hardware style state is valid: ${state.topHardwareStyle}.`)
      : err("Hardware style state is invalid.");
    const badComponents = state.components.filter(
      (c) =>
        !Number.isFinite(c.x) ||
        !Number.isFinite(c.y) ||
        !Number.isFinite(c.rotation),
    );
    badComponents.length
      ? err(
          `${badComponents.length} component(s) have invalid coordinates/rotation.`,
        )
      : ok("All placed components have finite coordinates.");
    const duplicateRefs = Array.from(
      new Set(
        state.components
          .map((c) => c.ref)
          .filter(
            (ref) =>
              ref && state.components.filter((cc) => cc.ref === ref).length > 1,
          ),
      ),
    );
    duplicateRefs.length
      ? warn(`Duplicate refs present: ${duplicateRefs.join(", ")}.`)
      : ok("No duplicate refs detected.");
    if (warnings.some((w) => w.severity === "error"))
      warn(
        "Current layout has DFM errors; runtime is OK but production is blocked.",
      );
    ok(
      "Diagnostics are lightweight; export generation is tested by using the actual Export actions.",
    );
  } catch (e) {
    err(`Diagnostics crashed: ${e?.message || String(e)}`);
  }
  return out;
} /* SelfCheckPanel moved to RightSidebarPanels.js */ /* WarningsPanel moved to RightSidebarPanels.js */ /* MeasurementsPanel moved to RightSidebarPanels.js */ /* AlignTools moved to RightSidebarPanels.js */ /* PCBPanel moved to RightSidebarPanels.js */ /* MountingHolesPanel moved to RightSidebarPanels.js */ /* LayoutStatusPanel moved to RightSidebarPanels.js */
/* RightSidebar moved to RightSidebar.js */
