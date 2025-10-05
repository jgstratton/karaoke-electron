import { RootState } from "@/windows/main/store";
import { useSelector } from "react-redux";
import PlayerMediator from "@/mediators/PlayerMediator";
import styles from './VideoControlsPanel.module.css';

// todo, use mediator that will send info to other windows and update state
export default function VideoControlsPanel() {
	const playerState = useSelector((state: RootState) => state.player);

	// Helper function to format time
	const formatTime = (seconds: number): string => {
		if (isNaN(seconds) || !isFinite(seconds)) return '0:00'

		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = Math.floor(seconds % 60)
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
	}

	// Handle play button click
	const handlePlayClick = () => {
		if (playerState.isPlaying) {
			// If playing, just pause
			PlayerMediator.Pause();
		} else {
			// If paused or no video, unpause (mediator will handle loading next song if needed)
			PlayerMediator.Unpause();
		}
	}

	// Handle next button click
	const handleNextClick = () => {
		PlayerMediator.Next();
	}

	// Handle previous button click
	const handlePreviousClick = () => {
		PlayerMediator.Previous();
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
							onClick={handlePlayClick}
						>
							{playerState.isPlaying ? '⏸️ Pause' : '▶️ Play'}
						</button>
						<button
							className={`${styles.videoControlBtn} ${styles.secondary}`}
							onClick={handlePreviousClick}
						>
							⏮️ Previous
						</button>
						<button
							className={`${styles.videoControlBtn} ${styles.secondary}`}
							onClick={handleNextClick}
						>
							⏭️ Next
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
								PlayerMediator.SetStartingTime(seekTime);
							}}
							style={{ cursor: 'pointer', position: 'relative' }}
						>
							<div
								className={styles.videoProgressFill}
								style={{
									width: `${playerState.duration > 0 ? (playerState.currentTime / playerState.duration) * 100 : 0}%`
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
					</div>
				</div>
			</div>
		</>
	)
}
