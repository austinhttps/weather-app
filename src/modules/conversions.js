/**
 * Temperature, wind, pressure, and unit conversion utilities
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
