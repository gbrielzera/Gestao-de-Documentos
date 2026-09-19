// Endereço base da API do back-end Flask
// Em produção, usa a mesma origem da página (PythonAnywhere)
// Em desenvolvimento local, usa localhost:5000
const API_BASE_URL = window.location.hostname === "localhost"
  ? "http://127.0.0.1:5000/api"
  : "/api";

const uploadForm = document.getElementById("upload-form");
const uploadMessage = document.getElementById("upload-message");
const documentsList = document.getElementById("documents-list");
const uploadSpinner = document.getElementById("upload-spinner");
const searchInput = document.getElementById("search-input");

/**
 * Converte um tamanho em bytes para um texto legível (ex: "1,5 MB").
 */
function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) {
    return "tamanho indisponível";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${units[unitIndex]}`;
}

/**
 * Normaliza um texto para comparação de busca (sem acentos e em minúsculas).
 */
function normalizeText(text) {
  return String(text).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Filtra os cards já exibidos pelo texto do campo de busca (por título),
 * apenas ocultando/exibindo os cards para não perder comentários abertos.
 */
function applyFilter() {
  const query = normalizeText(searchInput.value.trim());
  const cards = documentsList.querySelectorAll(".document-card");
  let visibleCount = 0;

  cards.forEach((card) => {
    const matches = normalizeText(card.dataset.title).includes(query);
    card.hidden = !matches;
    if (matches) {
      visibleCount += 1;
    }
  });

  const noResults = documentsList.querySelector(".no-results");
  if (noResults) {
    noResults.hidden = cards.length === 0 || visibleCount > 0;
  }
}

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
 * Extrai a mensagem de erro de uma resposta da API (JSON com campo "error"),
 * com um texto padrão caso a resposta não venha no formato esperado.
 */
async function extractErrorMessage(response, fallback) {
  const data = await response.json().catch(() => null);
  return (data && data.error) || fallback;
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

  documentsList.insertAdjacentHTML(
    "beforeend",
    '<p class="empty-message no-results" hidden>Nenhum documento encontrado.</p>'
  );
  applyFilter();
}

/**
 * Cria o elemento HTML (card) referente a um único documento, incluindo
 * visualização, download, edição, exclusão e comentários.
 */
function buildDocumentCard(doc) {
  const card = document.createElement("div");
  card.className = "document-card";
  card.dataset.title = doc.title;

  card.innerHTML = `
    <div class="document-view">
      <h3>${escapeHtml(doc.title)}</h3>
      <div class="document-meta">Enviado em ${formatDate(doc.upload_date)} · ${formatFileSize(doc.file_size)}</div>
      ${doc.description ? `<div class="document-description">${escapeHtml(doc.description)}</div>` : ""}
      <div class="document-actions">
        <a href="${API_BASE_URL}/documents/${doc.id}/view" target="_blank" rel="noopener">Visualizar</a>
        <a href="${API_BASE_URL}/documents/${doc.id}/download">Download</a>
        <button type="button" class="edit-document-btn">Editar</button>
        <button type="button" class="delete-document-btn danger-btn">Excluir</button>
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
  const deleteButton = card.querySelector(".delete-document-btn");
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

  deleteButton.addEventListener("click", () => handleDeleteDocument(doc.id, deleteButton));

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
  const saveButton = form.querySelector('button[type="submit"]');
  const messageEl = form.querySelector(".edit-message");

  messageEl.textContent = "Salvando...";
  messageEl.className = "message edit-message";
  saveButton.disabled = true;
  saveButton.textContent = "Salvando...";

  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      method: "PUT",
      body: new FormData(form),
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, "Falha ao salvar alterações."));
    }

    await loadDocuments();
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.className = "message edit-message error";
    saveButton.disabled = false;
    saveButton.textContent = "Salvar";
  }
}

/**
 * Pede confirmação e, se aceita, exclui o documento (arquivo e comentários
 * associados são removidos em cascata pela API) e recarrega a lista.
 */
