from flask import Blueprint, request, jsonify
import pymysql
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from db_config import connect_db
import os
from auth_middleware import token_required  # Importação adicionada


auth_bp = Blueprint('auth', __name__)

def init_auth_db():
    try:
        conn = connect_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS usuarios (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nome VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    senha VARCHAR(255) NOT NULL,
                    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
    except Exception as e:
        print(f"Erro na criação da tabela: {e}")
    finally:
        if conn:
            conn.close()

init_auth_db()

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'senha' not in data:
            return jsonify({"success": False, "message": "Credenciais inválidas"}), 400

        conn = connect_db()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT * FROM usuarios WHERE email = %s", (data['email'],))
            user = cursor.fetchone()

            if not user or not bcrypt.checkpw(data['senha'].encode('utf-8'), user['senha'].encode('utf-8')):
                return jsonify({"success": False, "message": "Credenciais inválidas"}), 401

            token = jwt.encode({
                'sub': user['email'],
                'exp': datetime.now(timezone.utc) + timedelta(hours=2)
            }, os.getenv('SECRET_KEY'), algorithm="HS256")

            return jsonify({
                "success": True,
                "token": token,
                "user": {
                    "id": user['id'],
                    "nome": user['nome'],
                    "email": user['email']
                }
            }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn:
            conn.close()

@auth_bp.route('/registrar', methods=['POST'])
def registrar():
    try:
        data = request.get_json()
        required = ['nome', 'email', 'senha']
        if not all(field in data for field in required):
            return jsonify({"success": False, "message": "Campos faltando"}), 400

        hashed = bcrypt.hashpw(data['senha'].encode('utf-8'), bcrypt.gensalt())
        
        conn = connect_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO usuarios (nome, email, senha)
                VALUES (%s, %s, %s)
            """, (data['nome'], data['email'], hashed.decode()))
            conn.commit()
            return jsonify({"success": True, "message": "Usuário criado"}), 201
    except pymysql.IntegrityError:
        return jsonify({"success": False, "message": "Email já existe"}), 409
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn:
            conn.close()

@auth_bp.route('/check', methods=['GET'])
@token_required  # Agora reconhecerá o decorador
def check_token(current_user):
    return jsonify({"valid": True}), 200

# Adicione no final do auth.py
if __name__ == '__main__':
    init_auth_db()