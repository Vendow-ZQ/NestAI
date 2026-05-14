import { create } from 'zustand'

interface NextAction {
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
}

interface InterventionState {
  nextList: NextAction[]
  addToNext: (action: NextAction) => void
}

export const useInterventionStore = create<InterventionState>((set) => ({
  nextList: [],
  addToNext: (action) => set((state) => ({ nextList: [...state.nextList, action] })),
}))
