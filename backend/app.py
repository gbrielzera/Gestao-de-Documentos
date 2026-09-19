"""Ponto de entrada da aplicação Flask.

Cria a aplicação, habilita CORS para o front-end, garante a existência
da pasta de uploads e do banco de dados, e registra as rotas da API.
Também serve o front-end como arquivos estáticos.
"""

import os

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from config import MAX_CONTENT_LENGTH, UPLOAD_FOLDER
from database import init_db
from routes.comments import comments_bp
from routes.documents import documents_bp

# Caminho do diretório frontend (irmão do diretório backend)
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")


def create_app() -> Flask:
    """Cria e configura a instância da aplicação Flask."""
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

    CORS(app)

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    init_db()

    app.register_blueprint(documents_bp)
    app.register_blueprint(comments_bp)

    @app.route("/")
    def index():
        """Serve a página index.html do front-end."""
        index_path = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_path):
            return send_from_directory(FRONTEND_DIR, "index.html")
        return jsonify({"error": "Frontend não encontrado."}), 404

    @app.route("/<path:filename>", methods=["GET"])
    def serve_frontend(filename):
        """Serve arquivos estáticos (CSS, JS) do front-end."""
        # Não serve diretórios, apenas arquivos específicos de css/ e js/
        if filename.startswith(("css/", "js/")):
            file_path = os.path.join(FRONTEND_DIR, filename)
            if os.path.exists(file_path) and os.path.isfile(file_path):
                return send_from_directory(FRONTEND_DIR, filename)
        return jsonify({"error": "Recurso não encontrado."}), 404

    @app.errorhandler(404)
    def handle_not_found(error):
        """Retorna 404 em JSON em vez da página HTML padrão do Flask."""
        return jsonify({"error": "Recurso não encontrado."}), 404

    @app.errorhandler(500)
    def handle_internal_error(error):
        """Retorna 500 em JSON em vez da página HTML padrão do Flask.

        Com debug=True, exceções não tratadas abrem o debugger interativo do
        Werkzeug em vez de passar por aqui; este handler cobre modo produção
        (debug=False) e erros levantados explicitamente com abort(500).
        """
        return jsonify({"error": "Erro interno do servidor."}), 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
