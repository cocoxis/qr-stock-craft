import React, { createContext, useContext } from 'react';
import { useWorkspace, type Workspace } from '@/hooks/useWorkspace';

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  activeId: string;
  setActiveId: (id: string) => void;
  createWorkspace: (name: string) => Workspace;
  deleteWorkspace: (id: string) => void;
  renameWorkspace: (id: string, name: string) => void;
  getStorageKey: (key: string) => string;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const workspace = useWorkspace();
  return (
    <WorkspaceContext.Provider value={workspace}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspaceContext must be used within WorkspaceProvider');
  return ctx;
}
