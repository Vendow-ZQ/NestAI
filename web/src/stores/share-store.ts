import { create } from 'zustand'

import type { Level } from '@/lib/api'

interface ShareFeedback {
  sessionId: string
  level: Level
  afterImages: string[]
  userFeeling: string
  completionStatus: string
  unfinishedSteps: string[]
}

interface ShareState {
  feedback: ShareFeedback | null
  setFeedback: (feedback: ShareFeedback) => void
  clearFeedback: () => void
}

export const useShareStore = create<ShareState>((set) => ({
  feedback: null,
  setFeedback: (feedback) => set({ feedback }),
  clearFeedback: () => set({ feedback: null }),
}))
