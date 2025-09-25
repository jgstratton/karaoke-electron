import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PartyDoc } from '@/types'

interface PartyState {
	currentParty: PartyDoc | null
	loading: boolean
}

const initialState: PartyState = {
	currentParty: null,
	loading: false
}

export const partySlice = createSlice({
	name: 'party',
	initialState,
	reducers: {
		setCurrentParty: (state, action: PayloadAction<PartyDoc | null>) => {
			state.currentParty = action.payload
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload
		},
		clearCurrentParty: (state) => {
			state.currentParty = null
		}
	}
})

export const { setCurrentParty, setLoading, clearCurrentParty } = partySlice.actions

export default partySlice.reducer
