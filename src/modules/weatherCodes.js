/**
 * WMO Weather interpretation codes (WW)
 * https://open-meteo.com/en/docs
 */

export const WEATHER_CONDITIONS = {
  0: { description: 'Clear sky', icon: 'sun', theme: 'clear-day' },
  1: { description: 'Mainly clear', icon: 'sun-cloud', theme: 'clear-day' },
  2: { description: 'Partly cloudy', icon: 'cloud-sun', theme: 'cloudy' },
  3: { description: 'Overcast', icon: 'cloud', theme: 'cloudy' },
  45: { description: 'Foggy', icon: 'fog', theme: 'foggy' },
  48: { description: 'Depositing rime fog', icon: 'fog', theme: 'foggy' },
  51: { description: 'Light drizzle', icon: 'cloud-drizzle', theme: 'rainy' },
  53: { description: 'Moderate drizzle', icon: 'cloud-drizzle', theme: 'rainy' },
  55: { description: 'Dense drizzle', icon: 'cloud-drizzle', theme: 'rainy' },
  56: { description: 'Light freezing drizzle', icon: 'cloud-snow', theme: 'snowy' },
  57: { description: 'Dense freezing drizzle', icon: 'cloud-snow', theme: 'snowy' },
  61: { description: 'Slight rain', icon: 'cloud-rain', theme: 'rainy' },
  63: { description: 'Moderate rain', icon: 'cloud-rain', theme: 'rainy' },
  65: { description: 'Heavy rain', icon: 'cloud-rain-heavy', theme: 'rainy' },
  66: { description: 'Light freezing rain', icon: 'cloud-snow', theme: 'snowy' },
  67: { description: 'Heavy freezing rain', icon: 'cloud-snow', theme: 'snowy' },
  71: { description: 'Slight snow fall', icon: 'cloud-snow', theme: 'snowy' },
  73: { description: 'Moderate snow fall', icon: 'cloud-snow', theme: 'snowy' },
  75: { description: 'Heavy snow fall', icon: 'cloud-snow', theme: 'snowy' },
  77: { description: 'Snow grains', icon: 'cloud-snow', theme: 'snowy' },
  80: { description: 'Slight rain showers', icon: 'cloud-rain', theme: 'rainy' },
  81: { description: 'Moderate rain showers', icon: 'cloud-rain', theme: 'rainy' },
  82: { description: 'Violent rain showers', icon: 'cloud-rain-heavy', theme: 'rainy' },
  85: { description: 'Slight snow showers', icon: 'cloud-snow', theme: 'snowy' },
  86: { description: 'Heavy snow showers', icon: 'cloud-snow', theme: 'snowy' },
  95: { description: 'Thunderstorm', icon: 'cloud-lightning', theme: 'stormy' },
  96: { description: 'Thunderstorm with slight hail', icon: 'cloud-lightning', theme: 'stormy' },
  99: { description: 'Thunderstorm with heavy hail', icon: 'cloud-lightning', theme: 'stormy' }
};

/**
 * Get weather interpretation info by WMO code
 * @param {number} code - WMO weather code
 * @param {boolean} [isDay=true] - Day or night
 * @returns {{ description: string, icon: string, theme: string }}
 */
export function getWeatherInfo(code, isDay = true) {
  const info = WEATHER_CONDITIONS[code] || {
    description: 'Unknown',
    icon: isDay ? 'sun' : 'moon',
    theme: isDay ? 'clear-day' : 'clear-night'
  };

  if (!isDay) {
    if (code === 0 || code === 1) {
      return {
        description: info.description,
        icon: 'moon',
        theme: 'clear-night'
      };
    }
    if (code === 2) {
      return {
        description: info.description,
        icon: 'cloud-moon',
        theme: 'clear-night'
      };
    }
  }

  return info;
}

/**
 * Returns inline SVG icon for a weather type
 * @param {string} iconName
 * @param {number} [size=24]
 * @returns {string} SVG HTML string
 */
export function getWeatherIconSvg(iconName, size = 24) {
  const icons = {
    'sun': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    'moon': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
    'cloud': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-cloud"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
    'cloud-sun': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-cloud-sun"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>`,
    'sun-cloud': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-sun-cloud"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    'cloud-moon': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-cloud-moon"><path d="M10.188 8.5A6 6 0 0 1 16 4a6 6 0 0 0-6 6c0 .44.04.87.11 1.29"/><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
    'cloud-drizzle': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-cloud-drizzle"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 19v1"/><path d="M8 14v1"/><path d="M16 19v1"/><path d="M16 14v1"/><path d="M12 21v1"/><path d="M12 16v1"/></svg>`,
    'cloud-rain': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-cloud-rain"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>`,
    'cloud-rain-heavy': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-cloud-rain-heavy"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="m15 15-2 6"/><path d="m9 15-2 6"/><path d="m12 17-2 6"/></svg>`,
    'cloud-snow': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-cloud-snow"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 15h.01"/><path d="M8 19h.01"/><path d="M12 17h.01"/><path d="M12 21h.01"/><path d="M16 15h.01"/><path d="M16 19h.01"/></svg>`,
    'cloud-lightning': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-cloud-lightning"><path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"/><path d="m13 12-3 5h4l-3 5"/></svg>`,
    'fog': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-fog"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M4 17h16"/><path d="M7 20h10"/></svg>`,
    'wind': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-wind"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>`,
    'droplets': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-droplets"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.82-2.29 3.76S3 11.09 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>`,
    'thermometer': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-thermometer"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>`,
    'compass': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-compass"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
    'map-pin': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`,
    'search': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    'crosshair': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-crosshair"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>`,
    'alert-circle': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
    'uv-index': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-uv"><circle cx="12" cy="12" r="5"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/></svg>`,
    'gauge': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-gauge"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>`,
    'sunrise': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-sunrise"><path d="M12 2v6"/><path d="m4.93 10.93 1.41 1.41"/><path d="M20 18h2"/><path d="M2 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>`,
    'sunset': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon-svg icon-sunset"><path d="M12 10V4"/><path d="m4.93 10.93 1.41 1.41"/><path d="M20 18h2"/><path d="M2 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>`
  };

  return icons[iconName] || icons['sun'];
}
