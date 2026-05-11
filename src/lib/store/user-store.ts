import { create } from 'zustand'

interface UserState {
  hasUploadedSpace: boolean
  hasCompletedFirstLoop: boolean
  nestId: string
  setHasUploadedSpace: (v: boolean) => void
  setHasCompletedFirstLoop: (v: boolean) => void
  setNestId: (id: string) => void
  reset: () => void
}

const initialState = {
  hasUploadedSpace: false,
  hasCompletedFirstLoop: false,
  nestId: '',
}

export const useUserStore = create<UserState>((set) => ({
  ...initialState,
  setHasUploadedSpace: (v) => set({ hasUploadedSpace: v }),
  setHasCompletedFirstLoop: (v) => set({ hasCompletedFirstLoop: v }),
  setNestId: (id) => set({ nestId: id }),
  reset: () => set(initialState),
}))
