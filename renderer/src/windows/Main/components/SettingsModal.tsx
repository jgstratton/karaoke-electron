import React, { useEffect, useState } from 'react'
import PouchDB from 'pouchdb-browser'
import Modal, { modalStyles } from '../../../components/shared/Modal'

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

	const footerButtons = (
		<>
			<button className={modalStyles.secondaryBtn} onClick={onClose}>
				Cancel
			</button>
			<button
				className={canSave ? modalStyles.primaryBtn : modalStyles.secondaryBtn}
				onClick={saveSettings}
				disabled={!canSave}
				style={{
					opacity: canSave ? 1 : 0.6,
					cursor: canSave ? 'pointer' : 'not-allowed',
				}}
			>
				{saving ? 'Saving...' : 'Save Settings'}
			</button>
		</>
	)

	return (
		<div onKeyDown={handleKeyDown} tabIndex={-1}>
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				title="Settings"
				size="medium"
				footer={footerButtons}
			>
				{loading ? (
					<div className={modalStyles.loadingContainer}>
						<p>Loading settings...</p>
					</div>
				) : (
					<div className={modalStyles.infoSection}>
						<h3 className={modalStyles.sectionTitle}>Media Files Location</h3>
						<p className="hint" style={{ marginBottom: 12, fontSize: '0.9em', color: '#7d8590' }}>
							Choose a folder where your video and picture files are stored. This path
							will be saved in the database.
						</p>

						<div style={{ marginBottom: 12 }}>
							<label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: '#f0f6fc' }}>
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
										background: '#0d1117',
										color: '#f0f6fc',
										border: '1px solid #21262d',
										borderRadius: '6px',
										padding: '8px 12px',
									}}
									autoComplete="off"
								/>
								<button
									className={modalStyles.primaryBtn}
									onClick={browseForFolder}
								>
									Browse...
								</button>
							</div>

							{pathValid === true && (
								<p style={{ color: '#2ea043', fontSize: '0.8em', margin: '4px 0 0 0' }}>
									✓ Valid folder path
								</p>
							)}
							{pathValid === false && (
								<p style={{ color: '#f85149', fontSize: '0.8em', margin: '4px 0 0 0' }}>
									✗ Invalid folder path or folder doesn't exist
								</p>
							)}
						</div>

						<div style={{ marginBottom: 16 }}>
							<p style={{ fontSize: '0.85em', margin: 0, color: '#7d8590' }}>
								<strong style={{ color: '#f0f6fc' }}>Tip:</strong> Use a folder that contains your karaoke video files.
								Supported formats include MP4, AVI, MKV, and more.
							</p>
						</div>
					</div>
				)}
			</Modal>
		</div>
	)
}
