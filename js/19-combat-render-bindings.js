function renderDice() {
  var c = document.getElementById('combatDice'); if (!c) return;
  var side = getActiveSide();
  if (!side) return;
  var dice = side.dice;
  if (!dice.length) c.innerHTML = '<div class="combat-dice-empty">No te quedan dados</div>';
  else {
    c.innerHTML = sortDiceForDisplay(dice, side).map(function(d){ var isOm = d.type === 'omni'; var col = isOm ? '240, 200, 96' : ELEMENT_COLORS[d.type]; var em = isOm ? '✨' : ELEMENT_EMOJI[d.type]; var cls = 'combat-die'; if (d.justAdded) cls += ' just-added'; return '<div class="' + cls + '" style="--dc: ' + col + ';">' + em + '</div>'; }).join('');
    dice.forEach(function(d){ if (d.justAdded) d.justAdded = false; });
  }
  var cnt = document.getElementById('diceCounter'); if (cnt) cnt.textContent = dice.length;
}
function renderHand() {
  var canAct = canHumanControlCurrentTurn();
  var c = document.getElementById('combatHand'); if (!c || !combatState) return;
  var side = getActiveSide();
  if (!side) return;
  var hc = document.getElementById('handCount'); if (hc) hc.textContent = side.hand.length;
  if (!side.hand.length) { c.innerHTML = '<div class="combat-hand-empty">Sin cartas en mano</div>'; return; }
  var canAct = canHumanControlCurrentTurn();
  c.innerHTML = side.hand.map(function(cid){
    if (cid === 'hidden') return '<div class="combat-card disabled" style="--dc: 100,100,100; --cat: 100,100,100; min-height: 56px;"><div class="combat-card-header"><span class="combat-card-emoji">🂠</span><span class="combat-card-name">Carta oculta</span></div></div>';
    var card = CARD_DB[cid] || PAINT_CARDS[cid]; if (!card) return '';
    var disabled = false;
    if (canAct) {
      if (card.oncePerRound && side.cardsUsedThisRound[cid]) disabled = true;
      else if (card.oncePerGame && side.cardsUsedThisGame[cid]) disabled = true;
    } else disabled = true;
    var canPay = canAct && !disabled && canPayCardCost(adjustCardCostForPassives(card, side));
    var meta = CARD_CATEGORY_META[card.category] || CARD_CATEGORY_META.evento;
    return '<div class="combat-card cat-' + card.category + (disabled ? ' disabled' : '') + (canPay ? ' ca-can-pay' : '') + '" data-card-id="' + cid + '" data-category="' + card.category + '" style="--dc: ' + card.color + '; --cat: ' + meta.color + '; position: relative;" title="' + meta.label + ' · ' + card.name + '">' +
      (canPay ? '<span style="position:absolute;top:2px;right:4px;color:#4ec26b;font-weight:900;font-size:0.75rem;text-shadow:0 0 6px rgba(78,194,107,0.8);">✓</span>' : '') +
      '<div class="combat-card-header"><span class="combat-card-emoji">' + card.emoji + '</span><span class="combat-card-name">' + card.name + '</span></div>' +
      '<div class="combat-card-cost">🎲 ' + formatCardCost(card) + (card.duration ? ' · ⏳' + card.duration : '') + '</div>' +
      '<span class="combat-card-cat">' + meta.icon + ' ' + meta.label + '</span></div>';
  }).join('');
  c.querySelectorAll('.combat-card:not(.disabled)').forEach(function(el){ el.addEventListener('click', function(){ playCardRequest(el.dataset.cardId); }); });
}
function renderTeamCards(who) {
  var actualWho = who;
  var isHumanSide = combatState.mode === 'auto' ? false : (combatState.pvp ? true : (actualWho === 'player'));
  if (actualWho === getTurnKey()) hideTooltip();
  var containerId = who === 'player' ? 'playerTeam' : 'botTeam';
  var c = document.getElementById(containerId); if (!c) return;
  var side = combatState[actualWho];
  var isPlayerSide = who === 'player';
  // ✅ BORRAR la segunda línea duplicada:
  // var isHumanSide = combatState.pvp ? true : (actualWho === 'player');
  var isThisSideTurn = combatState.turn === actualWho;
  var sideDone = actualWho === 'player' ? combatState.playerDone : combatState.botDone;
  var canInteract = isHumanSide && isThisSideTurn && !sideDone && combatState.phase === 'playing';
  c.innerHTML = side.characters.map(function(cs, i){
    var isActive = i === side.activeIndex, isDead = cs.dead;
    var col = ELEMENT_COLORS[cs.character.element];
    var clickable = canInteract && !isDead && !isActive;
    var cls = 'combat-char-card';
    if (isActive) cls += ' active'; if (isDead) cls += ' dead';
    if (isPlayerSide) cls += ' player-side'; else cls += ' bot-side';
    if (clickable) cls += ' clickable';
    var ultReady = !isDead && cs.energy >= cs.maxEnergy && cs.maxEnergy > 0;
    var hpPct = (cs.hp / cs.maxHp) * 100;
    if (!cs.equipment) cs.equipment = [];
    var shT = totalShield(cs);
    var html = '<div class="' + cls + '" data-team="' + actualWho + '" data-index="' + i + '" style="--el: ' + col + ';">';
    if (cs.exActive) html += '<span class="ccc-ex-star" title="Este personaje tiene EX activa">🌟</span>';
    html += '<div class="ccc-top"><span class="ccc-el-badge">' + ELEMENT_EMOJI[cs.character.element] + '</span><span class="ccc-top-badge' + (ultReady ? ' ult-ready' : '') + '">⚡ ' + cs.energy + '/' + cs.maxEnergy + '</span></div>';
    html += '<div class="ccc-portrait" data-fallback="' + cs.character.emoji + '"><img src="img/' + cs.id + '.png" alt="' + cs.character.name + '" onerror="this.style.display=\'none\';"></div>';
    html += '<div class="ccc-name">' + cs.character.name + '</div>';
    html += '<div class="ccc-element">' + ELEMENT_NAMES[cs.character.element] + '</div>';
    html += '<div class="ccc-hp-bar"><div class="ccc-hp-fill" style="width:' + hpPct + '%;"></div></div>';
    html += '<div class="ccc-status-row"><span class="ccc-hp-text">❤️ ' + cs.hp + '/' + cs.maxHp + '</span><span class="ccc-shield">' + (shT > 0 ? '🛡️ ' + shT : '') + '</span></div>';
    var badges = [];
    if (cs.states) {
      if (cs.states.castigada) badges.push('<span class="ccc-badge castigada" data-status="castigada">🩸 Castigada</span>');
      if (cs.states.condena) badges.push('<span class="ccc-badge condena" data-status="condena" data-value="' + cs.states.condena + '">💀 Condena ' + cs.states.condena + '</span>');
      if (cs.states.vulnerable) badges.push('<span class="ccc-badge vulnerable" data-status="vulnerable">💔 Vulnerable</span>');
      if (cs.states.amenaza) badges.push('<span class="ccc-badge amenaza" data-status="amenaza">🚨 Amenaza</span>');
      if (cs.states.furia) badges.push('<span class="ccc-badge furia" data-status="furia">🔥 Furia</span>');
      if (cs.states.defensaActiva) badges.push('<span class="ccc-badge defensa" data-status="defensaActiva">💠 Defensa Activa</span>');
      if (cs.states.sintonia) badges.push('<span class="ccc-badge sintonia" data-status="sintonia">🎵 Sintonía</span>');
      if (cs.states.acelerado) badges.push('<span class="ccc-badge acelerado" data-status="acelerado">💨 Acelerado</span>');
      if (cs.states.rencor) badges.push('<span class="ccc-badge" data-status="rencor" data-value="' + cs.states.rencor + '" style="--bc: 200,80,80;">💢 Rencor ' + cs.states.rencor + '</span>');
      if (cs.states.vuelo) badges.push('<span class="ccc-badge vuelo" data-status="vuelo">🦅 Vuelo</span>');
      if (cs.states.carrerilla) badges.push('<span class="ccc-badge carrerilla" data-status="carrerilla">🏃 Carrerilla</span>');
      if (cs.states.invulnerabilidad) badges.push('<span class="ccc-badge" data-status="invulnerabilidad" data-value="' + cs.states.invulnerabilidad + '" style="--bc: 240,200,96;">🛡️ Invuln. ' + cs.states.invulnerabilidad + '</span>');
      if (cs.states.podrida) badges.push('<span class="ccc-badge" data-status="podrida" style="--bc: 200,150,60;" title="Podrida: al final de la ronda, 1 daño al enemigo activo">🦠 Podrida</span>');
      if (cs.states.googleEndDamage) badges.push('<span class="ccc-badge" style="--bc: 100,200,255;" title="Al final de la ronda, 1 daño verdadero">⏳ −1 HP</span>');
      if (cs.nextCardDiscount > 0) badges.push('<span class="ccc-badge" style="--bc: 240,200,96;" title="-1 dado a la siguiente carta jugada">📘 Carta −' + cs.nextCardDiscount + '</span>');
      // ✅ Iris
      if (cs.states.advertido > 0) badges.push('<span class="ccc-badge" data-status="advertido" data-value="' + cs.states.advertido + '" style="--bc: 255,140,60;">⚠️ Advertido ' + cs.states.advertido + '</span>');
      if (cs.states.buenRecaudo) badges.push('<span class="ccc-badge" data-status="buenRecaudo" style="--bc: 100,200,255;">🛡️ Buen Recaudo</span>');
      if (cs.id === 'iris' && cs.states.advertenciaActive) badges.push('<span class="ccc-badge" data-status="advertenciaActive" style="--bc: 140,180,230;">⚔️ Advertencia</span>');
      if (cs.states.visto) badges.push('<span class="ccc-badge" data-status="visto" style="--bc: 130,220,140;">👁️ Visto</span>');
    }
    if (cs.manuelStacks > 0) badges.push('<span class="ccc-badge" data-status="manuelStacks" data-value="' + cs.manuelStacks + '" style="--bc: 200,150,60;">📈 +' + cs.manuelStacks + '</span>');
    if (side.obraMaestraTurns > 0 && isActive) badges.push('<span class="ccc-badge" data-status="obraMaestra" data-value="' + side.obraMaestraTurns + '" style="--bc: 240,200,96;">💥 Obra Maestra (' + side.obraMaestraTurns + ')</span>');
    if (cs.marks) Object.keys(cs.marks).forEach(function(el){ var em = ELEMENT_EMOJI[el] || '🏷️'; var cl = ELEMENT_COLORS[el] || '240,200,96'; badges.push('<span class="ccc-badge mark" data-status="marca" style="--bc: ' + cl + ';">' + em + ' Marca</span>'); });
    // ✅ Alter: marcar a los aliados potenciados por Omnes Deam Salutate
    if (side.alterUltBuff && side.alterUltBuff.amount > 0 && side.alterUltBuff.roundsLeft > 0 && cs.id !== 'alter' && !isDead) {
      badges.push('<span class="ccc-badge alter-buff" title="Omnes Deam Salutate: +' + side.alterUltBuff.amount + ' daño a elementales (' + side.alterUltBuff.roundsLeft + ' ronda(s))">💥 +' + side.alterUltBuff.amount + ' elem. (' + side.alterUltBuff.roundsLeft + ')</span>');
    }
    // ✅ EX-María: contadores internos
    if (cs.id === 'exmaria' && !isDead && cs.states) {
      if (cs.states.delayedDamage > 0) badges.push('<span class="ccc-badge" style="--bc: 200,45,60;" title="Daño diferido al final de la ronda">⏳ −' + cs.states.delayedDamage + ' HP</span>');
      if (cs.states.delayedHealing > 0) badges.push('<span class="ccc-badge" style="--bc: 78,194,107;" title="Curación diferida al final de la ronda">⏳ +' + cs.states.delayedHealing + ' HP</span>');
      if (cs.states.energyPending > 0) badges.push('<span class="ccc-badge" style="--bc: 240,200,96;" title="Energía pendiente al final de la ronda">⏳ +' + cs.states.energyPending + ' E</span>');
      if (cs.states.roceCounter > 0) badges.push('<span class="ccc-badge" style="--bc: 200,80,80;" title="Repeticiones de roce posible esta ronda">🌻 Roce (' + (1 + cs.states.roceCounter) + ' daño)</span>');
    }
    if (badges.length) html += '<div class="ccc-badges">' + badges.join('') + '</div>';
    // ✅ Alter: badge en el propio Alter indicando que su definitiva está activa
    if (side.alterUltBuff && side.alterUltBuff.amount > 0 && side.alterUltBuff.roundsLeft > 0 && cs.id === 'alter' && !isDead) {
      badges.push('<span class="ccc-badge alter-buff" title="Tu definitiva Omnes Deam Salutate está activa">💥 Buff activo (' + side.alterUltBuff.roundsLeft + ')</span>');
    }
    html += '<div class="ccc-equip-row">';
    for (var ei = 0; ei < 2; ei++) { var eqId = cs.equipment[ei]; if (eqId && CARD_DB[eqId]) html += '<div class="ccc-equip-slot filled" title="' + CARD_DB[eqId].name + '">' + CARD_DB[eqId].emoji + '</div>'; else html += '<div class="ccc-equip-slot"></div>'; }
    if (cs.paintEquipped && PAINT_CARDS['paint_' + cs.paintEquipped]) html += '<div class="ccc-equip-slot filled" title="Pintura ' + cs.paintEquipped + '">' + PAINT_CARDS['paint_' + cs.paintEquipped].emoji + '</div>';
    html += '</div></div>';
    return html;
  }).join('');
  if (canInteract) {
    c.querySelectorAll('.combat-char-card.clickable').forEach(function(card){ card.addEventListener('click', function(){ playerChangeCharacterRequest(parseInt(card.dataset.index, 10)); }); });
  }
  c.querySelectorAll('.combat-char-card').forEach(function(card, idx){
    var cs = side.characters[idx];
    if (idx === side.activeIndex && !cs.dead && ((cs.equipment && cs.equipment.length) || cs.paintEquipped)) { var er = card.querySelector('.ccc-equip-row'); if (er) { er.addEventListener('mouseenter', function(){ showEquipmentTooltip(er, cs); }); er.addEventListener('mouseleave', hideTooltip); } }
    var shEl = card.querySelector('.ccc-shield'); if (shEl) { shEl.addEventListener('mouseenter', function(){ showShieldTooltip(shEl, cs); }); shEl.addEventListener('mouseleave', hideTooltip); }
  });
  c.querySelectorAll('.ccc-badge[data-status]').forEach(function(badge){
    badge.addEventListener('mouseenter', function(){
      var k = badge.dataset.status;
      var val = badge.dataset.value ? parseInt(badge.dataset.value, 10) : null;
      showStatusTooltip(badge, k, { value: val });
    });
    badge.addEventListener('mouseleave', hideTooltip);
  });
}
function renderSupports(uiWho) {
  var actualWho = uiWho;
  var gridId = uiWho === 'player' ? 'playerSupportsGrid' : 'botSupportsGrid';
  var grid = document.getElementById(gridId); if (!grid || !combatState) return;
  var side = combatState[actualWho]; if (!side.supports) side.supports = [null,null,null,null];
  var html = '';
  for (var i = 0; i < 4; i++) { var sp = side.supports[i]; if (sp && CARD_DB[sp.cardId]) { var card = CARD_DB[sp.cardId]; html += '<div class="side-slot-filled" data-slot="' + i + '" style="--dc: ' + card.color + ';">' + card.emoji + '<span class="side-slot-duration">' + sp.duration + '</span></div>'; } else html += '<div class="side-slot-empty">+</div>'; }
  grid.innerHTML = html;
  grid.querySelectorAll('.side-slot-filled').forEach(function(el){ el.addEventListener('mouseenter', function(){ var i = parseInt(el.dataset.slot, 10); var sp = side.supports[i]; if (!sp) return; showSupportTooltip(el, sp); }); el.addEventListener('mouseleave', hideTooltip); });
  var structId = uiWho === 'player' ? 'playerStructuresGrid' : 'botStructuresGrid';
  var sg = document.getElementById(structId);
  if (sg) {
  var structs = side.structures || []; var sHtml = '';
  for (var si = 0; si < 4; si++) {
    var st = structs[si];
    if (st) {
      // ✅ Sin duración si es 999 (estructuras permanentes tipo Cruz de Madera/Sangre)
      var durHtml = (st.duration && st.duration < 999) ? '<span class="side-slot-duration">' + st.duration + '</span>' : '';
      // ✅ Emoji según tipo de estructura
      var stEmoji = st.kind === 'cruzMadera' ? '✝️'
            : st.kind === 'cruzSangre' ? '🩸'
            : st.kind === 'mesaDJ' ? '🎧'
            : st.kind === 'android' ? '🤖'
            : st.kind === 'metaQuest' ? '📘'
            : '🧠';
      sHtml += '<div class="side-slot-filled" data-struct-slot="' + si + '" style="--dc: 130,220,140;">' + stEmoji + durHtml + '</div>';
    } else sHtml += '<div class="side-slot-empty">+</div>';
  }
  sg.innerHTML = sHtml;
  sg.querySelectorAll('.side-slot-filled').forEach(function(el){ el.addEventListener('mouseenter', function(){ var i = parseInt(el.dataset.structSlot, 10); if (structs[i]) showStructureTooltip(el, structs[i]); }); el.addEventListener('mouseleave', hideTooltip); });
}
}
function renderConsonanceCombat() {
  var el = document.getElementById('consonanceCardCombat'); if (!el || !combatState) return;
  var side = getActiveSide();
  if (!side) return;
  var cons = side.consonance;
  if (!cons) { el.style.display = 'none'; return; }
  el.style.display = '';
  var html = '', col;
  if (cons.type === 'diverse') { col = '240, 200, 96'; html = '<div class="ccc-header"><span class="ccc-icon">🌈</span><span class="ccc-name-cons">Diverso</span><span class="ccc-level">3 distintos</span></div><div class="ccc-effect">Al comienzo de cada ronda, obtienes 2 omnidados.</div>'; }
  else { col = ELEMENT_COLORS[cons.element]; var p = PHILOSOPHIES[cons.element]; html = '<div class="ccc-header"><span class="ccc-icon">' + p.emoji + '</span><span class="ccc-name-cons">' + p.name + '</span><span class="ccc-level">' + cons.level + '/3</span></div><div class="ccc-effect">' + (cons.level === 3 ? p.consonance3 : p.consonance2) + '</div>'; }
  el.style.setProperty('--cc', col); el.innerHTML = html;
}
function updateTurnIndicator() {
  if (!combatState) return;
  var t = document.getElementById('combatTurnInd'); if (!t) return;
  if (combatState.phase === 'ended') { t.textContent = 'FIN'; t.className = 'combat-turn-ind'; }
  else if (combatState.turn === 'player') { t.textContent = combatState.pvp ? 'JUGADOR 1' : 'TU TURNO'; t.className = 'combat-turn-ind player'; }
  else { t.textContent = combatState.pvp ? 'JUGADOR 2' : 'RIVAL'; t.className = 'combat-turn-ind bot'; }
}
function updateCombatActions() {
  if (!combatState) return;
  // ✅ UNA SOLA declaración de isTurn, con la comprobación de 'auto' correcta
  var isTurn = canHumanControlCurrentTurn();
  var side = getActiveSide();
  if (!side) return;
  var active = side.characters[side.activeIndex]; if (!active) return;
  var char = active.character;
  var nB = document.getElementById('normalBtn'), eB = document.getElementById('elementalBtn'), uB = document.getElementById('ultimateBtn'), enB = document.getElementById('endRoundBtn');
  var nOk = active.cardNextAbilityFree || !char.abilities.normal.energyCost || active.energy >= char.abilities.normal.energyCost;
  var eOk = active.cardNextAbilityFree || !char.abilities.elemental.energyCost || active.energy >= char.abilities.elemental.energyCost;
  var uOk = active.cardNextAbilityFree || !char.abilities.ultimate.energyCost || active.energy >= char.abilities.ultimate.energyCost;
  if (char.abilities.ultimate.kind === 'obraMaestra') {
    var hasOptim = side.structures && side.structures.some(function(st){ return st.kind === 'optimizacion'; });
    if (!hasOptim) uOk = false;
  }
  if (char.abilities.ultimate.kind === 'amorSuficiente') {
    if (active.hp <= 1) uOk = false;
    if (!side.characters.some(function(c){ return c.dead; })) uOk = false;
  }
  var eN = getEffectiveCostFull(active, char.abilities.normal), eE = getEffectiveCostFull(active, char.abilities.elemental), eU = getEffectiveCostFull(active, char.abilities.ultimate);
  var nD = sumCost(eN) === 0 || trySpendDice(side.dice, eN).ok;
  var eD = sumCost(eE) === 0 || trySpendDice(side.dice, eE).ok;
  var uD = sumCost(eU) === 0 || trySpendDice(side.dice, eU).ok;
  if (nB) { nB.disabled = !isTurn || !nOk; nB.classList.toggle('ca-can-pay', isTurn && nOk && nD); }
  if (eB) { eB.disabled = !isTurn || !eOk; eB.classList.toggle('ca-can-pay', isTurn && eOk && eD); }
  if (uB) { uB.disabled = !isTurn || !uOk; uB.classList.toggle('ca-can-pay', isTurn && uOk && uD); }
  if (enB) enB.disabled = !isTurn;
  var nn = document.getElementById('normalName'); if (nn) nn.textContent = '⚔️ ' + char.abilities.normal.name;
  var nc = document.getElementById('normalCost'); if (nc) nc.textContent = formatCost(eN);
  var en = document.getElementById('elementalName'); if (en) en.textContent = '🔮 ' + char.abilities.elemental.name;
  var ec = document.getElementById('elementalCost'); if (ec) ec.textContent = formatCost(eE);
  var un = document.getElementById('ultName'); if (un) un.textContent = '💥 ' + char.abilities.ultimate.name;
  var uc = document.getElementById('ultCost'); if (uc) uc.textContent = formatCost(eU, active.cardNextAbilityFree ? 0 : char.abilities.ultimate.energyCost);

  // ── Botón EX (pasiva permanente) ──
  var exB = document.getElementById('exBtn');
  if (exB) exB.style.display = 'none';
}

