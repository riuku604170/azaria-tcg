var team = [];
try { var stored = localStorage.getItem('azaria_team'); if (stored) { var parsed = JSON.parse(stored); if (Array.isArray(parsed)) team = parsed.filter(function(id){ return CHARACTERS[id]; }).slice(0, 3); } } catch (err) { team = []; }
function saveTeam(){
  try {
    localStorage.setItem('azaria_team', JSON.stringify(team));
    var check = localStorage.getItem('azaria_team');
    if (!check) { console.warn('[saveTeam] setItem no persistió'); return false; }
    return true;
  } catch (err) {
    console.error('[saveTeam] Error:', err);
    return false;
  }
}
function toggleTeam(id) {
  if (!CHARACTERS[id]) return;
  if (!COMBAT_CHARS[id]) return;
  if (id === 'hunger') return;
  if (id === 'exmaria') return;
  initAudio();
  var idx = team.indexOf(id);
  if (idx >= 0) { team.splice(idx, 1); playSound('deselect'); }
  else { if (team.length >= 3) team.shift(); team.push(id); playSound('select'); }
  saveTeam(); renderTeamPanel();
}
function autoBuildTeam(){
  initAudio();
  var pool = shuffleArray(Object.keys(CHARACTERS).filter(function(id){
    if (id === 'hunger' || id === 'exmaria') return false;
    if (typeof isUnlocked === 'function' && !isUnlocked(id)) return false;
    return true;
  }));
  if (pool.length < 3) {
    showTeamMissingToast('No hay suficientes personajes desbloqueados (tienes ' + pool.length + ', necesitas 3).');
    playSound('error');
    return;
  }
  team = pool.slice(0, 3);
  saveTeam(); renderTeamPanel(); playSound('confirm');
}
function computeTeam() {
  if (team.length < 3) return null;
  var counts = {};
  team.forEach(function(id){ var el = CHARACTERS[id].element; counts[el] = (counts[el] || 0) + 1; });
  var maxCount = 0; Object.keys(counts).forEach(function(k){ if (counts[k] > maxCount) maxCount = counts[k]; });
  var maxEls = Object.keys(counts).filter(function(el){ return counts[el] === maxCount; });
  var consonance;
  if (maxCount === 3) { var el3 = maxEls[0]; consonance = { type:'single', element:el3, level:3, name:PHILOSOPHIES[el3].name, sub:PHILOSOPHIES[el3].emoji + ' 3 personajes', effect:PHILOSOPHIES[el3].consonance3 }; }
  else if (maxCount === 2) { var el2 = maxEls[0]; consonance = { type:'single', element:el2, level:2, name:PHILOSOPHIES[el2].name, sub:PHILOSOPHIES[el2].emoji + ' 2 personajes', effect:PHILOSOPHIES[el2].consonance2 }; }
  else { consonance = { type:'diverse', name:'Diverso', sub:'🌈 Composición mixta', effect:'Al comienzo de cada ronda, obtienes 2 omnidados.' }; }
  var resonances = [];
  for (var i = 0; i < team.length; i++) for (var j = i + 1; j < team.length; j++) {
    var elA = CHARACTERS[team[i]].element, elB = CHARACTERS[team[j]].element, res = null;
    for (var k = 0; k < RESONANCES.length; k++) { var r = RESONANCES[k]; if ((r.a === elA && r.b === elB) || (r.a === elB && r.b === elA)) { res = r; break; } }
    if (res) resonances.push({ charA:CHARACTERS[team[i]].name, charB:CHARACTERS[team[j]].name, elA:elA, elB:elB, name:res.name, effect:res.effect });
  }
  return { consonance:consonance, resonances:resonances };
}
function renderTeamPanel() {
  var slotsEl = document.getElementById('teamSlots'); if (!slotsEl) return;
  var html = '';
  for (var i = 0; i < 3; i++) {
    var id = team[i];
    if (id && CHARACTERS[id]) { var char = CHARACTERS[id]; var el = char.element; html += '<div class="team-slot filled" style="--el: ' + ELEMENT_COLORS[el] + ';"><div class="team-slot-img">' + char.emoji + '</div><div class="team-slot-info"><div class="team-slot-name">' + char.name + '</div><div class="team-slot-element">' + ELEMENT_EMOJI[el] + ' ' + ELEMENT_NAMES[el] + '</div></div><button class="team-slot-remove" data-id="' + id + '" aria-label="Quitar">✕</button></div>'; }
    else html += '<div class="team-slot-empty">Slot ' + (i + 1) + ' vacío — haz clic en una carta</div>';
  }
  slotsEl.innerHTML = html;
  slotsEl.querySelectorAll('.team-slot-remove').forEach(function(btn){ btn.addEventListener('click', function(){ toggleTeam(btn.dataset.id); }); });
  var data = computeTeam();
  var consEl = document.getElementById('teamConsonance'); var resEl = document.getElementById('teamResonances');
  if (!data) {
    if (consEl) consEl.innerHTML = '<div class="team-section"><div class="team-section-title">🔮 Consonancia</div><p class="team-section-empty">Selecciona 3 personajes para ver la consonancia activa.</p></div>';
    if (resEl) resEl.innerHTML = '';
  } else {
    var c = data.consonance; var color = c.type === 'single' ? ELEMENT_COLORS[c.element] : '240, 200, 96';
    if (consEl) consEl.innerHTML = '<div class="team-section"><div class="team-section-title">🔮 Consonancia activa</div><div class="team-consonance-card" style="--el: ' + color + ';"><div class="team-consonance-sub">' + c.sub + '</div><div class="team-consonance-name">' + c.name + '</div><div class="team-consonance-effect">' + c.effect + '</div></div></div>';
    var resHtml = '<div class="team-section"><div class="team-section-title">💥 Resonancias disponibles (' + data.resonances.length + ')</div>';
    data.resonances.forEach(function(r){ resHtml += '<div class="team-res-item" style="--ca: ' + ELEMENT_COLORS[r.elA] + '; --cb: ' + ELEMENT_COLORS[r.elB] + ';"><div class="team-res-pair">' + r.charA + ' + ' + r.charB + '</div><div class="team-res-name">' + ELEMENT_EMOJI[r.elA] + ' + ' + ELEMENT_EMOJI[r.elB] + ' — ' + r.name + '</div><div class="team-res-effect">' + r.effect + '</div></div>'; });
    resHtml += '</div>';
    if (resEl) resEl.innerHTML = resHtml;
  }
  var tt = document.getElementById('teamToggleText'); if (tt) tt.textContent = 'Equipo (' + team.length + '/3)';
  var cards = document.querySelectorAll('.char-card');
  for (var ci = 0; ci < cards.length; ci++) cards[ci].classList.toggle('in-team', team.indexOf(cards[ci].dataset.character) !== -1);
  // ✅ Reordenar para que los del equipo suban arriba
  try { sortCharCards(); } catch (e) {}
}
function openTeamPanel(){ var p = document.getElementById('teamPanel'), t = document.getElementById('teamPanelToggle'); if (p) p.classList.add('open'); if (t) t.classList.add('hidden'); document.body.classList.add('team-panel-open'); }
function closeTeamPanel(){ var p = document.getElementById('teamPanel'), t = document.getElementById('teamPanelToggle'); if (p) p.classList.remove('open'); if (t) t.classList.remove('hidden'); document.body.classList.remove('team-panel-open'); }
var tpc = document.getElementById('teamPanelClose'); if (tpc) tpc.addEventListener('click', closeTeamPanel);
var tpt = document.getElementById('teamPanelToggle'); if (tpt) tpt.addEventListener('click', openTeamPanel);
var tcb = document.getElementById('teamClearBtn'); if (tcb) tcb.addEventListener('click', function(){ team = []; saveTeam(); renderTeamPanel(); });
var teamAutoBtn = document.getElementById('teamAutoBtn'); if (teamAutoBtn) teamAutoBtn.addEventListener('click', autoBuildTeam);

