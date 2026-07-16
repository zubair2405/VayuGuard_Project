const API = window.location.origin;
let map, marker, pollutantChart;

function setupMap() {
  map = L.map('map', { zoomControl: false }).setView([12.9716, 77.5946], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
}

function aqiInfo(value) {
  if (value <= 50) return ['Good', 'The air is clean and comfortable for outdoor plans.', 'good'];
  if (value <= 100) return ['Moderate', 'Most people can enjoy normal outdoor activity.', 'moderate'];
  return ['Unhealthy', 'Reduce prolonged outdoor exertion where possible.', 'unhealthy'];
}
function weatherIcon(code) { if ([0,1].includes(code)) return '☀'; if ([2,3].includes(code)) return '⛅'; if ([45,48].includes(code)) return '〰'; if (code >= 51 && code <= 82) return '🌦'; return '⛈'; }
function weatherText(code) { if (code === 0) return 'Clear skies'; if (code <= 3) return 'Partly cloudy'; if (code <= 48) return 'Misty conditions'; if (code <= 82) return 'Rain possible'; return 'Storm conditions'; }
function meter(id, value, max) { document.getElementById(id).style.width = `${Math.min(100, Math.max(4, value / max * 100))}%`; }

function renderAdvice(aqi, pm25) {
  const [, summary] = aqiInfo(aqi);
  document.getElementById('adviceSummary').textContent = summary;
  const sensitive = aqi > 100 || pm25 > 35;
  const tips = sensitive ? [
    ['😷', 'Limit exposure', 'Choose indoor exercise and use a well-fitting mask if you need to be outside.'],
    ['🏠', 'Keep indoor air fresh', 'Close windows during peak traffic hours and run an air purifier if available.'],
    ['🕒', 'Plan your timing', 'Move essential outdoor trips to a clearer part of the day.']
  ] : [
    ['🚶', 'Enjoy the outdoors', 'Air conditions support walking, commuting and normal activity.'],
    ['🌿', 'Air out your space', 'Open windows briefly to refresh indoor air while conditions are good.'],
    ['📍', 'Stay aware', 'Check again before a long commute or an outdoor workout.']
  ];
  document.getElementById('adviceCards').innerHTML = tips.map(([icon, title, copy]) => `<article class="advice-card"><span>${icon}</span><h3>${title}</h3><p>${copy}</p></article>`).join('');
}

function renderChart(data) {
  if (pollutantChart) pollutantChart.destroy();
  pollutantChart = new Chart(document.getElementById('pollutantChart'), { type: 'bar', data: { labels: ['PM2.5', 'PM10', 'Ozone', 'NO₂'], datasets: [{ data: [data.pm2_5, data.pm10, data.o3, data.no2], backgroundColor: ['#43b6c4', '#6d8ac7', '#d6a34b', '#ca7184'], borderRadius: 8, barThickness: 28 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.raw.toFixed(1)} µg/m³` } } }, scales: { x: { grid: { display: false }, ticks: { color: '#52677b', font: { family: 'Manrope', weight: '700' } } }, y: { beginAtZero: true, grid: { color: '#e6eeef' }, ticks: { color: '#8291a2', callback: value => `${value}` } } } } });
}

function renderForecast(data) {
  const daily = data.forecast;
  if (!daily) return;
  document.getElementById('forecastCards').innerHTML = daily.dates.map((date, index) => { const day = new Date(`${date}T12:00:00`); return `<article class="forecast-card"><div class="day">${index === 0 ? 'Today' : day.toLocaleDateString(undefined,{weekday:'short'})}</div><div class="date">${day.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</div><div class="icon">${weatherIcon(daily.weather_codes[index])}</div><b>${Math.round(daily.highs[index])}° <span style="color:#9aa8b4;font-weight:500">${Math.round(daily.lows[index])}°</span></b><small>☂ ${daily.precipitation[index] ?? 0}% rain</small></article>`; }).join('');
  document.getElementById('weatherSummary').textContent = weatherText(daily.weather_codes[0]);
  document.getElementById('weatherSymbol').textContent = weatherIcon(daily.weather_codes[0]);
}

function renderHourlyOutlook(hours) {
  if (!hours?.length) return;
  const best = hours.filter(item => item.aqi != null).reduce((lowest, item) => item.aqi < lowest.aqi ? item : lowest, hours[0]);
  const bestHour = new Date(`${best.time}:00`).toLocaleTimeString([], { hour: 'numeric', hour12: true });
  document.getElementById('outdoorRecommendation').textContent = `The clearest window is around ${bestHour} (AQI ${Math.round(best.aqi)}).`;
  document.getElementById('hourlyOutlook').innerHTML = hours.map((item, index) => {
    const label = index === 0 ? 'Now' : new Date(`${item.time}:00`).toLocaleTimeString([], { hour: 'numeric', hour12: true });
    return `<article class="hour-card"><time>${label}</time><div>${weatherIcon(item.weather_code)}</div><b>${Math.round(item.temperature)}°</b><small>AQI ${Math.round(item.aqi ?? 0)}</small></article>`;
  }).join('');
}

function renderData(data) {
  const aqi = data.aqi ?? Math.round(data.pm2_5 * 2);
  const [label,, style] = aqiInfo(aqi);
  document.getElementById('locationName').textContent = `${data.city}, ${data.country}`;
  document.getElementById('updatedAt').textContent = data.time.replace('T', ' · ');
  document.getElementById('aqiValue').textContent = Math.round(aqi);
  document.getElementById('aqiLabel').textContent = label;
  document.getElementById('aqiOrb').className = `aqi-orb ${style}`;
  document.getElementById('heroPm25').textContent = `${data.pm2_5} µg/m³`;
  document.getElementById('heroWind').textContent = `${data.windspeed} km/h`;
  ['pm25','pm10','o3','no2'].forEach((id) => document.getElementById(id).textContent = Number(data[id === 'pm25' ? 'pm2_5' : id]).toFixed(1));
  meter('pm25Meter', data.pm2_5, 75); meter('pm10Meter', data.pm10, 150); meter('o3Meter', data.o3, 180); meter('no2Meter', data.no2, 100);
  document.getElementById('weatherCity').textContent = data.city.toUpperCase();
  document.getElementById('temperature').textContent = Math.round(data.temperature);
  document.getElementById('windspeed').textContent = `${data.windspeed} km/h`;
  document.getElementById('visibilityGuide').textContent = label;
  map.setView([data.latitude, data.longitude], 10); if (marker) map.removeLayer(marker); marker = L.marker([data.latitude, data.longitude]).addTo(map).bindPopup(`<b>${data.city}</b><br>Air quality: ${label}`).openPopup();
  renderChart(data); renderForecast(data); renderHourlyOutlook(data.hourly_outlook); renderAdvice(aqi, data.pm2_5);
}
async function searchLocation(event) {
  if (event) event.preventDefault();
  const city = document.getElementById('cityInput').value.trim(), country = document.getElementById('countryInput').value.trim(), status = document.getElementById('locationStatus');
  if (!city || !country) return;
  status.textContent = 'Updating live environment data…';
  try { const response = await fetch(`${API}/live/${encodeURIComponent(city)}/${encodeURIComponent(country)}`); const data = await response.json(); if (!response.ok || data.error) throw new Error(data.error || 'Could not load this location.'); renderData(data); status.textContent = `Live data updated for ${data.city}, ${data.country}.`; } catch (error) { status.textContent = error.message; }
}
function useCurrentLocation() {
  const status = document.getElementById('locationStatus');
  if (!navigator.geolocation) { status.textContent = 'Your browser does not support location access.'; return; }
  status.textContent = 'Requesting your location…';
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    try {
      const response = await fetch(`${API}/live-coordinates/${coords.latitude}/${coords.longitude}`);
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'Could not load local data.');
      renderData(data); status.textContent = 'Live data updated for your current location.';
    } catch (error) { status.textContent = error.message; }
  }, () => { status.textContent = 'Location access was not granted. Search for a city instead.'; }, { enableHighAccuracy: false, timeout: 10000 });
}
document.getElementById('locationForm').addEventListener('submit', searchLocation);
document.getElementById('myLocation').addEventListener('click', useCurrentLocation);
setupMap(); searchLocation();
