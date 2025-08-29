import React, { useEffect, useState } from 'react'
import PouchDB from 'pouchdb-browser'

const db = new PouchDB('karaoke-db')

interface SettingsModalProps {
	isOpen: boolean
	onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
	const [mediaPath, setMediaPath] = useState('')
	const [originalPath, setOriginalPath] = useState('')
	const [saving, setSaving] = useState(false)
	const [loading, setLoading] = useState(true)
	const [pathValid, setPathValid] = useState<boolean | null>(null)

	useEffect(() => {
		if (isOpen) {
			loadSettings()
		}
	}, [isOpen])

	const loadSettings = async () => {
		try {
			const doc = await db.get('settings') as any
			const path = doc.mediaPath || ''
			setMediaPath(path)
			setOriginalPath(path)
			if (path) {
				validatePath(path)
			}
		} catch (err: any) {
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

	const validatePath = async (path: string) => {
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
				setPathValid(true)
			}
		} catch (err) {
			console.error('Path validation failed:', err)
			setPathValid(false)
		}
	}

	const browseForFolder = async () => {
		try {
			if (window.fileSystem) {
				const selectedPath = await window.fileSystem.selectFolder()
				if (selectedPath) {
					setMediaPath(selectedPath)
					validatePath(selectedPath)
				}
			} else {
				alert('File system access not available in this environment')
			}
		} catch (err) {
			console.error('Failed to browse for folder:', err)
			alert('Failed to open folder browser: ' + err)
		}
	}

	const saveSettings = async () => {
		setSaving(true)
		try {
			let doc: any
			try {
				doc = await db.get('settings')
			} catch (err: any) {
				if (err.status === 404) {
					// Document doesn't exist, create new one
					doc = { _id: 'settings' }
				} else {
					throw err
				}
			}

			doc.mediaPath = mediaPath.trim()
			await db.put(doc)

			setOriginalPath(mediaPath)
			alert('Settings saved successfully!')
		} catch (err) {
			console.error('Failed to save settings:', err)
			alert('Failed to save settings: ' + err)
		} finally {
			setSaving(false)
		}
	}

	const hasChanges = mediaPath !== originalPath
	const canSave = hasChanges && pathValid !== false && !saving

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			onClose()
		}
	}

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose()
		}
	}

	if (!isOpen) return null

	return (
		<div className="modal-overlay" onClick={handleOverlayClick} onKeyDown={handleKeyDown} tabIndex={-1}>
			<div className="modal-content settings-modal">
				<div className="modal-header">
					<h2>Settings</h2>
					<button className="modal-close-btn" onClick={onClose}>×</button>
				</div>

				<div className="modal-body">
					{loading ? (
						<p>Loading settings...</p>
					) : (
						<>
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
											}}
											autoComplete="off"
										/>
										<button
											onClick={browseForFolder}
											style={{
												background: '#007bff',
												color: 'white',
												border: 'none',
												padding: '8px 12px',
												borderRadius: '4px',
												cursor: 'pointer',
												fontSize: '0.9em',
											}}
										>
											Browse...
										</button>
									</div>

									{pathValid === true && (
										<p style={{ color: '#28a745', fontSize: '0.8em', margin: '4px 0 0 0' }}>
											✓ Valid folder path
										</p>
									)}
									{pathValid === false && (
										<p style={{ color: '#dc3545', fontSize: '0.8em', margin: '4px 0 0 0' }}>
											✗ Invalid folder path or folder doesn't exist
										</p>
									)}
								</div>

								<div style={{ marginBottom: 16 }}>
									<p className="hint" style={{ fontSize: '0.85em', margin: 0 }}>
										<strong>Tip:</strong> Use a folder that contains your karaoke video files.
										Supported formats include MP4, AVI, MKV, and more.
									</p>
								</div>
							</div>
						</>
					)}
				</div>

				<div className="modal-footer">
					<button onClick={onClose} style={{ marginRight: 8 }}>
						Cancel
					</button>
					<button
						onClick={saveSettings}
						disabled={!canSave}
						style={{
							background: canSave ? '#28a745' : '#6c757d',
							color: 'white',
							border: 'none',
							padding: '8px 16px',
							borderRadius: '4px',
							cursor: canSave ? 'pointer' : 'not-allowed',
						}}
					>
						{saving ? 'Saving...' : 'Save Settings'}
					</button>
				</div>
			</div>
		</div>
	)
}
