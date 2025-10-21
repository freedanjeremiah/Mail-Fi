// extension/background/index.ts
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "PING") {
    sendResponse({ ok: true });
  }
  return true;
});
//# sourceMappingURL=index.js.map
