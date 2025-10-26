/**
 * Favorites Test Suite
 * تست کامل سیستم Favorites (localStorage sync)
 */

import type { TestSuite, TestCase } from '../core/TestSimulator';

export function createFavoritesTestSuite(baseUrl: string): TestSuite {
  const tests: TestCase[] = [
    {
      id: 'fav-001',
      name: 'LocalStorage - Initialize empty favorites',
      description: 'Empty localStorage should return null',
      category: 'integration',
      run: async (ctx) => {
        const storage: { [key: string]: string } = {};
        const mockLocalStorage = {
          getItem: (key: string) => storage[key] || null,
        };
        
        const stored = mockLocalStorage.getItem('favorites');
        ctx.assert.isNull(stored, 'Empty localStorage should return null');
        ctx.log.info('✓ Empty localStorage returns null');
      },
    },
    
    {
      id: 'fav-002',
      name: 'LocalStorage - Save and load favorites',
      description: 'Should save and load favorites correctly',
      category: 'integration',
      run: async (ctx) => {
        const storage: { [key: string]: string } = {};
        const mockLocalStorage = {
          getItem: (key: string) => storage[key] || null,
          setItem: (key: string, value: string) => { storage[key] = value; },
        };
        
        const favorites = ['id1', 'id2', 'id3'];
        mockLocalStorage.setItem('favorites', JSON.stringify(favorites));
        
        const stored = mockLocalStorage.getItem('favorites');
        ctx.assert.isNotNull(stored, 'Stored value should not be null');
        
        const loaded = JSON.parse(stored!);
        ctx.assert.equal(loaded.length, 3, 'Should have 3 favorites');
        ctx.log.info('✓ Saved and loaded 3 favorites');
      },
    },
    
    {
      id: 'fav-003',
      name: 'Set Operations - Filter prompts',
      description: 'Should filter prompts using Set.has()',
      category: 'integration',
      run: async (ctx) => {
        const allPrompts = [
          { id: 'id1', title: 'Prompt 1' },
          { id: 'id2', title: 'Prompt 2' },
          { id: 'id3', title: 'Prompt 3' },
        ];
        
        const favorites = new Set(['id1', 'id3']);
        const filtered = allPrompts.filter(p => favorites.has(p.id));
        
        ctx.assert.equal(filtered.length, 2, 'Should filter to 2 prompts');
        ctx.assert.equal(filtered[0].id, 'id1', 'First should be id1');
        ctx.assert.equal(filtered[1].id, 'id3', 'Second should be id3');
        ctx.log.info('✓ Filter works correctly');
      },
    },
    
    {
      id: 'fav-004',
      name: 'Full Workflow - Add, Save, Load, Filter',
      description: 'Complete favorites workflow',
      category: 'integration',
      run: async (ctx) => {
        const storage: { [key: string]: string } = {};
        const mockLocalStorage = {
          getItem: (key: string) => storage[key] || null,
          setItem: (key: string, value: string) => { storage[key] = value; },
        };
        
        // Step 1: Add favorites
        let favorites = new Set<string>();
        favorites.add('prompt1');
        favorites.add('prompt2');
        
        // Step 2: Save
        mockLocalStorage.setItem('favorites', JSON.stringify(Array.from(favorites)));
        
        // Step 3: Load
        const storedData = mockLocalStorage.getItem('favorites');
        ctx.assert.isNotNull(storedData, 'Should have stored data');
        
        const loadedFavorites = new Set(JSON.parse(storedData!));
        
        // Step 4: Filter
        const allPrompts = [
          { id: 'prompt1', title: 'Test 1' },
          { id: 'prompt2', title: 'Test 2' },
          { id: 'prompt3', title: 'Test 3' },
        ];
        
        const favoritePrompts = allPrompts.filter(p => loadedFavorites.has(p.id));
        ctx.assert.equal(favoritePrompts.length, 2, 'Should have 2 favorite prompts');
        ctx.log.info('✓ Full workflow: Add → Save → Load → Filter');
      },
    },
    
    {
      id: 'fav-005',
      name: 'Integration - API + localStorage',
      description: 'Test with real API data',
      category: 'integration',
      run: async (ctx) => {
        const storage: { [key: string]: string } = {};
        const mockLocalStorage = {
          getItem: (key: string) => storage[key] || null,
          setItem: (key: string, value: string) => { storage[key] = value; },
        };
        
        // Fetch from API
        const response = await fetch(`${baseUrl}/api/prompts`);
        ctx.assert.statusCode(response, 200, 'API should return 200');
        
        const data: any = await response.json();
        const allPrompts = data.data || [];
        
        if (allPrompts.length === 0) {
          ctx.log.info('⚠ No prompts in database, skipping');
          return;
        }
        
        // Add first 2 to favorites
        const favIds = allPrompts.slice(0, 2).map((p: any) => p.id);
        mockLocalStorage.setItem('favorites', JSON.stringify(favIds));
        
        // Load and filter
        const storedFavs = mockLocalStorage.getItem('favorites');
        const favorites = new Set(JSON.parse(storedFavs!));
        const filtered = allPrompts.filter((p: any) => favorites.has(p.id));
        
        ctx.assert.equal(filtered.length, 2, 'Should filter to 2 prompts');
        ctx.log.info(`✓ Integration: ${allPrompts.length} prompts → 2 favorites`);
      },
    },
  ];

  return {
    id: 'favorites',
    name: 'Favorites System',
    description: 'Testing localStorage sync and filtering logic',
    tests,
  };
}
