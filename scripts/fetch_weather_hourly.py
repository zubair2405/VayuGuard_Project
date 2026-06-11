import requests
import pandas as pd

url = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude=12.97"
    "&longitude=77.59"
    "&hourly=temperature_2m,wind_speed_10m"
)

response = requests.get(url)

data = response.json()

df = pd.DataFrame({
    "time": data["hourly"]["time"],
    "temperature": data["hourly"]["temperature_2m"],
    "windspeed": data["hourly"]["wind_speed_10m"]
})

df.to_csv("data/weather_hourly.csv", index=False)

print("Hourly weather data saved successfully!")