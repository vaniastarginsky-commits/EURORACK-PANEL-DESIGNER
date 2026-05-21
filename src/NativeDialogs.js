// Native modal/prompt primitives extracted from core.js.
// They intentionally keep the existing DOM/CSS contract unchanged.

function appConfirm(opts) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "app-native-modal-backdrop";
    backdrop.innerHTML = `
      <div class="app-native-modal-card app-confirm-card" role="dialog" aria-modal="true">
        <div class="app-native-modal-title"></div>
        <div class="app-native-modal-subtitle"></div>
        <div class="app-native-modal-actions">
          <button class="app-native-modal-cancel"></button>
          <button class="app-native-modal-confirm"></button>
        </div>
      </div>
    `;
    const title = backdrop.querySelector(".app-native-modal-title");
    const subtitle = backdrop.querySelector(".app-native-modal-subtitle");
    const cancel = backdrop.querySelector(".app-native-modal-cancel");
    const confirm = backdrop.querySelector(".app-native-modal-confirm");
    title.textContent = opts.title;
    subtitle.textContent = opts.message;
    cancel.textContent = opts.cancelText || "Cancel";
    confirm.textContent = opts.confirmText || "OK";
    confirm.className =
      "app-native-modal-confirm " + (opts.danger ? "danger" : "primary");
    let done = false;
    const close = (value) => {
      if (done) return;
      done = true;
      backdrop.classList.add("leaving");
      window.setTimeout(() => {
        backdrop.remove();
        resolve(value);
      }, 130);
    };
    backdrop.addEventListener("pointerdown", (e) => {
      if (e.target === backdrop) close(false);
    });
    cancel.addEventListener("click", () => close(false));
    confirm.addEventListener("click", () => close(true));
    backdrop.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    });
    document.body.appendChild(backdrop);
    window.setTimeout(() => {
      confirm.focus();
    }, 0);
  });
}
function appNumberPrompt(opts) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "app-native-modal-backdrop";
    backdrop.innerHTML = `
      <div class="app-native-modal-card app-number-card" role="dialog" aria-modal="true">
        <div class="app-native-modal-title"></div>
        <div class="app-native-modal-subtitle"></div>
        <label class="app-native-modal-label"></label>
        <input class="app-number-input app-native-modal-input" type="number" />
        <div class="app-native-modal-actions">
          <button class="app-native-modal-cancel">Cancel</button>
          <button class="app-native-modal-confirm primary"></button>
        </div>
      </div>
    `;
    const title = backdrop.querySelector(".app-native-modal-title");
    const subtitle = backdrop.querySelector(".app-native-modal-subtitle");
    const label = backdrop.querySelector(".app-native-modal-label");
    const input = backdrop.querySelector(".app-number-input");
    const cancel = backdrop.querySelector(".app-native-modal-cancel");
    const confirm = backdrop.querySelector(".app-native-modal-confirm");
    title.textContent = opts.title;
    subtitle.textContent = opts.subtitle || "";
    subtitle.style.display = opts.subtitle ? "" : "none";
    label.textContent = opts.label;
    input.value = opts.defaultValue;
    if (opts.min !== undefined) input.min = String(opts.min);
    if (opts.step !== undefined) input.step = String(opts.step);
    confirm.textContent = opts.confirmText || "Apply";
    const validate = () => {
      const v = parseFloat(input.value || "");
      confirm.disabled =
        !Number.isFinite(v) || (opts.min !== undefined && v < opts.min);
    };
    let done = false;
    const close = (value) => {
      if (done) return;
      done = true;
      backdrop.classList.add("leaving");
      window.setTimeout(() => {
        backdrop.remove();
        resolve(value);
      }, 130);
    };
    const submit = () => {
      const v = parseFloat(input.value || "");
      if (!Number.isFinite(v) || (opts.min !== undefined && v < opts.min))
        return;
      close(v);
    };
    backdrop.addEventListener("pointerdown", (e) => {
      if (e.target === backdrop) close(null);
    });
    cancel.addEventListener("click", () => close(null));
    confirm.addEventListener("click", submit);
    input.addEventListener("input", validate);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close(null);
      if (e.key === "Enter") submit();
    });
    document.body.appendChild(backdrop);
    window.setTimeout(() => {
      input.focus();
      input.select();
      validate();
    }, 0);
  });
}
function appPatternPrompt() {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "app-native-modal-backdrop";
    backdrop.innerHTML = `
      <div class="app-native-modal-card app-pattern-card" role="dialog" aria-modal="true">
        <div class="app-native-modal-title">Duplicate pattern</div>
        <div class="app-native-modal-subtitle">Create repeated copies of the current selection.</div>
        <div class="app-pattern-grid">
          <label><span>Steps</span><input class="pattern-count app-native-modal-input" type="number" min="1" max="64" step="1" value="3" /></label>
          <label><span>Spacing mm</span><input class="pattern-spacing app-native-modal-input" type="number" min="0.01" step="0.1" value="10" /></label>
        </div>
        <label class="app-native-modal-label">Direction</label>
        <div class="app-pattern-directions">
          <button data-dir="up">↑ Up</button>
          <button data-dir="down" class="active">↓ Down</button>
          <button data-dir="left">← Left</button>
          <button data-dir="right">→ Right</button>
        </div>
        <div class="app-native-modal-actions">
          <button class="app-native-modal-cancel">Cancel</button>
          <button class="app-native-modal-confirm primary">Duplicate</button>
        </div>
      </div>
    `;
    const countInput = backdrop.querySelector(".pattern-count");
    const spacingInput = backdrop.querySelector(".pattern-spacing");
    const cancel = backdrop.querySelector(".app-native-modal-cancel");
    const confirm = backdrop.querySelector(".app-native-modal-confirm");
    let direction = "down";
    const validate = () => {
      const count = parseInt(countInput.value || "0", 10);
      const spacing = parseFloat(spacingInput.value || "0");
      confirm.disabled =
        !Number.isFinite(count) ||
        count < 1 ||
        !Number.isFinite(spacing) ||
        spacing <= 0;
    };
    backdrop
      .querySelectorAll(".app-pattern-directions button")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          backdrop
            .querySelectorAll(".app-pattern-directions button")
            .forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          direction = btn.dataset.dir;
        });
      });
    let done = false;
    const close = (value) => {
      if (done) return;
      done = true;
      backdrop.classList.add("leaving");
      window.setTimeout(() => {
        backdrop.remove();
        resolve(value);
      }, 130);
    };
    const submit = () => {
      const count = Math.max(1, parseInt(countInput.value || "0", 10));
      const spacing = parseFloat(spacingInput.value || "0");
      if (!Number.isFinite(count) || !Number.isFinite(spacing) || spacing <= 0)
        return;
      close({ count, direction, spacing });
    };
    backdrop.addEventListener("pointerdown", (e) => {
      if (e.target === backdrop) close(null);
    });
    cancel.addEventListener("click", () => close(null));
    confirm.addEventListener("click", submit);
    countInput.addEventListener("input", validate);
    spacingInput.addEventListener("input", validate);
    [countInput, spacingInput].forEach((input) =>
      input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close(null);
        if (e.key === "Enter") submit();
      }),
    );
    document.body.appendChild(backdrop);
    window.setTimeout(() => {
      countInput.focus();
      countInput.select();
      validate();
    }, 0);
  });
}
function appTextPrompt(opts) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "app-native-modal-backdrop";
    backdrop.innerHTML = `
      <div class="app-native-modal-card" role="dialog" aria-modal="true">
        <div class="app-native-modal-title"></div>
        <div class="app-native-modal-subtitle"></div>
        <label class="app-native-modal-label"></label>
        <input class="app-native-modal-input" type="text" />
        <div class="app-native-modal-actions">
          <button class="app-native-modal-cancel"></button>
          <button class="app-native-modal-confirm primary"></button>
        </div>
      </div>
    `;
    const card = backdrop.querySelector(".app-native-modal-card");
    const title = backdrop.querySelector(".app-native-modal-title");
    const subtitle = backdrop.querySelector(".app-native-modal-subtitle");
    const label = backdrop.querySelector(".app-native-modal-label");
    const input = backdrop.querySelector(".app-native-modal-input");
    const cancel = backdrop.querySelector(".app-native-modal-cancel");
    const confirm = backdrop.querySelector(".app-native-modal-confirm");
    title.textContent = opts.title;
    subtitle.textContent = opts.subtitle || "";
    subtitle.style.display = opts.subtitle ? "" : "none";
    label.textContent = opts.label || "";
    label.style.display = opts.label ? "" : "none";
    input.value = opts.defaultValue || "";
    cancel.textContent = opts.cancelText || "Cancel";
    confirm.textContent = opts.confirmText || "OK";
    let done = false;
    const close = (value) => {
      if (done) return;
      done = true;
      backdrop.classList.add("leaving");
      window.setTimeout(() => {
        backdrop.remove();
        resolve(value);
      }, 130);
    };
    backdrop.addEventListener("pointerdown", (e) => {
      if (e.target === backdrop) close(null);
    });
    cancel.addEventListener("click", () => close(null));
    confirm.addEventListener("click", () => close(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close(null);
      if (e.key === "Enter") close(input.value);
    });
    input.addEventListener("input", () => {
      confirm.disabled = !input.value.trim();
    });
    document.body.appendChild(backdrop);
    window.setTimeout(() => {
      input.focus();
      input.select();
      confirm.disabled = !input.value.trim();
    }, 0);
  });
}
