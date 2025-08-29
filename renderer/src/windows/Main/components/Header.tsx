import { useState } from 'react'

interface HeaderProps {
	onOpenSettings: () => void
	onViewReduxStore: () => void
	onOpenDatabaseExplorer: () => void
}

export default function Header({ onOpenSettings, onViewReduxStore, onOpenDatabaseExplorer }: HeaderProps) {
	const [showToolsMenu, setShowToolsMenu] = useState(false)

	return (
		<>
			<div className="karaoke-logo">
				<img src="/src/assets/logo.png" alt="Karaoke Logo" />
				<div>
					<h1 className="karaoke-title">Karaoke Party</h1>
					<p className="karaoke-subtitle">Professional Karaoke System</p>
				</div>
			</div>

			<div className="header-menu">
				<div className="menu-item">
					<span
						className="menu-label"
						onClick={() => setShowToolsMenu(!showToolsMenu)}
						onBlur={() => setTimeout(() => setShowToolsMenu(false), 150)}
						tabIndex={0}
					>
						Tools <i className="fas fa-angle-down dropdown-arrow"></i>
					</span>
					{showToolsMenu && (
						<div className="dropdown-menu">
							<div
								className="dropdown-item"
								onClick={() => {
									onOpenSettings()
									setShowToolsMenu(false)
								}}
							>
								Settings
							</div>
							<div
								className="dropdown-item"
								onClick={() => {
									onViewReduxStore()
									setShowToolsMenu(false)
								}}
							>
								View Redux Store
							</div>
							<div
								className="dropdown-item"
								onClick={() => {
									onOpenDatabaseExplorer()
									setShowToolsMenu(false)
								}}
							>
								Database Explorer
							</div>
						</div>
					)}
				</div>
			</div>

			<div className="header-controls">
				<span>Session: Active</span>
				<span>•</span>
				<span>Singers: 4</span>
				<span>•</span>
				<span>Queue: 4 songs</span>
			</div>
		</>
	)
}
