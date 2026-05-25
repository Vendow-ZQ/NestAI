import { create } from 'zustand'

interface SoftConstraints {
  sharing: string
  budget: string
  wallModification: string
}

interface LifestyleState {
  aspiration: string[]
  currentState: string[]
  softConstraints: SoftConstraints
  setAspiration: (v: string[]) => void
  setCurrentState: (v: string[]) => void
  setSoftConstraints: (v: SoftConstraints) => void
  reset: () => void
}

const initialState = {
  aspiration: [],
  currentState: [],
  softConstraints: {
    sharing: '',
    budget: '',
    wallModification: '',
  },
}

export const useLifestyleStore = create<LifestyleState>((set) => ({
  ...initialState,
  setAspiration: (v) => set({ aspiration: v }),
  setCurrentState: (v) => set({ currentState: v }),
  setSoftConstraints: (v) => set({ softConstraints: v }),
  reset: () => set(initialState),
}))
