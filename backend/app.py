from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
import requests
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app)

def get_connection():
    return psycopg2.connect(
        host=os.environ["DB_HOST"],
        database=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        port=os.environ.get("DB_PORT", "5432")
    )

@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/summary")
def summary():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            ROUND(AVG(pm2_5)::numeric, 2),
            ROUND(AVG(pm10)::numeric, 2),
            ROUND(AVG(co)::numeric, 2)
        FROM air_quality_data
    """)

    result = cur.fetchone()

    cur.close()
    conn.close()

    return jsonify({
        "avg_pm25": float(result[0]),
        "avg_pm10": float(result[1]),
        "avg_co": float(result[2])
    })

@app.route("/alerts")
def alerts():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT time, pm2_5, pm10, co, no2
        FROM high_pollution_alerts
        ORDER BY pm2_5 DESC
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    data = []

    for row in rows:
        data.append({
            "time": str(row[0]),
            "pm2_5": row[1],
            "pm10": row[2],
            "co": row[3],
            "no2": row[4]
        })

    return jsonify(data)

@app.route("/daily-summary")
def daily_summary():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT day, avg_pm25, avg_pm10, avg_co
        FROM daily_pollution_summary
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    data = []

    for row in rows:
        data.append({
            "day": str(row[0]),
            "avg_pm25": float(row[1]),
            "avg_pm10": float(row[2]),
            "avg_co": float(row[3])
        })

    return jsonify(data)

@app.route("/live/<city>/<country>")
def live_data(city, country):

    geo_url = (
        f"https://geocoding-api.open-meteo.com/v1/search"
        f"?name={city}&count=10&language=en&format=json"
    )

    geo_response = requests.get(geo_url)
    geo_data = geo_response.json()

    if "results" not in geo_data:
        return jsonify({"error": "Location not found"})

    location = None

    for place in geo_data["results"]:
        if place.get("country", "").lower() == country.lower():
            location = place
            break

    if location is None:
        return jsonify({"error": "Location found, but country did not match"})

    latitude = location["latitude"]
    longitude = location["longitude"]

    weather_url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={latitude}&longitude={longitude}"
        f"&current_weather=true"
        f"&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
        f"&timezone=auto"
    )

    air_url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality"
        f"?latitude={latitude}&longitude={longitude}"
        f"&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi"
    )

    weather_data = requests.get(weather_url).json()
    air_data = requests.get(air_url).json()

    pm25_list = air_data["hourly"]["pm2_5"]

    latest_index = None

    for i in range(len(pm25_list) - 1, -1, -1):
        if pm25_list[i] is not None:
            latest_index = i
            break

    if latest_index is None:
        return jsonify({"error": "No live air quality data available for this location"})

    return jsonify({
        "city": location["name"],
        "country": location["country"],
        "latitude": latitude,
        "longitude": longitude,
        "elevation": location.get("elevation"),
        "population": location.get("population"),
        "timezone": weather_data.get("timezone", location.get("timezone")),
        "temperature": weather_data["current_weather"]["temperature"],
        "windspeed": weather_data["current_weather"]["windspeed"],
        "pm2_5": air_data["hourly"]["pm2_5"][latest_index],
        "pm10": air_data["hourly"]["pm10"][latest_index],
        "co": air_data["hourly"]["carbon_monoxide"][latest_index],
        "no2": air_data["hourly"]["nitrogen_dioxide"][latest_index],
        "so2": air_data["hourly"]["sulphur_dioxide"][latest_index],
        "o3": air_data["hourly"]["ozone"][latest_index],
        "aqi": air_data["hourly"]["us_aqi"][latest_index],
        "time": air_data["hourly"]["time"][latest_index],
        "forecast": {
            "dates": weather_data["daily"]["time"],
            "weather_codes": weather_data["daily"]["weather_code"],
            "highs": weather_data["daily"]["temperature_2m_max"],
            "lows": weather_data["daily"]["temperature_2m_min"],
            "precipitation": weather_data["daily"]["precipitation_probability_max"]
        }
    })

@app.route("/debug-location/<city>")
def debug_location(city):

    geo_url = (
        f"https://geocoding-api.open-meteo.com/v1/search"
        f"?name={city}&count=10&language=en&format=json"
    )

    geo_data = requests.get(geo_url).json()

    return jsonify(geo_data)

if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true")
