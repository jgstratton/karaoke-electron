// Type definitions for the karaoke electron app

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

export interface MediaFile {
	name: string
	path: string
	relativePath: string
	size: number
	modified: Date
	extension: string
}

export interface VideoState {
	currentVideo: string
	currentTime: number
	isPlaying: boolean
	volume: number
	duration?: number
}

export interface VideoPlayerRef {
	getVideoState: () => VideoState
	applyVideoState: (state: Partial<VideoState>) => void
	isVideoReady: () => boolean
	onVideoReady: (callback: () => void) => void
	play: () => void
	pause: () => void
	setVolume: (volume: number) => void
	seekTo: (time: number) => void
}

// Electron API types
export interface ElectronAPI {
	env: {
		isElectron: boolean
		getUrlParams: () => URLSearchParams
	}
	fileSystem: {
		selectFolder: () => Promise<string | null>
		validatePath: (path: string) => Promise<boolean>
		scanMediaFiles: (folderPath: string) => Promise<MediaFile[]>
		playVideo: (videoPath: string) => Promise<boolean>
	}
	videoPlayer: {
		onPlayVideo: (callback: (event: any, videoPath: string) => void) => void
		removePlayVideoListener: (callback: (event: any, videoPath: string) => void) => void
		toggleFullscreen: () => Promise<void>
	}
	videoControls: {
		sendControl: (action: string, data?: any) => Promise<boolean>
		onVideoControl: (callback: (event: any, action: string, data?: any) => void) => void
		removeVideoControlListener: (callback: (event: any, action: string, data?: any) => void) => void
	}
	videoState: {
		getCurrentState: () => Promise<VideoState | null>
		onGetVideoState: (callback: () => void) => void
		sendVideoState: (state: VideoState) => void
		removeGetVideoStateListener: (callback: () => void) => void
	}
}

declare global {
	interface Window {
		env: {
			isElectron: boolean;
			getUrlParams: () => URLSearchParams;
		};
		fileSystem: {
			selectFolder: () => Promise<string | null>;
			validatePath: (path: string) => Promise<boolean>;
			scanMediaFiles: (folderPath: string) => Promise<MediaFile[]>;
		};
		videoPlayer: {
			playVideo: (videoPath: string) => Promise<boolean>;
			onPlayVideo: (callback: (event: any, videoPath: string) => void) => void;
			removePlayVideoListener: (callback: (event: any, videoPath: string) => void) => void;
			toggleFullscreen: () => Promise<void>;
		};
		videoControls: {
			sendControl: (action: string, data?: any) => Promise<boolean>;
			onVideoControl: (callback: (event: any, action: string, data?: any) => void) => void;
			removeVideoControlListener: (callback: (event: any, action: string, data?: any) => void) => void;
		};
		videoState: {
			onGetVideoState: (callback: () => void) => void;
			sendVideoState: (state: VideoState) => void;
			removeGetVideoStateListener: (callback: () => void) => void;
		};
	}
}
