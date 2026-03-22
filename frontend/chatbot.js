// ================================
// CHAT PRINCIPAL MONTIA
// ================================
const chatBox = document.getElementById('chat-box');
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');

function addMessage(text, sender) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text.replace(/<[^>]*>/g, '');
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function typeWriterEffect(text, element) {
  const cleanText = text.replace(/<[^>]*>/g, '');
  let index = 0;
  element.textContent = '';
  const interval = setInterval(() => {
    if (index < cleanText.length) {
      element.textContent += cleanText.charAt(index);
      index++;
      chatBox.scrollTop = chatBox.scrollHeight;
    } else clearInterval(interval);
  }, 10);
}

// ================================
// Filtros de búsqueda
// ================================
let currentFilters = {};

document.getElementById("applyFiltersBtn").addEventListener("click", () => {
  const yearMin = document.getElementById("yearMin").value;
  const yearMax = document.getElementById("yearMax").value;
  const articleType = document.getElementById("articleType").value;
  const language = document.getElementById("language").value;
  const openAccess = document.getElementById("openAccess").value;
  const keyword = document.getElementById("keyword").value;

  currentFilters = { yearMin, yearMax, articleType, language, openAccess, keyword };

  appendSystemMessage("Filtros aplicados correctamente. Escribe de nuevo tu búsqueda para ver los resultados filtrados.");
});

