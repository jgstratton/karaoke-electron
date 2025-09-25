import React, { useState } from 'react'
import Modal, { modalStyles } from '../../../components/shared/Modal'

interface PartyModalProps {
	isOpen: boolean
	onClose: () => void
	onCreateParty: (name: string) => Promise<void>
}

export default function PartyModal({ isOpen, onClose, onCreateParty }: PartyModalProps) {
	const [partyName, setPartyName] = useState('')
	const [isCreating, setIsCreating] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!partyName.trim()) return

		setIsCreating(true)
		try {
			await onCreateParty(partyName.trim())
			setPartyName('')
			onClose()
		} catch (err) {
			console.error('Failed to create party:', err)
			alert('Failed to create party. Please try again.')
		} finally {
			setIsCreating(false)
		}
	}

	const handleClose = () => {
		if (!isCreating) {
			setPartyName('')
			onClose()
		}
	}

	const footerButtons = (
		<>
			<button
				type="submit"
				form="party-form"
				className={modalStyles.primaryBtn}
				disabled={!partyName.trim() || isCreating}
			>
				{isCreating ? 'Creating...' : 'Create Party'}
			</button>
			<button
				className={modalStyles.secondaryBtn}
				onClick={handleClose}
				disabled={isCreating}
			>
				Cancel
			</button>
		</>
	)

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Create New Party"
			size="medium"
			footer={footerButtons}
		>
			<form id="party-form" onSubmit={handleSubmit}>
				<div className={modalStyles.formGroup}>
					<label htmlFor="party-name" className={modalStyles.label}>
						Party Name
					</label>
					<input
						id="party-name"
						type="text"
						value={partyName}
						onChange={(e) => setPartyName(e.target.value)}
						className={modalStyles.input}
						placeholder="Enter party name..."
						disabled={isCreating}
						autoFocus
						maxLength={50}
					/>
					<div className={modalStyles.helpText}>
						Enter a name for your karaoke party session.
					</div>
				</div>
			</form>
		</Modal>
	)
}
