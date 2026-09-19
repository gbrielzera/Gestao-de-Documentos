"""Camada de acesso ao banco de dados SQLite.

Concentra a criação das tabelas e a função de conexão utilizada por
toda a aplicação, evitando duplicação de código SQL nas rotas.
"""

import sqlite3
from sqlite3 import Connection

from config import DATABASE_PATH


def get_connection() -> Connection:
    """Abre e retorna uma conexão com o banco de dados SQLite.

    Configura `row_factory` como `sqlite3.Row` para permitir o acesso
    aos resultados das consultas por nome de coluna (ex: row["title"]).
    """
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db() -> None:
    """Cria as tabelas 'documents' e 'comments' caso ainda não existam.

    Deve ser chamada uma vez na inicialização da aplicação.
    """
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            original_filename TEXT NOT NULL,
            stored_filename TEXT NOT NULL,
            file_type TEXT NOT NULL,
            upload_date TEXT NOT NULL
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
        )
        """
    )

    connection.commit()
    connection.close()
