import { create } from 'zustand';

interface PromptState {
  selectedPromptId: string | null;
  isCreating: boolean;
  isEditing: boolean;
  searchQuery: string;
  selectedTags: string[];
  
  setSelectedPromptId: (id: string | null) => void;
  setIsCreating: (creating: boolean) => void;
  setIsEditing: (editing: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  resetFilters: () => void;
}

export const usePromptStore = create<PromptState>((set) => ({
  selectedPromptId: null,
  isCreating: false,
  isEditing: false,
  searchQuery: '',
  selectedTags: [],
  
  setSelectedPromptId: (id) => set({ selectedPromptId: id }),
  setIsCreating: (creating) => set({ isCreating: creating }),
  setIsEditing: (editing) => set({ isEditing: editing }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedTags: (tags) => set({ selectedTags: tags }),
  resetFilters: () => set({ searchQuery: '', selectedTags: [] }),
}));
