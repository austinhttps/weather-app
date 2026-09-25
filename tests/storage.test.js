import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUnitPreference,
  setUnitPreference,
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
  STORAGE_KEYS
} from '../src/modules/storage.js';

describe('Storage Module', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Unit preference', () => {
    it('defaults to Fahrenheit if no preference stored', () => {
      expect(getUnitPreference()).toBe('F');
    });

    it('stores and retrieves Fahrenheit correctly', () => {
      setUnitPreference('F');
      expect(getUnitPreference()).toBe('F');
      expect(localStorage.getItem(STORAGE_KEYS.UNIT)).toBe('F');
    });

    it('stores and retrieves Celsius correctly', () => {
      setUnitPreference('C');
      expect(getUnitPreference()).toBe('C');
      expect(localStorage.getItem(STORAGE_KEYS.UNIT)).toBe('C');
    });

    it('defaults invalid values to Fahrenheit', () => {
      setUnitPreference('INVALID');
      expect(getUnitPreference()).toBe('F');
    });
  });

  describe('Search history', () => {
    it('returns empty array when history is empty', () => {
      expect(getSearchHistory()).toEqual([]);
    });

    it('adds valid location to search history', () => {
      const location = {
        name: 'Paris',
        country: 'France',
        latitude: 48.8566,
        longitude: 2.3522
      };

      const updated = addSearchHistory(location);
      expect(updated).toHaveLength(1);
      expect(updated[0].name).toBe('Paris');
      expect(getSearchHistory()).toHaveLength(1);
    });

    it('deduplicates identical search queries', () => {
      const loc1 = { name: 'Berlin', country: 'Germany', latitude: 52.52, longitude: 13.405 };
      const loc2 = { name: 'Berlin', country: 'Germany', latitude: 52.52, longitude: 13.405 };

      addSearchHistory(loc1);
      const updated = addSearchHistory(loc2);

      expect(updated).toHaveLength(1);
      expect(updated[0].name).toBe('Berlin');
    });

    it('limits search history to maximum 5 items (FIFO/MRU order)', () => {
      for (let i = 1; i <= 7; i++) {
        addSearchHistory({
          name: `City ${i}`,
          country: 'Country',
          latitude: 10 + i,
          longitude: 20 + i
        });
      }

      const history = getSearchHistory();
      expect(history).toHaveLength(5);
      // Most recently added is at index 0
      expect(history[0].name).toBe('City 7');
      expect(history[4].name).toBe('City 3');
    });

    it('clears search history properly', () => {
      addSearchHistory({ name: 'Rome', latitude: 41.9, longitude: 12.49 });
      expect(getSearchHistory()).toHaveLength(1);

      clearSearchHistory();
      expect(getSearchHistory()).toEqual([]);
    });

    it('ignores invalid location objects', () => {
      expect(addSearchHistory(null)).toEqual([]);
      expect(addSearchHistory({})).toEqual([]);
      expect(addSearchHistory({ name: 'Incomplete' })).toEqual([]);
    });
  });
});
