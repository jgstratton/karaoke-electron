import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { RequestDoc } from '@/types'
import styles from './SongList.module.css';

export default function SongList() {
	const { currentParty } = useSelector((state: RootState) => state.party)

	// Get all requests from all singers in rotation order
	const getAllRequestsInRotationOrder = () => {
		if (!currentParty || !currentParty.singers) {
			return []
		}

		const allRequests: (RequestDoc & { singerName: string })[] = []

		// First, prepare sorted request arrays for each singer
		const singerRequestArrays = currentParty.singers.map(singer => ({
			name: singer.name,
			requests: singer.requests
				? [...singer.requests].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
				: []
		}))

		// Find the maximum number of requests any singer has
		const maxRequests = Math.max(...singerRequestArrays.map(s => s.requests.length), 0)

		// Round-robin through singers: take 1st request from each, then 2nd from each, etc.
		for (let requestIndex = 0; requestIndex < maxRequests; requestIndex++) {
			for (const singerData of singerRequestArrays) {
				if (requestIndex < singerData.requests.length) {
					allRequests.push({
						...singerData.requests[requestIndex],
						singerName: singerData.name
					})
				}
			}
		}

		return allRequests
	}

	const sortedRequests = getAllRequestsInRotationOrder()

	return (
		<>
			<div className={styles.queueHeader}>
				<span>#</span>
				<span>Singer</span>
				<span>Song</span>
				<span>Title</span>
				<span>Status</span>
				<span></span>
			</div>
			<div className={styles.queueList}>
				{sortedRequests.length === 0 ? (
					<div className={styles.emptyQueue}>
						<p>No songs in queue</p>
						<p>Use Party → Add Song Request to add songs</p>
					</div>
				) : (
					sortedRequests.map((request, index) => {
						const isCurrentSong = index === 0 && request.status === 'playing'
						const statusText = request.status === 'playing' ? 'Now Playing'
							: request.status === 'queued' ? 'Queued'
							: request.status === 'completed' ? 'Completed'
							: 'Skipped'

						return (
							<div
								key={request._id}
								className={`${styles.queueItem} ${isCurrentSong ? styles.currentSong : ''}`}
							>
								<span className={styles.queuePosition}>{index + 1}</span>
								<span className={styles.queueSinger}>{request.singerName}</span>
								<span></span>
								<span className={styles.songTitle}>{request.songTitle}</span>
								<span className={styles.songStatus}>{statusText}</span>
								<span className={styles.showOnHover}>⋯</span>
							</div>
						)
					})
				)}
			</div>
		</>
	)
}
