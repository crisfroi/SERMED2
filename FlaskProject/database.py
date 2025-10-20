# database.py (CORREGIDO)
import os
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()

def get_database_uri() -> str:
    """Obtiene la URI de la base de datos de Supabase."""
    
    # ⚠️ Asegúrate de que estas variables estén definidas en Render
    if not all([os.getenv('SUPABASE_DB_USER'), os.getenv('SUPABASE_DB_HOST')]):
        # Si no están las variables, lanzamos un error para que el despliegue falle claramente.
        raise ValueError("Las variables de entorno de Supabase no están definidas en Render.")

    # Conexión exclusiva a Supabase PostgreSQL
    return (
        f"postgresql://{os.getenv('SUPABASE_DB_USER')}:{os.getenv('SUPABASE_DB_PASSWORD')}@"
        f"{os.getenv('SUPABASE_DB_HOST')}/{os.getenv('SUPABASE_DB_NAME')}"
    )

def init_db(app):
    """Inicializa la extensión de SQLAlchemy en la aplicación Flask."""
    
    # 1. ASIGNA LA URI a la configuración de la aplicación
    app.config["SQLALCHEMY_DATABASE_URI"] = get_database_uri()
    
    # 2. Inicializa la extensión de la BD
    db.init_app(app) 
    
    return db

# ELIMINAMOS las líneas 'app = Flask(__name__)' y 'os.environ...' de este archivo.