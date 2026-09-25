import { describe, it, expect } from 'vitest';
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  formatTemperature,
  kmhToMph,
  formatWindSpeed,
  formatDayOfWeek,
  formatShortDate
} from '../src/modules/conversions.js';

describe('Unit Conversions', () => {
  describe('celsiusToFahrenheit', () => {
    it('converts 0°C to 32°F', () => {
      expect(celsiusToFahrenheit(0)).toBe(32);
    });

    it('converts 100°C to 212°F', () => {
      expect(celsiusToFahrenheit(100)).toBe(212);
    });

    it('converts negative temperatures correctly (-10°C to 14°F)', () => {
      expect(celsiusToFahrenheit(-10)).toBe(14);
    });

    it('converts decimal temperatures with rounding (21.5°C to 70.7°F)', () => {
      expect(celsiusToFahrenheit(21.5)).toBe(70.7);
    });

    it('handles invalid or non-numeric inputs gracefully', () => {
      expect(celsiusToFahrenheit(null)).toBe(0);
      expect(celsiusToFahrenheit(undefined)).toBe(0);
      expect(celsiusToFahrenheit('25')).toBe(0);
      expect(celsiusToFahrenheit(NaN)).toBe(0);
    });
  });

  describe('fahrenheitToCelsius', () => {
    it('converts 32°F to 0°C', () => {
      expect(fahrenheitToCelsius(32)).toBe(0);
    });

    it('converts 212°F to 100°C', () => {
      expect(fahrenheitToCelsius(212)).toBe(100);
    });

    it('converts negative temperatures correctly (-40°F to -40°C)', () => {
      expect(fahrenheitToCelsius(-40)).toBe(-40);
    });

    it('handles invalid inputs gracefully', () => {
      expect(fahrenheitToCelsius(null)).toBe(0);
      expect(fahrenheitToCelsius('100')).toBe(0);
    });
  });

  describe('formatTemperature', () => {
    it('formats Celsius correctly with unit symbol', () => {
      expect(formatTemperature(22.4, 'C', true)).toBe('22°C');
    });

    it('formats Fahrenheit correctly with unit symbol', () => {
      // 22°C is 71.6°F -> rounded to 72°F
      expect(formatTemperature(22, 'F', true)).toBe('72°F');
    });

    it('formats without unit symbol when requested', () => {
      expect(formatTemperature(22.4, 'C', false)).toBe('22°');
      expect(formatTemperature(22, 'F', false)).toBe('72°');
    });

    it('returns placeholder for missing/invalid numbers', () => {
      expect(formatTemperature(NaN, 'C', true)).toBe('--°C');
      expect(formatTemperature(null, 'F', true)).toBe('--°F');
      expect(formatTemperature(undefined, 'C', false)).toBe('--');
    });
  });

  describe('kmhToMph and formatWindSpeed', () => {
    it('converts km/h to mph correctly', () => {
      expect(kmhToMph(10)).toBe(6.2);
      expect(kmhToMph(0)).toBe(0);
    });

    it('formats wind speed according to unit system', () => {
      expect(formatWindSpeed(15, 'C')).toBe('15 km/h');
      // 15 km/h * 0.621371 = 9.32 mph -> 9 mph
      expect(formatWindSpeed(15, 'F')).toBe('9 mph');
    });

    it('handles invalid wind speeds', () => {
      expect(formatWindSpeed(NaN, 'C')).toBe('--');
      expect(formatWindSpeed(null, 'F')).toBe('--');
    });
  });

  describe('Date formatting utilities', () => {
    it('formats day of week correctly', () => {
      expect(formatDayOfWeek('2026-09-25')).toBeDefined();
    });

    it('formats short date correctly', () => {
      expect(formatShortDate('2026-09-25')).toContain('Sep');
    });

    it('handles empty date string', () => {
      expect(formatDayOfWeek('')).toBe('');
      expect(formatShortDate('')).toBe('');
    });
  });
});
