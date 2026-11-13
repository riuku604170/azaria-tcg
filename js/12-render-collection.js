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
var CHAR_CATEGORY_ORDER = ['Usuarios', 'HNN', 'BTC', 'Lusior', 'Azaria'];
var charSortMode = 'alpha';
var charFilterSet = {}, resFilterSet = {}, deckCatFilterSet = {}, deckTagFilterSet = {};
var CHARACTER_CATEGORIES = ['Usuarios', 'HNN', 'BTC', 'Lusior', 'Azaria'];
var CHARACTER_CATEGORY_COLORS = {
  'Usuarios': '140,180,230',
  'HNN':    '255,120,60',
  'BTC':      '92,179,255',
  'Lusior':   '100,220,120',
  'Azaria':   '240,200,96'
};
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
  var searchEl = document.getElementById('charSearch');
  var query = searchEl ? normalize(searchEl.value.trim()) : '';
  var noneEl = setSize(charFilterSet) === 0;
  var noneCat = setSize(charCatFilterSet) === 0;
  var allCards = document.querySelectorAll('.char-card');
  var visible = 0;
  var totalVisible = 0;
  for (var i = 0; i < allCards.length; i++) {
    var card = allCards[i];
    // ✅ Locked: ocultar SIEMPRE, sin importar los filtros
    if (card.classList.contains('locked')) {
      card.style.display = 'none';
      continue;
    }
    totalVisible++;
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
  if (counter) counter.innerHTML = '<strong>' + visible + '</strong> de ' + totalVisible;
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
  // ✅ Quita el prefijo "Coste:" si lo hay (formato nuevo o antiguo)
  var clean = String(text).replace(/^\s*Coste\s*:\s*/i, '').trim();
  if (!clean) return [];

  // Mapa de nombres (con acentos) → clave de elemento
  var EL_KEYS = {
    redencion:'redencion', comprension:'comprension', expresion:'expresion',
    proteccion:'proteccion', ilusion:'ilusion', transformacion:'transformacion',
    aceptacion:'aceptacion'
  };

  return clean.split(/\s*[,+]\s*/).map(function(part){
    part = part.trim();
    if (!part) return null;
    var m;
    // "x2 dados de aceptación"  |  "1 dado de Redención"  |  "2 dados de redención"
    if ((m = part.match(/^x?(\d+)\s+dados?\s+de\s+(.+)/i))) {
      var raw = m[2].trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      var el = EL_KEYS[raw] || raw;
      return { count:+m[1], type:'element', element: el };
    }
    // "x2 dados cualesquiera"  |  "2 dados cualesquiera"  |  "1 dado cualquiera"
    if ((m = part.match(/^x?(\d+)\s+dados?\s+cual(?:es)?quiera/i))) return { count:+m[1], type:'any' };
    // "x3 puntos de energía"  |  "3 puntos de energía"
    if ((m = part.match(/^x?(\d+)\s+puntos?\s+de\s+energ[ií]a/i))) return { count:+m[1], type:'energy' };
    return { text:part };
  }).filter(Boolean);
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
function renderAbility(ab, elementColor, charTerms) {
  ab = normalizeAbility(ab);
  var isNew = !!ab.description;
  var inlineStyle = ab.type === 'elemental' ? 'style="--abc:' + elementColor + ';"' : '';
  var descHtml = isNew
    ? '<p class="ability-description">' + renderAbilityDescription(ab.description, charTerms) + '</p>'
    : '';

  // ✅ Extrae el coste de attributes y lo pinta bajo el nombre (como antes)
  var costHtml = '';
  if (ab.attributes && ab.attributes.length) {
    for (var ci = 0; ci < ab.attributes.length; ci++) {
      if (/^\s*Coste\s*:/i.test(ab.attributes[ci])) {
        var renderedCost = renderCost(ab.attributes[ci]);
        if (renderedCost) costHtml = '<div class="ability-cost">' + renderedCost + '</div>';
        break;
      }
    }
  }

  var attrsBtn = (ab.attributes && ab.attributes.length)
    ? '<button class="ability-attributes-btn" data-ability-name="' + (ab.name || '').replace(/"/g,'&quot;') + '">📊 Atributos</button>'
    : '';

  return '<div class="ability ability-' + ab.type + '" ' + inlineStyle + '>' +
    '<div class="ability-head"><span class="ability-type-icon">' + ab.icon + '</span><span class="ability-type">' + (ABILITY_TYPES[ab.type] || '') + '</span></div>' +
    '<h4 class="ability-name">' + ab.name + '</h4>' +
    costHtml +
    descHtml +
    attrsBtn +
    '</div>';
}
function buildModalContent(charId, char, originalId, isIdolView) {
  isIdolView = !!isIdolView;
  var el = char.element;
  var terms = char.terms || [];
  var displayName = isIdolView ? 'YouTube Idol' : char.name;
  var displayImg = isIdolView ? 'img/youtubeidol.png' : char.img;
  var displayEmoji = isIdolView ? '🎤' : char.emoji;
  var obtainText = 'Se obtiene comprándolo en la tienda con cierto precio y un nivel de amistad concreto, tras vencerlo en una batalla (desbloqueado por ' + char.name + ').';

  var toggleHtml = '';
  if (charId === 'adela') {
    toggleHtml = '<button class="modal-toggle-view" data-toggle-view="hunger" title="Ver Hunger Incarnate">👹 Ver Hunger Incarnate</button>';
  } else if (charId === 'hunger') {
    toggleHtml = '<button class="modal-toggle-view" data-toggle-view="adela" title="Volver a Adela">🕊️ Volver a Adela</button>';
  } else if (charId === 'maria') {
    toggleHtml = '<button class="modal-toggle-view" data-toggle-view="exmaria" title="Ver EX-María">👁️ Ver EX-María</button>';
  } else if (charId === 'exmaria') {
    toggleHtml = '<button class="modal-toggle-view" data-toggle-view="maria" title="Volver a María">👁️ Volver a María</button>';
  } else if (charId === 'youtube') {
    if (isIdolView) {
      toggleHtml = '<button class="modal-toggle-view" data-toggle-view="youtube" title="Volver a forma Casual">📺 Volver a YouTube (Casual)</button>';
    } else {
      toggleHtml = '<button class="modal-toggle-view" data-toggle-view="youtubeidol" title="Ver forma Idol">🎤 Ver YouTube Idol</button>';
    }
  }

  var abilitiesHtml = (char.abilities || []).map(function(ab){ return renderAbility(ab, ELEMENT_COLORS[el], terms); }).join('');

  return '<div class="modal-header"><div class="modal-portrait" data-fallback="' + displayEmoji + '"><img src="' + displayImg + '" alt="' + displayName + '" class="portrait-img" style="opacity:0;" onload="this.style.opacity=1;" onerror="this.style.display=\'none\';"><div class="modal-hp-badge">' + char.hp + ' HP</div></div><div class="modal-info"><div class="modal-eyebrow"><span class="el-badge-lg">' + ELEMENT_EMOJI[el] + '</span>' + ELEMENT_NAMES[el] + ' · ' + (char.category || char.set) + '</div><h2 class="modal-title" id="modalTitle">' + displayName + '</h2><p class="modal-concept">"' + char.concept + '"</p>' + toggleHtml + '</div><button class="modal-close" aria-label="Cerrar">×</button></div><div class="modal-body"><div class="obtain-box"><div class="obtain-label">📍 Obtención</div><p class="obtain-text">' + obtainText + '</p></div><div class="abilities">' + abilitiesHtml + '</div></div>';
}

var modal = document.getElementById('cardModal');
var modalContent = document.getElementById('modalContent');
function openCharacter(id, viewId, opts) {
  opts = opts || {};
  var shopMode = !!opts.shopMode;
  var showId = viewId || id;

  // ✅ Vista especial "youtubeidol": usa YouTube como base pero cambia imagen/nombre
  var isIdolView = (showId === 'youtubeidol');
  var charId = isIdolView ? 'youtube' : showId;
  var char = CHARACTERS[charId]; if (!char || !modal || !modalContent) return;
  var terms = char.terms || [];
  var abilities = (char.abilities || []).map(normalizeAbility);

  modalContent.style.setProperty('--el', ELEMENT_COLORS[char.element]);
  modalContent.innerHTML = buildModalContent(charId, char, id, isIdolView);

  var closeBtn = modalContent.querySelector('.modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  var toggleBtn = modalContent.querySelector('[data-toggle-view]');
  if (toggleBtn) toggleBtn.addEventListener('click', function(){ var tv = toggleBtn.getAttribute('data-toggle-view'); openCharacter(tv, tv, opts); });
  modalContent.querySelectorAll('.clickable-term').forEach(function(span){
    span.addEventListener('click', function(e){
      e.stopPropagation();
      var key = span.dataset.termKey; var term = null;
      for (var i = 0; i < terms.length; i++) if (terms[i].key === key) { term = terms[i]; break; }
      if (term) showTermPopup(span, term);
    });
  });
  modalContent.querySelectorAll('.ability-attributes-btn').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var aname = btn.dataset.abilityName; var ab = null;
      for (var i = 0; i < abilities.length; i++) if (abilities[i].name === aname) { ab = abilities[i]; break; }
      if (ab && ab.attributes && ab.attributes.length) showAttributesPopup(btn, ab.name, ab.attributes);
    });
  });

  // ✅ Barra de compra (solo en shopMode)
  if (shopMode) {
    var bar = document.createElement('div');
    bar.className = 'shop-buy-bar';
    var idForShop = charId;  // ✅ Para youtubeidol, comprobar/desbloquear 'youtube'
    if (typeof isUnlocked === 'function' && !isUnlocked(idForShop)) {
      bar.innerHTML = '<div class="shop-buy-price">💎 ' + (typeof SHOP_DEFAULT_PRICE !== 'undefined' ? SHOP_DEFAULT_PRICE : 100) + '</div>' +
        '<button class="shop-buy-btn" id="shopBuyBtn">Comprar</button>';
      modalContent.appendChild(bar);
      var bb = document.getElementById('shopBuyBtn');
      if (bb) bb.addEventListener('click', function(){ if (typeof buyShopItem === 'function') buyShopItem(idForShop, 'characters'); });
    } else {
      bar.innerHTML = '<div class="shop-buy-owned">✓ Ya lo tienes</div>';
      modalContent.appendChild(bar);
    }
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(){ if (!modal) return; modal.classList.remove('open'); document.body.style.overflow = ''; }
if (modal) { var backdrop = modal.querySelector('.card-modal-backdrop'); if (backdrop) backdrop.addEventListener('click', closeModal); }
document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeModal(); });

