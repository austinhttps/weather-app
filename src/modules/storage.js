/**
 * LocalStorage management for unit preference and search history
 */

export const STORAGE_KEYS = {
  UNIT: 'weather_app_unit',
  HISTORY: 'weather_app_history'
};

const MAX_HISTORY_ITEMS = 5;

/**
 * Safely access localStorage
 * @returns {Storage|null}
 */
function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // localStorage might be blocked in some iframe/incognito modes
  }
  return null;
}

/**
 * Gets the preferred temperature unit ('C' or 'F')
 * @returns {'C'|'F'}
 */
export function getUnitPreference() {
  const storage = getStorage();
  if (!storage) return 'C';
  const unit = storage.getItem(STORAGE_KEYS.UNIT);
  return unit === 'F' ? 'F' : 'C';
}

/**
 * Sets the preferred temperature unit
 * @param {'C'|'F'} unit 
 */
export function setUnitPreference(unit) {
  const storage = getStorage();
  if (!storage) return;
  const validUnit = unit === 'F' ? 'F' : 'C';
  storage.setItem(STORAGE_KEYS.UNIT, validUnit);
}

/**
 * Gets the search history (up to 5 recent cities)
 * @returns {Array<{ name: string, country?: string, admin1?: string, latitude: number, longitude: number }>}
 */
export function getSearchHistory() {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(item => item && typeof item.latitude === 'number' && typeof item.longitude === 'number' && item.name);
    }
  } catch {
    return [];
  }
  return [];
}

/**
 * Adds a location to search history (deduplicating and capping at MAX_HISTORY_ITEMS)
 * @param {{ name: string, country?: string, admin1?: string, latitude: number, longitude: number }} location
 * @returns {Array<{ name: string, country?: string, admin1?: string, latitude: number, longitude: number }>}
 */
export function addSearchHistory(location) {
  if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number' || !location.name) {
    return getSearchHistory();
  }

  const storage = getStorage();
  const current = getSearchHistory();

  // Deduplicate by name and coordinates (approximate lat/lon equality)
  const filtered = current.filter(item => {
    const isSameName = item.name.trim().toLowerCase() === location.name.trim().toLowerCase();
    const isCloseCoords = Math.abs(item.latitude - location.latitude) < 0.05 && Math.abs(item.longitude - location.longitude) < 0.05;
    return !(isSameName || isCloseCoords);
  });

  const updated = [
    {
      name: location.name.trim(),
      country: location.country || '',
      admin1: location.admin1 || '',
      latitude: location.latitude,
      longitude: location.longitude
    },
    ...filtered
  ].slice(0, MAX_HISTORY_ITEMS);

  if (storage) {
    try {
      storage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    } catch {
      // Storage quota exceeded or disabled
    }
  }

  return updated;
}

/**
 * Clears search history
 */
export function clearSearchHistory() {
  const storage = getStorage();
  if (storage) {
    storage.removeItem(STORAGE_KEYS.HISTORY);
  }
}
