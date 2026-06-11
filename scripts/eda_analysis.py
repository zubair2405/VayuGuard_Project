import pandas as pd

df = pd.read_csv("data/final_dataset.csv")

print("=== EDA REPORT ===")

print("\nHighest PM2.5:")
print(df.loc[df["pm2_5"].idxmax()])

print("\nHighest PM10:")
print(df.loc[df["pm10"].idxmax()])

print("\nHighest CO:")
print(df.loc[df["co"].idxmax()])

print("\nAverage Pollution Levels:")
print(df[["pm2_5", "pm10", "co", "no2", "so2", "o3"]].mean())