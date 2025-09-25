import React, { useState } from 'react'
import Modal, { modalStyles } from '../../../components/shared/Modal'

interface AddSingerModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (singerName: string) => Promise<void>
}

export default function AddSingerModal({ isOpen, onClose, onSave }: AddSingerModalProps) {
	const [singerName, setSingerName] = useState('')
	const [isSaving, setIsSaving] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!singerName.trim()) return

		setIsSaving(true)
		try {
			await onSave(singerName.trim())
			setSingerName('')
			onClose()
		} catch (err) {
			console.error('Failed to add singer:', err)
			alert('Failed to add singer. Please try again.')
		} finally {
			setIsSaving(false)
		}
	}

	const handleClose = () => {
		if (!isSaving) {
			setSingerName('')
			onClose()
		}
	}

	const footerButtons = (
		<>
			<button
				type="submit"
				className={modalStyles.primaryButton}
				disabled={!singerName.trim() || isSaving}
				form="add-singer-form"
			>
				{isSaving ? 'Adding...' : 'Add Singer'}
			</button>
			<button
				type="button"
				className={modalStyles.secondaryButton}
				onClick={handleClose}
				disabled={isSaving}
			>
				Cancel
			</button>
		</>
	)

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Add Singer to Rotation"
			footer={footerButtons}
		>
			<form id="add-singer-form" onSubmit={handleSubmit}>
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
						disabled={isSaving}
						maxLength={50}
					/>
				</div>
				<p className={modalStyles.helpText}>
					Enter the name of the singer to add to the rotation queue.
				</p>
			</form>
		</Modal>
	)
}
