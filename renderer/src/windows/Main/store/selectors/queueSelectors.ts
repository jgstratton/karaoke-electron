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

    // First, prepare sorted request arrays for each singer
    const singerRequestArrays = currentParty.singers.map(singer => ({
      id: singer._id,
      name: singer.name,
      requests: singer.requests
        ? [...singer.requests].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        : []
    }))

    // Find the maximum number of requests any singer has
    const maxRequests = Math.max(...singerRequestArrays.map(s => s.requests.length), 0)

    // Round-robin through singers: take 1st request from each, then 2nd from each, etc.
    for (let requestIndex = 0; requestIndex < maxRequests; requestIndex++) {
      for (const singerData of singerRequestArrays) {
        if (requestIndex < singerData.requests.length) {
          allRequests.push({
            ...singerData.requests[requestIndex],
            singerName: singerData.name,
            singerId: singerData.id
          })
        }
      }
    }

    return allRequests
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
  (queuedRequests) => queuedRequests.length > 0 ? queuedRequests[0] : null
)

// Selector for the last completed request
export const selectLastCompletedRequest = createSelector(
  [selectCompletedRequests],
  (completedRequests) => completedRequests.length > 0 ? completedRequests[completedRequests.length - 1] : null
)
