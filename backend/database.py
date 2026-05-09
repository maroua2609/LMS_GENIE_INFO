import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "dbname=lms_genie_info user=postgres password=Mar26092006. host=localhost port=5432"
)

def get_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.cursor_factory = psycopg2.extras.RealDictCursor
        return conn
    except Exception as e:
        print(f"❌ Erreur de connexion à la base de données : {e}")
        raise