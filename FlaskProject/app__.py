# app.py (VERSIÓN LIMPIA Y UNIFICADA)

import os
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, render_template
from flask_sock import Sock
# Importa tu lógica de DB
from database import init_db 
# Importa tus clases de servicio (solo si las necesitas aquí)
# from services.attendance_service import AttendanceService 
# from web_socket.WebSocketPool import WebSocketPool 
# ----------------------------------------------------------------------
# 1. Configuración de Entorno (Debe ser lo primero)
# ----------------------------------------------------------------------

# Esto es correcto: carga variables de Render o localmente
render_env = Path("/etc/secrets/.env")
if render_env.exists():
    load_dotenv(render_env)
else:
    load_dotenv() 

# ----------------------------------------------------------------------
# 2. Application Factory (para que Gunicorn sepa qué ejecutar)
# ----------------------------------------------------------------------

def create_app():
    app = Flask(__name__)
    app.debug = os.getenv("FLASK_DEBUG", "0") == "1"
    
    # Configuración y conexión de la Base de Datos (llama a tu función corregida)
    # Esto llama a database.init_db(app) y establece SQLALCHEMY_DATABASE_URI
    init_db(app) 
    
    # Inicialización de WebSockets
    sock = Sock(app)
    
    # ----------------------------------------------------------------------
    # RUTAS ESTÁNDAR
    # ----------------------------------------------------------------------
    @app.route('/')
    def index():
        return render_template('index.html')

    # ----------------------------------------------------------------------
    # RUTAS DE WEBSOCKETS
    # ----------------------------------------------------------------------
    @sock.route('/')
    def echo(sock):
        while True:
            data = sock.receive()
            print('收到消息/:', data)
            
    @sock.route('/pub/chat')
    def echo2(sock):
        while True:
            data = sock.receive()
            print('收到消息/pub/chat:', data)

    return app

# ----------------------------------------------------------------------
# 3. Punto de Entrada para Gunicorn y Desarrollo Local
# ----------------------------------------------------------------------

# Gunicorn (Render) buscará 'app' o usará 'create_app()'.
app = create_app()

if __name__ == '__main__':
    # Esto es solo para ejecutar localmente
    app.run(host='0.0.0.0', port=7788, debug=True)