import {store} from '../windows/main/store';
import { pause, play } from '../windows/main/store/slices/playerSlice';

const PlayerMediator = {
	Pause: () => {
		store.dispatch(pause());
		window.videoPlayer.pauseVideo();
	},
	Unpause: () => {
		store.dispatch(play());
		window.videoPlayer.unpauseVideo();
	}
}

export default PlayerMediator;
