import { useEffect, useMemo, useState } from 'react'
import PouchDB from 'pouchdb-browser'
import Modal, { modalStyles } from '../../../components/shared/Modal'
import styles from './MediaBrowserModal.module.css'
import PlayerMediator from '@/mediators/PlayerMediator'
import Database from '@/database'
import type { MediaFileMetadata, MediaMetadataDoc } from '@/types'

const db = new PouchDB('karaoke-db')

interface MediaBrowserModalProps {
	isOpen: boolean
	onClose: () => void
}

export default function MediaBrowserModal({ isOpen, onClose }: MediaBrowserModalProps) {
	const [mediaPath, setMediaPath] = useState('')
	const [mediaFiles, setMediaFiles] = useState<MediaFileMetadata[]>([])
	const [filteredFiles, setFilteredFiles] = useState<MediaFileMetadata[]>([])
	const [loading, setLoading] = useState(true)
	const [scanning, setScanning] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [sortBy, setSortBy] = useState('name') // name
	const [sortOrder, setSortOrder] = useState('asc') // asc, desc
	const [selectedExtensions, setSelectedExtensions] = useState<string[]>([])
	const [previewTick, setPreviewTick] = useState(0)

	const MAX_RESULTS = 100
	const METADATA_DOC_ID = 'media_metadata'

	const normalizedMediaPath = useMemo(() => (mediaPath || '').replace(/\/+$/g, '').replace(/\\+$/g, ''), [mediaPath])

	useEffect(() => {
		if (isOpen) {
			loadSettings()
		}
	}, [isOpen])

	useEffect(() => {
		if (!isOpen) return
		const interval = window.setInterval(() => setPreviewTick((t) => (t + 1) % 1000000), 1500)
		return () => window.clearInterval(interval)
	}, [isOpen])

	useEffect(() => {
		filterAndSortFiles()
	}, [mediaFiles, searchTerm, sortBy, sortOrder, selectedExtensions])

	const toSafeFileUrl = (absolutePath: string): string => {
		const encodedPath = encodeURI(absolutePath.replace(/\\/g, '/'))
		return 'safe-file://' + encodedPath
	}

	const getExtension = (fileName: string): string => {
		const name = (fileName || '').trim()
		const idx = name.lastIndexOf('.')
		if (idx === -1) return ''
		return name.slice(idx + 1).toLowerCase()
	}

	const resolveThumbPath = (thumbPath: string): string | null => {
		const raw = (thumbPath || '').trim()
		if (!raw) return null
		if (/^[a-zA-Z]:[\\/]/.test(raw) || raw.startsWith('\\\\')) {
			return raw
		}

		if (!normalizedMediaPath) return null
		const cleaned = raw.replace(/\//g, '\\').replace(/^\\+/, '')
		return `${normalizedMediaPath}\\${cleaned}`
	}

	const getPreviewUrls = (file: MediaFileMetadata): string[] => {
		const thumbs: Record<string, string> | undefined = file?.thumbnails
		if (!thumbs) return []
		const keys = ['0', '1', '2', '3']
		const urls = keys
			.map((k) => resolveThumbPath(thumbs[k]))
			.filter((p): p is string => !!p)
			.map(toSafeFileUrl)
		return urls
	}

	const getDisplayHeading = (file: MediaFileMetadata): string => {
		const artist = (file?.artist || '').trim()
		const songTitle = (file?.songTitle || '').trim()
		if (artist && songTitle) return `${artist} - ${songTitle}`
		if (songTitle) return songTitle
		return file.fileName || file.relativePath || file.filePath
	}

	const loadSettings = async () => {
		try {
			setLoading(true)
			const doc = await db.get('settings') as any
			const path = doc.mediaPath || ''
			setMediaPath(path)

			if (path) {
				await loadMetadata(path)
			}
		} catch (err: any) {
			if (err.status !== 404) {
				console.error('Failed to load settings:', err)
			}
		} finally {
			setLoading(false)
		}
	}

	const loadMetadata = async (folderPath: string) => {
		if (!folderPath) return

		setScanning(true)
		try {
			await Database.ensureDiskDatabase({ mediaPath: folderPath, requireConfigured: true })
			let md: MediaMetadataDoc | null = null
			try {
				md = (await Database.getDoc(METADATA_DOC_ID)) as MediaMetadataDoc
			} catch (e: any) {
				if (e?.status !== 404) {
					console.warn('Failed to load metadata doc:', e)
				}
				md = null
			}

			const files = Object.values(md?.files || {})
			setMediaFiles(files)

			const extensions = [...new Set(files.map((f) => getExtension(f.fileName)).filter(Boolean))].sort()
			setSelectedExtensions(extensions) // Show all by default
		} catch (err) {
			console.error('Failed to load metadata:', err)
			alert('Failed to load metadata: ' + (err as Error).message)
		} finally {
			setScanning(false)
		}
	}

	const filterAndSortFiles = () => {
		const term = (searchTerm || '').toLowerCase()
		let filtered = mediaFiles.filter(file => {
			const heading = getDisplayHeading(file).toLowerCase()
			const rel = (file.relativePath || '').toLowerCase()
			const name = (file.fileName || '').toLowerCase()
			const matchesSearch = !term || heading.includes(term) || rel.includes(term) || name.includes(term)
			const ext = getExtension(file.fileName)
			const matchesExtension = selectedExtensions.length === 0 ? true : selectedExtensions.includes(ext)
			return matchesSearch && matchesExtension
		})

		// Sort files
		filtered.sort((a, b) => {
			let comparison = 0

			switch (sortBy) {
				case 'name':
					comparison = getDisplayHeading(a).localeCompare(getDisplayHeading(b))
					break
				default:
					comparison = 0
			}

			return sortOrder === 'desc' ? -comparison : comparison
		})

		setFilteredFiles(filtered.slice(0, MAX_RESULTS))
	}

	const toggleExtension = (ext: string) => {
		setSelectedExtensions(prev =>
			prev.includes(ext) ? prev.filter(e => e !== ext) : [...prev, ext]
		)
	}

	const playVideo = (filePath: string) => {
		PlayerMediator.StartNewVideo(filePath)
	}

	const allExtensions = [...new Set(mediaFiles.map((f) => getExtension(f.fileName)).filter(Boolean))].sort()

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Media Browser"
			size="xlarge"
			fullHeight={true}
		>
			{loading ? (
				<div className={modalStyles.loadingContainer}>
					<p>Loading media browser...</p>
				</div>
			) : !mediaPath ? (
				<div className={styles.noMediaPath}>
					<p>No media folder configured.</p>
					<p className="hint">
						Go to <strong>Tools → Settings</strong> to configure your media files location.
					</p>
				</div>
			) : (
				<>
					{/* Media path and refresh section */}
					<div className={styles.mediaPathSection}>
						<p className={styles.mediaPathInfo}>
							<strong>Media folder:</strong> {mediaPath}
						</p>
						<button
							className={modalStyles.primaryBtn}
							onClick={() => loadMetadata(mediaPath)}
							disabled={scanning}
						>
							<i className="fas fa-sync-alt"></i>
							{scanning ? 'Loading...' : 'Refresh'}
						</button>
					</div>

					{/* Search and filters */}
					<div className={styles.searchFiltersSection}>
						<div className={styles.searchControls}>
							<input
								type="text"
								placeholder="Search files..."
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								className={styles.searchInput}
								autoComplete="off"
							/>

							<select
								value={sortBy}
								onChange={e => setSortBy(e.target.value)}
								className={styles.sortSelect}
							>
								<option value="name">Sort by Name</option>
							</select>

							<button
								onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
								className={styles.sortOrderBtn}
							>
								<i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
							</button>
						</div>

						{/* Extension filters */}
						{allExtensions.length > 0 && (
							<div className={styles.extensionFilters}>
								<p className={styles.filterLabel}>File Types:</p>
								<div className={styles.extensionCheckboxes}>
									{allExtensions.map(ext => (
										<label key={ext} className={styles.extensionCheckbox}>
											<input
												type="checkbox"
												checked={selectedExtensions.includes(ext)}
												onChange={() => toggleExtension(ext)}
											/>
											<span>{ext.toUpperCase()}</span>
										</label>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Results summary */}
					<div className={styles.resultsSummary}>
						<p>
							Showing {filteredFiles.length} of {mediaFiles.length} files
							{mediaFiles.length > MAX_RESULTS && filteredFiles.length >= MAX_RESULTS ? ` (limited to ${MAX_RESULTS})` : ''}
							{searchTerm && ` matching "${searchTerm}"`}
						</p>
					</div>

					{/* File list */}
					<div className={styles.fileListContainer}>
						{scanning ? (
							<div className={styles.scanningMessage}>
								<p>Loading metadata...</p>
							</div>
						) : filteredFiles.length === 0 ? (
							<div className={styles.noFilesMessage}>
								<p>
									{mediaFiles.length === 0
										? 'No media metadata found. Run Tools → Update Metadata to populate the library.'
										: 'No files match your search criteria.'}
								</p>
							</div>
						) : (
							<div className={styles.fileList}>
								{filteredFiles.map((file, index) => {
									const heading = getDisplayHeading(file)
									const previewUrls = getPreviewUrls(file)
									const previewUrl = previewUrls.length > 0 ? previewUrls[previewTick % previewUrls.length] : null
									const ext = getExtension(file.fileName)
									return (
										<div key={file.videoId} className={styles.fileItem}>
											<div className={styles.colDetails}>
												<div className={styles.fileHeading}>{heading}</div>
												<div className={styles.filePath}>{file.relativePath || file.filePath}</div>
												<div className={styles.fileDetails}>
													{ext ? ext.toUpperCase() : 'FILE'} • Updated: {new Date(file.updatedAt).toLocaleString()}
												</div>
											</div>

										<div className={styles.colPreview} aria-label="Preview">
											{previewUrl ? (
												<img
													className={styles.previewImage}
													src={previewUrl}
													alt={heading}
													loading={index < 8 ? 'eager' : 'lazy'}
												/>
											) : (
												<div className={styles.previewPlaceholder} />
											)}
										</div>

										<div className={styles.colPlay}>
											<button
												className={styles.playBtn}
												onClick={(e) => {
													e.stopPropagation()
													playVideo(file.filePath)
												}}
												title="Play video in main window"
											>
												<i className="fas fa-play"></i>
											</button>
										</div>
										</div>
									)
								})}
							</div>
						)}
					</div>
				</>
			)}
		</Modal>
	)
}
