"""Configurações centrais da aplicação.

Mantém em um só lugar os caminhos de arquivos e as constantes de
validação usadas pelo restante do back-end.
"""

import os

# Diretório raiz do back-end (onde este arquivo está localizado)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Caminho do arquivo do banco de dados SQLite
DATABASE_PATH = os.path.join(BASE_DIR, "database.db")

# Pasta onde os arquivos enviados pelos usuários são salvos fisicamente
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

# Extensões de arquivo permitidas no upload
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}

# Tamanho máximo de upload aceito (10 MB)
MAX_CONTENT_LENGTH = 10 * 1024 * 1024
