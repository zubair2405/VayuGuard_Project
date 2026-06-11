import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("data/final_dataset.csv")

# 1. PM2.5 Trend
plt.figure(figsize=(10,5))
plt.plot(df["pm2_5"])
plt.title("PM2.5 Trend")
plt.xlabel("Records")
plt.ylabel("PM2.5")
plt.grid(True)
plt.show()

# 2. PM10 Trend
plt.figure(figsize=(10,5))
plt.plot(df["pm10"])
plt.title("PM10 Trend")
plt.xlabel("Records")
plt.ylabel("PM10")
plt.grid(True)
plt.show()

# 3. Temperature vs PM2.5
plt.figure(figsize=(8,5))
plt.scatter(df["temperature"], df["pm2_5"])
plt.title("Temperature vs PM2.5")
plt.xlabel("Temperature")
plt.ylabel("PM2.5")
plt.grid(True)
plt.show()

# 4. Wind Speed vs PM2.5
plt.figure(figsize=(8,5))
plt.scatter(df["windspeed"], df["pm2_5"])
plt.title("Wind Speed vs PM2.5")
plt.xlabel("Wind Speed")
plt.ylabel("PM2.5")
plt.grid(True)
plt.show() 