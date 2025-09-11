import styles from './SongList.module.css';

export default function SongList() {
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
				<div className={`${styles.queueItem} ${styles.currentSong}`}>
					<span className={styles.queuePosition}>1</span>
					<span className={styles.queueSinger}>John Smith</span>
					<span></span>
					<span className={styles.songTitle}>Sweet Caroline</span>
					<span className={styles.songStatus}>Now Playing</span>
					<span className={styles.showOnHover}>⋯</span>
				</div>
				<div className={styles.queueItem}>
					<span className={styles.queuePosition}>2</span>
					<span className={styles.queueSinger}>Alice Brown</span>
					<span></span>
					<span className={styles.songTitle}>Don't Stop Believin'</span>
					<span className={styles.songStatus}>Queued</span>
					<span className={styles.showOnHover}>⋯</span>
				</div>
				<div className={styles.queueItem}>
					<span className={styles.queuePosition}>3</span>
					<span className={styles.queueSinger}>Mike Johnson</span>
					<span></span>
					<span className={styles.songTitle}>Bohemian Rhapsody</span>
					<span className={styles.songStatus}>Queued</span>
					<span className={styles.showOnHover}>⋯</span>
				</div>
				<div className={styles.queueItem}>
					<span className={styles.queuePosition}>4</span>
					<span className={styles.queueSinger}>Sarah Davis</span>
					<span></span>
					<span className={styles.songTitle}>I Want It That Way</span>
					<span className={styles.songStatus}>Queued</span>
					<span className={styles.showOnHover}>⋯</span>
				</div>
			</div>
		</>
	)
}
