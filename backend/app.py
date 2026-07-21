from flask import Flask, request, jsonify, session, render_template
from flask_cors import CORS
import bcrypt
from datetime import datetime
from database import get_db_connection, execute_query
import os  # Para variables de entorno

app = Flask(__name__, template_folder="../frontend", static_folder="../frontend")  # CORREGIDO: unificar carpetas

# ==================== CONFIGURACIÓN DE SEGURIDAD ====================
# Usar variable de entorno para la clave secreta
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'clave_por_defecto_cambiar_en_produccion')
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_PERMANENT'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hora

# ==================== CONFIGURACIÓN CORS ====================
CORS(app,
     supports_credentials=True,
     origins=[
         "http://localhost:8012",
         "https://github.io",          # CAMBIA esto por tu dominio real
         "https://127.0.0.1:8012"
     ]
)

# ==================== RUTA PRINCIPAL ====================
@app.route("/")
def home():
    return render_template("index.html")

# ==================== AUTENTICACIÓN ====================
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')

        # Validar que lleguen los datos
        if not username or not password:
            return jsonify({'success': False, 'message': 'Faltan credenciales'}), 400

        # 🔥 LOGIN HARCODEADO PARA PRUEBAS
        if username == "emir" and password == "emir123":
            session['user_id'] = 1
            session['username'] = 'emir'
            session['role'] = 'admin'
            return jsonify({
                'success': True,
                'message': 'Login exitoso',
                'user': {
                    'id': 1,
                    'username': 'emir',
                    'nombre_completo': 'Emir Administrador',
                    'rol': 'admin'
                }
            })

        # Buscar usuario en la base de datos
        query = "SELECT * FROM usuarios WHERE nombre_usuario = %s AND activo = TRUE"
        user = execute_query(query, (username,))

        if not user:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 401

        user = user[0]

        if bcrypt.checkpw(password.encode('utf-8'), user['contrasena'].encode('utf-8')):
            session['user_id'] = user['id_usuario']
            session['username'] = user['nombre_usuario']
            session['role'] = user['rol']

            return jsonify({
                'success': True,
                'message': 'Login exitoso',
                'user': {
                    'id': user['id_usuario'],
                    'username': user['nombre_usuario'],
                    'nombre_completo': user['nombre_completo'],
                    'rol': user['rol']
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Contraseña incorrecta'}), 401

    except Exception as e:
        print(f"Error en login: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Sesión cerrada'})

@app.route('/check_session', methods=['GET'])
def check_session():
    if 'user_id' in session:
        return jsonify({
            'authenticated': True,
            'user': {
                'id': session['user_id'],
                'username': session['username'],
                'rol': session['role']
            }
        })
    return jsonify({'authenticated': False}), 401

# ==================== INSUMOS ====================
@app.route('/insumos', methods=['GET'])
def get_insumos():
    try:
        query = """
        SELECT i.*, c.nombre_categoria 
        FROM insumos i
        LEFT JOIN categorias c ON i.id_categoria = c.id_categoria
        ORDER BY i.nombre
        """
        insumos = execute_query(query)
        return jsonify(insumos)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/insumos/<int:id>', methods=['GET'])
def get_insumo(id):
    try:
        query = """
        SELECT i.*, c.nombre_categoria 
        FROM insumos i
        LEFT JOIN categorias c ON i.id_categoria = c.id_categoria
        WHERE i.id_insumo = %s
        """
        insumo = execute_query(query, (id,))
        if insumo:
            return jsonify(insumo[0])
        return jsonify({'error': 'Insumo no encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/insumos', methods=['POST'])
def create_insumo():
    try:
        data = request.json
        # Validar campos obligatorios
        required = ['codigo', 'nombre']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es obligatorio'}), 400

        query = """
        INSERT INTO insumos (codigo, nombre, descripcion, id_categoria, 
               unidad_medida, stock_minimo, stock_actual, precio_unitario)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            data['codigo'],
            data['nombre'],
            data.get('descripcion', ''),
            data.get('id_categoria'),
            data.get('unidad_medida', ''),
            data.get('stock_minimo', 5),
            data.get('stock_actual', 0),
            data.get('precio_unitario', 0)
        )
        id_insumo = execute_query(query, params)
        return jsonify({'success': True, 'id': id_insumo, 'message': 'Insumo creado'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/insumos/<int:id>', methods=['PUT'])
def update_insumo(id):
    try:
        data = request.json
        # Validar campos obligatorios
        required = ['codigo', 'nombre']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es obligatorio'}), 400

        query = """
        UPDATE insumos 
        SET codigo = %s, nombre = %s, descripcion = %s, id_categoria = %s,
            unidad_medida = %s, stock_minimo = %s, stock_actual = %s, precio_unitario = %s
        WHERE id_insumo = %s
        """
        params = (
            data['codigo'],
            data['nombre'],
            data.get('descripcion', ''),
            data.get('id_categoria'),
            data.get('unidad_medida', ''),
            data.get('stock_minimo', 5),
            data.get('stock_actual', 0),
            data.get('precio_unitario', 0),
            id
        )
        execute_query(query, params)
        return jsonify({'success': True, 'message': 'Insumo actualizado'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/insumos/<int:id>', methods=['DELETE'])
def delete_insumo(id):
    try:
        query = "DELETE FROM insumos WHERE id_insumo = %s"
        execute_query(query, (id,))
        return jsonify({'success': True, 'message': 'Insumo eliminado'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== MOVIMIENTOS ====================
@app.route('/movimientos', methods=['GET'])
def get_movimientos():
    try:
        query = """
        SELECT m.*, i.nombre as insumo_nombre, u.nombre_completo as usuario_nombre
        FROM movimientos m
        LEFT JOIN insumos i ON m.id_insumo = i.id_insumo
        LEFT JOIN usuarios u ON m.id_usuario = u.id_usuario
        ORDER BY m.fecha_movimiento DESC
        LIMIT 100
        """
        movimientos = execute_query(query)
        return jsonify(movimientos)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/movimientos', methods=['POST'])
def create_movimiento():
    try:
        data = request.json
        # Validar campos obligatorios
        required = ['id_insumo', 'tipo_movimiento', 'cantidad']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es obligatorio'}), 400

        # Registrar movimiento
        query_mov = """
        INSERT INTO movimientos (id_insumo, tipo_movimiento, cantidad, id_usuario, observaciones)
        VALUES (%s, %s, %s, %s, %s)
        """
        params_mov = (
            data['id_insumo'],
            data['tipo_movimiento'],
            data['cantidad'],
            session.get('user_id', 1),  # Si no hay sesión, asigna 1 (pero deberías validar autenticación)
            data.get('observaciones', '')
        )
        execute_query(query_mov, params_mov)

        # Actualizar stock
        if data['tipo_movimiento'] == 'entrada':
            query_update = "UPDATE insumos SET stock_actual = stock_actual + %s WHERE id_insumo = %s"
        else:
            query_update = "UPDATE insumos SET stock_actual = stock_actual - %s WHERE id_insumo = %s"

        execute_query(query_update, (data['cantidad'], data['id_insumo']))

        return jsonify({'success': True, 'message': 'Movimiento registrado'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== CATEGORÍAS ====================
@app.route('/categorias', methods=['GET'])
def get_categorias():
    try:
        query = "SELECT * FROM categorias ORDER BY nombre_categoria"
        categorias = execute_query(query)
        return jsonify(categorias)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== PROVEEDORES ====================
@app.route('/proveedores', methods=['GET'])
def get_proveedores():
    try:
        query = "SELECT * FROM proveedores ORDER BY nombre_proveedor"
        proveedores = execute_query(query)
        return jsonify(proveedores)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== REPORTES ====================
@app.route('/reportes/stock_bajo', methods=['GET'])
def stock_bajo():
    try:
        query = """
        SELECT * FROM insumos 
        WHERE stock_actual <= stock_minimo
        ORDER BY stock_actual ASC
        """
        reporte = execute_query(query)
        return jsonify(reporte)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/reportes/resumen', methods=['GET'])
def resumen():
    try:
        resumen = {}

        # Total insumos
        query = "SELECT COUNT(*) as total FROM insumos"
        result = execute_query(query)
        resumen['total_insumos'] = result[0]['total'] if result else 0

        # Insumos con stock bajo
        query = "SELECT COUNT(*) as bajo FROM insumos WHERE stock_actual <= stock_minimo"
        result = execute_query(query)
        resumen['stock_bajo'] = result[0]['bajo'] if result else 0

        # Total movimientos hoy (asume MySQL)
        query = "SELECT COUNT(*) as hoy FROM movimientos WHERE DATE(fecha_movimiento) = CURDATE()"
        result = execute_query(query)
        resumen['movimientos_hoy'] = result[0]['hoy'] if result else 0

        return jsonify(resumen)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/check_session', methods=['GET'])
def check_session():
    if 'user' in session:
        return jsonify({'logged_in': True, 'user': session['user']}), 200
    return jsonify({'logged_in': False}), 200
# ==================== INICIO ====================
if __name__ == '__main__':
    app.run(debug=True, port=5005)