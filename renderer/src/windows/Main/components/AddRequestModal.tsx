import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Modal, { modalStyles } from '../../../components/shared/Modal'
import { MediaFile } from '@/types'
import { RootState } from '../store'
import styles from './AddRequestModal.module.css'
import PouchDB from 'pouchdb-browser'

const db = new PouchDB('karaoke-db')

interface AddRequestModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (singerId: string, mediaFilePath: string, songTitle: string) => Promise<void>
}

export default function AddRequestModal({ isOpen, onClose, onSave }: AddRequestModalProps) {
	const { currentParty } = useSelector((state: RootState) => state.party)
	const singers = currentParty?.singers || []

	const [selectedSingerId, setSelectedSingerId] = useState('')
	const [searchTerm, setSearchTerm] = useState('')
	const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
	const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([])
	const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [loading, setLoading] = useState(false)
	const [mediaPath, setMediaPath] = useState('')

	useEffect(() => {
		if (isOpen) {
			loadMediaFiles()
			// Reset form
			setSelectedSingerId('')
			setSearchTerm('')
			setSelectedFile(null)
		}
	}, [isOpen])

	useEffect(() => {
		// Filter media files based on search term
		const filtered = mediaFiles.filter(file =>
			file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			file.relativePath.toLowerCase().includes(searchTerm.toLowerCase())
		)
		setFilteredFiles(filtered)
	}, [mediaFiles, searchTerm])

	const loadMediaFiles = async () => {
		try {
			setLoading(true)

			// Load media path from settings
			const doc = await db.get('settings') as any
			const path = doc.mediaPath || ''
			setMediaPath(path)

			if (path && window.fileSystem) {
				const files = await window.fileSystem.scanMediaFiles(path)
				setMediaFiles(files)
			}
		} catch (err: any) {
			if (err.status !== 404) {
				console.error('Failed to load media files:', err)
			}
		} finally {
			setLoading(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!selectedSingerId || !selectedFile) {
			return
		}

		setIsSaving(true)
		try {
			await onSave(selectedSingerId, selectedFile.path, selectedFile.name)
			handleClose()
		} catch (err) {
			console.error('Failed to add request:', err)
			alert('Failed to add request. Please try again.')
		} finally {
			setIsSaving(false)
		}
	}

	const handleClose = () => {
		if (!isSaving) {
			setSelectedSingerId('')
			setSearchTerm('')
			setSelectedFile(null)
			onClose()
		}
	}

	const handleFileSelect = (file: MediaFile) => {
		setSelectedFile(file)
	}

	const footerButtons = (
		<>
			<button
				type="submit"
				className={modalStyles.primaryButton}
				disabled={!selectedSingerId || !selectedFile || isSaving}
				form="add-request-form"
			>
				{isSaving ? 'Adding...' : 'Add Request'}
			</button>
			<button
				type="button"
				className={modalStyles.secondaryButton}
				onClick={handleClose}
				disabled={isSaving}
			>
				Cancel
			</button>
		</>
	)

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Add Song Request"
			size="large"
			footer={footerButtons}
		>
			<form id="add-request-form" onSubmit={handleSubmit}>
				{/* Singer Selection */}
				<div className={modalStyles.formGroup}>
					<label htmlFor="singer-select" className={modalStyles.label}>
						Select Singer
					</label>
					<select
						id="singer-select"
						value={selectedSingerId}
						onChange={(e) => setSelectedSingerId(e.target.value)}
						className={modalStyles.select}
						disabled={isSaving || singers.length === 0}
					>
						<option value="">Choose a singer...</option>
						{singers
							.filter(singer => !singer.isPaused)
							.map(singer => (
								<option key={singer._id} value={singer._id}>
									{singer.name}
								</option>
							))
						}
					</select>
					{singers.length === 0 && (
						<div className={modalStyles.helpText}>
							No singers available. Add singers to the rotation first.
						</div>
					)}
				</div>

				{/* Song Search */}
				<div className={modalStyles.formGroup}>
					<label htmlFor="song-search" className={modalStyles.label}>
						Search Songs
					</label>
					<input
						id="song-search"
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className={modalStyles.input}
						placeholder="Search for songs..."
						disabled={isSaving}
					/>
					{!mediaPath && (
						<div className={modalStyles.helpText}>
							No media folder configured. Go to Tools → Settings to set up your media folder.
						</div>
					)}
				</div>

				{/* Song List */}
				{mediaPath && (
					<div className={modalStyles.formGroup}>
						<label className={modalStyles.label}>
							Available Songs ({filteredFiles.length})
						</label>
						<div className={styles.songList}>
							{loading ? (
								<div className={styles.loadingMessage}>Loading songs...</div>
							) : filteredFiles.length === 0 ? (
								<div className={styles.noSongsMessage}>
									{searchTerm ? 'No songs match your search' : 'No songs found'}
								</div>
							) : (
								filteredFiles.slice(0, 100).map((file, index) => (
									<div
										key={`${file.path}-${index}`}
										className={`${styles.songItem} ${selectedFile?.path === file.path ? styles.selectedSong : ''}`}
										onClick={() => handleFileSelect(file)}
									>
										<div className={styles.songName}>{file.name}</div>
										<div className={styles.songPath}>{file.relativePath}</div>
									</div>
								))
							)}
							{filteredFiles.length > 100 && (
								<div className={styles.limitMessage}>
									Showing first 100 results. Use search to narrow down.
								</div>
							)}
						</div>
					</div>
				)}

				{selectedFile && (
					<div className={styles.selectedFileInfo}>
						<strong>Selected:</strong> {selectedFile.name}
					</div>
				)}
			</form>
		</Modal>
	)
}
