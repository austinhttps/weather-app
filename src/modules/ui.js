/**
 * UI Renderer and DOM Manipulation Module
 */

import {
  formatTemperature,
  formatWindSpeed,
  formatWindDirection,
  formatPressure,
  formatDayOfWeek,
  formatShortDate
} from './conversions.js';
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

    this.selectedDayIndex = 0; // 0 = Today
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
   * @param {'C'|'F'} unit - current unit ('C' or 'F')
   * @param {number} [selectedDayIndex=0] - index of selected daily forecast
   * @param {Function} [onDaySelect] - callback when another day is clicked
   */
  renderWeather(location, weatherData, unit = 'F', selectedDayIndex = 0, onDaySelect = null) {
    this.hideLoading();
    this.hideError();

    if (!weatherData || !weatherData.current) {
      this.showError('Unable to display weather data.');
      return;
    }

    this.selectedDayIndex = Math.min(Math.max(0, selectedDayIndex), (weatherData.daily?.length || 1) - 1);
    const { current, daily } = weatherData;
    const isToday = this.selectedDayIndex === 0;
    const activeDay = daily[this.selectedDayIndex] || daily[0] || {};
    const activeDayHourly = activeDay.hourly || [];

    // Weather condition info for the displayed view
    const weatherInfo = isToday 
      ? getWeatherInfo(current.weatherCode, current.isDay)
      : getWeatherInfo(activeDay.weatherCode, true);

    // Apply dynamic body / container theme
    this.applyTheme(weatherInfo.theme);

    // Build location display string
    const locationTitle = location.name;
    const locationSubtitle = [location.admin1, location.country].filter(Boolean).join(', ');
    const displayDate = isToday ? 'Current Conditions' : `${formatDayOfWeek(activeDay.date)}, ${formatShortDate(activeDay.date)}`;

    if (this.weatherContent) {
      this.weatherContent.innerHTML = `
        <!-- Main Weather Hero Card -->
        <section class="current-weather-card">
          <div class="current-weather-header">
            <div class="location-badge">
              ${getWeatherIconSvg('map-pin', 20)}
              <div>
                <h1 class="location-name">${locationTitle}</h1>
                <p class="location-subtitle">${locationSubtitle || displayDate}</p>
                ${!isToday ? `<span class="selected-day-tag">Viewing Forecast for ${formatDayOfWeek(activeDay.date)} (${formatShortDate(activeDay.date)})</span>` : ''}
              </div>
            </div>
            <div class="condition-badge">
              <span class="weather-icon-large">${getWeatherIconSvg(weatherInfo.icon, 58)}</span>
              <span class="condition-text">${weatherInfo.description}</span>
            </div>
          </div>

          <div class="current-temp-section">
            <div class="temp-display">
              ${isToday ? `
                <span class="temp-value">${formatTemperature(current.temperature, unit, false)}</span>
                <span class="temp-unit">°${unit}</span>
              ` : `
                <span class="temp-value">${formatTemperature(activeDay.temperatureMax, unit, false)}</span>
                <span class="temp-unit">°${unit}</span>
                <span class="temp-range-sub">/ ${formatTemperature(activeDay.temperatureMin, unit, true)}</span>
              `}
            </div>
            <div class="temp-feels-like">
              ${isToday ? `
                <span>Feels like <strong>${formatTemperature(current.apparentTemperature, unit, true)}</strong></span>
                <span class="temp-day-range"> • High: <strong>${formatTemperature(activeDay.temperatureMax, unit, true)}</strong> / Low: <strong>${formatTemperature(activeDay.temperatureMin, unit, true)}</strong></span>
              ` : `
                <span>Expected High: <strong>${formatTemperature(activeDay.temperatureMax, unit, true)}</strong> • Low: <strong>${formatTemperature(activeDay.temperatureMin, unit, true)}</strong></span>
              `}
            </div>
          </div>

          <!-- Secondary Metrics Grid -->
          <div class="metrics-grid">
            <!-- Humidity & Dew Point -->
            <div class="metric-card">
              <div class="metric-icon">${getWeatherIconSvg('droplets', 22)}</div>
              <div class="metric-info">
                <span class="metric-label">Humidity</span>
                <span class="metric-value">${isToday ? current.relativeHumidity : (activeDayHourly[12]?.relativeHumidity || 50)}%</span>
                <span class="metric-sub">Dew pt: ${formatTemperature(isToday ? current.dewPoint : (activeDayHourly[12]?.dewPoint || 0), unit, true)}</span>
              </div>
            </div>

            <!-- Wind Speed & Lettered Direction -->
            <div class="metric-card">
              <div class="metric-icon">${getWeatherIconSvg('wind', 22)}</div>
              <div class="metric-info">
                <span class="metric-label">Wind</span>
                <span class="metric-value">${formatWindSpeed(isToday ? current.windSpeed : (activeDay.windSpeedMax || 0), unit)}</span>
                <span class="metric-sub">${isToday ? formatWindDirection(current.windDirection) : 'Max daily gust'}</span>
              </div>
            </div>

            <!-- Precipitation Chance & Sum -->
            <div class="metric-card">
              <div class="metric-icon">${getWeatherIconSvg('cloud-rain', 22)}</div>
              <div class="metric-info">
                <span class="metric-label">Precipitation</span>
                <span class="metric-value">${activeDay.precipitationProbability}%</span>
                <span class="metric-sub">${activeDay.precipitationSum ? `${activeDay.precipitationSum} mm rain` : 'No rain expected'}</span>
              </div>
            </div>

            <!-- Barometric Surface Pressure (with unit conversion) -->
            <div class="metric-card">
              <div class="metric-icon">${getWeatherIconSvg('thermometer', 22)}</div>
              <div class="metric-info">
                <span class="metric-label">Pressure</span>
                <span class="metric-value">${formatPressure(current.surfacePressure, unit)}</span>
                <span class="metric-sub">UV Index: ${activeDay.uvIndexMax || 0}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 24-Hour Forecast Timeline for the Selected Day -->
        <section class="hourly-forecast-section">
          <div class="hourly-header">
            <h2 class="section-title">24-Hour Forecast (${formatDayOfWeek(activeDay.date)})</h2>
            <span class="hourly-tip">Scroll horizontally to view all 24 hours</span>
          </div>
          <div class="hourly-scroll-container">
            ${activeDayHourly && activeDayHourly.length > 0 ? activeDayHourly.map((hour, idx) => {
              const hourDate = new Date(hour.time);
              const hourNum = hourDate.getHours();
              const isNightTime = hourNum < 6 || hourNum >= 20;
              const timeLabel = hourDate.toLocaleTimeString([], { hour: 'numeric', hour12: true });
              const hourInfo = getWeatherInfo(hour.weatherCode, !isNightTime);
              
              // Check if current hour in today
              const isCurrentHour = isToday && new Date().getHours() === hourNum;

              return `
                <div class="hourly-pill ${isCurrentHour ? 'hourly-pill-current' : ''}">
                  <span class="hourly-time">${timeLabel}</span>
                  <span class="hourly-icon">${getWeatherIconSvg(hourInfo.icon, 24)}</span>
                  <span class="hourly-temp">${formatTemperature(hour.temperature, unit, true)}</span>
                  ${hour.precipitationProbability > 0 ? `
                    <span class="hourly-pop">💧${hour.precipitationProbability}%</span>
                  ` : `<span class="hourly-pop-empty">--</span>`}
                </div>
              `;
            }).join('') : `<p class="no-hourly">Hourly forecast unavailable for this day.</p>`}
          </div>
        </section>

        <!-- 7-Day Forecast Section (Clickable) -->
        <section class="forecast-section">
          <div class="forecast-header">
            <h2 class="section-title">7-Day Forecast</h2>
            <span class="forecast-instruction">Click any day to inspect its 24-hour forecast</span>
          </div>
          <div class="forecast-grid forecast-grid-7">
            ${(daily || []).slice(0, 7).map((day, idx) => {
              const dayInfo = getWeatherInfo(day.weatherCode, true);
              const dayName = formatDayOfWeek(day.date);
              const shortDate = formatShortDate(day.date);
              const isSelected = idx === this.selectedDayIndex;
              return `
                <button type="button" class="forecast-card ${isSelected ? 'forecast-card-active' : ''}" data-day-index="${idx}" aria-label="Forecast for ${dayName}, ${shortDate}">
                  <div class="forecast-day-header">
                    <span class="day-name">${dayName}</span>
                    <span class="day-date">${shortDate}</span>
                  </div>

                  <div class="forecast-icon-wrapper" title="${dayInfo.description}">
                    ${getWeatherIconSvg(dayInfo.icon, 34)}
                    <span class="forecast-condition">${dayInfo.description}</span>
                  </div>

                  <div class="forecast-temps">
                    <span class="temp-max" title="High">${formatTemperature(day.temperatureMax, unit, true)}</span>
                    <span class="temp-min" title="Low">${formatTemperature(day.temperatureMin, unit, true)}</span>
                  </div>

                  <div class="forecast-pop">
                    <span>💧 ${day.precipitationProbability}%</span>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </section>
      `;

      // Bind day click events
      const dayCards = this.weatherContent.querySelectorAll('.forecast-card');
      dayCards.forEach(card => {
        card.addEventListener('click', (e) => {
          const index = parseInt(card.getAttribute('data-day-index'), 10);
          if (!isNaN(index)) {
            if (onDaySelect) {
              onDaySelect(index);
            } else {
              this.renderWeather(location, weatherData, unit, index, onDaySelect);
            }
          }
        });
      });

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
