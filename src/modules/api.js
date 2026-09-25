/**
 * API service for Open-Meteo Geocoding and Weather data
 */

import { calculateUvStats } from './conversions.js';

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const BIGDATACLOUD_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

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
 * Clean and filter township/station artifacts from reverse geocoding
 * @param {string} name 
 * @param {string} [fallbackTown] 
 * @param {string} [fallbackCounty] 
 * @returns {string}
 */
export function cleanLocationName(name, fallbackTown = '', fallbackCounty = '') {
  if (!name) return fallbackTown || fallbackCounty || 'Current Location';
  
  // Detect township / weather station / survey division artifacts
  const isArtifact = /\b(township|station|precinct|district|ward|unincorporated|cadastral)\b/i.test(name);
  if (isArtifact) {
    if (fallbackTown && !/\b(township|station|precinct)\b/i.test(fallbackTown)) {
      return fallbackTown;
    }
    if (fallbackCounty && !/\b(township|station)\b/i.test(fallbackCounty)) {
      return fallbackCounty;
    }
    // Clean string directly (e.g. "Township 3-Boone Station" -> "Boone")
    const cleaned = name
      .replace(/township\s*\d*[-,\s]*/gi, '')
      .replace(/\s*station\b/gi, '')
      .trim();
    if (cleaned.length > 2) return cleaned;
    return fallbackCounty || 'Local Area';
  }
  return name;
}

/**
 * Searches for locations matching a query text
 * @param {string} query 
 * @param {number} [count=5]
 * @returns {Promise<Array<{ id: number|string, name: string, latitude: number, longitude: number, country: string, admin1: string }>>}
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
 * Reverse geocodes latitude and longitude to a genuine human-readable town/city name
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<{ name: string, country: string, admin1: string }>}
 */
