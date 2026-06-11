import pandas as pd

df = pd.read_csv("data/final_dataset.csv")

print("Final Dataset Shape:")
print(df.shape)

print("\nColumns:")
print(df.columns)

print("\nMissing Values:")
print(df.isnull().sum())

print("\nStatistics:")
print(df.describe())