function setupCardClicks() {
  var cards = document.querySelectorAll('.char-card');
  for (var i = 0; i < cards.length; i++) (function(card){
    card.addEventListener('click', function(e){
      if (e.target.closest && e.target.closest('.card-info-btn')) return;
      toggleTeam(card.dataset.character);
    });
  })(cards[i]);
}
var searchEl = document.getElementById('charSearch'); if (searchEl) searchEl.addEventListener('input', applyFilters);

var deck = [];
try { var storedDeck = localStorage.getItem('azaria_deck'); if (storedDeck) { var parsedDeck = JSON.parse(storedDeck); if (Array.isArray(parsedDeck)) { var cnts = {}; deck = parsedDeck.filter(function(id){ if (!CARD_DB[id]) return false; cnts[id] = (cnts[id]||0) + 1; return cnts[id] <= 2; }).slice(0, 30); } } } catch (err) { deck = []; }
function saveDeck(){
  try {
    localStorage.setItem('azaria_deck', JSON.stringify(deck));
    var check = localStorage.getItem('azaria_deck');
    if (!check) { console.warn('[saveDeck] setItem no persistió'); return false; }
    return true;
  } catch (err) {
    console.error('[saveDeck] Error:', err);
    return false;
  }
}
function deckCardCount(id){ return deck.filter(function(c){ return c === id; }).length; }
function addDeckCard(id) { if (!CARD_DB[id]) return; initAudio(); if (deck.length >= 30 || deckCardCount(id) >= 2) { playSound('error'); return; } deck.push(id); playSound('select'); saveDeck(); renderDeckGrid(); }
function removeDeckCard(id) {
  if (!CARD_DB[id]) return;
  initAudio();
  var i = deck.indexOf(id);
  if (i < 0) return;
  deck.splice(i, 1);
  playSound('deselect');
  saveDeck();
  try {
    renderDeckGrid();
  } catch (e) {
    console.error('removeDeckCard: error al renderizar:', e);
    // Fuerza un re-render limpio del contenedor
    var grid = document.getElementById('deckGrid');
    if (grid) grid.innerHTML = '';
  }
  // Sincroniza el contador por si el render falló
  var dc = document.getElementById('deckCount'); if (dc) dc.textContent = deck.length;
  var dce = document.getElementById('deckCounter'); if (dce) dce.classList.toggle('complete', deck.length === 30);
}
function formatCardCost(card) {
  if (!card.cost || Object.keys(card.cost).length === 0) return 'Sin coste';
  var parts = [];
  if (card.cost.any) parts.push('x' + card.cost.any + ' cualquiera' + (card.cost.any > 1 ? 's' : ''));
  if (card.cost.same) parts.push('x' + card.cost.same + ' del mismo tipo');
  return parts.join(', ');
}
function renderCardFilter() {
  var bar = document.getElementById('deckFilterBar'); if (!bar) return;
  var noCat = setSize(deckCatFilterSet) === 0, noTag = setSize(deckTagFilterSet) === 0;
  var html = '<div class="filter-row">';
  html += '<button class="cat-filter-btn' + (noCat ? ' active' : '') + '" data-cat="all" style="--fc: 240, 200, 96;">📚 Todas</button>';
  html += '<button class="cat-filter-btn' + (deckCatFilterSet.equipo ? ' active' : '') + '" data-cat="equipo" style="--fc: 200, 45, 60;">⚔️ Equipo</button>';
  html += '<button class="cat-filter-btn' + (deckCatFilterSet.apoyo ? ' active' : '') + '" data-cat="apoyo" style="--fc: 130, 220, 140;">📜 Apoyo</button>';
  html += '<button class="cat-filter-btn' + (deckCatFilterSet.evento ? ' active' : '') + '" data-cat="evento" style="--fc: 165, 131, 255;">✨ Evento</button>';
  html += '</div><div class="filter-row">';
  html += '<button class="filter-btn' + (noTag ? ' active' : '') + '" data-cfilter="all" style="--fc: 240, 200, 96;">Todas</button>';
  CARD_FILTER_ALL_TAGS.forEach(function(tag){ var color = CARD_TAG_COLORS[tag] || '165, 131, 255'; html += '<button class="filter-btn' + (deckTagFilterSet[tag] ? ' active' : '') + '" data-cfilter="' + tag + '" style="--fc: ' + color + ';">' + tag + '</button>'; });
  html += '</div>';
  bar.innerHTML = html;
  bar.querySelectorAll('.cat-filter-btn').forEach(function(btn){ btn.addEventListener('click', function(){ var v = btn.dataset.cat; if (v === 'all') deckCatFilterSet = {}; else toggleFilterKey(deckCatFilterSet, v); renderCardFilter(); renderDeckGrid(); }); });
  bar.querySelectorAll('.filter-btn').forEach(function(btn){ btn.addEventListener('click', function(){ var v = btn.dataset.cfilter; if (v === 'all') deckTagFilterSet = {}; else toggleFilterKey(deckTagFilterSet, v); renderCardFilter(); renderDeckGrid(); }); });
}
function renderDeckGrid() {
  var grid = document.getElementById('deckGrid'); if (!grid) return;
  var dc = document.getElementById('deckCount'), dce = document.getElementById('deckCounter');
  if (dc) dc.textContent = deck.length;
  if (dce) dce.classList.toggle('complete', deck.length === 30);
  var isFull = deck.length >= 30;
  var noCat = setSize(deckCatFilterSet) === 0, noTag = setSize(deckTagFilterSet) === 0;
  var ids = CARD_ORDER.filter(function(id){
    var c = CARD_DB[id];
    if (typeof isUnlocked === 'function' && !isUnlocked(id)) return false;
    return (noCat || !!deckCatFilterSet[c.category]) && (noTag || !!deckTagFilterSet[c.tag]);
  });
  if (!ids.length) { grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--muted); font-style: italic;">No hay cartas con este filtro.</div>'; return; }
  grid.innerHTML = ids.map(function(id){
    var card = CARD_DB[id], count = deckCardCount(id), isMaxed = count >= 2, isBlocked = isFull && count === 0;
    var cls = 'deck-card'; if (count > 0) cls += ' in-deck'; if (isMaxed) cls += ' maxed'; if (isBlocked) cls += ' blocked';
    var countBadge = count > 0 ? '<div class="deck-card-count">' + count + '/2</div>' : '';
    var removeBtn = count > 0 ? '<button class="deck-card-remove" data-remove-id="' + id + '" title="Quitar una copia" aria-label="Quitar una copia">✕</button>' : '';
    var catIcon = card.category === 'equipo' ? '⚔️ ' : card.category === 'apoyo' ? '📜 ' : '✨ ';
    return '<div class="' + cls + '" data-card-id="' + id + '" style="--dc: ' + card.color + ';">' +
      '<div class="deck-card-emoji">' + card.emoji + '</div>' +
      '<div class="deck-card-info"><div class="deck-card-name">' + card.name + '</div>' +
      '<div class="deck-card-cost">🎲 ' + formatCardCost(card) + (card.duration ? ' · ⏳ ' + card.duration + ' r' : '') + '</div>' +
      '<div class="deck-card-effect">' + card.effectText + '</div>' +
      '<span class="deck-card-tag">' + catIcon + card.tag + '</span></div>' + countBadge + removeBtn + '</div>';
  }).join('');
  grid.querySelectorAll('.deck-card').forEach(function(el){
    el.addEventListener('click', function(e){
      if (e.target.closest('.deck-card-remove')) return;
      e.preventDefault();
      e.stopPropagation();
      if (el.classList.contains('blocked')) { playSound('error'); return; }
      addDeckCard(el.dataset.cardId);
    });
  });
  grid.querySelectorAll('.deck-card-remove').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      removeDeckCard(btn.dataset.removeId);
    });
  });
}
function autoBuildDeck() {
  var unlocked = CARD_ORDER.filter(function(id){
    return (typeof isUnlocked !== 'function' || isUnlocked(id));
  });
  var ev = unlocked.filter(function(id){ return CARD_DB[id].category === 'evento'; });
  var eq = unlocked.filter(function(id){ return CARD_DB[id].category === 'equipo'; });
  var ap = unlocked.filter(function(id){ return CARD_DB[id].category === 'apoyo'; });
  var newDeck = [];
  shuffleArray(ev).slice(0, Math.min(14, ev.length)).forEach(function(id){ newDeck.push(id); });
  shuffleArray(eq).slice(0, Math.min(10, eq.length)).forEach(function(id){ newDeck.push(id); });
  shuffleArray(ap).slice(0, Math.min(6, ap.length)).forEach(function(id){ newDeck.push(id); });
  var pool = shuffleArray(newDeck.slice());
  var safety = 0;
  while (newDeck.length < 30 && safety < 200) {
    var p = pool[Math.floor(Math.random() * pool.length)];
    if (newDeck.filter(function(x){ return x === p; }).length < 2) newDeck.push(p);
    safety++;
  }
  if (newDeck.length < 30) {
    showTeamMissingToast('No hay suficientes cartas desbloqueadas (tienes ' + newDeck.length + ', necesitas 30).');
    playSound('error');
    return;
  }
  deck = newDeck.slice(0, 30);
  saveDeck(); renderDeckGrid(); playSound('confirm');
}
var autoBuildBtn = document.getElementById('autoBuildDeckBtn'); if (autoBuildBtn) autoBuildBtn.addEventListener('click', autoBuildDeck);
var deckClearBtn = document.getElementById('deckClearBtn'); if (deckClearBtn) deckClearBtn.addEventListener('click', function(){ deck = []; saveDeck(); renderDeckGrid(); });

