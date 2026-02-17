// =====================
// SHARED UI COMPONENTS
// =====================

function getNavbar(activePage = '') {
  return `
  <nav class="navbar">
    <a href="index.html" class="nav-logo">🚗 Birge</a>
    <div class="nav-links">
      <a href="index.html" ${activePage==='home'?'class="active"':''}>Главная</a>
      <a href="dashboard.html" ${activePage==='dashboard'?'class="active"':''}>Дашборд</a>
      <a href="search.html" ${activePage==='search'?'class="active"':''}>Поиск</a>
      <a href="my-trips.html" ${activePage==='mytrips'?'class="active"':''}>Мои поездки</a>
      <a href="about.html" ${activePage==='about'?'class="active"':''}>О проекте</a>
    </div>
    <div class="nav-actions">
      <a href="notifications.html" class="btn btn-secondary btn-sm">🔔 <span style="background:var(--accent3);color:white;border-radius:20px;padding:1px 6px;font-size:0.7rem;">3</span></a>
      <a href="profile.html" class="btn btn-secondary btn-sm">👤 Профиль</a>
    </div>
  </nav>`;
}

function getSidebar(active = '') {
  const links = [
    { section: 'Основное', items: [
      { href:'dashboard.html', icon:'📊', label:'Дашборд', key:'dashboard' },
      { href:'my-trips.html', icon:'🚗', label:'Мои поездки', key:'mytrips' },
      { href:'search.html', icon:'🔍', label:'Найти поездку', key:'search' },
      { href:'trip-create.html', icon:'➕', label:'Создать поездку', key:'create' },
    ]},
    { section: 'AI-функции', items: [
      { href:'ai-assistant.html', icon:'🤖', label:'AI-Ассистент', key:'ai', aiBadge:'NEW' },
      { href:'ai-match.html', icon:'✨', label:'AI Подбор', key:'aimatch', aiBadge:'AI' },
      { href:'optimize-route.html', icon:'🗺️', label:'Оптимизация', key:'optimize', aiBadge:'AI' },
    ]},
    { section: 'Активность', items: [
      { href:'requests.html', icon:'📨', label:'Заявки', key:'requests', badge:'2' },
      { href:'notifications.html', icon:'🔔', label:'Уведомления', key:'notifications', badge:'3' },
      { href:'history.html', icon:'📖', label:'История', key:'history' },
      { href:'analytics.html', icon:'📈', label:'Аналитика', key:'analytics' },
    ]},
    { section: 'Аккаунт', items: [
      { href:'profile.html', icon:'👤', label:'Профиль', key:'profile' },
      { href:'settings.html', icon:'⚙️', label:'Настройки', key:'settings' },
    ]},
  ];

  let html = '<div class="sidebar"><div id="sidebar-inner">';
  for (const section of links) {
    html += `<div class="sidebar-section"><div class="sidebar-label">${section.section}</div>`;
    for (const item of section.items) {
      const isActive = active === item.key ? ' class="active"' : '';
      const badge = item.badge ? `<span class="badge">${item.badge}</span>` : '';
      const aiBadge = item.aiBadge ? `<span class="ai-badge">${item.aiBadge}</span>` : '';
      html += `<a href="${item.href}"${isActive}><span class="icon">${item.icon}</span>${item.label}${badge}${aiBadge}</a>`;
    }
    html += '</div>';
  }
  html += '</div></div>';
  return html;
}

function getAIFab() {
  return `
  <button class="ai-fab" onclick="window.location.href='ai-assistant.html'" title="AI-Ассистент">
    🤖
    <span class="ai-fab-label">AI-Ассистент</span>
  </button>`;
}

function getAdminSidebar(active = '') {
  const links = [
    { href:'admin.html', icon:'📊', label:'Дашборд', key:'dashboard' },
    { href:'admin-users.html', icon:'👥', label:'Пользователи', key:'users' },
    { href:'admin-trips.html', icon:'🚗', label:'Поездки', key:'trips' },
    { href:'admin-complaints.html', icon:'⚠️', label:'Жалобы', key:'complaints', badge:'5' },
    { href:'admin-schools.html', icon:'🏫', label:'Школы', key:'schools' },
    { href:'admin-ai.html', icon:'🤖', label:'AI Мониторинг', key:'ai', aiBadge:'AI' },
  ];

  let html = '<div class="sidebar"><div id="sidebar-inner"><div class="sidebar-section"><div class="sidebar-label">Администрирование</div>';
  for (const item of links) {
    const isActive = active === item.key ? ' class="active"' : '';
    const badge = item.badge ? `<span class="badge">${item.badge}</span>` : '';
    const aiBadge = item.aiBadge ? `<span class="ai-badge">${item.aiBadge}</span>` : '';
    html += `<a href="${item.href}"${isActive}><span class="icon">${item.icon}</span>${item.label}${badge}${aiBadge}</a>`;
  }
  html += '</div></div></div>';
  return html;
}

// Inject layout into pages that use it
function buildLayout(opts = {}) {
  const { page = '', adminPage = '', title = 'Birge', content = '', isAdmin = false } = opts;
  document.title = `${title} — Birge`;
  
  const nav = isAdmin
    ? `<nav class="navbar"><a href="index.html" class="nav-logo">🚗 Birge</a><div class="nav-links"><span style="color:var(--text3);font-size:0.85rem;">Панель администратора</span></div><div class="nav-actions"><a href="dashboard.html" class="btn btn-secondary btn-sm">← На сайт</a></div></nav>`
    : getNavbar(page);

  const sidebar = isAdmin ? getAdminSidebar(adminPage) : getSidebar(page);
  const fab = isAdmin ? '' : getAIFab();

  document.body.innerHTML = nav + `<div class="layout">${sidebar}<main class="main fade-in">${content}</main></div>` + fab;
}