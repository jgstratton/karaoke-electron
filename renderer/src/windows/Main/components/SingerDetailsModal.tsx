import React, { useState, useEffect } from 'react'
import Modal, { modalStyles } from '../../../components/shared/Modal'
import { SingerDoc } from '@/types'

interface SingerDetailsModalProps {
	isOpen: boolean
	onClose: () => void
	singer: SingerDoc | null
	onSave: (singerId: string, updatedData: { name?: string; isPaused?: boolean }) => Promise<void>
	onDelete: (singerId: string) => Promise<void>
}

export default function SingerDetailsModal({ isOpen, onClose, singer, onSave, onDelete }: SingerDetailsModalProps) {
	const [singerName, setSingerName] = useState('')
	const [isPaused, setIsPaused] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	useEffect(() => {
		if (singer && isOpen) {
			setSingerName(singer.name)
			setIsPaused(singer.isPaused || false)
		}
	}, [singer, isOpen])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!singerName.trim() || !singer) return

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

	const handleClose = () => {
		if (!isSaving && !isDeleting) {
			setSingerName(singer?.name || '')
			setIsPaused(singer?.isPaused || false)
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
				disabled={!singerName.trim() || isSaving || isDeleting}
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
						onChange={(e) => setSingerName(e.target.value)}
						className={modalStyles.input}
						placeholder="Enter singer name"
						autoFocus
						disabled={isSaving || isDeleting}
						maxLength={50}
					/>
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
		</Modal>
	)
}
