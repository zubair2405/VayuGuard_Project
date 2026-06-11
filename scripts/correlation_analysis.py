import pandas as pd

df = pd.read_csv("data/final_dataset.csv")

correlation = df.corr(numeric_only=True)

print("Correlation Matrix:")
print(correlation)

print("\nCorrelation with PM2.5:")
print(correlation["pm2_5"].sort_values(ascending=False))