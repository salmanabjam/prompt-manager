/**
 * Migration Script - برای انتقال favorites از localStorage قدیمی به Zustand
 * این فقط یکبار اجرا می‌شود
 */

import { useFavoritesStore } from './favoritesStore';

export function migrateFavorites() {
  try {
    // چک کردن اینکه آیا قبلاً migrate شده یا نه
    const migrated = localStorage.getItem('favorites-migrated');
    if (migrated === 'true') {
      console.log('[Migration] Favorites already migrated');
      return;
    }

    // خواندن favorites قدیمی
    const oldFavorites = localStorage.getItem('favorites');
    if (oldFavorites) {
      console.log('[Migration] Found old favorites:', oldFavorites);
      
      const parsed = JSON.parse(oldFavorites);
      const store = useFavoritesStore.getState();
      
      // اضافه کردن به store جدید
      parsed.forEach((id: string) => {
        store.addFavorite(id);
      });
      
      console.log('[Migration] Migrated', parsed.length, 'favorites to Zustand');
      
      // حذف favorites قدیمی
      localStorage.removeItem('favorites');
    }
    
    // علامت‌گذاری که migration انجام شده
    localStorage.setItem('favorites-migrated', 'true');
    console.log('[Migration] Migration complete');
  } catch (error) {
    console.error('[Migration] Failed to migrate favorites:', error);
  }
}
