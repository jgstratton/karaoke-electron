import { RootState } from "@/windows/main/store";
import { useAppDispatch } from "@/windows/main/store/hooks";
import { play, pause, setVolume } from "@/windows/main/store/slices/playerSlice";
import { useSelector } from "react-redux";
import PlayerMediator from "@/mediators/PlayerMediator";
import styles from './VideoControlsPanel.module.css';

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
			<div className={styles.videoControlsHeader}>
				<span>Video Controls</span>
			</div>
			<div className={styles.videoControlsContent}>
				<div className={styles.videoControlsGroup}>
					<h4>Playback</h4>
					<div className={styles.videoControlsRow}>
						<button
							className={styles.videoControlBtn}
							onClick={() => {
								playerState.isPlaying ? PlayerMediator.Pause() : PlayerMediator.Unpause();
							}}
						>
							{playerState.isPlaying ? '⏸️ Pause' : '▶️ Play'}
						</button>
						<button className={`${styles.videoControlBtn} ${styles.secondary}`}>
							⏮️ Previous
						</button>
						<button className={`${styles.videoControlBtn} ${styles.secondary}`}>
							⏭️ Next
						</button>
						<button
							className={`${styles.videoControlBtn} ${styles.secondary}`}
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

				<div className={styles.videoControlsGroup}>
					<h4>Progress</h4>
					<div className={styles.videoProgressContainer}>
						<div
							className={styles.videoProgressBar}
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
								className={styles.videoProgressFill}
								style={{
									width: `${playerState.duration > 0 ? (playerState.startingTime / playerState.duration) * 100 : 0}%`
								}}
							/>
						</div>
						<div className={styles.videoTimeDisplay}>
							{formatTime(playerState.startingTime)} / {formatTime(playerState.duration)}
						</div>
					</div>
				</div>

				<div className={styles.videoControlsGroup}>
					<h4>Audio & Display</h4>
					<div className={styles.videoControlsRow}>
						<div className={styles.videoVolumeContainer}>
							<span>🔊</span>
							<input
								type="range"
								min="0"
								max="1"
								step="0.01"
								value={playerState.volume}
								className={styles.videoVolumeSlider}
								onChange={(e) => {
									PlayerMediator.SetVolume(parseFloat(e.target.value));
								}}
							/>
							<span style={{ width: '60px' }}>{Math.round(playerState.volume * 100)}%</span>
						</div>
						<button className={`${styles.videoControlBtn} ${styles.secondary}`}>
							🖥️ Toggle Fullscreen
						</button>
					</div>
				</div>
			</div>
		</>
	)
}
