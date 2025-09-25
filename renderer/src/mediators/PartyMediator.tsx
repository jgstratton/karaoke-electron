import PouchDB from 'pouchdb-browser'
import { store } from '@/windows/main/store'
import { setCurrentParty } from '@/windows/main/store/slices/partySlice'
import { PartyDoc, PartiesDoc, SingerDoc } from '@/types'

const db = new PouchDB('karaoke-db')

class PartyMediatorClass {
	async loadAllParties(): Promise<PartyDoc[]> {
		try {
			const partiesDoc = await db.get('parties') as PartiesDoc
			// Ensure backward compatibility: add singers array if it doesn't exist
			const parties = partiesDoc.parties.map(party => ({
				...party,
				singers: (party.singers || []).map(singer => ({
					...singer,
					isPaused: singer.isPaused || false
				}))
			}))
			return parties
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
			creationDate: new Date().toISOString(),
			singers: []
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

	async updatePartyName(partyId: string, newName: string): Promise<void> {
		try {
			// Get current parties document
			let partiesDoc: PartiesDoc
			try {
				partiesDoc = await db.get('parties') as PartiesDoc
			} catch (err: any) {
				if (err.status === 404) {
					throw new Error('No parties found')
				}
				throw err
			}

			// Find and update the party
			const party = partiesDoc.parties.find(p => p._id === partyId)
			if (!party) {
				throw new Error('Party not found')
			}

			party.name = newName

			// Save updated parties document
			await db.put(partiesDoc)

			// Update Redux store if this is the current party
			const currentParty = this.getCurrentParty()
			if (currentParty && currentParty._id === partyId) {
				store.dispatch(setCurrentParty({ ...currentParty, name: newName }))
			}
		} catch (err) {
			console.error('Failed to update party name:', err)
			throw err
		}
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

	async addSingerToParty(partyId: string, singerName: string): Promise<void> {
		try {
			// Get current parties document
			let partiesDoc: PartiesDoc
			try {
				partiesDoc = await db.get('parties') as PartiesDoc
			} catch (err: any) {
				if (err.status === 404) {
					throw new Error('No parties found')
				}
				throw err
			}

			// Find the party
			const party = partiesDoc.parties.find(p => p._id === partyId)
			if (!party) {
				throw new Error('Party not found')
			}

			// Create new singer
			const newSinger = {
				_id: `singer_${Date.now()}`,
				name: singerName.trim(),
				addedDate: new Date().toISOString()
			}

			// Initialize singers array if it doesn't exist (for backwards compatibility)
			if (!party.singers) {
				party.singers = []
			}

			// Add singer to the party
			party.singers.push(newSinger)

			// Save updated parties document
			await db.put(partiesDoc)

			// Update Redux store if this is the current party
			const currentParty = this.getCurrentParty()
			if (currentParty && currentParty._id === partyId) {
				store.dispatch(setCurrentParty({ ...currentParty, singers: party.singers }))
			}
		} catch (err) {
			console.error('Failed to add singer to party:', err)
			throw err
		}
	}

	async updateSinger(partyId: string, singerId: string, updatedData: { name?: string; isPaused?: boolean }): Promise<void> {
		try {
			// Get current parties document
			let partiesDoc: PartiesDoc
			try {
				partiesDoc = await db.get('parties') as PartiesDoc
			} catch (err: any) {
				if (err.status === 404) {
					throw new Error('No parties found')
				}
				throw err
			}

			// Find the party
			const party = partiesDoc.parties.find(p => p._id === partyId)
			if (!party) {
				throw new Error('Party not found')
			}

			// Initialize singers array if it doesn't exist (for backwards compatibility)
			if (!party.singers) {
				party.singers = []
			}

			// Find the singer
			const singer = party.singers.find(s => s._id === singerId)
			if (!singer) {
				throw new Error('Singer not found')
			}

			// Update singer data
			if (updatedData.name !== undefined) {
				singer.name = updatedData.name
			}
			if (updatedData.isPaused !== undefined) {
				singer.isPaused = updatedData.isPaused
			}

			// Save updated parties document
			await db.put(partiesDoc)

			// Update Redux store if this is the current party
			const currentParty = this.getCurrentParty()
			if (currentParty && currentParty._id === partyId) {
				store.dispatch(setCurrentParty({ ...currentParty, singers: party.singers }))
			}
		} catch (err) {
			console.error('Failed to update singer:', err)
			throw err
		}
	}

	async deleteSinger(partyId: string, singerId: string): Promise<void> {
		try {
			// Get current parties document
			let partiesDoc: PartiesDoc
			try {
				partiesDoc = await db.get('parties') as PartiesDoc
			} catch (err: any) {
				if (err.status === 404) {
					throw new Error('No parties found')
				}
				throw err
			}

			// Find the party
			const party = partiesDoc.parties.find(p => p._id === partyId)
			if (!party) {
				throw new Error('Party not found')
			}

			// Initialize singers array if it doesn't exist (for backwards compatibility)
			if (!party.singers) {
				party.singers = []
			}

			// Remove singer from the array
			party.singers = party.singers.filter(singer => singer._id !== singerId)

			// Save updated parties document
			await db.put(partiesDoc)

			// Update Redux store if this is the current party
			const currentParty = this.getCurrentParty()
			if (currentParty && currentParty._id === partyId) {
				store.dispatch(setCurrentParty({ ...currentParty, singers: party.singers }))
			}
		} catch (err) {
			console.error('Failed to delete singer:', err)
			throw err
		}
	}

	async reorderSingers(partyId: string, reorderedSingers: SingerDoc[]): Promise<void> {
		try {
			// Get current parties document
			let partiesDoc: PartiesDoc
			try {
				partiesDoc = await db.get('parties') as PartiesDoc
			} catch (err: any) {
				if (err.status === 404) {
					throw new Error('No parties found')
				}
				throw err
			}

			// Find the party
			const party = partiesDoc.parties.find(p => p._id === partyId)
			if (!party) {
				throw new Error('Party not found')
			}

			// Update the singers array with new order
			party.singers = reorderedSingers

			// Save updated parties document
			await db.put(partiesDoc)

			// Update Redux store if this is the current party
			const currentParty = this.getCurrentParty()
			if (currentParty && currentParty._id === partyId) {
				store.dispatch(setCurrentParty({ ...currentParty, singers: reorderedSingers }))
			}
		} catch (err) {
			console.error('Failed to reorder singers:', err)
			throw err
		}
	}
}

const PartyMediator = new PartyMediatorClass()
export default PartyMediator
