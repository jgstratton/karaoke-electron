export default function Header() {
	return (
		<>
			<div className="karaoke-logo">
				<img src="/src/assets/logo.png" alt="Karaoke Logo" />
				<div>
					<h1 className="karaoke-title">Karaoke Party</h1>
					<p className="karaoke-subtitle">Professional Karaoke System</p>
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
