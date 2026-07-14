import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="vayuguard_db",
    user="postgres",
    password="zubair123"
)

print("Database connected successfully!")

conn.close()