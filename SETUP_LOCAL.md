# Setup Local - Gestão de Documentos

Guia para rodar a aplicação localmente.

## Pré-requisitos

- Python 3.8+
- Git (opcional, para clonar o repositório)

## Instalação

### 1. Preparar o ambiente

```bash
# Entre no diretório do backend
cd backend

# Crie um ambiente virtual
python -m venv venv

# Ative o ambiente virtual
# No Windows (Git Bash ou PowerShell):
source venv/Scripts/activate
# No Linux/macOS:
source venv/bin/activate
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Rodar a aplicação

```bash
python app.py
```

A aplicação estará disponível em: **`http://127.0.0.1:5000`**

## Uso

1. Abra o navegador e acesse `http://127.0.0.1:5000`
2. Faça upload de um documento (PDF, JPG ou PNG)
3. Clique em "Comentários" para adicionar comentários
4. Use o campo de busca para filtrar por título
5. Edite ou exclua documentos conforme necessário

## Estrutura de diretórios

```
Desafio-Estagio/
├── backend/              # Código do servidor Flask
│   ├── app.py           # Aplicação principal
│   ├── config.py        # Configurações
│   ├── database.py      # Acesso ao banco de dados
│   ├── models.py        # Operações de dados
│   ├── routes/          # Endpoints da API
│   ├── uploads/         # Arquivos enviados
│   ├── requirements.txt # Dependências Python
│   └── wsgi.py          # Ponto de entrada para PythonAnywhere
├── frontend/            # Interface web
│   ├── index.html       # Página principal
│   ├── css/
│   │   └── style.css    # Estilos
│   └── js/
│       └── app.js       # Lógica da aplicação
├── README.md            # Descrição do projeto
├── PYTHONANNYWHERE_DEPLOY.md  # Guia de deploy
└── SETUP_LOCAL.md       # Este arquivo
```

## Parar a aplicação

Pressione `Ctrl+C` no terminal onde o servidor está rodando.

## Desativar o ambiente virtual

```bash
deactivate
```

## Solução de problemas

### Erro: "ModuleNotFoundError: No module named 'flask'"

- Certifique-se de que o ambiente virtual está ativado
- Rode `pip install -r requirements.txt` novamente

### Erro: "address already in use"

- A porta 5000 já está em uso
- Mude a porta no final de `app.py`: `app.run(debug=True, port=5001)`

### Banco de dados corrompido

- Delete o arquivo `backend/database.db`
- Reinicie a aplicação para recriar o banco

## Deploy

Veja `PYTHONANNYWHERE_DEPLOY.md` para instruções de deploy em produção.
