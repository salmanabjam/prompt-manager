import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'fa';
  density: 'compact' | 'comfortable' | 'spacious';
  semanticSearch: boolean;
  autoSave: boolean;
  autoVersion: boolean;
  currentPage: 'library' | 'tags' | 'recent' | 'favorites' | 'settings' | 'statistics' | 'logs';
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: 'en' | 'fa') => void;
  setDensity: (density: 'compact' | 'comfortable' | 'spacious') => void;
  setSemanticSearch: (enabled: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoVersion: (enabled: boolean) => void;
  setCurrentPage: (page: SettingsState['currentPage']) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'en',
      density: 'comfortable',
      semanticSearch: false,
      autoSave: true,
      autoVersion: true,
      currentPage: 'library',
      
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setDensity: (density) => set({ density }),
      setSemanticSearch: (enabled) => set({ semanticSearch: enabled }),
      setAutoSave: (enabled) => set({ autoSave: enabled }),
      setAutoVersion: (enabled) => set({ autoVersion: enabled }),
      setCurrentPage: (page) => set({ currentPage: page }),
    }),
    {
      name: 'prompt-manager-settings',
    }
  )
);
