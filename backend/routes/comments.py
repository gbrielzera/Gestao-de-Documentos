"""Rotas relacionadas aos comentários de um documento."""

from flask import Blueprint, jsonify, request

import models

comments_bp = Blueprint("comments", __name__, url_prefix="/api/documents")


@comments_bp.route("/<int:document_id>/comments", methods=["GET"])
def list_comments(document_id: int):
    """Retorna o histórico de comentários de um documento específico."""
    document = models.get_document_by_id(document_id)
    if document is None:
        return jsonify({"error": "Documento não encontrado."}), 404

    comments = models.get_comments_by_document(document_id)
    return jsonify(comments), 200


@comments_bp.route("/<int:document_id>/comments", methods=["POST"])
def add_comment(document_id: int):
    """Adiciona um novo comentário a um documento, registrando a data/hora automaticamente."""
    document = models.get_document_by_id(document_id)
    if document is None:
        return jsonify({"error": "Documento não encontrado."}), 404

    data = request.get_json(silent=True) or {}
    text = str(data.get("text", "")).strip()

    if not text:
        return jsonify({"error": "O comentário não pode estar vazio."}), 400

    comment_id = models.create_comment(document_id, text)
    comments = models.get_comments_by_document(document_id)
    new_comment = next(c for c in comments if c["id"] == comment_id)
    return jsonify(new_comment), 201
