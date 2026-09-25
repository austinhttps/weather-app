/**
 * Temperature, wind, pressure, UV, and unit conversion utilities
 */

/**
 * Converts Celsius to Fahrenheit
 * @param {number} celsius 
 * @returns {number} Fahrenheit rounded to 1 decimal place
 */
export function celsiusToFahrenheit(celsius) {
  if (typeof celsius !== 'number' || isNaN(celsius)) return 0;
  return Math.round(((celsius * 9) / 5 + 32) * 10) / 10;
}

/**
 * Converts Fahrenheit to Celsius
 * @param {number} fahrenheit 
 * @returns {number} Celsius rounded to 1 decimal place
 */
export function fahrenheitToCelsius(fahrenheit) {
  if (typeof fahrenheit !== 'number' || isNaN(fahrenheit)) return 0;
  return Math.round((((fahrenheit - 32) * 5) / 9) * 10) / 10;
}

/**
 * Formats temperature based on the selected unit
 * @param {number} tempInCelsius - Temperature in Celsius
 * @param {'C'|'F'} unit - Target unit ('C' or 'F')
 * @param {boolean} includeUnit - Whether to include the unit symbol
 * @returns {string} Formatted temperature string
 */
export function formatTemperature(tempInCelsius, unit = 'F', includeUnit = true) {
  if (typeof tempInCelsius !== 'number' || isNaN(tempInCelsius)) {
    return includeUnit ? `--°${unit}` : '--';
  }

  const value = unit === 'F' ? celsiusToFahrenheit(tempInCelsius) : Math.round(tempInCelsius * 10) / 10;
  const rounded = Math.round(value);
  return includeUnit ? `${rounded}°${unit}` : `${rounded}°`;
}

/**
 * Converts km/h to mph
 * @param {number} kmh 
 * @returns {number} mph rounded to 1 decimal place
 */
export function kmhToMph(kmh) {
  if (typeof kmh !== 'number' || isNaN(kmh)) return 0;
  return Math.round((kmh * 0.621371) * 10) / 10;
}

/**
 * Formats wind speed based on selected unit
 * @param {number} speedKmh - Speed in km/h
 * @param {'C'|'F'} unit - Unit system ('C' for metric, 'F' for imperial)
 * @returns {string} Formatted wind speed
 */
export function formatWindSpeed(speedKmh, unit = 'F') {
  if (typeof speedKmh !== 'number' || isNaN(speedKmh)) return '--';
  if (unit === 'F') {
    const mph = Math.round(kmhToMph(speedKmh));
    return `${mph} mph`;
  }
  const kmh = Math.round(speedKmh);
  return `${kmh} km/h`;
}

/**
 * Converts wind direction degrees to 16-point compass letters
 * @param {number} degrees 
 * @returns {string} e.g. "N", "NE", "SSW", "NW"
 */
export function getWindCompassDirection(degrees) {
  if (typeof degrees !== 'number' || isNaN(degrees)) return '';
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ];
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

/**
 * Formats wind direction with both degrees and compass direction
 * @param {number} degrees 
 * @returns {string} e.g. "180° S"
 */
export function formatWindDirection(degrees) {
  if (typeof degrees !== 'number' || isNaN(degrees)) return '--';
  const compass = getWindCompassDirection(degrees);
  return `${Math.round(degrees)}° ${compass}`;
}

/**
 * Formats barometric surface pressure
 * @param {number} pressureHpa - Pressure in hPa / mbar
 * @param {'C'|'F'} unit - 'C' for hPa, 'F' for inHg
 * @returns {string} Formatted pressure with unit
 */
export function formatPressure(pressureHpa, unit = 'F') {
  if (typeof pressureHpa !== 'number' || isNaN(pressureHpa)) return '--';
  if (unit === 'F') {
    // 1 hPa = 0.029529983071445 inHg
    const inHg = (pressureHpa * 0.02953).toFixed(2);
    return `${inHg} inHg`;
  }
  return `${Math.round(pressureHpa)} hPa`;
}

/**
 * Returns UV index risk level category description
 * @param {number} uv 
 * @returns {{ label: string, color: string }}
 */
export function getUvRiskLevel(uv) {
  if (typeof uv !== 'number' || isNaN(uv) || uv < 0) return { label: 'Low', color: '#4ade80' };
  if (uv < 3) return { label: 'Low', color: '#4ade80' };
  if (uv < 6) return { label: 'Moderate', color: '#facc15' };
  if (uv < 8) return { label: 'High', color: '#fb923c' };
  if (uv < 11) return { label: 'Very High', color: '#f87171' };
  return { label: 'Extreme', color: '#c084fc' };
}

/**
 * Calculates High, Low (daytime), and Median UV metrics from an array of hourly UV values
 * @param {number[]} uvList 
 * @param {number} [fallbackMax=0]
 * @returns {{ high: number, low: number, median: number, label: string }}
 */
export function calculateUvStats(uvList, fallbackMax = 0) {
  if (!Array.isArray(uvList) || uvList.length === 0) {
    const high = Math.round(fallbackMax * 10) / 10;
    return {
      high,
      low: 0,
      median: Math.round((high / 2) * 10) / 10,
      label: getUvRiskLevel(high).label
    };
  }

  const valid = uvList.filter(v => typeof v === 'number' && !isNaN(v));
  if (valid.length === 0) {
    const high = Math.round(fallbackMax * 10) / 10;
    return { high, low: 0, median: 0, label: getUvRiskLevel(high).label };
  }

  const high = Math.max(...valid, fallbackMax);
  // Daytime UV values (> 0)
  const daytimeUv = valid.filter(v => v > 0.2);
  const low = daytimeUv.length > 0 ? Math.min(...daytimeUv) : 0;
  
  // Median calculation
  let median = 0;
  if (daytimeUv.length > 0) {
    const sorted = [...daytimeUv].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    median = high > 0 ? high / 2 : 0;
  }

  return {
    high: Math.round(high * 10) / 10,
    low: Math.round(low * 10) / 10,
    median: Math.round(median * 10) / 10,
    label: getUvRiskLevel(high).label
  };
}

/**
 * Formats date string to day of week
 * @param {string} dateString - ISO Date string (YYYY-MM-DD)
 * @param {string} [locale='en-US']
 * @returns {string} e.g. "Mon", "Today"
 */
export function formatDayOfWeek(dateString, locale = 'en-US') {
  if (!dateString) return '';
  const targetDate = new Date(`${dateString}T00:00:00`);
  const today = new Date();
  
  if (
    targetDate.getFullYear() === today.getFullYear() &&
    targetDate.getMonth() === today.getMonth() &&
    targetDate.getDate() === today.getDate()
  ) {
    return 'Today';
  }

  return targetDate.toLocaleDateString(locale, { weekday: 'short' });
}

/**
 * Formats date string to formatted date
 * @param {string} dateString - ISO Date string
 * @param {string} [locale='en-US']
 * @returns {string} e.g. "Sep 25"
 */
export function formatShortDate(dateString, locale = 'en-US') {
  if (!dateString) return '';
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}
