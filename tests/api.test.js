import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseWeatherData, searchLocation, WeatherApiError } from '../src/modules/api.js';

describe('API Parsing and Service', () => {
  describe('parseWeatherData', () => {
    it('parses complete Open-Meteo response structure correctly', () => {
      const mockRawData = {
        timezone: 'America/New_York',
        elevation: 10,
        current: {
          time: '2026-09-25T12:00',
          temperature_2m: 23.5,
          apparent_temperature: 24.1,
          relative_humidity_2m: 65,
          is_day: 1,
          precipitation: 0.0,
          weather_code: 1,
          wind_speed_10m: 12.4,
          wind_direction_10m: 180,
          surface_pressure: 1015.2
        },
        daily: {
          time: ['2026-09-25', '2026-09-26', '2026-09-27'],
          weather_code: [1, 2, 61],
          temperature_2m_max: [25.0, 24.5, 20.1],
          temperature_2m_min: [15.2, 16.0, 14.8],
          precipitation_probability_max: [10, 20, 85],
          precipitation_sum: [0.0, 0.2, 8.5],
          uv_index_max: [6.5, 5.0, 3.2],
          sunrise: ['2026-09-25T06:45', '2026-09-26T06:46', '2026-09-27T06:47'],
          sunset: ['2026-09-25T18:50', '2026-09-26T18:48', '2026-09-27T18:46']
        },
        hourly: {
          time: ['2026-09-25T12:00', '2026-09-25T13:00'],
          temperature_2m: [23.5, 24.0],
          weather_code: [1, 1],
          precipitation_probability: [0, 5]
        }
      };

      const result = parseWeatherData(mockRawData);

      expect(result.timezone).toBe('America/New_York');
      expect(result.current.temperature).toBe(23.5);
      expect(result.current.apparentTemperature).toBe(24.1);
      expect(result.current.relativeHumidity).toBe(65);
      expect(result.current.isDay).toBe(true);
      expect(result.current.weatherCode).toBe(1);
      expect(result.current.windSpeed).toBe(12.4);

      expect(result.daily).toHaveLength(3);
      expect(result.daily[0].date).toBe('2026-09-25');
      expect(result.daily[0].temperatureMax).toBe(25.0);
      expect(result.daily[0].precipitationProbability).toBe(10);

      expect(result.hourly).toHaveLength(2);
      expect(result.hourly[0].temperature).toBe(23.5);
    });

    it('handles missing or partial fields gracefully with fallbacks', () => {
      const partialData = {
        current: {
          temperature_2m: 18.0
        },
        daily: {
          time: ['2026-09-25'],
          temperature_2m_max: [20.0]
        }
      };

      const result = parseWeatherData(partialData);

      expect(result.current.temperature).toBe(18.0);
      expect(result.current.apparentTemperature).toBe(18.0); // fallback to temperature_2m
      expect(result.current.relativeHumidity).toBe(0);
      expect(result.current.weatherCode).toBe(0);
      expect(result.current.windSpeed).toBe(0);
      expect(result.current.surfacePressure).toBe(1013); // fallback standard pressure

      expect(result.daily).toHaveLength(1);
      expect(result.daily[0].temperatureMax).toBe(20.0);
      expect(result.daily[0].temperatureMin).toBe(0);
      expect(result.daily[0].weatherCode).toBe(0);
      expect(result.daily[0].precipitationProbability).toBe(0);
    });

    it('throws WeatherApiError on null or non-object input', () => {
      expect(() => parseWeatherData(null)).toThrow(WeatherApiError);
      expect(() => parseWeatherData(undefined)).toThrow(WeatherApiError);
      expect(() => parseWeatherData('invalid json string')).toThrow(WeatherApiError);
    });
  });

  describe('searchLocation API integration', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns empty array when query is empty or too short', async () => {
      const res1 = await searchLocation('');
      const res2 = await searchLocation('a');
      expect(res1).toEqual([]);
      expect(res2).toEqual([]);
    });

    it('maps geocoding results into standardized structure', async () => {
      const mockGeocodeResponse = {
        results: [
          {
            id: 1234,
            name: 'Tokyo',
            latitude: 35.6895,
            longitude: 139.6917,
            country: 'Japan',
            country_code: 'JP',
            admin1: 'Tokyo'
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodeResponse
      });

      const results = await searchLocation('Tokyo');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Tokyo');
      expect(results[0].latitude).toBe(35.6895);
      expect(results[0].country).toBe('Japan');
    });

    it('handles empty results from geocoding API', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      const results = await searchLocation('NonExistentCityXYZ');
      expect(results).toEqual([]);
    });

    it('throws WeatherApiError when network request fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(searchLocation('London')).rejects.toThrow(WeatherApiError);
    });
  });
});