var TEMPLATE_SLOT_COUNT = 12;
function getTemplateSlotKey(s){ return 'azaria_template_' + s; }
function getTemplate(s){ try { var st = localStorage.getItem(getTemplateSlotKey(s)); if (!st) return null; var p = JSON.parse(st); if (!p || !Array.isArray(p.team) || !Array.isArray(p.deck)) return null; return p; } catch (e) { return null; } }
function saveTemplate(s, t, d, name) {
  var payload = { team: t, deck: d, name: name || ('Ranura ' + (s + 1)), savedAt: Date.now() };
  try {
    localStorage.setItem(getTemplateSlotKey(s), JSON.stringify(payload));
    var check = localStorage.getItem(getTemplateSlotKey(s));
    if (!check) {
      console.error('[saveTemplate] setItem pareció funcionar pero getItem devuelve null');
      return { ok: false, reason: 'no-persist' };
    }
    return { ok: true };
  } catch (e) {
    console.error('[saveTemplate] Error al guardar:', e);
    if (e && (e.name === 'QuotaExceededError' || e.code === 22)) return { ok: false, reason: 'quota', error: e };
    return { ok: false, reason: 'exception', error: e };
  }
}
function clearTemplate(s){ try { localStorage.removeItem(getTemplateSlotKey(s)); } catch (e) {} }
/* ═══ Valida que una plantilla solo contenga ítems desbloqueados ═══ */
function checkTemplateUnlocked(tpl) {
  var missingChars = [];
  var missingCards = [];
  if (tpl && tpl.team) {
    tpl.team.forEach(function(id){
      if (CHARACTERS[id] && typeof isUnlocked === 'function' && !isUnlocked(id)) missingChars.push(id);
    });
  }
  if (tpl && tpl.deck) {
    tpl.deck.forEach(function(id){
      if (CARD_DB[id] && typeof isUnlocked === 'function' && !isUnlocked(id)) missingCards.push(id);
    });
  }
  return { ok: missingChars.length === 0 && missingCards.length === 0, missingChars: missingChars, missingCards: missingCards };
}
function formatMissingMessage(check) {
  var parts = [];
  if (check.missingChars.length) parts.push(check.missingChars.length + ' personaje(s)');
  if (check.missingCards.length) parts.push(check.missingCards.length + ' carta(s)');
  return parts.join(' y ');
}
function renderTemplateSlots() {
  var c = document.getElementById('templateSlots'); if (!c) return;
  var html = '';
  for (var i = 0; i < TEMPLATE_SLOT_COUNT; i++) {
    var t = getTemplate(i);
    if (t) {
      var validTeam = t.team.filter(function(id){ return CHARACTERS[id] && id !== 'hunger' && id !== 'exmaria'; }).slice(0, 3);
      var tp = validTeam.map(function(id){ var ch = CHARACTERS[id]; return '<span class="template-char" style="--el: ' + ELEMENT_COLORS[ch.element] + ';" title="' + ch.name + '">' + ch.emoji + '</span>'; }).join('');
      if (!validTeam.length) tp = '<span style="color: var(--muted); font-size: 0.8rem;">Equipo vacío</span>';
      var tname = t.name || ('Ranura ' + (i + 1));
      html += '<div class="template-slot filled"><div class="template-slot-header">' + tname + '</div><div class="template-team-preview">' + tp + '</div><div class="template-deck-info">🎴 ' + t.deck.length + '/30 cartas</div><div class="template-actions"><button class="template-info-btn" data-slot="' + i + '" title="Ver info">👁️</button><button class="template-load-btn" data-slot="' + i + '">📂 Cargar</button><button class="template-save-btn" data-slot="' + i + '">💾 Guardar</button><button class="template-delete-btn" data-slot="' + i + '" title="Borrar plantilla">🗑️</button></div></div>';
    } else html += '<div class="template-slot empty"><div class="template-slot-header">Ranura ' + (i + 1) + '</div><div class="template-empty-text">— Vacía —</div><div class="template-actions"><button class="template-save-btn" data-slot="' + i + '">💾 Guardar actual</button></div></div>';   
  }
  c.innerHTML = html;
  c.querySelectorAll('.template-save-btn').forEach(function(btn){ btn.addEventListener('click', function(){
    var s = parseInt(btn.dataset.slot, 10);
    if (team.length !== 3) { showTeamMissingToast('Necesitas <strong>3 personajes</strong> en el equipo.'); return; }
    if (deck.length !== 30) { showTeamMissingToast('Necesitas <strong>30 cartas</strong> en el mazo (tienes ' + deck.length + ').'); return; }
    var existing = getTemplate(s);
    var defaultName = existing ? (existing.name || 'Ranura ' + (s + 1)) : 'Ranura ' + (s + 1);
    var inputName = prompt('Nombre de la plantilla:', defaultName);
    if (inputName === null) return;
    if (existing) { if (!confirm('¿Sobrescribir la plantilla "' + defaultName + '"?')) return; }
    var saveResult = saveTemplate(s, team.slice(), deck.slice(), (inputName || '').trim() || defaultName);
    if (saveResult.ok) {
      renderTemplateSlots();
      playSound('confirm');
    } else {
      showTeamMissingToast('⚠️ Error al guardar la plantilla (<strong>' + saveResult.reason + '</strong>). Puede que el navegador esté bloqueando el almacenamiento.');
      playSound('error');
    }
  }); });
  c.querySelectorAll('.template-load-btn').forEach(function(btn){ btn.addEventListener('click', function(){
    var s = parseInt(btn.dataset.slot, 10);
    var t = getTemplate(s); if (!t) return;
    // ✅ Validar antes de cargar
    var check = checkTemplateUnlocked(t);
    if (!check.ok) {
      showTeamMissingToast('❌ No puedes cargar esta plantilla: falta ' + formatMissingMessage(check) + ' de tu inventario.');
      playSound('error');
      return;
    }
    team = t.team.filter(function(id){ return CHARACTERS[id]; }).slice(0, 3);
    deck = t.deck.filter(function(id){ return CARD_DB[id]; }).slice(0, 30);
    var cnts = {}; deck = deck.filter(function(id){ cnts[id] = (cnts[id]||0) + 1; return cnts[id] <= 2; });
    saveTeam(); saveDeck(); renderTeamPanel(); renderDeckGrid(); playSound('confirm');
    showTeamMissingToast('✅ Plantilla "' + (t.name || ('Ranura ' + (s + 1))) + '" cargada.');
  }); });
  c.querySelectorAll('.template-delete-btn').forEach(function(btn){ btn.addEventListener('click', function(){
    var s = parseInt(btn.dataset.slot, 10);
    var t = getTemplate(s);
    var nm = t && t.name ? t.name : ('la plantilla ' + (s + 1));
    if (!confirm('¿Borrar "' + nm + '"?')) return;
    clearTemplate(s); renderTemplateSlots(); playSound('deselect');
  }); });
}

