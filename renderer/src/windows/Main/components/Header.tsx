import { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import styles from './Header.module.css'
import ConfirmDialog from '../../../components/shared/ConfirmDialog'
import AlertDialog from '../../../components/shared/AlertDialog'
import { selectQueuedRequests } from '../store/selectors'

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

	const handleInstallYtDlp = async () => {
		setIsInstalling(true)
		try {
			const result = await window.youtube.install()
			setAlertTitle(result.success ? 'Success' : 'Error')
			setAlertMessage(result.message)
			setShowInstallAlert(true)
		} catch (error) {
			setAlertTitle('Error')
			setAlertMessage('Failed to install yt-dlp')
			setShowInstallAlert(true)
		} finally {
			setIsInstalling(false)
			setShowInstallConfirm(false)
		}
	}

	return (
		<>
			<ConfirmDialog
				isOpen={showInstallConfirm}
				onCancel={() => setShowInstallConfirm(false)}
				onConfirm={handleInstallYtDlp}
				title="Install yt-dlp"
				message="Do you want to download and install yt-dlp? This is required for YouTube features."
				confirmText="Install"
				isProcessing={isInstalling}
			/>

			<AlertDialog
				isOpen={showInstallAlert}
				onCancel={() => setShowInstallAlert(false)}
				title={alertTitle}
				message={alertMessage}
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

									setShowInstallConfirm(true)
								}}
							>
								Install yt-dlp
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
