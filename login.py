from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta, timezone

# Adicione no início do arquivo
bcrypt = Bcrypt()

@login_bp.route("/login", methods=["POST"])
def login():
    try:
        usuario = request.json
        if not usuario or 'email' not in usuario or 'senha' not in usuario:
            return jsonify({"success": False, "message": "Credenciais inválidas"}), 400

        email = usuario["email"]
        senha = usuario["senha"]

        conn = connect_db()
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        # Consulta corrigida para a tabela de usuários
        cursor.execute("SELECT * FROM usuarios WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user or not bcrypt.check_password_hash(user['senha'], senha):
            return jsonify({"success": False, "message": "Credenciais inválidas"}), 401

        # Geração do token com timezone
        token = jwt.encode({
            'sub': user['email'],
            'exp': datetime.now(timezone.utc) + timedelta(hours=1)
        }, SECRET_KEY, algorithm="HS256")

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
        print(e)
        return jsonify({"success": False, "message": "Erro no servidor"}), 500
    finally:
        cursor.close()
        conn.close()

# Adicione esta função no login.py para criar a tabela de usuários
def init_db():
    conn = None
    cursor = None
    try:
        conn = connect_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                senha VARCHAR(255) NOT NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        print("Tabela de usuários criada com sucesso.")
    except Exception as e:
        print("Erro ao criar tabela de usuários:", e)
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Execute a criação da tabela ao iniciar
init_db()