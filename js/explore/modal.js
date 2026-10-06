export const showInputModal = ({ title = "Input", hint = "", placeholder = "" }) =>
  new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <span class="modal-icon">📥</span>
          <span class="modal-title">${title}</span>
        </div>
        <div class="modal-body">
          ${hint ? `<div class="modal-prompt">${hint}</div>` : ""}
          <textarea class="modal-input" rows="6"
                    placeholder="${placeholder}"
                    spellcheck="false"></textarea>
        </div>
        <div class="modal-footer">
          <button class="modal-btn" data-act="cancel">Cancel</button>
          <button class="modal-btn primary" data-act="ok">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const ta = overlay.querySelector(".modal-input");
    setTimeout(() => ta.focus(), 50);

    const close = (value) => {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
      resolve(value);
    };

    const onKey = (e) => {
      if (e.key === "Escape") close(null);
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) close(ta.value);
    };
    document.addEventListener("keydown", onKey);

    overlay.querySelector('[data-act="cancel"]').onclick = () => close(null);
    overlay.querySelector('[data-act="ok"]').onclick = () => close(ta.value);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(null);
    });
  });