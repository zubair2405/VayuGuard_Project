let map = L.map("map").setView([20.5937, 78.9629], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map);

let marker = null;
let pm25Chart = null;
let pm10Chart = null;
let coChart = null;

const chartDefaults = (unit) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#0b2b3d", titleColor: "#eaf7fb", bodyColor: "#b7d0d9", padding: 10 } },
    scales: {
        x: { title: { display: true, text: "DAY", color: "#668793", font: { size: 9, weight: "600" } }, grid: { display: false }, ticks: { color: "#82a0ad", font: { size: 10 } } },
        y: { title: { display: true, text: unit, color: "#668793", font: { size: 9, weight: "600" } }, grid: { color: "rgba(165, 221, 229, .1)" }, ticks: { color: "#82a0ad", font: { size: 10 } }, border: { display: false } }
    }
});

loadStoredDashboard();

function loadStoredDashboard() {
    fetch("/summary").then(response => response.json()).then(data => {
        document.getElementById("pm25").innerText = data.avg_pm25;
        document.getElementById("pm10").innerText = data.avg_pm10;
        document.getElementById("co").innerText = data.avg_co;
    });

    fetch("/alerts").then(response => response.json()).then(data => {
        document.getElementById("alerts").innerHTML = data.map(alert => `
            <div class="alert-item">⚠ ${alert.time} &nbsp;|&nbsp; PM2.5: ${alert.pm2_5} &nbsp;|&nbsp; PM10: ${alert.pm10} &nbsp;|&nbsp; CO: ${alert.co}</div>`).join("");
        document.getElementById("alertCount").innerText = data.length;
    });

    fetch("/daily-summary").then(response => response.json()).then(data => {
        document.getElementById("daily-summary").innerHTML = data.map(day => `
            <div class="daily-item">◷ ${day.day} &nbsp;|&nbsp; PM2.5: ${day.avg_pm25} &nbsp;|&nbsp; PM10: ${day.avg_pm10} &nbsp;|&nbsp; CO: ${day.avg_co}</div>`).join("");
        drawCharts(data);
    });
}

function searchLocation() {
    const city = document.getElementById("cityInput").value.trim();
    const country = document.getElementById("countryInput").value.trim();
    if (!city || !country) { alert("Please enter both city and country"); return; }

    fetch(`/live/${encodeURIComponent(city)}/${encodeURIComponent(country)}`).then(response => response.json()).then(data => {
        if (data.error) { alert(data.error); return; }
        document.getElementById("pm25").innerText = data.pm2_5;
        document.getElementById("pm10").innerText = data.pm10;
        document.getElementById("co").innerText = data.co;
        document.getElementById("alertCount").innerText = data.pm2_5 > 10 ? "Live alert" : "Safe";
        updateAqi(data.aqi, data.city);
        updateWeatherSection(data);
        document.getElementById("daily-summary").innerHTML = `<div class="daily-item">⌖ ${data.city}, ${data.country} &nbsp;|&nbsp; ${data.time} &nbsp;|&nbsp; ${data.temperature}°C &nbsp;|&nbsp; Wind ${data.windspeed} km/h</div><div class="daily-item">PM2.5: ${data.pm2_5} &nbsp;|&nbsp; PM10: ${data.pm10} &nbsp;|&nbsp; CO: ${data.co} &nbsp;|&nbsp; NO₂: ${data.no2} &nbsp;|&nbsp; SO₂: ${data.so2} &nbsp;|&nbsp; O₃: ${data.o3}</div>`;
        document.getElementById("alerts").innerHTML = `<div class="alert-item">${data.pm2_5 > 10 ? "⚠ High Pollution Alert" : "✓ Air Quality Normal"}<br>Location: ${data.city}, ${data.country}<br>PM2.5: ${data.pm2_5} | PM10: ${data.pm10} | CO: ${data.co}</div>`;
        drawLiveCharts(data);
        if (marker) map.removeLayer(marker);
        map.setView([data.latitude, data.longitude], 10);
        marker = L.marker([data.latitude, data.longitude]).addTo(map).bindPopup(`${data.city}, ${data.country}<br>PM2.5: ${data.pm2_5}`).openPopup();
    });
}

function updateAqi(aqi, city) {
    const readout = document.getElementById("aqiReadout");
    const value = document.getElementById("aqiValue");
    const status = document.getElementById("aqiStatus");
    const numericAqi = Number(aqi);
    let label = "Good", tone = "good";
    if (numericAqi > 100) { label = "Unhealthy"; tone = "unhealthy"; }
    else if (numericAqi > 50) { label = "Moderate"; tone = "moderate"; }
    readout.className = `aqi-readout ${tone}`;
    value.textContent = Number.isFinite(numericAqi) ? Math.round(numericAqi) : "—";
    status.textContent = Number.isFinite(numericAqi) ? `${label} air quality in ${city}` : `AQI unavailable for ${city}`;
}

