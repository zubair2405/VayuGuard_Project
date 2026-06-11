import pandas as pd

df = pd.read_csv("data/air_quality_clean.csv")

print("Shape:")
print(df.shape)

print("\nMissing Values:")
print(df.isnull().sum())

print("\nFirst 5 Rows:")
print(df.head())