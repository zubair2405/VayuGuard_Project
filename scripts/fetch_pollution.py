import requests
import pandas as pd

url = (
    "https://air-quality-api.open-meteo.com/v1/air-quality"
    "?latitude=12.97"
    "&longitude=77.59"
    "&hourly=pm10,pm2_5,carbon_monoxide,"
    "nitrogen_dioxide,sulphur_dioxide,ozone"
)

response = requests.get(url)

data = response.json()

df = pd.DataFrame({
    "time": data["hourly"]["time"],
    "pm2_5": data["hourly"]["pm2_5"],
    "pm10": data["hourly"]["pm10"],
    "co": data["hourly"]["carbon_monoxide"],
    "no2": data["hourly"]["nitrogen_dioxide"],
    "so2": data["hourly"]["sulphur_dioxide"],
    "o3": data["hourly"]["ozone"]
})

df.to_csv("data/air_quality.csv", index=False)

print("Air quality data saved successfully!")