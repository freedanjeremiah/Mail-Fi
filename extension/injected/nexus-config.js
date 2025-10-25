// Small external config file (avoids inline scripts which violate Gmail CSP)
// This file sets the dev UMD URL for the in-page initializer to pick up.
(function(){
  try {
    window.__MAILFI_NEXUS_UMD_URL = "http://localhost:3000/nexus-umd.js";
    // signal for debugging
    try { window.postMessage({ type: 'MAILFI_NEXUS_CONFIG_LOADED', url: window.__MAILFI_NEXUS_UMD_URL }, '*'); } catch(e){}
  } catch (e) {
    // ignore
  }
})();
