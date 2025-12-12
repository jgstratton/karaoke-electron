// Type definitions for the karaoke electron app

// Re-export types from preload to keep them in sync
export type {
	MediaFile,
	VideoState,
	ElectronAPI,
	EnvAPI,
	FileSystemAPI,
	VideoControlsAPI,
	VideoStateAPI
} from '../../electron/preload-types'

export type { IVideoPlayerAPI } from '../../electron/contextBridge/VideoPlayerApi'
export interface UserDoc {
	_id: string
	_rev?: string
	name: string
}

export interface SettingsDoc {
	_id: string
	_rev?: string
	mediaPath: string
}

export interface RequestDoc {
	_id: string
	songTitle: string
	mediaFilePath: string
	status: 'queued' | 'playing' | 'completed' | 'skipped'
	addedDate: string
	sortOrder: number
	completion_position?: number
}

export interface SingerDoc {
	_id: string
	name: string
	addedDate: string
	isPaused?: boolean
	requests?: RequestDoc[]
}

export interface PartyDoc {
	_id: string
	_rev?: string
	name: string
	creationDate: string
	singers: SingerDoc[]
}

export interface PartiesDoc {
	_id: 'parties'
	_rev?: string
	parties: PartyDoc[]
}

export interface VideoPlayerRef {
	getVideoState: () => import('../../electron/preload-types').VideoState
	applyVideoState: (state: Partial<import('../../electron/preload-types').VideoState>) => void
	isVideoReady: () => boolean
	onVideoReady: (callback: () => void) => void
	play: () => void
	pause: () => void
	setVolume: (volume: number) => void
	seekTo: (time: number) => void
}

declare global {
	interface Window {
		env: import('../../electron/preload-types').EnvAPI
		fileSystem: import('../../electron/preload-types').FileSystemAPI
		videoPlayer: import('../../electron/contextBridge/VideoPlayerApi').IVideoPlayerAPI
		videoControls: import('../../electron/preload-types').VideoControlsAPI
		videoState: import('../../electron/preload-types').VideoStateAPI
		youtube: import('../../electron/preload-types').YouTubeAPI
	}
}