function showTemplatePreview(template, slot, onConfirm) {
  var validTeam = template.team.filter(function(id){ return CHARACTERS[id] && id !== 'hunger' && id !== 'exmaria'; }).slice(0, 3);
  var validDeck = template.deck.filter(function(id){ return CARD_DB[id]; });
  var ov = document.getElementById('templatePreviewDialog');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'templatePreviewDialog';
    ov.className = 'template-preview-dialog';
    document.body.appendChild(ov);
  }

  var teamHtml = validTeam.map(function(id) {
    var ch = CHARACTERS[id];
    var col = ELEMENT_COLORS[ch.element];
    return '<div class="template-preview-card template-preview-clickable" data-char-id="' + id + '" style="--el: ' + col + ';" title="Ver información de ' + ch.name + '">' +
      '<div class="template-preview-card-portrait" data-fallback="' + ch.emoji + '">' +
        '<img src="' + ch.img + '" alt="' + ch.name + '" onerror="this.style.display=\'none\';" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">' +
      '</div>' +
      '<div class="template-preview-card-name">' + ch.name + '</div>' +
      '<div class="template-preview-card-el">' + ELEMENT_EMOJI[ch.element] + '</div>' +
    '</div>';
  }).join('');

  var deckHtml = validDeck.map(function(id) {
    var c = CARD_DB[id];
    return '<div class="template-preview-deck-card template-preview-clickable" data-card-id="' + id + '" style="--dc: ' + c.color + ';" title="Ver información de ' + c.name + '">' +
      '<div class="template-preview-deck-emoji">' + c.emoji + '</div>' +
      '<div class="template-preview-deck-name">' + c.name + '</div>' +
    '</div>';
  }).join('');

  var html = '<div class="template-preview-content">';
  html += '<div class="template-preview-title">' + (template.name || 'Ranura ' + (slot + 1)) + '</div>';
  html += '<p class="template-preview-sub">' + validDeck.length + ' cartas · ' + validTeam.length + ' personajes</p>';
  html += '<div class="template-preview-team">' + teamHtml + '</div>';
  html += '<div class="template-preview-deck-label">🎴 Mazo (' + validDeck.length + ' cartas) — desliza horizontalmente · clic para ver info</div>';
  html += '<div class="template-preview-deck-scroll">' + deckHtml + '</div>';
  html += '<div class="template-preview-buttons">';
  html += '<button class="confirm-btn confirm-cancel" id="templatePreviewCancel">Cerrar</button>';
  if (onConfirm) html += '<button class="confirm-btn confirm-accept" id="templatePreviewConfirm">✓ Usar esta plantilla</button>';
  html += '</div></div>';
  ov.innerHTML = html;
  ov.classList.add('show');

  // ── Clics sobre personajes ──
  ov.querySelectorAll('[data-char-id]').forEach(function(el){
    el.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      openCharacter(el.dataset.charId);
    });
  });

  // ── Clics sobre cartas ──
  ov.querySelectorAll('[data-card-id]').forEach(function(el){
    el.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      showCardInfo(el.dataset.cardId);
    });
  });

  // ── Cerrar ──
  document.getElementById('templatePreviewCancel').addEventListener('click', function(){
    ov.classList.remove('show');
  });
  if (onConfirm) {
    document.getElementById('templatePreviewConfirm').addEventListener('click', function(){
      ov.classList.remove('show');
      onConfirm();
    });
  }
}

