import { ipcRenderer } from "electron"

// Video Player API
export interface IVideoPlayerAPI {

	// toggle events
	startNewVideo: (videoPath: string) => void
	unpauseVideo: () => void
	pauseVideo: () => void
	changeVolume: (volume: number) => void
	updateCurrentTime: (currentTime: number) => void
	updateDuration: (duration: number) => void

	// event listeners
	onStartNewVideo: (callback: (event: Electron.IpcRendererEvent, videoPath: string) => void) => void
	onPauseVideo: (callback: (event: Electron.IpcRendererEvent) => void) => void
	onUnpauseVideo: (callback: (event: Electron.IpcRendererEvent) => void) => void
	onVolumeChange: (callback: (event: Electron.IpcRendererEvent, volume: number) => void) => void
	onUpdateCurrentTime: (callback: (event: Electron.IpcRendererEvent, currentTime: number) => void) => void
	onUpdateDuration: (callback: (event: Electron.IpcRendererEvent, duration: number) => void) => void

	//remove event listeners
	removeStartNewVideoListener: (callback: (event: Electron.IpcRendererEvent, videoPath: string) => void) => void
	removePauseVideoListener: (callback: (event: Electron.IpcRendererEvent) => void) => void
	removeUnpauseVideoListener: (callback: (event: Electron.IpcRendererEvent) => void) => void
	removeVolumeChangeListener: (callback: (event: Electron.IpcRendererEvent, volume: number) => void) => void
	removeUpdateCurrentTimeListener: (callback: (event: Electron.IpcRendererEvent, currentTime: number) => void) => void
	removeUpdateDurationListener: (callback: (event: Electron.IpcRendererEvent, duration: number) => void) => void
	toggleFullscreen: () => Promise<void>
}

// Expose video player events
export const VideoPlayerAPI: IVideoPlayerAPI = {
	// toggle events
	startNewVideo: (videoPath) => {
		console.log("Starting New Video:", videoPath)
		ipcRenderer.send('play-video', videoPath)
	},
	pauseVideo: () => ipcRenderer.send('pause-video'),
	unpauseVideo: () => ipcRenderer.send('unpause-video'),
	changeVolume: (volume) => ipcRenderer.send('set-volume', volume),
	updateCurrentTime: (currentTime) => ipcRenderer.send('set-current-time', currentTime),
	updateDuration: (duration) => ipcRenderer.send('set-duration', duration),

	// event listeners
	onStartNewVideo: (callback) => {
		console.log("Start New Video Listener Added")
		ipcRenderer.on('play-video', callback)
	},
	onPauseVideo: (callback) => {
		ipcRenderer.on('pause-video', callback)
	},
	onUnpauseVideo: (callback) => {
		ipcRenderer.on('unpause-video', callback)
	},
	onVolumeChange: (callback) => {
		ipcRenderer.on('volume-change', callback)
	},
	onUpdateCurrentTime: (callback) => {
		ipcRenderer.on('set-current-time', callback)
	},
	onUpdateDuration: (callback) => {
		ipcRenderer.on('set-duration', callback)
	},

	// remove event listeners
	removeStartNewVideoListener: (callback) => {
		ipcRenderer.removeListener('play-video', callback)
	},
	removePauseVideoListener: (callback) => {
		ipcRenderer.removeListener('pause-video', callback)
	},
	removeUnpauseVideoListener: (callback) => {
		ipcRenderer.removeListener('unpause-video', callback)
	},
	removeVolumeChangeListener: (callback) => {
		ipcRenderer.removeListener('volume-change', callback)
	},
	removeUpdateCurrentTimeListener: (callback) => {
		ipcRenderer.removeListener('set-current-time', callback)
	},
	removeUpdateDurationListener: (callback) => {
		ipcRenderer.removeListener('set-duration', callback)
	},
	toggleFullscreen: (): Promise<void> => ipcRenderer.invoke('toggle-fullscreen'),
}

