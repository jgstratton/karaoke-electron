import { RootState } from "@/windows/main/store";
import VideoPlayer from "@/VideoPlayer";
import { useSelector } from "react-redux";
import styles from './VideoPreview.module.css';

export default function VideoPreview() {

	const playerState = useSelector((state: RootState) => state.player);

	return (
		<>
			<div className={styles.videoHeader}>
				<span>Video Preview</span>
			</div>
			<div className={styles.videoContent}>
				<VideoPlayer
					currentVideo={playerState.currentVideo}
					isPlaying={playerState.isPlaying}
					startingTime={playerState.currentTime}
					volume={0}
					onVideoEnd={() => {}}
					onTimeUpdate={() => {}}
					onVideoReady={() => {}}
					cssHeight="250px"
				/>
			</div>
		</>
	)
}
