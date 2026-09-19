"""Rotas relacionadas aos documentos: upload, listagem, visualização e download."""

import os
import uuid

from flask import Blueprint, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

import models
from config import ALLOWED_EXTENSIONS, UPLOAD_FOLDER

documents_bp = Blueprint("documents", __name__, url_prefix="/api/documents")


def is_extension_allowed(filename: str) -> bool:
    """Verifica se a extensão do arquivo está entre as permitidas (pdf, jpg, jpeg, png)."""
    if "." not in filename:
        return False
    extension = filename.rsplit(".", 1)[1].lower()
    return extension in ALLOWED_EXTENSIONS


def add_file_size(document: dict) -> dict:
    """Acrescenta ao documento o campo 'file_size' (em bytes), lido do arquivo em disco.

    Retorna None no campo caso o arquivo físico não exista mais.
    """
    file_path = os.path.join(UPLOAD_FOLDER, document["stored_filename"])
    document["file_size"] = os.path.getsize(file_path) if os.path.exists(file_path) else None
    return document


@documents_bp.route("", methods=["POST"])
def upload_document():
    """Recebe um arquivo (PDF, JPG ou PNG) com título e descrição opcional,
    salva o arquivo em disco e registra os metadados no banco de dados.
    """
    if "file" not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado."}), 400

    file = request.files["file"]
    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip() or None

    if file.filename == "":
        return jsonify({"error": "Nenhum arquivo selecionado."}), 400

    if not title:
        return jsonify({"error": "O título é obrigatório."}), 400

    if not is_extension_allowed(file.filename):
        return jsonify({"error": "Formato de arquivo não permitido. Use PDF, JPG ou PNG."}), 400

    original_filename = secure_filename(file.filename)
    file_extension = original_filename.rsplit(".", 1)[1].lower()
    stored_filename = f"{uuid.uuid4().hex}.{file_extension}"

    file.save(os.path.join(UPLOAD_FOLDER, stored_filename))

    document_id = models.create_document(
        title=title,
        description=description,
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_type=file_extension,
    )

    document = models.get_document_by_id(document_id)
    return jsonify(add_file_size(document)), 201


@documents_bp.route("", methods=["GET"])
def list_documents():
    """Retorna a lista de todos os documentos cadastrados."""
    documents = [add_file_size(document) for document in models.get_all_documents()]
    return jsonify(documents), 200


@documents_bp.route("/<int:document_id>", methods=["PUT"])
def update_document(document_id: int):
    """Atualiza o título e a descrição de um documento.

    Se um novo arquivo for enviado, substitui o arquivo físico atual
    (o arquivo antigo é removido do disco).
    """
    document = models.get_document_by_id(document_id)
    if document is None:
        return jsonify({"error": "Documento não encontrado."}), 404

    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip() or None

    if not title:
        return jsonify({"error": "O título é obrigatório."}), 400

    original_filename = document["original_filename"]
    stored_filename = document["stored_filename"]
    file_type = document["file_type"]

    new_file = request.files.get("file")
    if new_file and new_file.filename:
        if not is_extension_allowed(new_file.filename):
            return jsonify({"error": "Formato de arquivo não permitido. Use PDF, JPG ou PNG."}), 400

        old_file_path = os.path.join(UPLOAD_FOLDER, document["stored_filename"])
        if os.path.exists(old_file_path):
            os.remove(old_file_path)

        original_filename = secure_filename(new_file.filename)
        file_type = original_filename.rsplit(".", 1)[1].lower()
        stored_filename = f"{uuid.uuid4().hex}.{file_type}"
        new_file.save(os.path.join(UPLOAD_FOLDER, stored_filename))

    models.update_document(
        document_id=document_id,
        title=title,
        description=description,
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_type=file_type,
    )

    updated_document = models.get_document_by_id(document_id)
    return jsonify(add_file_size(updated_document)), 200


@documents_bp.route("/<int:document_id>", methods=["DELETE"])
def delete_document(document_id: int):
    """Remove um documento, seu arquivo físico e os comentários associados."""
    document = models.get_document_by_id(document_id)
    if document is None:
        return jsonify({"error": "Documento não encontrado."}), 404

    file_path = os.path.join(UPLOAD_FOLDER, document["stored_filename"])
    if os.path.exists(file_path):
        os.remove(file_path)

    models.delete_document(document_id)
    return "", 204


@documents_bp.route("/<int:document_id>/view", methods=["GET"])
def view_document(document_id: int):
    """Envia o arquivo para ser exibido diretamente no navegador (inline)."""
    document = models.get_document_by_id(document_id)
    if document is None:
        return jsonify({"error": "Documento não encontrado."}), 404

    return send_from_directory(
        UPLOAD_FOLDER, document["stored_filename"], as_attachment=False
    )


@documents_bp.route("/<int:document_id>/download", methods=["GET"])
def download_document(document_id: int):
    """Envia o arquivo como anexo para download, mantendo o nome original."""
    document = models.get_document_by_id(document_id)
    if document is None:
        return jsonify({"error": "Documento não encontrado."}), 404

    return send_from_directory(
        UPLOAD_FOLDER,
        document["stored_filename"],
        as_attachment=True,
        download_name=document["original_filename"],
    )
