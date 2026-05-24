(function () {
  "use strict";

  const KEY = "panel-designer:appearance";
  const DEFAULT_PRESET = "industrial";
  const root = document.documentElement;

  const PRESETS = {
    industrial: {
      label: "Industrial",
      swatchBg: "#020202",
      swatchAccent: "rgb(214,170,88)",
      defaultStyle: "flat",
      defaultGlow: false,
      vars: {
        "--ui-bg": "#020202",
        "--ui-bg-2": "#050505",
        "--ui-panel": "#080807",
        "--ui-panel-2": "#0d0c0a",
        "--ui-surface": "#11100e",
        "--ui-surface-hover": "#15130f",
        "--ui-text": "#eee7da",
        "--ui-text-soft": "#d8d0c0",
        "--ui-muted": "#928b7d",
        "--ui-gold": "#bd8c3f",
        "--ui-gold-2": "#d6aa58",
        "--ui-gold-rgb": "214,170,88",
        "--ui-gold-alt-rgb": "201,154,74",
        "--ui-line-rgb": "215,196,155",
        "--theme-radius": "0px",
        "--theme-font": 'Inter,"SF Pro Text",system-ui,sans-serif',
        "--theme-tracking": "0.14em",
        "--theme-weight-brand": "850",
        "--theme-btn-height": "32px",
        "--theme-section-gap": "8px",
        "--theme-surface-blur": "0px",
        "--theme-surface-sat": "1",
        "--theme-border-opacity": "0.13",
      },
    },
    minimal: {
      label: "Minimal",
      swatchBg: "#111111",
      swatchAccent: "rgb(180,180,180)",
      defaultStyle: "flat",
      defaultGlow: false,
      vars: {
        "--ui-bg": "#111111",
        "--ui-bg-2": "#0d0d0d",
        "--ui-panel": "#1a1a1a",
        "--ui-panel-2": "#222222",
        "--ui-surface": "#2a2a2a",
        "--ui-surface-hover": "#333333",
        "--ui-text": "#e0e0e0",
        "--ui-text-soft": "#cccccc",
        "--ui-muted": "#888888",
        "--ui-gold": "#b0b0b0",
        "--ui-gold-2": "#c8c8c8",
        "--ui-gold-rgb": "180,180,180",
        "--ui-gold-alt-rgb": "160,160,160",
        "--ui-line-rgb": "180,180,180",
        "--theme-radius": "3px",
        "--theme-font": 'Inter,"SF Pro Text",system-ui,sans-serif',
        "--theme-tracking": "0.08em",
        "--theme-weight-brand": "700",
        "--theme-btn-height": "30px",
        "--theme-section-gap": "6px",
        "--theme-surface-blur": "0px",
        "--theme-surface-sat": "1",
        "--theme-border-opacity": "0.13",
      },
    },
    retro: {
      label: "Retro",
      swatchBg: "#050800",
      swatchAccent: "rgb(80,230,100)",
      defaultStyle: "flat",
      defaultGlow: false,
      vars: {
        "--ui-bg": "#050800",
        "--ui-bg-2": "#080b00",
        "--ui-panel": "#0b0f01",
        "--ui-panel-2": "#0e1302",
        "--ui-surface": "#121802",
        "--ui-surface-hover": "#161d03",
        "--ui-text": "#c8f0a0",
        "--ui-text-soft": "#a0c880",
        "--ui-muted": "#608040",
        "--ui-gold": "#50e664",
        "--ui-gold-2": "#70f080",
        "--ui-gold-rgb": "80,230,100",
        "--ui-gold-alt-rgb": "60,200,80",
        "--ui-line-rgb": "80,200,80",
        "--theme-radius": "0px",
        "--theme-font": 'ui-monospace,"Fira Code","Cascadia Code",monospace',
        "--theme-tracking": "0.04em",
        "--theme-weight-brand": "700",
        "--theme-btn-height": "32px",
        "--theme-section-gap": "8px",
        "--theme-surface-blur": "0px",
        "--theme-surface-sat": "1",
        "--theme-border-opacity": "0.20",
      },
    },
    light: {
      label: "Light",
      swatchBg: "#f2f0ec",
      swatchAccent: "rgb(160,100,30)",
      defaultStyle: "flat",
      defaultGlow: false,
      vars: {
        "--ui-bg": "#f2f0ec",
        "--ui-bg-2": "#ede9e3",
        "--ui-panel": "#e8e4dc",
        "--ui-panel-2": "#e2ddd5",
        "--ui-surface": "#dddad2",
        "--ui-surface-hover": "#d8d4cc",
        "--ui-text": "#1a1916",
        "--ui-text-soft": "#3a3730",
        "--ui-muted": "#7a7368",
        "--ui-gold": "#a0641e",
        "--ui-gold-2": "#b87828",
        "--ui-gold-rgb": "160,100,30",
        "--ui-gold-alt-rgb": "140,80,20",
        "--ui-line-rgb": "80,70,55",
        "--theme-radius": "3px",
        "--theme-font": 'Inter,"SF Pro Text",system-ui,sans-serif',
        "--theme-tracking": "0.12em",
        "--theme-weight-brand": "800",
        "--theme-btn-height": "32px",
        "--theme-section-gap": "8px",
        "--theme-surface-blur": "0px",
        "--theme-surface-sat": "1",
        "--theme-border-opacity": "0.16",
      },
    },
    synthwave: {
      label: "Synthwave",
      swatchBg: "#08010f",
      swatchAccent: "rgb(200,60,220)",
      defaultStyle: "glass",
      defaultGlow: true,
      vars: {
        "--ui-bg": "#08010f",
        "--ui-bg-2": "#0d0218",
        "--ui-panel": "#120220",
        "--ui-panel-2": "#180328",
        "--ui-surface": "#1e0430",
        "--ui-surface-hover": "#240538",
        "--ui-text": "#f0d8ff",
        "--ui-text-soft": "#d0b8e8",
        "--ui-muted": "#9070a8",
        "--ui-gold": "#c83cdc",
        "--ui-gold-2": "#e060f8",
        "--ui-gold-rgb": "200,60,220",
        "--ui-gold-alt-rgb": "160,40,180",
        "--ui-line-rgb": "180,80,220",
        "--theme-radius": "4px",
        "--theme-font": 'Inter,"SF Pro Text",system-ui,sans-serif',
        "--theme-tracking": "0.14em",
        "--theme-weight-brand": "850",
        "--theme-btn-height": "32px",
        "--theme-section-gap": "8px",
        "--theme-surface-blur": "6px",
        "--theme-surface-sat": "0.85",
        "--theme-border-opacity": "0.18",
      },
    },
  };

  const SHAPE_OPTIONS = [
    { label: "Sharp", value: "0px" },
    { label: "Soft", value: "3px" },
    { label: "Rounded", value: "8px" },
    { label: "Pill", value: "20px" },
  ];

  const FONT_OPTIONS = [
    { label: "Inter", value: 'Inter,"SF Pro Text",system-ui,sans-serif' },
    {
      label: "Mono",
      value: 'ui-monospace,"Fira Code","Cascadia Code",monospace',
    },
    {
      label: "System",
      value: "system-ui,-apple-system,BlinkMacSystemFont,sans-serif",
    },
  ];

  const DENSITY_OPTIONS = [
    { label: "Compact", value: "28px" },
    { label: "Default", value: "32px" },
    { label: "Comfortable", value: "38px" },
  ];

  const STYLE_OPTIONS = [
    { label: "Flat", value: "flat" },
    { label: "Bordered", value: "bordered" },
    { label: "Glass", value: "glass" },
  ];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw)
        return {
          preset: DEFAULT_PRESET,
          style: null,
          overrides: {},
          glow: false,
        };
      const p = JSON.parse(raw);
      if (!p.preset || !PRESETS[p.preset])
        return {
          preset: DEFAULT_PRESET,
          style: null,
          overrides: {},
          glow: false,
        };
      const defaultGlow = PRESETS[p.preset].defaultGlow ?? false;
      return {
        preset: p.preset,
        style: p.style || null,
        overrides: p.overrides || {},
        glow: p.glow != null ? p.glow : defaultGlow,
      };
    } catch {
      return {
        preset: DEFAULT_PRESET,
        style: null,
        overrides: {},
        glow: false,
      };
    }
  }

  function apply(presetKey, style, overrides, glow) {
    const preset = PRESETS[presetKey] || PRESETS[DEFAULT_PRESET];
    const resolvedStyle = style || preset.defaultStyle || "flat";
    const resolvedGlow = glow != null ? glow : (preset.defaultGlow ?? false);

    const merged = Object.assign({}, preset.vars, overrides);

    if (resolvedStyle === "bordered") {
      const base = Number(merged["--theme-border-opacity"] || 0.13);
      merged["--ui-line"] =
        "rgba(var(--ui-line-rgb)," + (base * 2).toFixed(2) + ")";
      merged["--ui-line-soft"] =
        "rgba(var(--ui-line-rgb)," + (base * 1.4).toFixed(2) + ")";
      merged["--ui-line-strong"] =
        "rgba(var(--ui-line-rgb)," + (base * 3).toFixed(2) + ")";
    }

    for (const [k, v] of Object.entries(merged)) {
      root.style.setProperty(k, v);
    }

    root.dataset.style = resolvedStyle;
    root.dataset.preset = presetKey;
    root.dataset.glow = resolvedGlow ? "on" : "off";
  }

  function save(presetKey, style, overrides, glow) {
    apply(presetKey, style, overrides, glow);
    localStorage.setItem(
      KEY,
      JSON.stringify({ preset: presetKey, style, overrides, glow }),
    );
  }

  function reset() {
    save(DEFAULT_PRESET, null, {}, false);
  }

  window.ThemeEngine = {
    PRESETS,
    SHAPE_OPTIONS,
    FONT_OPTIONS,
    DENSITY_OPTIONS,
    STYLE_OPTIONS,
    DEFAULT_PRESET,
    load,
    apply,
    save,
    reset,
  };

  window.addEventListener("panel-designer:open-appearance", () => {
    window.AppearanceModal?.open();
  });

  const initial = load();
  apply(initial.preset, initial.style, initial.overrides, initial.glow);
})();