/* ═══ Adaptador: normaliza habilidades antiguas (effect) a la nueva estructura (description/attributes) ═══ */
function normalizeAbility(ab) {
  if (ab.description || ab.effect === undefined) return ab;
  // Habilidad antigua con `effect`: la mostramos tal cual como descripción, sin atributos.
  return Object.assign({}, ab, { description: ab.effect, attributes: ab.cost ? ['Coste: ' + ab.cost] : null });
}

/* ═══ Render de descripción con términos clicables ═══ */
function renderAbilityDescription(desc, terms) {
  if (!desc) return '';
  return desc.replace(/\*\*(.+?)\*\*/g, function(m, rawName) {
    var name = rawName.trim();
    var term = null;
    if (terms && terms.length) {
      for (var i = 0; i < terms.length; i++) {
        if (terms[i].name === name) { term = terms[i]; break; }
      }
    }
    if (!term) return '<strong>' + name + '</strong>';
    return '<span class="clickable-term" data-term-key="' + term.key + '"><strong>' + name + '</strong></span>';
  });
}

/* ═══ Popup compartido ═══ */
var _statPopup = null;
function ensureStatPopup() {
  if (_statPopup) return _statPopup;
  _statPopup = document.createElement('div');
  _statPopup.className = 'stat-popup';
  _statPopup.setAttribute('role', 'tooltip');
  document.body.appendChild(_statPopup);
  return _statPopup;
}
function hideStatPopup() {
  if (_statPopup) _statPopup.classList.remove('show');
}
/* ═══ Popup de término: renderiza **negrita** como <strong> ═══ */
function renderTermDefinitionHTML(text) {
  if (!text) return '';
  return String(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function showTermPopup(anchorEl, term) {
  if (!term) return;
  var pop = ensureStatPopup();
  pop.className = 'stat-popup term';
  pop.innerHTML =
    '<div class="sp-head">📖 Término</div>' +
    '<div class="sp-title">' + term.name + '</div>' +
    '<div class="sp-body">' + renderTermDefinitionHTML(term.definition) + '</div>';
  positionStatPopup(pop, anchorEl.getBoundingClientRect());
  pop.classList.add('show');
}
function showAttributesPopup(anchorEl, title, attributes) {
  if (!attributes || !attributes.length) return;
  var pop = ensureStatPopup();
  pop.className = 'stat-popup attributes';
  var listHtml = attributes.map(function(a){ return '<li>' + a + '</li>'; }).join('');
  pop.innerHTML =
    '<div class="sp-head">📊 Atributos · ' + (title || '') + '</div>' +
    '<ul class="sp-attr-list">' + listHtml + '</ul>';
  positionStatPopup(pop, anchorEl.getBoundingClientRect());
  pop.classList.add('show');
}
function positionStatPopup(pop, rect) {
  var w = pop.offsetWidth, h = pop.offsetHeight;
  var left = rect.left;
  var top = rect.bottom + 10;
  if (left + w > window.innerWidth - 12) left = window.innerWidth - w - 12;
  if (left < 12) left = 12;
  if (top + h > window.innerHeight - 12) top = rect.top - h - 10;
  if (top < 12) top = 12;
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
}
// Cierre global
document.addEventListener('click', function(e){
  if (!_statPopup) return;
  if (e.target.closest('.stat-popup')) return;
  if (e.target.closest('.clickable-term')) return;
  if (e.target.closest('.ability-attributes-btn')) return;
  hideStatPopup();
});
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape') hideStatPopup();
});
window.addEventListener('scroll', hideStatPopup, true);
window.addEventListener('resize', hideStatPopup);

