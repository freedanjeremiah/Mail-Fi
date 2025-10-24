chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "PING") {
    sendResponse({ ok: true });
  }
  // Ensure a page-level variable is set by executing script in the page context.
  if (msg?.type === 'ENSURE_NEXUS_CONFIG') {
    const url = msg.url;
    const tabId = _sender?.tab?.id;
    if (tabId && url) {
      try {
        chrome.scripting.executeScript(
          {
            target: { tabId },
            func: (u: string) => {
              try {
                // run in page (MAIN) world
                (window as any).__MAILFI_NEXUS_UMD_URL = u;
                try { window.postMessage({ type: 'MAILFI_NEXUS_CONFIG_LOADED', url: u }, '*'); } catch (e) {}
              } catch (e) {}
            },
            args: [url],
            world: 'MAIN',
          },
          () => {
            sendResponse({ ok: true });
          }
        );
        return true; // indicate async response
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
        return true;
      }
    }
    sendResponse({ ok: false, error: 'missing tabId or url' });
  }
  // TODO: bridge to your Next.js API (fetch to /api/* if needed)
  return true;
});
