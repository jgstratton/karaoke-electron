import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PartyDoc } from '@/types'

interface PartyState {
	parties: PartyDoc[]
	currentParty: PartyDoc | null
	loading: boolean
}

const initialState: PartyState = {
	parties: [],
	currentParty: null,
	loading: false
}

export const partySlice = createSlice({
	name: 'party',
	initialState,
	reducers: {
		setParties: (state, action: PayloadAction<PartyDoc[]>) => {
			state.parties = action.payload
		},
		addParty: (state, action: PayloadAction<PartyDoc>) => {
			state.parties.push(action.payload)
		},
		setCurrentParty: (state, action: PayloadAction<PartyDoc | null>) => {
			state.currentParty = action.payload
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload
		},
		removeParty: (state, action: PayloadAction<string>) => {
			state.parties = state.parties.filter(party => party._id !== action.payload)
			if (state.currentParty && state.currentParty._id === action.payload) {
				state.currentParty = null
			}
		}
	}
})

export const { setParties, addParty, setCurrentParty, setLoading, removeParty } = partySlice.actions

export default partySlice.reducer
