import pandas as pd

df = pd.read_csv("data/air_quality.csv")

print("Before Cleaning:")
print(df.shape)

# Remove rows containing missing values
df_clean = df.dropna()

print("\nAfter Cleaning:")
print(df_clean.shape)

df_clean.to_csv("data/air_quality_clean.csv", index=False)

print("\nCleaned file saved successfully!")