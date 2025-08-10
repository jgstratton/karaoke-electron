const { contextBridge, ipcRenderer } = require('electron')

// Expose a minimal API if needed
contextBridge.exposeInMainWorld('env', {
	isElectron: true,
	getUrlParams: () => new URLSearchParams(window.location.search),
})

// Expose file system operations
contextBridge.exposeInMainWorld('fileSystem', {
	selectFolder: () => ipcRenderer.invoke('select-folder'),
	validatePath: path => ipcRenderer.invoke('validate-path', path),
	scanMediaFiles: folderPath => ipcRenderer.invoke('scan-media-files', folderPath),
})
