# Deploy no PythonAnywhere

Guia prático para fazer deploy da aplicação "Gestão de Documentos" no PythonAnywhere.

## 1. Criar conta no PythonAnywhere

1. Acesse [www.pythonanywhere.com](https://www.pythonanywhere.com)
2. Clique em "Pricing & Sign Up"
3. Escolha o plano "Beginner" (gratuito)
4. Crie sua conta com email e senha
5. Confirme o email

## 2. Fazer upload dos arquivos

### Via Console (Recomendado)

1. No dashboard do PythonAnywhere, clique em "Bash console"
2. Execute os comandos abaixo:

```bash
# Clone ou copie o repositório
cd ~
git clone https://github.com/seu-usuario/Desafio-Estagio.git
# OU faça upload manualmente

# Entre no diretório do backend
cd Desafio-Estagio/backend

# Crie um ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instale as dependências
pip install -r requirements.txt
```

### Via Web Upload

1. Clique em "Files" no menu do PythonAnywhere
2. Navegue até a pasta de home (`/home/seu_usuario`)
3. Faça upload dos arquivos do projeto

## 3. Criar um Web App

1. Clique em "Web" no menu
2. Clique em "+ Add a new web app"
3. Selecione "Manual configuration" (não Template)
4. Escolha Python 3.10 (ou a versão disponível)
5. Clique em criar

## 4. Configurar o arquivo WSGI

1. Após criar o Web App, você verá uma URL como `https://seu_usuario.pythonanywhere.com`
2. No mesmo painel, clique em "Go to web app" ou "Web"
3. Procure por "Code" ou "WSGI configuration file"
4. Abra o arquivo WSGI (geralmente algo como `/var/www/seu_usuario_pythonanywhere_com_wsgi.py`)
5. **Apague todo o conteúdo** e substitua por:

```python
import sys
import os

# Adiciona o diretório do projeto ao path
path = '/home/seu_usuario/Desafio-Estagio/backend'
if path not in sys.path:
    sys.path.insert(0, path)

# Importa a aplicação Flask
from wsgi import application
```

**Importante**: Substitua `seu_usuario` pelo seu username no PythonAnywhere.

## 5. Configurar as variáveis de ambiente

1. No painel "Web", procure por "Web app" ou as configurações do app
2. Se houver uma seção de "Environment variables", adicione (opcional):
   - `FLASK_ENV=production`

## 6. Configurar o banco de dados

1. O SQLite será criado automaticamente no primeiro acesso
2. A pasta `uploads/` também será criada automaticamente
3. Garanta que o diretório `/home/seu_usuario/Desafio-Estagio/backend` tenha permissão de escrita

## 7. Recarregar a aplicação

1. No painel "Web", clique em "Reload"
2. Aguarde alguns segundos
3. Acesse `https://seu_usuario.pythonanywhere.com` no navegador

## 8. Solução de problemas

### Erro 500 ou aplicação não carrega

1. Acesse o "Log Files" no painel "Web"
2. Abra `error.log` para ver o erro
3. Erros comuns:
   - **ModuleNotFoundError**: verifique o path no WSGI
   - **PermissionError**: verifique permissões da pasta `uploads/`
   - **SyntaxError**: verifique se o WSGI está correto

### API retorna 404

1. Verifique se a requisição está usando `/api/` e não `http://127.0.0.1:5000/api`
2. O arquivo `app.js` detecta automaticamente se está em localhost

### Arquivos estáticos (CSS, JS) não carregam

1. Verifique se a pasta `frontend/` está no caminho correto
2. Reload o app novamente

## 9. URL da aplicação

Após tudo configurado, acesse:
```
https://seu_usuario.pythonanywhere.com
```

## Dicas de segurança

1. **Nunca** use `debug=True` em produção
2. Mude a variável `SECRET_KEY` se implementar autenticação
3. Considere adicionar HTTPS (PythonAnywhere fornece gratuitamente)
4. Faça backup regular do banco de dados (`database.db`)

## Próximos passos

Após fazer deploy:
1. Teste o upload de um documento
2. Teste a edição e exclusão
3. Teste a busca e filtros
4. Compartilhe a URL com outras pessoas

## Suporte

- [Documentação PythonAnywhere](https://help.pythonanywhere.com/)
- [Flask Documentation](https://flask.palletsprojects.com/)
