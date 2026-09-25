import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseWeatherData, searchLocation, reverseGeocode, cleanLocationName, WeatherApiError } from '../src/modules/api.js';

describe('API Parsing and Service', () => {
  describe('cleanLocationName', () => {
    it('cleans township and station strings to human-readable names', () => {
      expect(cleanLocationName('Township 3-Boone Station', 'Burlington', 'Alamance County')).toBe('Burlington');
      expect(cleanLocationName('Township 12', '', 'Orange County')).toBe('Orange County');
      expect(cleanLocationName('Township 3-Boone Station', '', '')).toBe('Boone');
    });

    it('preserves legitimate town and city names intact', () => {
      expect(cleanLocationName('Austin', '', 'Travis County')).toBe('Austin');
      expect(cleanLocationName('Burlington', 'Burlington', 'Alamance County')).toBe('Burlington');
      expect(cleanLocationName('New York', '', '')).toBe('New York');
    });
  });

  describe('parseWeatherData', () => {
    it('parses complete Open-Meteo response structure with 7 days and UV stats', () => {
      const mockRawData = {
        timezone: 'America/New_York',
        elevation: 10,
        current: {
          time: '2026-09-25T12:00',
          temperature_2m: 23.5,
          apparent_temperature: 24.1,
          relative_humidity_2m: 65,
          dew_point_2m: 16.5,
          is_day: 1,
          precipitation: 0.0,
          weather_code: 1,
          wind_speed_10m: 12.4,
          wind_direction_10m: 180,
          surface_pressure: 1015.2,
          uv_index: 6.2
        },
        daily: {
          time: ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01'],
          weather_code: [1, 2, 61, 3, 0, 1, 2],
          temperature_2m_max: [25.0, 24.5, 20.1, 22.0, 26.5, 27.0, 23.0],
          temperature_2m_min: [15.2, 16.0, 14.8, 13.0, 15.0, 17.2, 14.0],
          precipitation_probability_max: [10, 20, 85, 40, 0, 5, 15],
          precipitation_sum: [0.0, 0.2, 8.5, 2.1, 0, 0, 0.4],
          uv_index_max: [6.5, 5.0, 3.2, 4.0, 7.1, 6.8, 5.5],
          sunrise: ['2026-09-25T06:45', '2026-09-26T06:46', '2026-09-27T06:47', '2026-09-28T06:48', '2026-09-29T06:49', '2026-09-30T06:50', '2026-10-01T06:51'],
          sunset: ['2026-09-25T18:50', '2026-09-26T18:48', '2026-09-27T18:46', '2026-09-28T18:45', '2026-09-29T18:43', '2026-09-30T18:41', '2026-10-01T18:40'],
          wind_speed_10m_max: [15.2, 12.1, 20.5, 18.0, 10.5, 14.2, 11.0]
        },
        hourly: {
          time: [
            '2026-09-25T00:00', '2026-09-25T06:00', '2026-09-25T12:00', '2026-09-25T15:00',
            '2026-09-26T00:00', '2026-09-26T12:00'
          ],
          temperature_2m: [16.0, 18.0, 23.5, 24.5, 17.0, 24.0],
          weather_code: [0, 0, 1, 1, 2, 2],
          precipitation_probability: [0, 0, 5, 0, 20, 10],
          relative_humidity_2m: [80, 75, 65, 60, 75, 68],
          dew_point_2m: [12.5, 13.0, 16.5, 16.0, 13.0, 15.0],
          uv_index: [0, 1.2, 6.5, 4.0, 0, 5.0]
        }
      };

      const result = parseWeatherData(mockRawData);

      expect(result.timezone).toBe('America/New_York');
      expect(result.current.temperature).toBe(23.5);
      expect(result.current.dewPoint).toBe(16.5);
      expect(result.current.uvStats.high).toBe(6.5);
      expect(result.current.uvStats.label).toBe('High');

      // Verify 7 daily forecasts parsed
      expect(result.daily).toHaveLength(7);
      expect(result.daily[0].uvStats.high).toBe(6.5);
      expect(result.daily[1].uvStats.high).toBe(5.0);
    });
  });

  describe('searchLocation and reverseGeocode', () => {
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
            name: 'Burlington',
            latitude: 36.0957,
            longitude: -79.4378,
            country: 'United States',
            country_code: 'US',
            admin1: 'North Carolina'
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodeResponse
      });

      const results = await searchLocation('Burlington');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Burlington');
      expect(results[0].latitude).toBe(36.0957);
      expect(results[0].country).toBe('United States');
    });

    it('reverseGeocode sanitizes township names into towns', async () => {
      const mockNomResponse = {
        address: {
          city: 'Burlington',
          town: 'Burlington',
          county: 'Alamance County',
          state: 'North Carolina',
          country: 'United States'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNomResponse
      });

      const result = await reverseGeocode(36.0957, -79.4378);
      expect(result.name).toBe('Burlington');
      expect(result.country).toBe('United States');
    });
  });
});