function appendSystemMessage(text) {
  const msg = document.createElement('div');
  msg.classList.add('message', 'bot');
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ================================
// Envío de mensajes
// ================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userMsg = input.value.trim();
  if (!userMsg) return;

  const token = localStorage.getItem('auth_token');

  // Si hay token, lógica de historial
  if (token) {
    // Si no hay chat seleccionado, crear uno primero
    if (!currentChatId) {
      try {
        const res = await fetch('http://localhost:3000/api/history/conversations', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ title: userMsg.substring(0, 30) + '...' })
        });
        if (res.ok) {
          const newChat = await res.json();
          chatHistory.unshift(newChat);
          currentChatId = newChat.id;
          renderHistory();
        }
      } catch (err) {
        return console.error('Error creando chat inicial:', err);
      }
    }

    addMessage(`Tú: ${userMsg}`, 'user');
    input.value = '';

    // Guardar mensaje del usuario
    try {
      await fetch(`http://localhost:3000/api/history/conversations/${currentChatId}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sender: 'user', content: userMsg })
      });
    } catch (err) {
      console.error('Error guardando mensaje usuario:', err);
    }
  } else {
    // MODO INVITADO: Solo mostrar en UI
    addMessage(`Tú: ${userMsg}`, 'user');
    input.value = '';
  }

  // Enviar al bot (funciona para ambos modos)
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message: userMsg, filters: currentFilters }),
    });

    if (!res.ok) throw new Error('Servidor no respondió');

    const data = await res.json();

    // Manejo de respuesta estructurada (Resultados de búsqueda)
    if (data.type === 'search_results' && data.data) {
      renderSearchResults(data.data);

      // Guardar también en historial si hay sesión (guardamos el texto resumen)
      if (token && currentChatId) {
        await fetch(`http://localhost:3000/api/history/conversations/${currentChatId}/messages`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ sender: 'bot', content: data.reply || 'Resultados de búsqueda' })
        });
      }
      return; // Salimos para no renderizar doble menesaje
    }

    // Manejo de respuesta normal (Texto)
    const respuestaLimpia = (data.reply || 'Error inesperado del servidor.').replace(/<[^>]*>/g, '');

    const botMsg = document.createElement('div');
    botMsg.classList.add('message', 'bot');
    chatBox.appendChild(botMsg);
    typeWriterEffect(`MontIA: ${respuestaLimpia}`, botMsg);

    // Lectura automática de voz si está activada
    if (typeof VoiceMode !== 'undefined' && VoiceMode.isAutoReadEnabled()) {
      VoiceMode.speak(respuestaLimpia);
    }

    // Guardar respuesta del bot SOLO si hay token
    if (token && currentChatId) {
      await fetch(`http://localhost:3000/api/history/conversations/${currentChatId}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sender: 'bot', content: respuestaLimpia })
      });
    }

  } catch {
    addMessage('No se pudo conectar con el servidor.', 'bot');
  }
});

// ================================
// HISTORIAL DE CONVERSACIONES
// ================================
// ================================
// HISTORIAL DE CONVERSACIONES (API)
// ================================
const toggleBtn = document.getElementById('toggle-history');
const historyPanel = document.getElementById('history-panel');
const newChatBtn = document.getElementById('new-chat');
const historyList = document.getElementById('history-list');

let chatHistory = [];
let currentChatId = null;

// Helper para headers con token
function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return token ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  } : { 'Content-Type': 'application/json' };
}

// Global para guardar el perfil
window.userProfile = null;

// Cargar lista de chats y perfil de usuario
async function loadConversations() {
  const token = localStorage.getItem('auth_token');

  // Modo Invitado
  if (!token) {
    chatHistory = [];
    renderHistory();
    chatBox.innerHTML = '';
    addMessage('¡Hola! Estás en modo invitado. Tus chats no se guardarán.', 'bot');

    // Mantenemos valores por defecto en sidebar
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.textContent = 'Iniciar Sesión';
      logoutBtn.style.backgroundColor = '#007bff';
    }
    return;
  }

  // Cargar Perfil para la Sidebar
  try {
    const profRes = await fetch('http://localhost:3000/api/profile', { headers: getAuthHeaders() });
    if (profRes.ok) {
      const { user } = await profRes.json();
      window.userProfile = user;
      
      const apodoSpan = document.getElementById('sidebar-apodo');
      const sideImg = document.getElementById('sidebar-avatar-img');
      const sideInit = document.getElementById('sidebar-avatar-initial');
      
      if (apodoSpan) apodoSpan.textContent = user.apodo || user.name || 'Usuario';
      
      if (user.avatar_url) {
        if (sideImg) { sideImg.src = `http://localhost:3000${user.avatar_url}`; sideImg.style.display = 'block'; }
        if (sideInit) sideInit.style.display = 'none';
      } else {
        const initial = (user.apodo || user.name || '?')[0].toUpperCase();
        if (sideInit) { sideInit.textContent = initial; sideInit.style.display = 'block'; }
        if (sideImg) sideImg.style.display = 'none';
      }
    }
  } catch (e) {
    console.error('Error cargando perfil:', e);
  }

  // Cargar Historial
  try {
    const res = await fetch('http://localhost:3000/api/history/conversations', {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      chatHistory = await res.json();
      renderHistory();
      if (!currentChatId && chatHistory.length > 0) {
        loadConversation(chatHistory[0].id);
      } else if (chatHistory.length === 0) {
        chatBox.innerHTML = '';
        const nombre = window.userProfile?.apodo || window.userProfile?.name || '';
        addMessage(`¡Hola${nombre ? ' ' + nombre : ''}! Soy MontIA. ¿En qué puedo ayudarte hoy?`, 'bot');
      }
    }
  } catch (err) {
    console.error('Error cargando historial:', err);
  }
}

// Renderizar lista
function renderHistory() {
  historyList.innerHTML = '';
  chatHistory.forEach((conv) => {
    const li = document.createElement('li');
    li.classList.add('chat-item');
    if (conv.id === currentChatId) li.classList.add('active');

    const title = document.createElement('span');
    title.classList.add('chat-item-title');
    title.textContent = conv.title;
    title.addEventListener('click', () => loadConversation(conv.id));

    const menuBtn = document.createElement('button');
    menuBtn.classList.add('chat-menu-btn');
    menuBtn.innerHTML = '⋮';
    menuBtn.addEventListener('click', (e) => toggleChatMenu(e));

    const menu = document.createElement('div');
    menu.classList.add('chat-menu');
    menu.innerHTML = `
      <button class="rename-btn">Cambiar nombre</button>
      <button class="delete-btn">Eliminar chat</button>
    `;

    menu.querySelector('.rename-btn').addEventListener('click', () => renameChat(conv.id, title, menu));
    menu.querySelector('.delete-btn').addEventListener('click', () => deleteChat(conv.id));

    li.appendChild(title);
    li.appendChild(menuBtn);
    li.appendChild(menu);
    historyList.appendChild(li);
  });
}

