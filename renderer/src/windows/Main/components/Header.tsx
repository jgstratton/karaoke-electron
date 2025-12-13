import { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import styles from './Header.module.css'
import ConfirmDialog from '../../../components/shared/ConfirmDialog'
import AlertDialog from '../../../components/shared/AlertDialog'
import { selectQueuedRequests } from '../store/selectors'
import YouTubeSearchModal from './YouTubeSearchModal'
import MetadataMediator from '@/mediators/MetadataMediator'
import ProgressDialog from '@/components/shared/ProgressDialog'

interface HeaderProps {
	onOpenSettings: () => void
	onViewReduxStore: () => void
	onOpenDatabaseExplorer: () => void
	onOpenMediaBrowser: () => void
	onCreateParty: () => void
	onLoadParty: () => void
	onEditPartyDetails: () => void
	onAddSinger: () => void
	onAddRequest: () => void
}

export default function Header({ onOpenSettings, onViewReduxStore, onOpenDatabaseExplorer, onOpenMediaBrowser, onCreateParty, onLoadParty, onEditPartyDetails, onAddSinger, onAddRequest }: HeaderProps) {
	const [showToolsMenu, setShowToolsMenu] = useState(false)
	const [showPartyMenu, setShowPartyMenu] = useState(false)
	const { currentParty } = useSelector((state: RootState) => state.party)
	const queuedRequests = useSelector(selectQueuedRequests)

	// Modal states
	const [showInstallConfirm, setShowInstallConfirm] = useState(false)
	const [showInstallAlert, setShowInstallAlert] = useState(false)
	const [alertMessage, setAlertMessage] = useState('')
	const [alertTitle, setAlertTitle] = useState('')
	const [isInstalling, setIsInstalling] = useState(false)
	const [installType, setInstallType] = useState<'yt-dlp' | 'ffmpeg' | null>(null)
	const [showYouTubeSearch, setShowYouTubeSearch] = useState(false)
	const [showUpdateMetadataConfirm, setShowUpdateMetadataConfirm] = useState(false)
	const [isUpdatingMetadata, setIsUpdatingMetadata] = useState(false)
	const [showUpdateMetadataProgress, setShowUpdateMetadataProgress] = useState(false)
	const [metadataProgressText, setMetadataProgressText] = useState('')
	const [metadataAbortController, setMetadataAbortController] = useState<AbortController | null>(null)

	const handleInstall = async () => {
		if (!installType) return

		setIsInstalling(true)
		try {
			const result = installType === 'yt-dlp'
				? await window.youtube.install()
				: await window.ffmpeg.install()

			setAlertTitle(result.success ? 'Success' : 'Error')
			setAlertMessage(result.message)
			setShowInstallAlert(true)
		} catch (error) {
			setAlertTitle('Error')
			setAlertMessage(`Failed to install ${installType}`)
			setShowInstallAlert(true)
		} finally {
			setIsInstalling(false)
			setShowInstallConfirm(false)
			setInstallType(null)
		}
	}

	const handleUpdateMetadata = async () => {
		const controller = new AbortController()
		setMetadataAbortController(controller)
		setIsUpdatingMetadata(true)
		setShowUpdateMetadataProgress(true)
		setMetadataProgressText('Starting...')
		try {
			const summary = await MetadataMediator.updateDatabaseMetadata({
				signal: controller.signal,
				onProgress: (p) => {
					const fileLine = p.videoId ? `${p.fileName} [${p.videoId}]` : p.fileName
					setMetadataProgressText(`${p.current}/${p.total}\n${fileLine}`)
				},
			})
			setAlertTitle(summary.cancelled ? 'Metadata update cancelled' : 'Metadata updated')
			setAlertMessage(
				`Scanned: ${summary.scannedFiles}. Added: ${summary.updated}. Skipped (no id): ${summary.skippedNoId}. Skipped (existing): ${summary.skippedExisting}. Errors: ${summary.errors}.`
			)
			setShowInstallAlert(true)
		} catch (e: any) {
			setAlertTitle('Error')
			setAlertMessage(e?.message || 'Failed to update metadata')
			setShowInstallAlert(true)
		} finally {
			setIsUpdatingMetadata(false)
			setShowUpdateMetadataConfirm(false)
			setShowUpdateMetadataProgress(false)
			setMetadataAbortController(null)
		}
	}

	const cancelUpdateMetadata = () => {
		metadataAbortController?.abort()
		setMetadataProgressText((prev) => (prev ? `${prev}\nCancelling...` : 'Cancelling...'))
	}

	return (
		<>
			<ConfirmDialog
				isOpen={showInstallConfirm}
				onCancel={() => {
					setShowInstallConfirm(false)
					setInstallType(null)
				}}
				onConfirm={handleInstall}
				title={`Install ${installType}`}
				message={`Do you want to download and install ${installType}? This is required for media features.`}
				confirmText="Install"
				isProcessing={isInstalling}
			/>

			<ConfirmDialog
				isOpen={showUpdateMetadataConfirm}
				onCancel={() => setShowUpdateMetadataConfirm(false)}
				onConfirm={handleUpdateMetadata}
				title="Update Database Metadata"
				message="This scans your media folder and adds missing artist/title info and 4 YouTube thumbnails for each video id it can detect."
				confirmText="Update"
				isProcessing={isUpdatingMetadata}
			/>

			<ProgressDialog
				isOpen={showUpdateMetadataProgress}
				title="Updating Database Metadata"
				message="Processing media files..."
				progressText={metadataProgressText}
				onCancel={cancelUpdateMetadata}
				isCancellable={!metadataAbortController?.signal.aborted}
			/>

			<AlertDialog
				isOpen={showInstallAlert}
				onCancel={() => setShowInstallAlert(false)}
				title={alertTitle}
				message={alertMessage}
			/>

			<YouTubeSearchModal
				isOpen={showYouTubeSearch}
				onClose={() => setShowYouTubeSearch(false)}
			/>

			<div className={styles.logo}>
				<img src="/src/assets/logo.png" alt="Karaoke Logo" className={styles.logoImage} />
				<div>
					<h1 className={styles.title}>Karaoke Party</h1>
					<p className={styles.subtitle}>Professional Karaoke System</p>
				</div>
			</div>

			<div className={styles.menu}>
				<div className={styles.menuItem}>
					<span
						className={styles.menuLabel}
						onClick={() => setShowPartyMenu(!showPartyMenu)}
						onBlur={() => setTimeout(() => setShowPartyMenu(false), 150)}
						tabIndex={0}
					>
						Party <i className={`fas fa-angle-down ${styles.dropdownArrow}`}></i>
					</span>
					{showPartyMenu && (
						<div className={styles.dropdownMenu}>
							<div
								className={styles.dropdownItem}
								onClick={() => {
									onCreateParty()
									setShowPartyMenu(false)
								}}
							>
								<i className="fas fa-plus"></i> Create New Party
							</div>
							<div
								className={styles.dropdownItem}
								onClick={() => {
									onLoadParty()
									setShowPartyMenu(false)
								}}
							>
								<i className="fas fa-folder-open"></i> Load Existing Party
							</div>
							{currentParty && (
								<>
									<div className={styles.dropdownDivider}></div>
									<div
										className={styles.dropdownItem}
										onClick={() => {
											onEditPartyDetails()
											setShowPartyMenu(false)
										}}
									>
										<i className="fas fa-edit"></i> Edit Party Details
									</div>
									<div
										className={styles.dropdownItem}
										onClick={() => {
											onAddSinger()
											setShowPartyMenu(false)
										}}
									>
										<i className="fas fa-user-plus"></i> Add Singer to Rotation
									</div>
									<div
										className={styles.dropdownItem}
										onClick={() => {
											onAddRequest()
											setShowPartyMenu(false)
										}}
									>
										<i className="fas fa-music"></i> Add Song Request
									</div>

								</>
							)}
						</div>
					)}
				</div>
				<div className={styles.menuItem}>
					<span
						className={styles.menuLabel}
						onClick={() => setShowToolsMenu(!showToolsMenu)}
						onBlur={() => setTimeout(() => setShowToolsMenu(false), 150)}
						tabIndex={0}
					>
						Tools <i className={`fas fa-angle-down ${styles.dropdownArrow}`}></i>
					</span>
					{showToolsMenu && (
						<div className={styles.dropdownMenu}>
							<div
								className={styles.dropdownItem}
								onClick={() => {
									onOpenSettings()
									setShowToolsMenu(false)
								}}
							>
								Settings
							</div>
							<div
								className={styles.dropdownItem}
								onClick={() => {
									onViewReduxStore()
									setShowToolsMenu(false)
								}}
							>
								View Redux Store
							</div>
							<div
								className={styles.dropdownItem}
								onClick={() => {
									onOpenDatabaseExplorer()
									setShowToolsMenu(false)
								}}
							>
								Database Explorer
							</div>
							<div
								className={styles.dropdownItem}
								onClick={() => {
									onOpenMediaBrowser()
									setShowToolsMenu(false)
								}}
							>
								Media Browser
							</div>
							<div
								className={styles.dropdownItem}
								onClick={() => {
									setShowToolsMenu(false)
									setShowYouTubeSearch(true)
								}}
							>
								YouTube Karaoke Search
							</div>
							<div
								className={styles.dropdownItem}
								onClick={() => {
									setShowToolsMenu(false)
									setShowUpdateMetadataConfirm(true)
								}}
							>
								Update Database Metadata
							</div>
							<div className={styles.dropdownDivider}></div>
							<div
								className={styles.dropdownItem}
								onClick={async () => {
									setShowToolsMenu(false)
									const isInstalled = await window.youtube.checkInstalled()
									if (isInstalled) {
										setAlertTitle('Info')
										setAlertMessage('yt-dlp is already installed.')
										setShowInstallAlert(true)
										return
									}

									setInstallType('yt-dlp')
									setShowInstallConfirm(true)
								}}
							>
								Install yt-dlp
							</div>
							<div
								className={styles.dropdownItem}
								onClick={async () => {
									setShowToolsMenu(false)
									const isInstalled = await window.ffmpeg.checkInstalled()
									if (isInstalled) {
										setAlertTitle('Info')
										setAlertMessage('ffmpeg is already installed.')
										setShowInstallAlert(true)
										return
									}

									setInstallType('ffmpeg')
									setShowInstallConfirm(true)
								}}
							>
								Install ffmpeg
							</div>
						</div>
					)}
				</div>
			</div>			<div className={styles.controls}>
				{currentParty ? (
					<>
						<span>Party: {currentParty.name}</span>
						<span>•</span>
						<span>Created: {new Date(currentParty.creationDate).toLocaleDateString()}</span>
					</>
				) : (
					<span>No Party Selected</span>
				)}
				<span>•</span>
				<span>Singers: {currentParty?.singers?.length || 0}</span>
				<span>•</span>
				<span>Queue: {queuedRequests.length} songs</span>
			</div>
		</>
	)
}
