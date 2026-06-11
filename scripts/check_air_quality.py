import pandas as pd

df = pd.read_csv("data/air_quality.csv")

print("Shape of Dataset:")
print(df.shape)

print("\nColumn Data Types:")
print(df.dtypes)

print("\nMissing Values:")
print(df.isnull().sum())