function showTemplatePickerForCombat(playerLabel, onSelect) {
  initAudio();
  var templates = [];
  for (var i = 0; i < TEMPLATE_SLOT_COUNT; i++) {
    var t = getTemplate(i);
    if (t) templates.push({ slot: i, template: t });
  }
  var currentTeamValid = (team.length === 3 && team.every(function(id){ return CHARACTERS[id]; }));
  var currentDeckValid = (deck.length === 30 && deck.every(function(id){ return CARD_DB[id]; }));

  var ov = document.getElementById('templatePickerDialog');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'templatePickerDialog';
    ov.className = 'template-picker-dialog';
    document.body.appendChild(ov);
  }

  var html = '<div class="template-picker-content">';
  html += '<div class="template-picker-title">' + playerLabel + ' — Elige tu plantilla</div>';
  html += '<p class="template-picker-sub">Selecciona una plantilla guardada o usa tu equipo actual</p>';

  if (currentTeamValid && currentDeckValid) {
    var currentTeamHtml = team.map(function(id){
      var ch = CHARACTERS[id];
      return '<div class="template-picker-char" style="--el: ' + ELEMENT_COLORS[ch.element] + ';">' +
        '<div class="template-picker-char-emoji">' + ch.emoji + '</div>' +
        '<div class="template-picker-char-name">' + ch.name + '</div>' +
      '</div>';
    }).join('');
    html += '<div class="template-picker-item current" data-slot="-1">';
    html += '<div class="template-picker-item-name">📋 Equipo y mazo actuales</div>';
    html += '<div class="template-picker-team">' + currentTeamHtml + '</div>';
    html += '<div class="template-picker-deck-info">🎴 ' + deck.length + ' cartas</div>';
    html += '</div>';
  }

  if (templates.length === 0) {
    if (!(currentTeamValid && currentDeckValid)) {
      html += '<div class="template-picker-empty">⚠️ No hay plantillas guardadas y tu equipo/mazo actuales no son válidos.</div>';
    }
  } else {
    html += '<div class="template-picker-grid">';
  templates.forEach(function(t) {
    if (!t.template || !Array.isArray(t.template.team) || !Array.isArray(t.template.deck)) return;
    var validTeam = t.template.team.filter(function(id){ return CHARACTERS[id] && id !== 'hunger' && id !== 'exmaria'; }).slice(0, 3);
    var teamHtml = validTeam.map(function(id){
      var ch = CHARACTERS[id];
      return '<div class="template-picker-char" style="--el: ' + ELEMENT_COLORS[ch.element] + ';">' +
        '<div class="template-picker-char-emoji">' + ch.emoji + '</div>' +
        '<div class="template-picker-char-name">' + ch.name + '</div>' +
      '</div>';
    }).join('');
    html += '<div class="template-picker-item" data-slot="' + t.slot + '">';
    html += '<div class="template-picker-item-name">' + (t.template.name || 'Ranura ' + (t.slot + 1)) + '</div>';
    html += '<div class="template-picker-team">' + teamHtml + '</div>';
    html += '<div class="template-picker-deck-info">🎴 ' + t.template.deck.length + ' cartas</div>';
    html += '</div>';
  });
    html += '</div>';
  }

  html += '<div class="template-picker-buttons">';
  html += '<button class="confirm-btn confirm-cancel" id="templatePickerCancel">Cancelar</button>';
  html += '</div></div>';

  ov.innerHTML = html;
  ov.classList.add('show');
  document.getElementById('templatePickerCancel').addEventListener('click', function(){ ov.classList.remove('show'); });

  ov.querySelectorAll('.template-picker-item').forEach(function(el){
    el.addEventListener('click', function(){
      var slot = parseInt(el.dataset.slot, 10);
      if (slot === -1) {
        // ✅ Validar equipo y mazo actuales
        var cur = { team: team.slice(), deck: deck.slice() };
        var chkCur = checkTemplateUnlocked(cur);
        if (!chkCur.ok) {
          showTeamMissingToast('❌ Tu equipo o mazo actual tiene ' + formatMissingMessage(chkCur) + ' que ya no están en tu inventario.');
          playSound('error');
          return;
        }
        ov.classList.remove('show');
        onSelect(cur);
      } else {
        var t = getTemplate(slot);
        if (!t) return;
        // ✅ Validar plantilla antes de mostrarla/usarla
        var check = checkTemplateUnlocked(t);
        if (!check.ok) {
          showTeamMissingToast('❌ No puedes usar esta plantilla: falta ' + formatMissingMessage(check) + ' de tu inventario.');
          playSound('error');
          return;
        }
        ov.classList.remove('show');
        showTemplatePreview(t, slot, function(){ onSelect(t); });
      }
    });
  });
}

