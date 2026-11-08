function trySpendDice(dice, cost) {
  var pool = dice.slice(), spent = [], remaining = {};
  Object.keys(cost).forEach(function(k){ remaining[k] = cost[k]; });
  if (remaining.same && remaining.same > 0) {
    var groups = {};
    pool.forEach(function(d, i){ if (d.type !== 'omni') { if (!groups[d.type]) groups[d.type] = []; groups[d.type].push(i); } });
    var omniIdx = pool.map(function(d, i){ return d.type === 'omni' ? i : -1; }).filter(function(i){ return i >= 0; });
    var best = null;
    Object.keys(groups).forEach(function(t){ var c = groups[t].length + omniIdx.length; if (c >= remaining.same) { if (!best || groups[t].length > best.primary.length) best = { primary:groups[t], omni:omniIdx }; } });
    if (omniIdx.length >= remaining.same) { if (!best || omniIdx.length > best.primary.length) best = { primary:[], omni:omniIdx }; }
    if (!best) return { ok:false };
    var used = {}, needed = remaining.same, all = best.primary.concat(best.omni);
    for (var bi = all.length - 1; bi >= 0 && needed > 0; bi--) { if (!used[all[bi]]) { used[all[bi]] = true; needed--; } }
    var np = [];
    for (var pi = 0; pi < pool.length; pi++) { if (used[pi]) spent.push(pool[pi]); else np.push(pool[pi]); }
    pool = np; remaining.same = 0;
  }
  var specific = Object.keys(remaining).filter(function(k){ return k !== 'any' && k !== 'same' && k !== 'energy'; });
  for (var s = 0; s < specific.length; s++) {
    var type = specific[s], need = remaining[type];
    for (var i = pool.length - 1; i >= 0 && need > 0; i--) if (pool[i].type === type) { spent.push(pool.splice(i, 1)[0]); need--; }
    for (var j = pool.length - 1; j >= 0 && need > 0; j--) if (pool[j].type === 'omni') { spent.push(pool.splice(j, 1)[0]); need--; }
    if (need > 0) return { ok:false };
  }
  if (remaining.any && remaining.any > 0) {
    var na = remaining.any;
    for (var k = pool.length - 1; k >= 0 && na > 0; k--) if (pool[k].type !== 'omni') { spent.push(pool.splice(k, 1)[0]); na--; }
    for (var l = pool.length - 1; l >= 0 && na > 0; l--) if (pool[l].type === 'omni') { spent.push(pool.splice(l, 1)[0]); na--; }
    if (na > 0) return { ok:false };
  }
  return { ok:true, spent:spent, remaining:pool };
}
function formatCost(cost, energyCost) {
  var parts = [];
  Object.keys(cost).forEach(function(k){ if (k === 'any') parts.push('🎲 ×' + cost.any); else if (k === 'same') parts.push('🎲 ' + cost.same + ' iguales'); else parts.push(ELEMENT_EMOJI[k] + ' ×' + cost[k]); });
  if (energyCost) parts.push('⚡ ×' + energyCost);
  return parts.join(' · ');
}
function getDiePriority(die, teamEls, targetEl) { if (die.type === 'omni') return 5; var info = teamEls[die.type]; if (!info || (!info.living && !info.dead)) return 1; if (!info.living && info.dead) return 2; if (targetEl && die.type !== targetEl) return 3; return 4; }
function computeTeamElements(side) { var te = {}; side.characters.forEach(function(c){ var el = c.character.element; if (!te[el]) te[el] = { living:false, dead:false }; if (c.dead) te[el].dead = true; else te[el].living = true; }); return te; }
function autoSelectDiceForCost(cost, opts) {
  opts = opts || {}; var side = getActiveSide(); if (!side) return [];
  var selectedIds = [], pool = side.dice.slice();
  var teamEls = computeTeamElements(side), targetEl = opts.targetElement || null;
  if (!targetEl) { var act = side.characters[side.activeIndex]; if (act) targetEl = act.character.element; }
  if (cost.same && cost.same > 0) {
    var cnts = {}, omniC = 0;
    pool.forEach(function(d){ if (d.type === 'omni') omniC++; else cnts[d.type] = (cnts[d.type] || 0) + 1; });
    var best = null;
    Object.keys(cnts).forEach(function(t){ var tot = cnts[t] + omniC; if (tot >= cost.same) { if (!best || cnts[t] > cnts[best]) best = t; } });
    if (!best && omniC >= cost.same) best = 'omni';
    if (!best) return [];
    var need = cost.same, np = [];
    for (var i = 0; i < pool.length; i++) { if (need > 0 && pool[i].type === best) { selectedIds.push(pool[i].id); need--; } else np.push(pool[i]); }
    if (best !== 'omni') { for (var j = 0; j < np.length && need > 0; j++) { if (np[j].type === 'omni') { selectedIds.push(np[j].id); need--; np.splice(j, 1); j--; } } }
    pool = np;
  }
  Object.keys(cost).forEach(function(type){ if (type === 'any' || type === 'same' || type === 'energy') return; var need = cost[type], np = []; for (var i = 0; i < pool.length; i++) { if (need > 0 && pool[i].type === type) { selectedIds.push(pool[i].id); need--; } else np.push(pool[i]); } pool = np; np = []; for (var j = 0; j < pool.length; j++) { if (need > 0 && pool[j].type === 'omni') { selectedIds.push(pool[j].id); need--; } else np.push(pool[j]); } pool = np; });
  var na = cost.any || 0;
  while (na > 0 && pool.length > 0) { var bi = 0, bp = getDiePriority(pool[0], teamEls, targetEl); for (var k = 1; k < pool.length; k++) { var p = getDiePriority(pool[k], teamEls, targetEl); if (p < bp) { bp = p; bi = k; } } selectedIds.push(pool[bi].id); pool.splice(bi, 1); na--; }
  return selectedIds;
}
function sortDiceForDisplay(dice, side) {
  if (!dice) return [];
  if (!side || !side.characters || !side.characters.length) return dice.slice();
  var active = side.characters[side.activeIndex], activeEl = active && !active.dead ? active.character.element : null;
  var teamEls = [];
  side.characters.forEach(function(c){ if (!c || c.dead) return; var el = c.character.element; if (el !== activeEl && teamEls.indexOf(el) === -1) teamEls.push(el); });
  var tc = {}; dice.forEach(function(d){ tc[d.type] = (tc[d.type] || 0) + 1; });
  var cache = {};
  function getKey(type) {
    if (cache[type]) return cache[type];
    var key;
    if (type === 'omni') key = [0, 0, 0];
    else if (type === activeEl) key = [1, 0, 0];
    else if (teamEls.indexOf(type) !== -1) { var di = CONSONANCE_ORDER.indexOf(type); if (di === -1) di = 99; key = [2, 0, di]; }
    else { var c = tc[type] || 0; var d2 = CONSONANCE_ORDER.indexOf(type); if (d2 === -1) d2 = 99; key = [3, -c, d2]; }
    cache[type] = key; return key;
  }
  return dice.slice().sort(function(a, b){ var ka = getKey(a.type), kb = getKey(b.type); for (var i = 0; i < 3; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i]; return 0; });
}

