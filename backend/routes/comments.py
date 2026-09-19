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


@comments_bp.route("/<int:document_id>/comments/<int:comment_id>", methods=["PUT"])
def update_comment(document_id: int, comment_id: int):
    """Atualiza o texto de um comentário existente."""
    document = models.get_document_by_id(document_id)
    if document is None:
        return jsonify({"error": "Documento não encontrado."}), 404

    comment = models.get_comment_by_id(comment_id)
    if comment is None or comment["document_id"] != document_id:
        return jsonify({"error": "Comentário não encontrado."}), 404

    data = request.get_json(silent=True) or {}
    text = str(data.get("text", "")).strip()

    if not text:
        return jsonify({"error": "O comentário não pode estar vazio."}), 400

    models.update_comment(comment_id, text)
    updated_comment = models.get_comment_by_id(comment_id)
    return jsonify(updated_comment), 200


@comments_bp.route("/<int:document_id>/comments/<int:comment_id>", methods=["DELETE"])
def delete_comment(document_id: int, comment_id: int):
    """Remove um comentário de um documento."""
    document = models.get_document_by_id(document_id)
    if document is None:
        return jsonify({"error": "Documento não encontrado."}), 404

    comment = models.get_comment_by_id(comment_id)
    if comment is None or comment["document_id"] != document_id:
        return jsonify({"error": "Comentário não encontrado."}), 404

    models.delete_comment(comment_id)
    return "", 204
