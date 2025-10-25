// Load polyfills only in the browser to avoid server-side build/runtime errors.
// Some libraries (Nexus, crypto-related) expect `Buffer` and `process` globals.
// This file runs in client-only modules; we synchronously require the
// browser-friendly polyfills so they're available during module evaluation.

if (typeof window !== 'undefined') {
  try {
    // Synchronous require ensures Buffer is present before other modules run.
    // Using require keeps this out of server-side bundles because this
    // module is imported only from 'use client' modules.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const buffer = require('buffer');
    const Buffer = buffer?.Buffer || (buffer as any);
    (window as any).Buffer = Buffer;
    // Provide aliases for methods that some libraries call with different casing
    // (writeUint32BE vs writeUInt32BE). Add these defensively on the prototype.
    try {
      const proto = (Buffer && Buffer.prototype) || {};
      if (!proto.writeUint32BE && proto.writeUInt32BE) {
        proto.writeUint32BE = proto.writeUInt32BE;
      }
      if (!proto.writeUint32LE && proto.writeUInt32LE) {
        proto.writeUint32LE = proto.writeUInt32LE;
      }
      if (!proto.readUint32BE && proto.readUInt32BE) {
        proto.readUint32BE = proto.readUInt32BE;
      }
      if (!proto.readUint32LE && proto.readUInt32LE) {
        proto.readUint32LE = proto.readUInt32LE;
      }
    } catch (e) {
      // ignore if prototype manipulation fails
    }
  } catch (e) {
    // ignore; if Buffer can't be set, downstream code will handle it
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const proc = require('process/browser');
    (window as any).process = proc?.default || proc;
  } catch (e) {
    // ignore
  }

  try {
    // Some libs check `global` for Node-like globals.
    (window as any).global = window;
  } catch (e) {
    // ignore
  }
}

export {};
