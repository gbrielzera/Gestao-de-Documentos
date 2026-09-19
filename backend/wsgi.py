"""Ponto de entrada WSGI para o PythonAnywhere.

Este arquivo configura a aplicação Flask para rodar em um servidor WSGI.
O PythonAnywhere carrega automaticamente este arquivo e chama 'application'.
"""

import os
import sys

# Adiciona o diretório backend ao path para que os imports funcionem
sys.path.insert(0, os.path.dirname(__file__))

from app import app as application
