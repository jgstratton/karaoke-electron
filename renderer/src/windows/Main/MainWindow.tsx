import { useState } from "react"
import SingerRotationPanel from "./components/SingerRotationPanel"
import VideoControlsPanel from "./components/VideoControlsPanel"
import VideoPreview from "./components/VideoPreview"
import Header from "./components/Header"
import SongList from "./components/SongList"
import SettingsModal from "./components/SettingsModal"

export default function MainWindow() {
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)

	return (
		<div className="karaoke-main-layout">
			<div className="karaoke-header">
				<Header onOpenSettings={() => setIsSettingsOpen(true)} />
			</div>

			<div className="singer-rotation-panel">
				<SingerRotationPanel />
			</div>

			<div className="video-controls-section">
				<VideoControlsPanel />
			</div>

			<div className="video-preview-section">
				<VideoPreview />
			</div>

			<div className="song-queue-section">
				<SongList />
			</div>

			<SettingsModal
				isOpen={isSettingsOpen}
				onClose={() => setIsSettingsOpen(false)}
			/>
		</div>
	)
}
