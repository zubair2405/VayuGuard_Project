import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("data/final_dataset.csv")

plt.figure(figsize=(10,5))
plt.plot(df["pm2_5"])

plt.title("PM2.5 Levels")
plt.xlabel("Record Number")
plt.ylabel("PM2.5")

plt.grid(True)

plt.show()