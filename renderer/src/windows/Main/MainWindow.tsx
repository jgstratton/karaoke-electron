import { useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "./store"
import SingerRotationPanel from "./components/SingerRotationPanel"
import VideoControlsPanel from "./components/VideoControlsPanel"
import VideoPreview from "./components/VideoPreview"
import Header from "./components/Header"
import SongList from "./components/SongList"
import SettingsModal from "./components/SettingsModal"
import ReduxStoreModal from "./components/ReduxStoreModal"
import DatabaseExplorerModal from "./components/DatabaseExplorerModal"
import MediaBrowserModal from "./components/MediaBrowserModal"

export default function MainWindow() {
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)
	const [isReduxStoreOpen, setIsReduxStoreOpen] = useState(false)
	const [isDatabaseExplorerOpen, setIsDatabaseExplorerOpen] = useState(false)
	const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false)
	const reduxState = useSelector((state: RootState) => state)

	const handleViewReduxStore = () => {
		setIsReduxStoreOpen(true)
	}

	return (
		<div className="karaoke-main-layout">
			<div className="karaoke-header">
				<Header
					onOpenSettings={() => setIsSettingsOpen(true)}
					onViewReduxStore={handleViewReduxStore}
					onOpenDatabaseExplorer={() => setIsDatabaseExplorerOpen(true)}
					onOpenMediaBrowser={() => setIsMediaBrowserOpen(true)}
				/>
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

			<ReduxStoreModal
				isOpen={isReduxStoreOpen}
				onClose={() => setIsReduxStoreOpen(false)}
				storeData={reduxState}
			/>

			<DatabaseExplorerModal
				isOpen={isDatabaseExplorerOpen}
				onClose={() => setIsDatabaseExplorerOpen(false)}
			/>

			<MediaBrowserModal
				isOpen={isMediaBrowserOpen}
				onClose={() => setIsMediaBrowserOpen(false)}
			/>
		</div>
	)
}
