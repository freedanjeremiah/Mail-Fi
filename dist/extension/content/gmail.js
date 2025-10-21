// extension/content/gmail.ts
function ensurePanel() {
  const id = "mailfi-panel";
  let panel = document.getElementById(id);
  if (!panel) {
    panel = document.createElement("iframe");
    panel.id = id;
    panel.src = chrome.runtime.getURL("ui/panel.html");
    panel.style.position = "fixed";
    panel.style.top = "64px";
    panel.style.right = "16px";
    panel.style.width = "380px";
    panel.style.height = "520px";
    panel.style.border = "0";
    panel.style.boxShadow = "0 12px 32px rgba(0,0,0,.2)";
    panel.style.borderRadius = "12px";
    panel.style.zIndex = "2147483647";
    panel.style.display = "none";
    document.body.appendChild(panel);
  }
  return panel;
}
function ensureFab(panel) {
  const id = "mailfi-fab";
  let btn = document.getElementById(id);
  if (!btn) {
    btn = document.createElement("button");
    btn.id = id;
    btn.textContent = "Pay with Avail";
    btn.className = "mailfi-fab";
    btn.addEventListener("click", () => {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });
    document.body.appendChild(btn);
  }
  return btn;
}
function togglePanel(panel, recipient) {
  panel.style.display = panel.style.display === "none" ? "block" : "none";
  if (recipient && panel.style.display === "block") {
    panel.contentWindow?.postMessage({ type: "SET_RECIPIENT", recipient }, "*");
  }
}
function injectComposeButton(composeWindow, panel) {
  const toolbar = composeWindow.querySelector('[role="toolbar"]');
  console.log("[Mail-Fi] Toolbar found:", !!toolbar, composeWindow);
  if (!toolbar) return;
  const existingBtn = toolbar.querySelector(".mailfi-compose-btn");
  if (existingBtn) return;
  const btn = document.createElement("button");
  btn.className = "mailfi-compose-btn";
  btn.setAttribute("aria-label", "Pay with Avail");
  btn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
    </svg>
    <span style="margin-left: 4px;">Pay with Avail</span>
  `;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const toField = composeWindow.querySelector('input[name="to"]');
    const recipient = toField?.value || "";
    togglePanel(panel, recipient);
  });
  const lastBtn = toolbar.querySelector('[role="button"]:last-child');
  if (lastBtn) {
    toolbar.insertBefore(btn, lastBtn);
  } else {
    toolbar.appendChild(btn);
  }
}
function observeComposeWindows(panel) {
  const observer = new MutationObserver(() => {
    const composeWindows = document.querySelectorAll('[role="dialog"], div[class*="M9"]');
    console.log("[Mail-Fi] Found compose windows:", composeWindows.length);
    composeWindows.forEach((win) => {
      injectComposeButton(win, panel);
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  const existingComposeWindows = document.querySelectorAll('[role="dialog"], div[class*="M9"]');
  console.log("[Mail-Fi] Initial compose windows:", existingComposeWindows.length);
  existingComposeWindows.forEach((win) => {
    injectComposeButton(win, panel);
  });
}
(function init() {
  if (!/mail\.google\.com/.test(location.host)) return;
  const panel = ensurePanel();
  ensureFab(panel);
  observeComposeWindows(panel);
  chrome.runtime.sendMessage({ type: "PING" }, () => {
  });
})();
//# sourceMappingURL=gmail.js.map
