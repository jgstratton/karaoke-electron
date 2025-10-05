import { useSelector } from 'react-redux'
import { selectRotationOrder } from '../store/selectors/queueSelectors'
import styles from './SongList.module.css';

export default function SongList() {
	const sortedRequests = useSelector(selectRotationOrder)

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
