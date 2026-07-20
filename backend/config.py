import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'tu_clave_secreta_aqui')
    MYSQL_HOST = 'localhost'
    MYSQL_USER = 'root'
    MYSQL_PASSWORD = ''  # Tu contraseña de MySQL
    MYSQL_DB = 'control_insumos'
    MYSQL_PORT = 3306