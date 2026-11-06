/* ═══ SISTEMA DE AVISOS (Anuncios + Novedades) ═══ */

// ═══════════ NOVEDADES (parches) ═══════════
var PATCHES = [
{
  version: 'BETA 1.5',
  date: '2026-11-06',
  type: 'minor',
  title: 'Nuevo personaje y mejoras visuales',
  changes: [
    'Añadida Vittoria (Eriks).',
    'Añadidos números flotantes y pop-ups de las habilidades en combate.'
  ]  
},
{
  version: 'BETA 1.4',
  date: '2026-11-05',
  type: 'mayor',
  title: 'Nuevo personaje y novedades en los usuarios',
  changes: [
    'Añadida Iris (Eriks).',
    'Reescritura y rebalanceo de los sets de los 12 usuarios actuales.',
    'Display de información de los usuarios más cómodo.',
    'Arreglos en las habilidades de algunos usuarios.',
    'Añadidas EX de todos los personajes jugables restantes.'
  ]  
},
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
  id: 'ann_2026_11_05_1',
  date: '2026-11-05',
  icon: '🎂',
  title: '¡Japi Berdei Vicky!',
  body: [
    '-Bueno bueno Manolo, ¿pero qué está pasando aquí? Madre mía...',
    '-Bueno Antonio, lo veo y no lo creo, que le han metido esteroides al menú, no me lo puedo creer.',
    '-A ver Manolo, yo creo que estás exagerango un poco, ¿eh? Pero vamos, que ahora los personajes son más cómodos de ver.',
    '-¡Sin lugar a duda, Antonio! Además, me han dicho que por ahí ha habido un rebalanceo curioso...',
    '-Pues yo creo que Manuel se tendría que haber quedado como estaba, Manolo, ¿para qué te voy a mentir? Las cosas como son...',
    '-Yo era main Abla, Antonio.',
    '-Joder, pobrecito... Imagínate yo que dependía de Noah y parece que le han descuartizado la elemental, Manolo.',
    '-A ver si el impresentable este es más benevolente con nosotros en la próxima actualización...',
    '-Claro que sí... ¿Ya viste las EX funcionando y sus nombres? Farmean aura, no me digas que no.',
    '-La verdad es que ni me va ni me viene, yo voy a probar al nuevo personaje...',
    '-¿¡CÓMO!?',
    '-Que sí, que sí, que han metido a la buenorra de Iris al juego, Antonio, te lo juro.',
    '-Es cierto... ¿Y por qué Iris?',
    '-¡Pues me están diciendo por el pinganillo que es el cumpleaños de una fan!',
    '-¡Aguaa! Pues desde aquí le deseamos muchas felicidades a la cumpleañera, ¿verdad Manolo?',
    '-Como siempre, Antonio, y que cumpla muchos más... Nos vemos en la siguiente actualización.',
    '-Con Paco y Manolo.',
    '-Que tú te llamas Antonio, gilipollas...',
    '-Lleva razón.'
  ]
},
{
  id: 'ann_2026_11_04_3',
  date: '2026-11-04',
  icon: '🔥',
  title: 'Fuck DeepSeek',
  body: 'Agárrense el culito mis pequeños, se viene cambio gordo en el menú de personajes y rebalanceo de los mismos. Voy primero con los Usuarios (mis 12 peones, ¡¡OUH YEAH!!).'
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
    // body puede ser string (una línea) o array (varias líneas)
    var bodyHtml = '';
    if (Array.isArray(a.body)) {
      bodyHtml = a.body.map(function(line){
        return '<div class="announcement-line">' + line + '</div>';
      }).join('');
    } else {
      bodyHtml = '<div class="announcement-line">' + (a.body || '') + '</div>';
    }
    return '<div class="announcement-entry' + (isLatest ? ' latest' : '') + '">' +
      '<div class="announcement-entry-head">' +
        (a.icon ? '<span class="announcement-icon">' + a.icon + '</span>' : '') +
        '<span class="announcement-title">' + (a.title || '') + '</span>' +
        '<span class="announcement-date">' + (a.date || '') + '</span>' +
      '</div>' +
      '<div class="announcement-body">' + bodyHtml + '</div>' +
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
