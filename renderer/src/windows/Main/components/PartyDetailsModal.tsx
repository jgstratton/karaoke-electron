import React, { useState, useEffect } from 'react'
import Modal, { modalStyles } from '../../../components/shared/Modal'
import { PartyDoc } from '@/types'

interface PartyDetailsModalProps {
	isOpen: boolean
	onClose: () => void
	party: PartyDoc | null
	onSave: (newName: string) => Promise<void>
}

export default function PartyDetailsModal({ isOpen, onClose, party, onSave }: PartyDetailsModalProps) {
	const [partyName, setPartyName] = useState('')
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		if (party && isOpen) {
			setPartyName(party.name)
		}
	}, [party, isOpen])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!partyName.trim() || !party) return

		setIsSaving(true)
		try {
			await onSave(partyName.trim())
			onClose()
		} catch (err) {
			console.error('Failed to update party name:', err)
			alert('Failed to update party name. Please try again.')
		} finally {
			setIsSaving(false)
		}
	}

	const handleClose = () => {
		if (!isSaving) {
			setPartyName(party?.name || '')
			onClose()
		}
	}

	if (!party) return null

	const footerButtons = (
		<>
			<button
				type="submit"
				form="party-details-form"
				className={modalStyles.primaryBtn}
				disabled={!partyName.trim() || partyName === party.name || isSaving}
			>
				{isSaving ? 'Saving...' : 'Save Changes'}
			</button>
			<button
				className={modalStyles.secondaryBtn}
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
			title="Edit Party Details"
			size="medium"
			footer={footerButtons}
		>
			<form id="party-details-form" onSubmit={handleSubmit}>
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
						disabled={isSaving}
						autoFocus
						maxLength={50}
					/>
					<div className={modalStyles.helpText}>
						Enter a new name for this party.
					</div>
				</div>

				<div className={modalStyles.infoSection}>
					<h4 className={modalStyles.sectionTitle}>Party Information</h4>
					<p><strong>Current Name:</strong> {party.name}</p>
					<p><strong>Created:</strong> {new Date(party.creationDate).toLocaleString()}</p>
				</div>
			</form>
		</Modal>
	)
}