function renderCombatLog(){ var el = document.getElementById('combatLog'); if (!el) return; el.innerHTML = combatState.log.map(function(l){ return '<div class="log-line">' + l + '</div>'; }).join(''); el.scrollTop = el.scrollHeight; }
function renderCombat() {
  if (!combatState) return;
  try {
    var r = document.getElementById('combatRound'); if (r) r.textContent = combatState.round;
    updateTurnIndicator(); renderConsonanceCombat();
    renderTeamCards('player'); renderTeamCards('bot');
    renderSupports('player'); renderSupports('bot');
    renderDice(); renderHand(); updateCombatActions(); renderCombatLog();
  } catch (err) {
    console.error('[renderCombat] ERROR:', err);
  }
  if (typeof updateEnvironmentVisuals === 'function') updateEnvironmentVisuals();
}

[{ btnId:'normalBtn', type:'normal' }, { btnId:'elementalBtn', type:'elemental' }, { btnId:'ultimateBtn', type:'ultimate' }].forEach(function(item){
  var b = document.getElementById(item.btnId);
  if (!b) return;
  b.addEventListener('mouseenter', function(){ showAbilityTooltip(b, item.type); });
  b.addEventListener('mouseleave', function(){ scheduleHideTooltip(200); });
});
// ✅ Tooltip de personajes: SOLO para tus propios personajes (playerTeam)
(function(){
  var el = document.getElementById('playerTeam');
  if (!el) return;
  el.addEventListener('mouseover', function(e){
    var card = e.target.closest('.combat-char-card');
    if (!card || card.classList.contains('dead')) return;
    if (e.relatedTarget && card.contains(e.relatedTarget)) return;
    if (!combatState || combatState.phase === 'ended') return;
    if (e.target.closest('.ccc-badge')) return;
    var sideKey = card.dataset.team;
    var idx = parseInt(card.dataset.index, 10);
    if (idx === combatState[sideKey].activeIndex) return;
    showCharTooltip(card, combatState[sideKey].characters[idx]);
  });
  el.addEventListener('mouseout', function(e){
    var card = e.target.closest('.combat-char-card');
    if (!card) return;
    if (e.relatedTarget && card.contains(e.relatedTarget)) return;
    if (e.target.closest('.ccc-badge')) return;
    hideTooltip();
  });
})();

