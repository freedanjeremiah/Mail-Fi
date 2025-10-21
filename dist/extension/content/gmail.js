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
(function init() {
  if (!/mail\.google\.com/.test(location.host)) return;
  const panel = ensurePanel();
  ensureFab(panel);
  chrome.runtime.sendMessage({ type: "PING" }, () => {
  });
})();
//# sourceMappingURL=gmail.js.map