var DICE_ELEMENTS = CONSONANCE_ORDER.slice(), selectedDiceElements = {};
DICE_ELEMENTS.forEach(function(k){ selectedDiceElements[k] = true; });
var diceCount = 3, isRolling = false;
function renderDiceSimulator() {
  var elC = document.getElementById('simElements');
  if (elC) {
    var html = '';
    DICE_ELEMENTS.forEach(function(key){ var p = PHILOSOPHIES[key]; html += '<button class="sim-el-toggle' + (selectedDiceElements[key] ? ' active' : '') + '" data-el="' + key + '" style="--ec: ' + ELEMENT_COLORS[key] + ';">' + p.emoji + ' ' + p.name + '</button>'; });
    elC.innerHTML = html;
    elC.querySelectorAll('.sim-el-toggle').forEach(function(btn){ btn.addEventListener('click', function(){ var el = btn.dataset.el; var c = 0; Object.keys(selectedDiceElements).forEach(function(k){ if (selectedDiceElements[k]) c++; }); if (selectedDiceElements[el]) { if (c > 1) selectedDiceElements[el] = false; } else selectedDiceElements[el] = true; renderDiceSimulator(); }); });
  }
  var cC = document.getElementById('simCount');
  if (cC) {
    var h = ''; for (var n = 1; n <= 8; n++) h += '<button class="sim-count-btn' + (n === diceCount ? ' active' : '') + '" data-n="' + n + '">' + n + '</button>';
    cC.innerHTML = h;
    cC.querySelectorAll('.sim-count-btn').forEach(function(btn){ btn.addEventListener('click', function(){ diceCount = parseInt(btn.dataset.n, 10); renderDiceSimulator(); }); });
  }
}
function rollDiceSim() {
  if (isRolling) return; isRolling = true;
  var btn = document.getElementById('simRoll'), res = document.getElementById('simResult'), sum = document.getElementById('simSummary');
  if (!res || !sum) { isRolling = false; return; }
  if (btn) btn.disabled = true; sum.innerHTML = '';
  var rh = ''; for (var i = 0; i < diceCount; i++) rh += '<div class="sim-die rolling">🎲</div>';
  res.innerHTML = rh;
  setTimeout(function(){
    var els = Object.keys(selectedDiceElements).filter(function(k){ return selectedDiceElements[k]; });
    var dice = []; for (var i = 0; i < diceCount; i++) { if (Math.random() < 0.08) dice.push({ type:'omni' }); else dice.push({ type:els[Math.floor(Math.random() * els.length)] }); }
    var dh = ''; dice.forEach(function(d){ if (d.type === 'omni') dh += '<div class="sim-die omnidie">✨</div>'; else dh += '<div class="sim-die" style="--dc: ' + ELEMENT_COLORS[d.type] + ';">' + ELEMENT_EMOJI[d.type] + '</div>'; });
    res.innerHTML = dh;
    var cnt = {}, omniC = 0; dice.forEach(function(d){ if (d.type === 'omni') omniC++; else cnt[d.type] = (cnt[d.type] || 0) + 1; });
    var sh = ''; Object.keys(cnt).forEach(function(el){ sh += '<span class="sim-summary-item" style="--sc: ' + ELEMENT_COLORS[el] + ';">' + ELEMENT_EMOJI[el] + ' <b>×' + cnt[el] + '</b></span>'; });
    if (omniC > 0) sh += '<span class="sim-summary-item" style="--sc: 240, 200, 96;">✨ <b>×' + omniC + '</b></span>';
    sum.innerHTML = sh; if (btn) btn.disabled = false; isRolling = false;
  }, 700);
}
var simRollBtn = document.getElementById('simRoll'); if (simRollBtn) simRollBtn.addEventListener('click', rollDiceSim);