function bindOpenCombat(id, mode) {
  var b = document.getElementById(id);
  if (b) b.addEventListener('click', function(){ openCombat(mode); });
}
bindOpenCombat('openCombatBtn', 'solo');
bindOpenCombat('openPvpBtn', 'pvp');
bindOpenCombat('openAutoBtn', 'auto');
bindOpenCombat('openSandboxBtn', 'sandbox');
bindOpenCombat('jugarCombatBtn', 'solo');
bindOpenCombat('jugarPvpBtn', 'pvp');
bindOpenCombat('jugarAutoBtn', 'auto');
bindOpenCombat('jugarSandboxBtn', 'sandbox');

var combatCloseBtn = document.getElementById('combatCloseBtn'); if (combatCloseBtn) combatCloseBtn.addEventListener('click', closeCombat);
var combatEndBtn = document.getElementById('combatEndBtn'); if (combatEndBtn) combatEndBtn.addEventListener('click', function(){ clearSavedCombat(); closeCombat(); });
var normalBtn = document.getElementById('normalBtn'); if (normalBtn) normalBtn.addEventListener('click', function(){ playerActionRequest('normal'); });
var elementalBtn = document.getElementById('elementalBtn'); if (elementalBtn) elementalBtn.addEventListener('click', function(){ playerActionRequest('elemental'); });
var ultimateBtn = document.getElementById('ultimateBtn'); if (ultimateBtn) ultimateBtn.addEventListener('click', function(){ playerActionRequest('ultimate'); });
// (Botón EX del sidebar eliminado: la EX se elige en combatStartConfirm)
var endRoundBtn = document.getElementById('endRoundBtn'); if (endRoundBtn) endRoundBtn.addEventListener('click', function(){
  // ✅ Solo se puede declarar fin de ronda en tu turno
  if (!canHumanControlCurrentTurn()) { playSound('error'); return; }
  declareEnd(getTurnKey());
});
var rollRerollBtn = document.getElementById('rollRerollBtn'); if (rollRerollBtn) rollRerollBtn.addEventListener('click', rerollSelected);
var rollStartBtn = document.getElementById('rollStartBtn'); if (rollStartBtn) rollStartBtn.addEventListener('click', startCombatPhase);
var drawMulliganBtn = document.getElementById('drawMulliganBtn'); if (drawMulliganBtn) drawMulliganBtn.addEventListener('click', doMulligan);
var drawContinueBtn = document.getElementById('drawContinueBtn'); if (drawContinueBtn) drawContinueBtn.addEventListener('click', onDrawContinue);
var combatStartCancelBtn = document.getElementById('combatStartCancelBtn'); if (combatStartCancelBtn) combatStartCancelBtn.addEventListener('click', function(){ hideCombatStartConfirm(); playSound('deselect'); });
var combatStartConfirmBtn = document.getElementById('combatStartConfirmBtn'); if (combatStartConfirmBtn) combatStartConfirmBtn.addEventListener('click', function(){
  // (Sin bloqueo por modo: los 3 están permitidos)
  if (exCombatEnabled) {
    if (combatStartConfirmForP2 && !pendingExChoiceP2) { playSound('error'); return; }
    if (!combatStartConfirmForP2 && !pendingExChoice) { playSound('error'); return; }
  }
  if (combatStartConfirmForP2) {
    window._pendingP2Ex = exCombatEnabled ? pendingExChoiceP2 : null;
    window._pendingP2ExEnabled = exCombatEnabled;
    hideCombatStartConfirm(); playSound('confirm');
    actuallyStartPvpLocalCombat();
    return;
  }
  // P1 path (Solo o PvP)
  window._pendingPlayerEx = exCombatEnabled ? pendingExChoice : null;
  window._pendingPlayerExEnabled = exCombatEnabled;
  hideCombatStartConfirm(); playSound('confirm');

  if (pendingPvpMode) {
    // ✅ PvP: el J1 confirmó → ahora toca plantilla y confirmación del J2
    askP2TemplateAndConfirm();
    return;
  }
  actuallyStartCombat();
});
var slotCancelBtn = document.getElementById('slotCancelBtn'); if (slotCancelBtn) slotCancelBtn.addEventListener('click', function(){ hideSlotSelectionDialog(); playSound('deselect'); });
var slotNewCombatBtn = document.getElementById('slotNewCombatBtn'); if (slotNewCombatBtn) slotNewCombatBtn.addEventListener('click', function(){ hideSlotSelectionDialog(); startCombatWithTemplatePicker(); });
var overwriteCancelBtn = document.getElementById('overwriteCancelBtn'); if (overwriteCancelBtn) overwriteCancelBtn.addEventListener('click', function(){ hideOverwriteDialog(); playSound('deselect'); });

document.addEventListener('keydown', function(e){
  if (e.key !== 'Escape') return;
  var ow = document.getElementById('overwriteDialog'); if (ow && ow.classList.contains('show')) { hideOverwriteDialog(); return; }
  var sl = document.getElementById('slotSelectionDialog'); if (sl && sl.classList.contains('show')) { hideSlotSelectionDialog(); return; }
  var st = document.getElementById('combatStartConfirm'); if (st && st.classList.contains('show')) { hideCombatStartConfirm(); return; }
  var cf = document.getElementById('confirmOverlay'); if (cf && cf.classList.contains('show')) { hideConfirmation(); return; }
  var pvp = document.getElementById('pvpSetupDialog'); if (pvp && pvp.classList.contains('show')) { pvp.classList.remove('show'); pendingPvpMode = false; return; }
  var cm = document.getElementById('combatModal'); if (cm && cm.classList.contains('open')) closeCombat();
});
