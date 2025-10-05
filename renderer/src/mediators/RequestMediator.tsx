import PouchDB from 'pouchdb-browser'
import { store } from '@/windows/main/store'
import { setCurrentParty } from '@/windows/main/store/slices/partySlice'
import { PartyDoc, PartiesDoc, RequestDoc } from '@/types'
import { selectNextQueuedRequest, selectPlayingRequests, selectLastCompletedRequest } from '@/windows/main/store/selectors/queueSelectors'

const db = new PouchDB('karaoke-db')

class RequestMediatorClass {
	async addRequest(partyId: string, singerId: string, mediaFilePath: string, songTitle: string): Promise<void> {
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

			// Find the singer
			const singer = party.singers.find(s => s._id === singerId)
			if (!singer) {
				throw new Error('Singer not found')
			}

			// Initialize requests array if it doesn't exist
			if (!singer.requests) {
				singer.requests = []
			}

			// Calculate sort order (next in singer's queue)
			const maxSortOrder = singer.requests.length > 0
				? Math.max(...singer.requests.map(r => r.sortOrder))
				: 0

			// Create new request
			const newRequest: RequestDoc = {
				_id: `request_${Date.now()}`,
				songTitle,
				mediaFilePath,
				status: 'queued',
				addedDate: new Date().toISOString(),
				sortOrder: maxSortOrder + 1
			}

			// Add request to the singer
			singer.requests.push(newRequest)

			// Save updated parties document
			await db.put(partiesDoc)

			// Update Redux store if this is the current party
			const currentParty = this.getCurrentParty()
			if (currentParty && currentParty._id === partyId) {
				const updatedSingers = party.singers.map(s => ({
					...s,
					requests: s.requests || []
				}))
				store.dispatch(setCurrentParty({ ...currentParty, singers: updatedSingers }))
			}
		} catch (err) {
			console.error('Failed to add request:', err)
			throw err
		}
	}

	async updateRequestStatus(partyId: string, singerId: string, requestId: string, status: RequestDoc['status']): Promise<void> {
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

			// Find the singer
			const singer = party.singers.find(s => s._id === singerId)
			if (!singer) {
				throw new Error('Singer not found')
			}

			// Initialize requests array if it doesn't exist
			if (!singer.requests) {
				singer.requests = []
			}

			// Find the request
			const request = singer.requests.find(r => r._id === requestId)
			if (!request) {
				throw new Error('Request not found')
			}

			// Update the request status
			request.status = status

			// Save updated parties document
			await db.put(partiesDoc)

			// Update Redux store if this is the current party
			const currentParty = this.getCurrentParty()
			if (currentParty && currentParty._id === partyId) {
				const updatedSingers = party.singers.map(s => ({
					...s,
					requests: s.requests || []
				}))
				store.dispatch(setCurrentParty({ ...currentParty, singers: updatedSingers }))
			}
		} catch (err) {
			console.error('Failed to update request status:', err)
			throw err
		}
	}

	async deleteRequest(partyId: string, singerId: string, requestId: string): Promise<void> {
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

			// Find the singer
			const singer = party.singers.find(s => s._id === singerId)
			if (!singer) {
				throw new Error('Singer not found')
			}

			// Initialize requests array if it doesn't exist
			if (!singer.requests) {
				singer.requests = []
			}

			// Remove request from the array
			singer.requests = singer.requests.filter(request => request._id !== requestId)

			// Save updated parties document
			await db.put(partiesDoc)

			// Update Redux store if this is the current party
			const currentParty = this.getCurrentParty()
			if (currentParty && currentParty._id === partyId) {
				const updatedSingers = party.singers.map(s => ({
					...s,
					requests: s.requests || []
				}))
				store.dispatch(setCurrentParty({ ...currentParty, singers: updatedSingers }))
			}
		} catch (err) {
			console.error('Failed to delete request:', err)
			throw err
		}
	}

	async reorderSingerRequests(partyId: string, singerId: string, reorderedRequests: RequestDoc[]): Promise<void> {
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

			// Find the singer
			const singer = party.singers.find(s => s._id === singerId)
			if (!singer) {
				throw new Error('Singer not found')
			}

			// Update sort order for each request
			const updatedRequests = reorderedRequests.map((request, index) => ({
				...request,
				sortOrder: index + 1
			}))

			// Replace the singer's requests array
			singer.requests = updatedRequests

			// Save updated parties document
			await db.put(partiesDoc)

			// Update Redux store if this is the current party
			const currentParty = this.getCurrentParty()
			if (currentParty && currentParty._id === partyId) {
				const updatedSingers = party.singers.map(s => ({
					...s,
					requests: s.requests || []
				}))
				store.dispatch(setCurrentParty({ ...currentParty, singers: updatedSingers }))
			}
		} catch (err) {
			console.error('Failed to reorder requests:', err)
			throw err
		}
	}

	async progressToNextRequest(): Promise<RequestDoc | null> {
		const currentParty = this.getCurrentParty()
		if (!currentParty || !currentParty.singers) {
			return null
		}

		// Use selector to get the next queued request
		const nextRequest = selectNextQueuedRequest(store.getState())
		if (!nextRequest) {
			return null // No queued songs available
		}

		try {
			// Update the request status to 'playing'
			await this.updateRequestStatus(
				currentParty._id,
				nextRequest.singerId,
				nextRequest._id,
				'playing'
			)

			return nextRequest;

		} catch (error) {
			console.error('Failed to start next video:', error)
			return null
		}
	}

	async skipToNext(): Promise<RequestDoc | null> {
		const currentParty = this.getCurrentParty()
		if (!currentParty || !currentParty.singers) {
			return null
		}

		try {
			// Mark all currently playing requests as completed
			const playingRequests = selectPlayingRequests(store.getState())
			for (const playingRequest of playingRequests) {
				await this.updateRequestStatus(
					currentParty._id,
					playingRequest.singerId,
					playingRequest._id,
					'completed'
				)
			}

			// Find the first queued request (after marking current ones as completed)
			const nextRequest = selectNextQueuedRequest(store.getState())
			if (!nextRequest) {
				return null // No queued songs available
			}

			// Mark the next request as playing
			await this.updateRequestStatus(
				currentParty._id,
				nextRequest.singerId,
				nextRequest._id,
				'playing'
			)

			return nextRequest

		} catch (error) {
			console.error('Failed to skip to next video:', error)
			return null
		}
	}

	async skipToPrevious(): Promise<RequestDoc | null> {
		const currentParty = this.getCurrentParty()
		if (!currentParty || !currentParty.singers) {
			return null
		}

		try {
			// Mark all currently playing requests as queued
			const playingRequests = selectPlayingRequests(store.getState())
			for (const playingRequest of playingRequests) {
				await this.updateRequestStatus(
					currentParty._id,
					playingRequest.singerId,
					playingRequest._id,
					'queued'
				)
			}

			// Get the last completed song
			const previousRequest = selectLastCompletedRequest(store.getState())
			if (!previousRequest) {
				return null // No completed songs to go back to
			}

			// Mark the previous request as playing
			await this.updateRequestStatus(
				currentParty._id,
				previousRequest.singerId,
				previousRequest._id,
				'playing'
			)

			return previousRequest

		} catch (error) {
			console.error('Failed to skip to previous video:', error)
			return null
		}
	}

	private getCurrentParty(): PartyDoc | null {
		return store.getState().party.currentParty
	}
}

const RequestMediator = new RequestMediatorClass()
export default RequestMediator
