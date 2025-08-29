import VideoPlayerWindow from './windows/playerWindow/VideoPlayerWindow.js'
import MainWindow from './windows/main/MainWindow.tsx'

export default function App() {
	// Check which view to show based on URL params
	const urlParams = new URLSearchParams(window.location.search)
	const view = urlParams.get('view')

	if (view === 'videoplayer') {
		return <VideoPlayerWindow />
	}

	return <MainWindow />
}
