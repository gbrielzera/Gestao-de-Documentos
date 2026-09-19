"""Funções de acesso a dados (data access layer).

Cada função executa uma operação específica no banco de dados e
devolve estruturas simples (dicionários/listas), mantendo as rotas
livres de SQL.
"""

from datetime import datetime
from typing import Any, Optional

from database import get_connection


def create_document(
    title: str,
    description: Optional[str],
    original_filename: str,
    stored_filename: str,
    file_type: str,
) -> int:
    """Insere um novo documento no banco e retorna o id gerado."""
    upload_date = datetime.now().isoformat(timespec="seconds")

    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        INSERT INTO documents
            (title, description, original_filename, stored_filename, file_type, upload_date)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (title, description, original_filename, stored_filename, file_type, upload_date),
    )
    connection.commit()
    document_id = cursor.lastrowid
    connection.close()
    return document_id


def get_all_documents() -> list[dict[str, Any]]:
    """Retorna todos os documentos cadastrados, do mais recente para o mais antigo."""
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        SELECT id, title, description, original_filename, stored_filename, file_type, upload_date
        FROM documents
        ORDER BY id DESC
        """
    )
    rows = cursor.fetchall()
    connection.close()
    return [dict(row) for row in rows]


def get_document_by_id(document_id: int) -> Optional[dict[str, Any]]:
    """Busca um documento pelo id. Retorna None se não encontrado."""
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        SELECT id, title, description, original_filename, stored_filename, file_type, upload_date
        FROM documents
        WHERE id = ?
        """,
        (document_id,),
    )
    row = cursor.fetchone()
    connection.close()
    return dict(row) if row else None


def create_comment(document_id: int, text: str) -> int:
    """Insere um novo comentário associado a um documento e retorna o id gerado."""
    created_at = datetime.now().isoformat(timespec="seconds")

    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        INSERT INTO comments (document_id, text, created_at)
        VALUES (?, ?, ?)
        """,
        (document_id, text, created_at),
    )
    connection.commit()
    comment_id = cursor.lastrowid
    connection.close()
    return comment_id


def get_comments_by_document(document_id: int) -> list[dict[str, Any]]:
    """Retorna todos os comentários de um documento, do mais antigo para o mais recente."""
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        SELECT id, document_id, text, created_at
        FROM comments
        WHERE document_id = ?
        ORDER BY id ASC
        """,
        (document_id,),
    )
    rows = cursor.fetchall()
    connection.close()
    return [dict(row) for row in rows]
