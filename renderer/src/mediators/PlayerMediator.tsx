import {store} from '../windows/main/store';
import { pause, play, setVolume, setCurrentVideo, setCurrentTime, setDuration } from '../windows/main/store/slices/playerSlice';
import RequestMediator from './RequestMediator';

const PlayerMediator = (function(){
	const _pause = () => {
		store.dispatch(pause());
		window.videoPlayer.pauseVideo();
	};

	const _startNewVideo = (filePath: string) => {
		store.dispatch(pause());
		store.dispatch(play());
		store.dispatch(setCurrentVideo(filePath));
		window.videoPlayer.startNewVideo(filePath);
		window.videoPlayer.unpauseVideo();
	}

	const _unpause = () => async () => {
			const currentState = store.getState().player;

			// If no video is currently loaded, try to load the next queued request
			if (!currentState.currentVideo) {
				const nextRequest = await RequestMediator.progressToNextRequest();
				if (nextRequest !== null) {
					_startNewVideo(nextRequest.mediaFilePath)
					return;
				}
				console.log('No queued songs available to play');
				return; // Don't unpause if there's nothing to play
			} else {
				// If there's already a video loaded, just unpause it
				store.dispatch(play());
				window.videoPlayer.unpauseVideo();
			}
		}

	const _setVolume = (volume: number) => {
		store.dispatch(setVolume(volume));
		window.videoPlayer.changeVolume(volume);
	}

	const _updateCurrentTime = (currentTime: number) => {
		store.dispatch(setCurrentTime(currentTime));
	}

	const _updateDuration = (duration: number) => {
		store.dispatch(setDuration(duration));
	}

	const _updateStartingTime = (startingTime: number) => {
		store.dispatch(setCurrentTime(startingTime));
		window.videoPlayer.updateStartingTime(startingTime);
	}

	const _next = async () => {
		const nextRequest = await RequestMediator.skipToNext();
		if (nextRequest !== null) {
			console.log(nextRequest.mediaFilePath);
			_startNewVideo(nextRequest.mediaFilePath);
		} else {
			console.log('No more songs in queue');
			// Stop current playback
			_pause();
		}
	}

	const _previous = async () => {
		const previousRequest = await RequestMediator.skipToPrevious();
		if (previousRequest !== null) {
			_startNewVideo(previousRequest.mediaFilePath);
		} else {
			console.log('No completed songs to go back to');
			// Stop current playback
			_pause();
		}
	}

	return {
		Pause: _pause,
		Unpause: _unpause,
		SetVolume: _setVolume,
		StartNewVideo: _startNewVideo,
		UpdateCurrentTime: _updateCurrentTime,
		UpdateDuration: _updateDuration,
		SetStartingTime: _updateStartingTime,
		Next: _next,
		Previous: _previous
	}
}());

export default PlayerMediator;
