import { useEffect, useState, useRef } from 'react'
import VideoPlayer from './VideoPlayer'
import { VideoPlayerRef, VideoState } from './types'

export default function VideoPlayerWindow() {
	const [currentVideo, setCurrentVideo] = useState<string>('')
	const videoPlayerRef = useRef<VideoPlayerRef>(null)
	const [pendingState, setPendingState] = useState<VideoState | null>(null) // Store state to apply when video loads

	useEffect(() => {
		if (!window.videoPlayer) {
			return;
		}

		const handlePlayVideo = (_event: any, videoPath: string) => {
			console.log('Video Player Window - Received play video command:', videoPath)
			setCurrentVideo(videoPath)
		}

		window.videoPlayer.onPlayVideo(handlePlayVideo)

		return () => {
			window.videoPlayer.removePlayVideoListener(handlePlayVideo)
		}

	}, [])

	useEffect(() => {
		// Listen for video control sync commands
		if (window.videoControls) {
			const handleVideoControl = (_event: any, action: string, data?: any) => {
				console.log('Video Player Window - Received control command:', action, data)
				// This will be handled by the VideoPlayer component
			}

			window.videoControls.onVideoControl(handleVideoControl)

			return () => {
				window.videoControls.removeVideoControlListener(handleVideoControl)
			}
		}
	}, [])

	// Apply pending state when video loads
	useEffect(() => {
		if (currentVideo && pendingState && videoPlayerRef.current) {
			const applyState = () => {
				console.log('Video Player Window - Applying pending state:', pendingState)
				videoPlayerRef.current!.applyVideoState(pendingState)
				setPendingState(null) // Clear pending state
			}

			// Wait for video to load before applying state
			if (videoPlayerRef.current.isVideoReady()) {
				applyState()
			} else {
				videoPlayerRef.current.onVideoReady(applyState)
			}
		}
	}, [currentVideo, pendingState])

	return (
		<div
			style={{
				width: '100vw',
				height: '100vh',
				background: '#000',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				overflow: 'hidden',
			}}
		>
			{currentVideo ? (
				<div style={{ width: '100%', height: '100%' }}>
					<VideoPlayer
						videoRef={videoPlayerRef}
						currentVideo={currentVideo}
						onVideoEnd={() => setCurrentVideo('')}
						isMainPlayer={true}
						style={{
							width: '100%',
							height: '100%',
						}}
					/>
				</div>
			) : (
				<div
					style={{
						color: '#666',
						fontSize: '2em',
						textAlign: 'center',
						userSelect: 'none',
					}}
				>
					No video selected
					<br />
					<span style={{ fontSize: '0.5em', marginTop: '1em', display: 'block' }}>
						Use Media Browser to select a video to play
					</span>
				</div>
			)}
		</div>
	)
}