async function handleDeleteDocument(documentId, deleteButton) {
  const confirmed = confirm("Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.");
  if (!confirmed) {
    return;
  }

  deleteButton.disabled = true;
  deleteButton.textContent = "Excluindo...";

  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, "Falha ao excluir documento."));
    }

    await loadDocuments();
  } catch (error) {
    alert(`Erro ao excluir documento: ${error.message}`);
    deleteButton.disabled = false;
    deleteButton.textContent = "Excluir";
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
 * Monta o HTML da lista de comentários (com opção de edição e exclusão de
 * cada um) e do formulário de novo comentário.
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
                <button type="button" class="delete-comment-btn danger-btn" data-id="${comment.id}">Excluir</button>
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
    const commentId = editForm.dataset.id;

    item.querySelector(".edit-comment-btn").addEventListener("click", () => {
      viewBlock.setAttribute("hidden", "");
      editForm.removeAttribute("hidden");
    });

    item.querySelector(".cancel-edit-comment-btn").addEventListener("click", () => {
      editForm.reset();
      editForm.setAttribute("hidden", "");
      viewBlock.removeAttribute("hidden");
    });

    item.querySelector(".delete-comment-btn").addEventListener("click", (event) =>
      handleDeleteComment(documentId, commentId, commentsSection, event.target)
    );

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

  const form = event.target;
  const submitButton = form.querySelector('button[type="submit"]');
  const input = form.querySelector('input[name="text"]');
  const text = input.value.trim();
  if (!text) {
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";

  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, "Falha ao enviar comentário."));
    }

    await loadComments(documentId, commentsSection);
  } catch (error) {
    alert(`Erro ao enviar comentário: ${error.message}`);
    submitButton.disabled = false;
    submitButton.textContent = "Enviar";
  }
}

/**
 * Envia o texto editado de um comentário para a API e recarrega a lista.
 */
async function handleEditCommentSubmit(event, documentId, commentsSection) {
  event.preventDefault();

  const form = event.target;
  const saveButton = form.querySelector('button[type="submit"]');
  const commentId = form.dataset.id;
  const text = form.querySelector('input[name="text"]').value.trim();
  if (!text) {
    return;
  }

  saveButton.disabled = true;
  saveButton.textContent = "Salvando...";

  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/comments/${commentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, "Falha ao salvar comentário."));
    }

    await loadComments(documentId, commentsSection);
  } catch (error) {
    alert(`Erro ao salvar comentário: ${error.message}`);
    saveButton.disabled = false;
    saveButton.textContent = "Salvar";
  }
}

/**
 * Pede confirmação e, se aceita, exclui um comentário e recarrega a lista.
 */
async function handleDeleteComment(documentId, commentId, commentsSection, deleteButton) {
  const confirmed = confirm("Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.");
  if (!confirmed) {
    return;
  }

  deleteButton.disabled = true;
  deleteButton.textContent = "Excluindo...";

  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/comments/${commentId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, "Falha ao excluir comentário."));
    }

    await loadComments(documentId, commentsSection);
  } catch (error) {
    alert(`Erro ao excluir comentário: ${error.message}`);
    deleteButton.disabled = false;
    deleteButton.textContent = "Excluir";
  }
}

/**
 * Envia o formulário de upload (multipart/form-data) para a API
 * e atualiza a lista de documentos em caso de sucesso.
 */
async function handleUploadSubmit(event) {
  event.preventDefault();

  const submitButton = uploadForm.querySelector('button[type="submit"]');
  const formData = new FormData(uploadForm);

  uploadMessage.textContent = "Enviando...";
  uploadMessage.className = "message";
  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";
  uploadSpinner.hidden = false;

  try {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, "Falha ao enviar documento."));
    }

    uploadMessage.textContent = "Documento enviado com sucesso!";
    uploadMessage.className = "message success";
    uploadForm.reset();
    await loadDocuments();
  } catch (error) {
    uploadMessage.textContent = error.message;
    uploadMessage.className = "message error";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar documento";
    uploadSpinner.hidden = true;
  }
}

uploadForm.addEventListener("submit", handleUploadSubmit);
searchInput.addEventListener("input", applyFilter);

loadDocuments();
