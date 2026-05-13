import { create } from 'zustand'

interface AlertState {
  isOpen: boolean
  type: 'error' | 'success' | null
  message: string | null
  show: (type: 'error' | 'success', message: string) => void
  hide: () => void
}

export const useAlertStore = create<AlertState>((set) => ({
  isOpen: false,
  type: null,
  message: null,
  show: (type, message) => set({ isOpen: true, type, message }),
  hide: () => set({ isOpen: false, type: null, message: null }),
}))
