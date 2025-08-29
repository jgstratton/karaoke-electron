import {store} from '../windows/main/store';
import { pause, play, setVolume } from '../windows/main/store/slices/playerSlice';

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
	}
}

export default PlayerMediator;
