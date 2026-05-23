// Desktop working controls. The global topbar intentionally does not own these.

function toolIcon(paths, opts) {
  const fill = opts && opts.fill ? opts.fill : "none";
  const extra = opts && opts.extra ? opts.extra : null;
  return React.createElement(
    "svg",
    {
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: fill,
      stroke: "currentColor",
      strokeWidth: "1.7",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
    },
    ...(Array.isArray(paths) ? paths : [paths]).map((d, i) =>
      React.createElement("path", { key: i, d }),
    ),
    ...(extra ? [extra] : []),
  );
}

const ICON = {
  left: toolIcon([
    "M21 3H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z",
    "M9 3v18",
    "M5 14l-3-2 3-2",
  ]),
  right: toolIcon([
    "M21 3H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z",
    "M15 3v18",
    "M19 10l3 2-3 2",
  ]),
  undo: toolIcon(["M9 14 4 9l5-5", "M4 9h10.5a5.5 5.5 0 0 1 0 11H11"]),
  redo: toolIcon(["M15 14l5-5-5-5", "M19 9H8.5a5.5 5.5 0 0 0 0 11H13"]),
  edit: toolIcon([
    "M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z",
    "M15 5l4 4",
  ]),
  ruler: toolIcon(["M5 19L19 5", "M5 19h4v-4", "M19 5v4h-4", "M9 15l5-5"]),
  text: toolIcon(["M4 6h16", "M12 6v12", "M8 18h8"]),
  view: toolIcon([
    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
    React.createElement("circle", { key: "c", cx: "12", cy: "12", r: "3" }),
  ]),
  snap: toolIcon([
    "M6 2v10a6 6 0 0 0 12 0V2",
    "M6 2h4",
    "M14 2h4",
    "M6 12a6 6 0 0 0 12 0",
    "M9 21h6",
    "M12 18v3",
  ]),
  fit: toolIcon(["M15 3h6v6", "M9 21H3v-6", "M21 3l-7 7", "M3 21l7-7"]),
  tone: toolIcon("M12 2a10 10 0 0 0 0 20V2z", { fill: "currentColor" }),
  safe: toolIcon(
    "M12 2l8 4v5c0 4.6-3.2 8.9-8 10.4C7.2 19.9 4 15.6 4 11V6l8-4z",
  ),
  clr: toolIcon(["M3 12h18", "M3 12l4-4M3 12l4 4", "M21 12l-4-4M21 12l-4 4"]),
  help: toolIcon([
    "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
    React.createElement("circle", {
      key: "dot",
      cx: "12",
      cy: "17",
      r: "0.5",
      fill: "currentColor",
    }),
  ]),
  add: toolIcon("M12 8v8M8 12h8", {
    extra: React.createElement("circle", {
      key: "c",
      cx: "12",
      cy: "12",
      r: "9",
    }),
  }),
  multi: toolIcon([
    "M3 3h7v7H3z",
    "M14 3h7v7h-7z",
    "M3 14h7v7H3z",
    "M14 17h7M17 14v7",
  ]),
  hide: toolIcon("M15 18l-6-6 6-6"),
};

