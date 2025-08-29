import { useState } from 'react'
import styles from './Header.module.css'

interface HeaderProps {
	onOpenSettings: () => void
	onViewReduxStore: () => void
	onOpenDatabaseExplorer: () => void
	onOpenMediaBrowser: () => void
}

export default function Header({ onOpenSettings, onViewReduxStore, onOpenDatabaseExplorer, onOpenMediaBrowser }: HeaderProps) {
	const [showToolsMenu, setShowToolsMenu] = useState(false)

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
