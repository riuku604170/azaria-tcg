/* ═══ SISTEMA DE AVISOS (Anuncios + Novedades) ═══ */

// ═══════════ NOVEDADES (parches) ═══════════
var PATCHES = [
{
  version: 'BETA 1.3',
  date: '2026-11-04',
  type: 'minor',
  title: 'Arreglos de flujo, navegación, personajes, Sandbox y mejoras visuales',
  changes: [
    'Arreglados todos los personajes de la categoría BTC (Internet, Google, Facebook).',
    'Flujo de combate más cómodo y sencillo de entender.',
    'Añadidos visuales a los efectos de algunas acciones pasivas.',
    'Mejorada la comodidad de navegación en el menú.',
    'EX ahora posibles en el modo Sandbox.'
  ]
},
{
  version: 'BETA 1.2',
  date: '2026-11-04',
  type: 'minor',
  title: 'Nuevo Personaje',
  changes: [ 'Añadido Facebook (BTC).' ]
},
{
  version: 'BETA 1.1',
  date: '2026-11-04',
  type: 'minor',
  title: 'Arreglos menores',
  changes: [ 'Arreglos en NC, Google y Neón.' ]
},
{
  version: 'BETA 1',
  date: '2026-11-04',
  type: 'minor',
  title: 'Arreglos y Nuevos Personajes',
  changes: [
    'Rebalanceo de Neón y María.',
    'Arreglos en María.',
    'Añadidos NC (Eriks) y Google (BTC).'
  ]
},
];

// ═══════════ ANUNCIOS ═══════════
// Cada anuncio necesita un `id` único. El más reciente debe ir PRIMERO.
// Al añadir uno nuevo arriba, el badge ! aparecerá automáticamente.
var ANNOUNCEMENTS = [

{
  id: 'ann_2026_11_04_3',
  date: '2026-11-04',
  icon: '🔥',
  title: 'Fuck DeepSeek',
  body: [
    'Agárrense el culito mis pequeños, se viene cambio gordo en el menú de personajes y rebalanceo de los mismos. Voy primero con los Usuarios (mis 12 peones, ¡¡OUH YEAH!!).'
  ]
},
{
  id: 'ann_2026_11_04_2',
  date: '2026-11-04',
  icon: '🎭',
  title: 'Próximamente: nuevo personaje',
  body: 'Estamos preparando un nuevo personaje que se unirá al roster en la próxima actualización. Mantente atento a las Novedades para más detalles.'
},
{
  id: 'ann_2026_11_04_1',
  date: '2026-11-04',
  icon: '📢',
  title: 'Bienvenido a la sección Avisos',
  body: 'Esta sección reúne los anuncios generales del juego (pestaña Anuncios) y el historial completo de cambios (pestaña Novedades).'
}
];

var PATCH_TYPE_LABEL = { major: 'Major', minor: 'Minor', fix: 'Fix', balance: 'Balance' };
var PATCHES_SEEN_KEY = 'azaria_patches_seen_version';
var ANNOUNCEMENTS_SEEN_KEY = 'azaria_announcements_seen_version';

// ── Estado de las pestañas ──
var activeAvisosTab = 'novedades'; // 'anuncios' | 'novedades'

// ═══════════ NOVEDADES (parches) ═══════════
function getLatestPatchVersion() {
  if (!Array.isArray(PATCHES) || !PATCHES.length) return null;
  return PATCHES[0].version || null;
}
function getSeenPatchVersion() {
  try { return localStorage.getItem(PATCHES_SEEN_KEY); } catch (e) { return null; }
}
function setSeenPatchVersion(v) {
  try { localStorage.setItem(PATCHES_SEEN_KEY, v); } catch (e) {}
}
function hasUnseenPatches() {
  var latest = getLatestPatchVersion();
  if (!latest) return false;
  return latest !== getSeenPatchVersion();
}
function markPatchesAsSeen() {
  var latest = getLatestPatchVersion();
  if (latest) setSeenPatchVersion(latest);
  refreshAvisosBadges();
}

// ═══════════ ANUNCIOS ═══════════
function getLatestAnnouncementId() {
  if (!Array.isArray(ANNOUNCEMENTS) || !ANNOUNCEMENTS.length) return null;
  return ANNOUNCEMENTS[0].id || null;
}
function getSeenAnnouncementId() {
  try { return localStorage.getItem(ANNOUNCEMENTS_SEEN_KEY); } catch (e) { return null; }
}
function setSeenAnnouncementId(v) {
  try { localStorage.setItem(ANNOUNCEMENTS_SEEN_KEY, v); } catch (e) {}
}
function hasUnseenAnnouncements() {
  var latest = getLatestAnnouncementId();
  if (!latest) return false;
  return latest !== getSeenAnnouncementId();
}
function markAnnouncementsAsSeen() {
  var latest = getLatestAnnouncementId();
  if (latest) setSeenAnnouncementId(latest);
  refreshAvisosBadges();
}

// ═══════════ BADGES ═══════════
function refreshAvisosBadges() {
  // Badge principal del nav (visible si hay novedades en CUALQUIER pestaña)
  var mainBadge = document.getElementById('patchesNewBadge');
  if (mainBadge) mainBadge.hidden = !(hasUnseenPatches() || hasUnseenAnnouncements());

  // Badge de cada pestaña
  var tabAnn = document.getElementById('tabAnnouncementsBadge');
  if (tabAnn) tabAnn.hidden = !hasUnseenAnnouncements();
  var tabNov = document.getElementById('tabNovedadesBadge');
  if (tabNov) tabNov.hidden = !hasUnseenPatches();
}
// Alias por compatibilidad (por si algo externo llama a refreshPatchesBadge)
function refreshPatchesBadge() { refreshAvisosBadges(); }

