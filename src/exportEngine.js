function exportLayeredSVG(state, opts) {
  const selected = [
    opts.svgLayeredPanelBase,
    opts.svgLayeredArtwork,
    opts.svgLayeredHoles,
    opts.svgLayeredComponents,
    opts.svgLayeredText,
  ].some(Boolean);
  if (!selected) {
    alert("Select at least one layered SVG layer.");
    return;
  }
  const base = safeProjectFileName(
    state.projectMeta?.name || "panel-layout",
  ).replace(/\.json$/i, "");
  downloadTextFile(
    `${base}__layers.svg`,
    exportLayeredSVGString(state, opts),
    "image/svg+xml",
  );
}
function layeredSVGSeparateFiles(state, opts) {
  const base = safeProjectFileName(
    state.projectMeta?.name || "panel-layout",
  ).replace(/\.json$/i, "");
  const files = [];
  if (opts.svgLayeredPanelBase)
    files.push([
      `${base}__layer_01_panel-base.svg`,
      exportPNGSVGString(state, opts, {
        includeComponents: false,
        includeHoles: false,
        includeArtwork: false,
        includeText: false,
        transparentBg: false,
        includePanelOutline: true,
      }),
      "image/svg+xml",
    ]);
  if (opts.svgLayeredArtwork)
    files.push([
      `${base}__layer_02_artwork.svg`,
      exportPNGSVGString(state, opts, {
        includeComponents: false,
        includeHoles: false,
        includeArtwork: true,
        includeText: false,
        transparentBg: true,
        includePanelOutline: false,
      }),
      "image/svg+xml",
    ]);
  if (opts.svgLayeredHoles)
    files.push([
      `${base}__layer_03_holes.svg`,
      exportPNGSVGString(state, opts, {
        includeComponents: false,
        includeHoles: true,
        includeArtwork: false,
        includeText: false,
        transparentBg: true,
        includePanelOutline: false,
      }),
      "image/svg+xml",
    ]);
  if (opts.svgLayeredComponents)
    files.push([
      `${base}__layer_04_components.svg`,
      exportPNGSVGString(state, opts, {
        includeComponents: true,
        includeHoles: false,
        includeArtwork: false,
        includeText: false,
        transparentBg: true,
        includePanelOutline: false,
      }),
      "image/svg+xml",
    ]);
  if (opts.svgLayeredText)
    files.push([
      `${base}__layer_05_text.svg`,
      exportPNGSVGString(state, opts, {
        includeComponents: false,
        includeHoles: false,
        includeArtwork: false,
        includeText: true,
        transparentBg: true,
        includePanelOutline: false,
      }),
      "image/svg+xml",
    ]);
  files.push([
    `${base}__layered-svg-readme.txt`,
    `Layered SVG package\n\nSVG has no fully universal layer model.Some apps open one SVG as groups,not native layers.\nThis ZIP gives every layer as a separate same-size SVG so you can import/place them as separate layers in Photoshop,Illustrator,Affinity,Inkscape,GIMP,Krita,etc.\n\nSuggested stacking order bottom to top:\n1.panel-base\n2.artwork\n3.holes\n4.components\n5.text\n`,
    "text/plain",
  ]);
  return files;
}
function exportLayeredSVGPackage(state, opts) {
  const files = layeredSVGSeparateFiles(state, opts);
  if (files.length <= 1) {
    alert("Select at least one layered SVG layer.");
    return;
  }
  const base = safeProjectFileName(
    state.projectMeta?.name || "panel-layout",
  ).replace(/\.json$/i, "");
  downloadBlobFile(`${base}__layered-svg-package.zip`, createZipBlob(files));
}
function exportPNGSVGString(state, opts, cfg) {
  const widthMM = panelWidthMM(state.panel);
  const heightMM = PANEL_HEIGHT_MM;
  function escapeXml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  const exportLayer = (k) => state.layerExport?.[k] !== false;
  const holesLines = [];
  const componentLines = [];
  const textLines = [];
  const artworkLines = [];
  if (
    cfg.includeHoles &&
    state.mountingHoles.enabled &&
    exportLayer("mountingHoles")
  ) {
    for (const h of state.mountingHoles.holes) {
      if (state.mountingHoles.holeShape === "oval") {
        const ow = Math.max(
          state.mountingHoles.ovalLength ?? 4.8,
          MOUNTING_HOLE_DIAMETER_MM,
        );
        holesLines.push(
          `<rect x="${(h.x - ow / 2).toFixed(3)}"y="${(h.y - MOUNTING_HOLE_DIAMETER_MM / 2).toFixed(3)}"width="${ow.toFixed(3)}"height="${MOUNTING_HOLE_DIAMETER_MM.toFixed(3)}"rx="${(MOUNTING_HOLE_DIAMETER_MM / 2).toFixed(3)}"fill="white"stroke="#333"stroke-width="0.3"/>`,
        );
      } else {
        holesLines.push(
          `<circle cx="${h.x.toFixed(3)}"cy="${h.y.toFixed(3)}"r="${(MOUNTING_HOLE_DIAMETER_MM / 2).toFixed(3)}"fill="white"stroke="#333"stroke-width="0.3"/>`,
        );
      }
    }
  }
  for (const c of state.components) {
    if (cfg.includeComponents) {
      componentLines.push(
        `<!--${escapeXml((c.ref ? c.ref + " " : "") + (c.label || c.name))}|${c.type}-->`,
      );
      if (
        exportLayer("frontShapes") &&
        getFrontShape(c) !== "circle" &&
        !isFaderLike(c)
      ) {
        const b = getFrontBounds(c);
        const rot =
          c.rotation !== 0
            ? `transform="rotate(${c.rotation}, ${c.x.toFixed(3)}, ${c.y.toFixed(3)})"`
            : "";
        componentLines.push(
          `<rect x="${(c.x - b.w / 2).toFixed(3)}"y="${(c.y - b.h / 2).toFixed(3)}"width="${b.w.toFixed(3)}"height="${b.h.toFixed(3)}"fill="none"stroke="#999"stroke-width="0.25"${rot}/>`,
        );
      } else if (exportLayer("frontShapes") && getFrontShape(c) === "circle") {
        componentLines.push(
          `<circle cx="${c.x.toFixed(3)}"cy="${c.y.toFixed(3)}"r="${(c.frontDiameter / 2).toFixed(3)}"fill="none"stroke="#999"stroke-width="0.25"/>`,
        );
      }
    }
    if (cfg.includeHoles && exportLayer("componentHoles") && isDip8Socket(c)) {
      for (const p of dip8SocketHoleCenters(c))
        holesLines.push(
          `<circle cx="${p.x.toFixed(3)}"cy="${p.y.toFixed(3)}"r="${(c.holeDiameter / 2).toFixed(3)}"fill="white"stroke="#333"stroke-width="0.3"/>`,
        );
    } else if (
      cfg.includeHoles &&
      exportLayer("componentHoles") &&
      c.holeType === "slot"
    ) {
      const sl = c.slotLength ?? c.holeDiameter;
      const rot =
        c.rotation !== 0
          ? `transform="rotate(${c.rotation}, ${c.x.toFixed(3)}, ${c.y.toFixed(3)})"`
          : "";
      holesLines.push(
        `<rect x="${(c.x - c.holeDiameter / 2).toFixed(3)}"y="${(c.y - sl / 2).toFixed(3)}"width="${c.holeDiameter.toFixed(3)}"height="${sl.toFixed(3)}"rx="${(c.holeDiameter / 2).toFixed(3)}"fill="white"stroke="#333"stroke-width="0.3"${rot}/>`,
      );
    } else if (
      cfg.includeHoles &&
      exportLayer("componentHoles") &&
      c.holeType === "rect"
    ) {
      const hw = c.holeW ?? c.frontW ?? c.holeDiameter;
      const hh = c.holeH ?? c.frontH ?? c.holeDiameter;
      const rot =
        c.rotation !== 0
          ? `transform="rotate(${c.rotation}, ${c.x.toFixed(3)}, ${c.y.toFixed(3)})"`
          : "";
      holesLines.push(
        `<rect x="${(c.x - hw / 2).toFixed(3)}"y="${(c.y - hh / 2).toFixed(3)}"width="${hw.toFixed(3)}"height="${hh.toFixed(3)}"fill="white"stroke="#333"stroke-width="0.3"${rot}/>`,
      );
    } else if (cfg.includeHoles && exportLayer("componentHoles")) {
      holesLines.push(
        `<circle cx="${c.x.toFixed(3)}"cy="${c.y.toFixed(3)}"r="${(c.holeDiameter / 2).toFixed(3)}"fill="white"stroke="#333"stroke-width="0.3"/>`,
      );
    }
    if (cfg.includeText && opts.labels && exportLayer("labels")) {
      const label = getComponentLabelLayout(c, widthMM);
      textLines.push(
        `<text x="${label.x.toFixed(3)}"y="${label.y.toFixed(3)}"text-anchor="${label.anchor}"${label.baseline === "middle" ? ' dominant-baseline="middle"' : ""}font-size="2"fill="#333">${escapeXml(c.label || c.name)}</text>`,
      );
    }
  }
  if (cfg.includeArtwork && opts.includeArtwork && exportLayer("artwork")) {
    artworkLines.push(
      ...buildArtworkSVGLines(
        state.artworks,
        "background",
        widthMM,
        heightMM,
        state.clipArtworkToPanel,
      ),
    );
    artworkLines.push(
      ...buildArtworkSVGLines(
        state.artworks,
        "foreground",
        widthMM,
        heightMM,
        state.clipArtworkToPanel,
      ),
    );
  }
  if (cfg.includeText && exportLayer("text")) {
    textLines.push(...buildTextSVGLines(state.textItems, "background"));
    textLines.push(
      ...buildScaleSVGLines(state.scaleItems, state.components, "background"),
    );
    textLines.push(...buildTextSVGLines(state.textItems, "foreground"));
    textLines.push(
      ...buildScaleSVGLines(state.scaleItems, state.components, "foreground"),
    );
  }
  if (cfg.includeComponents && exportLayer("topHardware")) {
    componentLines.push(...buildTopHardwareSVGLines(state.components));
  }
  const bgRect = cfg.transparentBg
    ? ""
    : `<rect x="0"y="0"width="${widthMM.toFixed(3)}"height="${heightMM.toFixed(3)}"fill="#ccc"/>\n`;
  const outline =
    cfg.includePanelOutline !== false && exportLayer("panelOutline")
      ? `<rect x="0"y="0"width="${widthMM.toFixed(3)}"height="${heightMM.toFixed(3)}"fill="none"stroke="black"stroke-width="0.5"/>\n`
      : "";
  return `<?xml version="1.0"encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg"viewBox="0 0 ${widthMM.toFixed(3)} ${heightMM.toFixed(3)}"width="${widthMM.toFixed(3)}mm"height="${heightMM.toFixed(3)}mm">${bgRect}${artworkLines.join("\n")}${artworkLines.length ? "\n" : ""}${outline}${holesLines.join("\n")}${holesLines.length ? "\n" : ""}${componentLines.join("\n")}${componentLines.length ? "\n" : ""}${textLines.join("\n")}${textLines.length ? "\n" : ""}</svg>`;
}
async function rasterizeSVGToPNGBlob(svg, widthMM, heightMM, dpi = 300) {
  const pxPerMM = Math.max(1, dpi) / 25.4;
  const pixelWidth = Math.max(1, Math.round(widthMM * pxPerMM));
  const pixelHeight = Math.max(1, Math.round(heightMM * pxPerMM));
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const blob = await new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = pixelWidth;
          canvas.height = pixelHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas 2D context unavailable");
          ctx.clearRect(0, 0, pixelWidth, pixelHeight);
          ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
          canvas.toBlob((out) => {
            if (out) resolve(out);
            else reject(new Error("PNG encoding failed"));
          }, "image/png");
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Could not rasterize SVG"));
      img.src = url;
    });
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
function buildPNGExportPlan(state, opts) {
  const base = safeProjectFileName(
    state.projectMeta?.name || "panel-layout",
  ).replace(/\.json$/i, "");
  const plan = [];
  const transparent = !!opts.pngTransparentBg;
  if (opts.pngCombined) {
    plan.push({
      kind: "combined",
      filename: `${base}__panel.png`,
      svg: exportPNGSVGString(state, opts, {
        includeComponents: true,
        includeHoles: true,
        includeArtwork: true,
        includeText: true,
        transparentBg: transparent,
        includePanelOutline: true,
      }),
    });
  }
  if (opts.pngSeparateComponents) {
    plan.push({
      kind: "components",
      filename: `${base}__components.png`,
      svg: exportPNGSVGString(state, opts, {
        includeComponents: true,
        includeHoles: false,
        includeArtwork: false,
        includeText: false,
        transparentBg: true,
        includePanelOutline: false,
      }),
    });
  }
  if (opts.pngSeparateHoles) {
    plan.push({
      kind: "holes",
      filename: `${base}__holes.png`,
      svg: exportPNGSVGString(state, opts, {
        includeComponents: false,
        includeHoles: true,
        includeArtwork: false,
        includeText: false,
        transparentBg: true,
        includePanelOutline: false,
      }),
    });
  }
  if (opts.pngSeparateArtwork) {
    plan.push({
      kind: "artwork",
      filename: `${base}__artwork.png`,
      svg: exportPNGSVGString(state, opts, {
        includeComponents: false,
        includeHoles: false,
        includeArtwork: true,
        includeText: false,
        transparentBg: true,
        includePanelOutline: false,
      }),
    });
  }
  if (opts.pngSeparateText) {
    plan.push({
      kind: "text",
      filename: `${base}__text.png`,
      svg: exportPNGSVGString(state, opts, {
        includeComponents: false,
        includeHoles: false,
        includeArtwork: false,
        includeText: true,
        transparentBg: true,
        includePanelOutline: false,
      }),
    });
  }
  return plan;
}
async function exportPNG(state, opts) {
  const plan = buildPNGExportPlan(state, opts);
  if (!plan.length) {
    alert(
      "Select at least one PNG output: combined panel and/or one or more separate layer PNGs.",
    );
    return;
  }
  const widthMM = panelWidthMM(state.panel);
  const heightMM = PANEL_HEIGHT_MM;
  const dpi = Number.isFinite(opts.pngDpi) ? Math.max(72, opts.pngDpi) : 300;
  try {
    const rendered = await Promise.all(
      plan.map(async (item) => {
        const blob = await rasterizeSVGToPNGBlob(
          item.svg,
          widthMM,
          heightMM,
          dpi,
        );
        const bytes = new Uint8Array(await blob.arrayBuffer());
        return { ...item, blob, bytes };
      }),
    );
    if (rendered.length === 1) {
      downloadBlobFile(rendered[0].filename, rendered[0].blob);
      return;
    }
    const files = rendered.map((item) => [
      item.filename,
      item.bytes,
      "image/png",
    ]);
    const base = safeProjectFileName(
      state.projectMeta?.name || "panel-layout",
    ).replace(/\.json$/i, "");
    downloadBlobFile(`${base}__png-export.zip`, createZipBlob(files));
  } catch (e) {
    alert(`PNG export failed:${e?.message || e}`);
  }
}
async function rasterizeSVGToImageData(svg, widthMM, heightMM, dpi = 300) {
  const pxPerMM = Math.max(1, dpi) / 25.4;
  const pixelWidth = Math.max(1, Math.round(widthMM * pxPerMM));
  const pixelHeight = Math.max(1, Math.round(heightMM * pxPerMM));
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = pixelWidth;
          canvas.height = pixelHeight;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) throw new Error("Canvas 2D context unavailable");
          ctx.clearRect(0, 0, pixelWidth, pixelHeight);
          ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
          resolve(ctx.getImageData(0, 0, pixelWidth, pixelHeight));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Could not rasterize SVG for PSD"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