var hoverTooltip = document.getElementById('hoverTooltip');
function positionTooltip(tt, rect, prefer) {
  var w = tt.offsetWidth, h = tt.offsetHeight, left, top;
  if (prefer === 'left') { left = rect.left - w - 12; top = rect.top + rect.height/2 - h/2; if (left < 12) left = rect.right + 12; }
  else if (prefer === 'above') { left = rect.left + rect.width/2 - w/2; top = rect.top - h - 12; if (top < 12) top = rect.bottom + 12; }
  else { left = rect.left; top = rect.bottom + 12; }
  left = Math.max(12, Math.min(left, window.innerWidth - w - 12)); top = Math.max(12, Math.min(top, window.innerHeight - h - 12));
  tt.style.left = left + 'px'; tt.style.top = top + 'px';
}
function showStatusTooltip(anchor, key, data) {
  var d = STATUS_DESCRIPTIONS[key]; if (!d) return;
  var extra = '';
  if (data && data.value !== null && data.value !== undefined) {
    if (key === 'condena') extra = '<div class="ht-sub">Puntos actuales: <b>' + data.value + '</b></div>';
    if (key === 'manuelStacks') extra = '<div class="ht-sub">Stacks actuales: <b>' + data.value + '</b></div>';
    if (key === 'obraMaestra') extra = '<div class="ht-sub">Rondas restantes: <b>' + data.value + '</b></div>';
    if (key === 'rencor') extra = '<div class="ht-sub">Acumulaciones: <b>' + data.value + '</b></div>';
  }
  hoverTooltip.innerHTML = '<div class="ht-header">' + d.name + '</div>' + extra + '<div class="ht-effect">' + d.text + '</div>';
  hoverTooltip.classList.add('show'); positionTooltip(hoverTooltip, anchor.getBoundingClientRect(), 'above');
}
function getFullAbilityText(charId, type){ var char = CHARACTERS[charId]; if (!char) return null; for (var i = 0; i < char.abilities.length; i++) if (char.abilities[i].type === type) return char.abilities[i]; return null; }
function showAbilityTooltip(btn, type) {
  if (!combatState || combatState.phase !== 'playing') return;
  var side = getActiveSide(); if (!side) return;
  var active = side.characters[side.activeIndex]; if (!active) return;

  var html = buildAbilityInfoHTML(active.id, type);
  hoverTooltip.innerHTML = html;
  hoverTooltip.classList.add('show');
  cancelHideTooltip();

  // ✅ Si contiene términos clicables, activar modo interactivo
  if (html.indexOf('clickable-term') !== -1) {
    hoverTooltip.classList.add('interactive');
    attachAbilityTermListeners(hoverTooltip, active.id);
  } else {
    hoverTooltip.classList.remove('interactive');
  }

  positionTooltip(hoverTooltip, btn.getBoundingClientRect(), 'left');
}
function showCharTooltip(card, cs) {
  if (!cs) return;
  var cd = CHARACTERS[cs.id]; if (!cd) return;
  var vis = ['normal','elemental','ultimate'], col = ELEMENT_COLORS[cd.element];
  var html = '<div class="ht-header" style="color: rgb(' + col + ');">' + ELEMENT_EMOJI[cd.element] + ' ' + ELEMENT_NAMES[cd.element] + '</div>';
  html += '<div class="ht-name" style="background: linear-gradient(90deg, #fff, rgb(' + col + ')); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">' + cd.name + '</div>';
  html += '<div class="ht-sub">' + (cd.category || cd.set) + ' · ' + cs.hp + '/' + cs.maxHp + ' HP · 🛡️ ' + totalShield(cs) + '</div>';
  cd.abilities.forEach(function(ab){
    if (vis.indexOf(ab.type) === -1) return;
    var icon = ab.type === 'normal' ? '⚔️' : (ab.type === 'elemental' ? '🔮' : '💥');
    var name = ab.type === 'normal' ? 'Ataque Normal' : (ab.type === 'elemental' ? 'Habilidad Elemental' : 'Habilidad Definitiva');
    var brd = ab.type === 'ultimate' ? 'rgba(240,200,96,0.9)' : 'rgba(' + col + ', 0.6)';
    html += '<div class="ht-ab-item" style="border-left-color: ' + brd + ';"><div class="ht-ab-type" style="color: rgb(' + col + ');">' + icon + ' ' + name + '</div><div class="ht-ab-name">' + ab.name + '</div>';

    // ✅ Coste: preferir ab.cost (personajes no migrados); si no, extraerlo de ab.attributes (migrados)
    var costToRender = ab.cost;
    if (!costToRender && ab.attributes && ab.attributes.length) {
      for (var ai = 0; ai < ab.attributes.length; ai++) {
        if (/^\s*Coste\s*:/i.test(ab.attributes[ai])) { costToRender = ab.attributes[ai]; break; }
      }
    }
    if (costToRender) {
      var costHtml = renderCost(costToRender);
      if (costHtml) html += '<div class="ht-cost">' + costHtml + '</div>';
    }

    html += '</div>';
  });
  hoverTooltip.innerHTML = html;
  hoverTooltip.classList.add('show');
  positionTooltip(hoverTooltip, card.getBoundingClientRect(), 'above');
}
function showEquipmentTooltip(anchor, cs) {
  if (!cs) return;
  var has = (cs.equipment && cs.equipment.length) || cs.paintEquipped;
  if (!has) return;
  var html = '<div class="ht-header">⚔️ Equipamiento</div><div class="ht-name">' + cs.character.name + '</div>';
  (cs.equipment || []).forEach(function(eqId){ var eq = CARD_DB[eqId]; if (!eq) return; html += '<div class="ht-ab-item" style="border-left-color: rgb(' + eq.color + ');"><div class="ht-ab-type" style="color: rgb(' + eq.color + ');">' + eq.emoji + ' ' + eq.tag + '</div><div class="ht-ab-name">' + eq.name + '</div><div class="ht-effect" style="font-size:0.75rem;">' + eq.effectText + '</div></div>'; });
  if (cs.paintEquipped) { var p = PAINT_CARDS['paint_' + cs.paintEquipped]; if (p) html += '<div class="ht-ab-item" style="border-left-color: rgb(' + p.color + ');"><div class="ht-ab-type" style="color: rgb(' + p.color + ');">🎨 Pintura</div><div class="ht-ab-name">' + p.name + '</div><div class="ht-effect" style="font-size:0.75rem;">' + p.effectText + '</div></div>'; }
  hoverTooltip.innerHTML = html; hoverTooltip.classList.add('show'); positionTooltip(hoverTooltip, anchor.getBoundingClientRect(), 'above');
}
function showSupportTooltip(anchor, sup) {
  if (!sup) return;
  var card = CARD_DB[sup.cardId]; if (!card) return;
  hoverTooltip.innerHTML = '<div class="ht-header">📜 Carta de Apoyo</div><div class="ht-name">' + card.emoji + ' ' + card.name + '</div><div class="ht-sub">' + card.tag + ' · ' + sup.duration + ' ronda(s)</div><div class="ht-effect">' + card.effectText + '</div>';
  hoverTooltip.classList.add('show'); positionTooltip(hoverTooltip, anchor.getBoundingClientRect(), 'left');
}
function showStructureTooltip(anchor, st) {
  if (!st) return;
  var html = '<div class="ht-header">🏛️ Estructura</div>';
  if (st.kind === 'optimizacion') {
    html += '<div class="ht-name">🧠 Optimización</div><div class="ht-sub">' + st.duration + ' ronda(s) · de Óliver</div><div class="ht-effect">+2 daño a ataques normales y elementales de los aliados. Inflige 1 de daño al enemigo al final de la ronda y lo marca con comprensión.</div>';
  } else if (st.kind === 'cruzMadera') {
    html += '<div class="ht-name">✝️ Cruz de Madera</div><div class="ht-sub">Estructura de Orath</div><div class="ht-effect">Causa 1 punto de daño al enemigo activo al ser destruida. Al final de la ronda, si Orath está activa, marca al enemigo activo con redención y se destruye.</div>';
  } else if (st.kind === 'cruzSangre') {
    html += '<div class="ht-name">✝️ Cruz de Sangre</div><div class="ht-sub">Estructura de Orath</div><div class="ht-effect">Se destruye si un aliado muere. Al destruirse, revive al último aliado caído con 1 HP y 2 de escudo.</div>';
  } else if (st.kind === 'mesaDJ') {
  html += '<div class="ht-name">🎧 Mesa de DJ</div><div class="ht-sub">' + st.duration + ' ronda(s) · Estructura de Neón</div><div class="ht-effect">Al final de la ronda, el aliado activo del equipo pasa al siguiente.</div>';
  } else if (st.kind === 'android') {
  html += '<div class="ht-name">🤖 Android</div><div class="ht-sub">' + st.duration + ' ronda(s) · Estructura de Google</div><div class="ht-effect">Al final de cada ronda, inflige 1 punto de daño al enemigo activo.</div>';
  } else if (st.kind === 'metaQuest') {
  html += '<div class="ht-name">📘 Meta Quest</div><div class="ht-sub">' + st.duration + ' ronda(s) · Estructura de Facebook</div><div class="ht-effect">Cura 1 punto de vida al aliado activo cada vez que dicho aliado use su ataque normal.</div>';
  }
  hoverTooltip.innerHTML = html;
  hoverTooltip.classList.add('show');
  positionTooltip(hoverTooltip, anchor.getBoundingClientRect(), 'left');
}
function showShieldTooltip(anchor, cs) {
  if (!cs) return;
  var count = cs.shields ? cs.shields.length : 0;
  var html = '<div class="ht-header">🛡️ Escudos (' + count + '/3)</div><div class="ht-name">' + cs.character.name + '</div>';
  if (!cs.shields || !cs.shields.length) {
    html += '<div class="ht-effect">Sin escudos.</div>';
  } else {
    cs.shields.forEach(function(sh){
      var label = getShieldSourceLabel(sh.source);
      html += '<div class="ht-ab-item" style="border-left-color:#7ac8ff;"><div class="ht-ab-name">🛡️ ' + sh.hp + ' / ' + sh.maxHp + '</div><div class="ht-effect" style="font-size:0.72rem;">Fuente: ' + label + '</div></div>';
    });
    if (cs.shields.length >= 3) {
      html += '<div class="ht-sub" style="margin-top:0.4rem; font-size:0.7rem; color:var(--accent);">Máximo alcanzado — el siguiente escudo elimina el de menor vida.</div>';
    }
  }
  hoverTooltip.innerHTML = html;
  hoverTooltip.classList.add('show');
  positionTooltip(hoverTooltip, anchor.getBoundingClientRect(), 'above');
}
/* ═══ Tooltip interactivo: delay al salir + persistencia dentro del tooltip ═══ */
var _tooltipHideTimer = null;

function cancelHideTooltip() {
  if (_tooltipHideTimer) { clearTimeout(_tooltipHideTimer); _tooltipHideTimer = null; }
}

function scheduleHideTooltip(delay) {
  cancelHideTooltip();
  _tooltipHideTimer = setTimeout(function(){
    if (hoverTooltip) {
      hoverTooltip.classList.remove('show');
      hoverTooltip.classList.remove('interactive');
    }
    _tooltipHideTimer = null;
  }, delay || 200);
}

function hideTooltip() {
  cancelHideTooltip();
  if (hoverTooltip) {
    hoverTooltip.classList.remove('show');
    hoverTooltip.classList.remove('interactive');   // ✅ recupera pointer-events: none
  }
}

/* Listeners del propio tooltip (una sola vez al cargar):
   - mouseenter → cancela el hide programado
   - mouseleave → programa el hide (por si el usuario sale fuera y no vuelve al botón) */
if (hoverTooltip) {
  hoverTooltip.addEventListener('mouseenter', function(){ cancelHideTooltip(); });
  hoverTooltip.addEventListener('mouseleave', function(){ scheduleHideTooltip(200); });
}
