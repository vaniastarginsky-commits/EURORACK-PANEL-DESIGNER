// Eagle 6+ XML .brd import parser.
// Parses Eagle board files and converts elements to panel components.
// Depends on: HP_TO_MM, PANEL_HEIGHT_MM, sanitizePart (core.js),
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
  const find = (type) =>
    COMPONENT_LIBRARY.find((p) => p.type === type) || COMPONENT_LIBRARY[0];
  if (
    /thonkiconn|pj398sm|wqp-pj398sm|3\.5mm-jack|jack.*3\.5|3\.5.*jack/.test(hay)
  )
    return find("jack");
  if (/slim.*jack|cliff.*fc68|rean.*nys|jack.*6\.35|6\.35.*jack/.test(hay))
    return find("slimjack");
  if (/alpha-16mm|rd901f.*16|16mm.*pot|rv16/.test(hay)) return find("pot16mm");
  if (/alpha-9mm|rd901f|9mm.*pot|rv09/.test(hay)) return find("pot9mm");
  if (/ec12|pec11|encoder.*12|rotary.*enc/.test(hay)) return find("encoder");
  if (/fader.*45|ra.*slide.*45/.test(hay)) return find("fader45");
  if (/fader.*35|ra.*slide.*35/.test(hay)) return find("fader35");
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
  if (/^j/.test(n)) return find("jack");
  if (/^rv|^pot/.test(n)) return find("pot9mm");
  if (/^d\d|^led/.test(n)) return find("led3mm");
  if (/^sw|^s\d/.test(n)) return find("tact6mm");
  if (/^enc/.test(n)) return find("encoder");
  return sanitizePart({
    type: "custom",
    name: `Eagle ${name || pkg}`,
    holeDiameter: 6.0,
    frontDiameter: 8.0,
    rearBodyW: 10.0,
    rearBodyH: 10.0,
    rearDepth: 8,
    keepoutW: 12.0,
    keepoutH: 12.0,
    minSpacing: 1,
    category: "custom",
    verificationStatus: "approximate",
  });
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
  if (!elements.length) {
    return {
      components: [],
      boardOutline: outline,
      warnings: ["No <elements> found in Eagle .brd file."],
    };
  }
  const allX = elements.map((el) => parseFloat(el.getAttribute("x") || "0"));
  const allY = elements.map((el) => parseFloat(el.getAttribute("y") || "0"));
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
  const components = elements.map((el, idx) => {
    const name = el.getAttribute("name") || "";
    const pkg = el.getAttribute("package") || "";
    const lib = el.getAttribute("library") || "";
    const ex = parseFloat(el.getAttribute("x") || "0");
    const ey = parseFloat(el.getAttribute("y") || "0");
    const rotStr = el.getAttribute("rot") || "";
    const rotation = parseEagleRotation(rotStr);
    const def = bestLibraryPartForEagle(name, pkg);
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
    return {
      ...sanitized,
      id: crypto.randomUUID(),
      ref,
      label: name,
      x: Math.round(panelX * 1000) / 1000,
      y: Math.round(panelY * 1000) / 1000,
      rotation,
      notes: noteLines.join("\n"),
      locked: false,
    };
  });
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
