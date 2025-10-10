import { createSelector } from 'reselect'
import { RootState } from '../index'
import { RequestDoc } from '@/types'

// Extended request type with singer information
export type RequestWithSinger = RequestDoc & {
  singerName: string
  singerId: string
}

// Basic selectors
const selectCurrentParty = (state: RootState) => state.party.currentParty

// Memoized selector for rotation order
export const selectRotationOrder = createSelector(
  [selectCurrentParty],
  (currentParty): RequestWithSinger[] => {
    if (!currentParty || !currentParty.singers) {
      return []
    }

    const allRequests: RequestWithSinger[] = []
    const completedRequests: RequestWithSinger[] = []
    const playingRequests: RequestWithSinger[] = []

    // First, prepare sorted request arrays for each singer
    const singerRequestArrays = currentParty.singers.map(singer => ({
      id: singer._id,
      name: singer.name,
      requests: singer.requests
        ? [...singer.requests].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        : []
    }))

    // Separate completed and playing requests and collect them
    singerRequestArrays.forEach(singerData => {
      singerData.requests.forEach(request => {
        if (request.status === 'completed') {
          completedRequests.push({
            ...request,
            singerName: singerData.name,
            singerId: singerData.id
          })
        } else if (request.status === 'playing') {
          playingRequests.push({
            ...request,
            singerName: singerData.name,
            singerId: singerData.id
          })
        }
      })
    })

    // Sort completed requests by completion_position
    completedRequests.sort((a, b) => (a.completion_position || 0) - (b.completion_position || 0))

    // Filter out completed and playing requests from singer arrays for round-robin
    const queuedSingerArrays = singerRequestArrays.map(singerData => ({
      ...singerData,
      requests: singerData.requests.filter(request =>
        request.status !== 'completed' && request.status !== 'playing'
      )
    }))

    // Find the singer with the currently playing song and start rotation from the NEXT singer
    let startingSingerIndex = 0
    if (playingRequests.length > 0) {
      const playingSingerId = playingRequests[0].singerId
      const currentSingerIndex = queuedSingerArrays.findIndex(singer => singer.id === playingSingerId)
      if (currentSingerIndex !== -1) {
        // Start from the next singer after the currently playing one
        startingSingerIndex = (currentSingerIndex + 1) % queuedSingerArrays.length
      }
    } else if (completedRequests.length > 0) {
		const lastCompletedSingerIndex = queuedSingerArrays.findIndex(singer => singer.id === completedRequests[completedRequests.length - 1].singerId)
		if (lastCompletedSingerIndex !== -1) {
			startingSingerIndex = (lastCompletedSingerIndex + 1) % queuedSingerArrays.length
		}
	}

    // Find the maximum number of queued requests any singer has
    const maxRequests = Math.max(...queuedSingerArrays.map(s => s.requests.length), 0)

    // Round-robin through singers for queued requests, starting from the current playing singer
    for (let requestIndex = 0; requestIndex < maxRequests; requestIndex++) {
      for (let i = 0; i < queuedSingerArrays.length; i++) {
        const singerIndex = (startingSingerIndex + i) % queuedSingerArrays.length
        const singerData = queuedSingerArrays[singerIndex]
        if (requestIndex < singerData.requests.length) {
          allRequests.push({
            ...singerData.requests[requestIndex],
            singerName: singerData.name,
            singerId: singerData.id
          })
        }
      }
    }

    // Combine in order: completed requests (sorted by completion_position), playing requests, then queued requests
    return [...completedRequests, ...playingRequests, ...allRequests]
  }
)

// Selector for queued requests in rotation order
export const selectQueuedRequests = createSelector(
  [selectRotationOrder],
  (rotationOrder) => rotationOrder.filter(request => request.status === 'queued')
)

// Selector for playing requests
export const selectPlayingRequests = createSelector(
  [selectRotationOrder],
  (rotationOrder) => rotationOrder.filter(request => request.status === 'playing')
)

// Selector for completed requests in rotation order
export const selectCompletedRequests = createSelector(
  [selectRotationOrder],
  (rotationOrder) => rotationOrder.filter(request => request.status === 'completed')
)

// Selector for the next queued request
export const selectNextQueuedRequest = createSelector(
  [selectQueuedRequests],
  (queuedRequests) => {
	// debugger;
	return queuedRequests.length > 0 ? queuedRequests[0] : null
  }
)

// Selector for the last completed request
export const selectLastCompletedRequest = createSelector(
  [selectCompletedRequests],
  (completedRequests) => completedRequests.length > 0 ? completedRequests[completedRequests.length - 1] : null
)
