# database.py
import os
from typing import Optional
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()


def get_database_uri() -> str:
    """Get database URI based on environment."""
    # Check if we're in production (Render)
    if os.getenv('RENDER'):
        # Use Supabase PostgreSQL connection
        return f"postgresql://{os.getenv('SUPABASE_DB_USER')}:{os.getenv('SUPABASE_DB_PASSWORD')}@{os.getenv('SUPABASE_DB_HOST')}/{os.getenv('SUPABASE_DB_NAME')}"
    
    # Local development - MySQL
    return (
        os.getenv('SQLALCHEMY_DATABASE_URI') or
        f"mysql+pymysql://{os.getenv('DB_USER', 'root')}:{os.getenv('DB_PASS', '123456')}"
        f"@{os.getenv('DB_HOST', '127.0.0.1')}:{os.getenv('DB_PORT', '33050')}"
        f"/{os.getenv('DB_NAME', 'fingerprint')}"
    )


os.environ["FLASK_ENV"] = "development"
os.environ["FLASK_DEBUG"] = "1"
app = Flask(__name__)
app.debug = True
