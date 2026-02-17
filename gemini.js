// =============================================
// BIRGE — Gemini API Module
// =============================================
// Используется на всех AI-страницах сайта.
// API ключ вводится пользователем один раз
// и сохраняется в sessionStorage.
// =============================================

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

// ---------- KEY MANAGEMENT ----------

function getApiKey() {
  return sessionStorage.getItem('birge_gemini_key') || '';
}

function setApiKey(key) {
  sessionStorage.setItem('birge_gemini_key', key.trim());
}

function clearApiKey() {
  sessionStorage.removeItem('birge_gemini_key');
}

function hasApiKey() {
  return !!getApiKey();
}

// ---------- CORE API CALL ----------

async function geminiChat(messages, systemPrompt = '') {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_KEY');

  const url = `${GEMINI_API_BASE}${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  // Build contents from message history
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const body = {
    contents,
    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${res.status}`;
    if (res.status === 400 && msg.includes('API_KEY')) throw new Error('INVALID_KEY');
    if (res.status === 429) throw new Error('RATE_LIMIT');
    throw new Error(msg);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '...';
}

// ---------- STREAMING (optional) ----------

async function geminiStream(messages, systemPrompt = '', onChunk) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_KEY');

  const url = `${GEMINI_API_BASE}${GEMINI_MODEL}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const body = {
    contents,
    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
    for (const line of lines) {
      try {
        const json = JSON.parse(line.slice(6));
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) { fullText += text; onChunk(text, fullText); }
      } catch (_) {}
    }
  }
  return fullText;
}

// ---------- SYSTEM PROMPTS ----------

const SYSTEM_PROMPTS = {
  assistant: `Ты — AI-ассистент платформы Birge для совместных поездок в школу.
Birge помогает родителям из одного района объединяться и возить детей в школу по очереди.
Ты помогаешь:
- Находить подходящие группы по маршруту и расписанию
- Оптимизировать маршруты и порядок остановок
- Отвечать на вопросы о безопасности и функционале
- Давать советы по экономии времени и топлива
Отвечай кратко, по-деловому, на русском языке. Используй эмодзи для наглядности.
Если не знаешь точных данных — предлагай общие рекомендации.`,

  matching: `Ты — AI-аналитик системы матчинга платформы Birge.
Анализируй запросы на подбор групп и давай структурированные рекомендации.
Оценивай совместимость по: расстоянию, времени, расписанию, школе, классу.
Формат ответа: список рекомендаций с процентом совместимости и объяснением.
Отвечай на русском языке, структурированно.`,

  optimizer: `Ты — AI-оптимизатор маршрутов платформы Birge.
