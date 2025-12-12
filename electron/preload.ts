import { contextBridge, ipcRenderer } from 'electron'
import type {
	EnvAPI,
	FileSystemAPI,
	VideoControlsAPI,
	VideoStateAPI,
	YouTubeAPI,
	FfmpegAPI,
	MediaFile,
	VideoState
} from './preload-types'
import { VideoPlayerAPI } from './contextBridge/VideoPlayerApi'

// Expose environment API
const envAPI: EnvAPI = {
	isElectron: true,
	getUrlParams: (): URLSearchParams => new URLSearchParams(window.location.search),
}

// Expose file system operations
const fileSystemAPI: FileSystemAPI = {
	selectFolder: (): Promise<string | null> => ipcRenderer.invoke('select-folder'),
	validatePath: (path: string): Promise<boolean> => ipcRenderer.invoke('validate-path', path),
	scanMediaFiles: (folderPath: string): Promise<MediaFile[]> => ipcRenderer.invoke('scan-media-files', folderPath),
}

// Expose video control sync
const videoControlsAPI: VideoControlsAPI = {
	sendControl: (action: string, data?: any): Promise<boolean> => ipcRenderer.invoke('video-control', action, data),
	onVideoControl: (callback: (event: Electron.IpcRendererEvent, action: string, data?: any) => void): void => {
		ipcRenderer.on('video-control', callback)
	},
	removeVideoControlListener: (callback: (event: Electron.IpcRendererEvent, action: string, data?: any) => void): void => {
		ipcRenderer.removeListener('video-control', callback)
	},
}

// Expose video state sync
const videoStateAPI: VideoStateAPI = {
	getCurrentState: (): Promise<VideoState | null> => ipcRenderer.invoke('get-current-video-state'),
	onGetVideoState: (callback: (event: Electron.IpcRendererEvent) => void): void => {
		ipcRenderer.on('get-video-state', callback)
	},
	sendVideoState: (state: VideoState): void => {
		ipcRenderer.send('video-state-response', state)
	},
	removeGetVideoStateListener: (callback: (event: Electron.IpcRendererEvent) => void): void => {
		ipcRenderer.removeListener('get-video-state', callback)
	},
}

// Expose YouTube API
const youtubeAPI: YouTubeAPI = {
	checkInstalled: (): Promise<boolean> => ipcRenderer.invoke('check-yt-dlp-installed'),
	install: (): Promise<{ success: boolean; message: string }> => ipcRenderer.invoke('install-yt-dlp'),
}

// Expose FFmpeg API
const ffmpegAPI: FfmpegAPI = {
	checkInstalled: (): Promise<boolean> => ipcRenderer.invoke('check-ffmpeg-installed'),
	install: (): Promise<{ success: boolean; message: string }> => ipcRenderer.invoke('install-ffmpeg'),
}

// Expose all APIs to the main world
contextBridge.exposeInMainWorld('env', envAPI)
contextBridge.exposeInMainWorld('fileSystem', fileSystemAPI)
contextBridge.exposeInMainWorld('videoPlayer', VideoPlayerAPI)
contextBridge.exposeInMainWorld('videoControls', videoControlsAPI)
contextBridge.exposeInMainWorld('videoState', videoStateAPI)
contextBridge.exposeInMainWorld('youtube', youtubeAPI)
contextBridge.exposeInMainWorld('ffmpeg', ffmpegAPI)
