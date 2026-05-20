// Global header only: brand plus Templates, File and Help menus.
function Topbar({
  onExportSVGClick,
  onRequestProjectFileImport,
  onRequestKiCadPcbImport,
  onOpenLocalProjects,
  onOpenProductionCheck,
  onOpenShortcuts,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const [menuPos, setMenuPos] = useState({ left: 8, top: 48 });
  const sectionMenus = ["project", "panel", "add", "text"];

  useEffect(() => {
    if (!openMenu) return undefined;
    function onDocPointerDown(e) {
      const target = e.target;
      if (!target) return;
      if (target.closest(".toolbar-popover") || target.closest(".toolbar-menu-trigger")) return;
      setOpenMenu(null);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    function close() {
      setOpenMenu(null);
    }
    document.addEventListener("pointerdown", onDocPointerDown, true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
    };
  }, [openMenu]);

  function toggleMenu(name, e) {
    const r = e.currentTarget.getBoundingClientRect();
    const estimatedWidth = sectionMenus.includes(name) ? 360 : name === "help" ? 390 : 250;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - estimatedWidth - 8));
    setMenuPos({ left, top: r.bottom + 6 });
    setOpenMenu(openMenu === name ? null : name);
  }


  function menuButton(name, label) {
    return React.createElement(
      "button",
      {
        className: `toolbar-menu-trigger ${openMenu === name ? "active" : ""}`,
        onClick: (e) => toggleMenu(name, e),
      },
      label,
      " \u25BE",
    );
  }

  const popoverStyle = { left: menuPos.left, top: menuPos.top };

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "div",
      { className: "topbar global-topbar" },
      React.createElement(
        "span",
        { className: "app-brand", title: "Panel Designer" },
        React.createElement("span", { className: "app-logo app-logo-fallback", "aria-hidden": "true" }, "PD"),
        React.createElement("span", { className: "app-title" }, "PANEL DESIGNER"),
      ),
      React.createElement(
        "div",
        { className: "topbar-actions" },
        React.createElement(
          "div",
          { className: "topbar-work-actions", "aria-label": "Panel setup menus" },
          menuButton("project", "Project"),
          menuButton("panel", "Panel"),
          menuButton("add", "Add"),
          menuButton("text", "Text"),
        ),
        React.createElement(
          "div",
          { className: "topbar-global-actions", "aria-label": "Global menus" },
          menuButton("templates", "Templates"),
          menuButton("file", "File"),
        ),
        React.createElement(
          "button",
          {
            className: `toolbar-menu-trigger toolbar-help-trigger ${openMenu === "help" ? "active" : ""}`,
            onClick: (e) => toggleMenu("help", e),
            title: "Help, shortcuts and manufacturing notes",
          },
          "Help",
        ),
      ),
    ),
    openMenu &&
      ReactDOM.createPortal(
        React.createElement(
          "div",
          {
            className: `toolbar-popover ${openMenu === "help" ? "help-popover" : ""} ${sectionMenus.includes(openMenu) ? "topbar-section-popover" : ""}`,
            style: popoverStyle,
            onClick: (e) => e.stopPropagation(),
            onPointerDown: (e) => e.stopPropagation(),
            onWheel: (e) => {
              e.preventDefault();
              e.stopPropagation();
            },
            onTouchMove: (e) => e.stopPropagation(),
          },
          openMenu === "project" && React.createElement(ProjectPanel, null),
          openMenu === "panel" && React.createElement(PanelSettings, null),
          openMenu === "add" && React.createElement(AddMenuContent, { onClose: () => setOpenMenu(null) }),
          openMenu === "text" && React.createElement(TextPanel, null),
          openMenu === "templates" && React.createElement(TemplatesMenuContent, { onClose: () => setOpenMenu(null) }),
          openMenu === "file" &&
            React.createElement(FileMenuContent, {
              onClose: () => setOpenMenu(null),
              onExportSVGClick,
              onRequestProjectFileImport,
              onRequestKiCadPcbImport,
              onOpenLocalProjects,
            }),
          openMenu === "help" &&
            React.createElement(HelpMenuContent, {
              onClose: () => setOpenMenu(null),
              onOpenShortcuts,
              onOpenProductionCheck,
            }),
        ),
        document.body,
      ),
  );
}
