import PouchDB from 'pouchdb-browser'
import { store } from '@/windows/main/store'
import { setParties, addParty, setCurrentParty, setLoading } from '@/windows/main/store/slices/partySlice'
import { PartyDoc, PartiesDoc } from '@/types'

const db = new PouchDB('karaoke-db')

class PartyMediatorClass {
	async loadParties(): Promise<void> {
		store.dispatch(setLoading(true))
		try {
			const partiesDoc = await db.get('parties') as PartiesDoc
			store.dispatch(setParties(partiesDoc.parties))
		} catch (err: any) {
			if (err.status === 404) {
				// Parties document doesn't exist yet, create it
				const newPartiesDoc: PartiesDoc = {
					_id: 'parties',
					parties: []
				}
				await db.put(newPartiesDoc)
				store.dispatch(setParties([]))
			} else {
				console.error('Failed to load parties:', err)
			}
		} finally {
			store.dispatch(setLoading(false))
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

			// Update Redux store
			store.dispatch(addParty(newParty))

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

	getParties(): PartyDoc[] {
		return store.getState().party.parties
	}
}

const PartyMediator = new PartyMediatorClass()
export default PartyMediator
