import { useSelector } from 'react-redux'
import { RootState } from '../store'
import styles from './SingerRotationPanel.module.css';

export default function SingerRotationPanel() {
	const { currentParty } = useSelector((state: RootState) => state.party)
	const singers = currentParty?.singers || []
	return (
		<>
			<div className={styles.singerHeader}>
				<span>#</span>
				<span>Singer Rotation</span>
				<span></span>
				<span></span>
			</div>
			<div className={styles.singerList}>
				{singers.length === 0 && (
					<div className={styles.emptySingers}>
						<p>No singers in rotation</p>
						<p>Use Party → Add Singer to add singers</p>
					</div>
				)}
				{singers.map((singer, index) => (
					<div
						key={singer._id}
						className={`${styles.singerItem} ${index === 0 ? styles.currentSinger : ''}`}
					>
						<span className={styles.singerAvatar}>{index + 1}</span>
						<span className={styles.singerName}>{singer.name}</span>
						<span></span>
						<span className={styles.showOnHover}>⋯</span>
					</div>
				))}
			</div>
		</>
	)
}
