function kicadNum(n) {
  const v = Number.isFinite(n) ? n : 0;
  return String(Math.round(v * 1000000) / 1000000);
}
function kicadStr(s) {
  return `"${String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')}"`;
}
function kicadRefPrefix(type) {
  if (type.includes("jack")) return "J";
  if (
    type.includes("pot") ||
    type.includes("trimmer") ||
    type.includes("fader")
  )
    return "RV";
  if (type.includes("switch") || type === "toggle") return "SW";
  if (type.includes("led")) return "D";
  if (type.includes("encoder")) return "ENC";
  return "H";
}
function kicadSafeName(s) {
  return (
    String(s || "part")
      .replace(/[^A-Za-z0-9_.+-]+/g, "_")
      .replace(/^_+|_+$/g, "") || "part"
  );
}
function rotatePointAround(px, py, cx, cy, deg) {
  const a = (deg * Math.PI) / 180;
  const dx = px - cx;
  const dy = py - cy;
  return {
    x: cx + dx * Math.cos(a) - dy * Math.sin(a),
    y: cy + dx * Math.sin(a) + dy * Math.cos(a),
  };
}
function kicadEdgeLine(x1, y1, x2, y2, width = 0.1) {
  return `  (gr_line (start ${kicadNum(x1)} ${kicadNum(y1)}) (end ${kicadNum(x2)} ${kicadNum(y2)}) (stroke (width ${kicadNum(width)}) (type solid)) (layer "Edge.Cuts") (tstamp ${crypto.randomUUID()}))`;
}
function kicadRectLines(
  cx,
  cy,
  w,
  h,
  rot = 0,
  layer = "Edge.Cuts",
  width = 0.1,
) {
  const pts = [
    rotatePointAround(cx - w / 2, cy - h / 2, cx, cy, rot),
    rotatePointAround(cx + w / 2, cy - h / 2, cx, cy, rot),
    rotatePointAround(cx + w / 2, cy + h / 2, cx, cy, rot),
    rotatePointAround(cx - w / 2, cy + h / 2, cx, cy, rot),
  ];
  return pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    return `  (gr_line (start ${kicadNum(p.x)} ${kicadNum(p.y)}) (end ${kicadNum(q.x)} ${kicadNum(q.y)}) (stroke (width ${kicadNum(width)}) (type solid)) (layer ${kicadStr(layer)}) (tstamp ${crypto.randomUUID()}))`;
  });
}
function kicadCircle(cx, cy, r, layer = "Dwgs.User", width = 0.08) {
  return `  (gr_circle (center ${kicadNum(cx)} ${kicadNum(cy)}) (end ${kicadNum(cx + r)} ${kicadNum(cy)}) (stroke (width ${kicadNum(width)}) (type solid)) (fill none) (layer ${kicadStr(layer)}) (tstamp ${crypto.randomUUID()}))`;
}
function kicadGrText(text, x, y, size = 1.2, rot = 0, layer = "F.SilkS") {
  const s = Math.max(0.3, size);
  return `  (gr_text ${kicadStr(text)} (at ${kicadNum(x)} ${kicadNum(y)} ${kicadNum(rot)}) (layer ${kicadStr(layer)}) (tstamp ${crypto.randomUUID()})
    (effects (font (size ${kicadNum(s)} ${kicadNum(s)}) (thickness ${kicadNum(Math.max(0.08, s * 0.12))})))
  )`;
}
function kicadNPTHFootprint(
  ref,
  name,
  x,
  y,
  type,
  d,
  slotLength,
  rot = 0,
  value,
  ovalAxis = "x",
) {
  const fp = kicadSafeName(name);
  const hole = Math.max(0.1, d || 3);
  const len = Math.max(hole, slotLength || hole);
  const padSize =
    type === "oval"
      ? ovalAxis === "x"
        ? `${kicadNum(len)} ${kicadNum(hole)}`
        : `${kicadNum(hole)} ${kicadNum(len)}`
      : `${kicadNum(hole)} ${kicadNum(hole)}`;
  const drill =
    type === "oval"
      ? ovalAxis === "x"
        ? `oval ${kicadNum(len)} ${kicadNum(hole)}`
        : `oval ${kicadNum(hole)} ${kicadNum(len)}`
      : `${kicadNum(hole)}`;
  const shape = type === "oval" ? "oval" : "circle";
  return `  (footprint "PanelDesigner:${fp}" (layer "F.Cu")
    (tstamp ${crypto.randomUUID()})
    (at ${kicadNum(x)} ${kicadNum(y)} ${kicadNum(rot)})
    (attr board_only exclude_from_pos_files exclude_from_bom)
    (property "Reference" ${kicadStr(ref)} (at 0 ${kicadNum(-(len / 2 + 2))} 0) (layer "F.SilkS") hide (effects (font (size 1 1) (thickness 0.15))))
    (property "Value" ${kicadStr(value || name)} (at 0 ${kicadNum(len / 2 + 2)} 0) (layer "F.Fab") hide (effects (font (size 1 1) (thickness 0.15))))
    (fp_text reference ${kicadStr(ref)} (at 0 ${kicadNum(-(len / 2 + 1.2))} 0) (layer "F.SilkS") hide (effects (font (size 1 1) (thickness 0.15))))
    (fp_text value ${kicadStr(value || name)} (at 0 ${kicadNum(len / 2 + 1.2)} 0) (layer "F.Fab") hide (effects (font (size 1 1) (thickness 0.15))))
    (pad "" np_thru_hole ${shape} (at 0 0) (size ${padSize}) (drill ${drill}) (layers "*.Cu" "*.Mask"))
  )`;
}
function exportKiCadPCB(state, options = DEFAULT_EXPORT_OPTIONS) {
  const widthMM = panelWidthMM(state.panel);
  const heightMM = PANEL_HEIGHT_MM;
  const includePanelOutline = options.kicadPanelOutline !== false;
  const includeMountingHoles = options.kicadMountingHoles !== false;
  const includeComponentHoles = options.kicadComponentHoles !== false;
  const includeRectCutouts = options.kicadRectCutouts !== false;
  const includeVisualOutlines = !!options.kicadVisualOutlines;
  const includeKeepoutHints = !!options.kicadKeepoutHints;
  const includeRefs = !!options.kicadRefs;
  const includeTextLabels = !!options.kicadTextLabels;
  const kicadOrigin = options.kicadOrigin || "top-left";
  const ox = kicadOrigin === "center" ? -widthMM / 2 : 0;
  const oy = kicadOrigin === "center" ? -heightMM / 2 : 0;
  const tx = (x) => x + ox;
  const ty = (y) => y + oy;
  const lines = [];
  const footprints = [];
  const graphics = [];
  if (includePanelOutline) {
    lines.push(kicadEdgeLine(tx(0), ty(0), tx(widthMM), ty(0)));
    lines.push(kicadEdgeLine(tx(widthMM), ty(0), tx(widthMM), ty(heightMM)));
    lines.push(kicadEdgeLine(tx(widthMM), ty(heightMM), tx(0), ty(heightMM)));
    lines.push(kicadEdgeLine(tx(0), ty(heightMM), tx(0), ty(0)));
  }
  if (includeMountingHoles && state.mountingHoles?.enabled) {
    for (let i = 0; i < state.mountingHoles.holes.length; i++) {
      const h = normalizeMountingHoleRail(state.mountingHoles.holes[i]);
      if (state.mountingHoles.holeShape === "oval") {
        footprints.push(
          kicadNPTHFootprint(
            `MH${i + 1}`,
            "Mounting_Hole_Oval",
            tx(h.x),
            ty(h.y),
            "oval",
            MOUNTING_HOLE_DIAMETER_MM,
            state.mountingHoles.ovalLength || 4.8,
            0,
            "Mounting hole",
            "x",
          ),
        );
      } else {
        footprints.push(
          kicadNPTHFootprint(
            `MH${i + 1}`,
            "Mounting_Hole",
            tx(h.x),
            ty(h.y),
            "circle",
            MOUNTING_HOLE_DIAMETER_MM,
            undefined,
            0,
            "Mounting hole",
          ),
        );
      }
      if (includeKeepoutHints && state.mountingHoles.showKeepouts)
        graphics.push(
          kicadCircle(
            tx(h.x),
            ty(h.y),
            state.mountingHoles.keepoutRadius || MOUNTING_HOLE_KEEPOUT_R_MM,
            "Cmts.User",
            0.06,
          ),
        );
    }
  }
  if (
    includeComponentHoles ||
    includeRectCutouts ||
    includeVisualOutlines ||
    includeKeepoutHints ||
    includeRefs
  ) {
    for (let i = 0; i < state.components.length; i++) {
      const c = state.components[i];
      const ref = c.ref || `${kicadRefPrefix(c.type)}${i + 1}`;
      const rot = c.rotation || 0;
      if (isDip8Socket(c)) {
        if (includeComponentHoles) {
          const pts = dip8SocketHoleCenters(c).map((p) => ({
            x: tx(p.x),
            y: ty(p.y),
          }));
          pts.forEach((p, pinIdx) =>
            footprints.push(
              kicadNPTHFootprint(
                `${ref}_${pinIdx + 1}`,
                c.name || c.type,
                p.x,
                p.y,
                "circle",
                c.holeDiameter || 1.05,
                undefined,
                0,
                `${shortPartName(c)} pin ${pinIdx + 1}`,
              ),
            ),
          );
        }
        if (includeVisualOutlines)
          graphics.push(
            ...kicadRectLines(
              tx(c.x),
              ty(c.y),
              c.frontW ?? 10.2,
              c.frontH ?? 10.2,
              rot,
              "Dwgs.User",
              0.08,
            ),
          );
        if (includeKeepoutHints)
          graphics.push(
            ...kicadRectLines(
              tx(c.x),
              ty(c.y),
              c.keepoutW || 12,
              c.keepoutH || 12,
              rot,
              "Cmts.User",
              0.05,
            ),
          );
      } else if (c.holeType === "rect") {
        const w = c.holeW ?? c.frontW ?? c.holeDiameter ?? 3;
        const h = c.holeH ?? c.frontH ?? c.holeDiameter ?? 3;
        if (includeRectCutouts)
          lines.push(
            ...kicadRectLines(tx(c.x), ty(c.y), w, h, rot, "Edge.Cuts", 0.1),
          );
        if (includeVisualOutlines)
          graphics.push(
            ...kicadRectLines(
              tx(c.x),
              ty(c.y),
              c.frontW ?? w,
              c.frontH ?? h,
              rot,
              "Dwgs.User",
              0.08,
            ),
          );
      } else if (c.holeType === "slot") {
        if (includeComponentHoles)
          footprints.push(
            kicadNPTHFootprint(
              ref,
              c.name || c.type,
              tx(c.x),
              ty(c.y),
              "oval",
              c.holeDiameter || 3,
              c.slotLength || c.holeDiameter || 3,
              rot,
              shortPartName(c),
              "y",
            ),
          );
        if (includeKeepoutHints)
          graphics.push(
            ...kicadRectLines(
              tx(c.x),
              ty(c.y),
              c.keepoutW || (c.holeDiameter || 3) + 2,
              c.keepoutH || (c.slotLength || 3) + 2,
              rot,
              "Cmts.User",
              0.05,
            ),
          );
      } else {
        if (includeComponentHoles)
          footprints.push(
            kicadNPTHFootprint(
              ref,
              c.name || c.type,
              tx(c.x),
              ty(c.y),
              "circle",
              c.holeDiameter || 3,
              undefined,
              rot,
              shortPartName(c),
            ),
          );
        if (includeVisualOutlines)
          graphics.push(
            kicadCircle(
              tx(c.x),
              ty(c.y),
              (c.frontDiameter || c.holeDiameter || 3) / 2,
              "Dwgs.User",
              0.08,
            ),
          );
        if (includeKeepoutHints)
          graphics.push(
            kicadCircle(
              tx(c.x),
              ty(c.y),
              Math.max(c.keepoutW || 0, c.keepoutH || 0, c.holeDiameter || 3) /
                2,
              "Cmts.User",
              0.05,
            ),
          );
      }
      if (includeRefs)
        graphics.push(
          kicadGrText(
            ref,
            tx(c.x),
            ty(c.y) - Math.max(2.5, (c.frontDiameter || c.frontH || 6) / 2 + 2),
            1.0,
            0,
            "F.SilkS",
          ),
        );
    }
  }
  if (includeTextLabels) {
    for (const t of state.textItems) {
      if (!t.visible) continue;
      graphics.push(
        kicadGrText(
          t.text || "TEXT",
          tx(t.x),
          ty(t.y),
          Math.max(0.6, t.fontSizeMm || 1.2),
          t.rotation || 0,
          t.layer === "background" ? "B.SilkS" : "F.SilkS",
        ),
      );
    }
  }
  const board = `(kicad_pcb
  (version 20221018)
  (generator "Panel Designer KiCad mechanical export")
  (general
    (thickness 1.6)
  )
  (paper "A4")
  (layers
    (0 "F.Cu" signal)
    (31 "B.Cu" signal)
    (32 "B.Adhes" user)
    (33 "F.Adhes" user)
    (34 "B.Paste" user)
    (35 "F.Paste" user)
    (36 "B.SilkS" user)
    (37 "F.SilkS" user)
    (38 "B.Mask" user)
    (39 "F.Mask" user)
    (44 "Edge.Cuts" user)
    (45 "Margin" user)
    (46 "B.CrtYd" user)
    (47 "F.CrtYd" user)
    (48 "B.Fab" user)
    (49 "F.Fab" user)
    (50 "User.1" user)
    (51 "User.2" user)
    (52 "User.3" user)
    (53 "User.4" user)
    (54 "User.5" user)
    (55 "User.6" user)
    (56 "User.7" user)
    (57 "User.8" user)
    (58 "User.9" user)
    (59 "Dwgs.User" user)
    (60 "Cmts.User" user)
  )
  (setup
    (pad_to_mask_clearance 0)
    (grid_origin 0 0)
  )
${lines.join("\n")}
${graphics.join("\n")}
${footprints.join("\n")}
)
`;
  const base = safeProjectFileName(
    state.projectMeta?.name || "panel-layout",
  ).replace(/\.json$/i, "");
  void saveTextFile(`${base}.kicad_pcb`, board, "application/x-kicad-pcb");
}
