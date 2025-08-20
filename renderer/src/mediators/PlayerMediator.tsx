import {store} from '../windows/main/store';
import { play } from '../windows/main/store/slices/playerSlice';

export default function PlayerMediator() {
	return {
		Play: () => {
			store.dispatch(play());
		}
	}
}