export async function reverseGeocode(latitude, longitude) {
  // 1. Nominatim lookup with address details (prioritizing incorporated city/town/village)
  try {
    const nomUrl = `${NOMINATIM_URL}?lat=${latitude}&lon=${longitude}&format=json&zoom=13&addressdetails=1`;
    const response = await fetch(nomUrl, {
      headers: { 'Accept-Language': 'en' }
    });
    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || '';
      const county = addr.county || '';
      const state = addr.state || '';
      const country = addr.country || '';

      const finalName = cleanLocationName(cityName, addr.town || addr.city, county);
      if (finalName && finalName !== 'Current Location') {
        return {
          name: finalName,
          country: country,
          admin1: state || county
        };
      }
    }
  } catch {
    // Fallback to next provider
  }

  // 2. BigDataCloud lookup
  try {
    const bdcUrl = `${BIGDATACLOUD_URL}?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const response = await fetch(bdcUrl);
    if (response.ok) {
      const data = await response.json();
      const city = data.city || data.locality || '';
      const county = data.localityInfo?.administrative?.find(a => a.adminLevel === 6)?.name || '';
      const finalName = cleanLocationName(city, data.locality, county);

      if (finalName && finalName !== 'Current Location') {
        return {
          name: finalName,
          country: data.countryName || '',
          admin1: data.principalSubdivision || county
        };
      }
    }
  } catch {
    // Fallback below
  }

  return {
    name: 'Local City',
    country: '',
    admin1: ''
  };
}

/**
 * Fetches current weather, UV index, and 7-day daily forecast + full hourly data from Open-Meteo
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
      'dew_point_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'surface_pressure',
      'uv_index'
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'precipitation_sum',
      'sunrise',
      'sunset',
      'uv_index_max',
      'wind_speed_10m_max'
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'dew_point_2m',
      'apparent_temperature',
      'weather_code',
      'precipitation_probability',
      'wind_speed_10m',
      'uv_index'
    ].join(','),
    timezone: 'auto',
    forecast_days: '7'
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
 * Safely parses raw Open-Meteo API response with fallback logic and computes UV statistics
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

  // Group all hourly data by date key (YYYY-MM-DD)
  const hourlyByDay = {};
  const hourlyTimes = Array.isArray(hourly.time) ? hourly.time : [];

  for (let h = 0; h < hourlyTimes.length; h++) {
    const rawTime = hourlyTimes[h];
    const dateKey = rawTime.slice(0, 10); // "YYYY-MM-DD"
    if (!hourlyByDay[dateKey]) {
      hourlyByDay[dateKey] = [];
    }

    hourlyByDay[dateKey].push({
      time: rawTime,
      temperature: Array.isArray(hourly.temperature_2m) && typeof hourly.temperature_2m[h] === 'number' ? hourly.temperature_2m[h] : 0,
      apparentTemperature: Array.isArray(hourly.apparent_temperature) && typeof hourly.apparent_temperature[h] === 'number' ? hourly.apparent_temperature[h] : 0,
      relativeHumidity: Array.isArray(hourly.relative_humidity_2m) && typeof hourly.relative_humidity_2m[h] === 'number' ? hourly.relative_humidity_2m[h] : 0,
      dewPoint: Array.isArray(hourly.dew_point_2m) && typeof hourly.dew_point_2m[h] === 'number' ? hourly.dew_point_2m[h] : 0,
      weatherCode: Array.isArray(hourly.weather_code) && typeof hourly.weather_code[h] === 'number' ? hourly.weather_code[h] : 0,
      precipitationProbability: Array.isArray(hourly.precipitation_probability) && typeof hourly.precipitation_probability[h] === 'number'
        ? hourly.precipitation_probability[h]
        : 0,
      windSpeed: Array.isArray(hourly.wind_speed_10m) && typeof hourly.wind_speed_10m[h] === 'number' ? hourly.wind_speed_10m[h] : 0,
      uvIndex: Array.isArray(hourly.uv_index) && typeof hourly.uv_index[h] === 'number' ? hourly.uv_index[h] : 0
    });
  }

  // Parse today's UV stats
  const todayKey = (current.time || '').slice(0, 10);
  const todayHourly = hourlyByDay[todayKey] || [];
  const todayUvValues = todayHourly.map(h => h.uvIndex);
  const todayUvStats = calculateUvStats(todayUvValues, typeof current.uv_index === 'number' ? current.uv_index : 0);

  // Parse current conditions with safe defaults
  const parsedCurrent = {
    time: current.time || new Date().toISOString(),
    temperature: typeof current.temperature_2m === 'number' ? current.temperature_2m : 0,
    apparentTemperature: typeof current.apparent_temperature === 'number' ? current.apparent_temperature : (current.temperature_2m || 0),
    relativeHumidity: typeof current.relative_humidity_2m === 'number' ? current.relative_humidity_2m : 0,
    dewPoint: typeof current.dew_point_2m === 'number' ? current.dew_point_2m : ((current.temperature_2m || 0) - ((100 - (current.relative_humidity_2m || 0)) / 5)),
    isDay: typeof current.is_day === 'number' ? Boolean(current.is_day) : true,
    precipitation: typeof current.precipitation === 'number' ? current.precipitation : 0,
    weatherCode: typeof current.weather_code === 'number' ? current.weather_code : 0,
    windSpeed: typeof current.wind_speed_10m === 'number' ? current.wind_speed_10m : 0,
    windDirection: typeof current.wind_direction_10m === 'number' ? current.wind_direction_10m : 0,
    surfacePressure: typeof current.surface_pressure === 'number' ? current.surface_pressure : 1013,
    uvIndex: typeof current.uv_index === 'number' ? current.uv_index : todayUvStats.high,
    uvStats: todayUvStats
  };

  // Parse 7-day daily forecast
  const parsedDaily = [];
  const timeList = Array.isArray(daily.time) ? daily.time : [];
  
  for (let i = 0; i < timeList.length; i++) {
    const dateStr = timeList[i];
    const dayHourly = hourlyByDay[dateStr] || [];
    const dayUvValues = dayHourly.map(h => h.uvIndex);
    const dayMaxUv = Array.isArray(daily.uv_index_max) && typeof daily.uv_index_max[i] === 'number' ? daily.uv_index_max[i] : 0;
    const dayUvStats = calculateUvStats(dayUvValues, dayMaxUv);

    parsedDaily.push({
      date: dateStr,
      weatherCode: Array.isArray(daily.weather_code) && typeof daily.weather_code[i] === 'number' ? daily.weather_code[i] : 0,
      temperatureMax: Array.isArray(daily.temperature_2m_max) && typeof daily.temperature_2m_max[i] === 'number' ? daily.temperature_2m_max[i] : 0,
      temperatureMin: Array.isArray(daily.temperature_2m_min) && typeof daily.temperature_2m_min[i] === 'number' ? daily.temperature_2m_min[i] : 0,
      precipitationProbability: Array.isArray(daily.precipitation_probability_max) && typeof daily.precipitation_probability_max[i] === 'number' 
        ? daily.precipitation_probability_max[i] 
        : 0,
      precipitationSum: Array.isArray(daily.precipitation_sum) && typeof daily.precipitation_sum[i] === 'number'
        ? daily.precipitation_sum[i]
        : 0,
      uvIndexMax: dayMaxUv,
      uvStats: dayUvStats,
      sunrise: Array.isArray(daily.sunrise) ? daily.sunrise[i] : '',
      sunset: Array.isArray(daily.sunset) ? daily.sunset[i] : '',
      windSpeedMax: Array.isArray(daily.wind_speed_10m_max) && typeof daily.wind_speed_10m_max[i] === 'number' ? daily.wind_speed_10m_max[i] : 0,
      hourly: dayHourly
    });
  }

  return {
    timezone: data.timezone || 'UTC',
    elevation: data.elevation || 0,
    current: parsedCurrent,
    daily: parsedDaily,
    hourlyByDay: hourlyByDay
  };
}
