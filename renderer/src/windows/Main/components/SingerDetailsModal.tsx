import React, { useState, useEffect } from 'react'
import Modal, { modalStyles } from '../../../components/shared/Modal'
import { SingerDoc, RequestDoc } from '@/types'

interface SingerDetailsModalProps {
	isOpen: boolean
	onClose: () => void
	singer: SingerDoc | null
	allSingers: SingerDoc[]
	onSave: (singerId: string, updatedData: { name?: string; isPaused?: boolean }) => Promise<void>
	onDelete: (singerId: string) => Promise<void>
	onDeleteRequest?: (singerId: string, requestId: string) => Promise<void>
}

export default function SingerDetailsModal({ isOpen, onClose, singer, allSingers, onSave, onDelete, onDeleteRequest }: SingerDetailsModalProps) {
	const [singerName, setSingerName] = useState('')
	const [isPaused, setIsPaused] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [nameError, setNameError] = useState('')

	useEffect(() => {
		if (singer && isOpen) {
			setSingerName(singer.name)
			setIsPaused(singer.isPaused || false)
			setNameError('')
		}
	}, [singer, isOpen])

	const validateName = (name: string): string => {
		const trimmedName = name.trim()
		if (!trimmedName) {
			return 'Singer name is required'
		}
		if (trimmedName.length > 50) {
			return 'Singer name must be 50 characters or less'
		}
		// Check for duplicates (excluding the current singer)
		const isDuplicate = allSingers.some(s =>
			s._id !== singer?._id &&
			s.name.toLowerCase() === trimmedName.toLowerCase()
		)
		if (isDuplicate) {
			return 'A singer with this name already exists'
		}
		return ''
	}

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newName = e.target.value
		setSingerName(newName)
		setNameError(validateName(newName))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!singer) return

		const validation = validateName(singerName)
		if (validation) {
			setNameError(validation)
			return
		}

		setIsSaving(true)
		try {
			await onSave(singer._id, {
				name: singerName.trim(),
				isPaused
			})
			onClose()
		} catch (err) {
			console.error('Failed to update singer:', err)
			alert('Failed to update singer. Please try again.')
		} finally {
			setIsSaving(false)
		}
	}

	const handleDelete = async () => {
		if (!singer) return

		const confirmed = confirm(`Are you sure you want to remove "${singer.name}" from the rotation?`)
		if (!confirmed) return

		setIsDeleting(true)
		try {
			await onDelete(singer._id)
			onClose()
		} catch (err) {
			console.error('Failed to delete singer:', err)
			alert('Failed to delete singer. Please try again.')
		} finally {
			setIsDeleting(false)
		}
	}

	const handleDeleteRequest = async (requestId: string, songTitle: string) => {
		if (!singer || !onDeleteRequest) return

		const confirmed = confirm(`Are you sure you want to remove "${songTitle}" from ${singer.name}'s queue?`)
		if (!confirmed) return

		try {
			await onDeleteRequest(singer._id, requestId)
		} catch (err) {
			console.error('Failed to delete request:', err)
			alert('Failed to delete song request. Please try again.')
		}
	}

	const handleClose = () => {
		if (!isSaving && !isDeleting) {
			setSingerName(singer?.name || '')
			setIsPaused(singer?.isPaused || false)
			setNameError('')
			onClose()
		}
	}

	if (!singer) return null

	const footerButtons = (
		<>
			<button
				type="button"
				className={`${modalStyles.deleteButton}`}
				onClick={handleDelete}
				disabled={isSaving || isDeleting}
			>
				{isDeleting ? 'Deleting...' : 'Delete Singer'}
			</button>
			<div style={{ flex: 1 }}></div>
			<button
				type="submit"
				className={modalStyles.primaryButton}
				disabled={!singerName.trim() || !!nameError || isSaving || isDeleting}
				form="singer-details-form"
			>
				{isSaving ? 'Saving...' : 'Save Changes'}
			</button>
			<button
				type="button"
				className={modalStyles.secondaryButton}
				onClick={handleClose}
				disabled={isSaving || isDeleting}
			>
				Cancel
			</button>
		</>
	)

	const addedDate = new Date(singer.addedDate).toLocaleDateString()

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Singer Details"
			size="large"
			footer={footerButtons}
		>
			<form id="singer-details-form" onSubmit={handleSubmit}>
				<div className={modalStyles.formGroup}>
					<label htmlFor="singer-name" className={modalStyles.label}>
						Singer Name
					</label>
					<input
						id="singer-name"
						type="text"
						value={singerName}
						onChange={handleNameChange}
						className={`${modalStyles.input} ${nameError ? modalStyles.inputError : ''}`}
						placeholder="Enter singer name"
						autoFocus
						disabled={isSaving || isDeleting}
						maxLength={50}
					/>
					{nameError && <span className={modalStyles.errorText}>{nameError}</span>}
				</div>

				<div className={modalStyles.formGroup}>
					<label className={modalStyles.checkboxLabel}>
						<input
							type="checkbox"
							checked={isPaused}
							onChange={(e) => setIsPaused(e.target.checked)}
							disabled={isSaving || isDeleting}
							className={modalStyles.checkbox}
						/>
						<span className={modalStyles.checkboxText}>
							Pause singer (they will be skipped in rotation)
						</span>
					</label>
				</div>

				<div className={modalStyles.infoSection}>
					<p className={modalStyles.helpText}>
						<strong>Added:</strong> {addedDate}
					</p>
					{isPaused && (
						<p className={modalStyles.warningText}>
							<i className="fas fa-pause-circle"></i> This singer is currently paused and will be skipped in the rotation.
						</p>
					)}
				</div>
			</form>

			{/* Singer's Requests Section */}
			<div className={modalStyles.section}>
				<h3 className={modalStyles.sectionTitle}>Song Requests</h3>
				{singer.requests && singer.requests.length > 0 ? (
					<div className={modalStyles.requestsList}>
						{[...singer.requests]
							.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
							.map((request, index) => {
								const getFilename = (path: string): string => {
									return path.split(/[\\/]/).pop() || path
								}

								const displayTitle = request.songTitle.includes('/') || request.songTitle.includes('\\')
									? getFilename(request.songTitle)
									: request.songTitle || getFilename(request.mediaFilePath)

								const statusText = request.status === 'playing' ? 'Now Playing'
									: request.status === 'queued' ? 'Queued'
									: request.status === 'completed' ? 'Completed'
									: 'Skipped'

								const statusClass = request.status === 'playing' ? modalStyles.statusPlaying
									: request.status === 'queued' ? modalStyles.statusQueued
									: request.status === 'completed' ? modalStyles.statusCompleted
									: modalStyles.statusSkipped

								return (
									<div key={request._id} className={modalStyles.requestItem}>
										<div className={modalStyles.requestNumber}>{index + 1}</div>
										<div className={modalStyles.requestTitle}>{displayTitle}</div>
										<div className={`${modalStyles.requestStatus} ${statusClass}`}>
											{statusText}
										</div>
										<div className={modalStyles.requestActions}>
											{request.status === 'queued' && onDeleteRequest && (
												<button
													type="button"
													className={modalStyles.deleteRequestBtn}
													onClick={() => handleDeleteRequest(request._id, displayTitle)}
													title="Remove this song from queue"
												>
													×
												</button>
											)}
										</div>
									</div>
								)
							})
						}
					</div>
				) : (
					<p className={modalStyles.helpText}>No song requests yet</p>
				)}
			</div>
		</Modal>
	)
}
