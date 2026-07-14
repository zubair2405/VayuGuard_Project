let map = L.map("map").setView([20.5937, 78.9629], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map);

let marker = null;

let pm25Chart = null;
let pm10Chart = null;
let coChart = null;

// Load old PostgreSQL dashboard data when page opens
loadStoredDashboard();

function loadStoredDashboard() {

    fetch("http://127.0.0.1:5000/summary")
        .then(response => response.json())
        .then(data => {
            document.getElementById("pm25").innerText = data.avg_pm25;
            document.getElementById("pm10").innerText = data.avg_pm10;
            document.getElementById("co").innerText = data.avg_co;
        });

    fetch("http://127.0.0.1:5000/alerts")
        .then(response => response.json())
        .then(data => {
            let output = "";

            data.forEach(alert => {
                output += `
                    <div class="alert-item">
                        ⚠️ ${alert.time} |
                        PM2.5: ${alert.pm2_5} |
                        PM10: ${alert.pm10} |
                        CO: ${alert.co}
                    </div>
                `;
            });

            document.getElementById("alerts").innerHTML = output;
            document.getElementById("alertCount").innerText = data.length;
        });

    fetch("http://127.0.0.1:5000/daily-summary")
        .then(response => response.json())
        .then(data => {

            let output = "";

            data.forEach(day => {
                output += `
                    <div class="daily-item">
                        📅 ${day.day}
                        | PM2.5: ${day.avg_pm25}
                        | PM10: ${day.avg_pm10}
                        | CO: ${day.avg_co}
                    </div>
                `;
            });

            document.getElementById("daily-summary").innerHTML = output;

            drawCharts(data);
        });
}

// Search any city in the world
function searchLocation() {

    const city = document.getElementById("cityInput").value.trim();
    const country = document.getElementById("countryInput").value.trim();

    if (city === "" || country === "") {
        alert("Please enter both city and country");
        return;
    }

    fetch(`http://127.0.0.1:5000/live/${city}/${country}`)
        .then(response => response.json())
        .then(data => {

            if (data.error) {
                alert(data.error);
                return;
            }

            document.getElementById("pm25").innerText = data.pm2_5;
            document.getElementById("pm10").innerText = data.pm10;
            document.getElementById("co").innerText = data.co;
            document.getElementById("alertCount").innerText =
                data.pm2_5 > 10 ? "Live Alert" : "Safe";

            document.getElementById("daily-summary").innerHTML = `
                <div class="daily-item">
                    📍 ${data.city}, ${data.country}
                    | Time: ${data.time}
                    | Temp: ${data.temperature}°C
                    | Wind: ${data.windspeed} km/h
                </div>
                <div class="daily-item">
                    PM2.5: ${data.pm2_5}
                    | PM10: ${data.pm10}
                    | CO: ${data.co}
                    | NO₂: ${data.no2}
                    | SO₂: ${data.so2}
                    | O₃: ${data.o3}
                </div>
            `;

            document.getElementById("alerts").innerHTML = `
                <div class="alert-item">
                    ${data.pm2_5 > 10 ? "⚠️ High Pollution Alert" : "✅ Air Quality Normal"}
                    <br>
                    Location: ${data.city}, ${data.country}
                    <br>
                    PM2.5: ${data.pm2_5} | PM10: ${data.pm10} | CO: ${data.co}
                </div>
            `;

            drawLiveCharts(data);

            if (marker) {
                map.removeLayer(marker);
            }

            map.setView([data.latitude, data.longitude], 10);

            marker = L.marker([data.latitude, data.longitude]).addTo(map)
                .bindPopup(`${data.city}, ${data.country}<br>PM2.5: ${data.pm2_5}`)
                .openPopup();
        });
}

function drawCharts(data) {

    const days = data.map(item => item.day);
    const pm25Values = data.map(item => item.avg_pm25);
    const pm10Values = data.map(item => item.avg_pm10);
    const coValues = data.map(item => item.avg_co);

    if (pm25Chart) pm25Chart.destroy();
    if (pm10Chart) pm10Chart.destroy();
    if (coChart) coChart.destroy();

    pm25Chart = new Chart(document.getElementById("pm25Chart"), {
        type: "line",
        data: {
            labels: days,
            datasets: [{
                label: "Average PM2.5",
                data: pm25Values,
                borderWidth: 3,
                tension: 0.4
            }]
        }
    });

    pm10Chart = new Chart(document.getElementById("pm10Chart"), {
        type: "bar",
        data: {
            labels: days,
            datasets: [{
                label: "Average PM10",
                data: pm10Values,
                borderWidth: 1
            }]
        }
    });

    coChart = new Chart(document.getElementById("coChart"), {
        type: "line",
        data: {
            labels: days,
            datasets: [{
                label: "Average CO",
                data: coValues,
                borderWidth: 3,
                tension: 0.4
            }]
        }
    });
}

function drawLiveCharts(data) {

    if (pm25Chart) pm25Chart.destroy();
    if (pm10Chart) pm10Chart.destroy();
    if (coChart) coChart.destroy();

    pm25Chart = new Chart(document.getElementById("pm25Chart"), {
        type: "bar",
        data: {
            labels: ["Live PM2.5"],
            datasets: [{
                label: `${data.city} PM2.5`,
                data: [data.pm2_5],
                borderWidth: 1
            }]
        }
    });

    pm10Chart = new Chart(document.getElementById("pm10Chart"), {
        type: "bar",
        data: {
            labels: ["Live PM10"],
            datasets: [{
                label: `${data.city} PM10`,
                data: [data.pm10],
                borderWidth: 1
            }]
        }
    });

    coChart = new Chart(document.getElementById("coChart"), {
        type: "bar",
        data: {
            labels: ["Live CO"],
            datasets: [{
                label: `${data.city} CO`,
                data: [data.co],
                borderWidth: 1
            }]
        }
    });
}