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
    return jsonify(document), 201


@documents_bp.route("", methods=["GET"])
def list_documents():
    """Retorna a lista de todos os documentos cadastrados."""
    documents = models.get_all_documents()
    return jsonify(documents), 200


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
