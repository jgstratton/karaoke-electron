import { useEffect, useState } from 'react'
import VideoPlayer from '../../VideoPlayer'

export default function VideoPlayerWindow() {
	const [currentVideo, setCurrentVideo] = useState<string>('')
	const [isPlaying, setIsPlaying] = useState<boolean>(false)
	const [volume, setVolume] = useState<number>(1)

	useEffect(() => {
		if (!window.videoPlayer) {
			return;
		}

		const handlePlayVideo = (_event: any, videoPath: string) => {
			console.log('Video Player Window - Received play video command:', videoPath)
			setCurrentVideo(videoPath)
		}

		const onPauseVideo = (_event: any) => {
			console.log('Video Player Window - Received pause video command')
			setIsPlaying(false)
		}

		const onUnpauseVideo = (_event: any) => {
			console.log('Video Player Window - Received unpause video command')
			setIsPlaying(true)
		}

		const onVolumeChange = (_event: any, newVolume: number) => {
			console.log('Video Player Window - Received volume change command:', newVolume)
			setVolume(newVolume)
		}

		window.videoPlayer.onStartNewVideo(handlePlayVideo)
		window.videoPlayer.onPauseVideo(onPauseVideo)
		window.videoPlayer.onUnpauseVideo(onUnpauseVideo)
		window.videoPlayer.onVolumeChange(onVolumeChange)

		return () => {
			window.videoPlayer.removeStartNewVideoListener(handlePlayVideo)
			window.videoPlayer.removePauseVideoListener(onPauseVideo)
			window.videoPlayer.removeUnpauseVideoListener(onUnpauseVideo)
			window.videoPlayer.removeVolumeChangeListener(onVolumeChange)
		}

	}, [])

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
						currentVideo={currentVideo}
						onVideoEnd={() => setCurrentVideo('')}
						isMainPlayer={true}
						isPlaying={isPlaying}
						startingTime={0}
						volume={volume}
						cssHeight={"100vh"}
						onTimeUpdate={(currentTime) => window.videoPlayer.updateCurrentTime(currentTime)}
						onVideoReady={(duration) => window.videoPlayer.updateDuration(duration)}
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
