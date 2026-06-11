import requests
import pandas as pd

response = requests.get(
    "https://api.open-meteo.com/v1/forecast?latitude=12.97&longitude=77.59&current_weather=true"
)

data = response.json()

weather = {
    "time": data["current_weather"]["time"],
    "temperature": data["current_weather"]["temperature"],
    "windspeed": data["current_weather"]["windspeed"]
}

df = pd.DataFrame([weather])

df.to_csv("data/weather.csv", index=False)

print("Weather data saved successfully!")