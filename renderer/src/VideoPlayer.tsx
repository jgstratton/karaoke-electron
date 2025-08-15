import { useRef, useEffect, useState, useImperativeHandle } from 'react'
import { VideoPlayerProps, VideoState } from './types'

const VideoPlayer = ({ currentVideo, onVideoEnd, isMainPlayer = false, style = {}, videoRef }: VideoPlayerProps) => {
	const internalVideoRef = useRef<HTMLVideoElement>(null)
	const [isPlaying, setIsPlaying] = useState<boolean>(false)
	const [currentTime, setCurrentTime] = useState<number>(0)
	const [duration, setDuration] = useState<number>(0)
	const [volume, setVolume] = useState<number>(1)
	const [isSyncing, setIsSyncing] = useState<boolean>(false) // Prevent infinite sync loops

	useEffect(() => {
		if (currentVideo && internalVideoRef.current) {
			console.log('Loading video:', currentVideo)
			internalVideoRef.current.load()
			if (isPlaying) {
				internalVideoRef.current.play()
			}

			setCurrentTime(0)

			// Mute the preview player (main window), keep sound for main player (separate window)
			internalVideoRef.current.muted = !isMainPlayer
		}
	}, [currentVideo, isMainPlayer])

	useEffect(() => {
		const video = internalVideoRef.current
		if (!video) return

		const handleTimeUpdate = () => setCurrentTime(video.currentTime)
		const handleDurationChange = () => setDuration(video.duration)
		const handlePlay = () => setIsPlaying(true)
		const handlePause = () => setIsPlaying(false)
		const handleEnded = () => {
			setIsPlaying(false)
			onVideoEnd && onVideoEnd()
		}
		const handleError = (e: Event) => {
			console.error('Video error:', e, video.error)
		}
		const handleLoadStart = () => {
			console.log('Video load started')
		}
		const handleCanPlay = () => {
			console.log('Video can play')
		}

		video.addEventListener('timeupdate', handleTimeUpdate)
		video.addEventListener('durationchange', handleDurationChange)
		video.addEventListener('play', handlePlay)
		video.addEventListener('pause', handlePause)
		video.addEventListener('ended', handleEnded)
		video.addEventListener('error', handleError)
		video.addEventListener('loadstart', handleLoadStart)
		video.addEventListener('canplay', handleCanPlay)

		return () => {
			video.removeEventListener('timeupdate', handleTimeUpdate)
			video.removeEventListener('durationchange', handleDurationChange)
			video.removeEventListener('play', handlePlay)
			video.removeEventListener('pause', handlePause)
			video.removeEventListener('ended', handleEnded)
			video.removeEventListener('error', handleError)
			video.removeEventListener('loadstart', handleLoadStart)
			video.removeEventListener('canplay', handleCanPlay)
		}
	}, [onVideoEnd])

	// Listen for video control sync commands from other windows
	useEffect(() => {
		if (window.videoControls) {
			const handleVideoControl = (_event: any, action: string, data?: any) => {
				if (isSyncing) return // Prevent sync loops

				const video = internalVideoRef.current
				if (!video) return

				console.log('Received video control:', action, data)
				setIsSyncing(true)

				switch (action) {
					case 'play':
						video.play().catch(console.error)
						break
					case 'pause':
						video.pause()
						break
					case 'seek':
						video.currentTime = data.time
						break
					case 'volume':
						video.volume = data.volume
						setVolume(data.volume)
						break
				}

				setTimeout(() => setIsSyncing(false), 100) // Reset sync flag after brief delay
			}

			window.videoControls.onVideoControl(handleVideoControl)

			return () => {
				window.videoControls.removeVideoControlListener(handleVideoControl)
			}
		}
	}, [isSyncing])

	const sendControlToOtherPlayers = (action: string, data?: any) => {
		if (window.videoControls && !isSyncing) {
			window.videoControls.sendControl(action, data)
		}
	}

	// Expose methods to parent component via the videoRef prop
	useImperativeHandle(videoRef, () => ({
		getVideoState: () => ({
			currentVideo,
			currentTime,
			isPlaying,
			volume,
			duration,
		}),
		applyVideoState: (state: Partial<VideoState>) => {
			if (internalVideoRef.current && state) {
				const video = internalVideoRef.current
				if (state.currentTime !== undefined) {
					video.currentTime = state.currentTime
				}
				if (state.volume !== undefined) {
					video.volume = state.volume
					setVolume(state.volume)
				}
				if (state.isPlaying && !isPlaying) {
					video.play().catch(console.error)
				} else if (state.isPlaying === false && isPlaying) {
					video.pause()
				}
			}
		},
		isVideoReady: () => {
			return !!(internalVideoRef.current && internalVideoRef.current.readyState >= 2) // HAVE_CURRENT_DATA
		},
		onVideoReady: (callback) => {
			if (internalVideoRef.current) {
				if (internalVideoRef.current.readyState >= 2) {
					callback()
				} else {
					internalVideoRef.current.addEventListener('loadeddata', callback, { once: true })
				}
			}
		},
		play: () => {
			if (internalVideoRef.current) {
				internalVideoRef.current.play().catch(console.error)
				sendControlToOtherPlayers('play', undefined)
			}
		},
		pause: () => {
			if (internalVideoRef.current) {
				internalVideoRef.current.pause()
				sendControlToOtherPlayers('pause', undefined)
			}
		},
		setVolume: (newVolume: number) => {
			if (internalVideoRef.current) {
				internalVideoRef.current.volume = newVolume
				setVolume(newVolume)
				sendControlToOtherPlayers('volume', { volume: newVolume })
			}
		},
		seekTo: (time: number) => {
			if (internalVideoRef.current) {
				internalVideoRef.current.currentTime = time
				sendControlToOtherPlayers('seek', { time })
			}
		},
	}))

	if (!currentVideo) {
		return (
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					height: '400px',
					background: '#0a0d12',
					borderRadius: '8px',
					border: '1px solid #2a2f3a',
				}}
			>
				<p className="hint">No video selected. Use the Media Browser to choose a video.</p>
			</div>
		)
	}

	return (
		<div
			style={{
				background: '#0a0d12',
				borderRadius: isMainPlayer ? '0' : '8px',
				border: isMainPlayer ? 'none' : '1px solid #2a2f3a',
				overflow: 'hidden',
				...style,
			}}
		>
			<div style={{ position: 'relative' }}>
				<video
					ref={internalVideoRef}
					style={{
						width: '100%',
						height: isMainPlayer ? '100vh' : '250px',
						objectFit: 'contain',
						background: '#000',
					}}
					controls={false}
					preload="metadata"
					muted={!isMainPlayer}
				>
					{currentVideo && (
						<source src={currentVideo} />
					)}
					Your browser does not support the video tag.
				</video>
			</div>

			{/* Video Info */}
			<div style={{ padding: '12px' }}>
				<p
					style={{
						margin: 0,
						fontSize: '14px',
						color: '#a0a7b4',
						wordBreak: 'break-all',
					}}
				>
					<strong>Playing:</strong> {currentVideo.split(/[/\\]/).pop()}
				</p>
			</div>
		</div>
	)
}

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer
