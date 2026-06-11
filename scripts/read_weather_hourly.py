import pandas as pd

df = pd.read_csv("data/weather_hourly.csv")

print(df.head())

print("\nShape:")
print(df.shape)