import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'

const VideoPlayer = forwardRef(({ currentVideo, onVideoEnd, isMainPlayer = false, style = {} }, ref) => {
	const videoRef = useRef(null)
	const [isPlaying, setIsPlaying] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const [volume, setVolume] = useState(1)
	const [showControls, setShowControls] = useState(true)
	const [isSyncing, setIsSyncing] = useState(false) // Prevent infinite sync loops

	useEffect(() => {
		if (currentVideo && videoRef.current) {
			console.log('Loading video:', currentVideo)
			videoRef.current.load()
			setCurrentTime(0)

			// Mute the preview player (main window), keep sound for main player (separate window)
			videoRef.current.muted = !isMainPlayer
		}
	}, [currentVideo, isMainPlayer])

	useEffect(() => {
		const video = videoRef.current
		if (!video) return

		const handleTimeUpdate = () => setCurrentTime(video.currentTime)
		const handleDurationChange = () => setDuration(video.duration)
		const handlePlay = () => setIsPlaying(true)
		const handlePause = () => setIsPlaying(false)
		const handleEnded = () => {
			setIsPlaying(false)
			onVideoEnd && onVideoEnd()
		}
		const handleError = (e) => {
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
			const handleVideoControl = (event, action, data) => {
				if (isSyncing) return // Prevent sync loops

				const video = videoRef.current
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

	const sendControlToOtherPlayers = (action, data) => {
		if (window.videoControls && !isSyncing) {
			window.videoControls.sendControl(action, data)
		}
	}

	// Expose methods to parent component
	useImperativeHandle(ref, () => ({
		onGetVideoState: () => ({
			currentVideo,
			currentTime,
			isPlaying,
			volume,
			duration,
		}),
		videoRef, // Expose the video ref
	}))

	const togglePlay = () => {
		if (videoRef.current) {
			if (isPlaying) {
				videoRef.current.pause()
				sendControlToOtherPlayers('pause')
			} else {
				videoRef.current.play().catch(console.error)
				sendControlToOtherPlayers('play')
			}
		}
	}

	const handleSeek = e => {
		if (videoRef.current && duration) {
			const rect = e.currentTarget.getBoundingClientRect()
			const pos = (e.clientX - rect.left) / rect.width
			const time = pos * duration
			videoRef.current.currentTime = time
			sendControlToOtherPlayers('seek', { time })
		}
	}

	const handleVolumeChange = e => {
		const newVolume = parseFloat(e.target.value)
		setVolume(newVolume)
		if (videoRef.current) {
			videoRef.current.volume = newVolume
			sendControlToOtherPlayers('volume', { volume: newVolume })
		}
	}

	const formatTime = seconds => {
		if (!seconds || !isFinite(seconds)) return '0:00'
		const mins = Math.floor(seconds / 60)
		const secs = Math.floor(seconds % 60)
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	const progress = duration ? (currentTime / duration) * 100 : 0

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
			onMouseEnter={() => !isMainPlayer && setShowControls(true)}
			onMouseLeave={() => !isMainPlayer && setShowControls(false)}
		>
			<div style={{ position: 'relative' }}>
				<video
					ref={videoRef}
					style={{
						width: '100%',
						height: isMainPlayer ? '100vh' : '400px',
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

				{/* Custom Controls Overlay - Only show on preview (main window), not on main player window */}
				{showControls && !isMainPlayer && (
					<div
						style={{
							position: 'absolute',
							bottom: 0,
							left: 0,
							right: 0,
							background:
								'linear-gradient(transparent, rgba(0,0,0,0.7))',
							padding: '20px 16px 16px',
						}}
					>
						{/* Progress Bar */}
						<div
							style={{
								width: '100%',
								height: '6px',
								background: 'rgba(255,255,255,0.3)',
								borderRadius: '3px',
								marginBottom: '12px',
								cursor: 'pointer',
							}}
							onClick={handleSeek}
						>
							<div
								style={{
									width: `${progress}%`,
									height: '100%',
									background: '#006adc',
									borderRadius: '3px',
									transition: 'width 0.1s',
								}}
							/>
						</div>

						{/* Control Buttons */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								color: 'white',
							}}
						>
							<button
								onClick={togglePlay}
								style={{
									background: 'rgba(255,255,255,0.2)',
									color: 'white',
									border: 'none',
									borderRadius: '50%',
									width: '40px',
									height: '40px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									cursor: 'pointer',
									fontSize: '16px',
								}}
							>
								{isPlaying ? '⏸️' : '▶️'}
							</button>

							<span style={{ fontSize: '14px', minWidth: '80px' }}>
								{formatTime(currentTime)} / {formatTime(duration)}
							</span>

							<div style={{ flex: 1 }} />

							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<span style={{ fontSize: '14px' }}>🔊</span>
								<input
									type="range"
									min="0"
									max="1"
									step="0.1"
									value={volume}
									onChange={handleVolumeChange}
									style={{
										width: '80px',
										accentColor: '#006adc',
									}}
								/>
							</div>
						</div>
					</div>
				)}
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
})

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer
