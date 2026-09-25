/**
 * UI Renderer and DOM Manipulation Module
 */

import { formatTemperature, formatWindSpeed, formatDayOfWeek, formatShortDate } from './conversions.js';
import { getWeatherInfo, getWeatherIconSvg } from './weatherCodes.js';

export class WeatherUI {
  constructor() {
    this.appContainer = document.getElementById('app');
    this.searchForm = document.getElementById('search-form');
    this.searchInput = document.getElementById('search-input');
    this.searchSuggestions = document.getElementById('search-suggestions');
    this.locationBtn = document.getElementById('location-btn');
    this.unitToggleBtn = document.getElementById('unit-toggle-btn');
    this.unitToggleC = document.getElementById('unit-c');
    this.unitToggleF = document.getElementById('unit-f');
    this.historyContainer = document.getElementById('search-history');
    this.weatherContent = document.getElementById('weather-content');
    this.loadingIndicator = document.getElementById('loading-state');
    this.errorBanner = document.getElementById('error-banner');
    this.errorMessage = document.getElementById('error-message');
    this.errorDismiss = document.getElementById('error-dismiss');
  }

  /**
   * Show loading skeleton/spinner
   */
  showLoading() {
    if (this.loadingIndicator) this.loadingIndicator.classList.remove('hidden');
    if (this.weatherContent) this.weatherContent.classList.add('hidden');
    this.hideError();
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    if (this.loadingIndicator) this.loadingIndicator.classList.add('hidden');
  }

  /**
   * Display error notification
   * @param {string} message 
   */
  showError(message) {
    this.hideLoading();
    if (this.errorMessage) this.errorMessage.textContent = message;
    if (this.errorBanner) this.errorBanner.classList.remove('hidden');
  }

  /**
   * Hide error banner
   */
  hideError() {
    if (this.errorBanner) this.errorBanner.classList.add('hidden');
  }

  /**
   * Update active state of unit toggle buttons
   * @param {'C'|'F'} unit 
   */
  updateUnitToggle(unit) {
    if (this.unitToggleC && this.unitToggleF) {
      if (unit === 'F') {
        this.unitToggleF.classList.add('active');
        this.unitToggleC.classList.remove('active');
        this.unitToggleBtn?.setAttribute('aria-label', 'Current unit: Fahrenheit. Click to switch to Celsius.');
      } else {
        this.unitToggleC.classList.add('active');
        this.unitToggleF.classList.remove('active');
        this.unitToggleBtn?.setAttribute('aria-label', 'Current unit: Celsius. Click to switch to Fahrenheit.');
      }
    }
  }

