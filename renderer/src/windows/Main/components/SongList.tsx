import { useSelector } from 'react-redux'
import { selectRotationOrder } from '../store/selectors/queueSelectors'
import styles from './SongList.module.css';

// Utility function to extract filename from path
const getFilename = (path: string): string => {
	return path.split(/[\\/]/).pop() || path
}

export default function SongList() {
	const sortedRequests = useSelector(selectRotationOrder)

	return (
		<>
			<div className={styles.queueHeader}>
				<span>#</span>
				<span>Singer</span>
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
						const isCurrentSong = request.status === 'playing'
						const isCompleted = request.status === 'completed'
						const statusText = request.status === 'playing' ? 'Now Playing'
							: request.status === 'queued' ? 'Queued'
							: request.status === 'completed' ? 'Completed'
							: 'Skipped'

						// Extract filename - use songTitle if it's already a filename, otherwise extract from mediaFilePath
						const displayTitle = request.songTitle.includes('/') || request.songTitle.includes('\\')
							? getFilename(request.songTitle)
							: request.songTitle || getFilename(request.mediaFilePath)

						return (
							<div
								key={request._id}
								className={`${styles.queueItem} ${isCurrentSong ? styles.currentSong : ''} ${isCompleted ? styles.completedSong : ''}`}
							>
								<span className={styles.queuePosition}>{index + 1}</span>
								<span className={styles.queueSinger}>{request.singerName}</span>
								<span className={styles.songTitle}>{displayTitle}</span>
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
