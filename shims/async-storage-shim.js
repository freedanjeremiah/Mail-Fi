// Minimal shim for @react-native-async-storage/async-storage used by MetaMask SDK in web builds
module.exports = {
  getItem: async (key) => null,
  setItem: async (key, value) => null,
  removeItem: async (key) => null,
  clear: async () => null,
};
