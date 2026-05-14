import { create } from 'zustand'

interface DetectedObject {
  name: string
  position: string
  condition: string
}

interface Constraint {
  type: string
  value: string
}

interface SpaceProfile {
  type: 'dorm' | 'rental' | 'owned'
  layout: string
  detectedObjects: DetectedObject[]
  constraints: Constraint[]
}

interface SpaceState {
  uploadedImages: string[]
  spaceProfile: SpaceProfile | null
  setUploadedImages: (images: string[]) => void
  addUploadedImage: (image: string) => void
  setSpaceProfile: (profile: SpaceProfile) => void
  reset: () => void
}

const initialState = {
  uploadedImages: [],
  spaceProfile: null,
}

export const useSpaceStore = create<SpaceState>((set) => ({
  ...initialState,
  setUploadedImages: (images) => set({ uploadedImages: images }),
  addUploadedImage: (image) => set((state) => ({ uploadedImages: [...state.uploadedImages, image] })),
  setSpaceProfile: (profile) => set({ spaceProfile: profile }),
  reset: () => set(initialState),
}))
