import pymysql
from flask import Blueprint, jsonify, request
from db_config import connect_db
from auth_middleware import token_required

curso_bp = Blueprint('cursos', __name__)

def init_cursos_db():
    try:
        conn = connect_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS curso (
                    idcurso INT AUTO_INCREMENT PRIMARY KEY,
                    nome VARCHAR(255) NOT NULL,
                    descricao TEXT,
                    carga_horaria INT,
                    valor DECIMAL(10,2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
    except Exception as e:
        print(f"Erro na criação da tabela: {e}")
    finally:
        if conn:
            conn.close()

init_cursos_db()

@curso_bp.route('', methods=['GET'])
@token_required
def get_cursos(current_user):
    conn = None
    try:
        conn = connect_db()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT * FROM curso")
            return jsonify(cursor.fetchall()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@curso_bp.route('/<int:id>', methods=['GET'])
@token_required
def get_curso(current_user, id):
    conn = None
    try:
        conn = connect_db()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT * FROM curso WHERE idcurso = %s", (id,))
            result = cursor.fetchone()
            return jsonify(result) if result else (jsonify({'message': 'Curso não encontrado'}), 404)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@curso_bp.route('', methods=['POST'])
@token_required
def create_curso(current_user):
    try:
        data = request.get_json()
        conn = connect_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO curso (nome, descricao, carga_horaria, valor)
                VALUES (%s, %s, %s, %s)
            """, (data['nome'], data['descricao'], data['carga_horaria'], data['valor']))
            conn.commit()
            return jsonify({'message': 'Curso criado', 'id': cursor.lastrowid}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@curso_bp.route('/<int:id>', methods=['PUT'])
@token_required
def update_curso(current_user, id):
    try:
        data = request.get_json()
        conn = connect_db()
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE curso SET
                nome = %s,
                descricao = %s,
                carga_horaria = %s,
                valor = %s
                WHERE idcurso = %s
            """, (data['nome'], data['descricao'], data['carga_horaria'], data['valor'], id))
            conn.commit()
            return jsonify({'message': 'Curso atualizado'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@curso_bp.route('/<int:id>', methods=['DELETE'])
@token_required
def delete_curso(current_user, id):
    try:
        conn = connect_db()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM curso WHERE idcurso = %s", (id,))
            conn.commit()
            return jsonify({'message': 'Curso deletado'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()