/* ═══ Helper común: bloque de información de una habilidad ═══
   Devuelve HTML con:
     - Header (icono + tipo)
     - Nombre
     - Coste (si lo tiene)
     - Descripción (con términos clicables marcados)
     - Atributos (si los tiene)
   Acepta:
     - charId + type ('normal'|'elemental'|'ultimate') → busca en CHARACTERS
     - charId + objeto de habilidad (de CHARACTERS o COMBAT_CHARS)
*/
function buildAbilityInfoHTML(charId, typeOrAbility) {
  var menuChar = CHARACTERS[charId];
  var ab = null;

  if (typeof typeOrAbility === 'string' && menuChar) {
    ab = menuChar.abilities.find(function(a){ return a.type === typeOrAbility; });
  } else if (typeOrAbility && typeof typeOrAbility === 'object') {
    if (typeOrAbility.type && menuChar) {
      var found = menuChar.abilities.find(function(a){ return a.type === typeOrAbility.type; });
      if (found) ab = found;
    }
    if (!ab) ab = typeOrAbility;
  }

  if (!ab) return '';
  ab = normalizeAbility(ab);

  var typeLabel = ABILITY_TYPES[ab.type] || '';
  var icon = ab.icon || ({ normal:'⚔️', elemental:'🔮', ultimate:'💥', passive:'🛡️', ex:'🌟' }[ab.type] || '⚔️');
  var terms = (menuChar && menuChar.terms) || [];

  var html = '';
  html += '<div class="ht-header">' + icon + ' ' + typeLabel + '</div>';
  html += '<div class="ht-name">' + ab.name + '</div>';

  if (ab.cost) {
    var costHtml = renderCost(ab.cost);
    if (costHtml) html += '<div class="ht-cost">' + costHtml + '</div>';
  }

  if (ab.description) {
    html += '<div class="ht-effect ability-desc-with-terms">' + renderAbilityDescription(ab.description, terms) + '</div>';
  } else if (ab.effect) {
    html += '<div class="ht-effect">' + ab.effect + '</div>';
  }

  if (ab.attributes && ab.attributes.length) {
    var list = ab.attributes.map(function(a){ return '<li>' + a + '</li>'; }).join('');
    html += '<div class="ht-attrs">' +
      '<div class="ht-attrs-title">📊 Atributos</div>' +
      '<ul class="ht-attrs-list">' + list + '</ul>' +
    '</div>';
  }

  return html;
}

