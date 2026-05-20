// Desktop working controls. The global topbar intentionally does not own these.
function CanvasToolRail({
  leftPanelOpen,
  rightPanelOpen,
  onToggleLeftPanel,
  onToggleRightPanel,
  touchMode,
  onSetTouchMode,
  onFitView,
  onResetView,
  snapSettings,
  onSnapSettingsChange,
  clearanceMode,
  onToggleClearanceMode,
  showSafeZones,
  onToggleSafeZones,
  onOpenProductionCheck,
  onOpenShortcuts,
}) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [openMenu, setOpenMenu] = useState(null);
  const [menuTop, setMenuTop] = useState(0);

  useEffect(() => {
    if (!openMenu) return undefined;
    function onDocPointerDown(e) {
      const target = e.target;
      if (!target) return;
      if (target.closest(".canvas-tool-rail") || target.closest(".canvas-tool-popover")) return;
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
      React.createElement("span", { className: "canvas-tool-icon", "aria-hidden": "true" }, icon),
      React.createElement("span", { className: "canvas-tool-label" }, label),
    );
  }

  const popoverStyle = { top: Math.max(58, Math.min(menuTop, window.innerHeight - 260)) };

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
      command("Left", "L", {
        className: leftPanelOpen ? "active" : "",
        onClick: () => {
          setOpenMenu(null);
          onToggleLeftPanel();
        },
      }),
      command("Right", "R", {
        className: rightPanelOpen ? "active" : "",
        onClick: () => {
          setOpenMenu(null);
          onToggleRightPanel();
        },
      }),
      React.createElement("div", { className: "canvas-tool-separator" }),
      command("Undo", "U", {
        disabled: state.history.length === 0,
        onClick: () => {
          setOpenMenu(null);
          dispatch({ type: "UNDO" });
        },
      }),
      command("Redo", "R", {
        disabled: state.future.length === 0,
        onClick: () => {
          setOpenMenu(null);
          dispatch({ type: "REDO" });
        },
      }),
      React.createElement("div", { className: "canvas-tool-separator" }),
      command("Edit", "E", {
        className: touchMode === "edit" ? "active" : "",
        onClick: () => setMode("edit"),
      }),
      command("Pan", "P", {
        className: touchMode === "pan" ? "active" : "",
        onClick: () => setMode("pan"),
      }),
      command("Select", "S", {
        className: touchMode === "select" ? "active" : "",
        onClick: () => setMode("select"),
      }),
      command("Ruler", "M", {
        className: touchMode === "ruler" ? "active" : "",
        onClick: () => setMode("ruler"),
      }),
      command("View", "V", {
        className: openMenu === "view" ? "active" : "",
        onClick: (e) => toggleMenu("view", e),
      }),
      command("Snap", "S", {
        className: openMenu === "snap" ? "active" : "",
        onClick: (e) => toggleMenu("snap", e),
      }),
      command("Fit", "F", {
        onClick: () => {
          setOpenMenu(null);
          onFitView();
        },
      }),
      command("Tone", "O", {
        onClick: () => AppCommands.toggleViewContrast(),
      }),
      command("More", "...", {
        className: openMenu === "more" ? "active" : "",
        onClick: (e) => toggleMenu("more", e),
      }),
      command("Help", "?", {
        onClick: () => {
          setOpenMenu(null);
          onOpenShortcuts();
        },
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
          openMenu === "more" &&
            React.createElement(CanvasToolMoreMenu, {
              onClose: () => setOpenMenu(null),
              clearanceMode,
              showSafeZones,
              onToggleClearanceMode,
              onToggleSafeZones,
              onOpenProductionCheck,
              onResetView,
            }),
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