Твоя задача — рассчитывать оптимальный порядок остановок для водителя.
Учитывай: минимизацию общего расстояния, временные окна участников, пробки утром.
Давай конкретные рекомендации с объяснением логики.
Отвечай на русском языке.`
};

// ---------- API KEY MODAL UI ----------

function renderApiKeyModal(onSuccess) {
  // Remove existing modal if any
  document.getElementById('api-key-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'api-key-modal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);
    display:flex;align-items:center;justify-content:center;padding:1rem;
  `;

  modal.innerHTML = `
    <div style="background:#141c2e;border:1px solid rgba(139,92,246,0.4);border-radius:20px;padding:2rem;max-width:460px;width:100%;animation:fadeIn 0.3s ease;">
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem;">
        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#8B5CF6,#6D28D9);display:flex;align-items:center;justify-content:center;font-size:1.4rem;">🤖</div>
        <div>
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;">Подключение Gemini API</div>
          <div style="font-size:0.78rem;color:#8B9BB4;">Google Gemini 2.0 Flash</div>
        </div>
      </div>

      <div style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:10px;padding:0.85rem;margin-bottom:1.25rem;font-size:0.82rem;color:#A78BFA;line-height:1.6;">
        🔑 Ключ хранится только в памяти браузера (sessionStorage) и <strong>не отправляется</strong> никуда, кроме Google API.
      </div>

      <div style="margin-bottom:1rem;">
        <label style="display:block;font-size:0.82rem;color:#8B9BB4;margin-bottom:0.5rem;">Ваш Gemini API ключ</label>
        <div style="display:flex;gap:0.5rem;">
          <input
            id="gemini-key-input"
            type="password"
            placeholder="AIza..."
            style="flex:1;background:#0A0E1A;border:1px solid #1e2d45;border-radius:10px;color:#E8EDF5;padding:0.7rem 1rem;font-size:0.9rem;font-family:'DM Sans',sans-serif;"
            onkeydown="if(event.key==='Enter') document.getElementById('save-key-btn').click()"
          >
          <button onclick="toggleKeyVis()" style="background:#1a2234;border:1px solid #1e2d45;border-radius:10px;color:#8B9BB4;padding:0 0.75rem;cursor:pointer;font-size:1rem;" title="Показать/скрыть">👁️</button>
        </div>
        <div style="font-size:0.75rem;color:#4A5878;margin-top:0.35rem;">
          Получить ключ: <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:#8B5CF6;">aistudio.google.com</a> → бесплатно
        </div>
      </div>

      <div id="key-error" style="display:none;background:rgba(255,107,107,0.1);border:1px solid rgba(255,107,107,0.3);border-radius:8px;padding:0.6rem 0.85rem;font-size:0.82rem;color:#FF6B6B;margin-bottom:1rem;"></div>

      <div style="display:flex;gap:0.75rem;">
        <button id="save-key-btn" onclick="saveKey()" style="flex:1;background:linear-gradient(135deg,#8B5CF6,#6D28D9);color:white;border:none;border-radius:10px;padding:0.75rem;font-family:'DM Sans',sans-serif;font-size:0.9rem;font-weight:600;cursor:pointer;">
          ✓ Сохранить и подключить
        </button>
        <button onclick="document.getElementById('api-key-modal').remove()" style="background:#1a2234;border:1px solid #1e2d45;border-radius:10px;color:#8B9BB4;padding:0.75rem 1rem;cursor:pointer;font-size:0.9rem;">
          Отмена
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close on backdrop click
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  // Attach functions to window scope
  window.toggleKeyVis = () => {
    const inp = document.getElementById('gemini-key-input');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  };

  window.saveKey = async () => {
    const key = document.getElementById('gemini-key-input').value.trim();
    const errEl = document.getElementById('key-error');
    const btn = document.getElementById('save-key-btn');

    if (!key) { showErr('Введите API ключ'); return; }
    if (!key.startsWith('AIza')) { showErr('Ключ должен начинаться с "AIza..."'); return; }

    btn.textContent = '⏳ Проверяем ключ...';
    btn.disabled = true;
    errEl.style.display = 'none';

    try {
      setApiKey(key);
      // Quick test call
      await geminiChat([{ role: 'user', content: 'Hi' }], '');
      modal.remove();
      onSuccess?.();
    } catch (e) {
      clearApiKey();
      btn.textContent = '✓ Сохранить и подключить';
      btn.disabled = false;
      if (e.message === 'INVALID_KEY') showErr('Неверный API ключ. Проверьте правильность.');
      else if (e.message === 'RATE_LIMIT') { setApiKey(key); modal.remove(); onSuccess?.(); }
      else showErr('Ошибка подключения: ' + e.message);
    }

    function showErr(msg) {
      errEl.textContent = '⚠️ ' + msg;
      errEl.style.display = 'block';
    }
  };

  setTimeout(() => document.getElementById('gemini-key-input')?.focus(), 100);
}

// ---------- API KEY STATUS BADGE ----------

function renderApiKeyBadge(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  function render() {
    if (hasApiKey()) {
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.5rem;background:rgba(0,212,170,0.1);border:1px solid rgba(0,212,170,0.3);border-radius:20px;padding:0.3rem 0.75rem;font-size:0.78rem;cursor:pointer;" onclick="showKeyMenu()">
          <span style="width:7px;height:7px;border-radius:50%;background:#00D4AA;"></span>
          <span style="color:#00D4AA;">Gemini подключён</span>
          <span style="color:#4A5878;">·</span>
          <span style="color:#8B9BB4;">Изменить</span>
        </div>`;
    } else {
      el.innerHTML = `
        <button onclick="renderApiKeyModal(()=>location.reload())" style="display:flex;align-items:center;gap:0.5rem;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.3);border-radius:20px;padding:0.35rem 0.85rem;font-size:0.8rem;color:#A78BFA;cursor:pointer;">
          🔑 Добавить Gemini API ключ
        </button>`;
    }
  }

  window.showKeyMenu = () => {
    if (confirm('Сбросить текущий API ключ?')) { clearApiKey(); render(); location.reload(); }
  };

  render();
}

// ---------- ERROR HELPERS ----------

function geminiError(e) {
  if (e.message === 'NO_KEY') return { needsKey: true, text: 'Добавьте Gemini API ключ для работы AI-функций.' };
  if (e.message === 'INVALID_KEY') return { needsKey: true, text: 'Неверный API ключ. Нажмите чтобы обновить.' };
  if (e.message === 'RATE_LIMIT') return { needsKey: false, text: 'Слишком много запросов. Подождите немного.' };
  return { needsKey: false, text: 'Ошибка AI: ' + e.message };
}