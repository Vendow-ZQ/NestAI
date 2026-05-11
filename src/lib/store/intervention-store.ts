import { create } from 'zustand'

interface ChangeAnnotation {
  label: string
  x: number
  y: number
}

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
  interventionId?: string
  level?: 'free' | 'low' | 'advanced'
  sceneId?: string
}

interface InterventionResult {
  id: string
  sceneId: string
  spaceName?: string
  level: 'free' | 'low' | 'advanced'
  afterImage: string
  beforeImage: string
  annotations: ChangeAnnotation[]
  diagnosis: string
  firstSteps: string[]
  recommendations: string[]
}

interface InterventionState {
  currentResult: InterventionResult | null
  allResults: InterventionResult[]
  nextList: NextAction[]
  completedActions: NextAction[]
  setCurrentResult: (r: InterventionResult | null) => void
  setAllResults: (r: InterventionResult[]) => void
  addToNext: (action: NextAction) => void
  removeFromNext: (id: string) => void
  markCompleted: (id: string) => void
  completeAction: (id: string) => void
  reset: () => void
}

const initialState = {
  currentResult: null,
  allResults: [],
  nextList: [],
  completedActions: [],
}

export const useInterventionStore = create<InterventionState>((set) => ({
  ...initialState,
  setCurrentResult: (r) => set({ currentResult: r }),
  setAllResults: (r) => set({ allResults: r }),
  addToNext: (action) =>
    set((state) => ({
      nextList: [...state.nextList, action],
    })),
  removeFromNext: (id) =>
    set((state) => ({
      nextList: state.nextList.filter((a) => a.id !== id),
    })),
  markCompleted: (id) =>
    set((state) => {
      const action = state.nextList.find((a) => a.id === id)
      if (!action) return state
      return {
        nextList: state.nextList.filter((a) => a.id !== id),
        completedActions: [...state.completedActions, { ...action, completed: true }],
      }
    }),
  completeAction: (id) =>
    set((state) => {
      const action = state.nextList.find((a) => a.id === id)
      if (!action) return state
      return {
        nextList: state.nextList.filter((a) => a.id !== id),
        completedActions: [...state.completedActions, { ...action, completed: true }],
      }
    }),
  reset: () => set(initialState),
}))

export type { NextAction, InterventionResult, ChangeAnnotation }
