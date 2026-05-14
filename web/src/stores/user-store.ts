import { create } from 'zustand'

interface UserState {
  hasUploadedSpace: boolean
  setHasUploadedSpace: (v: boolean) => void
}

export const useUserStore = create<UserState>((set) => ({
  hasUploadedSpace: false,
  setHasUploadedSpace: (v) => set({ hasUploadedSpace: v }),
}))
