/**
 * Global Favorites Store using Zustand
 * این store state مدیریت favorites را در سراسر اپلیکیشن مدیریت می‌کند
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favorites: Set<string>;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  getFavoritesArray: () => string[];
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: new Set<string>(),

      addFavorite: (id: string) => {
        console.log('[FavoritesStore] Adding favorite:', id);
        set((state) => {
          const newFavorites = new Set(state.favorites);
          newFavorites.add(id);
          console.log('[FavoritesStore] New favorites count:', newFavorites.size);
          return { favorites: newFavorites };
        });
      },

      removeFavorite: (id: string) => {
        console.log('[FavoritesStore] Removing favorite:', id);
        set((state) => {
          const newFavorites = new Set(state.favorites);
          newFavorites.delete(id);
          console.log('[FavoritesStore] New favorites count:', newFavorites.size);
          return { favorites: newFavorites };
        });
      },

      toggleFavorite: (id: string) => {
        const state = get();
        if (state.favorites.has(id)) {
          state.removeFavorite(id);
        } else {
          state.addFavorite(id);
        }
      },

      isFavorite: (id: string) => {
        return get().favorites.has(id);
      },

      getFavoritesArray: () => {
        return Array.from(get().favorites);
      },

      clearFavorites: () => {
        console.log('[FavoritesStore] Clearing all favorites');
        set({ favorites: new Set() });
      },
    }),
    {
      name: 'favorites-storage',
      // Custom storage که Set را به Array تبدیل می‌کند
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          
          try {
            const { state } = JSON.parse(str);
            console.log('[FavoritesStore] Loading from localStorage:', state.favorites);
            
            return {
              state: {
                ...state,
                favorites: new Set(state.favorites || []),
              },
            };
          } catch (e) {
            console.error('[FavoritesStore] Failed to parse localStorage:', e);
            return null;
          }
        },
        setItem: (name, newValue) => {
          const { state } = newValue;
          const favoritesArray = Array.from(state.favorites);
          console.log('[FavoritesStore] Saving to localStorage:', favoritesArray);
          
          const str = JSON.stringify({
            state: {
              ...state,
              favorites: favoritesArray,
            },
          });
          
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
