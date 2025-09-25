import React, { useState } from 'react'
import Modal, { modalStyles } from '../../../components/shared/Modal'
import { SingerDoc } from '@/types'

interface AddSingerModalProps {
	isOpen: boolean
	onClose: () => void
	allSingers: SingerDoc[]
	onSave: (singerName: string) => Promise<void>
}

export default function AddSingerModal({ isOpen, onClose, allSingers, onSave }: AddSingerModalProps) {
	const [singerName, setSingerName] = useState('')
	const [isSaving, setIsSaving] = useState(false)
	const [nameError, setNameError] = useState('')

	const validateName = (name: string): string => {
		const trimmedName = name.trim()
		if (!trimmedName) {
			return 'Singer name is required'
		}
		if (trimmedName.length > 50) {
			return 'Singer name must be 50 characters or less'
		}
		// Check for duplicates
		const isDuplicate = allSingers.some(s =>
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

		const validation = validateName(singerName)
		if (validation) {
			setNameError(validation)
			return
		}

		setIsSaving(true)
		try {
			await onSave(singerName.trim())
			setSingerName('')
			setNameError('')
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
			setNameError('')
			onClose()
		}
	}

	const footerButtons = (
		<>
			<button
				type="submit"
				className={modalStyles.primaryButton}
				disabled={!singerName.trim() || !!nameError || isSaving}
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
						onChange={handleNameChange}
						className={`${modalStyles.input} ${nameError ? modalStyles.inputError : ''}`}
						placeholder="Enter singer name"
						autoFocus
						disabled={isSaving}
						maxLength={50}
					/>
					{nameError && <span className={modalStyles.errorText}>{nameError}</span>}
				</div>
				<p className={modalStyles.helpText}>
					Enter the name of the singer to add to the rotation queue.
				</p>
			</form>
		</Modal>
	)
}
