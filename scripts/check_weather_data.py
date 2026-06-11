import pandas as pd

df = pd.read_csv("data/weather.csv")

print("Weather Data:")
print(df)

print("\nShape:")
print(df.shape)

print("\nColumns:")
print(df.columns)