// Endereço base da API do back-end Flask
const API_BASE_URL = "http://127.0.0.1:5000/api";

const uploadForm = document.getElementById("upload-form");
const uploadMessage = document.getElementById("upload-message");
const documentsList = document.getElementById("documents-list");

/**
 * Formata uma data ISO (ex: "2026-09-18T14:30:00") no padrão brasileiro.
 */
function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Escapa caracteres especiais de HTML para evitar que texto digitado pelo
 * usuário (título, descrição, comentário) seja interpretado como marcação.
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Busca todos os documentos na API e atualiza a lista exibida na tela.
 */
async function loadDocuments() {
  try {
    const response = await fetch(`${API_BASE_URL}/documents`);
    if (!response.ok) {
      throw new Error("Falha ao carregar documentos.");
    }

    const documents = await response.json();
    renderDocuments(documents);
  } catch (error) {
    documentsList.innerHTML = `<p class="empty-message">Erro ao carregar documentos: ${escapeHtml(error.message)}</p>`;
  }
}

/**
 * Renderiza a lista completa de documentos dentro de #documents-list.
 */
function renderDocuments(documents) {
  documentsList.innerHTML = "";

  if (documents.length === 0) {
    documentsList.innerHTML = '<p class="empty-message">Nenhum documento enviado ainda.</p>';
    return;
  }

  documents.forEach((doc) => {
    documentsList.appendChild(buildDocumentCard(doc));
  });
}

/**
 * Cria o elemento HTML (card) referente a um único documento, incluindo
 * visualização, download, edição (título, descrição e arquivo) e comentários.
 */
function buildDocumentCard(doc) {
  const card = document.createElement("div");
  card.className = "document-card";

  card.innerHTML = `
    <div class="document-view">
      <h3>${escapeHtml(doc.title)}</h3>
      <div class="document-meta">Enviado em ${formatDate(doc.upload_date)}</div>
      ${doc.description ? `<div class="document-description">${escapeHtml(doc.description)}</div>` : ""}
      <div class="document-actions">
        <a href="${API_BASE_URL}/documents/${doc.id}/view" target="_blank" rel="noopener">Visualizar</a>
        <a href="${API_BASE_URL}/documents/${doc.id}/download">Download</a>
        <button type="button" class="edit-document-btn">Editar</button>
        <button type="button" class="toggle-comments-btn">Comentários</button>
      </div>
    </div>

    <form class="edit-document-form" hidden>
      <div class="form-field">
        <label>Título *</label>
        <input type="text" name="title" value="${escapeHtml(doc.title)}" required>
      </div>
      <div class="form-field">
        <label>Descrição</label>
        <textarea name="description" rows="3">${escapeHtml(doc.description || "")}</textarea>
      </div>
      <div class="form-field">
        <label>Substituir arquivo (opcional, PDF/JPG/PNG)</label>
        <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png">
      </div>
      <div class="edit-actions">
        <button type="submit">Salvar</button>
        <button type="button" class="cancel-edit-document-btn">Cancelar</button>
      </div>
      <p class="message edit-message"></p>
    </form>

    <div class="comments-section" hidden></div>
  `;

  const documentView = card.querySelector(".document-view");
  const editForm = card.querySelector(".edit-document-form");
  const editButton = card.querySelector(".edit-document-btn");
  const cancelEditButton = card.querySelector(".cancel-edit-document-btn");
  const toggleCommentsButton = card.querySelector(".toggle-comments-btn");
  const commentsSection = card.querySelector(".comments-section");

  editButton.addEventListener("click", () => {
    documentView.setAttribute("hidden", "");
    editForm.removeAttribute("hidden");
  });

  cancelEditButton.addEventListener("click", () => {
    editForm.reset();
    editForm.setAttribute("hidden", "");
    documentView.removeAttribute("hidden");
  });

  editForm.addEventListener("submit", (event) => handleEditDocumentSubmit(event, doc.id));

  toggleCommentsButton.addEventListener("click", () => {
    const isHidden = commentsSection.hasAttribute("hidden");
    if (isHidden) {
      commentsSection.removeAttribute("hidden");
      loadComments(doc.id, commentsSection);
    } else {
      commentsSection.setAttribute("hidden", "");
    }
  });

  return card;
}

/**
 * Envia as alterações de título, descrição e (opcionalmente) arquivo de um
 * documento para a API e recarrega a lista em caso de sucesso.
 */
async function handleEditDocumentSubmit(event, documentId) {
  event.preventDefault();

  const form = event.target;
  const messageEl = form.querySelector(".edit-message");
  messageEl.textContent = "Salvando...";
  messageEl.className = "message edit-message";

  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      method: "PUT",
      body: new FormData(form),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Falha ao salvar alterações.");
    }

    await loadDocuments();
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.className = "message edit-message error";
  }
}

