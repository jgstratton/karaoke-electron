import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface PlayerState {
  currentVideo: string
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
}

const initialState: PlayerState = {
  currentVideo: '',
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
}

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setCurrentVideo: (state, action: PayloadAction<string>) => {
      state.currentVideo = action.payload
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload
    },
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload
    },
    updateVideoState: (state, action: PayloadAction<{
      isPlaying: boolean
      currentTime: number
      duration: number
      volume: number
    }>) => {
      state.isPlaying = action.payload.isPlaying
      state.currentTime = action.payload.currentTime
      state.duration = action.payload.duration
      state.volume = action.payload.volume
    },
    resetPlayer: (state) => {
      state.currentVideo = ''
      state.isPlaying = false
      state.currentTime = 0
      state.duration = 0
      state.volume = 1
    },
  },
})

export const {
  setCurrentVideo,
  setIsPlaying,
  setCurrentTime,
  setDuration,
  setVolume,
  updateVideoState,
  resetPlayer,
} = playerSlice.actions

export default playerSlice.reducer