function updateWeatherSection(data) {
    const section = document.getElementById("weatherSection");
    section.hidden = false;
    document.getElementById("weatherLocation").textContent = `${data.city}, ${data.country} · live local forecast`;
    document.getElementById("weatherTemp").textContent = Math.round(data.temperature);
    document.getElementById("weatherWind").textContent = `${data.windspeed} km/h`;
    document.getElementById("weatherTime").textContent = new Date(data.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    document.getElementById("placeCoords").textContent = `${Number(data.latitude).toFixed(2)}°, ${Number(data.longitude).toFixed(2)}°`;
    document.getElementById("placeElevation").textContent = data.elevation == null ? "—" : `${Math.round(data.elevation)} m`;
    document.getElementById("placeTimezone").textContent = data.timezone || "—";
    document.getElementById("placePopulation").textContent = data.population ? Number(data.population).toLocaleString() : "—";
    const codes = { 0: ["☀", "Clear sky"], 1: ["⛅", "Mostly clear"], 2: ["☁", "Partly cloudy"], 3: ["☁", "Overcast"], 45: ["〰", "Foggy"], 48: ["〰", "Foggy"], 51: ["☂", "Light drizzle"], 53: ["☂", "Drizzle"], 55: ["☂", "Heavy drizzle"], 61: ["☔", "Light rain"], 63: ["☔", "Rain"], 65: ["☔", "Heavy rain"], 71: ["❄", "Light snow"], 73: ["❄", "Snow"], 75: ["❄", "Heavy snow"], 80: ["☔", "Rain showers"], 81: ["☔", "Rain showers"], 82: ["☔", "Heavy showers"], 95: ["ϟ", "Thunderstorm"] };
    const forecast = data.forecast;
    const todayCode = forecast.weather_codes[0];
    document.getElementById("weatherDescription").textContent = codes[todayCode]?.[1] || "Current local conditions";
    document.getElementById("forecastList").innerHTML = forecast.dates.slice(0, 5).map((date, index) => {
        const [icon] = codes[forecast.weather_codes[index]] || ["◌"];
        const day = new Date(`${date}T12:00:00`).toLocaleDateString([], { weekday: "short" });
        return `<div class="forecast-day"><span>${index === 0 ? "Today" : day}</span><strong>${icon}</strong><span>${Math.round(forecast.highs[index])}° <em>${Math.round(forecast.lows[index])}°</em></span></div>`;
    }).join("");
}

function createChart(element, type, label, labels, values, color, fill) {
    const canvas = document.getElementById(element);
    const gradient = canvas.getContext("2d").createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, fill);
    gradient.addColorStop(1, "rgba(10, 38, 55, 0)");
    return new Chart(canvas, { type, data: { labels, datasets: [{ label, data: values, borderColor: color, backgroundColor: type === "line" ? gradient : fill, borderWidth: 2.5, borderRadius: 6, borderSkipped: false, pointRadius: type === "line" ? 3 : 0, pointHoverRadius: 5, pointBackgroundColor: color, fill: type === "line", tension: .42 }] }, options: chartDefaults("µg/m³") });
}

function drawCharts(data) {
    const days = data.map(item => item.day);
    if (pm25Chart) pm25Chart.destroy(); if (pm10Chart) pm10Chart.destroy(); if (coChart) coChart.destroy();
    pm25Chart = createChart("pm25Chart", "line", "Average PM2.5", days, data.map(item => item.avg_pm25), "#62e2da", "rgba(98,226,218,.12)");
    pm10Chart = createChart("pm10Chart", "bar", "Average PM10", days, data.map(item => item.avg_pm10), "#ffbe5d", "rgba(255,190,93,.72)");
    coChart = createChart("coChart", "line", "Average CO", days, data.map(item => item.avg_co), "#ad9cff", "rgba(173,156,255,.12)");
}

function drawLiveCharts(data) {
    if (pm25Chart) pm25Chart.destroy(); if (pm10Chart) pm10Chart.destroy(); if (coChart) coChart.destroy();
    pm25Chart = createChart("pm25Chart", "bar", `${data.city} PM2.5`, ["Live PM2.5"], [data.pm2_5], "#62e2da", "rgba(98,226,218,.75)");
    pm10Chart = createChart("pm10Chart", "bar", `${data.city} PM10`, ["Live PM10"], [data.pm10], "#ffbe5d", "rgba(255,190,93,.75)");
    coChart = createChart("coChart", "bar", `${data.city} CO`, ["Live CO"], [data.co], "#ad9cff", "rgba(173,156,255,.75)");
}
