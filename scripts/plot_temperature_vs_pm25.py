import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("data/final_dataset.csv")

plt.figure(figsize=(8,5))
plt.scatter(df["temperature"], df["pm2_5"])

plt.title("Temperature vs PM2.5")
plt.xlabel("Temperature")
plt.ylabel("PM2.5")

plt.grid(True)

plt.show()