import { useState, useEffect } from 'react'
import Modal, { modalStyles } from '../../../components/shared/Modal'
import PartyMediator from '@/mediators/PartyMediator'
import { PartyDoc } from '@/types'

interface LoadPartyModalProps {
	isOpen: boolean
	onClose: () => void
	onLoadParty: (party: PartyDoc) => void
}

export default function LoadPartyModal({ isOpen, onClose, onLoadParty }: LoadPartyModalProps) {
	const [parties, setParties] = useState<PartyDoc[]>([])
	const [filteredParties, setFilteredParties] = useState<PartyDoc[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [loading, setLoading] = useState(false)
	const [deleting, setDeleting] = useState<string | null>(null)

	useEffect(() => {
		if (isOpen) {
			loadParties()
		}
	}, [isOpen])

	useEffect(() => {
		const filtered = parties.filter(party =>
			party.name.toLowerCase().includes(searchTerm.toLowerCase())
		)
		setFilteredParties(filtered)
	}, [parties, searchTerm])

	const loadParties = async () => {
		setLoading(true)
		try {
			const allParties = await PartyMediator.loadAllParties()
			// Sort by creation date, newest first
			const sortedParties = allParties.sort((a, b) =>
				new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()
			)
			setParties(sortedParties)
		} catch (err) {
			console.error('Failed to load parties:', err)
		} finally {
			setLoading(false)
		}
	}

	const handleLoadParty = (party: PartyDoc) => {
		onLoadParty(party)
		onClose()
	}

	const handleDeleteParty = async (partyId: string, partyName: string) => {
		if (!confirm(`Are you sure you want to delete the party "${partyName}"? This action cannot be undone.`)) {
			return
		}

		setDeleting(partyId)
		try {
			await PartyMediator.deleteParty(partyId)
			await loadParties() // Refresh the list
		} catch (err) {
			console.error('Failed to delete party:', err)
			alert('Failed to delete party. Please try again.')
		} finally {
			setDeleting(null)
		}
	}

	const handleClose = () => {
		setSearchTerm('')
		onClose()
	}

	const footerButtons = (
		<>
			<button
				className={modalStyles.primaryBtn}
				onClick={loadParties}
				disabled={loading}
			>
				{loading ? 'Refreshing...' : 'Refresh'}
			</button>
			<button
				className={modalStyles.secondaryBtn}
				onClick={handleClose}
				disabled={loading}
			>
				Cancel
			</button>
		</>
	)

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title="Load Existing Party"
			size="large"
			footer={footerButtons}
		>
			<div className={modalStyles.formGroup}>
				<label htmlFor="party-search" className={modalStyles.label}>
					Search Parties
				</label>
				<input
					id="party-search"
					type="text"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className={modalStyles.input}
					placeholder="Search by party name..."
					disabled={loading}
				/>
			</div>

			{loading ? (
				<div className={modalStyles.loadingContainer}>
					<p>Loading parties...</p>
				</div>
			) : filteredParties.length === 0 ? (
				<div className={modalStyles.noData}>
					{searchTerm ? 'No parties found matching your search.' : 'No parties found. Create your first party!'}
				</div>
			) : (
				<div className={modalStyles.scrollableList} style={{ maxHeight: '400px' }}>
					{filteredParties.map((party) => (
						<div key={party._id} className={modalStyles.listItem}>
							<div className={modalStyles.listItemHeader}>
								<div>
									<strong className={modalStyles.listItemTitle}>
										{party.name}
									</strong>
									<div className={modalStyles.listItemMeta}>
										Created: {new Date(party.creationDate).toLocaleDateString()} at {new Date(party.creationDate).toLocaleTimeString()}
									</div>
								</div>
								<div className={modalStyles.listItemActions}>
									<button
										className={modalStyles.successBtn}
										onClick={() => handleLoadParty(party)}
										disabled={deleting === party._id}
										title="Load this party"
									>
										<i className="fas fa-folder-open"></i> Load
									</button>
									<button
										className={modalStyles.dangerBtn}
										onClick={() => handleDeleteParty(party._id, party.name)}
										disabled={deleting !== null}
										title="Delete this party"
									>
										{deleting === party._id ? (
											<i className="fas fa-spinner fa-spin"></i>
										) : (
											<i className="fas fa-trash"></i>
										)}
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</Modal>
	)
}
