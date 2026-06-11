import pandas as pd

df = pd.read_csv("data/air_quality.csv")

print("Air Quality Data:")
print(df.head())

print("\nStatistics:")
print(df.describe())