/* Engancha los listeners de términos clicables dentro de un contenedor
   que contenga HTML generado por buildAbilityInfoHTML. */
function attachAbilityTermListeners(container, charId) {
  if (!container) return;
  var menuChar = CHARACTERS[charId];
  var terms = (menuChar && menuChar.terms) || [];
  if (!terms.length) return;
  container.querySelectorAll('.clickable-term').forEach(function(span){
    span.addEventListener('click', function(e){
      e.stopPropagation();
      var key = span.dataset.termKey;
      var term = null;
      for (var i = 0; i < terms.length; i++) if (terms[i].key === key) { term = terms[i]; break; }
      if (term) showTermPopup(span, term);
    });
  });
}

/* ═══ Sincroniza el title de las tarjetas con la categoría del personaje ═══ */
function syncCardTitles() {
  document.querySelectorAll('.char-card').forEach(function(card){
    var id = card.dataset.character;
    var ch = CHARACTERS[id];
    if (!ch) return;
    if (ch.comingSoon) return;                // deja "Próximamente"
    if (ch.category) card.title = ch.category;
  });
}

/* ═══ Compacta el badge del elemento: pill con emoji + nombre ═══ */
function enhanceCardBadges() {
  document.querySelectorAll('.char-card').forEach(function(card){
    var el = card.dataset.el;
    if (!el) return;
    var emoji = (typeof ELEMENT_EMOJI !== 'undefined' && ELEMENT_EMOJI[el]) || '';
    var name  = (typeof ELEMENT_NAMES !== 'undefined' && ELEMENT_NAMES[el]) || '';
    if (!emoji && !name) return;
    var badge = card.querySelector('.el-badge');
    if (!badge) return;
    badge.innerHTML =
      '<span class="el-badge-emoji">' + emoji + '</span>' +
      '<span class="el-badge-name">' + name + '</span>';
  });
}

/* ═══ Marca como .locked las tarjetas no desbloqueadas ═══ */
function refreshCollectionLocks() {
  if (typeof isUnlocked !== 'function') return;
  document.querySelectorAll('.char-card').forEach(function(card){
    var id = card.dataset.character;
    if (!id) return;
    card.classList.toggle('locked', !isUnlocked(id));
  });
  if (typeof applyFilters === 'function') applyFilters();
}
