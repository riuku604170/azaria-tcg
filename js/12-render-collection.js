function renderPhilosophies() {
  var grid = document.getElementById('philosophyGrid'); if (!grid) return;
  grid.innerHTML = CONSONANCE_ORDER.map(function(key){ var p = PHILOSOPHIES[key]; return '<div class="philosophy-card reveal" style="--el: ' + ELEMENT_COLORS[key] + ';"><span class="philosophy-emoji">' + p.emoji + '</span><div class="philosophy-name">' + p.name + '</div><div class="philosophy-tagline">' + p.tagline + '</div><p class="philosophy-desc">' + p.desc + '</p><p class="philosophy-quote">"' + p.quote + '"</p></div>'; }).join('');
}
function renderConsonancias() {
  var grid = document.getElementById('consonanceGrid'); if (!grid) return;
  var cards = ['<div class="consonance-card reveal" style="--el: 240, 200, 96;"><div class="consonance-header"><span class="consonance-emoji">🌈</span><div><div class="consonance-name">Diverso</div><div class="consonance-sub">Composición mixta</div></div></div><div class="consonance-level"><div class="consonance-level-label">✨ Condición</div><div class="consonance-level-text">Ningún personaje del equipo comparte tipo.</div></div><div class="consonance-level"><div class="consonance-level-label">▶ Efecto</div><div class="consonance-level-text">Al comienzo de cada ronda, obtienes 2 omnidados.</div></div></div>'];
  CONSONANCE_ORDER.forEach(function(key){ var p = PHILOSOPHIES[key]; cards.push('<div class="consonance-card reveal" style="--el: ' + ELEMENT_COLORS[key] + ';"><div class="consonance-header"><span class="consonance-emoji">' + p.emoji + '</span><div><div class="consonance-name">' + p.name + '</div><div class="consonance-sub">' + p.tagline + '</div></div></div><div class="consonance-level"><div class="consonance-level-label">👥 2 personajes</div><div class="consonance-level-text">' + p.consonance2 + '</div></div><div class="consonance-level"><div class="consonance-level-label">👥 3 personajes</div><div class="consonance-level-text">' + p.consonance3 + '</div></div></div>'); });
  grid.innerHTML = cards.join('');
}

var CHAR_SORT_MODES = ['alpha', 'element', 'category'];
var CHAR_SORT_LABELS = {
  alpha:    '🔤 A → Z',
  element:  '🌈 Tipo',
  category: '📁 Categoría'
};
var CHAR_SORT_TITLES = {
  alpha:    'Orden actual: Alfabético (A → Z). Clic para cambiar.',
  element:  'Orden actual: por Tipo de Respuesta. Clic para cambiar.',
  category: 'Orden actual: por Categoría. Clic para cambiar.'
};
var CHAR_ELEMENT_ORDER = ['proteccion','comprension','expresion','transformacion','aceptacion','redencion','ilusion'];
var CHAR_CATEGORY_ORDER = ['Usuarios', 'Personajes', 'Eriks'];
var charSortMode = 'alpha';
var charFilterSet = {}, resFilterSet = {}, deckCatFilterSet = {}, deckTagFilterSet = {};
var CHARACTER_CATEGORIES = ['Eriks', 'Personajes', 'Usuarios', 'BTC'];
var CHARACTER_CATEGORY_COLORS = { 'Eriks':'255,120,60', 'Personajes':'130,220,140', 'Usuarios':'140,180,230', 'BTC':'92,179,255' };
var charCatFilterSet = {};

function updateCharSortBtn() {
  var btn = document.getElementById('charSortBtn');
  if (!btn) return;
  btn.textContent = CHAR_SORT_LABELS[charSortMode] || 'Ordenar';
  btn.title = CHAR_SORT_TITLES[charSortMode] || '';
}

