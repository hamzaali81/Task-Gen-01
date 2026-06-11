import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface Workspace {
  id: string;
  name: string;
  role?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setAuth: (token: string, user: User, workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      workspaces: [],
      currentWorkspace: null,
      setAuth: (token, user, workspaces) => {
        const currentWorkspace = workspaces.length > 0 ? workspaces[0] : null;
        set({ token, user, workspaces, currentWorkspace });
      },
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      logout: () => set({ token: null, user: null, workspaces: [], currentWorkspace: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
