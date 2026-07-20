# crear_usuario.py
import bcrypt
import mysql.connector
from mysql.connector import Error

def crear_usuario():
    """
    Script para crear un usuario en la base de datos
    Credenciales por defecto: usuario: emir, contraseña: emir123
    """
    print("=" * 60)
    print("🔐 CREANDO USUARIO PARA EL SISTEMA DE CONTROL DE INSUMOS")
    print("=" * 60)
    
    try:
        # ==================== CONFIGURACIÓN DE LA BASE DE DATOS ====================
        # ¡CAMBIAR ESTOS VALORES SEGÚN TU CONFIGURACIÓN!
        DB_CONFIG = {
            'host': 'localhost',           # Cambia si tu BD está en otro servidor
            'database': 'control_insumos', # Nombre de tu base de datos
            'user': 'root',                # Tu usuario de MySQL
            'password': ''                 # Tu contraseña de MySQL
        }
        
        # ==================== DATOS DEL USUARIO ====================
        # ¡MODIFICA ESTOS DATOS SI QUIERES OTRO USUARIO!
        USERNAME = 'emir'          # Usuario para iniciar sesión
        PASSWORD = 'emir123'       # Contraseña para iniciar sesión
        NOMBRE_COMPLETO = 'Emir Administrador'
        ROL = 'admin'              # Opciones: admin, usuario, gerente
        
        print("📡 Conectando a la base de datos...")
        
        # Conectar a la base de datos
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor(dictionary=True)
        
        print("✅ Conexión establecida")
        print("-" * 60)
        
        # ==================== VERIFICAR TABLA USUARIOS ====================
        print("🔍 Verificando tabla usuarios...")
        
        # Verificar si la tabla usuarios existe
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = %s AND table_name = 'usuarios'
        """, (DB_CONFIG['database'],))
        
        tabla_existe = cursor.fetchone()['count'] > 0
        
        if not tabla_existe:
            print("⚠️ La tabla 'usuarios' no existe. Creándola...")
            
            # Crear tabla usuarios
            cursor.execute("""
                CREATE TABLE usuarios (
                    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
                    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
                    contrasena VARCHAR(255) NOT NULL,
                    nombre_completo VARCHAR(100),
                    rol VARCHAR(20) DEFAULT 'usuario',
                    activo BOOLEAN DEFAULT TRUE,
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            connection.commit()
            print("✅ Tabla 'usuarios' creada exitosamente")
        else:
            print("✅ Tabla 'usuarios' existe")
        
        # ==================== VERIFICAR SI EL USUARIO YA EXISTE ====================
        print(f"🔍 Verificando si el usuario '{USERNAME}' existe...")
        
        cursor.execute(
            "SELECT id_usuario FROM usuarios WHERE nombre_usuario = %s",
            (USERNAME,)
        )
        usuario_existente = cursor.fetchone()
        
        if usuario_existente:
            print(f"⚠️ El usuario '{USERNAME}' ya existe en la base de datos")
            print("-" * 60)
            
            # Mostrar todos los usuarios existentes
            cursor.execute("SELECT id_usuario, nombre_usuario, nombre_completo, rol, activo FROM usuarios")
            usuarios = cursor.fetchall()
            
            print("📋 USUARIOS EXISTENTES:")
            print("-" * 60)
            for u in usuarios:
                estado = "🟢 Activo" if u['activo'] else "🔴 Inactivo"
                print(f"ID: {u['id_usuario']} | Usuario: {u['nombre_usuario']} | Nombre: {u['nombre_completo']} | Rol: {u['rol']} | {estado}")
            print("-" * 60)
            
            connection.close()
            return
        
        # ==================== CREAR USUARIO ====================
        print("🔐 Hasheando contraseña...")
        
        # Hashear la contraseña
        hashed = bcrypt.hashpw(PASSWORD.encode('utf-8'), bcrypt.gensalt())
        contrasena_hasheada = hashed.decode('utf-8')
        
        print("💾 Insertando usuario en la base de datos...")
        
        # Insertar usuario
        sql = """
            INSERT INTO usuarios (nombre_usuario, contrasena, nombre_completo, rol, activo)
            VALUES (%s, %s, %s, %s, TRUE)
        """
        cursor.execute(sql, (USERNAME, contrasena_hasheada, NOMBRE_COMPLETO, ROL))
        connection.commit()
        
        # ==================== MOSTRAR RESULTADO ====================
        print("=" * 60)
        print("✅ USUARIO CREADO EXITOSAMENTE!")
        print("=" * 60)
        print(f"📝 Usuario:   {USERNAME}")
        print(f"🔑 Contraseña: {PASSWORD}")
        print(f"👤 Nombre:    {NOMBRE_COMPLETO}")
        print(f"🎯 Rol:       {ROL}")
        print("=" * 60)
        print("🌐 AHORA PUEDES INICIAR SESIÓN EN TU SISTEMA")
        print("=" * 60)
        
        # ==================== MOSTRAR TODOS LOS USUARIOS ====================
        cursor.execute("SELECT id_usuario, nombre_usuario, nombre_completo, rol, activo FROM usuarios")
        usuarios = cursor.fetchall()
        
        print("\n📋 USUARIOS REGISTRADOS:")
        print("-" * 60)
        for u in usuarios:
            estado = "🟢 Activo" if u['activo'] else "🔴 Inactivo"
            print(f"ID: {u['id_usuario']} | Usuario: {u['nombre_usuario']} | Rol: {u['rol']} | {estado}")
        print("-" * 60)
        
    except Error as e:
        print(f"❌ ERROR DE BASE DE DATOS: {e}")
        print("🔧 Verifica tu configuración de conexión:")
        print("   - host: localhost")
        print("   - database: control_insumos")
        print("   - user: tu_usuario_mysql")
        print("   - password: tu_contraseña_mysql")
    except Exception as e:
        print(f"❌ ERROR GENERAL: {e}")
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("🔒 Conexión cerrada")

# ==================== FUNCIÓN PARA VERIFICAR USUARIOS ====================
def verificar_usuarios():
    """Función para listar todos los usuarios de la base de datos"""
    print("\n" + "=" * 60)
    print("📋 VERIFICANDO USUARIOS EN LA BASE DE DATOS")
    print("=" * 60)
    
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='control_insumos',
            user='root',
            password=''
        )
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id_usuario, nombre_usuario, nombre_completo, rol, activo, fecha_creacion 
            FROM usuarios 
            ORDER BY id_usuario
        """)
        usuarios = cursor.fetchall()
        
        if usuarios:
            print("\n📋 USUARIOS EN LA BASE DE DATOS:")
            print("-" * 80)
            for u in usuarios:
                estado = "🟢 Activo" if u['activo'] else "🔴 Inactivo"
                fecha = u['fecha_creacion'].strftime("%Y-%m-%d %H:%M") if u['fecha_creacion'] else "N/A"
                print(f"ID: {u['id_usuario']:2d} | Usuario: {u['nombre_usuario']:15} | "
                      f"Nombre: {u['nombre_completo']:20} | Rol: {u['rol']:8} | {estado} | {fecha}")
            print("-" * 80)
        else:
            print("⚠️ No hay usuarios en la base de datos")
            
    except Error as e:
        print(f"❌ Error al verificar usuarios: {e}")
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    # Crear el usuario
    crear_usuario()
    
    # Opcional: Verificar todos los usuarios
    print("\n")
    verificar_usuarios()