function sortCharCards() {
  var grid = document.getElementById('cardsGrid');
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.char-card'));
  if (!cards.length) return;

  // ✅ Prioridad 1: personajes en el equipo, en el orden en que están en `team`.
  // Prioridad 2: el criterio actual (alpha / element / category).
  // Los que no están en el equipo van después, ordenados por el criterio actual.
  function teamRank(id) {
    var i = (typeof team !== 'undefined' && team) ? team.indexOf(id) : -1;
    return i === -1 ? 999 : i;
  }

  cards.sort(function(a, b) {
    var idA = a.dataset.character, idB = b.dataset.character;
    var rA = teamRank(idA), rB = teamRank(idB);
    // 1) Los del equipo siempre arriba, en su orden de selección.
    if (rA !== rB) return rA - rB;

    var chA = CHARACTERS[idA];
    var chB = CHARACTERS[idB];
    if (!chA || !chB) return 0;
    var nameA = normalize(chA.name);
    var nameB = normalize(chB.name);

    if (charSortMode === 'alpha') {
      return nameA.localeCompare(nameB);
    }
    if (charSortMode === 'element') {
      var idxA = CHAR_ELEMENT_ORDER.indexOf(chA.element);
      var idxB = CHAR_ELEMENT_ORDER.indexOf(chB.element);
      if (idxA === -1) idxA = 99;
      if (idxB === -1) idxB = 99;
      if (idxA !== idxB) return idxA - idxB;
      return nameA.localeCompare(nameB);
    }
    if (charSortMode === 'category') {
      var catA = CHAR_CATEGORY_ORDER.indexOf(chA.category || '');
      var catB = CHAR_CATEGORY_ORDER.indexOf(chB.category || '');
      if (catA === -1) catA = 99;
      if (catB === -1) catB = 99;
      if (catA !== catB) return catA - catB;
      return nameA.localeCompare(nameB);
    }
    return 0;
  });

  cards.forEach(function(card) { grid.appendChild(card); });
}

function setupCharSort() {
  var controls = document.querySelector('.collection-controls');
  if (!controls) return;

  var btn = document.getElementById('charSortBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'charSortBtn';
    btn.className = 'char-sort-btn';
    btn.setAttribute('aria-label', 'Cambiar orden de los personajes');
    controls.insertBefore(btn, controls.firstChild);

    btn.addEventListener('click', function() {
      var i = CHAR_SORT_MODES.indexOf(charSortMode);
      charSortMode = CHAR_SORT_MODES[(i + 1) % CHAR_SORT_MODES.length];
      updateCharSortBtn();
      sortCharCards();
      playSound('select');
    });
  }

  updateCharSortBtn();
  sortCharCards();
}

function renderCharFilter() {
  var bar = document.getElementById('charFilterBar'); if (!bar) return;
  var noneEl = setSize(charFilterSet) === 0;
  var noneCat = setSize(charCatFilterSet) === 0;

  var elBtns = ['<button class="filter-btn' + (noneEl ? ' active' : '') + '" data-filter="all" style="--fc: 240, 200, 96;">Todas</button>'];
  CONSONANCE_ORDER.forEach(function(key){
    var p = PHILOSOPHIES[key];
    elBtns.push('<button class="filter-btn' + (charFilterSet[key] ? ' active' : '') + '" data-filter="' + key + '" style="--fc: ' + ELEMENT_COLORS[key] + ';">' + p.emoji + ' ' + p.name + '</button>');
  });

  var catBtns = ['<button class="cat-filter-btn' + (noneCat ? ' active' : '') + '" data-catfilter="all" style="--fc: 240, 200, 96;">📚 Todas</button>'];
  CHARACTER_CATEGORIES.forEach(function(cat){
    var col = CHARACTER_CATEGORY_COLORS[cat] || '180,180,200';
    catBtns.push('<button class="cat-filter-btn' + (charCatFilterSet[cat] ? ' active' : '') + '" data-catfilter="' + cat + '" style="--fc: ' + col + ';">' + cat + '</button>');
  });

  bar.innerHTML = '<div class="filter-row">' + elBtns.join('') + '</div><div class="filter-row">' + catBtns.join('') + '</div>';

  bar.querySelectorAll('[data-filter]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var f = this.dataset.filter;
      if (f === 'all') charFilterSet = {}; else toggleFilterKey(charFilterSet, f);
      renderCharFilter(); applyFilters();
    });
  });
  bar.querySelectorAll('[data-catfilter]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var v = btn.dataset.catfilter;
      if (v === 'all') charCatFilterSet = {}; else toggleFilterKey(charCatFilterSet, v);
      renderCharFilter(); applyFilters();
    });
  });
}

