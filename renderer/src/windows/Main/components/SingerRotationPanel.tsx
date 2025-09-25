import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { SingerDoc } from '@/types'
import styles from './SingerRotationPanel.module.css';

interface SingerRotationPanelProps {
	onSingerClick?: (singer: SingerDoc) => void
}

export default function SingerRotationPanel({ onSingerClick }: SingerRotationPanelProps) {
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
				{singers.map((singer, index) => {
					const isPaused = singer.isPaused || false
					const isCurrent = index === 0
					const singerClasses = `${styles.singerItem} ${isCurrent ? styles.currentSinger : ''} ${isPaused ? styles.pausedSinger : ''}`

					return (
						<div
							key={singer._id}
							className={singerClasses}
							onClick={() => onSingerClick?.(singer)}
							title={isPaused ? 'Singer is paused - click to edit' : 'Click to edit singer'}
						>
							<span className={styles.singerAvatar}>{index + 1}</span>
							<span className={styles.singerName}>
								{singer.name}
								{isPaused && <i className="fas fa-pause-circle" style={{ marginLeft: '8px', fontSize: '0.8rem' }}></i>}
							</span>
							<span></span>
							<span className={styles.showOnHover}>⋯</span>
						</div>
					)
				})}
			</div>
		</>
	)
}
