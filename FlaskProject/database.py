# database.py
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def get_database_uri():
    uri = os.getenv("SQLALCHEMY_DATABASE_URI")
    if uri:
        return uri

    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASS", "123456")
    host = os.getenv("DB_HOST", "127.0.0.1")
    port = os.getenv("DB_PORT", "3305")
    name = os.getenv("DB_NAME", "fingerprint")
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}"

os.environ["FLASK_ENV"] = "development"
os.environ["FLASK_DEBUG"] = "1"
app = Flask(__name__)
app.debug = True