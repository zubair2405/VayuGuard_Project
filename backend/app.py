from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os
import psycopg2
import requests

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app)

def get_connection():
    return psycopg2.connect(host="localhost", database="vayuguard_db", user="postgres", password="zubair123")

@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/summary")
def summary():
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT ROUND(AVG(pm2_5)::numeric, 2), ROUND(AVG(pm10)::numeric, 2), ROUND(AVG(co)::numeric, 2) FROM air_quality_data")
        result = cur.fetchone()
    return jsonify({"avg_pm25": float(result[0]), "avg_pm10": float(result[1]), "avg_co": float(result[2])})

@app.route("/alerts")
def alerts():
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT time, pm2_5, pm10, co, no2 FROM high_pollution_alerts ORDER BY pm2_5 DESC")
        rows = cur.fetchall()
    return jsonify([{"time": str(row[0]), "pm2_5": row[1], "pm10": row[2], "co": row[3], "no2": row[4]} for row in rows])

@app.route("/daily-summary")
def daily_summary():
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT day, avg_pm25, avg_pm10, avg_co FROM daily_pollution_summary")
        rows = cur.fetchall()
    return jsonify([{"day": str(row[0]), "avg_pm25": float(row[1]), "avg_pm10": float(row[2]), "avg_co": float(row[3])} for row in rows])

def environment_payload(latitude, longitude, city, country):
    weather_url = (f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}"
                   "&current_weather=true&hourly=temperature_2m,precipitation_probability,weather_code"
                   "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto")
    air_url = (f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={latitude}&longitude={longitude}"
               "&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&timezone=auto")
    try:
        weather = requests.get(weather_url, timeout=12).json()
        air = requests.get(air_url, timeout=12).json()
    except requests.RequestException:
        return None
    current_time = weather["current_weather"]["time"]
    air_hourly, weather_hourly = air["hourly"], weather["hourly"]
    available_air = [
        index for index, value in enumerate(air_hourly["pm2_5"])
        if value is not None
    ]
    if not available_air:
        return None
    # Providers can report their current observations in different time zones.
    # Prefer the most recent non-empty reading at or before the weather timestamp.
    past_air = [index for index in available_air if air_hourly["time"][index] <= current_time]
    air_index = past_air[-1] if past_air else available_air[0]
    try:
        weather_index = weather_hourly["time"].index(air_hourly["time"][air_index])
    except ValueError:
        weather_index = min(air_index, len(weather_hourly["time"]) - 1)

    hourly_outlook = []
    for offset in range(12):
        a, w = air_index + offset, weather_index + offset
        if a >= len(air_hourly["time"]) or w >= len(weather_hourly["time"]):
            break
        hourly_outlook.append({"time": air_hourly["time"][a], "aqi": air_hourly["us_aqi"][a], "pm2_5": air_hourly["pm2_5"][a], "temperature": weather_hourly["temperature_2m"][w], "precipitation": weather_hourly["precipitation_probability"][w], "weather_code": weather_hourly["weather_code"][w]})
    return {"city": city, "country": country, "latitude": latitude, "longitude": longitude,
            "temperature": weather["current_weather"]["temperature"], "windspeed": weather["current_weather"]["windspeed"],
            "pm2_5": air_hourly["pm2_5"][air_index], "pm10": air_hourly["pm10"][air_index], "co": air_hourly["carbon_monoxide"][air_index], "no2": air_hourly["nitrogen_dioxide"][air_index], "so2": air_hourly["sulphur_dioxide"][air_index], "o3": air_hourly["ozone"][air_index], "aqi": air_hourly["us_aqi"][air_index], "time": current_time,
            "hourly_outlook": hourly_outlook,
            "forecast": {"dates": weather["daily"]["time"], "weather_codes": weather["daily"]["weather_code"], "highs": weather["daily"]["temperature_2m_max"], "lows": weather["daily"]["temperature_2m_min"], "precipitation": weather["daily"]["precipitation_probability_max"]}}

@app.route("/live/<city>/<country>")
def live_data(city, country):
    geo = requests.get(f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=10&language=en&format=json", timeout=12).json()
    location = next((place for place in geo.get("results", []) if place.get("country", "").lower() == country.lower()), None)
    if location is None:
        return jsonify({"error": "Location was not found, or the country did not match"}), 404
    data = environment_payload(location["latitude"], location["longitude"], location["name"], location["country"])
    return jsonify(data or {"error": "No live air quality data is available for this location"})

@app.route("/live-coordinates/<latitude>/<longitude>")
def live_coordinates(latitude, longitude):
    data = environment_payload(float(latitude), float(longitude), "Your location", "Current area")
    return jsonify(data or {"error": "No live air quality data is available at these coordinates"})

if __name__ == "__main__":
    app.run(debug=True)
