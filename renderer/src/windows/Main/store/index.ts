import { configureStore } from '@reduxjs/toolkit'
import playerReducer from './slices/playerSlice'
import partyReducer from './slices/partySlice'

export const store = configureStore({
  reducer: {
    player: playerReducer,
    party: partyReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
