// Minimal process/browser shim used at build-time when process/browser isn't available
module.exports = {
  env: {},
  argv: [],
  // minimal next expects
  nextTick: function (cb) { if (typeof cb === 'function') cb(); },
};
