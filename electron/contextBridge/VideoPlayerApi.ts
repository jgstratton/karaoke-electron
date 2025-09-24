import { ipcRenderer } from "electron"

export const EVENT_PAUSE_VIDEO = "pause-video";
export const EVENT_UNPAUSE_VIDEO = "unpause-video";
export const EVENT_SET_VOLUME = "set-volume";
export const EVENT_SET_STARTING_TIME = "set-starting-time";

// Video Player API
export interface IVideoPlayerAPI {

	// toggle events
	startNewVideo: (videoPath: string) => void
	unpauseVideo: () => void
	pauseVideo: () => void
	changeVolume: (volume: number) => void
	updateCurrentTime: (currentTime: number) => void
	updateStartingTime: (startingTime: number) => void
	updateDuration: (duration: number) => void

	// event listeners
	onStartNewVideo: (callback: (event: Electron.IpcRendererEvent, videoPath: string) => void) => void
	onPauseVideo: (callback: (event: Electron.IpcRendererEvent) => void) => void
	onUnpauseVideo: (callback: (event: Electron.IpcRendererEvent) => void) => void
	onVolumeChange: (callback: (event: Electron.IpcRendererEvent, volume: number) => void) => void
	onUpdateCurrentTime: (callback: (event: Electron.IpcRendererEvent, currentTime: number) => void) => void
	onUpdateStartingTime: (callback: (event: Electron.IpcRendererEvent, startingTime: number) => void) => void
	onUpdateDuration: (callback: (event: Electron.IpcRendererEvent, duration: number) => void) => void

	//remove event listeners
	removeStartNewVideoListener: (callback: (event: Electron.IpcRendererEvent, videoPath: string) => void) => void
	removePauseVideoListener: (callback: (event: Electron.IpcRendererEvent) => void) => void
	removeUnpauseVideoListener: (callback: (event: Electron.IpcRendererEvent) => void) => void
	removeVolumeChangeListener: (callback: (event: Electron.IpcRendererEvent, volume: number) => void) => void
	removeUpdateCurrentTimeListener: (callback: (event: Electron.IpcRendererEvent, currentTime: number) => void) => void
	removeUpdateStartingTimeListener: (callback: (event: Electron.IpcRendererEvent, startingTime: number) => void) => void
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
	pauseVideo: () => ipcRenderer.send(EVENT_PAUSE_VIDEO),
	unpauseVideo: () => ipcRenderer.send(EVENT_UNPAUSE_VIDEO),
	changeVolume: (volume) => ipcRenderer.send(EVENT_SET_VOLUME, volume),
	updateCurrentTime: (currentTime) => ipcRenderer.send('set-current-time', currentTime),
	updateStartingTime: (startingTime) => ipcRenderer.send(EVENT_SET_STARTING_TIME, startingTime),
	updateDuration: (duration) => ipcRenderer.send('set-duration', duration),

	// event listeners
	onStartNewVideo: (callback) => {
		console.log("Start New Video Listener Added")
		ipcRenderer.on('play-video', callback)
	},
	onPauseVideo: (callback) => {
		ipcRenderer.on(EVENT_PAUSE_VIDEO, callback)
	},
	onUnpauseVideo: (callback) => {
		ipcRenderer.on(EVENT_UNPAUSE_VIDEO, callback)
	},
	onVolumeChange: (callback) => {
		ipcRenderer.on(EVENT_SET_VOLUME, callback)
	},
	onUpdateCurrentTime: (callback) => {
		ipcRenderer.on('set-current-time', callback)
	},
	onUpdateStartingTime: (callback) => {
		ipcRenderer.on(EVENT_SET_STARTING_TIME, callback)
	},
	onUpdateDuration: (callback) => {
		ipcRenderer.on('set-duration', callback)
	},

	// remove event listeners
	removeStartNewVideoListener: (callback) => {
		ipcRenderer.removeListener('play-video', callback)
	},
	removePauseVideoListener: (callback) => {
		ipcRenderer.removeListener(EVENT_PAUSE_VIDEO, callback)
	},
	removeUnpauseVideoListener: (callback) => {
		ipcRenderer.removeListener(EVENT_UNPAUSE_VIDEO, callback)
	},
	removeVolumeChangeListener: (callback) => {
		ipcRenderer.removeListener(EVENT_SET_VOLUME, callback)
	},
	removeUpdateCurrentTimeListener: (callback) => {
		ipcRenderer.removeListener('set-current-time', callback)
	},
	removeUpdateStartingTimeListener: (callback) => {
		ipcRenderer.removeListener(EVENT_SET_STARTING_TIME, callback)
	},
	removeUpdateDurationListener: (callback) => {
		ipcRenderer.removeListener('set-duration', callback)
	},
	toggleFullscreen: (): Promise<void> => ipcRenderer.invoke('toggle-fullscreen'),
}

