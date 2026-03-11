import { useState, useEffect, useCallback } from 'react';

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
}

const WORKSPACES_KEY = 'stockqr_workspaces';
const ACTIVE_WORKSPACE_KEY = 'stockqr_active_workspace';

const defaultWorkspace: Workspace = {
  id: 'default',
  name: 'Base principale',
  createdAt: new Date().toISOString(),
};

function getWorkspaces(): Workspace[] {
  try {
    const raw = localStorage.getItem(WORKSPACES_KEY);
    return raw ? JSON.parse(raw) : [defaultWorkspace];
  } catch {
    return [defaultWorkspace];
  }
}

function getActiveId(): string {
  return localStorage.getItem(ACTIVE_WORKSPACE_KEY) || 'default';
}

export function useWorkspace() {
  const [workspaces, setWorkspacesState] = useState<Workspace[]>(getWorkspaces);
  const [activeId, setActiveIdState] = useState<string>(getActiveId);

  const setWorkspaces = useCallback((ws: Workspace[]) => {
    setWorkspacesState(ws);
    localStorage.setItem(WORKSPACES_KEY, JSON.stringify(ws));
  }, []);

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
  }, []);

  const activeWorkspace = workspaces.find(w => w.id === activeId) || workspaces[0];

  const createWorkspace = useCallback((name: string) => {
    const ws: Workspace = {
      id: `ws-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
    };
    const updated = [...workspaces, ws];
    setWorkspaces(updated);
    setActiveId(ws.id);
    return ws;
  }, [workspaces, setWorkspaces, setActiveId]);

  const deleteWorkspace = useCallback((id: string) => {
    if (id === 'default') return;
    const updated = workspaces.filter(w => w.id !== id);
    setWorkspaces(updated);
    // Clean up localStorage keys for this workspace
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${id}_`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    if (activeId === id) {
      setActiveId('default');
    }
  }, [workspaces, activeId, setWorkspaces, setActiveId]);

  const renameWorkspace = useCallback((id: string, name: string) => {
    setWorkspaces(workspaces.map(w => w.id === id ? { ...w, name } : w));
  }, [workspaces, setWorkspaces]);

  // Build prefixed key for workspace-scoped localStorage
  const getStorageKey = useCallback((key: string) => {
    if (activeId === 'default') return key; // backward compat
    return `${activeId}_${key}`;
  }, [activeId]);

  return {
    workspaces,
    activeWorkspace,
    activeId,
    setActiveId,
    createWorkspace,
    deleteWorkspace,
    renameWorkspace,
    getStorageKey,
  };
}
