"""Create and seed the VayuGuard dashboard database when it is empty."""

import os
from pathlib import Path

import psycopg2


ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT_DIR / "data" / "final_dataset.csv"


def connection():
    return psycopg2.connect(
        host=os.environ["DB_HOST"],
        port=os.environ.get("DB_PORT", "5432"),
        database=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
    )


def initialize_database():
    with connection() as conn, conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS air_quality_data (
                time TIMESTAMP PRIMARY KEY,
                temperature NUMERIC,
                windspeed NUMERIC,
                pm2_5 NUMERIC,
                pm10 NUMERIC,
                co NUMERIC,
                no2 NUMERIC,
                so2 NUMERIC,
                o3 NUMERIC
            )
        """)
        cur.execute("SELECT COUNT(*) FROM air_quality_data")
        if cur.fetchone()[0] == 0:
            with DATA_FILE.open(encoding="utf-8") as csv_file:
                cur.copy_expert(
                    "COPY air_quality_data (time, temperature, windspeed, pm2_5, pm10, co, no2, so2, o3) FROM STDIN WITH CSV HEADER",
                    csv_file,
                )

        cur.execute("""
            CREATE OR REPLACE VIEW daily_pollution_summary AS
            SELECT
                DATE(time) AS day,
                ROUND(AVG(pm2_5), 2) AS avg_pm25,
                ROUND(AVG(pm10), 2) AS avg_pm10,
                ROUND(AVG(co), 2) AS avg_co
            FROM air_quality_data
            GROUP BY DATE(time)
            ORDER BY day
        """)
        cur.execute("""
            CREATE OR REPLACE VIEW high_pollution_alerts AS
            SELECT time, pm2_5, pm10, co, no2
            FROM air_quality_data
            WHERE pm2_5 > 10
        """)


if __name__ == "__main__":
    initialize_database()
    print("VayuGuard database is ready.")
