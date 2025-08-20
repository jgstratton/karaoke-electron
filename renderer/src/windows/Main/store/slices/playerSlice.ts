import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface PlayerState {
  currentVideo: string
  isPlaying: boolean
  startingTime: number
  currentTime: number
  duration: number
  volume: number
}

const initialState: PlayerState = {
  currentVideo: '',
  isPlaying: false,
  startingTime: 0,
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
	play: (state) => {
		state.isPlaying = true;
	},
	pause: (state) => {
		state.isPlaying = false;
	},
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload
    },
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload
    },
	setStartingTime: (state, action: PayloadAction<number>) => {
      state.startingTime = action.payload
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload
    },

    resetPlayer: (state) => {
      state.currentVideo = ''
      state.isPlaying = false
      state.startingTime = 0
      state.currentTime = 0
      state.duration = 0
      state.volume = 1
    },
  },
})

export const {
  setCurrentVideo,
  setIsPlaying,
  play,
  pause,
  setStartingTime,
  setCurrentTime,
  setDuration,
  setVolume,
  resetPlayer,
} = playerSlice.actions

export default playerSlice.reducer
