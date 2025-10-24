// Minimal wrapper that imports the Nexus SDK and attaches a constructor to window.NexusSDK
// This file will be bundled into a standalone UMD-like script that assigns window.NexusSDK

import { NexusSDK } from '@avail-project/nexus';

(function() {
  // expose a simple constructor on window
  window.NexusSDK = NexusSDK;
})();
