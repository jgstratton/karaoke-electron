import { useEffect, useState, useRef } from 'react'
import DatabaseExplorer from './DatabaseExplorer.jsx'
import Settings from './Settings.jsx'
import MediaBrowser from './MediaBrowser.jsx'
import VideoPlayer from './VideoPlayer'
import VideoPlayerWindow from './VideoPlayerWindow'
import { VideoPlayerRef } from './types'
import './styles.css'

// Helper function to format time
const formatTime = (seconds: number): string => {
	if (isNaN(seconds) || !isFinite(seconds)) return '0:00'

	const minutes = Math.floor(seconds / 60)
	const remainingSeconds = Math.floor(seconds % 60)
	return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export default function App() {
	// Check which view to show based on URL params
	const urlParams = new URLSearchParams(window.location.search)
	const view = urlParams.get('view')

	if (view === 'dbexplorer') {
		return <DatabaseExplorer />
	}

	if (view === 'settings') {
		return <Settings />
	}

	if (view === 'mediabrowser') {
		return <MediaBrowser />
	}

	if (view === 'videoplayer') {
		return <VideoPlayerWindow />
	}

	const [currentVideo, setCurrentVideo] = useState<string>('')
	const videoPlayerRef = useRef<VideoPlayerRef>(null)
	const [videoState, setVideoState] = useState({
		isPlaying: false,
		currentTime: 0,
		duration: 0,
		volume: 1
	})

	// Debug: Log when currentVideo changes
	useEffect(() => {
		console.log('Current video changed to:', currentVideo)
	}, [currentVideo])

	useEffect(() => {
		// Update video state periodically
		const interval = setInterval(() => {
			if (videoPlayerRef.current) {
				const state = videoPlayerRef.current.getVideoState();
				setVideoState({
					isPlaying: state.isPlaying,
					currentTime: state.currentTime,
					duration: state.duration || 0,
					volume: state.volume
				});
			}
		}, 100); // Update every 100ms for smoother UI

		return () => clearInterval(interval);
	}, [])

	// Listen for video play commands from media browser
	useEffect(() => {
		if (window.videoPlayer) {
			const handlePlayVideo = (_event: any, videoPath: string) => {
				console.log('Received play video command:', videoPath)
				setCurrentVideo(videoPath)
			}

			window.videoPlayer.onPlayVideo(handlePlayVideo)

			return () => {
				window.videoPlayer.removePlayVideoListener(handlePlayVideo)
			}
		}
	}, [])

	// Listen for video state requests from video player window
	useEffect(() => {
		if (!window.videoState) {
			return;
		}

		const handleGetVideoState = () => {
			// Get current video state from the VideoPlayer component
			let videoState = {
				currentVideo: currentVideo,
				currentTime: 0,
				isPlaying: false,
				volume: 1,
			}

			// Get detailed state from VideoPlayer ref if available
			if (videoPlayerRef.current && videoPlayerRef.current.getVideoState) {
				const detailedState = videoPlayerRef.current.getVideoState()
				videoState = { ...videoState, ...detailedState }
			}

			console.log('Sending video state:', videoState)
			window.videoState.sendVideoState(videoState)
		}

		window.videoState.onGetVideoState(handleGetVideoState)

		return () => {
			window.videoState.removeGetVideoStateListener(handleGetVideoState)
		}

	}, [currentVideo])

	return (
		<div className="karaoke-main-layout">
			{/* Header with Logo */}
			<div className="karaoke-header">
				<div className="karaoke-logo">
					<img src="/src/assets/logo.png" alt="Karaoke Logo" />
					<div>
						<h1 className="karaoke-title">Karaoke Party</h1>
						<p className="karaoke-subtitle">Professional Karaoke System</p>
					</div>
				</div>
				<div className="header-controls">
					<span>Session: Active</span>
					<span>•</span>
					<span>Singers: 4</span>
					<span>•</span>
					<span>Queue: 4 songs</span>
				</div>
			</div>

			{/* Left Panel - Singer Rotation */}
			<div className="singer-rotation-panel">
				<div className="singer-header">
					<span>#</span>
					<span>Singer Rotation</span>
					<span></span>
					<span></span>
				</div>
				<div className="singer-list">
					<div className="singer-item current-singer">
						<span className="singer-avatar">1</span>
						<span className="singer-name">John Smith</span>
						<span></span>
						<span className="show-on-hover">⋯</span>
					</div>
					<div className="singer-item">
						<span className="singer-avatar">2</span>
						<span className="singer-name">Alice Brown</span>
						<span></span>
						<span className="show-on-hover">⋯</span>
					</div>
					<div className="singer-item">
						<span className="singer-avatar">3</span>
						<span className="singer-name">Mike Johnson</span>
						<span></span>
						<span className="show-on-hover">⋯</span>
					</div>
					<div className="singer-item">
						<span className="singer-avatar">4</span>
						<span className="singer-name">Sarah Davis</span>
						<span></span>
						<span className="show-on-hover">⋯</span>
					</div>
				</div>
				<button className="add-singer-btn">+ Add Singer</button>
			</div>

			{/* Video Controls - Upper Middle */}
			<div className="video-controls-section">
				<div className="video-controls-header">
					<span>Video Controls</span>
				</div>
				<div className="video-controls-content">
					<div className="video-controls-group">
						<h4>Playback</h4>
						<div className="video-controls-row">
							<button
								className="video-control-btn"
								onClick={() => {
									if (videoPlayerRef.current) {
										if (videoState.isPlaying) {
											videoPlayerRef.current.pause();
										} else {
											videoPlayerRef.current.play();
										}
									}
								}}
							>
								{videoState.isPlaying ? '⏸️ Pause' : '▶️ Play'}
							</button>
							<button className="video-control-btn secondary">
								⏮️ Previous
							</button>
							<button className="video-control-btn secondary">
								⏭️ Next
							</button>
							<button
								className="video-control-btn secondary"
								onClick={() => {
									if (window.videoPlayer?.toggleFullscreen) {
										window.videoPlayer.toggleFullscreen();
									}
								}}
							>
								🖥️ Fullscreen
							</button>
						</div>
					</div>

					<div className="video-controls-group">
						<h4>Progress</h4>
						<div className="video-progress-container">
							<div
								className="video-progress-bar"
								onClick={(e) => {
									if (videoPlayerRef.current && videoState.duration > 0) {
										const rect = e.currentTarget.getBoundingClientRect();
										const clickX = e.clientX - rect.left;
										const percentage = clickX / rect.width;
										const seekTime = percentage * videoState.duration;
										videoPlayerRef.current.seekTo(seekTime);
									}
								}}
								style={{ cursor: 'pointer', position: 'relative' }}
							>
								<div
									className="video-progress-fill"
									style={{
										width: `${videoState.duration > 0 ? (videoState.currentTime / videoState.duration) * 100 : 0}%`
									}}
								/>
							</div>
							<div className="video-time-display">
								{formatTime(videoState.currentTime)} / {formatTime(videoState.duration)}
							</div>
						</div>
					</div>

					<div className="video-controls-group">
						<h4>Audio & Display</h4>
						<div className="video-controls-row">
							<div className="video-volume-container">
								<span>🔊</span>
								<input
									type="range"
									min="0"
									max="1"
									step="0.1"
									defaultValue="1"
									className="video-volume-slider"
									onChange={(e) => {
										if (videoPlayerRef.current) {
											videoPlayerRef.current.setVolume(parseFloat(e.target.value));
										}
									}}
								/>
							</div>
							<button className="video-control-btn secondary">
								🖥️ Toggle Fullscreen
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Video Preview - Upper Right */}
			<div className="video-preview-section">
				<div className="video-header">
					<span>Video Preview</span>
				</div>
				<div className="video-content">
					<VideoPlayer
						videoRef={videoPlayerRef}
						currentVideo={currentVideo}
						onVideoEnd={() => setCurrentVideo('')}
						style={{
							width: '100%',
							height: '100%',
						}}
					/>
				</div>
			</div>

			{/* Song Queue - Lower Right */}
			<div className="song-queue-section">
				<div className="queue-header">
					<span>#</span>
					<span>Singer</span>
					<span>Song</span>
					<span>Title</span>
					<span>Status</span>
					<span></span>
				</div>
				<div className="queue-list">
					<div className="queue-item current-song">
						<span className="queue-position">1</span>
						<span className="queue-singer">John Smith</span>
						<span></span>
						<span className="song-title">Sweet Caroline</span>
						<span className="song-status">Now Playing</span>
						<span className="show-on-hover">⋯</span>
					</div>
					<div className="queue-item">
						<span className="queue-position">2</span>
						<span className="queue-singer">Alice Brown</span>
						<span></span>
						<span className="song-title">Don't Stop Believin'</span>
						<span className="song-status">Queued</span>
						<span className="show-on-hover">⋯</span>
					</div>
					<div className="queue-item">
						<span className="queue-position">3</span>
						<span className="queue-singer">Mike Johnson</span>
						<span></span>
						<span className="song-title">Bohemian Rhapsody</span>
						<span className="song-status">Queued</span>
						<span className="show-on-hover">⋯</span>
					</div>
					<div className="queue-item">
						<span className="queue-position">4</span>
						<span className="queue-singer">Sarah Davis</span>
						<span></span>
						<span className="song-title">I Want It That Way</span>
						<span className="song-status">Queued</span>
						<span className="show-on-hover">⋯</span>
					</div>
				</div>
				<button className="manage-queue-btn">Manage Queue</button>
			</div>
		</div>
	)
}
