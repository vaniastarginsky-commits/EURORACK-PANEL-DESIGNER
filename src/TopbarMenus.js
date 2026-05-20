// Topbar dropdown menu content components.
// Depends on: useAppState, useAppDispatch (appState.js), panelWidthMM, snapToGrid,
// PANEL_HEIGHT_MM, TEXT_FONT_OPTIONS, APP_VERSION (core.js), appConfirm (NativeDialogs.js),
// validateAndNormalize (projectSchema.js), AppCommands (appCommands.js),
// loadLocalProjects, exportJSON, saveProjectToBrowser, copyTable (exportEngine.js/core.js),
// makeTemplateFromState, saveTemplateToBrowser, exportTemplatesLibrary,
// importTemplatesLibraryFile (FactoryTemplates.js — called at runtime only).

function AddMenuContent({ onClose }) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const widthMM = panelWidthMM(state.panel);

  function addText() {
    dispatch({
      type: "ADD_TEXT",
      item: {
        id: crypto.randomUUID(),
        text: "TEXT",
        x: snapToGrid(widthMM / 2, state.grid.size),
        y: snapToGrid(PANEL_HEIGHT_MM / 2, state.grid.size),
        rotation: 0,
        fontSizeMm: 3,
        align: "center",
        layer: "foreground",
        locked: false,
        visible: true,
        opacity: 1,
        fontFamily: TEXT_FONT_OPTIONS[0].value,
      },
    });
    onClose();
  }

  function handleArtworkFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const img = new window.Image();
      img.onload = () => {
        dispatch({
          type: "ADD_ARTWORK",
          item: {
            id: crypto.randomUUID(),
            name: file.name,
            imageDataUrl: dataUrl,
            x: snapToGrid(widthMM / 2, state.grid.size),
            y: snapToGrid(PANEL_HEIGHT_MM / 2, state.grid.size),
            width: widthMM,
            height: PANEL_HEIGHT_MM,
            naturalW: img.naturalWidth || 100,
            naturalH: img.naturalHeight || 100,
            rotation: 0,
            opacity: 1,
            locked: false,
            visible: true,
            layer: "background",
            preserveAspectRatio: false,
            notes: "Auto-fit to panel on import",
          },
        });
        onClose();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement("div", { className: "menu-title" }, "Add"),
    React.createElement(
      "div",
      { className: "menu-grid" },
      React.createElement(
        "button",
        {
          className: "primary",
          onClick: () => {
            onClose();
            AppCommands.openComponentLibraryPicker();
          },
        },
        "Component picker",
      ),
      React.createElement(
        "button",
        { onClick: () => document.getElementById("topbar-artwork-import-input")?.click() },
        "+ Add Image",
      ),
      React.createElement("button", { onClick: addText }, "+ Add Text"),
    ),
    React.createElement("input", {
      id: "topbar-artwork-import-input",
      type: "file",
      accept: ".png,.jpg,.jpeg,.svg,.webp",
      style: { display: "none" },
      onChange: handleArtworkFile,
    }),
  );
}

function TemplatesMenuContent({ onClose }) {
  const state = useAppState();

  return React.createElement(
    React.Fragment,
    null,
    React.createElement("div", { className: "menu-title" }, "Templates"),
    React.createElement(
      "div",
      { className: "menu-grid" },
      React.createElement(
        "button",
        {
          onClick: async () => {
            const t = await makeTemplateFromState(state, "panel");
            if (t) {
              saveTemplateToBrowser(t);
              alert(`Saved template "${t.name}".`);
            }
            onClose();
          },
        },
        "Save current panel",
      ),
      React.createElement(
        "button",
        {
          disabled: state.selected.length === 0,
          onClick: async () => {
            const t = await makeTemplateFromState(state, "block", state.selected);
            if (t) {
              saveTemplateToBrowser(t);
              alert(`Saved block template "${t.name}".`);
            }
            onClose();
          },
        },
        "Save selected block",
      ),
      React.createElement(
        "button",
        {
          className: "primary",
          onClick: () => {
            onClose();
            AppCommands.openTemplatesDialog();
          },
        },
        "Load / Manage templates",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            exportTemplatesLibrary();
            onClose();
          },
        },
        "Export templates",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            importTemplatesLibraryFile();
            onClose();
          },
        },
        "Import templates",
      ),
    ),
    React.createElement(
      "div",
      { className: "menu-note" },
      "Default templates are baked into this HTML. Browser templates can still be saved, imported and exported.",
    ),
  );
}

