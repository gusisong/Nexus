/**
 * Project Store — shared project list state.
 */
import { create } from 'zustand';
import type { ProjectInfo } from '../../shared/ipc';

interface ProjectState {
  projects: ProjectInfo[];
  loading: boolean;
  refreshProjects: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  loading: false,

  refreshProjects: async () => {
    set({ loading: true });
    try {
      const list = await window.nexus.listProjects();
      set({ projects: list });
    } catch {
      /* handled by caller */
    } finally {
      set({ loading: false });
    }
  },
}));
