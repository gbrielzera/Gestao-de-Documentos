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
    documentsList.innerHTML = `<p class="empty-message">Erro ao carregar documentos: ${error.message}</p>`;
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
 * Cria o elemento HTML (card) referente a um único documento,
 * incluindo os botões de visualização, download e comentários.
 */
function buildDocumentCard(doc) {
  const card = document.createElement("div");
  card.className = "document-card";

  card.innerHTML = `
    <h3>${doc.title}</h3>
    <div class="document-meta">Enviado em ${formatDate(doc.upload_date)}</div>
    ${doc.description ? `<div class="document-description">${doc.description}</div>` : ""}
    <div class="document-actions">
      <a href="${API_BASE_URL}/documents/${doc.id}/view" target="_blank" rel="noopener">Visualizar</a>
      <a href="${API_BASE_URL}/documents/${doc.id}/download">Download</a>
      <button type="button" class="toggle-comments-btn">Comentários</button>
    </div>
    <div class="comments-section" hidden></div>
  `;

  const toggleButton = card.querySelector(".toggle-comments-btn");
  const commentsSection = card.querySelector(".comments-section");

  toggleButton.addEventListener("click", () => {
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
    commentsSection.innerHTML = `<p class="empty-message">Erro ao carregar comentários: ${error.message}</p>`;
  }
}

/**
 * Monta o HTML da lista de comentários e do formulário de novo comentário.
 */
function renderComments(documentId, comments, commentsSection) {
  const listHtml = comments.length
    ? comments
        .map(
          (comment) => `
            <div class="comment-item">
              ${comment.text}
              <span class="comment-date">${formatDate(comment.created_at)}</span>
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

  const input = commentsSection.querySelector('input[name="text"]');
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
