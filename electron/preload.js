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
	playVideo: videoPath => ipcRenderer.invoke('play-video', videoPath),
})

// Expose video player events
contextBridge.exposeInMainWorld('videoPlayer', {
	onPlayVideo: callback => ipcRenderer.on('play-video', callback),
	removePlayVideoListener: callback => ipcRenderer.removeListener('play-video', callback),
})

// Expose video control sync
contextBridge.exposeInMainWorld('videoControls', {
	sendControl: (action, data) => ipcRenderer.invoke('video-control', action, data),
	onVideoControl: callback => ipcRenderer.on('video-control', callback),
	removeVideoControlListener: callback => ipcRenderer.removeListener('video-control', callback),
})

// Expose video state sync
contextBridge.exposeInMainWorld('videoState', {
	getCurrentState: () => ipcRenderer.invoke('get-current-video-state'),
	onGetVideoState: callback => ipcRenderer.on('get-video-state', callback),
	sendVideoState: state => ipcRenderer.send('video-state-response', state),
	removeGetVideoStateListener: callback => ipcRenderer.removeListener('get-video-state', callback),
})
