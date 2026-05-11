import { create } from 'zustand'

interface Letter {
  id: string
  text: string
  date: string
  lifestyleDirection: string
  beforeImage: string
  afterImage: string
}

interface Intervention {
  id: string
  date: string
  spaceName: string
  level: string
  summary: string
}

interface MemoryState {
  letters: Letter[]
  interventionHistory: Intervention[]
  addLetter: (letter: Letter) => void
  addIntervention: (intervention: Intervention) => void
  reset: () => void
}

const initialState = {
  letters: [],
  interventionHistory: [],
}

export const useMemoryStore = create<MemoryState>((set) => ({
  ...initialState,
  addLetter: (letter) =>
    set((state) => ({ letters: [letter, ...state.letters] })),
  addIntervention: (intervention) =>
    set((state) => ({
      interventionHistory: [intervention, ...state.interventionHistory],
    })),
  reset: () => set(initialState),
}))
