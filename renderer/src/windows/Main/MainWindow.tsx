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
import styles from "./MainWindow.module.css"

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
		<div className={styles.mainLayout}>
			<div className={styles.header}>
				<Header
					onOpenSettings={() => setIsSettingsOpen(true)}
					onViewReduxStore={handleViewReduxStore}
					onOpenDatabaseExplorer={() => setIsDatabaseExplorerOpen(true)}
					onOpenMediaBrowser={() => setIsMediaBrowserOpen(true)}
				/>
			</div>

			<div className={styles.singerRotationPanel}>
				<SingerRotationPanel />
			</div>

			<div className={styles.videoControlsSection}>
				<VideoControlsPanel />
			</div>

			<div className={styles.videoPreviewSection}>
				<VideoPreview />
			</div>

			<div className={styles.songQueueSection}>
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
