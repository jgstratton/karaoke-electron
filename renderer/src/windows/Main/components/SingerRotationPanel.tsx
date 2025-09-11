import styles from './SingerRotationPanel.module.css';

export default function SingerRotationPanel() {
	return (
		<>
			<div className={styles.singerHeader}>
				<span>#</span>
				<span>Singer Rotation</span>
				<span></span>
				<span></span>
			</div>
			<div className={styles.singerList}>
				<div className={`${styles.singerItem} ${styles.currentSinger}`}>
					<span className={styles.singerAvatar}>1</span>
					<span className={styles.singerName}>John Smith</span>
					<span></span>
					<span className={styles.showOnHover}>⋯</span>
				</div>
				<div className={styles.singerItem}>
					<span className={styles.singerAvatar}>2</span>
					<span className={styles.singerName}>Alice Brown</span>
					<span></span>
					<span className={styles.showOnHover}>⋯</span>
				</div>
				<div className={styles.singerItem}>
					<span className={styles.singerAvatar}>3</span>
					<span className={styles.singerName}>Mike Johnson</span>
					<span></span>
					<span className={styles.showOnHover}>⋯</span>
				</div>
				<div className={styles.singerItem}>
					<span className={styles.singerAvatar}>4</span>
					<span className={styles.singerName}>Sarah Davis</span>
					<span></span>
					<span className={styles.showOnHover}>⋯</span>
				</div>
			</div>
		</>
	)
}
