import { create } from 'zustand'

export interface CurrentUser {
  id: string
  displayName: string
  email?: string
  avatarUrl?: string
}

interface UserState {
  currentUser: CurrentUser | null
  hasUploadedSpace: boolean
  setCurrentUser: (user: CurrentUser) => void
  clearCurrentUser: () => void
  setHasUploadedSpace: (v: boolean) => void
}

const USER_KEY = 'nestai.currentUser'

function readStoredUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CurrentUser
    return parsed?.id ? parsed : null
  } catch {
    return null
  }
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: readStoredUser(),
  hasUploadedSpace: false,
  setCurrentUser: (user) => {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ currentUser: user })
  },
  clearCurrentUser: () => {
    window.localStorage.removeItem(USER_KEY)
    set({ currentUser: null, hasUploadedSpace: false })
  },
  setHasUploadedSpace: (v) => set({ hasUploadedSpace: v }),
}))
