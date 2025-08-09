const { contextBridge } = require('electron');

// Expose a minimal API if needed
contextBridge.exposeInMainWorld('env', { 
  isElectron: true,
  getUrlParams: () => new URLSearchParams(window.location.search)
});
