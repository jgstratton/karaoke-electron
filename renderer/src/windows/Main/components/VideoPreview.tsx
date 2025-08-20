import { RootState } from "@/windows/main/store";
import VideoPlayer from "@/VideoPlayer";
import { useSelector } from "react-redux";

export default function VideoPreview() {

	const playerState = useSelector((state: RootState) => state.player);

	return (
		<>
			<div className="video-header">
				<span>Video Preview</span>
			</div>
			<div className="video-content">
				<VideoPlayer
					currentVideo={playerState.currentVideo}
					isPlaying={playerState.isPlaying}
					startingTime={playerState.startingTime}
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
