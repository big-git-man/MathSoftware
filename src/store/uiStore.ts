import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeOverride = 'light' | 'dark' | null;

type UIState = {
  themeOverride: ThemeOverride;
  setThemeOverride: (v: ThemeOverride) => void;
  showOnboarding: boolean;
  completeOnboarding: () => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      themeOverride: null,
      setThemeOverride: (v) => set({ themeOverride: v }),
      showOnboarding: false,
      completeOnboarding: () => set({ showOnboarding: false }),
    }),
    { name: 'mathstutor-ui' }
  )
);

export function setOnboardingVisible(visible: boolean) {
  useUIStore.setState({ showOnboarding: visible });
}