/**
 * Busca os comentários de um documento e renderiza a lista
 * junto com o formulário para adicionar um novo comentário.
 */
async function loadComments(documentId, commentsSection) {
  commentsSection.innerHTML = "<p>Carregando comentários...</p>";

  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/comments`);
    if (!response.ok) {
      throw new Error("Falha ao carregar comentários.");
    }

    const comments = await response.json();
    renderComments(documentId, comments, commentsSection);
  } catch (error) {
    commentsSection.innerHTML = `<p class="empty-message">Erro ao carregar comentários: ${escapeHtml(error.message)}</p>`;
  }
}

/**
 * Monta o HTML da lista de comentários (com opção de edição de cada um)
 * e do formulário de novo comentário.
 */
function renderComments(documentId, comments, commentsSection) {
  const listHtml = comments.length
    ? comments
        .map(
          (comment) => `
            <div class="comment-item">
              <div class="comment-view">
                <span class="comment-text">${escapeHtml(comment.text)}</span>
                <span class="comment-date">${formatDate(comment.created_at)}</span>
                <button type="button" class="edit-comment-btn" data-id="${comment.id}">Editar</button>
              </div>
              <form class="edit-comment-form" data-id="${comment.id}" hidden>
                <input type="text" name="text" value="${escapeHtml(comment.text)}" required>
                <button type="submit">Salvar</button>
                <button type="button" class="cancel-edit-comment-btn">Cancelar</button>
              </form>
            </div>
          `
        )
        .join("")
    : '<p class="empty-message">Nenhum comentário ainda.</p>';

  commentsSection.innerHTML = `
    <div class="comments-list">${listHtml}</div>
    <form class="comment-form">
      <input type="text" name="text" placeholder="Escreva um comentário..." required>
      <button type="submit">Enviar</button>
    </form>
  `;

  commentsSection.querySelectorAll(".comment-item").forEach((item) => {
    const viewBlock = item.querySelector(".comment-view");
    const editForm = item.querySelector(".edit-comment-form");

    item.querySelector(".edit-comment-btn").addEventListener("click", () => {
      viewBlock.setAttribute("hidden", "");
      editForm.removeAttribute("hidden");
    });

    item.querySelector(".cancel-edit-comment-btn").addEventListener("click", () => {
      editForm.reset();
      editForm.setAttribute("hidden", "");
      viewBlock.removeAttribute("hidden");
    });

    editForm.addEventListener("submit", (event) =>
      handleEditCommentSubmit(event, documentId, commentsSection)
    );
  });

  const commentForm = commentsSection.querySelector(".comment-form");
  commentForm.addEventListener("submit", (event) =>
    handleAddComment(event, documentId, commentsSection)
  );
}

/**
 * Envia um novo comentário para a API e recarrega a lista de comentários.
 */
async function handleAddComment(event, documentId, commentsSection) {
  event.preventDefault();

  const input = commentsSection.querySelector('.comment-form input[name="text"]');
  const text = input.value.trim();
  if (!text) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("Falha ao enviar comentário.");
    }

    await loadComments(documentId, commentsSection);
  } catch (error) {
    alert(`Erro ao enviar comentário: ${error.message}`);
  }
}

/**
 * Envia o texto editado de um comentário para a API e recarrega a lista.
 */
async function handleEditCommentSubmit(event, documentId, commentsSection) {
  event.preventDefault();

  const form = event.target;
  const commentId = form.dataset.id;
  const text = form.querySelector('input[name="text"]').value.trim();
  if (!text) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/comments/${commentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("Falha ao salvar comentário.");
    }

    await loadComments(documentId, commentsSection);
  } catch (error) {
    alert(`Erro ao salvar comentário: ${error.message}`);
  }
}

/**
 * Envia o formulário de upload (multipart/form-data) para a API
 * e atualiza a lista de documentos em caso de sucesso.
 */
async function handleUploadSubmit(event) {
  event.preventDefault();

  const formData = new FormData(uploadForm);
  uploadMessage.textContent = "Enviando...";
  uploadMessage.className = "message";

  try {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Falha ao enviar documento.");
    }

    uploadMessage.textContent = "Documento enviado com sucesso!";
    uploadMessage.className = "message success";
    uploadForm.reset();
    await loadDocuments();
  } catch (error) {
    uploadMessage.textContent = error.message;
    uploadMessage.className = "message error";
  }
}

uploadForm.addEventListener("submit", handleUploadSubmit);

loadDocuments();
