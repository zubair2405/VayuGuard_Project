import pandas as pd

weather = pd.read_csv("data/weather_hourly.csv")
air = pd.read_csv("data/air_quality_clean.csv")

merged = pd.merge(weather, air, on="time", how="inner")

print("Weather Shape:", weather.shape)
print("Air Quality Shape:", air.shape)
print("Merged Shape:", merged.shape)

print("\nFirst 5 Rows:")
print(merged.head())

merged.to_csv("data/final_dataset.csv", index=False)

print("\nFinal dataset saved successfully!")