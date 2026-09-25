/**
 * Main Application Orchestrator
 */

import { searchLocation, reverseGeocode, fetchWeatherData } from './api.js';
import { getUnitPreference, setUnitPreference, getSearchHistory, addSearchHistory } from './storage.js';
import { WeatherUI } from './ui.js';

export class WeatherApp {
  constructor() {
    this.ui = new WeatherUI();
    this.currentUnit = getUnitPreference(); // Defaults to 'F'
    this.currentLocation = null;
    this.currentWeatherData = null;
    this.selectedDayIndex = 0; // 0 = Today
    this.debounceTimer = null;
  }

  /**
   * Initialize app events and request user's location on startup
   */
  async init() {
    this.setupEventListeners();
    this.ui.updateUnitToggle(this.currentUnit);
    this.renderHistory();

    // Priority 1 on startup: Attempt user's geolocation
    if (navigator.geolocation) {
      this.ui.showLoading();
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const locationInfo = await reverseGeocode(lat, lon);
            
            const userLocation = {
              name: locationInfo.name || 'Current Location',
              country: locationInfo.country,
              admin1: locationInfo.admin1,
              latitude: lat,
              longitude: lon
            };

            if (this.ui.searchInput) {
              this.ui.searchInput.value = userLocation.name;
            }

            await this.loadWeatherForLocation(userLocation, true);
          } catch {
            await this.loadFallbackLocation();
          }
        },
        async () => {
          // Geolocation was denied or unavailable -> gracefully load fallback
          await this.loadFallbackLocation();
        },
        {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 60000
        }
      );
    } else {
      await this.loadFallbackLocation();
    }
  }

  /**
   * Loads search history or default city when geolocation is denied or unavailable
   */
  async loadFallbackLocation() {
    const history = getSearchHistory();
    if (history.length > 0) {
      await this.loadWeatherForLocation(history[0], false);
    } else {
      await this.loadWeatherForLocation({
        name: 'Austin',
        country: 'United States',
        admin1: 'Texas',
        latitude: 30.2672,
        longitude: -97.7431
      }, false);
    }
  }

  /**
   * Setup UI event listeners
   */
  setupEventListeners() {
    // Search form submission
    this.ui.searchForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = this.ui.searchInput?.value.trim();
      if (!query) return;

      this.ui.hideSuggestions();
      await this.handleSearchQuery(query);
    });

    // Debounced search input suggestions
    this.ui.searchInput?.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearTimeout(this.debounceTimer);

      if (query.length < 2) {
        this.ui.hideSuggestions();
        return;
      }

      this.debounceTimer = setTimeout(async () => {
        try {
          const results = await searchLocation(query, 5);
          this.ui.renderSuggestions(results, async (selectedLocation) => {
            if (this.ui.searchInput) this.ui.searchInput.value = selectedLocation.name;
            this.selectedDayIndex = 0;
            await this.loadWeatherForLocation(selectedLocation, true);
          });
        } catch {
          // Ignore autocomplete errors silently
        }
      }, 300);
    });

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
      if (!this.ui.searchInput?.contains(e.target) && !this.ui.searchSuggestions?.contains(e.target)) {
        this.ui.hideSuggestions();
      }
    });

    // Geolocation "Use My Location" button
    this.ui.locationBtn?.addEventListener('click', () => {
      this.handleGeolocation();
    });

    // Unit toggle button
    this.ui.unitToggleBtn?.addEventListener('click', () => {
      this.toggleUnit();
    });

    // Error dismiss button
    this.ui.errorDismiss?.addEventListener('click', () => {
      this.ui.hideError();
    });
  }

  /**
   * Handles text query search
   * @param {string} query 
   */
  async handleSearchQuery(query) {
    this.ui.showLoading();
    try {
      const results = await searchLocation(query, 1);
      if (!results || results.length === 0) {
        this.ui.showError(`No locations found matching "${query}". Please check the spelling and try again.`);
        return;
      }

      const location = results[0];
      this.selectedDayIndex = 0;
      await this.loadWeatherForLocation(location, true);
    } catch (err) {
      this.ui.showError(err.message || 'Error finding location.');
    }
  }

  /**
   * Handles manual click on "Use My Location"
   */
  handleGeolocation() {
    if (!navigator.geolocation) {
      this.ui.showError('Geolocation is not supported by your browser.');
      return;
    }

    this.ui.showLoading();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const locationInfo = await reverseGeocode(lat, lon);
          
          const location = {
            name: locationInfo.name,
            country: locationInfo.country,
            admin1: locationInfo.admin1,
            latitude: lat,
            longitude: lon
          };

          if (this.ui.searchInput) {
            this.ui.searchInput.value = location.name;
          }

          this.selectedDayIndex = 0;
          await this.loadWeatherForLocation(location, true);
        } catch (err) {
          this.ui.showError(err.message || 'Failed to resolve your location.');
        }
      },
      (error) => {
        let message = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please allow location permissions in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is currently unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Request to get location timed out. Please try searching for your city.';
            break;
        }
        this.ui.showError(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  /**
   * Load weather for a given location object
   * @param {{ name: string, country?: string, admin1?: string, latitude: number, longitude: number }} location 
   * @param {boolean} [saveToHistory=true]
   */
  async loadWeatherForLocation(location, saveToHistory = true) {
    this.ui.showLoading();
    try {
      const weatherData = await fetchWeatherData(location.latitude, location.longitude);
      this.currentLocation = location;
      this.currentWeatherData = weatherData;

      if (saveToHistory) {
        addSearchHistory(location);
        this.renderHistory();
      }

      this.renderCurrentView();
    } catch (err) {
      this.ui.showError(err.message || 'Failed to load weather data. Please try again.');
    }
  }

  /**
   * Helper to render current weather view with day select callback
   */
  renderCurrentView() {
    if (this.currentLocation && this.currentWeatherData) {
      this.ui.renderWeather(
        this.currentLocation,
        this.currentWeatherData,
        this.currentUnit,
        this.selectedDayIndex,
        (newDayIndex) => {
          this.selectedDayIndex = newDayIndex;
          this.renderCurrentView();
        }
      );
    }
  }

  /**
   * Re-render search history tag buttons
   */
  renderHistory() {
    const history = getSearchHistory();
    this.ui.renderSearchHistory(history, async (item) => {
      if (this.ui.searchInput) this.ui.searchInput.value = item.name;
      this.selectedDayIndex = 0;
      await this.loadWeatherForLocation(item, true);
    });
  }

  /**
   * Toggle between Celsius and Fahrenheit
   */
  toggleUnit() {
    this.currentUnit = this.currentUnit === 'F' ? 'C' : 'F';
    setUnitPreference(this.currentUnit);
    this.ui.updateUnitToggle(this.currentUnit);

    // Instant re-render with new unit
    if (this.currentLocation && this.currentWeatherData) {
      this.renderCurrentView();
    }
  }
}
