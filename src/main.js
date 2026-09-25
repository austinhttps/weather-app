import './styles/main.css';
import { WeatherApp } from './modules/app.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = new WeatherApp();
  app.init();
});
