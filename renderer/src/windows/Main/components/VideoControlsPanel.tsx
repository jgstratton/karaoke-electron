import { RootState } from "@/windows/main/store";
import { useAppDispatch } from "@/windows/main/store/hooks";
import { play, pause, setVolume } from "@/windows/main/store/slices/playerSlice";
import { useSelector } from "react-redux";

// todo, use mediator that will send info to other windows and update state
export default function VideoControlsPanel() {
	const dispatch = useAppDispatch()
	const playerState = useSelector((state: RootState) => state.player);

	const sendVideoPosition = (position: number) => {
		//todo: implement video position sending
	}

	// Helper function to format time
	const formatTime = (seconds: number): string => {
		if (isNaN(seconds) || !isFinite(seconds)) return '0:00'

		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = Math.floor(seconds % 60)
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
	}

	return (
		<>
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
								playerState.isPlaying ? pause() : play();
							}}
						>
							{playerState.isPlaying ? '⏸️ Pause' : '▶️ Play'}
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
								const rect = e.currentTarget.getBoundingClientRect();
								const clickX = e.clientX - rect.left;
								const percentage = clickX / rect.width;
								const seekTime = percentage * playerState.duration;
								sendVideoPosition(seekTime);
							}}
							style={{ cursor: 'pointer', position: 'relative' }}
						>
							<div
								className="video-progress-fill"
								style={{
									width: `${playerState.duration > 0 ? (playerState.startingTime / playerState.duration) * 100 : 0}%`
								}}
							/>
						</div>
						<div className="video-time-display">
							{formatTime(playerState.startingTime)} / {formatTime(playerState.duration)}
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
								value={playerState.volume}
								className="video-volume-slider"
								onChange={(e) => {
									const newVolume = parseFloat(e.target.value);
									dispatch(setVolume(newVolume));
								}}
							/>
							<span>{Math.round(playerState.volume * 100)}%</span>
						</div>
						<button className="video-control-btn secondary">
							🖥️ Toggle Fullscreen
						</button>
					</div>
				</div>
			</div>
		</>
	)
}
