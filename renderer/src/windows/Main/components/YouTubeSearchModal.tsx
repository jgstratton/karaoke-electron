import { useEffect, useMemo, useState } from 'react'
import Modal, { modalStyles } from '../../../components/shared/Modal'
import styles from './YouTubeSearchModal.module.css'

type YouTubeSearchResult = import('../../../../../electron/preload-types').YouTubeSearchResult

interface YouTubeSearchModalProps {
	isOpen: boolean
	onClose: () => void
}

export default function YouTubeSearchModal({ isOpen, onClose }: YouTubeSearchModalProps) {
	const [query, setQuery] = useState('')
	const [isSearching, setIsSearching] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [results, setResults] = useState<YouTubeSearchResult[]>([])

	useEffect(() => {
		if (!isOpen) return
		setError(null)
	}, [isOpen])

	const canSearch = useMemo(() => query.trim().length > 0 && !isSearching, [query, isSearching])

	const runSearch = async () => {
		const trimmed = query.trim()
		if (!trimmed) return

		setIsSearching(true)
		setError(null)
		try {
			const isInstalled = await window.youtube.checkInstalled()
			if (!isInstalled) {
				setError('yt-dlp is not installed. Use Tools -> Install yt-dlp first.')
				setResults([])
				return
			}

			const data = await window.youtube.search(trimmed)
			setResults(data)
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
			title="YouTube Karaoke Search"
			size="large"
			fullHeight
		>
			<div className={styles.container} onKeyDown={onKeyDown}>
				<div className={styles.searchRow}>
					<input
						className={styles.searchInput}
						placeholder='Search YouTube ("karaoke" is added automatically)'
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

				<div className={styles.hint}>
					Each search includes the keyword <strong>karaoke</strong>.
				</div>

				{error && <div className={styles.error}>{error}</div>}

				{isSearching && results.length === 0 ? (
					<div className={modalStyles.loadingContainer}>Searching YouTube…</div>
				) : (
					<div className={styles.results}>
						{results.map((r) => (
							<div key={r.id} className={styles.resultItem}>
								{r.thumbnail ? (
									<img className={styles.thumb} src={r.thumbnail} alt={r.title} />
								) : (
									<div className={styles.thumb} />
								)}
								<div>
									<div className={styles.title}>{r.title}</div>
									<div className={styles.meta}>
										{r.channel || r.uploader || 'Unknown channel'}
										{typeof r.duration === 'number' ? ` • ${Math.round(r.duration / 60)}m` : ''}
									</div>
									{r.url ? (
										<div className={styles.meta}>{r.url}</div>
									) : null}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</Modal>
	)
}
