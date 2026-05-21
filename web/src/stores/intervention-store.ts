import { create } from 'zustand'

import type { InterventionPlan } from '@/lib/api'

export interface NextAction {
  id: string
  title: string
  spaceName: string
  lifestyleGoal: string
  firstStep: string
  estimatedTime: string
  costRange: string
  previewImage: string
  completed: boolean
  interventionId: string
  level: string
  sceneId: string
  sessionId?: string
}

interface InterventionState {
  nextList: NextAction[]
  currentPlan: InterventionPlan | null
  currentSessionId: string | null
  addToNext: (action: NextAction) => void
  removeFromNext: (id: string) => void
  setNextList: (actions: NextAction[]) => void
  setCurrentPlan: (sessionId: string, plan: InterventionPlan) => void
  resetCurrentPlan: () => void
}

export const useInterventionStore = create<InterventionState>((set) => ({
  nextList: [],
  currentPlan: null,
  currentSessionId: null,
  addToNext: (action) => set((state) => {
    const exists = state.nextList.some((item) => item.interventionId === action.interventionId)
    if (exists) return state
    return { nextList: [...state.nextList, action] }
  }),
  removeFromNext: (id) =>
    set((state) => ({ nextList: state.nextList.filter((item) => item.id !== id) })),
  setNextList: (actions) => set({ nextList: actions }),
  setCurrentPlan: (sessionId, plan) => set({ currentSessionId: sessionId, currentPlan: plan }),
  resetCurrentPlan: () => set({ currentSessionId: null, currentPlan: null }),
}))
