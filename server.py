from flask import Flask, send_from_directory, redirect
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from cursos import curso_bp
from auth import auth_bp
from auth_middleware import token_required
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='static')
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# Desativar cache para desenvolvimento
@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# CORS Config
CORS(app, resources={
    r"/api/*": {"origins": "*"},
    r"/static/*": {"origins": "*"}
})

# Registrar Blueprints
app.register_blueprint(curso_bp, url_prefix='/api/cursos')
app.register_blueprint(auth_bp, url_prefix='/api/auth')

@app.route('/')
def index():
    return redirect('/login.html')

@app.route('/login.html')
def login_page():
    return send_from_directory(app.static_folder, 'login.html')

@app.route('/cursos.html')
def cursos_page(): 
    return send_from_directory(app.static_folder, 'cursos.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)