function applyFilters() {
  var searchEl = document.getElementById('charSearch'); var query = searchEl ? normalize(searchEl.value.trim()) : '';
  var noneEl = setSize(charFilterSet) === 0;
  var noneCat = setSize(charCatFilterSet) === 0;
  var cards = document.querySelectorAll('.char-card'); var visible = 0;
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var cd = CHARACTERS[card.dataset.character];
    var nm = cd ? cd.name : '';
    var cat = cd ? (cd.category || '') : '';
    var elMatch = noneEl || !!charFilterSet[card.dataset.el];
    var catMatch = noneCat || !!charCatFilterSet[cat];
    if (elMatch && catMatch && (!query || normalize(nm).indexOf(query) !== -1)) {
      card.style.display = '';
      if (!card.classList.contains('visible')) card.classList.add('visible');
      visible++;
    } else card.style.display = 'none';
  }
  var counter = document.getElementById('charCounter');
  if (counter) counter.innerHTML = '<strong>' + visible + '</strong> de ' + cards.length;
}

function renderResonances() {
  var grid = document.getElementById('resonanceGrid'); if (!grid) return;
  grid.innerHTML = RESONANCES.map(function(r){ return '<div class="resonance-card" data-a="' + r.a + '" data-b="' + r.b + '" style="--ca: ' + ELEMENT_COLORS[r.a] + '; --cb: ' + ELEMENT_COLORS[r.b] + ';"><div class="resonance-header"><span class="resonance-types">' + ELEMENT_EMOJI[r.a] + ' + ' + ELEMENT_EMOJI[r.b] + '</span><span class="resonance-name">' + r.name + '</span></div><p class="resonance-lore">"' + r.lore + '"</p><p class="resonance-effect">' + r.effect + '</p></div>'; }).join('');
  renderResonanceFilters(); applyResonanceFilters();
}
function renderResonanceFilters() {
  var filterBar = document.getElementById('filterBar'); if (!filterBar) return;
  var none = setSize(resFilterSet) === 0;
  var filters = ['<button class="filter-btn' + (none ? ' active' : '') + '" data-filter="all" style="--fc: 240, 200, 96;">Todas</button>'];
  CONSONANCE_ORDER.forEach(function(key){ var p = PHILOSOPHIES[key]; filters.push('<button class="filter-btn' + (resFilterSet[key] ? ' active' : '') + '" data-filter="' + key + '" style="--fc: ' + ELEMENT_COLORS[key] + ';">' + p.emoji + ' ' + p.name + '</button>'); });
  filterBar.innerHTML = filters.join('');
  var btns = filterBar.querySelectorAll('.filter-btn');
  for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', function(){ var f = this.dataset.filter; if (f === 'all') resFilterSet = {}; else toggleFilterKey(resFilterSet, f); renderResonanceFilters(); applyResonanceFilters(); });
}
function applyResonanceFilters() {
  var grid = document.getElementById('resonanceGrid'); if (!grid) return;
  var none = setSize(resFilterSet) === 0;
  var cards = grid.querySelectorAll('.resonance-card');
  for (var i = 0; i < cards.length; i++) { var c = cards[i]; c.classList.toggle('hidden', !(none || !!resFilterSet[c.dataset.a] || !!resFilterSet[c.dataset.b])); }
}

