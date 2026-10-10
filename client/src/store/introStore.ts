import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IntroStore {
  hasSeenIntro: boolean;
  setHasSeenIntro: (val: boolean) => void;
}

export const useIntroStore = create<IntroStore>()(
  persist(
    (set) => ({
      hasSeenIntro: false,
      setHasSeenIntro: (val) => set({ hasSeenIntro: val }),
    }),
    { name: 'verity-intro' }
  )
);