// Cargar mensajes de un chat
async function loadConversation(id) {
  currentChatId = id;
  renderHistory(); // Actualizar clase active
  chatBox.innerHTML = '';

  try {
    const res = await fetch(`http://localhost:3000/api/history/conversations/${id}/messages`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const messages = await res.json();
      if (messages.length === 0) {
        addMessage('Chat iniciado. ¿En qué puedo ayudarte?', 'bot');
      } else {
        messages.forEach(m => addMessage(m.content, m.sender));
      }
    }
  } catch (err) {
    console.error('Error cargando mensajes:', err);
  }
}

// Crear nuevo chat
newChatBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('http://localhost:3000/api/history/conversations', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title: 'Nueva conversación' })
    });
    if (res.ok) {
      const newChat = await res.json();
      chatHistory.unshift(newChat); // Agregar al inicio
      loadConversation(newChat.id);
    }
  } catch (err) {
    console.error('Error creando chat:', err);
  }
});

// Eliminar chat
async function deleteChat(id) {
  if (!confirm('¿Seguro que quieres eliminar este chat?')) return;
  try {
    const res = await fetch(`http://localhost:3000/api/history/conversations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      chatHistory = chatHistory.filter(c => c.id !== id);
      if (currentChatId === id) {
        currentChatId = null;
        chatBox.innerHTML = '';
        if (chatHistory.length > 0) loadConversation(chatHistory[0].id);
        else addMessage('Crea un nuevo chat para comenzar.', 'bot');
      }
      renderHistory();
    }
  } catch (err) {
    console.error('Error eliminando chat:', err);
  }
}

// Renombrar chat
function renameChat(id, titleSpan, menu) {
  menu.classList.remove('active');
  const input = document.createElement('input');
  input.classList.add('rename-input');
  input.value = titleSpan.textContent;
  titleSpan.replaceWith(input);
  input.focus();

  const save = async () => {
    const newTitle = input.value.trim() || 'Conversación';
    try {
      await fetch(`http://localhost:3000/api/history/conversations/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: newTitle })
      });
      // Recargar lista para asegurar consistencia
      loadConversations();
    } catch (err) {
      console.error('Error renombrando:', err);
      loadConversations(); // Revertir en caso de error
    }
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') loadConversations();
  });
  input.addEventListener('blur', save);
}

// Menú contextual
function toggleChatMenu(event) {
  event.stopPropagation();
  const allMenus = document.querySelectorAll('.chat-menu');
  allMenus.forEach(m => m.classList.remove('active'));
  const current = event.target.nextElementSibling;
  current.classList.toggle('active');
  document.addEventListener('click', () => current.classList.remove('active'), { once: true });
}

toggleBtn.addEventListener('click', () => {
  historyPanel.classList.toggle('active');
});

// Cerrar sesión / Iniciar sesión
document.getElementById('logout-btn').addEventListener('click', (e) => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    // Si es invitado, el botón sirve para ir a login
    window.location.href = 'auth.html';
  } else {
    if (confirm('¿Cerrar sesión?')) {
      localStorage.removeItem('auth_token');
      window.location.href = 'auth.html';
    }
  }
});

// Inicializar
// Inicializar
loadConversations();

// ================================
// NUEVAS FUNCIONALIDADES
// ================================

/**
 * Renderiza resultados de búsqueda con tarjetas y botones
 */
