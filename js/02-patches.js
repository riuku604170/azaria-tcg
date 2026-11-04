/* ═══ SISTEMA DE PARCHES ═══ */
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
  changes: [
    'Añadido Facebook (BTC).'
  ]
},
{
  version: 'BETA 1.1',
  date: '2026-11-04',
  type: 'minor',
  title: 'Arreglos menores',
  changes: [
    'Arreglos en NC, Google y Neón.'
  ]
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

var PATCH_TYPE_LABEL = { major: 'Major', minor: 'Minor', fix: 'Fix', balance: 'Balance' };
var PATCHES_SEEN_KEY = 'azaria_patches_seen_version';

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
function refreshPatchesBadge() {
  var badge = document.getElementById('patchesNewBadge');
  if (!badge) return;
  var latest = getLatestPatchVersion();
  var seen = getSeenPatchVersion();
  if (!latest) { badge.hidden = true; return; }
  badge.hidden = (latest === seen);
}
function markPatchesAsSeen() {
  var latest = getLatestPatchVersion();
  if (latest) setSeenPatchVersion(latest);
  refreshPatchesBadge();
}
function renderPatches() {
  var body = document.getElementById('patchesBody');
  if (!body) return;
  if (!PATCHES.length) {
    body.innerHTML = '<div style="text-align:center; color: var(--muted); font-style: italic; padding: 2rem;">Aún no hay parches registrados.</div>';
    return;
  }
  body.innerHTML = PATCHES.map(function(p, i) {
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
function openPatchesModal() {
  var m = document.getElementById('patchesModal');
  if (!m) return;
  renderPatches();
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closePatchesModal() {
  var m = document.getElementById('patchesModal');
  if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
}
function initPatches() {
  var link = document.getElementById('patchesNavLink');
  if (link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      openPatchesModal();
      markPatchesAsSeen();
    });
  }
  var m = document.getElementById('patchesModal');
  if (m) {
    var closeBtn = document.getElementById('patchesCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closePatchesModal);
    var backdrop = m.querySelector('.patches-backdrop');
    if (backdrop) backdrop.addEventListener('click', closePatchesModal);
  }
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var modal = document.getElementById('patchesModal');
      if (modal && modal.classList.contains('open')) closePatchesModal();
    }
  });
  refreshPatchesBadge();
}
