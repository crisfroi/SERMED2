from flask_migrate import Migrate
from app import app
from database import db

migrate = Migrate(app, db)