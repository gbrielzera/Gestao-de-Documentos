# Gestão de Documentos

Aplicação web simples para upload, listagem, visualização, download, edição, exclusão e comentários de documentos (PDF, JPG e PNG). Projeto desenvolvido como teste prático de estágio.

## Funcionalidades

- **Upload de documentos**: envio de arquivos PDF, JPG ou PNG, com título obrigatório e descrição opcional.
- **Listagem de documentos**: exibição de título, data de upload e botões de visualização e download.
- **Edição e exclusão de documentos**: alteração do título, da descrição e substituição do arquivo de um documento já enviado, ou remoção completa (arquivo físico, metadados e comentários), com confirmação antes de excluir.
- **Comentários**: histórico de comentários textuais por documento, com data e hora registradas automaticamente, incluindo edição e exclusão (com confirmação) de comentários já publicados.
- **Feedback de carregamento**: botões de envio/salvar ficam desabilitados e exibem um texto indicativo ("Enviando...", "Salvando...", "Excluindo...") enquanto a requisição está em andamento.

## Tecnologias utilizadas

- **Back-end**: Python 3, Flask, Flask-CORS
- **Banco de dados**: SQLite
- **Front-end**: HTML, CSS e JavaScript puros (sem frameworks)

## Estrutura do projeto

```
Desafio Estágio/
├── backend/
│   ├── app.py              # Ponto de entrada da aplicação Flask
│   ├── config.py           # Configurações (caminhos, extensões permitidas)
│   ├── database.py         # Conexão e criação das tabelas do SQLite
│   ├── models.py           # Funções de acesso a dados (documentos e comentários)
│   ├── requirements.txt    # Dependências do back-end
│   ├── routes/
│   │   ├── documents.py    # Rotas de upload, listagem, visualização e download
│   │   └── comments.py     # Rotas de listagem e criação de comentários
│   ├── uploads/             # Arquivos enviados pelos usuários (criado em tempo de execução)
│   └── database.db          # Banco SQLite (criado automaticamente na primeira execução)
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── .gitignore
└── README.md
```

## Como executar

### 1. Back-end (Flask)

Os comandos abaixo estão escritos para o **Git Bash** no Windows.

```bash
cd backend
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
python app.py
```

O servidor será iniciado em `http://127.0.0.1:5000`. O banco de dados SQLite e a pasta `uploads/` são criados automaticamente na primeira execução.

Para sair do ambiente virtual depois de terminar, use `deactivate`.

### 2. Front-end (HTML/CSS/JS)

Com o back-end rodando, basta abrir o arquivo `frontend/index.html` diretamente no navegador (duplo clique ou clique com o botão direito → "Abrir com" → navegador de sua preferência).

> Alternativamente, é possível servir a pasta `frontend/` com uma extensão como o "Live Server" do VS Code, caso prefira não abrir o arquivo diretamente pelo sistema de arquivos.

## Link de deploy

_[LINK]_

## Justificativa da arquitetura em pastas separadas

O projeto foi dividido em `backend/` e `frontend/` como dois projetos independentes que se comunicam exclusivamente por HTTP (API REST). Essa separação foi escolhida por alguns motivos:

- **Desacoplamento**: o front-end não depende de nenhuma tecnologia específica do back-end (e vice-versa); qualquer um dos dois poderia ser substituído sem afetar o outro, desde que o contrato da API seja mantido.
- **Clareza didática**: mantém o código de servidor (rotas, banco de dados, regras de negócio) totalmente separado do código de interface (HTML/CSS/JS), facilitando o entendimento de cada camada isoladamente — importante em um projeto pensado para estudo.
- **Deploy independente**: back-end e front-end podem ser hospedados em serviços diferentes (ex: back-end em uma plataforma de aplicações Python e front-end em um serviço de arquivos estáticos), sem necessidade de um único servidor servir os dois.
- **Fidelidade ao padrão de mercado**: essa é a arquitetura mais comum em aplicações web reais, onde o back-end expõe uma API REST consumida por um cliente front-end via `fetch`/`axios`.
