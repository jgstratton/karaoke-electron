import React, { useEffect, useState } from 'react'
import PouchDB from 'pouchdb-browser'

const db = new PouchDB('karaoke-db')

export default function Settings() {
	const [mediaPath, setMediaPath] = useState('')
	const [originalPath, setOriginalPath] = useState('')
	const [saving, setSaving] = useState(false)
	const [loading, setLoading] = useState(true)
	const [pathValid, setPathValid] = useState(null)

	useEffect(() => {
		loadSettings()
	}, [])

	const loadSettings = async () => {
		try {
			const doc = await db.get('settings')
			const path = doc.mediaPath || ''
			setMediaPath(path)
			setOriginalPath(path)
			if (path) {
				validatePath(path)
			}
		} catch (err) {
			if (err.status === 404) {
				// Settings don't exist yet, that's fine
				setMediaPath('')
				setOriginalPath('')
			} else {
				console.error('Failed to load settings:', err)
			}
		} finally {
			setLoading(false)
		}
	}

	const validatePath = async path => {
		if (!path.trim()) {
			setPathValid(null)
			return
		}

		try {
			if (window.fileSystem) {
				const isValid = await window.fileSystem.validatePath(path)
				setPathValid(isValid)
			} else {
				// Fallback for non-Electron environments
				setPathValid(null)
			}
		} catch (err) {
			console.error('Path validation error:', err)
			setPathValid(false)
		}
	}

	const selectFolder = async () => {
		try {
			if (window.fileSystem) {
				const selectedPath = await window.fileSystem.selectFolder()
				if (selectedPath) {
					setMediaPath(selectedPath)
					validatePath(selectedPath)
				}
			} else {
				alert('Folder selection is only available in the desktop app')
			}
		} catch (err) {
			console.error('Folder selection error:', err)
			alert('Failed to open folder selector')
		}
	}

	const saveSettings = async () => {
		setSaving(true)
		try {
			let doc
			try {
				doc = await db.get('settings')
			} catch (e) {
				if (e.status === 404) {
					doc = { _id: 'settings' }
				} else {
					throw e
				}
			}

			doc.mediaPath = mediaPath.trim()
			doc.updatedAt = new Date().toISOString()

			await db.put(doc)
			setOriginalPath(mediaPath)

			// Show success message
			setTimeout(() => {
				alert('Settings saved successfully!')
			}, 100)
		} catch (err) {
			console.error('Failed to save settings:', err)
			alert('Failed to save settings: ' + err.message)
		} finally {
			setSaving(false)
		}
	}

	const resetToOriginal = () => {
		setMediaPath(originalPath)
		validatePath(originalPath)
	}

	const hasChanges = mediaPath !== originalPath

	if (loading) {
		return (
			<div className="container">
				<div className="card">
					<p>Loading settings...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="container">
			<div className="card">
				<h1 style={{ marginTop: 0 }}>Settings</h1>

				<div style={{ marginBottom: 20 }}>
					<h3 style={{ marginBottom: 8 }}>Media Files Location</h3>
					<p className="hint" style={{ marginBottom: 12, fontSize: '0.9em' }}>
						Choose a folder where your video and picture files are stored. This path
						will be saved in the database.
					</p>

					<div style={{ marginBottom: 12 }}>
						<label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
							Folder Path:
						</label>
						<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
							<input
								type="text"
								value={mediaPath}
								onChange={e => {
									setMediaPath(e.target.value)
									validatePath(e.target.value)
								}}
								placeholder="e.g., C:\\Users\\YourName\\Music\\Karaoke"
								style={{
									flex: 1,
									fontSize: '0.9em',
									fontFamily: 'monospace',
								}}
							/>
							<button onClick={selectFolder} style={{ whiteSpace: 'nowrap' }}>
								Browse...
							</button>
						</div>
					</div>

					{/* Path validation indicator */}
					{pathValid === true && (
						<p style={{ color: '#28a745', fontSize: '0.85em', margin: '4px 0 0 0' }}>
							✓ Path exists and is accessible
						</p>
					)}
					{pathValid === false && (
						<p style={{ color: '#dc3545', fontSize: '0.85em', margin: '4px 0 0 0' }}>
							✗ Path does not exist or is not accessible
						</p>
					)}

					{/* Current path info */}
					{mediaPath && (
						<div
							style={{
								background: '#1a1f2e',
								border: '1px solid #2a2f3a',
								borderRadius: 6,
								padding: 8,
								marginTop: 12,
								fontSize: '0.85em',
							}}
						>
							<strong>Current path:</strong>
							<br />
							<code style={{ wordBreak: 'break-all' }}>{mediaPath}</code>
						</div>
					)}
				</div>

				{/* Action buttons */}
				<div
					style={{
						display: 'flex',
						gap: 8,
						justifyContent: 'space-between',
						alignItems: 'center',
						paddingTop: 16,
						borderTop: '1px solid #2a2f3a',
					}}
				>
					<div>
						{hasChanges && (
							<button
								onClick={resetToOriginal}
								style={{
									background: '#6c757d',
									fontSize: '0.9em',
								}}
							>
								Reset
							</button>
						)}
					</div>

					<div style={{ display: 'flex', gap: 8 }}>
						<button
							onClick={() => window.close && window.close()}
							style={{
								background: '#6c757d',
								fontSize: '0.9em',
							}}
						>
							Cancel
						</button>
						<button
							onClick={saveSettings}
							disabled={saving || pathValid === false}
							style={{
								opacity: saving || pathValid === false ? 0.6 : 1,
								fontSize: '0.9em',
							}}
						>
							{saving ? 'Saving...' : 'Save Settings'}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
