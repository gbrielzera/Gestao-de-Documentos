"""Ponto de entrada da aplicação Flask.

Cria a aplicação, habilita CORS para o front-end, garante a existência
da pasta de uploads e do banco de dados, e registra as rotas da API.
"""

import os

from flask import Flask
from flask_cors import CORS

from config import MAX_CONTENT_LENGTH, UPLOAD_FOLDER
from database import init_db
from routes.comments import comments_bp
from routes.documents import documents_bp


def create_app() -> Flask:
    """Cria e configura a instância da aplicação Flask."""
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

    CORS(app)

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    init_db()

    app.register_blueprint(documents_bp)
    app.register_blueprint(comments_bp)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
