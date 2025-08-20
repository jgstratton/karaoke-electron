import { useRef, useEffect } from 'react'
export interface VideoPlayerProps {
	currentVideo: string
	isPlaying: boolean
	startingTime: number
	volume: number
	cssHeight: string
	onVideoEnd: () => void
	onTimeUpdate: (currentTime: number) => void
	onVideoReady: (duration: number) => void
	isMainPlayer?: boolean
	style?: React.CSSProperties
}

const VideoPlayer = ({ currentVideo, onVideoEnd, isPlaying, startingTime, volume, onTimeUpdate, onVideoReady, cssHeight}: VideoPlayerProps) => {
	const internalVideoRef = useRef<HTMLVideoElement>(null)

	// Its' up to the calling component to manage state changes, so the video player itself will always react to any changes in props
	useEffect(() => {
		if (!currentVideo) {
			internalVideoRef.current?.pause()
			return;
		}

		const playerRef = internalVideoRef.current;
		if (!playerRef) {
			return;
		}

		if (isPlaying) {
			playerRef.play();
		} else {
			playerRef.pause();
		}

		playerRef.currentTime = startingTime;
		playerRef.volume = volume;
	}, [currentVideo, isPlaying, startingTime, volume])

	useEffect(() => {
		const video = internalVideoRef.current
		if (!video) {
			return;
		}
		const handleTimeUpdate = () => {onTimeUpdate && onTimeUpdate(video.currentTime);}
		const handleDurationChange = () => {onVideoReady && onVideoReady(video.duration);}
		const handleEnded = () => {onVideoEnd && onVideoEnd()}
		const handleError = () => {console.error('Video error:', video.error)}

		video.addEventListener('timeupdate', handleTimeUpdate)
		video.addEventListener('durationchange', handleDurationChange)
		video.addEventListener('ended', handleEnded)
		video.addEventListener('error', handleError)

		return () => {
			video.removeEventListener('timeupdate', handleTimeUpdate)
			video.removeEventListener('durationchange', handleDurationChange)
			video.removeEventListener('ended', handleEnded)
			video.removeEventListener('error', handleError)
		}
	}, [onVideoEnd, onTimeUpdate, onVideoReady])

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
				overflow: 'hidden',
			}}
		>
			<div style={{ position: 'relative' }}>
				<video
					ref={internalVideoRef}
					style={{
						width: '100%',
						height: cssHeight,
						objectFit: 'contain',
						background: '#000',
					}}
					controls={false}
					preload="metadata"
				>
					{currentVideo && (
						<source src={currentVideo} />
					)}
				</video>
			</div>
		</div>
	)
}

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer
