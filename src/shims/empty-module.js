// Minimal shim for modules that are React Native or server-only and not needed in the browser.
// Exports an empty object and noop functions to satisfy imports during client bundling.
const noop = () => {};
module.exports = {
  default: {},
  __esModule: true,
  noop,
};
