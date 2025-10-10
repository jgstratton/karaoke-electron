import { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { SingerDoc } from '@/types'
import styles from './SingerRotationPanel.module.css';

interface SingerRotationPanelProps {
	onSingerClick?: (singer: SingerDoc) => void
	onReorder?: (reorderedSingers: SingerDoc[]) => void
}

export default function SingerRotationPanel({ onSingerClick, onReorder }: SingerRotationPanelProps) {
	const { currentParty } = useSelector((state: RootState) => state.party)
	const singers = currentParty?.singers || []

	const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
	const [dragAllowed, setDragAllowed] = useState<boolean>(false)

	// Create a song progress bar for a singer
	const renderSongProgressBar = (singer: SingerDoc) => {
		const requests = singer.requests || []
		if (requests.length === 0) {
			return (
				<div className={styles.songProgressBar}>
					<div className={styles.noSongsText}></div>
				</div>
			)
		}

		// Sort requests by sortOrder
		const sortedRequests = [...requests].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

		return (
			<div className={styles.songProgressBar}>
				{sortedRequests.map((request) => {
					let segmentClass = styles.songSegmentQueued
					if (request.status === 'completed' || request.status === 'skipped') {
						segmentClass = styles.songSegmentCompleted
					} else if (request.status === 'playing') {
						segmentClass = styles.songSegmentPlaying
					}

					return (
						<div
							key={request._id}
							className={`${styles.songSegment} ${segmentClass}`}
						/>
					)
				})}
			</div>
		)
	}

	const handleDragStart = (e: React.DragEvent, index: number) => {
		setDraggedIndex(index)
		e.dataTransfer.effectAllowed = 'move'
		e.dataTransfer.setData('text/plain', index.toString())

		// Add some visual feedback by setting drag image
		if (e.currentTarget instanceof HTMLElement) {
			const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
			dragImage.style.opacity = '0.8'
			document.body.appendChild(dragImage)
			e.dataTransfer.setDragImage(dragImage, 0, 0)
			setTimeout(() => document.body.removeChild(dragImage), 0)
		}
	}

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault()
		e.dataTransfer.dropEffect = 'move'

		// Only update drag over index if it's different to prevent flickering
		if (dragOverIndex !== index) {
			setDragOverIndex(index)
		}
	}

	const handleDragLeave = (e: React.DragEvent) => {
		// Only clear drag over if we're actually leaving the drop zone
		// Check if the related target is still within the singer list
		const relatedTarget = e.relatedTarget as Element
		const currentTarget = e.currentTarget as Element

		if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
			setDragOverIndex(null)
		}
	}

	const handleDrop = (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault()

		if (draggedIndex === null || draggedIndex === dropIndex) {
			setDraggedIndex(null)
			setDragOverIndex(null)
			return
		}

		const reorderedSingers = [...singers]
		const draggedSinger = reorderedSingers[draggedIndex]

		// Remove the dragged singer from its original position
		reorderedSingers.splice(draggedIndex, 1)

		// Insert it at the new position
		reorderedSingers.splice(dropIndex, 0, draggedSinger)

		// Call the reorder callback
		onReorder?.(reorderedSingers)

		setDraggedIndex(null)
		setDragOverIndex(null)
	}

	const handleDragEnd = () => {
		setDraggedIndex(null)
		setDragOverIndex(null)
		setDragAllowed(false)
	}
	return (
		<>
			<div className={styles.singerHeader}>
				<span>#</span>
				<span>Singer Rotation</span>
				<span>Songs</span>
				<span></span>
			</div>
			<div
				className={styles.singerList}
				onDragOver={(e) => e.preventDefault()}
				onDrop={(e) => {
					e.preventDefault()
					// Clear drag over state when dropping outside of singer items
					setDragOverIndex(null)
				}}
			>
				{singers.length === 0 && (
					<div className={styles.emptySingers}>
						<p>No singers in rotation</p>
						<p>Use Party → Add Singer to add singers</p>
					</div>
				)}
				{singers.map((singer, index) => {
					const isPaused = singer.isPaused || false
					const isDragging = draggedIndex === index
					const isDragOver = dragOverIndex === index
					
					// Check if singer has playing requests
					const hasPlayingRequest = singer.requests?.some(request => request.status === 'playing') || false
					// Check if singer has queued requests
					const hasQueuedRequests = singer.requests?.some(request => request.status === 'queued') || false

					const singerClasses = `${styles.singerItem} ${hasPlayingRequest ? styles.currentSinger : ''} ${hasQueuedRequests && !hasPlayingRequest ? styles.singerWithQueued : ''} ${isPaused ? styles.pausedSinger : ''} ${isDragging ? styles.dragging : ''} ${isDragOver ? styles.dragOver : ''}`

					return (
						<div
							key={singer._id}
							className={singerClasses}
							draggable={singers.length > 1 && dragAllowed}
							onDragStart={(e) => handleDragStart(e, index)}
							onDragOver={(e) => handleDragOver(e, index)}
							onDragLeave={(e) => handleDragLeave(e)}
							onDrop={(e) => handleDrop(e, index)}
							onDragEnd={handleDragEnd}
							onClick={() => onSingerClick?.(singer)}
							title={isPaused ? 'Singer is paused - click to edit' : 'Click to edit singer'}
						>
							<span className={styles.singerAvatar}>{index + 1}</span>
							<span className={styles.singerName}>
								{singer.name}
								{isPaused && <i className="fas fa-pause-circle" style={{ marginLeft: '8px', fontSize: '0.8rem' }}></i>}
							</span>
							<span className={styles.progressBarContainer}>
								{renderSongProgressBar(singer)}
							</span>
							<span
								className={`${styles.showOnHover} ${singers.length > 1 ? styles.dragHandle : ''}`}
								onMouseDown={() => setDragAllowed(true)}
								onMouseUp={() => setDragAllowed(false)}
								onMouseLeave={() => setDragAllowed(false)}
								onClick={singers.length > 1 ? (e) => e.stopPropagation() : undefined}
								title={singers.length > 1 ? 'Drag to reorder singer' : undefined}
							>
								{singers.length > 1 ? '⋮⋮' : '⋯'}
							</span>
						</div>
					)
				})}
			</div>
		</>
	)
}