function renderSearchResults(data) {
  const container = document.createElement('div');
  container.classList.add('message', 'bot');

  // Texto introductorio
  const intro = document.createElement('p');
  intro.textContent = `Aquí tienes los artículos encontrados sobre "${data.query}". Puedes generar citas o ver el mapa de conocimiento:`;
  container.appendChild(intro);

  const list = document.createElement('div');
  list.classList.add('results-container');

  data.results.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('result-card');

    const title = document.createElement('span');
    title.classList.add('result-title');
    title.textContent = item.title;

    const meta = document.createElement('div');
    meta.classList.add('result-meta');
    meta.textContent = `${item.author} (${item.year}) • ${item.journal || item.source}`;

    const actions = document.createElement('div');
    actions.classList.add('citation-actions');

    // Selector de Formato de Cita
    const citationContainer = document.createElement('div');
    citationContainer.classList.add('citation-selector-container');

    const select = document.createElement('select');
    select.classList.add('citation-select');
    const formats = [
      { id: 'APA', label: 'APA 7' },
      { id: 'MLA', label: 'MLA 9' },
      { id: 'IEEE', label: 'IEEE' },
      { id: 'Vancouver', label: 'Vancouver' },
      { id: 'BibTeX', label: 'BibTeX' }
    ];

    formats.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.label;
      select.appendChild(opt);
    });

    const btnCopy = document.createElement('button');
    btnCopy.classList.add('citation-btn', 'copy-btn');
    btnCopy.textContent = '📄 Copiar Cita';
    btnCopy.onclick = () => {
      const citation = generateCitation(item, select.value);
      copyCitation(btnCopy, citation);
    };

    citationContainer.appendChild(select);
    citationContainer.appendChild(btnCopy);

    actions.appendChild(citationContainer);

    if (item.doi) {
      const link = document.createElement('a');
      link.href = item.doi.startsWith('http') ? item.doi : `https://doi.org/${item.doi}`;
      link.textContent = '🔗 Ver fuente';
      link.target = '_blank';
      link.style.marginLeft = '10px';
      link.style.fontSize = '0.8rem';
      actions.appendChild(link);
    }

    // Botón Analizar Contenido (Solo si es OA o tiene PDF)
    if (item.openAccess || item.doi) {
      const btnAnalyze = document.createElement('button');
      btnAnalyze.classList.add('citation-btn', 'analyze-source-btn');
      btnAnalyze.textContent = '📄 Analizar Contenido';
      btnAnalyze.onclick = () => analyzeSource(btnAnalyze, item);
      actions.appendChild(btnAnalyze);
    }

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(actions);
    list.appendChild(card);
  });

  container.appendChild(list);

  // ====== BOTONES DE ACCIÓN INNOVADORES ======
  const actionsContainer = document.createElement('div');
  actionsContainer.style.display = 'flex';
  actionsContainer.style.flexDirection = 'column';
  actionsContainer.style.gap = '8px';
  actionsContainer.style.marginTop = '15px';

  // 1. Botón Mapa de Conocimiento
  const btnMindMap = document.createElement('button');
  btnMindMap.classList.add('mindmap-btn');
  btnMindMap.innerHTML = '<span>🧠</span> Ver Mapa de Conocimiento';
  btnMindMap.onclick = () => {
    if (typeof MindMap !== 'undefined') {
      MindMap.show(data.query, data.results, getAuthHeaders);
    }
  };
  actionsContainer.appendChild(btnMindMap);

  // 2. Botón Podcast Académico
  const btnPodcast = document.createElement('button');
  btnPodcast.classList.add('podcast-btn');
  btnPodcast.id = 'podcast-active-btn';
  btnPodcast.innerHTML = '<span>🎙️</span> Escuchar Resumen Podcast';
  btnPodcast.onclick = () => {
    if (typeof VoiceMode !== 'undefined') {
      VoiceMode.generatePodcast(data.query, data.results, getAuthHeaders);
    }
  };
  actionsContainer.appendChild(btnPodcast);

  // 3. Botón Analizar Brechas
  const btnAnalyze = document.createElement('button');
  btnAnalyze.style.background = 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)';
  btnAnalyze.style.color = '#333';
  btnAnalyze.style.border = 'none';
  btnAnalyze.style.borderRadius = '8px';
  btnAnalyze.style.padding = '12px';
  btnAnalyze.style.fontWeight = 'bold';
  btnAnalyze.style.cursor = 'pointer';
  btnAnalyze.style.width = '100%';
  btnAnalyze.style.display = 'flex';
  btnAnalyze.style.alignItems = 'center';
  btnAnalyze.style.justifyContent = 'center';
  btnAnalyze.style.gap = '10px';
  btnAnalyze.style.transition = 'all 0.3s ease';
  btnAnalyze.innerHTML = '<span>💡</span> Analizar Brechas de Investigación';

  btnAnalyze.onclick = async () => {
    addMessage('✨ Analizando brechas de investigación en estos resultados...', 'user');

    let prompt = `Actúa como un profesor investigador experto. Analiza los siguientes artículos encontrados sobre "${data.query}" y detecta **BRECHAS DE INVESTIGACIÓN (Research Gaps)** o ideas novedosas para futuros trabajos. No resumas, propón nuevas líneas de investigación basadas en lo que estos trabajos NO cubren.\n\nArtículos analizados:\n`;

    data.results.forEach((item, i) => {
      prompt += `${i + 1}. "${item.title}" (${item.year}) - ${item.author}\n`;
    });

    try {
      const res = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: prompt, filters: currentFilters })
      });

      if (!res.ok) throw new Error('Error en análisis');
      const resData = await res.json();

      const answer = (resData.reply || 'No se pudo generar el análisis.').replace(/<[^>]*>/g, '');
      const botMsg = document.createElement('div');
      botMsg.classList.add('message', 'bot');
      chatBox.appendChild(botMsg);
      typeWriterEffect(`MontIA: ${answer}`, botMsg);

      // Auto-read si está activo
      if (typeof VoiceMode !== 'undefined' && VoiceMode.isAutoReadEnabled()) {
        VoiceMode.speak(answer);
      }
    } catch (err) {
      console.error(err);
      addMessage('Lo siento, hubo un error al analizar las brechas.', 'bot');
    }
  };
  actionsContainer.appendChild(btnAnalyze);

  container.appendChild(actionsContainer);

  chatBox.appendChild(container);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/**
 * Genera texto de cita
 */