  /**
   * Render search history tags
   * @param {Array<{ name: string, country?: string, latitude: number, longitude: number }>} history 
   * @param {Function} onSelect 
   */
  renderSearchHistory(history, onSelect) {
    if (!this.historyContainer) return;
    this.historyContainer.innerHTML = '';

    if (!history || history.length === 0) {
      this.historyContainer.parentElement?.classList.add('hidden');
      return;
    }

    this.historyContainer.parentElement?.classList.remove('hidden');

    history.forEach(item => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'history-chip';
      const label = item.country ? `${item.name}, ${item.country}` : item.name;
      chip.innerHTML = `${getWeatherIconSvg('map-pin', 14)}<span>${label}</span>`;
      chip.addEventListener('click', () => onSelect(item));
      this.historyContainer.appendChild(chip);
    });
  }

  /**
   * Render autocomplete / geocoding search suggestions dropdown
   * @param {Array<Object>} results 
   * @param {Function} onSelect 
   */
  renderSuggestions(results, onSelect) {
    if (!this.searchSuggestions) return;
    this.searchSuggestions.innerHTML = '';

    if (!results || results.length === 0) {
      this.searchSuggestions.classList.add('hidden');
      return;
    }

    results.forEach(item => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      const subtitle = [item.admin1, item.country].filter(Boolean).join(', ');
      li.innerHTML = `
        <span class="suggestion-main">${item.name}</span>
        ${subtitle ? `<span class="suggestion-sub">${subtitle}</span>` : ''}
      `;
      li.addEventListener('click', () => {
        this.searchSuggestions.classList.add('hidden');
        onSelect(item);
      });
      this.searchSuggestions.appendChild(li);
    });

    this.searchSuggestions.classList.remove('hidden');
  }

  /**
   * Hide search suggestions
   */
  hideSuggestions() {
    if (this.searchSuggestions) {
      this.searchSuggestions.classList.add('hidden');
    }
  }

  /**
   * Renders the complete weather dashboard
   * @param {Object} location - { name, country, admin1 }
   * @param {Object} weatherData - parsed weather data
   * @param {'C'|'F'} unit - current unit
   */
  renderWeather(location, weatherData, unit = 'C') {
    this.hideLoading();
    this.hideError();

    if (!weatherData || !weatherData.current) {
      this.showError('Unable to display weather data.');
      return;
    }

    const { current, daily, hourly } = weatherData;
    const weatherInfo = getWeatherInfo(current.weatherCode, current.isDay);

    // Apply dynamic body / container theme
    this.applyTheme(weatherInfo.theme);

    // Build location display string
    const locationParts = [location.name, location.admin1, location.country].filter(Boolean);
    const locationTitle = location.name;
    const locationSubtitle = [location.admin1, location.country].filter(Boolean).join(', ');

    if (this.weatherContent) {
      this.weatherContent.innerHTML = `
        <!-- Current Weather Hero Card -->
        <section class="current-weather-card">
          <div class="current-weather-header">
            <div class="location-badge">
              ${getWeatherIconSvg('map-pin', 18)}
              <div>
                <h1 class="location-name">${locationTitle}</h1>
                ${locationSubtitle ? `<p class="location-subtitle">${locationSubtitle}</p>` : ''}
              </div>
            </div>
            <div class="condition-badge">
              <span class="weather-icon-large">${getWeatherIconSvg(weatherInfo.icon, 56)}</span>
              <span class="condition-text">${weatherInfo.description}</span>
            </div>
          </div>

          <div class="current-temp-section">
            <div class="temp-display">
              <span class="temp-value">${formatTemperature(current.temperature, unit, false)}</span>
              <span class="temp-unit">°${unit}</span>
            </div>
            <div class="temp-feels-like">
              <span>Feels like <strong>${formatTemperature(current.apparentTemperature, unit, true)}</strong></span>
            </div>
          </div>

          <!-- Secondary Metrics Grid -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-icon">${getWeatherIconSvg('droplets', 20)}</div>
              <div class="metric-info">
                <span class="metric-label">Humidity</span>
                <span class="metric-value">${current.relativeHumidity}%</span>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">${getWeatherIconSvg('wind', 20)}</div>
              <div class="metric-info">
                <span class="metric-label">Wind Speed</span>
                <span class="metric-value">${formatWindSpeed(current.windSpeed, unit)}</span>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">${getWeatherIconSvg('compass', 20)}</div>
              <div class="metric-info">
                <span class="metric-label">Wind Direction</span>
                <span class="metric-value">${current.windDirection}°</span>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon">${getWeatherIconSvg('thermometer', 20)}</div>
              <div class="metric-info">
                <span class="metric-label">Pressure</span>
                <span class="metric-value">${Math.round(current.surfacePressure)} hPa</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Hourly Forecast Pills (Next 12 Hours) -->
        ${hourly && hourly.length > 0 ? `
          <section class="hourly-forecast-section">
            <h2 class="section-title">Hourly Forecast</h2>
            <div class="hourly-scroll-container">
              ${hourly.map((hour, idx) => {
                const hourDate = new Date(hour.time);
                const timeLabel = idx === 0 ? 'Now' : hourDate.toLocaleTimeString([], { hour: 'numeric', hour12: true });
                const hourInfo = getWeatherInfo(hour.weatherCode, true);
                return `
                  <div class="hourly-pill ${idx === 0 ? 'hourly-pill-current' : ''}">
                    <span class="hourly-time">${timeLabel}</span>
                    <span class="hourly-icon">${getWeatherIconSvg(hourInfo.icon, 24)}</span>
                    <span class="hourly-temp">${formatTemperature(hour.temperature, unit, true)}</span>
                    ${hour.precipitationProbability > 10 ? `
                      <span class="hourly-pop">💧${hour.precipitationProbability}%</span>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </section>
        ` : ''}

        <!-- 5-Day Forecast Section -->
        <section class="forecast-section">
          <h2 class="section-title">5-Day Forecast</h2>
          <div class="forecast-grid">
            ${(daily || []).slice(0, 5).map(day => {
              const dayInfo = getWeatherInfo(day.weatherCode, true);
              const dayName = formatDayOfWeek(day.date);
              const shortDate = formatShortDate(day.date);
              return `
                <div class="forecast-card">
                  <div class="forecast-day-header">
                    <span class="day-name">${dayName}</span>
                    <span class="day-date">${shortDate}</span>
                  </div>

                  <div class="forecast-icon-wrapper" title="${dayInfo.description}">
                    ${getWeatherIconSvg(dayInfo.icon, 36)}
                    <span class="forecast-condition">${dayInfo.description}</span>
                  </div>

                  <div class="forecast-temps">
                    <span class="temp-max" title="High">${formatTemperature(day.temperatureMax, unit, true)}</span>
                    <span class="temp-min" title="Low">${formatTemperature(day.temperatureMin, unit, true)}</span>
                  </div>

                  <div class="forecast-pop">
                    <span>💧 ${day.precipitationProbability}%</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      `;

      this.weatherContent.classList.remove('hidden');
    }
  }

  /**
   * Apply dynamic background theme class to body
   * @param {string} theme 
   */
  applyTheme(theme) {
    document.body.className = `theme-${theme}`;
  }
}
