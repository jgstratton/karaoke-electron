import React, { useEffect, useState } from 'react'
import PouchDB from 'pouchdb-browser'

const db = new PouchDB('karaoke-db')

export default function MediaBrowser() {
	const [mediaPath, setMediaPath] = useState('')
	const [mediaFiles, setMediaFiles] = useState([])
	const [filteredFiles, setFilteredFiles] = useState([])
	const [loading, setLoading] = useState(true)
	const [scanning, setScanning] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [sortBy, setSortBy] = useState('name') // name, size, modified
	const [sortOrder, setSortOrder] = useState('asc') // asc, desc
	const [selectedExtensions, setSelectedExtensions] = useState([])

	useEffect(() => {
		loadSettings()
	}, [])

	useEffect(() => {
		filterAndSortFiles()
	}, [mediaFiles, searchTerm, sortBy, sortOrder, selectedExtensions])

	const loadSettings = async () => {
		try {
			const doc = await db.get('settings')
			const path = doc.mediaPath || ''
			setMediaPath(path)

			if (path) {
				await scanFiles(path)
			}
		} catch (err) {
			if (err.status !== 404) {
				console.error('Failed to load settings:', err)
			}
		} finally {
			setLoading(false)
		}
	}

	const scanFiles = async folderPath => {
		if (!folderPath || !window.fileSystem) {
			return
		}

		setScanning(true)
		try {
			const files = await window.fileSystem.scanMediaFiles(folderPath)
			setMediaFiles(files)

			// Extract unique extensions for filter
			const extensions = [...new Set(files.map(f => f.extension))].sort()
			setSelectedExtensions(extensions) // Show all by default
		} catch (err) {
			console.error('Failed to scan media files:', err)
			alert('Failed to scan media files: ' + err.message)
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
					comparison = new Date(a.modified) - new Date(b.modified)
					break
				default:
					comparison = 0
			}

			return sortOrder === 'desc' ? -comparison : comparison
		})

		setFilteredFiles(filtered)
	}

	const formatFileSize = bytes => {
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		if (bytes === 0) return '0 Bytes'
		const i = Math.floor(Math.log(bytes) / Math.log(1024))
		return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
	}

	const formatDate = date => {
		return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString()
	}

	const toggleExtension = ext => {
		setSelectedExtensions(prev =>
			prev.includes(ext) ? prev.filter(e => e !== ext) : [...prev, ext]
		)
	}

	const toggleSort = field => {
		if (sortBy === field) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
		} else {
			setSortBy(field)
			setSortOrder('asc')
		}
	}

	const playVideo = filePath => window.videoPlayer.startNewVideo(filePath);

	if (loading) {
		return (
			<div className="container">
				<div className="card">
					<p>Loading media browser...</p>
				</div>
			</div>
		)
	}

	if (!mediaPath) {
		return (
			<div className="container">
				<div className="card">
					<h1 style={{ marginTop: 0 }}>Media Browser</h1>
					<p>No media folder configured.</p>
					<p className="hint">
						Go to <strong>File → Settings</strong> to configure your media files
						location.
					</p>
				</div>
			</div>
		)
	}

	const allExtensions = [...new Set(mediaFiles.map(f => f.extension))].sort()

	return (
		<div className="container">
			<div className="card">
				<h1 style={{ marginTop: 0 }}>Media Browser</h1>

				<div style={{ marginBottom: 16 }}>
					<p className="hint" style={{ margin: '0 0 8px 0' }}>
						<strong>Scanning:</strong> {mediaPath}
					</p>
					<button
						onClick={() => scanFiles(mediaPath)}
						disabled={scanning}
						style={{ marginBottom: 12 }}
					>
						{scanning ? 'Scanning...' : 'Refresh'}
					</button>
				</div>

				{/* Search and Filters */}
				<div
					style={{
						display: 'flex',
						gap: 12,
						marginBottom: 16,
						alignItems: 'center',
						flexWrap: 'wrap',
					}}
				>
					<input
						type="text"
						placeholder="Search files..."
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
						style={{
							fontSize: '0.9em',
							flex: '1',
							minWidth: '200px',
						}}
						autoComplete="off"
					/>

					<select
						value={sortBy}
						onChange={e => setSortBy(e.target.value)}
						style={{ fontSize: '0.9em' }}
					>
						<option value="name">Sort by Name</option>
						<option value="size">Sort by Size</option>
						<option value="modified">Sort by Date</option>
					</select>

					<button
						onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
						style={{ fontSize: '0.9em', minWidth: 60 }}
					>
						{sortOrder === 'asc' ? '↑' : '↓'}
					</button>
				</div>

				{/* Extension filters */}
				{allExtensions.length > 0 && (
					<div style={{ marginBottom: 16 }}>
						<p style={{ margin: '0 0 8px 0', fontSize: '0.9em', fontWeight: 'bold' }}>
							File Types:
						</p>
						<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
							{allExtensions.map(ext => (
								<label
									key={ext}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 4,
										fontSize: '0.85em',
										cursor: 'pointer',
									}}
								>
									<input
										type="checkbox"
										checked={selectedExtensions.includes(ext)}
										onChange={() => toggleExtension(ext)}
									/>
									{ext.toUpperCase()}
								</label>
							))}
						</div>
					</div>
				)}

				{/* Results summary */}
				<div style={{ marginBottom: 16 }}>
					<p className="hint" style={{ margin: 0, fontSize: '0.9em' }}>
						Showing {filteredFiles.length} of {mediaFiles.length} files
						{searchTerm && ` matching "${searchTerm}"`}
					</p>
				</div>

				{/* File list */}
				{scanning ? (
					<div style={{ textAlign: 'center', padding: 40 }}>
						<p>Scanning for video files...</p>
					</div>
				) : filteredFiles.length === 0 ? (
					<div style={{ textAlign: 'center', padding: 40 }}>
						<p className="hint">
							{mediaFiles.length === 0
								? 'No video files found in the configured folder.'
								: 'No files match your search criteria.'}
						</p>
					</div>
				) : (
					<div style={{ maxHeight: 400, overflowY: 'auto' }}>
						{filteredFiles.map((file, index) => (
							<div
								key={file.path}
								style={{
									background: '#1a1f2e',
									border: '1px solid #2a2f3a',
									borderRadius: 8,
									padding: 12,
									marginBottom: 8,
								}}
							>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'flex-start',
									}}
								>
									<div
										style={{ flex: 1, minWidth: 0 }}
									>
										<div style={{ fontWeight: 'bold', marginBottom: 4 }}>
											{file.name}
										</div>
										<div
											className="hint"
											style={{ fontSize: '0.8em', marginBottom: 4 }}
										>
											{file.relativePath}
										</div>
										<div className="hint" style={{ fontSize: '0.75em' }}>
											{formatFileSize(file.size)} • Modified:{' '}
											{formatDate(file.modified)}
										</div>
									</div>

									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: 8,
											marginLeft: 8,
										}}
									>
										<button
											onClick={e => {
												e.stopPropagation()
												playVideo(file.path)
											}}
											style={{
												background: '#28a745',
												color: 'white',
												border: 'none',
												borderRadius: 6,
												padding: '6px 12px',
												fontSize: '0.8em',
												cursor: 'pointer',
												display: 'flex',
												alignItems: 'center',
												gap: 4,
											}}
											title="Play video in main window"
										>
											▶️ Play
										</button>

										<div
											style={{
												fontSize: '0.75em',
												background: '#006adc',
												color: 'white',
												padding: '2px 6px',
												borderRadius: 4,
											}}
										>
											{file.extension.toUpperCase()}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