function generateCitation(item, format) {
  const title = item.title || 'Sin título';
  const year = item.year || 's.f.';
  const authorInput = item.author || '';
  const journal = item.journal || item.source || 'Revista no disponible';
  const doi = item.doi ? (item.doi.startsWith('http') ? item.doi : `https://doi.org/${item.doi}`) : '';

  // Helper para formatear autores
  const getFormattedAuthors = (style) => {
    if (!authorInput || authorInput === 'Autor desconocido') return null;
    const authors = authorInput.split(/[,;]+/).map(a => a.trim()).filter(Boolean);

    if (style === 'APA' || style === 'Vancouver') {
      // Apellido, I.
      const formatted = authors.map(name => {
        const parts = name.split(' ').filter(Boolean);
        return parts.length >= 2 ? `${parts[parts.length - 1]}, ${parts[0][0]}.` : name;
      });
      if (style === 'APA') {
        if (formatted.length === 1) return formatted[0];
        if (formatted.length === 2) return `${formatted[0]} & ${formatted[1]}`;
        return `${formatted.slice(0, 2).join(', ')} et al.`;
      }
      return formatted.join(', ');
    }

    if (style === 'MLA') {
      // Apellido, Nombre.
      if (authors.length === 1) return authors[0];
      if (authors.length === 2) return `${authors[0]}, and ${authors[1]}`;
      return `${authors[0]}, et al.`;
    }

    if (style === 'IEEE') {
      // I. Apellido
      const formatted = authors.map(name => {
        const parts = name.split(' ').filter(Boolean);
        return parts.length >= 2 ? `${parts[0][0]}. ${parts[parts.length - 1]}` : name;
      });
      if (formatted.length === 1) return formatted[0];
      if (formatted.length <= 6) return formatted.join(', ');
      return `${formatted[0]} et al.`;
    }

    return authors.join('; ');
  };

  const authors = getFormattedAuthors(format);

  switch (format) {
    case 'APA':
      return authors
        ? `${authors} (${year}). ${title}. *${journal}*.${doi ? ' ' + doi : ''}`
        : `${title}. (${year}). *${journal}*.${doi ? ' ' + doi : ''}`;

    case 'MLA':
      return authors
        ? `${authors}. "${title}." *${journal}*, ${year}.${doi ? ' ' + doi : ''}`
        : `"${title}." *${journal}*, ${year}.${doi ? ' ' + doi : ''}`;

    case 'IEEE':
      return authors
        ? `${authors}, "${title}," *${journal}*, ${year}.${doi ? ' [' + doi + ']' : ''}`
        : `"${title}," *${journal}*, ${year}.${doi ? ' [' + doi + ']' : ''}`;

    case 'Vancouver':
      return authors
        ? `${authors}. ${title}. ${journal}. ${year}.${doi ? ' Disponible en: ' + doi : ''}`
        : `${title}. ${journal}. ${year}.${doi ? ' Disponible en: ' + doi : ''}`;

    case 'BibTeX':
      const firstAuth = (authorInput.split(',')[0] || 'Unknown').split(' ')[0].replace(/[^a-zA-Z]/g, '');
      const citeKey = `${firstAuth}${year}${title.substring(0, 5).replace(/[^a-zA-Z]/g, '')}`.toLowerCase();
      return `@article{${citeKey},
  author = {${authorInput}},
  title = {${title}},
  journal = {${journal}},
  year = {${year}},
  doi = {${item.doi || ''}}
}`;

    default:
      return `${authorInput} (${year}). ${title}.`;
  }
}

