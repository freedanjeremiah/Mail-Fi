chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "PING") {
    sendResponse({ ok: true });
  }
  // TODO: bridge to your Next.js API (fetch to /api/* if needed)
  return true;
});
