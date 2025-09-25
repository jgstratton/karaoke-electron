import PouchDB from 'pouchdb-browser'
import { store } from '@/windows/main/store'
import { setCurrentParty } from '@/windows/main/store/slices/partySlice'
import { PartyDoc, PartiesDoc } from '@/types'

const db = new PouchDB('karaoke-db')

class PartyMediatorClass {
	async loadAllParties(): Promise<PartyDoc[]> {
		try {
			const partiesDoc = await db.get('parties') as PartiesDoc
			return partiesDoc.parties
		} catch (err: any) {
			if (err.status === 404) {
				// Parties document doesn't exist yet, create it
				const newPartiesDoc: PartiesDoc = {
					_id: 'parties',
					parties: []
				}
				await db.put(newPartiesDoc)
				return []
			} else {
				console.error('Failed to load parties:', err)
				throw err
			}
		}
	}

	async loadPartyById(partyId: string): Promise<PartyDoc | null> {
		try {
			const parties = await this.loadAllParties()
			return parties.find(p => p._id === partyId) || null
		} catch (err) {
			console.error('Failed to load party by ID:', err)
			return null
		}
	}

	async createParty(name: string): Promise<PartyDoc> {
		const newParty: PartyDoc = {
			_id: `party_${Date.now()}`,
			name,
			creationDate: new Date().toISOString()
		}

		try {
			// Get current parties document
			let partiesDoc: PartiesDoc
			try {
				partiesDoc = await db.get('parties') as PartiesDoc
			} catch (err: any) {
				if (err.status === 404) {
					partiesDoc = {
						_id: 'parties',
						parties: []
					}
				} else {
					throw err
				}
			}

			// Add new party to the array
			partiesDoc.parties.push(newParty)

			// Save updated parties document
			await db.put(partiesDoc)

			return newParty
		} catch (err) {
			console.error('Failed to create party:', err)
			throw err
		}
	}

	async setCurrentParty(party: PartyDoc | null): Promise<void> {
		store.dispatch(setCurrentParty(party))
	}

	getCurrentParty(): PartyDoc | null {
		return store.getState().party.currentParty
	}

	async deleteParty(partyId: string): Promise<void> {
		try {
			let partiesDoc: PartiesDoc
			try {
				partiesDoc = await db.get('parties') as PartiesDoc
			} catch (err: any) {
				if (err.status === 404) {
					return // No parties to delete
				}
				throw err
			}

			// Remove party from the array
			partiesDoc.parties = partiesDoc.parties.filter(party => party._id !== partyId)

			// Save updated parties document
			await db.put(partiesDoc)

			// Clear current party if it was deleted
			const currentParty = this.getCurrentParty()
			if (currentParty && currentParty._id === partyId) {
				store.dispatch(setCurrentParty(null))
			}
		} catch (err) {
			console.error('Failed to delete party:', err)
			throw err
		}
	}
}

const PartyMediator = new PartyMediatorClass()
export default PartyMediator
