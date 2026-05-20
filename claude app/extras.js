// Eurorack Panel Designer — extras (v500-dock-master)
// The Tools dock on the left of the canvas is now the master command
// panel: panels, history, tools, view, snap, inspector, contrast,
// zoom, help — everything except Templates/File which stay top-right.
//
// All popovers triggered from the dock are repositioned to the right
// of the dock and given a compact layout.

(function(){
  'use strict';

  // ============================================================
  // Contrast control — body filter + persistence
  // ============================================================
  const CT_KEY = 'panel-designer:viewContrast';
  function readContrast(){
    const v = parseFloat(localStorage.getItem(CT_KEY));
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
  }
  function applyContrast(v){
    const bright = 1 + v * 0.45;
    const cont   = 1 - v * 0.55;
    const root = document.documentElement;
    root.style.setProperty('--pd-contrast', String(v));
    root.style.setProperty('--pd-filter', `brightness(${bright.toFixed(3)}) contrast(${cont.toFixed(3)})`);
    if (v <= 0.001) root.classList.remove('pd-contrast-on');
    else root.classList.add('pd-contrast-on');
  }
  applyContrast(readContrast());

  // ============================================================
  // SVG glyphs
  // ============================================================
  const G = {
    leftPanel:  `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="14" height="14"/><line x1="8" y1="3" x2="8" y2="17"/><rect x="3" y="3" width="5" height="14" fill="currentColor" opacity=".2"/></svg>`,
    rightPanel: `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="14" height="14"/><line x1="12" y1="3" x2="12" y2="17"/><rect x="12" y="3" width="5" height="14" fill="currentColor" opacity=".2"/></svg>`,
    undo: `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 6H14a4 4 0 0 1 0 8H7"/><path d="M9 3l-3 3 3 3"/></svg>`,
    redo: `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 6H6a4 4 0 0 0 0 8h7"/><path d="M11 3l3 3-3 3"/></svg>`,
    edit: `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 17l4-1 9-9-3-3-9 9-1 4z"/><path d="M12 5l3 3"/></svg>`,
    pan: `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 11V5a1.2 1.2 0 0 1 2.4 0v6"/><path d="M9.4 11V4a1.2 1.2 0 0 1 2.4 0v7"/><path d="M11.8 11V5a1.2 1.2 0 0 1 2.4 0v8"/><path d="M14.2 9c0-1 .8-1.6 1.6-1.6S17.4 8 17.4 9v3.8c0 2.6-2 4.7-4.7 4.7-2.3 0-3.7-1.3-4.7-2.7L5 10.5c-.4-.6-.4-1.3.2-1.8s1.4-.5 1.8 0L9 11"/></svg>`,
    select: `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 1.5"><rect x="3" y="3" width="14" height="14"/></svg>`,
    ruler: `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 13l10-10 4 4-10 10z"/><path d="M6 10l1.2 1.2M8.5 7.5l1.2 1.2M11 5l1.2 1.2M5 12l1.2 1.2" stroke-width="1.2"/></svg>`,
    view: `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/><circle cx="10" cy="10" r="2.4"/></svg>`,
    layers: `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M10 3L2 7l8 4 8-4-8-4z"/><path d="M2 11l8 4 8-4M2 15l8 4 8-4"/></svg>`,
    hardware: `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="10" cy="10" r="6"/><circle cx="10" cy="10" r="2.2" fill="currentColor"/><path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4"/></svg>`,
    snap: `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 3v3M3 9v2M3 14v3M9 3h2M14 3h3M17 9v2M17 14v3M9 17h2M14 17h3"/><rect x="7" y="7" width="6" height="6" stroke-width="1.5"/></svg>`,
    contrast: `<svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M10 2.5a7.5 7.5 0 0 0 0 15V2.5z"/></svg>`,
    fit: `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7V3h4M17 7V3h-4M3 13v4h4M17 13v4h-4"/></svg>`,
    reset: `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 10a6 6 0 1 0 1.7-4.2"/><path d="M5 3v4h4"/></svg>`,
    help: `<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="7.5"/><path d="M7.5 7.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5c0 1.6-2.5 1.8-2.5 3.5"/><circle cx="10" cy="14.5" r=".8" fill="currentColor"/></svg>`
  };

  // ============================================================
  // Top toolbar helpers
  // ============================================================
  function findTopBtn(predicate){
    return [...document.querySelectorAll('.toolbar button')].find(predicate);
  }
  function findMenuTrigger(name){
    return findTopBtn(b => new RegExp('^\\s*' + name, 'i').test(b.textContent || ''));
  }
  function findPanelToggle(which){
    // First .panel-toggle = Left, second = Right
    const arr = [...document.querySelectorAll('.toolbar .panel-toggle')];
    return which === 'left' ? arr[0] : arr[1];
  }
  function findUndoRedo(label){
    return findTopBtn(b => new RegExp('^\\s*[↩↪]?\\s*' + label + '\\s*$', 'i').test((b.textContent || '').trim()));
  }
  function findInspectorRailBtn(title){
    const rail = document.querySelector('.inspector-rail');
    if (!rail) return null;
    return [...rail.querySelectorAll('button')].find(b => (b.title || '').toLowerCase() === title.toLowerCase());
  }

  // ============================================================
  // Popover repositioner — slide it to the right of the dock
  // ============================================================
  let pendingAnchorRect = null;
  function repositionPopover(pop, anchorRect){
    if (!pop) return;
    pop.classList.add('pd-dock-popover');
    const apply = () => {
      const dock = document.getElementById('pd-tools-dock');
      if (!dock) return;
      const dockRect = dock.getBoundingClientRect();
      const desiredLeft = dockRect.right + 6;
      const popRect = pop.getBoundingClientRect();
      const currentLeft = parseFloat(pop.style.left || '0') || 0;
      const currentTop = parseFloat(pop.style.top || '0') || 0;
      const leftDelta = desiredLeft - popRect.left;
      let desiredTop = (anchorRect ? anchorRect.top : dockRect.top + 60) - 6;
      const vh = window.innerHeight;
      const popH = pop.offsetHeight || 240;
      if (desiredTop + popH > vh - 8) desiredTop = Math.max(8, vh - popH - 8);
      const topDelta = desiredTop - popRect.top;
      pop.style.setProperty('position','fixed','important');
      pop.style.setProperty('inset','auto','important');
      pop.style.setProperty('right','auto','important');
      pop.style.setProperty('bottom','auto','important');
      pop.style.setProperty('left', (currentLeft + leftDelta) + 'px','important');
      pop.style.setProperty('top', (currentTop + topDelta) + 'px','important');
      pop.style.setProperty('z-index','200','important');
    };
    apply();
    // Reapply after potential React effects / inset writes
    setTimeout(apply, 20);
    setTimeout(apply, 80);
    setTimeout(apply, 200);
  }
  // Continuously watch for popovers to reposition them while a dock
  // dispatch is pending. Stop after the first match.
  function watchForPopover(selector, anchorRect, callback){
    pendingAnchorRect = anchorRect;
    const start = Date.now();
    function tick(){
      const pops = [...document.querySelectorAll(selector)];
      const pop = pops.find(p=>!p.classList.contains('pd-dock-popover')) || pops[0];
      if (pop){
        repositionPopover(pop, anchorRect);
        pendingAnchorRect = null;
        callback && callback(pop);
        return;
      }
      if (Date.now() - start > 1200) { pendingAnchorRect = null; return; }
      setTimeout(tick, 20);
    }
    setTimeout(tick, 0);
  }

  // ============================================================
  // Action dispatchers
  // ============================================================
  function dispatchTopMenu(name, anchorRect){
    closeAllPopovers();
    const trig = findMenuTrigger(name);
    if (!trig) return;
    trig.click();
    lastOpenSource = { type:'top-menu', el: trig };
    setTimeout(hideRedundantTopChrome, 10);
    setTimeout(hideRedundantTopChrome, 80);
    watchForPopover('.toolbar-popover', anchorRect);
  }
  function dispatchToolsItem(pattern, anchorRect, opts){
    closeAllPopovers();
    const trig = findMenuTrigger('Tools');
    if (!trig) return;
    document.documentElement.classList.add('pd-dispatching');
    trig.click();
    setTimeout(()=>{
      const pop = document.querySelector('.toolbar-popover');
      if (pop){
        const btns = [...pop.querySelectorAll('button')];
        const target = btns.find(b => pattern.test((b.textContent || '').trim()));
        if (target) target.click();
      }
      setTimeout(()=>{
        if (document.querySelector('.toolbar-popover')) {
          findMenuTrigger('Tools')?.click();
        }
        setTimeout(()=>document.documentElement.classList.remove('pd-dispatching'), 50);
      }, 30);
    }, 0);
  }
  function dispatchInspectorRail(title, anchorRect){
    closeAllPopovers();
    const btn = findInspectorRailBtn(title);
    if (!btn) return;
    btn.click();
    lastOpenSource = { type:'inspector', el: btn };
    watchForPopover('.inspector-rail-popover, .rail-popover', anchorRect);
  }
  // Track the last source trigger so we can close it before opening a new one
  let lastOpenSource = null; // { type: 'top-menu'|'inspector', el }

  function closeAllPopovers(){
    if (lastOpenSource && lastOpenSource.el && document.contains(lastOpenSource.el)){
      try { lastOpenSource.el.click(); } catch(e){}
    }
    lastOpenSource = null;
    document.querySelector('.pd-contrast-panel')?.setAttribute('hidden','');
  }

  // ============================================================
  // Dock item config
  // ============================================================
  let activeMode = 'edit';
  let activeToggles = new Set();

  const SECTIONS = [
    [
      { id:'left',    glyph:G.leftPanel,  label:'L',     hint:'Toggle left panel',  type:'toggle-panel-left' },
      { id:'right',   glyph:G.rightPanel, label:'R',     hint:'Toggle right panel', type:'toggle-panel-right' }
    ],
    [
      { id:'undo',    glyph:G.undo,       label:'Undo',  hint:'Undo (⌘Z)',          type:'undo' },
      { id:'redo',    glyph:G.redo,       label:'Redo',  hint:'Redo (⌘⇧Z)',         type:'redo' }
    ],
    [
      { id:'edit',    glyph:G.edit,       label:'Edit',   hint:'Edit',   type:'tool-mode', match:/edit/i },
      { id:'pan',     glyph:G.pan,        label:'Pan',    hint:'Pan',    type:'tool-mode', match:/pan/i },
      { id:'ruler',   glyph:G.ruler,      label:'Ruler',  hint:'Ruler',  type:'tool-mode', match:/ruler/i }
    ],
    [
      { id:'view',    glyph:G.view,       label:'View',    hint:'View modes & overlays', type:'top-menu', name:'View' },
      { id:'layers',  glyph:G.layers,     label:'Layers',  hint:'Layer visibility',    type:'inspector', title:'layers' },
      { id:'hw',      glyph:G.hardware,   label:'Hard',    hint:'Top hardware',         type:'inspector', title:'top hardware' }
    ],
    [
      { id:'snap',    glyph:G.snap,       label:'Snap',     hint:'Snap',     type:'top-menu', name:'Snap' },
      { id:'contrast',glyph:G.contrast,   label:'Tone',     hint:'View contrast', type:'contrast' }
    ],
    [
      { id:'fit',     glyph:G.fit,        label:'Fit',      hint:'Fit panel to screen', type:'tools-item', match:/fit.to.screen|fit$/i },
      { id:'reset',   glyph:G.reset,      label:'Reset',    hint:'Reset view',         type:'tools-item', match:/reset.view|reset$/i }
    ],
    [
      { id:'help',    glyph:G.help,       label:'Help',     hint:'Help & shortcuts',   type:'top-menu', name:'Help' }
    ]
  ];

  function setActiveStyling(){
    const dock = document.getElementById('pd-tools-dock');
    if (!dock) return;
    dock.querySelectorAll('button[data-tool]').forEach(b=>{
      const id = b.getAttribute('data-tool');
      const isMode = b.getAttribute('data-type') === 'tool-mode';
      if (isMode) b.classList.toggle('on', activeMode === id);
    });
    // Mirror left/right panel-open state
    const app = document.querySelector('.app');
    const leftOpen = !!app?.classList.contains('left-panel-open');
    const rightOpen = !!app?.classList.contains('right-panel-open');
    dock.querySelector('button[data-tool="left"]')?.classList.toggle('on', leftOpen);
    dock.querySelector('button[data-tool="right"]')?.classList.toggle('on', rightOpen);
    // Contrast on?
    dock.querySelector('button[data-tool="contrast"]')?.classList.toggle('on', readContrast() > 0.01);
  }

  function handleClick(item, btn){
    const anchorRect = btn.getBoundingClientRect();
    switch(item.type){
      case 'toggle-panel-left':  findPanelToggle('left')?.click();  setActiveStyling(); break;
      case 'toggle-panel-right': findPanelToggle('right')?.click(); setActiveStyling(); break;
      case 'undo':               findUndoRedo('Undo')?.click(); break;
      case 'redo':               findUndoRedo('Redo')?.click(); break;
      case 'tool-mode':
        activeMode = item.id;
        setActiveStyling();
        dispatchToolsItem(item.match, anchorRect);
        break;
      case 'tools-item':
        dispatchToolsItem(item.match, anchorRect);
        break;
      case 'top-menu':
        dispatchTopMenu(item.name, anchorRect);
        break;
      case 'inspector':
        dispatchInspectorRail(item.title, anchorRect);
        break;
      case 'contrast':
        toggleContrastPanel(anchorRect);
        break;
    }
  }

  function buildDock(){
    if (document.getElementById('pd-tools-dock')) return;
    const dock = document.createElement('div');
    dock.id = 'pd-tools-dock';
    dock.className = 'pd-tools-dock';
    dock.setAttribute('role','toolbar');
    dock.setAttribute('aria-label','Command panel');

    SECTIONS.forEach((items, idx)=>{
      if (idx > 0){
        const s = document.createElement('div');
        s.className = 'pd-tools-sep';
        dock.appendChild(s);
      }
      items.forEach(item=>{
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('data-tool', item.id);
        b.setAttribute('data-type', item.type);
        b.setAttribute('title', item.hint);
        b.setAttribute('aria-label', item.hint);
        b.innerHTML = `<span class="pd-tool-glyph">${item.glyph}</span><span class="pd-tool-label">${item.label}</span>`;
        b.addEventListener('click', e=>{
          e.stopPropagation();
          handleClick(item, b);
        });
        dock.appendChild(b);
      });
    });

    // Dock lives at body level so React's reconciliation doesn't
    // try to remove it as a child of the canvas-wrap.
    document.body.appendChild(dock);
    setActiveStyling();

    // Mark the canvas so its HUD elements shift right; this class is
    // harmless to React and we re-apply it whenever needed.
    const cw = document.querySelector('.canvas-wrap');
    if (cw) cw.classList.add('has-tools-dock');

    positionDock();
    window.addEventListener('resize', positionDock, {passive:true});
  }

  function positionDock(){
    const dock = document.getElementById('pd-tools-dock');
    if (!dock) return;
    const cw = document.querySelector('.canvas-wrap');
    if (cw){
      const r = cw.getBoundingClientRect();
      document.documentElement.style.setProperty('--pd-dock-left', (r.left + 8) + 'px');
    }
  }

  function tryBuildDock(){
    if (!document.querySelector('.workspace')) {
      setTimeout(tryBuildDock, 200);
      return;
    }
    buildDock();
    setupContrastPanel();
    hideRedundantTopChrome();
  }
  if (document.readyState !== 'loading') tryBuildDock();
  else document.addEventListener('DOMContentLoaded', tryBuildDock);

  // ============================================================
  // Contrast panel state (declared early so setupContrastPanel
  // can be safely called from tryBuildDock without TDZ errors)
  // ============================================================
  var contrastPanelEl = null;
  function setupContrastPanel(){
    if (contrastPanelEl) return;
    const panel = document.createElement('div');
    panel.className = 'pd-contrast-panel pd-dock-popover';
    panel.setAttribute('hidden','');
    panel.innerHTML = `
      <div class="pd-cw-title">View contrast</div>
      <div class="pd-cw-row">
        <span class="pd-cw-mark pd-cw-mark-dark">DARK</span>
        <input type="range" min="0" max="100" value="${Math.round(readContrast()*100)}" class="pd-cw-range" aria-label="Contrast level">
        <span class="pd-cw-mark pd-cw-mark-light">GRAY</span>
      </div>
      <div class="pd-cw-presets">
        <button type="button" data-v="0">Off</button>
        <button type="button" data-v="20">Soft</button>
        <button type="button" data-v="45">Medium</button>
        <button type="button" data-v="70">Light</button>
      </div>
      <div class="pd-cw-note">Lifts the page from pure black toward gray.</div>
    `;
    document.body.appendChild(panel);
    contrastPanelEl = panel;

    const range = panel.querySelector('.pd-cw-range');
    function setVal(v){
      const clamped = Math.max(0, Math.min(100, v|0));
      range.value = clamped;
      const f = clamped/100;
      applyContrast(f);
      localStorage.setItem(CT_KEY, String(f));
      setActiveStyling();
    }
    range.addEventListener('input', e=>setVal(+e.target.value));
    panel.querySelectorAll('.pd-cw-presets button').forEach(b=>{
      b.addEventListener('click', ()=>setVal(+b.dataset.v));
    });
    document.addEventListener('click', e=>{
      if (panel.hasAttribute('hidden')) return;
      const dock = document.getElementById('pd-tools-dock');
      if (dock?.contains(e.target) || panel.contains(e.target)) return;
      panel.setAttribute('hidden','');
    });
  }
  function toggleContrastPanel(anchorRect){
    if (!contrastPanelEl) setupContrastPanel();
    closeAllPopovers();
    const open = !contrastPanelEl.hasAttribute('hidden');
    if (open) {
      contrastPanelEl.setAttribute('hidden','');
      return;
    }
    contrastPanelEl.removeAttribute('hidden');
    repositionPopover(contrastPanelEl, anchorRect);
  }

  // ============================================================
  // MutationObserver — keep dock alive across re-renders, mirror state
  // ============================================================
  const reattach = () => {
    if (!document.getElementById('pd-tools-dock')) buildDock();
    const cw = document.querySelector('.canvas-wrap');
    if (cw && !cw.classList.contains('has-tools-dock')) cw.classList.add('has-tools-dock');
    setActiveStyling();
    positionDock();
    hideRedundantTopChrome();
  };
  const mo = new MutationObserver(()=>{
    if (mo._t) return;
    mo._t = setTimeout(()=>{ mo._t=null; reattach(); }, 80);
  });
  function startObserver(){
    const root = document.getElementById('root');
    if (!root) { setTimeout(startObserver, 100); return; }
    mo.observe(root, {childList:true, subtree:true});
  }
  startObserver();

  // ============================================================
  // Hide top toolbar items + inspector rail (functionality moved to dock)
  // ============================================================
  function hideRedundantTopChrome(){
    document.querySelectorAll('.toolbar > button').forEach(b=>{
      const t = (b.textContent || '').trim().toLowerCase();
      const keep = /^templates/.test(t) || /^file/.test(t);
      if (keep){
        if (b.hasAttribute('data-pd-hide')) b.removeAttribute('data-pd-hide');
      } else {
        if (!b.hasAttribute('data-pd-hide')) b.setAttribute('data-pd-hide','');
      }
    });
    const rail = document.querySelector('.inspector-rail');
    if (rail && !rail.hasAttribute('data-pd-hide')) rail.setAttribute('data-pd-hide','');
  }
  // Run repeatedly to catch React re-renders that may re-add buttons
  setTimeout(hideRedundantTopChrome, 100);
  setTimeout(hideRedundantTopChrome, 500);
  setTimeout(hideRedundantTopChrome, 1500);
  // Dedicated observer on the toolbar to immediately re-hide on changes
  function observeToolbar(){
    const tb = document.querySelector('.toolbar');
    if (!tb) { setTimeout(observeToolbar, 300); return; }
    let pending = false;
    const tbMo = new MutationObserver(()=>{
      if (pending) return;
      pending = true;
      requestAnimationFrame(()=>{ pending = false; hideRedundantTopChrome(); });
    });
    tbMo.observe(tb, {childList:true, subtree:true});
    hideRedundantTopChrome();
  }
  observeToolbar();

})();
