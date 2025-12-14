import { useEffect, useMemo, useState } from 'react'
import Modal, { modalStyles } from '../../../components/shared/Modal'
import styles from './YouTubeSearchModal.module.css'
import Database from '@/database'
import type { MediaFileMetadata, MediaMetadataDoc } from '@/types'
import PlayerMediator from '@/mediators/PlayerMediator'

type YouTubeSearchResult = import('../../../../../electron/preload-types').YouTubeSearchResult

type CombinedResult = {
	videoId: string
	local?: MediaFileMetadata
	online?: YouTubeSearchResult
}

interface YouTubeSearchModalProps {
	isOpen: boolean
	onClose: () => void
}

export default function YouTubeSearchModal({ isOpen, onClose }: YouTubeSearchModalProps) {
	const [query, setQuery] = useState('')
	const [isSearching, setIsSearching] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [results, setResults] = useState<CombinedResult[]>([])
	const [searchLocal, setSearchLocal] = useState(true)
	const [searchOnline, setSearchOnline] = useState(true)
	const [mediaPath, setMediaPath] = useState('')
	const [metadataFilesByVideoId, setMetadataFilesByVideoId] = useState<Record<string, MediaFileMetadata>>({})
	const [previewTick, setPreviewTick] = useState(0)

	const METADATA_DOC_ID = 'media_metadata'
	const MAX_RESULTS = 100

	const normalizedMediaPath = useMemo(() => (mediaPath || '').replace(/\/+$/g, '').replace(/\\+$/g, ''), [mediaPath])

	useEffect(() => {
		if (!isOpen) return
		setError(null)
		setResults([])
	}, [isOpen])

	useEffect(() => {
		if (!isOpen) return
		const interval = window.setInterval(() => setPreviewTick((t) => (t + 1) % 1000000), 1500)
		return () => window.clearInterval(interval)
	}, [isOpen])

	useEffect(() => {
		if (!isOpen) return
		// Best-effort preload of local metadata for faster searching.
		loadLocalMetadata().catch(() => {
			// ignore
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen])

	const canSearch = useMemo(() => query.trim().length > 0 && !isSearching && (searchLocal || searchOnline), [query, isSearching, searchLocal, searchOnline])

	const toSafeFileUrl = (absolutePath: string): string => {
		const encodedPath = encodeURI(absolutePath.replace(/\\/g, '/'))
		return 'safe-file://' + encodedPath
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

	const getLocalPreviewUrls = (local: MediaFileMetadata | undefined): string[] => {
		const thumbs: Record<string, string> | undefined = local?.thumbnails
		if (!thumbs) return []
		const keys = ['0', '1', '2', '3']
		return keys
			.map((k) => resolveThumbPath(thumbs[k]))
			.filter((p): p is string => !!p)
			.map(toSafeFileUrl)
	}

	const getAvailabilityLabel = (r: CombinedResult): 'Local' | 'Online' | 'Both' => {
		if (r.local && r.online) return 'Both'
		if (r.local) return 'Local'
		return 'Online'
	}

	const getHeading = (r: CombinedResult): string => {
		const artist = (r.local?.artist || '').trim()
		const songTitle = (r.local?.songTitle || '').trim()
		if (artist && songTitle) return `${artist} - ${songTitle}`
		if (songTitle) return songTitle
		if (r.online?.title) return r.online.title
		return r.videoId
	}

	const loadLocalMetadata = async (): Promise<Record<string, MediaFileMetadata>> => {
		const settings = await Database.getSettingsDoc()
		const path = (settings?.mediaPath || '').trim()
		setMediaPath(path)
		if (!path) {
			setMetadataFilesByVideoId({})
			return {}
		}

		await Database.ensureDiskDatabase({ mediaPath: path, requireConfigured: true })
		try {
			const md = (await Database.getDoc(METADATA_DOC_ID)) as MediaMetadataDoc
			const map = (md?.files || {}) as Record<string, MediaFileMetadata>
			setMetadataFilesByVideoId(map)
			return map
		} catch (e: any) {
			if (e?.status !== 404) {
				console.warn('Failed to load metadata doc:', e)
			}
			setMetadataFilesByVideoId({})
			return {}
		}
	}

	const runSearch = async () => {
		const trimmed = query.trim()
		if (!trimmed) return
		if (!searchLocal && !searchOnline) return

		setIsSearching(true)
		setError(null)
		try {
			const map = new Map<string, CombinedResult>()

			let localMap: Record<string, MediaFileMetadata> = metadataFilesByVideoId
			if (searchLocal) {
				if (!localMap || Object.keys(localMap).length === 0) {
					localMap = await loadLocalMetadata()
				}

				const term = trimmed.toLowerCase()
				for (const [videoId, meta] of Object.entries(localMap || {})) {
					const hay = [
						videoId,
						meta.artist,
						meta.songTitle,
						meta.fileName,
						meta.relativePath,
						meta.filePath,
					]
						.filter(Boolean)
						.join(' ')
						.toLowerCase()
					if (!hay.includes(term)) continue

					map.set(videoId, { videoId, local: meta })
					if (map.size >= MAX_RESULTS) break
				}
			}

			if (searchOnline) {
				const isInstalled = await window.youtube.checkInstalled()
				if (!isInstalled) {
					setError('yt-dlp is not installed. Use Tools -> Install yt-dlp first (online search disabled).')
				} else {
					const online = await window.youtube.search(trimmed)
					for (const r of online) {
						if (!r?.id) continue
						const existing = map.get(r.id)
						if (existing) {
							existing.online = r
							map.set(r.id, existing)
						} else {
							map.set(r.id, { videoId: r.id, online: r })
						}
						if (map.size >= MAX_RESULTS) break
					}
				}
			}

			const merged = Array.from(map.values())
			merged.sort((a, b) => getHeading(a).localeCompare(getHeading(b)))
			setResults(merged.slice(0, MAX_RESULTS))
		} catch (e: any) {
			setError(e?.message || 'Search failed')
			setResults([])
		} finally {
			setIsSearching(false)
		}
	}

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			if (canSearch) runSearch()
		}
		if (e.key === 'Escape') {
			onClose()
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Media Search"
			size="large"
			fullHeight
		>
			<div className={styles.container} onKeyDown={onKeyDown}>
				<div className={styles.searchRow}>
					<input
						className={styles.searchInput}
						placeholder='Search media (local library and/or YouTube)'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						disabled={isSearching}
						autoFocus
					/>
					<button
						className={styles.searchButton}
						onClick={runSearch}
						disabled={!canSearch}
					>
						{isSearching ? 'Searching...' : 'Search'}
					</button>
				</div>

				<div className={styles.sourceRow}>
					<label className={styles.sourceOption}>
						<input
							type="checkbox"
							checked={searchLocal}
							onChange={(e) => setSearchLocal(e.target.checked)}
							disabled={isSearching}
						/>
						<span>Local</span>
					</label>
					<label className={styles.sourceOption}>
						<input
							type="checkbox"
							checked={searchOnline}
							onChange={(e) => setSearchOnline(e.target.checked)}
							disabled={isSearching}
						/>
						<span>Online</span>
					</label>
				</div>

				<div className={styles.hint}>
					Online searches include the keyword <strong>karaoke</strong>.
				</div>

				{error && <div className={styles.error}>{error}</div>}

				{isSearching && results.length === 0 ? (
					<div className={modalStyles.loadingContainer}>Searching…</div>
				) : (
					<div className={styles.results}>
						{results.map((r, index) => {
							const heading = getHeading(r)
							const label = getAvailabilityLabel(r)
							const localPreview = getLocalPreviewUrls(r.local)
							const previewUrl = localPreview.length > 0
								? localPreview[previewTick % localPreview.length]
								: (r.online?.thumbnail || null)

							return (
								<div key={r.videoId} className={styles.resultItem}>
									<div className={styles.colDetails}>
										<div className={styles.titleRow}>
											<div className={styles.title}>{heading}</div>
											<span className={styles.badge} data-kind={label}>{label}</span>
										</div>

										{r.local ? (
											<div className={styles.meta}>{r.local.relativePath || r.local.filePath}</div>
										) : null}

										{r.online ? (
											<div className={styles.meta}>
												{r.online.channel || r.online.uploader || 'Unknown channel'}
												{typeof r.online.duration === 'number' ? ` • ${Math.round(r.online.duration / 60)}m` : ''}
												{r.online.url ? ` • ${r.online.url}` : ''}
											</div>
										) : null}

										{!r.local && !r.online ? (
											<div className={styles.meta}>{r.videoId}</div>
										) : null}
									</div>

									<div className={styles.colPreview} aria-label="Preview">
										{previewUrl ? (
											<img
												className={styles.thumb}
												src={previewUrl}
												alt={heading}
												loading={index < 8 ? 'eager' : 'lazy'}
											/>
										) : (
											<div className={styles.thumb} />
										)}
									</div>

									<div className={styles.colPlay}>
										<button
											className={styles.playBtn}
											disabled={!r.local}
											onClick={(e) => {
											e.stopPropagation()
												if (!r.local) return
												PlayerMediator.StartNewVideo(r.local.filePath)
											}}
											title={r.local ? 'Play local file' : 'Not available locally'}
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
		</Modal>
	)
}