/* ═══ Export / Import de plantillas ═══ */
function exportTemplates() {
  var data = { app: 'azaria-tcg', version: 1, exportedAt: new Date().toISOString(), templates: [] };
  for (var i = 0; i < TEMPLATE_SLOT_COUNT; i++) {
    var t = getTemplate(i);
    if (t) data.templates.push({ slot: i, team: t.team, deck: t.deck, name: t.name, savedAt: t.savedAt });
  }
  if (data.templates.length === 0) {
    showTeamMissingToast('⚠️ No hay plantillas que exportar.');
    playSound('error');
    return;
  }
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'azaria-plantillas-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  showTeamMissingToast('✅ ' + data.templates.length + ' plantilla(s) exportada(s).');
  playSound('confirm');
}
function importTemplatesFromFile(file) {
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function() {
    try {
      var data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.templates)) throw new Error('El archivo no tiene el formato esperado.');
      var imported = 0, failed = 0;
      data.templates.forEach(function(tpl) {
        if (typeof tpl.slot !== 'number' || tpl.slot < 0 || tpl.slot >= TEMPLATE_SLOT_COUNT) { failed++; return; }
        if (!Array.isArray(tpl.team) || !Array.isArray(tpl.deck)) { failed++; return; }
        var r = saveTemplate(tpl.slot, tpl.team, tpl.deck, tpl.name);
        if (r.ok) imported++; else failed++;
      });
      renderTemplateSlots();
      if (imported > 0) {
        showTeamMissingToast('✅ ' + imported + ' plantilla(s) importada(s)' + (failed > 0 ? ' · ⚠️ ' + failed + ' con errores' : '') + '.');
        playSound('confirm');
      } else {
        showTeamMissingToast('⚠️ No se pudo importar ninguna plantilla.');
        playSound('error');
      }
    } catch (e) {
      console.error('[importTemplates] Error:', e);
      showTeamMissingToast('⚠️ Error al leer el archivo: ' + e.message);
      playSound('error');
    }
  };
  reader.onerror = function() {
    showTeamMissingToast('⚠️ Error al leer el archivo.');
    playSound('error');
  };
  reader.readAsText(file);
}
(function wireBackupButtons(){
  var expBtn = document.getElementById('exportTemplatesBtn');
  if (expBtn) expBtn.addEventListener('click', exportTemplates);
  var impBtn = document.getElementById('importTemplatesBtn');
  var impInput = document.getElementById('importTemplatesInput');
  if (impBtn && impInput) {
    impBtn.addEventListener('click', function(){ impInput.value = ''; impInput.click(); });
    impInput.addEventListener('change', function(){ if (impInput.files && impInput.files[0]) importTemplatesFromFile(impInput.files[0]); });
  }
})();

/* ═══ Detección de plantillas con IDs rotos (por si cambiaron nombres/IDs) ═══ */
function checkTemplateIntegrity() {
  var broken = [];
  for (var i = 0; i < TEMPLATE_SLOT_COUNT; i++) {
    var t = getTemplate(i);
    if (!t) continue;
    var missingChars = (t.team || []).filter(function(id){
      return !CHARACTERS[id] && id !== 'hunger' && id !== 'exmaria';
    });
    var missingCards = (t.deck || []).filter(function(id){
      return !CARD_DB[id] && !PAINT_CARDS[id];
    });
    if (missingChars.length > 0 || missingCards.length > 0) {
      broken.push({ slot: i, name: t.name, missingChars: missingChars, missingCards: missingCards });
    }
  }
  if (broken.length > 0) {
    console.warn('[Azaria] Plantillas con IDs que ya no existen en el juego:', broken);
  }
  return broken;
}
