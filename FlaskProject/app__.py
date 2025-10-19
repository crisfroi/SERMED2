import os
from pathlib import Path
from dotenv import load_dotenv

# Try loading from /etc/secrets/.env first (Render secret files)
render_env = Path("/etc/secrets/.env")
if render_env.exists():
    load_dotenv(render_env)
else:
    load_dotenv()  # fallback to local .env

# ...existing code...
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("SQLALCHEMY_DATABASE_URI")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
# ...existing code...# https://blog.miguelgrinberg.com/post/add-a-websocket-route-to-your-flask-2-x-application
# from flask import Flask
#
# app = Flask(__name__)
#
#
# @app.route('/')
# def hello_world():  # put application's code here
#     return 'Hello World!'
#
#
# if __name__ == '__main__':
#     app.run()
# python.exe -m flask run  --host=0.0.0.0 --port=7788
from flask import Flask, render_template
from flask_sock import Sock

app = Flask(__name__)
sock = Sock(app)


@app.route('/')
def index():
    return render_template('index.html')


@sock.route('/')
def echo(sock):
    while True:
        data = sock.receive()
        # if not data is None:
        print('收到消息/:', data)
        # sock.send(data[::-1])
        # sock.send(data)
@sock.route('/pub/chat')
def echo2(sock):
    while True:
        data = sock.receive()
        #if not data is None:
        print('收到消息/pub/chat:', data)
        # sock.send(data[::-1])
        #sock.send(data)
        if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7788, debug=True)