function psdPushU16BE(out, v) {
  out.push((v >>> 8) & 255, v & 255);
}
function psdPushI16BE(out, v) {
  psdPushU16BE(out, v < 0 ? 0x10000 + v : v);
}
function psdPushU32BE(out, v) {
  out.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255);
}
function psdPushAscii(out, s) {
  for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i) & 255);
}
function psdPushBytes(out, b) {
  for (const x of b) out.push(x & 255);
}
function psdPascalName(name) {
  const enc = new TextEncoder();
  const raw = enc.encode(String(name || "Layer").slice(0, 255));
  const out = [Math.min(255, raw.length)];
  for (let i = 0; i < Math.min(255, raw.length); i++) out.push(raw[i]);
  while (out.length % 4 !== 0) out.push(0);
  return out;
}
function psdChannelBytes(image, channel) {
  const src = image.data;
  const len = image.width * image.height;
  const out = new Uint8Array(len);
  for (let i = 0, j = channel; i < len; i++, j += 4) out[i] = src[j];
  return out;
}
function makeLayeredPSD(layers, composite) {
  const width = composite.width;
  const height = composite.height;
  const pixelCount = width * height;
  if (width > 30000 || height > 30000)
    throw new Error(
      "PSD maximum dimension is 30000 px. Lower DPI and try again.",
    );
  const header = [];
  psdPushAscii(header, "8BPS");
  psdPushU16BE(header, 1);
  header.push(0, 0, 0, 0, 0, 0);
  psdPushU16BE(header, 4);
  psdPushU32BE(header, height);
  psdPushU32BE(header, width);
  psdPushU16BE(header, 8);
  psdPushU16BE(header, 3);
  const colorModeData = [0, 0, 0, 0];
  const imageResources = [0, 0, 0, 0];
  const layerRecords = [];
  const layerPixelData = [];
  const channelIds = [0, 1, 2, -1];
  for (const layer of layers) {
    const img = layer.data;
    if (img.width !== width || img.height !== height)
      throw new Error("PSD layers have mismatched raster sizes.");
    psdPushU32BE(layerRecords, 0);
    psdPushU32BE(layerRecords, 0);
    psdPushU32BE(layerRecords, height);
    psdPushU32BE(layerRecords, width);
    psdPushU16BE(layerRecords, 4);
    for (const id of channelIds) {
      psdPushI16BE(layerRecords, id);
      psdPushU32BE(layerRecords, 2 + pixelCount);
    }
    psdPushAscii(layerRecords, "8BIM");
    psdPushAscii(layerRecords, "norm");
    layerRecords.push(Math.max(0, Math.min(255, layer.opacity ?? 255)));
    layerRecords.push(0);
    layerRecords.push(8);
    layerRecords.push(0);
    const extra = [];
    psdPushU32BE(extra, 0);
    psdPushU32BE(extra, 0);
    psdPushBytes(extra, psdPascalName(layer.name));
    psdPushU32BE(layerRecords, extra.length);
    psdPushBytes(layerRecords, extra);
    for (const channel of [0, 1, 2, 3]) {
      psdPushU16BE(layerPixelData, 0);
      psdPushBytes(layerPixelData, psdChannelBytes(img, channel));
    }
  }
  const layerInfo = [];
  psdPushI16BE(layerInfo, Math.min(32767, layers.length));
  psdPushBytes(layerInfo, layerRecords);
  psdPushBytes(layerInfo, layerPixelData);
  if (layerInfo.length % 2) layerInfo.push(0);
  const layerAndMaskBody = [];
  psdPushU32BE(layerAndMaskBody, layerInfo.length);
  psdPushBytes(layerAndMaskBody, layerInfo);
  psdPushU32BE(layerAndMaskBody, 0);
  const layerAndMaskSection = [];
  psdPushU32BE(layerAndMaskSection, layerAndMaskBody.length);
  psdPushBytes(layerAndMaskSection, layerAndMaskBody);
  const compositeData = [];
  psdPushU16BE(compositeData, 0);
  for (const channel of [0, 1, 2, 3])
    psdPushBytes(compositeData, psdChannelBytes(composite, channel));
  return new Blob(
    [
      new Uint8Array(header),
      new Uint8Array(colorModeData),
      new Uint8Array(imageResources),
      new Uint8Array(layerAndMaskSection),
      new Uint8Array(compositeData),
    ],
    { type: "image/vnd.adobe.photoshop" },
  );
}
async function exportPSD(state, opts) {
  const selected = [
    opts.psdPanelBase,
    opts.psdArtwork,
    opts.psdHoles,
    opts.psdComponents,
    opts.psdText,
  ].some(Boolean);
  if (!selected) {
    alert("Select at least one PSD layer.");
    return;
  }
  const widthMM = panelWidthMM(state.panel);
  const heightMM = PANEL_HEIGHT_MM;
  const dpi = Number.isFinite(opts.psdDpi) ? Math.max(72, opts.psdDpi) : 300;
  const layerDefs = [];
  if (opts.psdPanelBase)
    layerDefs.push({
      name: "Panel base",
      svg: exportPNGSVGString(state, opts, {
        includeComponents: false,
        includeHoles: false,
        includeArtwork: false,
        includeText: false,
        transparentBg: false,
        includePanelOutline: true,
      }),
    });
  if (opts.psdArtwork)
    layerDefs.push({
      name: "Artwork",
      svg: exportPNGSVGString(state, opts, {
        includeComponents: false,
        includeHoles: false,
        includeArtwork: true,
        includeText: false,
        transparentBg: true,
        includePanelOutline: false,
      }),
    });
  if (opts.psdHoles)
    layerDefs.push({
      name: "Holes",
      svg: exportPNGSVGString(state, opts, {
        includeComponents: false,
        includeHoles: true,
        includeArtwork: false,
        includeText: false,
        transparentBg: true,
        includePanelOutline: false,
      }),
    });
  if (opts.psdComponents)
    layerDefs.push({
      name: "Components",
      svg: exportPNGSVGString(state, opts, {
        includeComponents: true,
        includeHoles: false,
        includeArtwork: false,
        includeText: false,
        transparentBg: true,
        includePanelOutline: false,
      }),
    });
  if (opts.psdText)
    layerDefs.push({
      name: "Text",
      svg: exportPNGSVGString(state, opts, {
        includeComponents: false,
        includeHoles: false,
        includeArtwork: false,
        includeText: true,
        transparentBg: true,
        includePanelOutline: false,
      }),
    });
  const compositeSvg = exportPNGSVGString(state, opts, {
    includeComponents: !!opts.psdComponents,
    includeHoles: !!opts.psdHoles,
    includeArtwork: !!opts.psdArtwork,
    includeText: !!opts.psdText,
    transparentBg: !opts.psdPanelBase,
    includePanelOutline: !!opts.psdPanelBase,
  });
  try {
    const [composite, ...layerImages] = await Promise.all([
      rasterizeSVGToImageData(compositeSvg, widthMM, heightMM, dpi),
      ...layerDefs.map((l) =>
        rasterizeSVGToImageData(l.svg, widthMM, heightMM, dpi),
      ),
    ]);
    const layers = layerDefs.map((l, i) => ({
      name: l.name,
      data: layerImages[i],
    }));
    const blob = makeLayeredPSD(layers, composite);
    const base = safeProjectFileName(
      state.projectMeta?.name || "panel-layout",
    ).replace(/\.json$/i, "");
    downloadBlobFile(`${base}__layers.psd`, blob);
  } catch (e) {
    alert(`PSD export failed:${e?.message || e}`);
  }
}
function drillTableCSVString(state, warnings) {
  const header = [
    "Ref",
    "Label",
    "Type",
    "Part name",
    "Manufacturer",
    "Part number",
    "Verification",
    "X mm",
    "Y mm",
    "Rotation deg",
    "Hole type",
    "Hole W/Ø",
    "Hole H/Slot L",
    "Front shape",
    "Front W",
    "Front H",
    "Rear body W",
    "Rear body H",
    "Rear depth",
    "Keepout W",
    "Keepout H",
    "Warning count",
  ];
  const rows = drillTableRows(state, warnings).map((r) =>
    r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
  );
  return [header.join(","), ...rows].join("\n");
}
function disabledExportLayers(state) {
  const labels = [
    ["panelOutline", "panel outline"],
    ["mountingHoles", "mounting holes"],
    ["artwork", "artwork"],
    ["text", "text/scales"],
    ["labels", "component labels"],
    ["componentHoles", "component holes"],
    ["frontShapes", "front shapes"],
    ["topHardware", "top hardware"],
    ["rearBodies", "rear bodies"],
    ["rearKeepouts", "rear keepouts"],
    ["pcb", "PCB"],
  ];
  return labels
    .filter(([k]) => state.layerExport?.[k] === false)
    .map(([, label]) => label);
}
function exportPackageFiles(state, warnings) {
  const base = safeProjectFileName(
    state.projectMeta?.name || "panel-layout",
  ).replace(/\.json$/i, "");
  return [
    [
      `${base}__front-artwork.svg`,
      exportSVGString(state, {
        drillOnly: false,
        labels: true,
        rearKeepout: false,
        rearBody: false,
        centerMarks: false,
        mountingKeepouts: false,
        includeArtwork: true,
      }),
      "image/svg+xml",
    ],
    [
      `${base}__drill-cut.svg`,
      exportSVGString(state, {
        drillOnly: true,
        labels: false,
        rearKeepout: false,
        rearBody: false,
        centerMarks: true,
        mountingKeepouts: true,
        includeArtwork: false,
      }),
      "image/svg+xml",
    ],
    [
      `${base}__rear-keepout.svg`,
      exportSVGString(state, {
        drillOnly: false,
        labels: true,
        rearKeepout: true,
        rearBody: true,
        centerMarks: true,
        mountingKeepouts: true,
        includeArtwork: false,
      }),
      "image/svg+xml",
    ],
    [
      `${base}__layers.svg`,
      exportLayeredSVGString(state, {
        ...DEFAULT_EXPORT_OPTIONS,
        svgLayeredPanelBase: true,
        svgLayeredComponents: true,
        svgLayeredHoles: true,
        svgLayeredArtwork: true,
        svgLayeredText: true,
      }),
      "image/svg+xml",
    ],
    [
      `${base}__component-table.csv`,
      drillTableCSVString(state, warnings),
      "text/csv",
    ],
    [
      `${base}__manufacturing-report.md`,
      manufacturingReportText(state, warnings),
      "text/markdown",
    ],
    [
      `${base}__export-readme.txt`,
      `Eurorack Panel Designer export package\n\nLayer export flags respected. Disabled layers: ${disabledExportLayers(state).join(", ") || "none"}\n\nFiles:\n- front-artwork.svg\n- drill-cut.svg\n- rear-keepout.svg\n- component-table.csv\n- manufacturing-report.md\n- project.json\n\nAlways verify scale 1:1 before manufacturing.`,
      "text/plain",
    ],
    [
      `${base}__project.json`,
      serializeProject(state, true),
      "application/json",
    ],
  ];
}
const ZIP_CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++)
    c = ZIP_CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time: dosTime, date: dosDate };
}
function writeU16(arr, v) {
  arr.push(v & 255, (v >>> 8) & 255);
}
function writeU32(arr, v) {
  arr.push(v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255);
}
function createZipBlob(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const now = dosDateTime();
  for (const [name, content] of files) {
    const safeName = name.replace(/^\/+/, "").replace(/\\/g, "/");
    const nameBytes = encoder.encode(safeName);
    const data =
      typeof content === "string" ? encoder.encode(content) : content;
    const crc = crc32(data);
    const local = [];
    writeU32(local, 0x04034b50);
    writeU16(local, 20);
    writeU16(local, 0x0800);
    writeU16(local, 0);
    writeU16(local, now.time);
    writeU16(local, now.date);
    writeU32(local, crc);
    writeU32(local, data.length);
    writeU32(local, data.length);
    writeU16(local, nameBytes.length);
    writeU16(local, 0);
    localParts.push(new Uint8Array(local), nameBytes, data);
    const central = [];
    writeU32(central, 0x02014b50);
    writeU16(central, 20);
    writeU16(central, 20);
    writeU16(central, 0x0800);
    writeU16(central, 0);
    writeU16(central, now.time);
    writeU16(central, now.date);
    writeU32(central, crc);
    writeU32(central, data.length);
    writeU32(central, data.length);
    writeU16(central, nameBytes.length);
    writeU16(central, 0);
    writeU16(central, 0);
    writeU16(central, 0);
    writeU16(central, 0);
    writeU32(central, 0);
    writeU32(central, offset);
    centralParts.push(new Uint8Array(central), nameBytes);
    offset += local.length + nameBytes.length + data.length;
  }
  const centralSize = centralParts.reduce((sum, p) => sum + p.length, 0);
  const end = [];
  writeU32(end, 0x06054b50);
  writeU16(end, 0);
  writeU16(end, 0);
  writeU16(end, files.length);
  writeU16(end, files.length);
  writeU32(end, centralSize);
  writeU32(end, offset);
  writeU16(end, 0);
  return new Blob([...localParts, ...centralParts, new Uint8Array(end)], {
    type: "application/zip",
  });
}
function downloadExportPackageZip(state, warnings) {
  const base = safeProjectFileName(
    state.projectMeta?.name || "panel-layout",
  ).replace(/\.json$/i, "");
  const blob = createZipBlob(exportPackageFiles(state, warnings));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${base}__manufacturing-package.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
function downloadExportPackage(state, warnings) {
  downloadExportPackageZip(state, warnings);
}
function downloadExportPackageLooseFiles(state, warnings) {
  exportPackageFiles(state, warnings).forEach(([name, content, mime], idx) => {
    window.setTimeout(() => downloadTextFile(name, content, mime), idx * 180);
  });
}
function exportSVG(state, opts) {
  downloadTextFile(
    "panel-export.svg",
    exportSVGString(state, opts),
    "image/svg+xml",
  );
  return;
  const widthMM = panelWidthMM(state.panel);
  const heightMM = PANEL_HEIGHT_MM;
  function escapeXml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  const lines = [];
  if (opts.mountingKeepouts && state.mountingHoles.enabled) {
    const kr = Math.max(
      0,
      state.mountingHoles.keepoutRadius ?? MOUNTING_HOLE_KEEPOUT_R_MM,
    );
    for (const h of state.mountingHoles.holes) {
      if (
        !opts.drillOnly &&
        state.mountingHoles.showKeepouts !== false &&
        kr > 0
      ) {
        lines.push(
          `  <circle cx="${h.x.toFixed(3)}" cy="${h.y.toFixed(3)}" r="${kr.toFixed(3)}" fill="none" stroke="#aaa" stroke-width="0.2" stroke-dasharray="1 0.5"/>`,
        );
      }
      if (state.mountingHoles.holeShape === "oval") {
        const ow = Math.max(
          state.mountingHoles.ovalLength ?? 4.8,
          MOUNTING_HOLE_DIAMETER_MM,
        );
        lines.push(
          `  <rect x="${(h.x - ow / 2).toFixed(3)}" y="${(h.y - MOUNTING_HOLE_DIAMETER_MM / 2).toFixed(3)}" width="${ow.toFixed(3)}" height="${MOUNTING_HOLE_DIAMETER_MM.toFixed(3)}" rx="${(MOUNTING_HOLE_DIAMETER_MM / 2).toFixed(3)}" fill="white" stroke="#333" stroke-width="0.3"/>`,
        );
      } else {
        lines.push(
          `  <circle cx="${h.x.toFixed(3)}" cy="${h.y.toFixed(3)}" r="${(MOUNTING_HOLE_DIAMETER_MM / 2).toFixed(3)}" fill="white" stroke="#333" stroke-width="0.3"/>`,
        );
      }
    }
  }
  for (const c of state.components) {
    lines.push(
      `  <!-- ${escapeXml((c.ref ? c.ref + " " : "") + (c.label || c.name))} | ${c.type} | x=${c.x.toFixed(2)} y=${c.y.toFixed(2)} | hole Ø${c.holeDiameter}mm${c.holeType === "slot" ? `slot ${c.holeDiameter}×${c.slotLength ?? "?"}mm` : ""} | depth ${c.rearDepth}mm -->`,
    );
    if (!opts.drillOnly) {
      if (opts.rearKeepout && c.keepoutW > 0) {
        lines.push(
          `  <g transform="rotate(${c.rotation}, ${c.x.toFixed(3)}, ${c.y.toFixed(3)})">`,
        );
        lines.push(
          `    <rect x="${(c.x - c.keepoutW / 2).toFixed(3)}" y="${(c.y - c.keepoutH / 2).toFixed(3)}" width="${c.keepoutW.toFixed(3)}" height="${c.keepoutH.toFixed(3)}" fill="none" stroke="#f80" stroke-width="0.2" stroke-dasharray="1 0.5"/>`,
        );
        lines.push(`  </g>`);
      }
      if (opts.rearBody && c.rearBodyW > 0) {
        lines.push(
          `  <g transform="rotate(${c.rotation}, ${c.x.toFixed(3)}, ${c.y.toFixed(3)})">`,
        );
        lines.push(
          `    <rect x="${(c.x - c.rearBodyW / 2).toFixed(3)}" y="${(c.y - c.rearBodyH / 2).toFixed(3)}" width="${c.rearBodyW.toFixed(3)}" height="${c.rearBodyH.toFixed(3)}" fill="none" stroke="#f60" stroke-width="0.3"/>`,
        );
        lines.push(`  </g>`);
      }
      if (getFrontShape(c) !== "circle") {
        const b = getFrontBounds(c);
        const rot =
          c.rotation !== 0
            ? ` transform="rotate(${c.rotation}, ${c.x.toFixed(3)}, ${c.y.toFixed(3)})"`
            : "";
        lines.push(
          `  <rect x="${(c.x - b.w / 2).toFixed(3)}" y="${(c.y - b.h / 2).toFixed(3)}" width="${b.w.toFixed(3)}" height="${b.h.toFixed(3)}" fill="none" stroke="#999" stroke-width="0.25"${rot}/>`,
        );
      } else {
        lines.push(
          `  <circle cx="${c.x.toFixed(3)}" cy="${c.y.toFixed(3)}" r="${(c.frontDiameter / 2).toFixed(3)}" fill="none" stroke="#999" stroke-width="0.25"/>`,
        );
      }
    }
    if (c.holeType === "slot") {
      const sl = c.slotLength ?? c.holeDiameter;
      const rot =
        c.rotation !== 0
          ? ` transform="rotate(${c.rotation}, ${c.x.toFixed(3)}, ${c.y.toFixed(3)})"`
          : "";
      lines.push(
        `  <rect x="${(c.x - c.holeDiameter / 2).toFixed(3)}" y="${(c.y - sl / 2).toFixed(3)}" width="${c.holeDiameter.toFixed(3)}" height="${sl.toFixed(3)}" rx="${(c.holeDiameter / 2).toFixed(3)}" fill="white" stroke="#333" stroke-width="0.3"${rot}/>`,
      );
    } else if (c.holeType === "rect") {
      const hw = c.holeW ?? c.frontW ?? c.holeDiameter;
      const hh = c.holeH ?? c.frontH ?? c.holeDiameter;
      const rot =
        c.rotation !== 0
          ? ` transform="rotate(${c.rotation}, ${c.x.toFixed(3)}, ${c.y.toFixed(3)})"`
          : "";
      lines.push(
        `  <rect x="${(c.x - hw / 2).toFixed(3)}" y="${(c.y - hh / 2).toFixed(3)}" width="${hw.toFixed(3)}" height="${hh.toFixed(3)}" fill="white" stroke="#333" stroke-width="0.3"${rot}/>`,
      );
    } else {
      lines.push(
        `  <circle cx="${c.x.toFixed(3)}" cy="${c.y.toFixed(3)}" r="${(c.holeDiameter / 2).toFixed(3)}" fill="white" stroke="#333" stroke-width="0.3"/>`,
      );
    }
    if (opts.centerMarks && !opts.drillOnly) {
      const cm = 1.5;
      lines.push(
        `  <line x1="${(c.x - cm).toFixed(3)}" y1="${c.y.toFixed(3)}" x2="${(c.x + cm).toFixed(3)}" y2="${c.y.toFixed(3)}" stroke="#555" stroke-width="0.12"/>`,
      );
      lines.push(
        `  <line x1="${c.x.toFixed(3)}" y1="${(c.y - cm).toFixed(3)}" x2="${c.x.toFixed(3)}" y2="${(c.y + cm).toFixed(3)}" stroke="#555" stroke-width="0.12"/>`,
      );
    }
    if (opts.labels && !opts.drillOnly) {
      const ly = (c.y + getFrontBottomOffset(c) + 2.5).toFixed(3);
      lines.push(
        `  <text x="${c.x.toFixed(3)}" y="${ly}" text-anchor="middle" font-size="2" fill="#333">${escapeXml(c.label || c.name)}</text>`,
      );
    }
  }
  const bgArtLines =
    opts.includeArtwork && !opts.drillOnly
      ? buildArtworkSVGLines(
          state.artworks,
          "background",
          widthMM,
          heightMM,
          state.clipArtworkToPanel,
        )
      : [];
  const fgArtLines =
    opts.includeArtwork && !opts.drillOnly
      ? buildArtworkSVGLines(
          state.artworks,
          "foreground",
          widthMM,
          heightMM,
          state.clipArtworkToPanel,
        )
      : [];
  const bgTextLines = !opts.drillOnly
    ? buildTextSVGLines(state.textItems, "background")
    : [];
  const fgTextLines = !opts.drillOnly
    ? buildTextSVGLines(state.textItems, "foreground")
    : [];
  const bgScaleLines = !opts.drillOnly
    ? buildScaleSVGLines(state.scaleItems, state.components, "background")
    : [];
  const fgScaleLines = !opts.drillOnly
    ? buildScaleSVGLines(state.scaleItems, state.components, "foreground")
    : [];
  const topHardwareLines = !opts.drillOnly
    ? buildTopHardwareSVGLines(state.components)
    : [];
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Eurorack Panel Designer export -->
<!-- Panel: ${state.panel.widthHP}HP = ${widthMM.toFixed(2)}mm x ${heightMM}mm -->
<!-- WARNING: Dimensions are planning estimates. Verify all parts with datasheets/calipers before manufacturing. -->
<svg xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 ${widthMM.toFixed(3)} ${heightMM.toFixed(3)}"
  width="${widthMM.toFixed(3)}mm" height="${heightMM.toFixed(3)}mm">
  <rect x="0" y="0" width="${widthMM.toFixed(3)}" height="${heightMM.toFixed(3)}" fill="#ccc"/>
${bgArtLines.join("\n")}${bgArtLines.length ? "\n" : ""}${bgTextLines.join("\n")}${bgTextLines.length ? "\n" : ""}${bgScaleLines.join("\n")}${bgScaleLines.length ? "\n" : ""}  <rect x="0" y="0" width="${widthMM.toFixed(3)}" height="${heightMM.toFixed(3)}" fill="none" stroke="black" stroke-width="0.5"/>
${lines.join("\n")}
${fgTextLines.length ? fgTextLines.join("\n") + "\n" : ""}${fgArtLines.length ? fgArtLines.join("\n") + "\n" : ""}</svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "panel.svg";
  a.click();
  URL.revokeObjectURL(url);
}
function fallbackCopy(text) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}
function copyTable(components) {
  const header =
    "Name\tType\tX (mm)\tY (mm)\tHole Ø (mm)\tFront Ø (mm)\tRear Depth (mm)";
  const rows = components.map((c) =>
    [
      c.label || c.name,
      c.type,
      c.x.toFixed(2),
      c.y.toFixed(2),
      c.holeDiameter.toFixed(1),
      c.frontDiameter.toFixed(1),
      c.rearDepth.toFixed(1),
    ].join("\t"),
  );
  const text = [header, ...rows].join("\n");
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
/* preset layout helpers moved to PresetLayouts.js */ function sexprBlocks(
  src,
  head,
) {
  const blocks = [];
  let i = 0;
  const needle = `(${head}`;
  while ((i = src.indexOf(needle, i)) !== -1) {
    let depth = 0;
    let inString = false;
    let esc = false;
    const start = i;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (inString) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === "(") depth++;
      else if (ch === ")") {
        depth--;
        if (depth === 0) {
          blocks.push(src.slice(start, i + 1));
          i++;
          break;
        }
      }
    }
  }
  return blocks;
}
function sexprHeadName(block) {
  const m =
    block.match(/^\(footprint\s+"([^"]+)"/) ||
    block.match(/^\(footprint\s+([^\s\)]+)/);
  return m ? m[1] : "KiCad Footprint";
}
function parseAt(block) {
  const m = block.match(
    /\(at\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?))?/,
  );
  if (!m) return null;
  return { x: +m[1], y: +m[2], rot: m[3] ? +m[3] : 0 };
}
function parseKiCadProperty(block, name) {
  const m = block.match(
    new RegExp(
      '\\(property\\s+"' +
        name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
        '"\\s+"([^"]*)"',
    ),
  );
  return m ? m[1] : "";
}
function parseFpText(block, kind) {
  const propName = kind === "reference" ? "Reference" : "Value";
  const prop = parseKiCadProperty(block, propName);
  if (prop) return prop;
  const quoted = block.match(
    new RegExp("\\(fp_text\\s+" + kind + '\\s+"([^"]*)"'),
  );
  if (quoted) return quoted[1];
  const bare = block.match(
    new RegExp("\\(fp_text\\s+" + kind + "\\s+([^\\s\\)]+)"),
  );
  return bare ? bare[1] : "";
}
function parseFpReference(block) {
  return parseFpText(block, "reference");
}
function parseFpValue(block) {
  return parseFpText(block, "value");
}
function parseFpDescription(block) {
  const prop = parseKiCadProperty(block, "Description");
  if (prop) return prop;
  const m =
    block.match(/\(descr\s+"([^"]*)"\)/) ||
    block.match(/\(description\s+"([^"]*)"\)/);
  return m ? m[1] : "";
}
function parseKiCadGraphicPrimitives(block) {
  const circles = sexprBlocks(block, "fp_circle")
    .map((c) => {
      const center = c.match(
        /\(center\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/,
      );
      const end = c.match(/\(end\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/);
      const layer = c.match(/\(layer\s+"?([^"\)\s]+)"?\)/)?.[1] || "";
      if (!center || !end) return null;
      const cx = +center[1],
        cy = +center[2],
        ex = +end[1],
        ey = +end[2];
      return { cx, cy, r: Math.hypot(ex - cx, ey - cy), layer };
    })
    .filter(Boolean);
  const rects = sexprBlocks(block, "fp_rect")
    .map((r) => {
      const start = r.match(
        /\(start\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/,
      );
      const end = r.match(/\(end\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/);
      const layer = r.match(/\(layer\s+"?([^"\)\s]+)"?\)/)?.[1] || "";
      if (!start || !end) return null;
      const x1 = +start[1],
        y1 = +start[2],
        x2 = +end[1],
        y2 = +end[2];
      return {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        w: Math.abs(x2 - x1),
        h: Math.abs(y2 - y1),
        layer,
      };
    })
    .filter(Boolean);
  const lines = sexprBlocks(block, "fp_line")
    .map((l) => {
      const start = l.match(
        /\(start\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/,
      );
      const end = l.match(/\(end\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/);
      const layer = l.match(/\(layer\s+"?([^"\)\s]+)"?\)/)?.[1] || "";
      if (!start || !end) return null;
      return { x1: +start[1], y1: +start[2], x2: +end[1], y2: +end[2], layer };
    })
    .filter(Boolean);
  return { circles, rects, lines };
}
function isPanelGeometryLayer(layer) {
  return /^(F\.Fab|F\.SilkS|Dwgs\.User|Cmts\.User|Eco1\.User|Eco2\.User|Edge\.Cuts)$/i.test(
    layer,
  );
}
function parseKiCadPads(block) {
  return sexprBlocks(block, "pad")
    .map((p) => {
      const size = p.match(/\(size\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/);
      const at = p.match(
        /\(at\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?))?\)/,
      );
      const oval =
        /\(drill\s+oval\s+/.test(p) ||
        /^\(pad\s+[^\)]*\s+[^\)]*\s+oval\b/.test(p);
      const rect = /^\(pad\s+[^\)]*\s+[^\)]*\s+rect\b/.test(p);
      const roundrect = /^\(pad\s+[^\)]*\s+[^\)]*\s+roundrect\b/.test(p);
      const drill =
        p.match(/\(drill\s+oval\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/) ||
        p.match(/\(drill\s+(-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?))?\)/);
      const dw = drill ? +drill[1] : 0;
      const dh = drill ? +(drill[2] || drill[1]) : 0;
      return {
        drillW: dw,
        drillH: dh,
        sizeW: size ? +size[1] : 0,
        sizeH: size ? +size[2] : 0,
        oval,
        rect,
        roundrect,
        atX: at ? +at[1] : 0,
        atY: at ? +at[2] : 0,
        atRot: at && at[3] ? +at[3] : 0,
      };
    })
    .filter((p) => p.drillW > 0 || p.sizeW > 0 || p.sizeH > 0);
}
function kiCadFootprintGeometry(pads, graphics, hay = "") {
  if (/DIP-8|DIODE_SOCKET|Package_DIP:DIP-8|Socket.*8/i.test(hay)) {
    const drilled = pads.filter(
      (p) => p.drillW > 0 || p.sizeW > 0 || p.sizeH > 0,
    );
    const cx = drilled.length
      ? (Math.min(...drilled.map((p) => p.atX)) +
          Math.max(...drilled.map((p) => p.atX))) /
        2
      : 0;
    const cy = drilled.length
      ? (Math.min(...drilled.map((p) => p.atY)) +
          Math.max(...drilled.map((p) => p.atY))) /
        2
      : 0;
    return {
      holeDiameter: 1.05,
      rotationOffset: 0,
      offsetX: cx,
      offsetY: cy,
      anchorOnly: true,
      noPositionOffset: false,
      frontDiameter: 10.2,
      rearBodyW: 10.2,
      rearBodyH: 10.2,
    };
  }
  if (/Jack_3\.5mm_QingPu_WQP-PJ398SM|PJ398SM|Thonkiconn/i.test(hay)) {
    return {
      holeDiameter: 6.1,
      rotationOffset: 0,
      offsetX: 0,
      offsetY: 6.48,
      anchorOnly: true,
      noPositionOffset: false,
      frontDiameter: 8.0,
      rearBodyW: 8.5,
      rearBodyH: 10.5,
    };
  }
  if (/Potentiometer_Alpha_RD901F|RD901F/i.test(hay)) {
    return {
      holeDiameter: 7.0,
      rotationOffset: 0,
      offsetX: 7.5,
      offsetY: 2.5,
      anchorOnly: true,
      noPositionOffset: false,
      frontDiameter: 10.0,
      rearBodyW: 9.5,
      rearBodyH: 10.5,
    };
  }
  if (/SW_Tact_Low_Profile_LED|THONK-SW-LP-LED|Low_Profile_LED/i.test(hay)) {
    return {
      holeDiameter: 6.0,
      rotationOffset: 0,
      offsetX: 0,
      offsetY: 0,
      anchorOnly: true,
      noPositionOffset: true,
      frontDiameter: 6.0,
      rearBodyW: 8.0,
      rearBodyH: 8.0,
    };
  }
  const panelCircles = (graphics?.circles || [])
    .filter((c) => isPanelGeometryLayer(c.layer) && c.r >= 1.35 && c.r <= 20)
    .map((c) => ({ ...c, dist: Math.hypot(c.cx, c.cy) }));
  const largestCircle = panelCircles
    .filter((c) => c.r >= 2.2)
    .sort((a, b) => b.r - a.r || a.dist - b.dist)[0];
  const centralCircle =
    largestCircle ||
    panelCircles.sort((a, b) => a.dist - b.dist || b.r - a.r)[0];
  if (
    centralCircle &&
    (/jack|pj398|thonk|pot|rv09|rd901|encoder|ec12|button|tact|led|switch|cv|in_|out_|return|send/i.test(
      hay,
    ) ||
      centralCircle.dist < 1.5)
  ) {
    const d = centralCircle.r * 2;
    const padSpanW = pads.length
      ? Math.max(...pads.map((p) => p.atX)) -
        Math.min(...pads.map((p) => p.atX)) +
        Math.max(...pads.map((p) => p.sizeW || p.drillW || 0))
      : d;
    const padSpanH = pads.length
      ? Math.max(...pads.map((p) => p.atY)) -
        Math.min(...pads.map((p) => p.atY)) +
        Math.max(...pads.map((p) => p.sizeH || p.drillH || 0))
      : d;
    const isJackLike = /jack|pj398|thonk|cv|in_|out_|return|send/i.test(hay);
    const isPotLike = /pot|rv09|rd901|ssi2144|phase|drive|mix|freq|q/i.test(
      hay,
    );
    return {
      holeDiameter: d,
      rotationOffset: 0,
      offsetX: centralCircle.cx,
      offsetY: centralCircle.cy,
      anchorOnly: true,
      frontDiameter: d,
      rearBodyW:
        isJackLike || isPotLike
          ? Math.max(d + 2, Math.min(padSpanW, d + 8))
          : Math.max(padSpanW, d),
      rearBodyH:
        isJackLike || isPotLike
          ? Math.max(d + 2, Math.min(padSpanH, d + 8))
          : Math.max(padSpanH, d),
    };
  }
  if (!pads.length) return null;
  const drills = pads.filter((p) => p.drillW > 0 || p.drillH > 0);
  const sizes = pads.filter((p) => p.sizeW > 0 || p.sizeH > 0);
  const xs = pads.map((p) => p.atX);
  const ys = pads.map((p) => p.atY);
  const padSpanW = xs.length
    ? Math.max(...xs) -
      Math.min(...xs) +
      Math.max(...pads.map((p) => p.sizeW || p.drillW || 0))
    : 0;
  const padSpanH = ys.length
    ? Math.max(...ys) -
      Math.min(...ys) +
      Math.max(...pads.map((p) => p.sizeH || p.drillH || 0))
    : 0;
  const slot = drills.find(
    (p) =>
      p.oval || Math.abs((p.drillW || p.sizeW) - (p.drillH || p.sizeH)) > 1.0,
  );
  if (slot) {
    const w = slot.drillW || slot.sizeW;
    const h = slot.drillH || slot.sizeH;
    const dia = Math.max(0.1, Math.min(w, h));
    const len = Math.max(w, h);
    const rotOff = w >= h ? 90 : 0;
    return {
      holeType: "slot",
      holeDiameter: dia,
      slotLength: len,
      rotationOffset: rotOff,
      offsetX: slot.atX || 0,
      offsetY: slot.atY || 0,
      frontW: dia,
      frontH: len,
      frontDiameter: Math.max(dia, len),
      rearBodyW: Math.max(padSpanW, dia + 2),
      rearBodyH: Math.max(padSpanH, len + 2),
    };
  }
  const rectPad = sizes.find(
    (p) =>
      (p.rect || p.roundrect) &&
      Math.max(p.sizeW, p.sizeH) >= 2 &&
      Math.min(p.sizeW, p.sizeH) >= 1.0,
  );
  if (rectPad && !drills.length) {
    return {
      holeType: "rect",
      holeDiameter: Math.min(rectPad.sizeW, rectPad.sizeH),
      holeW: rectPad.sizeW,
      holeH: rectPad.sizeH,
      rotationOffset: rectPad.atRot || 0,
      offsetX: rectPad.atX || 0,
      offsetY: rectPad.atY || 0,
      frontW: rectPad.sizeW,
      frontH: rectPad.sizeH,
      frontDiameter: Math.max(rectPad.sizeW, rectPad.sizeH),
      rearBodyW: Math.max(padSpanW, rectPad.sizeW + 2),
      rearBodyH: Math.max(padSpanH, rectPad.sizeH + 2),
    };
  }
  const maxDrill = Math.max(
    0,
    ...drills.map((p) => Math.max(p.drillW, p.drillH)),
  );
  const maxPad = Math.max(0, ...sizes.map((p) => Math.max(p.sizeW, p.sizeH)));
  const d = maxDrill || Math.max(1, maxPad * 0.55);
  return {
    holeDiameter: d,
    rotationOffset: 0,
    offsetX: 0,
    offsetY: 0,
    frontDiameter: Math.max(d, maxPad || d),
    rearBodyW: Math.max(padSpanW, maxPad, d + 2),
    rearBodyH: Math.max(padSpanH, maxPad, d + 2),
  };
}
function boardOutlineFromKiCad(src) {
  const pts = [];
  const edgeBlocks = [
    ...sexprBlocks(src, "gr_line"),
    ...sexprBlocks(src, "gr_rect"),
    ...sexprBlocks(src, "gr_arc"),
  ].filter((b) => /\(layer\s+"?Edge\.Cuts"?\)/.test(b));
  for (const b of edgeBlocks) {
    const pairs = [
      ...b.matchAll(
        /\((?:start|end|xy)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/g,
      ),
    ];
    for (const p of pairs) pts.push({ x: +p[1], y: +p[2] });
  }
  if (pts.length < 2) return null;
  const xs = pts.map((p) => p.x),
    ys = pts.map((p) => p.y);
  const x1 = Math.min(...xs),
    x2 = Math.max(...xs),
    y1 = Math.min(...ys),
    y2 = Math.max(...ys);
  if (!(x2 > x1) || !(y2 > y1)) return null;
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}
function bestLibraryPartForKiCad(ref, fp, pads) {
  const hay = `${ref} ${fp}`.toLowerCase();
  const exactFind = (type) =>
    COMPONENT_LIBRARY.find((p) => p.type === type) || COMPONENT_LIBRARY[0];
  if (/DIP-8|DIODE_SOCKET|Package_DIP:DIP-8|Socket.*8/i.test(`${ref} ${fp}`))
    return exactFind("dip8socket");
  if (/Jack_3\.5mm_QingPu_WQP-PJ398SM|pj398sm|thonkiconn/i.test(`${ref} ${fp}`))
    return exactFind("jack");
  if (/Potentiometer_Alpha_RD901F|rd901f/i.test(`${ref} ${fp}`))
    return exactFind("pot9mm");
  if (
    /SW_Tact_Low_Profile_LED|thonk-sw-lp-led|low_profile_led/i.test(
      `${ref} ${fp}`,
    )
  )
    return exactFind("tactled");
  const maxDrill = Math.max(
    0,
    ...pads.map((p) => Math.max(p.drillW, p.drillH)),
  );
  const maxSize = Math.max(0, ...pads.map((p) => Math.max(p.sizeW, p.sizeH)));
  const slot = pads.find((p) => p.oval || Math.abs(p.drillW - p.drillH) > 1.0);
  const find = (type) =>
    COMPONENT_LIBRARY.find((p) => p.type === type) || COMPONENT_LIBRARY[0];
  if (
    /fader|slider|slidepot|ra2045|rs?09|ptl/i.test(hay) ||
    (slot && Math.max(slot.drillW, slot.drillH) > 12)
  ) {
    const len = slot ? Math.max(slot.drillW, slot.drillH) : maxSize;
    if (len >= 40) return find("fader45");
    if (len >= 32) return find("fader35");
    return find(/led/i.test(hay) ? "fader20led" : "fader20");
  }
  if (/encoder|ec12|pec11/i.test(hay) || /^ENC/i.test(ref))
    return find("encoder");
  if (/jack|pj398|thonk|audio|conn_01x01|phone/i.test(hay) || /^J/i.test(ref))
    return maxDrill >= 8.5 ? find("slimjack") : find("jack");
  if (/led/i.test(hay) || /^D/i.test(ref) || /^LED/i.test(ref))
    return find(
      maxDrill >= 5.0 || /button|tact/i.test(hay) ? "tactled" : "led3mm",
    );
  if (/tact|fsm|button|push|sw_push/i.test(hay))
    return find(maxDrill >= 8.0 ? "momentary12" : "tact6mm");
  if (/slide.*switch|sub.?mini/i.test(hay)) return find("subMiniSwitch");
  if (/toggle|spdt|dpdt/i.test(hay)) return find("toggle");
  if (/rotary/i.test(hay)) return find("rotary8pos");
  if (/trimm?er|trim/i.test(hay)) return find("trimmer6mm");
  if (
    /pot|rv09|rk09|rd901|alpha|bourns/i.test(hay) ||
    /^RV/i.test(ref) ||
    /^POT/i.test(ref)
  ) {
    return maxDrill >= 7.1 || /16mm|rv16/i.test(hay)
      ? find("pot16mm")
      : find("pot9mm");
  }
  const d = maxDrill || Math.max(3, maxSize * 0.55);
  return sanitizePart({
    type: "custom",
    name: `KiCad ${ref || fp}`,
    holeDiameter: d,
    frontDiameter: Math.max(d + 1.5, maxSize || d),
    rearBodyW: Math.max(maxSize, d + 2),
    rearBodyH: Math.max(maxSize, d + 2),
    rearDepth: 8,
    keepoutW: Math.max(maxSize, d + 4),
    keepoutH: Math.max(maxSize, d + 4),
    minSpacing: 1,
    category: "custom",
    verificationStatus: "approximate",
  });
}
function rotateKiCadLocalOffset(dx, dy, deg) {
  const a = ((deg || 0) * Math.PI) / 180;
  const ca = Math.cos(a),
    sa = Math.sin(a);
  return { x: dx * ca + dy * sa, y: -dx * sa + dy * ca };
}
function normalizePanelRotation(deg) {
  const n = (((deg || 0) % 360) + 360) % 360;
  return Math.abs(n - 360) < 1e-6 ? 0 : Math.round(n * 1000) / 1000;
}
function kiCadRotationToPanelRotation(kicadDeg, offsetDeg = 0) {
  return normalizePanelRotation((kicadDeg || 0) + (offsetDeg || 0));
}
function roundKiCadPanelWidthToEurorackHP(widthMM) {
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
function parseKiCadPcbToPanel(src, currentPanelWidthMM) {
  const warnings = [];
  const outline = boardOutlineFromKiCad(src);
  const footprints = sexprBlocks(src, "footprint");
  const raw = [];
  for (const fpBlock of footprints) {
    const at = parseAt(fpBlock);
    if (!at) continue;
    const fp = sexprHeadName(fpBlock);
    const ref = parseFpReference(fpBlock);
    const value = parseFpValue(fpBlock);
    const description = parseFpDescription(fpBlock);
    const pads = parseKiCadPads(fpBlock);
    const isDip8Footprint =
      /DIP-8|DIODE_SOCKET|Package_DIP:DIP-8|Socket.*8/i.test(
        `${fp} ${ref} ${value}`,
      );
    const graphics = parseKiCadGraphicPrimitives(fpBlock);
    const hasPanelGraphic =
      graphics.circles.some(
        (c) => isPanelGeometryLayer(c.layer) && c.r >= 1.0,
      ) ||
      graphics.rects.some(
        (r) => isPanelGeometryLayer(r.layer) && r.w >= 1 && r.h >= 1,
      );
    if (
      !pads.length &&
      !hasPanelGraphic &&
      !/^(RV|R?POT|J|SW|S|D|LED|ENC|FDR|SL)/i.test(ref)
    )
      continue;
    if (
      !isDip8Footprint &&
      !hasPanelGraphic &&
      pads.length >= 4 &&
      /conn|header|pin|socket/i.test(`${fp} ${value}`) &&
      !/jack|pj398|audio/i.test(`${fp} ${value}`)
    )
      continue;
    const def = bestLibraryPartForKiCad(`${ref} ${value}`, fp, pads);
    raw.push({ ref, value, description, fp, fpBlock, at, pads, def });
  }
  if (!raw.length)
    return {
      components: [],
      boardOutline: outline,
      warnings: ["No importable footprints with positions/pads found."],
    };
  const minX = outline?.x ?? Math.min(...raw.map((r) => r.at.x));
  const minY = outline?.y ?? Math.min(...raw.map((r) => r.at.y));
  const width =
    outline?.width ??
    Math.max(
      10,
      Math.max(...raw.map((r) => r.at.x)) -
        Math.min(...raw.map((r) => r.at.x)) +
        20,
    );
  const height =
    outline?.height ??
    Math.max(
      10,
      Math.max(...raw.map((r) => r.at.y)) -
        Math.min(...raw.map((r) => r.at.y)) +
        20,
    );
  const roundedPanel =
    outline?.width && outline.width > 5
      ? roundKiCadPanelWidthToEurorackHP(outline.width)
      : {
          widthMM: currentPanelWidthMM,
          hp: currentPanelWidthMM / HP_TO_MM,
          rounded: false,
          sourceHp: currentPanelWidthMM / HP_TO_MM,
        };
  const targetWidth = roundedPanel.widthMM;
  const xOffset = (targetWidth - width) / 2;
  const yOffset = outline
    ? Math.max(0, (PANEL_HEIGHT_MM - height) / 2)
    : (PANEL_HEIGHT_MM - height) / 2;
  if (roundedPanel.rounded)
    warnings.push(
      `PCB Edge.Cuts width ${width.toFixed(2)} mm = ${roundedPanel.sourceHp.toFixed(2)} HP; rounded front panel to ${roundedPanel.hp} HP and centered imported components by ${xOffset.toFixed(2)} mm.`,
    );
  if (!outline)
    warnings.push(
      "No Edge.Cuts rectangle found. Footprints were centered on the current panel; verify origin manually.",
    );
  if (height > PANEL_HEIGHT_MM + 0.5)
    warnings.push(
      `Board outline height ${height.toFixed(2)} mm exceeds Eurorack 3U panel height ${PANEL_HEIGHT_MM} mm.`,
    );
  const refCounts = raw.reduce(
    (m, r) => (m.set(r.ref, (m.get(r.ref) || 0) + 1), m),
    new Map(),
  );
  const usedRefs = new Set();
  const components = raw.map((r, idx) => {
    const def = sanitizePart({
      ...r.def,
      verificationStatus: r.def.verificationStatus ?? "approximate",
    });
    const originalRef = r.ref || nextRefForComponent(def.type, []);
    const duplicatedOriginalRef = (refCounts.get(originalRef) || 0) > 1;
    let ref = originalRef;
    if (usedRefs.has(ref)) ref = `${ref}_${idx + 1}`;
    usedRefs.add(ref);
    const genericRepeatedRef =
      /^(J|RV|SW|D|LED|FDR|POT)\d*$/i.test(originalRef || "") &&
      r.value &&
      !/^\$?\{?value\}?$/i.test(r.value);
    const visibleLabel =
      duplicatedOriginalRef || genericRepeatedRef ? r.value : originalRef;
    const geom = kiCadFootprintGeometry(
      r.pads,
      parseKiCadGraphicPrimitives(r.fpBlock || ""),
      `${r.ref} ${r.value} ${r.description} ${r.fp}`,
    );
    const apertureOffset =
      geom && !geom.noPositionOffset
        ? rotateKiCadLocalOffset(
            geom.offsetX || 0,
            geom.offsetY || 0,
            r.at.rot || 0,
          )
        : { x: 0, y: 0 };
    const x = r.at.x + apertureOffset.x - minX + xOffset;
    const y = r.at.y + apertureOffset.y - minY + yOffset;
    const noteLines = [
      `Imported from KiCad footprint: ${r.fp}`,
      originalRef ? `Reference: ${originalRef}` : "",
      r.value ? `Value: ${r.value}` : "",
      r.description ? `Description: ${r.description}` : "",
      `KiCad rotation: ${Math.round((r.at.rot || 0) * 1000) / 1000}°`,
      geom?.rotationOffset
        ? `Import rotation offset: ${Math.round((geom.rotationOffset || 0) * 1000) / 1000}°`
        : "",
      geom && (Math.abs(geom.offsetX) > 0.001 || Math.abs(geom.offsetY) > 0.001)
        ? `PCB clearance/aperture anchor offset: ${geom.offsetX.toFixed(3)}, ${geom.offsetY.toFixed(3)} mm${geom.noPositionOffset ? " (recognition only)" : " (applied to position)"}`
        : "",
      geom?.anchorOnly
        ? geom.noPositionOffset
          ? "PCB-under-panel import: footprint position used for component center; aperture/clearance graphics used for recognition only; front-panel dimensions taken from component library."
          : "PCB-under-panel import: aperture/clearance center used as component center; front-panel dimensions taken from component library."
        : "",
    ].filter(Boolean);
    const comp = {
      ...def,
      ...(geom && !(geom.anchorOnly && def.type !== "custom")
        ? {
            holeDiameter: geom.holeDiameter || def.holeDiameter,
            frontDiameter: Math.max(
              def.frontDiameter || 0,
              geom.frontDiameter || 0,
            ),
            rearBodyW: Math.max(def.rearBodyW || 0, geom.rearBodyW || 0),
            rearBodyH: Math.max(def.rearBodyH || 0, geom.rearBodyH || 0),
            keepoutW: Math.max(def.keepoutW || 0, (geom.rearBodyW || 0) + 2),
            keepoutH: Math.max(def.keepoutH || 0, (geom.rearBodyH || 0) + 2),
          }
        : {}),
      id: crypto.randomUUID(),
      ref,
      label: visibleLabel,
      x: Math.round(x * 1000) / 1000,
      y: Math.round(y * 1000) / 1000,
      rotation: kiCadRotationToPanelRotation(
        r.at.rot || 0,
        geom?.rotationOffset || 0,
      ),
      notes: noteLines.join("\n"),
      locked: false,
    };
    if (geom?.holeType === "slot" && !geom.anchorOnly) {
      comp.holeType = "slot";
      comp.holeDiameter = geom.holeDiameter;
      comp.slotLength = geom.slotLength;
      comp.frontShape = "slot";
      comp.frontW = geom.frontW;
      comp.frontH = geom.frontH;
    } else if (geom?.holeType === "rect" && !geom.anchorOnly) {
      comp.holeType = "rect";
      comp.holeW = geom.holeW;
      comp.holeH = geom.holeH;
      comp.frontShape = "rect";
      comp.frontW = geom.frontW;
      comp.frontH = geom.frontH;
    }
    return comp;
  });
  const offsetCount = components.filter((c) =>
    /Aperture offset:/i.test(c.notes || ""),
  ).length;
  if (offsetCount)
    warnings.push(
      `Applied local aperture offsets for ${offsetCount} footprints.`,
    );
  const knownCount = raw.filter((r) =>
    /PJ398SM|Thonkiconn|RD901F|SW_Tact_Low_Profile_LED|THONK-SW-LP-LED/i.test(
      `${r.fp} ${r.value}`,
    ),
  ).length;
  if (knownCount)
    warnings.push(
      `Used known front-panel footprint mapping for ${knownCount} footprints.`,
    );
  const anchorOnlyCount = components.filter((c) =>
    /PCB-under-panel import:/i.test(c.notes || ""),
  ).length;
  if (anchorOnlyCount)
    warnings.push(
      `Used PCB-under-panel mapping for ${anchorOnlyCount} parts; PJ398SM jacks and RD901F pots use rotated local aperture/shaft centers, LED tact switches keep footprint origins, and front-panel sizes stay from the component library.`,
    );
  return {
    components,
    panelWidthMM: targetWidth,
    boardOutline: outline,
    warnings,
  };
}
/* ExportPreviewMini moved to ExportDialog.js */

/* ExportDialog moved to ExportDialog.js */
/* CommandPalette moved to AppOverlays.js */ /* factoryPart moved to FactoryTemplates.js */ /* makeFactoryTemplate moved to FactoryTemplates.js */ /* templateRecordFromFactoryTemplate moved to FactoryTemplates.js */ /* factoryPresetTemplates moved to FactoryTemplates.js */ /* loadFactoryTemplateRecords moved to FactoryTemplates.js */
/* TemplateRealisticPreview moved to TemplatesDialog.js */

/* TemplatesDialog moved to TemplatesDialog.js */
/* LocalProjectsDialog moved to AppOverlays.js */
/* CanvasQuickAddDock moved to MobileDock.js */
/* productionSeverityRank moved to AppOverlays.js */ /* productionRectsOverlap moved to AppOverlays.js */ /* productionRectInsidePanel moved to AppOverlays.js */ /* textApproxBounds moved to AppOverlays.js */ /* scaleApproxBounds moved to AppOverlays.js */ /* componentProductionFrontRect moved to AppOverlays.js */ /* buildProductionCheckItems moved to AppOverlays.js */ /* ProductionCheckDialog moved to AppOverlays.js */ /* ShortcutHelpOverlay moved to AppOverlays.js */ /* SelectionInfoStrip moved to AppOverlays.js */ /* avg moved to AppOverlays.js */
/* App moved to App.js */
