/**
 * App Store — global application state.
 */
import { create } from 'zustand';

interface AppState {
  workDir: string;
  setWorkDir: (dir: string) => void;
  loadWorkDir: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  workDir: '',

  setWorkDir: (dir: string) => set({ workDir: dir }),

  loadWorkDir: async () => {
    try {
      const dir = await window.nexus.getWorkDir();
      set({ workDir: dir || '' });
    } catch {
      /* ignore */
    }
  },
}));