// ═══════════ RENDER ═══════════
function buildPatchesHTML() {
  if (!PATCHES.length) {
    return '<div style="text-align:center; color: var(--muted); font-style: italic; padding: 2rem;">Aún no hay parches registrados.</div>';
  }
  return PATCHES.map(function(p, i) {
    var isLatest = i === 0;
    var typeCls = isLatest ? 'latest' : (p.type || 'minor');
    var typeLabel = isLatest ? 'Última' : (PATCH_TYPE_LABEL[p.type] || 'Cambios');
    var changesHtml = (p.changes || []).map(function(c) { return '<li>' + c + '</li>'; }).join('');
    return '<div class="patch-entry ' + typeCls + '">' +
      '<div class="patch-entry-head">' +
        '<span class="patch-version">' + p.version + '</span>' +
        '<span class="patch-badge ' + (isLatest ? 'latest' : '') + '">' + typeLabel + '</span>' +
        '<span class="patch-date">' + (p.date || '') + '</span>' +
      '</div>' +
      (p.title ? '<div class="patch-title">' + p.title + '</div>' : '') +
      '<ul class="patch-changes">' + changesHtml + '</ul>' +
    '</div>';
  }).join('');
}

function buildAnnouncementsHTML() {
  if (!ANNOUNCEMENTS.length) {
    return '<div style="text-align:center; color: var(--muted); font-style: italic; padding: 2rem;">No hay anuncios por ahora.</div>';
  }
  return ANNOUNCEMENTS.map(function(a, i) {
    var isLatest = i === 0;
    return '<div class="announcement-entry' + (isLatest ? ' latest' : '') + '">' +
      '<div class="announcement-entry-head">' +
        (a.icon ? '<span class="announcement-icon">' + a.icon + '</span>' : '') +
        '<span class="announcement-title">' + (a.title || '') + '</span>' +
        '<span class="announcement-date">' + (a.date || '') + '</span>' +
      '</div>' +
      '<p class="announcement-body">' + (a.body || '') + '</p>' +
    '</div>';
  }).join('');
}

function renderAvisosContent() {
  var body = document.getElementById('patchesBody');
  if (!body) return;
  if (activeAvisosTab === 'anuncios') body.innerHTML = buildAnnouncementsHTML();
  else body.innerHTML = buildPatchesHTML();
}
// Alias por compatibilidad
function renderPatches() { renderAvisosContent(); }

// ═══════════ TABS ═══════════
function switchAvisosTab(tab) {
  if (tab !== 'anuncios' && tab !== 'novedades') return;
  if (activeAvisosTab === tab) return;

  // Marcar la pestaña que dejamos como vista
  if (activeAvisosTab === 'anuncios') markAnnouncementsAsSeen();
  else if (activeAvisosTab === 'novedades') markPatchesAsSeen();

  activeAvisosTab = tab;

  document.querySelectorAll('.avisos-tab').forEach(function(btn){
    btn.classList.toggle('active', btn.dataset.avisosTab === tab);
  });

  renderAvisosContent();
  refreshAvisosBadges();
}

// ═══════════ ABRIR / CERRAR ═══════════
function openPatchesModal() {
  var m = document.getElementById('patchesModal');
  if (!m) return;

  // Auto-switch: si la pestaña actual está al día pero la otra tiene novedades, abre la que tiene novedades.
  var hasUnseenCurrent = (activeAvisosTab === 'anuncios') ? hasUnseenAnnouncements() : hasUnseenPatches();
  if (!hasUnseenCurrent) {
    if (activeAvisosTab === 'novedades' && hasUnseenAnnouncements()) activeAvisosTab = 'anuncios';
    else if (activeAvisosTab === 'anuncios' && hasUnseenPatches()) activeAvisosTab = 'novedades';
  }

  renderAvisosContent();
  document.querySelectorAll('.avisos-tab').forEach(function(btn){
    btn.classList.toggle('active', btn.dataset.avisosTab === activeAvisosTab);
  });

  m.classList.add('open');
  document.body.style.overflow = 'hidden';
  refreshAvisosBadges();
}

function closePatchesModal() {
  // Marcar la pestaña activa como vista al cerrar
  if (activeAvisosTab === 'anuncios') markAnnouncementsAsSeen();
  else if (activeAvisosTab === 'novedades') markPatchesAsSeen();

  var m = document.getElementById('patchesModal');
  if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
}

// ═══════════ INIT ═══════════
function initPatches() {
  var link = document.getElementById('patchesNavLink');
  if (link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      openPatchesModal();
    });
  }

  var m = document.getElementById('patchesModal');
  if (m) {
    var closeBtn = document.getElementById('patchesCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closePatchesModal);
    var backdrop = m.querySelector('.patches-backdrop');
    if (backdrop) backdrop.addEventListener('click', closePatchesModal);
  }

  document.querySelectorAll('.avisos-tab').forEach(function(btn){
    btn.addEventListener('click', function(){
      switchAvisosTab(btn.dataset.avisosTab);
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var modal = document.getElementById('patchesModal');
      if (modal && modal.classList.contains('open')) closePatchesModal();
    }
  });

  refreshAvisosBadges();
}