function FileMenuContent({ onClose, onExportSVGClick, onRequestProjectFileImport, onRequestKiCadPcbImport, onOpenLocalProjects }) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [fileRecentOpen, setFileRecentOpen] = useState(true);
  const [recentFileProjects] = useState(() => loadLocalProjects().slice(0, 7));

  async function loadRecentProject(record) {
    let raw;
    try {
      raw = JSON.parse(record.data);
    } catch {
      alert("Saved project is corrupted and could not be parsed.");
      return;
    }
    const result = validateAndNormalize(raw);
    if (!result.ok) {
      alert(`Load failed: ${result.error}`);
      return;
    }
    const hasContent =
      state.components.length > 0 ||
      state.artworks.length > 0 ||
      state.textItems.length > 0 ||
      state.scaleItems.length > 0;
    if (hasContent) {
      const ok = await appConfirm({
        title: "Load recent project",
        message: `Replace the current project with "${record.name}"?`,
        confirmText: "Load project",
      });
      if (!ok) return;
    }
    dispatch({ type: "LOAD_STATE", state: result.state });
    onClose();
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement("div", { className: "menu-title" }, "File / Export"),
    React.createElement(
      "div",
      { className: "menu-grid" },
      React.createElement(
        "button",
        {
          onClick: () => {
            onExportSVGClick();
            onClose();
          },
        },
        "Export...",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            onExportSVGClick();
            onClose();
          },
        },
        "Export KiCad PCB...",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            onClose();
            onRequestKiCadPcbImport();
          },
        },
        "Import KiCad PCB...",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            exportJSON(state);
            onClose();
          },
        },
        "Save Project File",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            onClose();
            onRequestProjectFileImport();
          },
        },
        "Load Project File",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            saveProjectToBrowser(state);
            setFileRecentOpen(true);
          },
        },
        "Save to Browser",
      ),
      React.createElement(
        "button",
        {
          className: `recent-projects-toggle ${fileRecentOpen ? "active" : ""}`,
          onClick: () => setFileRecentOpen((v) => !v),
        },
        "Recent Projects ",
        recentFileProjects.length ? `(${recentFileProjects.length})` : "",
        " ",
        fileRecentOpen ? "▴" : "▾",
      ),
      fileRecentOpen &&
        React.createElement(
          "div",
          { className: "recent-projects-menu-list" },
          recentFileProjects.length
            ? recentFileProjects.map((p) =>
                React.createElement(
                  "button",
                  {
                    key: p.id,
                    className: "recent-project-menu-item",
                    onClick: () => loadRecentProject(p),
                    title: `${p.name} - ${new Date(p.updatedAt).toLocaleString()} - ${(p.sizeBytes / 1024).toFixed(0)} KB`,
                  },
                  React.createElement("strong", null, p.name),
                  React.createElement(
                    "small",
                    null,
                    new Date(p.updatedAt).toLocaleString(),
                    " - ",
                    (p.sizeBytes / 1024).toFixed(0),
                    " KB",
                  ),
                ),
              )
            : React.createElement(
                "div",
                { className: "recent-projects-empty" },
                "No recent browser projects yet. Use Save to Browser first.",
              ),
          React.createElement(
            "button",
            {
              className: "recent-projects-manager",
              onClick: () => {
                onClose();
                onOpenLocalProjects();
              },
            },
            "Manage all local projects...",
          ),
        ),
      React.createElement(
        "button",
        {
          onClick: () => {
            copyTable(state.components);
            onClose();
          },
        },
        "Copy component table",
      ),
    ),
  );
}

function HelpMenuContent({ onClose, onOpenShortcuts, onOpenProductionCheck }) {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement("div", { className: "menu-title" }, "Help / quick reference"),
    React.createElement("div", { className: "menu-note" }, "Build: ", APP_VERSION),
    React.createElement(
      "div",
      { className: "help-popover-grid" },
      React.createElement(
        "div",
        { className: "help-card warn" },
        React.createElement("strong", null, "Manufacturing"),
        React.createElement(
          "span",
          null,
          "Dimensions are planning estimates. Verify parts with datasheets or calipers before production.",
        ),
      ),
      React.createElement(
        "div",
        { className: "help-card" },
        React.createElement("strong", null, "Mobile"),
        React.createElement("span", null, "Use Add / Select / Part / View / More. Pinch to zoom."),
      ),
      React.createElement(
        "div",
        { className: "help-card" },
        React.createElement("strong", null, "Part / text editing"),
        React.createElement(
          "span",
          null,
          "Select a component for Part properties. Text labels can be edited inline in Text / Labels.",
        ),
      ),
      React.createElement(
        "div",
        { className: "help-card" },
        React.createElement("strong", null, "Snap / placement"),
        React.createElement(
          "span",
          null,
          "Normal drag is cursor anchored. Hold Shift for smart snap. Placement uses Multiple/Done.",
        ),
      ),
      React.createElement(
        "div",
        { className: "help-card" },
        React.createElement("strong", null, "KiCad export"),
        React.createElement(
          "span",
          null,
          "Use File / Export KiCad PCB for mechanical .kicad_pcb output and origin options.",
        ),
      ),
    ),
    React.createElement(
      "div",
      { className: "menu-grid two", style: { marginTop: 10 } },
      React.createElement(
        "button",
        {
          onClick: () => {
            onOpenShortcuts();
            onClose();
          },
        },
        "Open shortcuts",
      ),
      React.createElement(
        "button",
        {
          onClick: () => {
            onOpenProductionCheck();
            onClose();
          },
        },
        "Production check",
      ),
    ),
  );
}
