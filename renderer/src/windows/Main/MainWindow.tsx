import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { RootState } from "./store"
import { PartyDoc } from "@/types"
import SingerRotationPanel from "./components/SingerRotationPanel"
import VideoControlsPanel from "./components/VideoControlsPanel"
import VideoPreview from "./components/VideoPreview"
import Header from "./components/Header"
import SongList from "./components/SongList"
import SettingsModal from "./components/SettingsModal"
import ReduxStoreModal from "./components/ReduxStoreModal"
import DatabaseExplorerModal from "./components/DatabaseExplorerModal"
import MediaBrowserModal from "./components/MediaBrowserModal"
import PartyModal from "./components/PartyModal"
import LoadPartyModal from "./components/LoadPartyModal"
import PlayerMediator from "../../mediators/PlayerMediator"
import PartyMediator from "../../mediators/PartyMediator"
import styles from "./MainWindow.module.css"

export default function MainWindow() {
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)
	const [isReduxStoreOpen, setIsReduxStoreOpen] = useState(false)
	const [isDatabaseExplorerOpen, setIsDatabaseExplorerOpen] = useState(false)
	const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false)
	const [isPartyModalOpen, setIsPartyModalOpen] = useState(false)
	const [isLoadPartyModalOpen, setIsLoadPartyModalOpen] = useState(false)
	const reduxState = useSelector((state: RootState) => state)

	useEffect(() => {
		if (!window.videoPlayer) {
			return;
		}

		const handleTimeUpdate = (_event: any, currentTime: number) => {
			PlayerMediator.UpdateCurrentTime(currentTime);
		}

		const handleDurationUpdate = (_event: any, duration: number) => {
			PlayerMediator.UpdateDuration(duration);
		}

		window.videoPlayer.onUpdateCurrentTime(handleTimeUpdate);
		window.videoPlayer.onUpdateDuration(handleDurationUpdate);

		return () => {
			window.videoPlayer.removeUpdateCurrentTimeListener(handleTimeUpdate);
			window.videoPlayer.removeUpdateDurationListener(handleDurationUpdate);
		}
	}, [])

	const handleViewReduxStore = () => {
		setIsReduxStoreOpen(true)
	}

	const handleCreateParty = () => {
		setIsPartyModalOpen(true)
	}

	const handleLoadParty = () => {
		setIsLoadPartyModalOpen(true)
	}

	const handlePartyLoaded = async (party: PartyDoc) => {
		await PartyMediator.setCurrentParty(party)
	}

	const handlePartyCreation = async (name: string) => {
		const newParty = await PartyMediator.createParty(name)
		await PartyMediator.setCurrentParty(newParty)
	}

	return (
		<div className={styles.mainLayout}>
			<div className={styles.header}>
				<Header
					onOpenSettings={() => setIsSettingsOpen(true)}
					onViewReduxStore={handleViewReduxStore}
					onOpenDatabaseExplorer={() => setIsDatabaseExplorerOpen(true)}
					onOpenMediaBrowser={() => setIsMediaBrowserOpen(true)}
					onCreateParty={handleCreateParty}
					onLoadParty={handleLoadParty}
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

			<PartyModal
				isOpen={isPartyModalOpen}
				onClose={() => setIsPartyModalOpen(false)}
				onCreateParty={handlePartyCreation}
			/>

			<LoadPartyModal
				isOpen={isLoadPartyModalOpen}
				onClose={() => setIsLoadPartyModalOpen(false)}
				onLoadParty={handlePartyLoaded}
			/>
		</div>
	)
}
