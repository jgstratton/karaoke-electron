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
	const sourceRef = useRef<HTMLSourceElement>(null)

	useEffect(() => {
		const playerRef = internalVideoRef.current;
		if (!playerRef) return;

		playerRef.volume = volume;

	}, [volume])

	useEffect(() => {
		const playerRef = internalVideoRef.current;
		if (!playerRef) return;

		if (isPlaying) {
			playerRef.play();
		} else {
			playerRef.pause();
		}

	}, [isPlaying])

	useEffect(() => {
		const playerRef = internalVideoRef.current;
		if (!playerRef) return;

		// listen for changes to current video
		sourceRef.current?.setAttribute('src', currentVideo);
		playerRef.load();
		if (isPlaying) {
			playerRef.play();
		}

	}, [currentVideo])

	useEffect(() => {
		const playerRef = internalVideoRef.current;
		if (!playerRef) return;
		// listen for changes to startingTime
			playerRef.currentTime = startingTime;

	}, [startingTime])

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

	return (
		<>
			{!currentVideo && (
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
			)}
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
					<source ref={sourceRef} src={currentVideo} />
				</video>
			</div>
		</div>
		</>
	)
}

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer
