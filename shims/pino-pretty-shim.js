// Minimal shim for pino-pretty used by pino in browser builds (no-op formatter)
module.exports = function pinoPretty() {
  return function () { return ''; };
};