function CanvasToolRail({
  leftPanelOpen,
  rightPanelOpen,
  onToggleLeftPanel,
  onToggleRightPanel,
  touchMode,
  onSetTouchMode,
  onFitView,
  snapSettings,
  onSnapSettingsChange,
  clearanceMode,
  onToggleClearanceMode,
  showSafeZones,
  onToggleSafeZones,
  onOpenShortcuts,
  onAddText,
  onOpenComponentLibrary,
}) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [openMenu, setOpenMenu] = useState(null);
  const [menuTop, setMenuTop] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!openMenu) return undefined;
    function onDocPointerDown(e) {
      const target = e.target;
      if (!target) return;
      if (
        target.closest(".canvas-tool-rail") ||
        target.closest(".canvas-tool-popover")
      )
        return;
      setOpenMenu(null);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("pointerdown", onDocPointerDown, true);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  function toggleMenu(name, e) {
    const r = e.currentTarget.getBoundingClientRect();
    setMenuTop(r.top);
    setOpenMenu((v) => (v === name ? null : name));
  }

  function setMode(mode) {
    setOpenMenu(null);
    onSetTouchMode(mode);
  }

  function command(label, icon, props = {}) {
    const { className = "", ...rest } = props;
    return React.createElement(
      "button",
      {
        type: "button",
        className: `canvas-tool-button ${className}`,
        title: label,
        ...rest,
      },
      React.createElement(
        "span",
        { className: "canvas-tool-icon", "aria-hidden": "true" },
        icon,
      ),
      React.createElement("span", { className: "canvas-tool-label" }, label),
    );
  }

  const popoverStyle = {
    top: Math.max(58, Math.min(menuTop, window.innerHeight - 260)),
  };

  if (collapsed) {
    return React.createElement(
      "button",
      {
        className: "canvas-tool-rail-restore",
        onClick: () => setCollapsed(false),
        onMouseDown: (e) => e.stopPropagation(),
        onTouchStart: (e) => e.stopPropagation(),
        title: "Show tools",
      },
      "›",
    );
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "nav",
      {
        className: "canvas-tool-rail",
        "aria-label": "Canvas tools",
        onMouseDown: (e) => e.stopPropagation(),
        onTouchStart: (e) => e.stopPropagation(),
      },
      command("Add", ICON.add, {
        onClick: () => {
          setOpenMenu(null);
          onOpenComponentLibrary?.();
        },
      }),
      command("Left", ICON.left, {
        className: `canvas-tool-left-btn${leftPanelOpen ? " active" : ""}`,
        onClick: () => {
          setOpenMenu(null);
          onToggleLeftPanel();
        },
      }),
      command("Right", ICON.right, {
        className: `rail-right-btn${rightPanelOpen ? " active" : ""}`,
        onClick: () => {
          setOpenMenu(null);
          onToggleRightPanel();
        },
      }),
      React.createElement("div", { className: "canvas-tool-separator" }),
      command("Undo", ICON.undo, {
        className: "rail-undo",
        disabled: state.history.length === 0,
        onClick: () => {
          setOpenMenu(null);
          dispatch({ type: "UNDO" });
        },
      }),
      command("Redo", ICON.redo, {
        className: "rail-redo",
        disabled: state.future.length === 0,
        onClick: () => {
          setOpenMenu(null);
          dispatch({ type: "REDO" });
        },
      }),
      React.createElement("div", { className: "canvas-tool-separator" }),
      command("Edit", ICON.edit, {
        className: touchMode === "edit" ? "active" : "",
        onClick: () => setMode("edit"),
      }),
      command("Multi", ICON.multi, {
        className: touchMode === "select" ? "active" : "",
        onClick: () => setMode(touchMode === "select" ? "edit" : "select"),
      }),
      command("Ruler", ICON.ruler, {
        className: touchMode === "ruler" ? "active" : "",
        onClick: () => setMode("ruler"),
      }),
      React.createElement("div", { className: "canvas-tool-separator" }),
      command("Text", ICON.text, {
        onClick: () => {
          setOpenMenu(null);
          onAddText?.();
        },
      }),
      command("View", ICON.view, {
        className: openMenu === "view" ? "active" : "",
        onClick: (e) => toggleMenu("view", e),
      }),
      command("Snap", ICON.snap, {
        className: openMenu === "snap" ? "active" : "",
        onClick: (e) => toggleMenu("snap", e),
      }),
      command("Fit", ICON.fit, {
        onClick: () => {
          setOpenMenu(null);
          onFitView();
        },
      }),
      command("Tone", ICON.tone, {
        onClick: () => AppCommands.toggleViewContrast(),
      }),
      command("Safe", ICON.safe, {
        className: showSafeZones ? "active" : "",
        onClick: () => {
          setOpenMenu(null);
          onToggleSafeZones();
        },
      }),
      command("Clr", ICON.clr, {
        className: clearanceMode ? "active" : "",
        onClick: () => {
          setOpenMenu(null);
          onToggleClearanceMode();
        },
      }),
      command("Help", ICON.help, {
        onClick: () => {
          setOpenMenu(null);
          onOpenShortcuts();
        },
      }),
      React.createElement("div", { className: "canvas-tool-spacer" }),
      command("Hide", ICON.hide, {
        className: "canvas-tool-hide-btn",
        onClick: () => setCollapsed(true),
      }),
    ),
    openMenu &&
      ReactDOM.createPortal(
        React.createElement(
          "div",
          {
            className: "canvas-tool-popover toolbar-popover",
            style: popoverStyle,
            onMouseDown: (e) => e.stopPropagation(),
            onPointerDown: (e) => e.stopPropagation(),
            onWheel: (e) => e.stopPropagation(),
          },
          openMenu === "view" &&
            React.createElement(CanvasToolViewMenu, {
              onClose: () => setOpenMenu(null),
              showSafeZones,
              onToggleSafeZones,
              clearanceMode,
              onToggleClearanceMode,
            }),
          openMenu === "snap" &&
            React.createElement(CanvasToolSnapMenu, {
              snapSettings,
              onSnapSettingsChange,
            }),
        ),
        document.body,
      ),
  );
}
