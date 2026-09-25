/**
 * API service for Open-Meteo Geocoding and Weather data
 */

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const REVERSE_GEO_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

/**
 * Custom API Error class
 */
export class WeatherApiError extends Error {
  constructor(message, type = 'GENERAL_ERROR') {
    super(message);
    this.name = 'WeatherApiError';
    this.type = type;
  }
}

/**
 * Searches for locations matching a query text
 * @param {string} query 
 * @param {number} [count=5]
 * @returns {Promise<Array<{ id: number, name: string, latitude: number, longitude: number, country: string, admin1: string }>>}
 */
export async function searchLocation(query, count = 5) {
  const trimmed = (query || '').trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  const url = `${GEOCODING_BASE_URL}?name=${encodeURIComponent(trimmed)}&count=${count}&language=en&format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new WeatherApiError(`Geocoding failed with status ${response.status}`, 'NETWORK_ERROR');
    }
    const data = await response.json();
    if (!data || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map(item => ({
      id: item.id || `${item.latitude}-${item.longitude}`,
      name: item.name || 'Unknown Location',
      latitude: item.latitude,
      longitude: item.longitude,
      country: item.country || '',
      countryCode: item.country_code || '',
      admin1: item.admin1 || ''
    }));
  } catch (err) {
    if (err instanceof WeatherApiError) throw err;
    throw new WeatherApiError('Failed to search location. Please check your internet connection.', 'NETWORK_ERROR');
  }
}

/**
 * Reverse geocodes latitude and longitude to a human-readable city/region
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<{ name: string, country: string, admin1: string }>}
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const url = `${REVERSE_GEO_URL}?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const name = data.city || data.locality || data.principalSubdivision || 'Your Location';
      return {
        name,
        country: data.countryName || '',
        admin1: data.principalSubdivision || ''
      };
    }
  } catch {
    // Fallback if reverse geocode is unavailable
  }

  return {
    name: `Location (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
    country: '',
    admin1: ''
  };
}

/**
 * Fetches current weather and 5-day daily forecast from Open-Meteo
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object>}
 */
export async function fetchWeatherData(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
    throw new WeatherApiError('Invalid coordinates provided.', 'INVALID_PARAMS');
  }

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'surface_pressure'
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'precipitation_sum',
      'sunrise',
      'sunset',
      'uv_index_max'
    ].join(','),
    hourly: [
      'temperature_2m',
      'weather_code',
      'precipitation_probability'
    ].join(','),
    timezone: 'auto',
    forecast_days: '6'
  });

  const url = `${WEATHER_BASE_URL}?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new WeatherApiError(`Weather service error: ${response.status}`, 'API_ERROR');
    }
    const rawData = await response.json();
    return parseWeatherData(rawData);
  } catch (err) {
    if (err instanceof WeatherApiError) throw err;
    throw new WeatherApiError('Unable to fetch weather data. Please check your network connection.', 'NETWORK_ERROR');
  }
}

/**
 * Safely parses raw Open-Meteo API response with fallback logic
 * @param {Object} data 
 * @returns {Object} Structured weather object
 */
export function parseWeatherData(data) {
  if (!data || typeof data !== 'object') {
    throw new WeatherApiError('Received empty or invalid weather data structure.', 'INVALID_DATA');
  }

  const current = data.current || {};
  const daily = data.daily || {};
  const hourly = data.hourly || {};

  // Parse current conditions with safe defaults
  const parsedCurrent = {
    time: current.time || new Date().toISOString(),
    temperature: typeof current.temperature_2m === 'number' ? current.temperature_2m : 0,
    apparentTemperature: typeof current.apparent_temperature === 'number' ? current.apparent_temperature : (current.temperature_2m || 0),
    relativeHumidity: typeof current.relative_humidity_2m === 'number' ? current.relative_humidity_2m : 0,
    isDay: typeof current.is_day === 'number' ? Boolean(current.is_day) : true,
    precipitation: typeof current.precipitation === 'number' ? current.precipitation : 0,
    weatherCode: typeof current.weather_code === 'number' ? current.weather_code : 0,
    windSpeed: typeof current.wind_speed_10m === 'number' ? current.wind_speed_10m : 0,
    windDirection: typeof current.wind_direction_10m === 'number' ? current.wind_direction_10m : 0,
    surfacePressure: typeof current.surface_pressure === 'number' ? current.surface_pressure : 1013
  };

  // Parse daily forecast (up to 5-6 days)
  const parsedDaily = [];
  const timeList = Array.isArray(daily.time) ? daily.time : [];
  
  for (let i = 0; i < timeList.length; i++) {
    parsedDaily.push({
      date: timeList[i],
      weatherCode: Array.isArray(daily.weather_code) && typeof daily.weather_code[i] === 'number' ? daily.weather_code[i] : 0,
      temperatureMax: Array.isArray(daily.temperature_2m_max) && typeof daily.temperature_2m_max[i] === 'number' ? daily.temperature_2m_max[i] : 0,
      temperatureMin: Array.isArray(daily.temperature_2m_min) && typeof daily.temperature_2m_min[i] === 'number' ? daily.temperature_2m_min[i] : 0,
      precipitationProbability: Array.isArray(daily.precipitation_probability_max) && typeof daily.precipitation_probability_max[i] === 'number' 
        ? daily.precipitation_probability_max[i] 
        : 0,
      precipitationSum: Array.isArray(daily.precipitation_sum) && typeof daily.precipitation_sum[i] === 'number'
        ? daily.precipitation_sum[i]
        : 0,
      uvIndexMax: Array.isArray(daily.uv_index_max) && typeof daily.uv_index_max[i] === 'number'
        ? daily.uv_index_max[i]
        : 0,
      sunrise: Array.isArray(daily.sunrise) ? daily.sunrise[i] : '',
      sunset: Array.isArray(daily.sunset) ? daily.sunset[i] : ''
    });
  }

  // Parse next 24 hours hourly forecast (for subtle timeline view if available)
  const parsedHourly = [];
  const hourlyTimes = Array.isArray(hourly.time) ? hourly.time : [];
  const currentHourIndex = hourlyTimes.findIndex(t => t >= (current.time || ''));
  const startIndex = currentHourIndex >= 0 ? currentHourIndex : 0;
  
  for (let j = startIndex; j < Math.min(startIndex + 12, hourlyTimes.length); j++) {
    parsedHourly.push({
      time: hourlyTimes[j],
      temperature: Array.isArray(hourly.temperature_2m) && typeof hourly.temperature_2m[j] === 'number' ? hourly.temperature_2m[j] : 0,
      weatherCode: Array.isArray(hourly.weather_code) && typeof hourly.weather_code[j] === 'number' ? hourly.weather_code[j] : 0,
      precipitationProbability: Array.isArray(hourly.precipitation_probability) && typeof hourly.precipitation_probability[j] === 'number'
        ? hourly.precipitation_probability[j]
        : 0
    });
  }

  return {
    timezone: data.timezone || 'UTC',
    elevation: data.elevation || 0,
    current: parsedCurrent,
    daily: parsedDaily,
    hourly: parsedHourly
  };
}
