import {store} from '../windows/main/store';
import { pause, play, setVolume, setCurrentVideo, setCurrentTime, setDuration } from '../windows/main/store/slices/playerSlice';

const PlayerMediator = {
	Pause: () => {
		store.dispatch(pause());
		window.videoPlayer.pauseVideo();
	},
	Unpause: () => {
		store.dispatch(play());
		window.videoPlayer.unpauseVideo();
	},
	SetVolume: (volume: number) => {
		store.dispatch(setVolume(volume));
		window.videoPlayer.changeVolume(volume);
	},
	StartNewVideo: (filePath: string) => {
		store.dispatch(pause());
		store.dispatch(play());
		store.dispatch(setCurrentVideo(filePath));
		window.videoPlayer.startNewVideo(filePath);
		window.videoPlayer.unpauseVideo();
	},
	UpdateCurrentTime: (currentTime: number) => {
		store.dispatch(setCurrentTime(currentTime));
	},
	UpdateDuration: (duration: number) => {
		store.dispatch(setDuration(duration));
	},
	SetStartingTime: (startingTime: number) => {
		store.dispatch(setCurrentTime(startingTime));
		window.videoPlayer.updateStartingTime(startingTime);
	}
}

export default PlayerMediator;
