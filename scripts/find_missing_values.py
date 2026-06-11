import pandas as pd

df = pd.read_csv("data/air_quality.csv")

missing_rows = df[df.isnull().any(axis=1)]

print("Rows with Missing Values:")
print(missing_rows)