import { useEffect, useState } from 'react'
import PouchDB from 'pouchdb-browser'

const db = new PouchDB('karaoke-db')

interface MediaBrowserModalProps {
	isOpen: boolean
	onClose: () => void
}

export default function MediaBrowserModal({ isOpen, onClose }: MediaBrowserModalProps) {
	const [mediaPath, setMediaPath] = useState('')
	const [mediaFiles, setMediaFiles] = useState<any[]>([])
	const [filteredFiles, setFilteredFiles] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [scanning, setScanning] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [sortBy, setSortBy] = useState('name') // name, size, modified
	const [sortOrder, setSortOrder] = useState('asc') // asc, desc
	const [selectedExtensions, setSelectedExtensions] = useState<string[]>([])

	useEffect(() => {
		if (isOpen) {
			loadSettings()
		}
	}, [isOpen])

	useEffect(() => {
		filterAndSortFiles()
	}, [mediaFiles, searchTerm, sortBy, sortOrder, selectedExtensions])

	const loadSettings = async () => {
		try {
			setLoading(true)
			const doc = await db.get('settings') as any
			const path = doc.mediaPath || ''
			setMediaPath(path)

			if (path) {
				await scanFiles(path)
			}
		} catch (err: any) {
			if (err.status !== 404) {
				console.error('Failed to load settings:', err)
			}
		} finally {
			setLoading(false)
		}
	}

	const scanFiles = async (folderPath: string) => {
		if (!folderPath || !window.fileSystem) {
			return
		}

		setScanning(true)
		try {
			const files = await window.fileSystem.scanMediaFiles(folderPath)
			setMediaFiles(files)

			// Extract unique extensions for filter
			const extensions = [...new Set(files.map((f: any) => f.extension))].sort()
			setSelectedExtensions(extensions) // Show all by default
		} catch (err) {
			console.error('Failed to scan media files:', err)
			alert('Failed to scan media files: ' + (err as Error).message)
		} finally {
			setScanning(false)
		}
	}

	const filterAndSortFiles = () => {
		let filtered = mediaFiles.filter(file => {
			const matchesSearch =
				file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				file.relativePath.toLowerCase().includes(searchTerm.toLowerCase())
			const matchesExtension = selectedExtensions.includes(file.extension)
			return matchesSearch && matchesExtension
		})

		// Sort files
		filtered.sort((a, b) => {
			let comparison = 0

			switch (sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name)
					break
				case 'size':
					comparison = a.size - b.size
					break
				case 'modified':
					comparison = new Date(a.modified).getTime() - new Date(b.modified).getTime()
					break
				default:
					comparison = 0
			}

			return sortOrder === 'desc' ? -comparison : comparison
		})

		setFilteredFiles(filtered)
	}

	const formatFileSize = (bytes: number) => {
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		if (bytes === 0) return '0 Bytes'
		const i = Math.floor(Math.log(bytes) / Math.log(1024))
		return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
	}

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString()
	}

	const toggleExtension = (ext: string) => {
		setSelectedExtensions(prev =>
			prev.includes(ext) ? prev.filter(e => e !== ext) : [...prev, ext]
		)
	}

	const playVideo = (filePath: string) => {
		if (window.videoPlayer?.startNewVideo) {
			window.videoPlayer.startNewVideo(filePath)
		}
	}

	if (!isOpen) return null

	const allExtensions = [...new Set(mediaFiles.map((f: any) => f.extension))].sort()

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content media-browser-modal" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h2>Media Browser</h2>
					<button className="modal-close-btn" onClick={onClose}>
						×
					</button>
				</div>

				<div className="modal-body">
					{loading ? (
						<div className="loading-container">
							<p>Loading media browser...</p>
						</div>
					) : !mediaPath ? (
						<div className="no-media-path">
							<p>No media folder configured.</p>
							<p className="hint">
								Go to <strong>Tools → Settings</strong> to configure your media files location.
							</p>
						</div>
					) : (
						<>
							{/* Media path and refresh section */}
							<div className="media-path-section">
								<p className="media-path-info">
									<strong>Scanning:</strong> {mediaPath}
								</p>
								<button
									className="refresh-btn"
									onClick={() => scanFiles(mediaPath)}
									disabled={scanning}
								>
									<i className="fas fa-sync-alt"></i>
									{scanning ? 'Scanning...' : 'Refresh'}
								</button>
							</div>

							{/* Search and filters */}
							<div className="search-filters-section">
								<div className="search-controls">
									<input
										type="text"
										placeholder="Search files..."
										value={searchTerm}
										onChange={e => setSearchTerm(e.target.value)}
										className="search-input"
										autoComplete="off"
									/>

									<select
										value={sortBy}
										onChange={e => setSortBy(e.target.value)}
										className="sort-select"
									>
										<option value="name">Sort by Name</option>
										<option value="size">Sort by Size</option>
										<option value="modified">Sort by Date</option>
									</select>

									<button
										onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
										className="sort-order-btn"
									>
										<i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
									</button>
								</div>

								{/* Extension filters */}
								{allExtensions.length > 0 && (
									<div className="extension-filters">
										<p className="filter-label">File Types:</p>
										<div className="extension-checkboxes">
											{allExtensions.map(ext => (
												<label key={ext} className="extension-checkbox">
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
							<div className="results-summary">
								<p>
									Showing {filteredFiles.length} of {mediaFiles.length} files
									{searchTerm && ` matching "${searchTerm}"`}
								</p>
							</div>

							{/* File list */}
							<div className="file-list-container">
								{scanning ? (
									<div className="scanning-message">
										<p>Scanning for video files...</p>
									</div>
								) : filteredFiles.length === 0 ? (
									<div className="no-files-message">
										<p>
											{mediaFiles.length === 0
												? 'No video files found in the configured folder.'
												: 'No files match your search criteria.'}
										</p>
									</div>
								) : (
									<div className="file-list">
										{filteredFiles.map((file) => (
											<div key={file.path} className="file-item">
												<div className="file-info">
													<div className="file-name">{file.name}</div>
													<div className="file-path">{file.relativePath}</div>
													<div className="file-details">
														{formatFileSize(file.size)} • Modified: {formatDate(file.modified)}
													</div>
												</div>
												<div className="file-actions">
													<button
														className="play-btn"
														onClick={(e) => {
															e.stopPropagation()
															playVideo(file.path)
														}}
														title="Play video in main window"
													>
														<i className="fas fa-play"></i> Play
													</button>
													<div className="file-extension">
														{file.extension.toUpperCase()}
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	)
}
