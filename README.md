# Atmosphere - Lightweight Weather Web Application

A modern, responsive, mobile-first weather web application powered by the free Open-Meteo API. Built with Vanilla JavaScript (ESModules), Vite, and Vitest.

---

## 🌟 Features

1. **Location Handling & Search**:
   - Live search with Open-Meteo geocoding integration and debounced autocomplete suggestions.
   - **"Use My Location"** button leveraging the browser's `navigator.geolocation` API with reverse geocoding.
2. **Current Weather Display**:
   - Current temperature, apparent ("feels like") temperature.
   - Humidity, wind speed, wind direction, and barometric surface pressure.
   - WMO weather condition code interpretation with custom SVG weather icons.
3. **Hourly & 5-Day Forecast**:
   - 12-hour horizontal hourly forecast timeline with precipitation probabilities.
   - 5-Day daily forecast cards showing daily high/low temperatures, precipitation chances, and weather conditions.
4. **Dynamic Themes**:
   - Adaptive background gradient themes based on current weather condition (Clear Day, Clear Night, Cloudy, Rainy, Snowy, Stormy, Foggy).
5. **Unit Switching (°C / °F)**:
   - Instant client-side switching between Celsius and Fahrenheit without requiring redundant network requests.
   - Persistent unit preferences saved in `localStorage`.
6. **State & Resilience**:
   - Shimmer skeleton loading indicator for smooth layout transitions.
   - User-friendly error messaging for invalid queries, network timeouts, and denied geolocation permissions.
   - Recent search history chips (last 5 searched locations) saved in `localStorage` for one-click reloading.

---

## 🏗️ Architecture

The codebase follows a modular design:

- [`src/modules/conversions.js`](file:///c:/Users/Austi/OneDrive/CodingProjects/AGY/weather-app/src/modules/conversions.js): Temperature and wind speed conversion formulas and date formatting.
- [`src/modules/weatherCodes.js`](file:///c:/Users/Austi/OneDrive/CodingProjects/AGY/weather-app/src/modules/weatherCodes.js): WMO weather code dictionary, theme associations, and inline SVG weather icons.
- [`src/modules/api.js`](file:///c:/Users/Austi/OneDrive/CodingProjects/AGY/weather-app/src/modules/api.js): Open-Meteo Geocoding and Weather forecast API callers with fallback data parsing.
- [`src/modules/storage.js`](file:///c:/Users/Austi/OneDrive/CodingProjects/AGY/weather-app/src/modules/storage.js): Safe `localStorage` wrappers for unit preferences and search history (FIFO / MRU capping at 5).
- [`src/modules/ui.js`](file:///c:/Users/Austi/OneDrive/CodingProjects/AGY/weather-app/src/modules/ui.js): DOM manipulation, theme switching, autocomplete suggestions, and component rendering.
- [`src/modules/app.js`](file:///c:/Users/Austi/OneDrive/CodingProjects/AGY/weather-app/src/modules/app.js): Application lifecycle orchestration, geolocation handlers, debounced inputs, and state management.

---

## 🧪 Testing

Comprehensive unit tests are written with Vitest:

- [`tests/conversions.test.js`](file:///c:/Users/Austi/OneDrive/CodingProjects/AGY/weather-app/tests/conversions.test.js): Verifies temperature formulas (°C ↔ °F), formatting, and edge cases.
- [`tests/api.test.js`](file:///c:/Users/Austi/OneDrive/CodingProjects/AGY/weather-app/tests/api.test.js): Tests API payload parsing, fallback values for missing/partial fields, and network error handling.
- [`tests/storage.test.js`](file:///c:/Users/Austi/OneDrive/CodingProjects/AGY/weather-app/tests/storage.test.js): Validates storage persistence, search history deduplication, and max 5 item constraints.

### Run Tests:
```bash
npm run test
```

### Build for Production:
```bash
npm run build
```
