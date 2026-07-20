import mysql.connector
from config import Config

try:
    # Intenta realizar la conexión usando los datos de tu clase Config
    conexion = mysql.connector.connect(
        host=Config.MYSQL_HOST,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DB,
        port=Config.MYSQL_PORT
    )

    if conexion.is_connected():
        print("✅ ¡CONEXIÓN EXITOSA!")
        cursor = conexion.cursor()
        cursor.execute("SHOW TABLES;")
        tablas = cursor.fetchall()
        print("Tablas encontradas en 'control_insumos':")
        for tabla in tablas:
            print(f"- {tabla[0]}")

except mysql.connector.Error as error:
    print(f"❌ ERROR AL CONECTAR: {error}")

finally:
    if 'conexion' in locals() and conexion.is_connected():
        conexion.close()