function parseCost(text) {
  if (!text) return [];
  return text.split(/,\s*/).map(function(part){
    part = part.trim(); var m;
    if ((m = part.match(/x(\d+)\s+dados?\s+de\s+(.+)/i))) { var el = m[2].trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); return { count:+m[1], type:'element', element:el }; }
    if ((m = part.match(/x(\d+)\s+dados?\s+cual(?:es)?quiera/i))) return { count:+m[1], type:'any' };
    if ((m = part.match(/x(\d+)\s+puntos?\s+de\s+energía/i))) return { count:+m[1], type:'energy' };
    return { text:part };
  });
}
function renderCost(costText) {
  var parts = parseCost(costText); if (!parts.length) return '';
  return parts.map(function(p){
    if (p.text) return '<span class="die">' + p.text + '</span>';
    if (p.type === 'any') return '<span class="die die-any">🎲 <b>×' + p.count + '</b></span>';
    if (p.type === 'energy') return '<span class="die die-energy">⚡ <b>×' + p.count + '</b></span>';
    if (p.type === 'element') { var color = ELEMENT_COLORS[p.element] || '150,150,170'; var emoji = ELEMENT_EMOJI[p.element] || '🎲'; return '<span class="die" style="--dc:' + color + ';">' + emoji + ' <b>×' + p.count + '</b></span>'; }
    return '';
  }).join('');
}
function renderAbility(ab, elementColor) {
  var costHtml = ab.cost ? '<div class="ability-cost">' + renderCost(ab.cost) + '</div>' : '';
  var inlineStyle = ab.type === 'elemental' ? 'style="--abc:' + elementColor + ';"' : '';
  return '<div class="ability ability-' + ab.type + '" ' + inlineStyle + '><div class="ability-head"><span class="ability-type-icon">' + ab.icon + '</span><span class="ability-type">' + (ABILITY_TYPES[ab.type] || '') + '</span></div><h4 class="ability-name">' + ab.name + '</h4>' + costHtml + '<p class="ability-effect">' + ab.effect + '</p></div>';
}
function buildModalContent(charId, char, originalId) {
  var el = char.element;
  var obtainText = 'Se obtiene comprándolo en la tienda con cierto precio y un nivel de amistad concreto, tras vencerlo en una batalla (desbloqueado por ' + char.name + ').';
  // ✅ Botón de alternar Adela <-> Hunger
  var toggleHtml = '';
  if (charId === 'adela') {
    toggleHtml = '<button class="modal-toggle-view" data-toggle-view="hunger" title="Ver Hunger Incarnate">👹 Ver Hunger Incarnate</button>';
  } else if (charId === 'hunger') {
    toggleHtml = '<button class="modal-toggle-view" data-toggle-view="adela" title="Volver a Adela">🕊️ Volver a Adela</button>';
  } else if (charId === 'maria') {
    toggleHtml = '<button class="modal-toggle-view" data-toggle-view="exmaria" title="Ver EX-María">👁️ Ver EX-María</button>';
  } else if (charId === 'exmaria') {
    toggleHtml = '<button class="modal-toggle-view" data-toggle-view="maria" title="Volver a María">👁️ Volver a María</button>';
  }
  return '<div class="modal-header"><div class="modal-portrait" data-fallback="' + char.emoji + '"><img src="' + char.img + '" alt="' + char.name + '" class="portrait-img" style="opacity:0;" onload="this.style.opacity=1;" onerror="this.style.display=\'none\';"><div class="modal-hp-badge">' + char.hp + ' HP</div></div><div class="modal-info"><div class="modal-eyebrow"><span class="el-badge-lg">' + ELEMENT_EMOJI[el] + '</span>' + ELEMENT_NAMES[el] + ' · ' + char.set + '</div><h2 class="modal-title" id="modalTitle">' + char.name + '</h2><p class="modal-concept">"' + char.concept + '"</p>' + toggleHtml + '</div><button class="modal-close" aria-label="Cerrar">×</button></div><div class="modal-body"><div class="obtain-box"><div class="obtain-label">📍 Obtención</div><p class="obtain-text">' + obtainText + '</p></div><div class="abilities">' + char.abilities.map(function(ab){ return renderAbility(ab, ELEMENT_COLORS[el]); }).join('') + '</div></div>';
}

var modal = document.getElementById('cardModal');
var modalContent = document.getElementById('modalContent');
function openCharacter(id, viewId) {
  // viewId permite abrir el modal mostrando una "vista" distinta a la del id
  // (ej: abrir 'adela' pero mostrando 'hunger').
  var showId = viewId || id;
  var char = CHARACTERS[showId]; if (!char || !modal || !modalContent) return;
  modalContent.style.setProperty('--el', ELEMENT_COLORS[char.element]);
  modalContent.innerHTML = buildModalContent(showId, char, id);
  var closeBtn = modalContent.querySelector('.modal-close'); if (closeBtn) closeBtn.addEventListener('click', closeModal);
  // Botón para alternar Adela <-> Hunger dentro del mismo modal
  var toggleBtn = modalContent.querySelector('[data-toggle-view]');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      var targetView = toggleBtn.getAttribute('data-toggle-view');
      openCharacter(targetView, targetView);
    });
  }
  // Botón para cambiar el personaje activo del modal (solo Adela)
  var changeBtn = modalContent.querySelector('[data-modal-team-btn]');
  if (changeBtn) {
    changeBtn.addEventListener('click', function() {
      closeModal();
      toggleTeam(changeBtn.getAttribute('data-modal-team-btn'));
    });
  }
  modal.classList.add('open'); document.body.style.overflow = 'hidden';
}
function closeModal(){ if (!modal) return; modal.classList.remove('open'); document.body.style.overflow = ''; }
if (modal) { var backdrop = modal.querySelector('.card-modal-backdrop'); if (backdrop) backdrop.addEventListener('click', closeModal); }
document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeModal(); });