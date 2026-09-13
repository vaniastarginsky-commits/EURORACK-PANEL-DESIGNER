// Eagle 6+ XML .brd import parser.
// Parses Eagle board files and converts elements to panel components.
// Depends on: HP_TO_MM, PANEL_HEIGHT_MM, mountingHolesForPreset,
//             sanitizePart (core.js),
//             COMPONENT_LIBRARY (components/library/componentDefinitions.js).
// Public API: parseEagleBrdToPanel(xmlSrc, currentPanelWidthMM).
function parseEagleBrdOutline(doc) {
  const pts = [];
  const wires = doc.querySelectorAll(
    'plain > wire[layer="20"], board > plain > wire[layer="20"]',
  );
  for (const w of wires) {
    const x1 = parseFloat(w.getAttribute("x1"));
    const y1 = parseFloat(w.getAttribute("y1"));
    const x2 = parseFloat(w.getAttribute("x2"));
    const y2 = parseFloat(w.getAttribute("y2"));
    if (!isNaN(x1)) pts.push({ x: x1, y: y1 });
    if (!isNaN(x2)) pts.push({ x: x2, y: y2 });
  }
  if (pts.length < 2) return null;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const xMin = Math.min(...xs),
    xMax = Math.max(...xs);
  const yMin = Math.min(...ys),
    yMax = Math.max(...ys);
  if (!(xMax > xMin) || !(yMax > yMin)) return null;
  return {
    x: xMin,
    y: yMin,
    width: xMax - xMin,
    height: yMax - yMin,
    maxY: yMax,
  };
}
function parseEaglePlainCutouts(doc) {
  const cutouts = [];
  const add = (x, y, diameter, source) => {
    if (![x, y, diameter].every(Number.isFinite) || diameter <= 0) return;
    if (
      cutouts.some(
        (item) =>
          Math.abs(item.x - x) < 0.001 &&
          Math.abs(item.y - y) < 0.001 &&
          Math.abs(item.diameter - diameter) < 0.001,
      )
    )
      return;
    cutouts.push({ x, y, diameter, source });
  };
  for (const hole of doc.querySelectorAll(
    "plain > hole, board > plain > hole",
  )) {
    add(
      parseFloat(hole.getAttribute("x")),
      parseFloat(hole.getAttribute("y")),
      parseFloat(hole.getAttribute("drill")),
      "hole",
    );
  }
  for (const circle of doc.querySelectorAll(
    'plain > circle[layer="20"], plain > circle[layer="46"], board > plain > circle[layer="20"], board > plain > circle[layer="46"]',
  )) {
    add(
      parseFloat(circle.getAttribute("x")),
      parseFloat(circle.getAttribute("y")),
      parseFloat(circle.getAttribute("radius")) * 2,
      `circle layer ${circle.getAttribute("layer")}`,
    );
  }
  return cutouts;
}
function parseEagleRotation(rotStr) {
  if (!rotStr) return 0;
  const m = rotStr.match(/M?R(\d+(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : 0;
}
function roundEaglePanelWidthToHP(widthMM) {
  const sourceHp = widthMM / HP_TO_MM;
  const hp = Math.max(2, Math.ceil(sourceHp - 1e-6));
  const roundedWidthMM = hp * HP_TO_MM;
  return {
    widthMM: roundedWidthMM,
    hp,
    rounded: Math.abs(roundedWidthMM - widthMM) > 0.01,
    sourceHp,
  };
}
function bestLibraryPartForEagle(name, pkg) {
  const hay = `${name} ${pkg}`.toLowerCase();
  const find = (type) => COMPONENT_LIBRARY.find((p) => p.type === type) || null;
  if (
    /thonkiconn|pj398sm|wqp-pj398sm|3\.5mm-jack|jack.*3\.5|3\.5.*jack/.test(hay)
  )
    return find("jack");
  if (/slim.*jack|cliff.*fc68|rean.*nys|jack.*6\.35|6\.35.*jack/.test(hay))
    return find("slimjack");
  if (/alpha-16mm|rd901f.*16|16mm.*pot|rv16/.test(hay)) return find("pot16mm");
  if (/alpha-9mm|rd901f|9mm.*pot|rv09/.test(hay)) return find("pot9mm");
  if (/ec12|pec11|encoder.*12|rotary.*enc/.test(hay)) return find("encoder");
  if (/fader.*45|ra.*slide.*45|ra4543/.test(hay)) return find("fader45");
  if (/fader.*30|fader.*35|ra.*slide.*(?:30|35)|ra3043/.test(hay))
    return find("fader35");
  if (/fader.*20.*led/.test(hay)) return find("fader20led");
  if (/fader.*20|slide.*pot/.test(hay)) return find("fader20");
  if (/led.*5mm|5mm.*led|tact.*led|thonk.*sw.*lp.*led/.test(hay))
    return find("tactled");
  if (/led.*3mm|3mm.*led/.test(hay)) return find("led3mm");
  if (/momentary.*12|sw.*push.*12|d6.*switch/.test(hay))
    return find("momentary12");
  if (/tact.*6mm|6mm.*tact|fsm.*switch|sw.*push.*6/.test(hay))
    return find("tact6mm");
  if (/sub.*mini/.test(hay)) return find("subMiniSwitch");
  if (/toggle|spdt|dpdt/.test(hay)) return find("toggle");
  if (/rotary.*8|rotary.*12|wafer/.test(hay)) return find("rotary8pos");
  if (/dip-8|socket.*8|diode.*socket/.test(hay)) return find("dip8socket");
  if (/trimmer|trim.*6/.test(hay)) return find("trimmer6mm");
  const n = name.toLowerCase();
  if (/^rv|^pot/.test(n)) return find("pot9mm");
  if (/^led/.test(n)) return find("led3mm");
  if (/^sw|^s\d/.test(n)) return find("tact6mm");
  if (/^enc/.test(n)) return find("encoder");
  return null;
}
function parseEagleBrdToPanel(xmlSrc, currentPanelWidthMM) {
  const warnings = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlSrc, "text/xml");
  if (doc.querySelector("parsererror")) {
    return {
      components: [],
      boardOutline: null,
      warnings: [
        "Eagle .brd file could not be parsed. Is this a valid Eagle 6+ XML file?",
      ],
    };
  }
  const outline = parseEagleBrdOutline(doc);
  const elements = [...doc.querySelectorAll("elements > element")];
  const plainCutouts = parseEaglePlainCutouts(doc);
  if (!elements.length && !plainCutouts.length && !outline) {
    return {
      components: [],
      boardOutline: outline,
      warnings: ["No panel outline, elements or mechanical holes found."],
    };
  }
  const allX = [
    ...elements.map((el) => parseFloat(el.getAttribute("x") || "0")),
    ...plainCutouts.map((hole) => hole.x),
  ];
  const allY = [
    ...elements.map((el) => parseFloat(el.getAttribute("y") || "0")),
    ...plainCutouts.map((hole) => hole.y),
  ];
  const boardMinX = outline ? outline.x : Math.min(...allX);
  const boardMaxY = outline ? outline.y + outline.height : Math.max(...allY);
  const boardWidth = outline
    ? outline.width
    : Math.max(10, Math.max(...allX) - Math.min(...allX) + 20);
  const boardHeight = outline
    ? outline.height
    : Math.max(10, Math.max(...allY) - Math.min(...allY) + 20);
  if (!outline) {
    warnings.push(
      "No Dimension (Layer 20) outline found. Components were centered on the current panel; verify origin manually.",
    );
  }
  if (boardHeight > PANEL_HEIGHT_MM + 0.5) {
    warnings.push(
      `Board outline height ${boardHeight.toFixed(2)} mm exceeds Eurorack 3U panel height ${PANEL_HEIGHT_MM} mm.`,
    );
  }
  const roundedPanel =
    outline && outline.width > 5
      ? roundEaglePanelWidthToHP(outline.width)
      : {
          widthMM: currentPanelWidthMM,
          hp: currentPanelWidthMM / HP_TO_MM,
          rounded: false,
          sourceHp: currentPanelWidthMM / HP_TO_MM,
        };
  if (roundedPanel.rounded) {
    warnings.push(
      `Board width ${boardWidth.toFixed(2)} mm = ${roundedPanel.sourceHp.toFixed(2)} HP; rounded to ${roundedPanel.hp} HP.`,
    );
  }
  const targetWidth = roundedPanel.widthMM;
  const xOffset = (targetWidth - boardWidth) / 2;
  const yOffset = outline
    ? Math.max(0, (PANEL_HEIGHT_MM - boardHeight) / 2)
    : (PANEL_HEIGHT_MM - boardHeight) / 2;
  const usedRefs = new Set();
  const components = [];
  let skippedNonPanelCount = 0;
  elements.forEach((el, idx) => {
    const name = el.getAttribute("name") || "";
    const pkg = el.getAttribute("package") || "";
    const lib = el.getAttribute("library") || "";
    const ex = parseFloat(el.getAttribute("x") || "0");
    const ey = parseFloat(el.getAttribute("y") || "0");
    const rotStr = el.getAttribute("rot") || "";
    const rotation = parseEagleRotation(rotStr);
    const def = bestLibraryPartForEagle(name, pkg);
    if (!def) {
      skippedNonPanelCount++;
      return;
    }
    const sanitized = sanitizePart({
      ...def,
      verificationStatus: def.verificationStatus ?? "approximate",
    });
    let ref = name || `C${idx + 1}`;
    if (usedRefs.has(ref)) ref = `${ref}_${idx + 1}`;
    usedRefs.add(ref);
    const panelX = ex - boardMinX + xOffset;
    const panelY = boardMaxY - ey + yOffset;
    const noteLines = [
      `Imported from Eagle package: ${pkg}`,
      lib ? `Library: ${lib}` : "",
      `Eagle rotation: ${rotStr || "R0"}`,
    ].filter(Boolean);
    components.push({
      ...sanitized,
      id: crypto.randomUUID(),
      ref,
      label: name,
      x: Math.round(panelX * 1000) / 1000,
      y: Math.round(panelY * 1000) / 1000,
      rotation,
      notes: noteLines.join("\n"),
      locked: false,
    });
  });
  const automaticMountingHoles = mountingHolesForPreset(
    targetWidth,
    "autoOval",
  );
  let standardMountingHoleCount = 0;
  let importedCutoutCount = 0;
  plainCutouts.forEach((hole, idx) => {
    const panelX = hole.x - boardMinX + xOffset;
    const panelY = boardMaxY - hole.y + yOffset;
    const isStandardMountingHole = automaticMountingHoles.some(
      (mountingHole) =>
        Math.hypot(panelX - mountingHole.x, panelY - mountingHole.y) <= 1.25,
    );
    if (isStandardMountingHole) {
      standardMountingHoleCount++;
      return;
    }
    const diameter = Math.max(0.1, hole.diameter);
    const def = sanitizePart({
      type: "custom",
      name: `Eagle cutout Ø${diameter.toFixed(2)} mm`,
      holeDiameter: diameter,
      frontDiameter: diameter,
      rearBodyW: 0,
      rearBodyH: 0,
      rearDepth: 0,
      keepoutW: diameter + 2,
      keepoutH: diameter + 2,
      minSpacing: 1,
      category: "custom",
      topHardwareVisible: false,
      verificationStatus: "measured",
    });
    components.push({
      ...def,
      id: crypto.randomUUID(),
      ref: `CUT${importedCutoutCount + 1}`,
      label: `Ø${diameter.toFixed(2)}`,
      x: Math.round(panelX * 1000) / 1000,
      y: Math.round(panelY * 1000) / 1000,
      rotation: 0,
      notes: `Imported from Eagle mechanical ${hole.source}.`,
      locked: false,
    });
    importedCutoutCount++;
  });
  if (skippedNonPanelCount)
    warnings.push(
      `Ignored ${skippedNonPanelCount} elements that are not recognized front-panel parts.`,
    );
  if (importedCutoutCount)
    warnings.push(`Imported ${importedCutoutCount} mechanical panel cutouts.`);
  if (standardMountingHoleCount)
    warnings.push(
      `Matched ${standardMountingHoleCount} rail holes to automatic Eurorack mounting holes without duplicating them.`,
    );
  return {
    components,
    panelWidthMM: targetWidth,
    boardOutline: outline
      ? {
          x: outline.x,
          y: outline.y,
          width: outline.width,
          height: outline.height,
        }
      : null,
    warnings,
  };
}
