// Type definitions specific to the preload implementation
import { IpcRenderer } from 'electron'
import { IVideoPlayerAPI } from './contextBridge/VideoPlayerApi'

// Environment API
export interface EnvAPI {
	isElectron: boolean
	getUrlParams: () => URLSearchParams
}

// File System API
export interface FileSystemAPI {
	selectFolder: () => Promise<string | null>
	validatePath: (path: string) => Promise<boolean>
	scanMediaFiles: (folderPath: string) => Promise<MediaFile[]>
}

// Video Controls API
export interface VideoControlsAPI {
	sendControl: (action: string, data?: any) => Promise<boolean>
	onVideoControl: (callback: (event: Electron.IpcRendererEvent, action: string, data?: any) => void) => void
	removeVideoControlListener: (callback: (event: Electron.IpcRendererEvent, action: string, data?: any) => void) => void
}

// Video State API
export interface VideoStateAPI {
	getCurrentState: () => Promise<VideoState | null>
	onGetVideoState: (callback: (event: Electron.IpcRendererEvent) => void) => void
	sendVideoState: (state: VideoState) => void
	removeGetVideoStateListener: (callback: (event: Electron.IpcRendererEvent) => void) => void
}

// Media File interface
export interface MediaFile {
	name: string
	path: string
	relativePath: string
	size: number
	modified: Date
	extension: string
}

// Video State interface
export interface VideoState {
	currentVideo: string
	currentTime: number
	isPlaying: boolean
	volume: number
	duration?: number
}

// Combined Electron API
export interface ElectronAPI {
	env: EnvAPI
	fileSystem: FileSystemAPI
	videoPlayer: IVideoPlayerAPI
	videoControls: VideoControlsAPI
	videoState: VideoStateAPI
}

// Global window interface for preload context
declare global {
	interface Window {
		env: EnvAPI
		fileSystem: FileSystemAPI
		videoPlayer: IVideoPlayerAPI
		videoControls: VideoControlsAPI
		videoState: VideoStateAPI
	}
}
