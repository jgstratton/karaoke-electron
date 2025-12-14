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
	downloadYouTubeThumbnails: (
		videoId: string,
		mediaFolderPath: string
	) => Promise<Record<'0' | '1' | '2' | '3', string>>
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

export interface YouTubeSearchResult {
	id: string
	title: string
	url: string
	thumbnail?: string
	duration?: number
	uploader?: string
	channel?: string
}

// YouTube API
export interface YouTubeAPI {
	checkInstalled: () => Promise<boolean>
	install: () => Promise<{ success: boolean; message: string }>
	search: (query: string) => Promise<YouTubeSearchResult[]>
	getVideoInfo: (videoId: string) => Promise<{ id: string; title?: string; uploader?: string; channel?: string }>
}

// FFmpeg API
export interface FfmpegAPI {
	checkInstalled: () => Promise<boolean>
	install: () => Promise<{ success: boolean; message: string }>
}

export interface DatabaseInfo {
	db_name: string
	doc_count: number
	update_seq: number
	sizes: {
		file: number
		external: number
		active: number
	}
	instance_start_time?: string
}

export interface DatabaseAllDocsRow {
	id: string
	key: string
	value: any
	doc?: any
}

export interface DatabaseAPI {
	configureMediaPath: (mediaPath: string) => Promise<void>
	getDoc: (docId: string) => Promise<any>
	putDoc: (doc: any) => Promise<any>
	removeDoc: (docId: string, rev: string) => Promise<void>
	allDocs: (options?: { include_docs?: boolean }) => Promise<{ rows: DatabaseAllDocsRow[] }>
	info: () => Promise<DatabaseInfo>
}

// Combined Electron API
export interface ElectronAPI {
	env: EnvAPI
	fileSystem: FileSystemAPI
	videoPlayer: IVideoPlayerAPI
	videoControls: VideoControlsAPI
	videoState: VideoStateAPI
	database: DatabaseAPI
}

// Global window interface for preload context
declare global {
	interface Window {
		env: EnvAPI
		fileSystem: FileSystemAPI
		videoPlayer: IVideoPlayerAPI
		videoControls: VideoControlsAPI
		videoState: VideoStateAPI
		youtube: YouTubeAPI
		ffmpeg: FfmpegAPI
		database: DatabaseAPI
	}
}
