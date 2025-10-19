# database.py
import os
from typing import Optional

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def get_database_uri() -> str:
    """Get database URI from environment or default configuration."""
    uri: Optional[str] = os.getenv("SQLALCHEMY_DATABASE_URI")
    if uri:
        return uri

    user: str = os.getenv("DB_USER", "root")
    password: str = os.getenv("DB_PASS", "123456")
    host: str = os.getenv("DB_HOST", "127.0.0.1")
    port: str = os.getenv("DB_PORT", "33050")
    name: str = os.getenv("DB_NAME", "fingerprint")

    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}"


os.environ["FLASK_ENV"] = "development"
os.environ["FLASK_DEBUG"] = "1"
app = Flask(__name__)
app.debug = True
