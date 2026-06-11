import pandas as pd

df = pd.read_csv("data/weather.csv")

print("Data:")
print(df)

print("\nStatistics:")
print(df.describe())