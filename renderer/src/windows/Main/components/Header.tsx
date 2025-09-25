import { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import styles from './Header.module.css'

interface HeaderProps {
	onOpenSettings: () => void
	onViewReduxStore: () => void
	onOpenDatabaseExplorer: () => void
	onOpenMediaBrowser: () => void
	onCreateParty: () => void
	onSelectParty: (partyId: string) => void
}

export default function Header({ onOpenSettings, onViewReduxStore, onOpenDatabaseExplorer, onOpenMediaBrowser, onCreateParty, onSelectParty }: HeaderProps) {
	const [showToolsMenu, setShowToolsMenu] = useState(false)
	const [showPartyMenu, setShowPartyMenu] = useState(false)
	const { parties, currentParty } = useSelector((state: RootState) => state.party)

	return (
		<>
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
							{parties.length > 0 && (
								<>
									<div className={styles.dropdownDivider}></div>
									<div className={styles.dropdownHeader}>Select Party:</div>
									{parties.map((party) => (
										<div
											key={party._id}
											className={`${styles.dropdownItem} ${
												currentParty?._id === party._id ? styles.active : ''
											}`}
											onClick={() => {
												onSelectParty(party._id)
												setShowPartyMenu(false)
											}}
										>
											<i className="fas fa-calendar"></i> {party.name}
											<small className={styles.partyDate}>
												{new Date(party.creationDate).toLocaleDateString()}
											</small>
										</div>
									))}
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
						</div>
					)}
				</div>
			</div>

			<div className={styles.controls}>
				<span>Session: Active</span>
				<span>•</span>
				<span>Singers: 4</span>
				<span>•</span>
				<span>Queue: 4 songs</span>
			</div>
		</>
	)
}