async function copyCitation(btn, text) {
  try {
    await navigator.clipboard.writeText(text);
    const originalText = btn.textContent;
    btn.textContent = '✅ Copiado';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('copied');
    }, 2000);
  } catch (err) {
    console.error('Error al copiar:', err);
    alert('No se pudo copiar al portapapeles');
  }
}

// ================================
// DOCUMENTOS (PDF)
// ================================
const pdfUpload = document.getElementById('pdf-upload');
const attachBtn = document.getElementById('attach-btn');
const docIndicator = document.getElementById('doc-indicator');
const docNameSpan = document.getElementById('doc-name');
const removeDocBtn = document.getElementById('remove-doc');

if (attachBtn) attachBtn.onclick = () => pdfUpload.click();

if (pdfUpload) {
  pdfUpload.onchange = async () => {
    const file = pdfUpload.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    addMessage(`Subiendo y analizando: ${file.name}...`, 'bot');

    try {
      const res = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
        },
        body: formData
      });

      const data = await res.json();
      if (data.ok) {
        docIndicator.style.display = 'flex';
        docNameSpan.textContent = file.name;
        addMessage(`¡Listo! He procesado el documento. Puedes hacerme preguntas sobre su contenido o pedirme citas textuales.`, 'bot');
      } else {
        addMessage(`Error: ${data.error}`, 'bot');
      }
    } catch (err) {
      console.error(err);
      addMessage('No se pudo subir el documento.', 'bot');
    }
  };
}

if (removeDocBtn) {
  removeDocBtn.onclick = () => {
    pdfUpload.value = '';
    docIndicator.style.display = 'none';
  };
}

async function analyzeSource(btn, item) {
  const originalText = btn.textContent;
  btn.textContent = '⏳ Analizando...';
  btn.disabled = true;

  // Priorizar pdfUrl si existe (OpenAlex)
  const pdfUrl = item.pdfUrl || (item.doi ? `https://doi.org/${item.doi.replace('https://doi.org/', '')}` : null);

  if (!pdfUrl) {
    btn.textContent = '❌ Sin Enlace';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 2000);
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/analyze-source', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url: pdfUrl })
    });

    const data = await res.json();
    if (data.ok) {
      btn.textContent = '✅ Analizado';
      docIndicator.style.display = 'flex';
      docNameSpan.textContent = item.title.substring(0, 20) + '...';
      addMessage(`He analizado "${item.title}". Ya puedes pedirme resúmenes o citas textuales específicas de este artículo.`, 'bot');
    } else {
      btn.textContent = '❌ Error';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 2000);
    }
  } catch (err) {
    console.error(err);
    btn.textContent = '❌ Error conexion';
    btn.disabled = false;
  }
}

loadConversations();
