// ✅ Con el nuevo orden (select → roll), la consonancia de Ilusión debe
// aplicarse también en la tirada inicial del jugador, porque ya se conoce
// el personaje activo. El parámetro `first` se mantiene por compatibilidad
// pero ya no bloquea la Ilusión.
function rollDiceForSide(who, first){
  var s = combatState[who];
  s.dice = rollCombatDice(8);
  applyIlusion(s, who);
}
function applyIlusion(side, who) {
  var c = side.consonance;
  if (!c || c.type !== 'single' || c.element !== 'ilusion') return;
  var active = side.characters[side.activeIndex];
  if (!active || active.dead) return;
  var el = active.character.element;
  // ✅ 2 personajes → 2 dados garantizados. 3 personajes → 4 dados garantizados.
  var need = (c.level === 3) ? 4 : 2;
  // Contar dados válidos actuales: del tipo del activo u omnidados
  var valid = 0;
  side.dice.forEach(function(d){ if (d.type === el || d.type === 'omni') valid++; });
  var miss = need - valid;
  if (miss <= 0) return;
  // Convertir dados "inservibles" (ni del tipo del activo ni omni) al tipo del activo
  var conv = 0;
  for (var i = 0; i < side.dice.length && conv < miss; i++) {
    if (side.dice[i].type !== el && side.dice[i].type !== 'omni') {
      side.dice[i] = { type: el, id: side.dice[i].id };
      conv++;
    }
  }
  if (conv > 0) logCombat('🎭 Ilusión: ' + conv + ' dado(s) → ' + ELEMENT_EMOJI[el]);
}

function ensureSelectNonOmniBtn() {
  var rollControls = document.querySelector('.roll-controls'); if (!rollControls) return;
  if (document.getElementById('selectNonOmniBtn')) return;
  var btn = document.createElement('button');
  btn.id = 'selectNonOmniBtn';
  btn.className = 'roll-reroll-btn';
  btn.style.marginRight = '0.5rem';
  btn.textContent = '🎲 Seleccionar todos';
  btn.addEventListener('click', function() {
    if (!combatState) return;
    var side = combatState[combatState.turn];
    if (side.isRollingAnim || side.rerolled) return;
    side.selected = {};
    side.dice.forEach(function(d) { if (d.type !== 'omni') side.selected[d.id] = true; });
    playSound('select');
    renderRollOverlay();
  });
  rollControls.insertBefore(btn, rollControls.firstChild);
}
function showRollOverlay() {
  if (!combatState) return;
  var ov = document.getElementById('rollOverlay'), sub = document.getElementById('rollSubtitle'); if (!ov || !sub) return;
  ensureSelectNonOmniBtn();
  var sideKey = combatState.turn;
  var side = combatState[sideKey];
  var prefix = combatState.pvp ? (sideKey === 'player' ? 'J1 — ' : 'J2 — ') : '';
  sub.textContent = prefix + 'Ronda ' + combatState.round;
  var startBtn = document.getElementById('rollStartBtn');
  if (startBtn) startBtn.textContent = combatState.pvp ? '✓ Continuar' : '⚔️ Comenzar combate';
  ov.classList.add('show'); playSound('roll');
  side.isRollingAnim = true;
  // Forzamos ambos botones deshabilitados ANTES del primer render.
  if (startBtn) startBtn.disabled = true;
  var rrB = document.getElementById('rollRerollBtn');
  if (rrB) rrB.disabled = true;
  renderRollOverlay();
  setTimeout(function(){
    if (!combatState) return;
    combatState[sideKey].isRollingAnim = false;
    // ✅ renderRollOverlay se encarga de habilitar/deshabilitar cada botón
    // según el estado real (isRollingAnim, rollingIds, selección, rerolled).
    renderRollOverlay();
    playSound('diceReveal');
  }, 900);
}
function hideRollOverlay(){ var ov = document.getElementById('rollOverlay'); if (ov) ov.classList.remove('show'); }
function renderRollOverlay() {
  if (!combatState) return;
  var player = combatState[combatState.turn];
  var main = document.getElementById('rollDiceMain'), rerollBtn = document.getElementById('rollRerollBtn'), startBtn = document.getElementById('rollStartBtn');
  function renderDie(d) {
    var isRolling = player.isRollingAnim || (player.rollingIds && player.rollingIds[d.id]);
    var isSel = player.selected[d.id];
    var col = isRolling ? ROLLING_COLOR : (d.type === 'omni' ? '240, 200, 96' : ELEMENT_COLORS[d.type]);
    var em = isRolling ? '🎲' : (d.type === 'omni' ? '✨' : ELEMENT_EMOJI[d.type]);
    var cls = 'roll-die'; if (isRolling) cls += ' rolling'; if (d.type === 'omni' && !isRolling) cls += ' omni'; if (isSel) cls += ' selected';
    return '<div class="' + cls + '" data-id="' + d.id + '" data-type="' + d.type + '" style="--dc: ' + col + ';">' + em + '</div>';
  }
  if (main) { main.innerHTML = sortDiceForDisplay(player.dice, player).map(renderDie).join(''); main.querySelectorAll('.roll-die').forEach(function(el){ el.addEventListener('click', function(){ if (combatState[combatState.turn].isRollingAnim) return; toggleDieSelection(el.dataset.id); renderRollOverlay(); }); }); }
  var isRolling = player.isRollingAnim;
  var hasRolling = !!(player.rollingIds && Object.keys(player.rollingIds).length > 0);
  if (rerollBtn) { var sc = Object.keys(player.selected).length; rerollBtn.disabled = player.rerolled || sc === 0 || isRolling || hasRolling; rerollBtn.textContent = player.rerolled ? '🎲 Ya relanzado' : (sc > 0 ? '🎲 Relanzar ' + sc : '🎲 Relanzar seleccionados'); }
  // ✅ "Comenzar" solo se habilita cuando la tirada inicial ha terminado
  // Y no hay un relanzamiento en curso. Así el jugador ve los dados antes.
  if (startBtn) startBtn.disabled = isRolling || hasRolling;
  var selAllBtn = document.getElementById('selectNonOmniBtn');
  if (selAllBtn) { selAllBtn.disabled = player.rerolled || isRolling || hasRolling; }
}
function toggleDieSelection(id){
  if (!combatState || combatState.phase === 'ended') return;
  var s = combatState[combatState.turn];
  if (combatState.phase === 'rolling') {
    if (s.rerolled) { playSound('error'); return; }
    var die = s.dice.find(function(d){ return d.id === id; });
    if (die && die.type === 'omni') { playSound('error'); return; }
  }
  if (s.selected[id]) { delete s.selected[id]; playSound('deselect'); } else { s.selected[id] = true; playSound('select'); }
}
function rerollSelected() {
  if (!combatState) return;
  var side = combatState[combatState.turn];
  if (side.rerolled || side.isRollingAnim) return;
  // ✅ Guard extra: no permitir relanzar mientras los dados estén en animación
  if (side.rollingIds && Object.keys(side.rollingIds).length > 0) return;
  var selected = Object.keys(side.selected);
  selected = selected.filter(function(id){
    var die = side.dice.find(function(d){ return d.id === id; });
    return die && die.type !== 'omni';
  });
  if (!selected.length) return;
  playSound('roll'); side.rollingIds = {};
  selected.forEach(function(id){ side.rollingIds[id] = true; });
  if (combatState.phase === 'rolling') renderRollOverlay(); else renderCombat();
  setTimeout(function(){
    if (!combatState) return;
    side.dice = side.dice.map(function(d){ if (side.rollingIds[d.id]) { if (Math.random() < 0.125) return { type:'omni', id:d.id }; return { type:CONSONANCE_ORDER[Math.floor(Math.random()*7)], id:d.id }; } return d; });
    side.rollingIds = {}; side.rerolled = true; side.selected = {};
    logCombat('🎲 Relanzas ' + selected.length + ' dado(s)'); playSound('diceReveal');
    if (combatState.phase === 'rolling') renderRollOverlay(); else renderCombat();
  }, 900);
}

var drawInitialShown = false;
function startCombatPhase(){
  if (!combatState || combatState.phase !== 'rolling') return;
  hideRollOverlay();
  if (combatState.pvp && pvpSetupPhase) { advancePvpSetup(); return; }
  startDrawPhase();
}
function startDrawPhase() {
  if (combatState.mode === 'auto') {
    var sideKey = combatState.turn;
    var side = combatState[sideKey];
    combatState.phase = 'playing';
    var base = combatState.round === 1 ? 5 : 2;
    for (var i = 0; i < base; i++) drawFromDeck(sideKey);
    beginRoundPlay();
    return;
  }
  if (!combatState) return;
  var sideKey = combatState.turn;
  var side = combatState[sideKey];
  combatState.phase = 'drawing';
  side.initialDrawThisRound = []; side.drawSelection = {};
  if (combatState.round === 1) side.mulliganUsed = false;
  var base = combatState.round === 1 ? 5 : 2;
  var bonus = getCardDrawBonus(side, combatState.round === 1);
  // ✅ Adela EX: roba 3 cartas menos en la mano inicial
  if (combatState.round === 1) {
    var adelaCs = side.characters.find(function(c){ return c.id === 'adela'; });
    if (adelaCs && adelaCs.exActive) {
      base = Math.max(0, base - 3);
      logCombat('🌟 EX Adela: -3 cartas en la mano inicial');
    }
  }
  var dc = base + bonus, drawn = [];
  for (var i = 0; i < dc; i++) { var c = drawFromDeck(sideKey); if (c) drawn.push(c); }
  side.initialDrawThisRound = drawn;
  // ✅ Adela EX: 2 Café solo en la mano (si están en el mazo)
  if (combatState.round === 1) {
    var adelaCs2 = side.characters.find(function(c){ return c.id === 'adela'; });
    if (adelaCs2 && adelaCs2.exActive) {
      for (var cs2i = 0; cs2i < 2; cs2i++) {
        var idxCafe = side.deck.indexOf('c_cafe_solo');
        if (idxCafe >= 0) {
          side.deck.splice(idxCafe, 1);
          side.hand.push('c_cafe_solo');
          logCombat('🌟 EX Adela: Café solo añadido a la mano');
        }
      }
    }
  }
  var msg = bonus > 0 ? ' (+' + bonus + ' por Expresión)' : '';
  var who = combatState.pvp ? (sideKey === 'player' ? 'J1' : 'J2') : 'Tú';
  logCombat('🎴 ' + who + ' roba ' + drawn.length + ' carta(s)' + msg);
  drawInitialShown = true; playSound('draw'); renderCombat(); showDrawOverlay();
}
function getCardDrawBonus(side, first){ var c = side.consonance; if (!c || c.type !== 'single' || c.element !== 'expresion') return 0; if (c.level === 2) return first ? 2 : 0; if (c.level === 3) return 1; return 0; }
function showDrawOverlay(){ var ov = document.getElementById('drawOverlay'); if (!ov) return; renderDrawOverlay(); ov.classList.add('show'); }
function hideDrawOverlay(){ var ov = document.getElementById('drawOverlay'); if (ov) ov.classList.remove('show'); }
function renderDrawOverlay() {
  if (!combatState) return;
  var player = combatState[combatState.turn];
  var sub = document.getElementById('drawSubtitle'), hint = document.getElementById('drawHint'), main = document.getElementById('drawCardsMain'), mBtn = document.getElementById('drawMulliganBtn'), cBtn = document.getElementById('drawContinueBtn');
  if (!main) return;
  if (sub) sub.textContent = 'Ronda ' + combatState.round;
  var canM = combatState.round === 1 && !player.mulliganUsed;
  if (hint) hint.textContent = canM ? 'Selecciona cartas para cambiar (una vez por partida)' : (combatState.round === 1 ? 'Mulligan ya utilizado' : 'Robo de ronda');
  var cards = player.initialDrawThisRound || [];
  main.classList.toggle('draw-cards-initial', combatState.round === 1);
  if (!cards.length) main.innerHTML = '<div class="draw-empty">No hay cartas para mostrar</div>';
  else {
    if (!player.drawSelection) player.drawSelection = {};
    main.innerHTML = cards.map(function(cid, idx){
      var card = CARD_DB[cid] || PAINT_CARDS[cid]; if (!card) return '';
      var isSel = player.drawSelection[cid + '_' + idx], locked = !canM ? ' locked' : '', sel = isSel ? ' selected' : '';
      var dur = card.duration ? ' · ⏳ ' + card.duration + 'r' : '';
      var catIcon = card.category === 'equipo' ? '⚔️ ' : card.category === 'apoyo' ? '📜 ' : card.category === 'pintura' ? '🎨 ' : '✨ ';
      return '<div class="draw-card' + sel + locked + '" data-draw-idx="' + idx + '" data-draw-id="' + cid + '" style="--dc: ' + card.color + ';">' +
        '<div class="draw-card-emoji">' + card.emoji + '</div><div class="draw-card-name">' + card.name + '</div>' +
        '<div class="draw-card-cost">🎲 ' + formatCardCost(card) + dur + '</div>' +
        '<div class="draw-card-effect">' + card.effectText + '</div>' +
        '<span class="draw-card-tag">' + catIcon + card.tag + '</span></div>';
    }).join('');
    if (drawInitialShown) { var els = main.querySelectorAll('.draw-card'); els.forEach(function(el, i){ el.style.animationDelay = (i * 0.14) + 's'; el.classList.add('flipping'); }); drawInitialShown = false; setTimeout(function(){ if (combatState && combatState.phase === 'drawing') playSound('diceReveal'); }, 550 + (els.length - 1) * 140); }
    if (canM) main.querySelectorAll('.draw-card:not(.locked)').forEach(function(el){ el.addEventListener('click', function(){ var k = el.dataset.drawId + '_' + el.dataset.drawIdx; if (player.drawSelection[k]) { delete player.drawSelection[k]; playSound('deselect'); } else { player.drawSelection[k] = true; playSound('select'); } renderDrawOverlay(); }); });
  }
  if (mBtn) { var sc = player.drawSelection ? Object.keys(player.drawSelection).length : 0, cu = canM && sc > 0; mBtn.style.display = canM ? '' : 'none'; mBtn.disabled = !cu; mBtn.textContent = sc > 0 ? '🔄 Cambiar ' + sc : '🔄 Cambiar seleccionadas'; }
  if (cBtn) cBtn.textContent = canM ? '✓ Mantener y continuar' : '✓ Continuar';
}
function doMulligan() {
  if (!combatState) return;
  var sideKey = combatState.turn;
  var player = combatState[sideKey];
  if (combatState.round !== 1 || player.mulliganUsed) return;
  var keys = Object.keys(player.drawSelection || {}); if (!keys.length) return;
  var ri = {}; keys.forEach(function(k){ var p = k.split('_'); var idx = parseInt(p[p.length-1], 10); if (!isNaN(idx)) ri[idx] = true; });
  var keep = [], back = [];
  player.initialDrawThisRound.forEach(function(cid, i){ if (ri[i]) back.push(cid); else keep.push(cid); });
  back.forEach(function(cid){ var hi = player.hand.indexOf(cid); if (hi >= 0) player.hand.splice(hi, 1); player.deck.push(cid); });
  player.deck = shuffleArray(player.deck);
  var nd = []; for (var i = 0; i < back.length; i++) { var c = drawFromDeck(sideKey); if (c) nd.push(c); }
  player.initialDrawThisRound = keep.concat(nd); player.mulliganUsed = true; player.drawSelection = {};
  logCombat('🔄 Mulligan: ' + back.length + ' carta(s) cambiada(s)');
  drawInitialShown = true; playSound('draw'); renderCombat(); renderDrawOverlay();
}
function onDrawContinue() {
  if (!combatState) return;
  var sideKey = combatState.turn;
  hideDrawOverlay();
  combatState[sideKey].initialDrawThisRound = [];
  combatState[sideKey].drawSelection = {};
  if (combatState.pvp && pvpSetupPhase) { advancePvpSetup(); return; }
  if (combatState.round === 1 && !combatState.starterChosen) { renderCombat(); showSelectOverlay(); }
  else beginRoundPlay();
}

function showSelectOverlay(){ var ov = document.getElementById('selectOverlay'); if (!ov) return; renderSelectOverlay(); ov.classList.add('show'); }
function hideSelectOverlay(){ var ov = document.getElementById('selectOverlay'); if (ov) ov.classList.remove('show'); hideSelectDetail(); }
function renderSelectOverlay() {
  if (!combatState) return;
  var c = document.getElementById('selectOptions'), d = document.getElementById('selectDetail'); if (!c || !d) return;
  d.classList.remove('show'); d.innerHTML = ''; c.style.display = '';
  var selSide = combatState[combatState.turn];
  c.innerHTML = selSide.characters.map(function(cs, i){ var col = ELEMENT_COLORS[cs.character.element]; return '<div class="select-char-card" data-index="' + i + '" style="--el: ' + col + ';"><div class="sel-portrait" data-fallback="' + cs.character.emoji + '"><img src="img/' + cs.id + '.png" alt="' + cs.character.name + '" onerror="this.style.display=\'none\';"></div><div class="sel-name">' + cs.character.name + '</div><div class="sel-element">' + ELEMENT_EMOJI[cs.character.element] + ' ' + ELEMENT_NAMES[cs.character.element] + '</div><div class="sel-stats"><span class="sel-hp">❤️ ' + cs.hp + '/' + cs.maxHp + '</span><span class="sel-energy">⚡ ' + cs.maxEnergy + '</span></div></div>'; }).join('');
  c.querySelectorAll('.select-char-card').forEach(function(card){ card.addEventListener('click', function(){ hideTooltip(); showSelectDetail(parseInt(card.dataset.index, 10)); }); });
}
function showSelectDetail(idx) {
  if (!combatState) return;
  var sideKey = combatState.turn;
  var cs = combatState[sideKey].characters[idx]; if (!cs) return;
  var c = document.getElementById('selectOptions'), d = document.getElementById('selectDetail'); if (!c || !d) return;
  c.style.display = 'none';
  var cd = CHARACTERS[cs.id]; if (!cd) return;
  var col = ELEMENT_COLORS[cd.element], vis = ['normal','elemental','ultimate'], abh = '';
  cd.abilities.forEach(function(ab){
    if (vis.indexOf(ab.type) === -1) return;
    var ic = ab.type === 'normal' ? '⚔️' : (ab.type === 'elemental' ? '🔮' : '💥');
    var nm = ab.type === 'normal' ? 'Ataque Normal' : (ab.type === 'elemental' ? 'Habilidad Elemental' : 'Habilidad Definitiva');
    var brd = ab.type === 'ultimate' ? 'rgba(240,200,96,0.9)' : 'rgba(' + col + ', 0.6)';
    abh += '<div class="ht-ab-item" style="border-left-color: ' + brd + '; background: rgba(255,255,255,0.04); padding: 0.8rem 1rem; margin-bottom: 0.7rem; border-radius: 10px;"><div class="ht-ab-type" style="color: rgb(' + col + '); margin-bottom: 0.3rem; font-size: 0.65rem;">' + ic + ' ' + nm + '</div><div class="ht-ab-name" style="font-size: 1rem; margin-bottom: 0.4rem;">' + ab.name + '</div>';
    if (ab.cost) abh += '<div style="margin-bottom: 0.4rem;">' + renderCost(ab.cost) + '</div>';
    abh += '<div style="color: var(--muted); font-size: 0.82rem; line-height: 1.5;">' + ab.effect + '</div></div>';
  });
  var html = '<div class="select-detail-inner" style="--el: ' + col + ';">';
  html += '<div class="select-detail-portrait" data-fallback="' + cd.emoji + '"><img src="img/' + cs.id + '.png" alt="' + cd.name + '" style="width:100%; height:100%; object-fit:cover; border-radius:14px;" onerror="this.style.display=\'none\';"><div style="position:absolute; bottom:10px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.85); padding: 0.25rem 0.8rem; border-radius: 20px; font-weight: 800; font-size: 0.8rem; color: rgb(' + col + '); border: 1px solid rgba(' + col + ', 0.6); white-space: nowrap; z-index: 3;">❤️ ' + cs.hp + '/' + cs.maxHp + ' HP</div></div>';
  html += '<div class="select-detail-info"><div style="font-size: 0.75rem; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: rgb(' + col + '); margin-bottom: 0.6rem;">' + ELEMENT_EMOJI[cd.element] + ' ' + ELEMENT_NAMES[cd.element] + ' · ' + cd.set + '</div>';
  html += '<h2 style="font-size: 2rem; font-weight: 900; margin-bottom: 0.5rem; background: linear-gradient(90deg, #fff, rgb(' + col + ')); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.02em;">' + cd.name + '</h2>';
  html += '<p style="color: var(--muted); font-style: italic; font-size: 0.88rem; line-height: 1.6; margin-bottom: 1.2rem; border-left: 2px solid rgba(' + col + ', 0.4); padding-left: 0.8rem;">"' + cd.concept + '"</p>';
  html += '<div style="max-height: 280px; overflow-y: auto; padding-right: 0.4rem; scrollbar-width: thin;">' + abh + '</div></div></div>';
  html += '<div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: center; flex-wrap: wrap;"><button class="btn btn-outline" id="selectBackBtn" style="padding: 0.8rem 2rem;">← Volver</button><button class="btn" id="selectConfirmBtn" style="padding: 0.8rem 2.5rem;">✓ Comenzar con ' + cd.name + '</button></div>';
  d.innerHTML = html; d.classList.add('show');
  document.getElementById('selectBackBtn').addEventListener('click', function(){ hideSelectDetail(); playSound('deselect'); });
  document.getElementById('selectConfirmBtn').addEventListener('click', function(){
    hideTooltip();
    var sk = combatState.turn;
    combatState[sk].activeIndex = idx;
    var who = combatState.pvp ? (sk === 'player' ? 'J1' : 'J2') : '';
    playSound('confirm');
    logCombat('🦋 ' + (who ? who + ' empieza' : 'Empiezas') + ' con ' + cs.character.name);
    hideSelectOverlay(); renderCombat();

    // PvP: el flujo lo controla runPvpSetupStep/advancePvpSetup (que ahora
    // pondrá a cada jugador a elegir → tirar → robar en ese orden).
    if (combatState.pvp && pvpSetupPhase) { advancePvpSetup(); return; }

    // No-PvP: ahora toca lanzar dados.
    combatState.starterChosen = true;
    logCombat('▶️ Ronda 1 · Lanza tus dados');
    rollDiceForSide('player', true);
    rollDiceForSide('bot', true);
    renderCombat();
    showRollOverlay();
  });
  playSound('select');
}
function hideSelectDetail(){ var c = document.getElementById('selectOptions'), d = document.getElementById('selectDetail'); if (c) c.style.display = ''; if (d) { d.classList.remove('show'); d.innerHTML = ''; } }

function applyRoundStartEffects(who) {
  var side = combatState[who], cons = side.consonance; if (!cons) return [];
  var msgs = [];
  if (cons.type === 'diverse') { for (var i = 0; i < 2; i++) side.dice.push({ type:'omni', id:uid(), justAdded:true }); msgs.push('🌈 Diverso: +2 omnidados'); }
  else if (cons.element === 'proteccion') { if (cons.level === 3) { side.characters.forEach(function(c){ if (!c.dead) addOrRefreshShield(c, 'consonance_proteccion', 1); }); msgs.push('🛡️ Protección: +1 escudo a todo el equipo'); } else { var a = side.characters[side.activeIndex]; if (a && !a.dead) { addOrRefreshShield(a, 'consonance_proteccion', 1); msgs.push('🛡️ Protección: +1 escudo al activo'); } } }
  else if (cons.element === 'aceptacion') { if (cons.level === 3) { side.characters.forEach(function(c){ if (!c.dead) c.hp = Math.min(c.maxHp, c.hp + 1); }); msgs.push('🌿 Aceptación: +1 HP a todo el equipo'); } else { var a2 = side.characters[side.activeIndex]; if (a2 && !a2.dead) { a2.hp = Math.min(a2.maxHp, a2.hp + 1); msgs.push('🌿 Aceptación: +1 HP al activo'); } } }
  return msgs;
}
function applyComprensionStart(who) {
  var side = combatState[who], cons = side.consonance;
  if (!cons || cons.type !== 'single' || cons.element !== 'comprension') return null;
  if (cons.level === 3) { side.characters.forEach(function(c){ if (!c.dead) c.energy = Math.min(c.maxEnergy, c.energy + 1); }); return '💡 Comprensión: +1 energía a todo el equipo'; }
  else { var a = side.characters[side.activeIndex]; if (a && !a.dead) { a.energy = Math.min(a.maxEnergy, a.energy + 1); return '💡 Comprensión: +1 energía al activo'; } }
  return null;
}
function applyEquipmentRoundStartEffects(who) {
  var side = combatState[who];
  side.characters.forEach(function(cs){
    if (cs.dead || !cs.equipment) return;
    cs.equipment.forEach(function(eqId){
      var eq = CARD_DB[eqId]; if (!eq || !eq.effect) return;
      if (eq.effect.healPerRound) { var b = cs.hp; cs.hp = Math.min(cs.maxHp, cs.hp + eq.effect.healPerRound); if (cs.hp > b) logCombat('🎴 ' + eq.name + ': +' + (cs.hp - b) + ' HP'); }
      if (eq.effect.energyPerRound) { var p = cs.energy; cs.energy = Math.min(cs.maxEnergy, cs.energy + eq.effect.energyPerRound); if (cs.energy > p) logCombat('🎴 ' + eq.name + ': +' + (cs.energy - p) + ' energía'); }
      if (eq.effect.elementDicePerRound && who === 'player') { for (var i = 0; i < eq.effect.elementDicePerRound; i++) side.dice.push({ type:cs.character.element, id:uid(), justAdded:true }); }
      if (eq.effect.elementDicePerRound && who === 'bot' && combatState.pvp) { for (var i2 = 0; i2 < eq.effect.elementDicePerRound; i2++) side.dice.push({ type:cs.character.element, id:uid(), justAdded:true }); }
    });
  });
}
function applySupportRoundStartEffects(who) {
  var side = combatState[who], active = side.characters[side.activeIndex];
  if (!side.supports) return;
  for (var i = 0; i < 4; i++) {
    var sp = side.supports[i]; if (!sp) continue;
    var card = CARD_DB[sp.cardId]; if (!card || !card.effect) continue;
    var e = card.effect;
    if (e.energyPerRound && active && !active.dead) { var p = active.energy; active.energy = Math.min(active.maxEnergy, active.energy + e.energyPerRound); if (active.energy > p) logCombat('📜 ' + card.name + ': +' + (active.energy - p) + ' energía'); }
    if (e.shieldPerRound && active && !active.dead) { addOrRefreshShield(active, 'support_' + card.id, e.shieldPerRound); logCombat('📜 ' + card.name + ': +' + e.shieldPerRound + ' escudo'); }
    if (e.teamShieldPerRound) { side.characters.forEach(function(c){ if (!c.dead) addOrRefreshShield(c, 'support_' + card.id, e.teamShieldPerRound); }); }
    if (e.teamEnergyPerRound) { side.characters.forEach(function(c){ if (!c.dead) c.energy = Math.min(c.maxEnergy, c.energy + e.teamEnergyPerRound); }); }
    if (e.elementDiePerRound && who === 'player' && active && !active.dead) { for (var d = 0; d < e.elementDiePerRound; d++) side.dice.push({ type:active.character.element, id:uid(), justAdded:true }); }
    if (e.omniDiePerRound && who === 'player') { for (var o = 0; o < e.omniDiePerRound; o++) side.dice.push({ type:'omni', id:uid(), justAdded:true }); }
    if (e.elementDiePerRound && who === 'bot' && combatState.pvp && active && !active.dead) { for (var d2 = 0; d2 < e.elementDiePerRound; d2++) side.dice.push({ type:active.character.element, id:uid(), justAdded:true }); }
    if (e.omniDiePerRound && who === 'bot' && combatState.pvp) { for (var o2 = 0; o2 < e.omniDiePerRound; o2++) side.dice.push({ type:'omni', id:uid(), justAdded:true }); }
  }
}
function applySupportEndOfRoundEffects(who) {
  var side = combatState[who], active = side.characters[side.activeIndex];
  if (!side.supports) return;
  for (var i = 0; i < 4; i++) {
    var sp = side.supports[i]; if (!sp) continue;
    var card = CARD_DB[sp.cardId]; if (!card || !card.effect) continue;
    var e = card.effect;
    if (e.healPerRound && active && !active.dead) { var b = active.hp; active.hp = Math.min(active.maxHp, active.hp + e.healPerRound); if (active.hp > b) logCombat('📜 ' + card.name + ': +' + (active.hp - b) + ' HP'); }
    if (e.drawPerRound && who === 'player') { for (var d = 0; d < e.drawPerRound; d++) drawFromDeck(who); }
    if (e.drawPerRound && who === 'bot' && combatState.pvp) { for (var d2 = 0; d2 < e.drawPerRound; d2++) drawFromDeck(who); }
    if (e.teamHealPerRound) { side.characters.forEach(function(cs){ if (!cs.dead) cs.hp = Math.min(cs.maxHp, cs.hp + e.teamHealPerRound); }); }
    sp.duration--; if (sp.duration <= 0) { logCombat('📜 ' + card.name + ' se desvanece'); side.supports[i] = null; }
  }
}
function applyStructureEndOfRoundEffects(who) {
  var side = combatState[who];
  if (!side || !side.structures || !side.structures.length) return;

  var enemySide = combatState[who === 'player' ? 'bot' : 'player'];
  var enemyKey  = who === 'player' ? 'bot' : 'player';

  for (var i = side.structures.length - 1; i >= 0; i--) {
    var st = side.structures[i];
    if (!st) continue;

    if (st.kind === 'optimizacion') {
      var ea = enemySide.characters[enemySide.activeIndex];
      if (ea && !ea.dead) {
        dealDamageToChar(ea, 1, {
          targetSide: enemySide,
          targetSideKey: enemyKey,
          targetIdx: enemySide.activeIndex
        });
        if (!ea.dead) triggerMarkOrResonance(ea, 'comprension', who, enemyKey, enemySide.activeIndex);
        logCombat('🏛️ Optimización: 1 daño y marca comprensión');
      }
      st.duration--;
      if (st.duration <= 0) {
        logCombat('🏛️ Optimización se desvanece');
        side.structures.splice(i, 1);
      }
    }

    if (st.kind === 'android') {
      var eaA = enemySide.characters[enemySide.activeIndex];
      if (eaA && !eaA.dead) {
        dealDamageToChar(eaA, 1, { targetSide: enemySide, targetSideKey: enemyKey, targetIdx: enemySide.activeIndex });
        logCombat('🤖 Android: 1 daño a ' + eaA.character.name);
      }
      st.duration--;
      if (st.duration <= 0) {
        logCombat('🤖 Android se desvanece');
        side.structures.splice(i, 1);
      }
    }

    if (st.kind === 'cruzSangre') {
      // estructura persistente, no consume ronda
      continue;
    }

    if (st.kind === 'mesaDJ') {
      try {
        // 1) Pasa el activo del dueño al siguiente vivo
        var nxMesa = getNextAliveIndex(side, side.activeIndex);
        if (nxMesa >= 0 && nxMesa !== side.activeIndex) {
          side.activeIndex = nxMesa;
          logCombat('🎧 Mesa de DJ: ' + side.characters[nxMesa].character.name + ' pasa a activo');
          // 2) Si Killer Tunes está activo, el cambio pega 1 al rival
          if (typeof triggerKillerTunesDamage === 'function') triggerKillerTunesDamage(who);
          // ✅ Forzar repintado para que la UI muestre al nuevo activo YA
          if (typeof renderCombat === 'function') renderCombat();      
        }
        // 3) Duración
        st.duration--;
        if (st.duration <= 0) {
          logCombat('🎧 Mesa de DJ se desvanece');
          side.structures.splice(i, 1);
        }
      } catch (err) {
        console.error('[Mesa de DJ] Error al resolver el fin de ronda:', err);
      }
    }
  }
}
function beginRoundPlay() {
  if (!combatState) return;
  combatState.phase = 'playing';
  combatState.player.selected = {};
  combatState.bot.selected = {};
  var activeSide = combatState.pvp ? combatState[combatState.turn] : combatState.player;
  var pc = activeSide.consonance, toast = null;
  if (pc) { if (pc.type === 'diverse') toast = '🌈 DIVERSO · +2 OMNIDADOS'; else toast = ELEMENT_EMOJI[pc.element] + ' ' + ELEMENT_NAMES[pc.element].toUpperCase() + ' · ' + pc.level + ' PERSONAJES'; }
  var bannerText = 'TU TURNO';
  if (combatState.pvp) bannerText = combatState.turn === 'player' ? 'TURNO JUGADOR 1' : 'TURNO JUGADOR 2';
  showBanner(bannerText, 1400);
  renderCombat();
  var applyEff = function() {
    if (!combatState || combatState.phase === 'ended') return;
    // ── EX hooks de inicio de ronda ──
    ['player','bot'].forEach(function(wk){
      combatState[wk].characters.forEach(function(c){
        if (!c.dead) exHookRoundStart(c, wk);
        // ✅ Neón: pasiva de curación al inicio de ronda si está activo
        if (c.id === 'neon' && !c.dead) {
          var sdN = combatState[wk];
          if (sdN.activeIndex === sdN.characters.indexOf(c)) {
            var healedN = healChar(c, 4);
            if (healedN > 0) logCombat('🎆 Neón (pasiva): +' + healedN + ' HP');
          }
        }
        // ✅ Google: pasiva de inicio de ronda
        if (c.id === 'google' && !c.dead) {
          var sdG = combatState[wk];
          if (sdG.activeIndex === sdG.characters.indexOf(c)) {
            var teamElsG = computeTeamElements(sdG);
            var activeElG = c.character.element;
            var candidatesG = sdG.dice.filter(function(d){ return d.type !== 'omni'; });
            if (candidatesG.length) {
              var worstG = candidatesG.slice().sort(function(a, b){ return getDiePriority(a, teamElsG, activeElG) - getDiePriority(b, teamElsG, activeElG); })[0];
              if (worstG) {
                worstG.type = 'omni';
                logCombat('🔍 Google (pasiva): dado menos relevante → omnidado');
              }
            }
            csSetState(c, 'googleEndDamage', true);
          }
        }
      });
    });
    // ✅ María (base): pasiva Florecimiento
    // SOLO al principio de la partida (ronda 1): si no hay Campo de Girasoles, lo establece (2 rondas).
    if (combatState.round === 1) {
      ['player','bot'].forEach(function(wk){
        var mariaCs = combatState[wk].characters.find(function(c){ return c.id === 'maria' && !c.dead; });
        if (!mariaCs) return;
        var env = combatState.environment;
        if (!env || env.id !== 'campo_girasoles') {
          setEnvironment('campo_girasoles', mariaCs, wk);
        }
      });
    }
    var pm = applyRoundStartEffects('player'), bm = applyRoundStartEffects('bot');
    if (combatState.round === 1) { var cm = applyComprensionStart('player'); if (cm) pm.push(cm); var cmb = applyComprensionStart('bot'); if (cmb) bm.push(cmb); }
    applyEquipmentRoundStartEffects('player'); applyEquipmentRoundStartEffects('bot');
    applySupportRoundStartEffects('player'); applySupportRoundStartEffects('bot');
    combatState.player.characters.forEach(function(c){ if (c.states) c.states.acelerado = false; });
    combatState.bot.characters.forEach(function(c){ if (c.states) c.states.acelerado = false; });
    logCombat('⚔️ ¡Comienza el combate!'); pm.forEach(function(m){ logCombat(m); });
    renderCombat();
  };
  // ✅ Repintado extra por si el activeIndex cambió entre endRound y aquí
  renderCombat();
  if (toast) setTimeout(function(){ if (!combatState || combatState.phase === 'ended') return; showDiversoToast(toast); playSound('omni'); setTimeout(applyEff, 250); }, 1600);
  else setTimeout(applyEff, 1600);
}

function computeBaseDamageForAbility(attackerCs, ability, actionType) {
  var kind = ability.kind;
  var enemyKey = (combatState.player.characters.indexOf(attackerCs) >= 0) ? 'bot' : 'player';
  var enemySide = combatState[enemyKey];
  var enemyActive = enemySide.characters[enemySide.activeIndex];
  switch (kind) {
    case 'estratosfera': {
      if (!csHasState(attackerCs, 'vuelo')) return 0;
      var carrB = csHasState(attackerCs, 'carrerilla') ? 2 : 0;
      var exB = (attackerCs.exActive) ? 2 : 0; // ✅ EX de Artemis: +2 daño base
      return 6 + carrB + exB;
    }
    case 'carrerilla': return 0;
    case 'damage': return ability.damage || 0;
    case 'cosecha': return ability.damage || 1;
    case 'trazoVivo': { var b = ability.damage || 1; if (attackerCs.paintEquipped === 'roja') b += 2; return b; }
    case 'intervencion': return (enemyActive && csHasState(enemyActive, 'amenaza')) ? 3 : 2;
    case 'aceleron': return 2 + (csHasState(attackerCs, 'acelerado') ? 1 : 0);
    case 'instinto': return 3 + (csHasState(attackerCs, 'acelerado') ? 2 : 0);
    case 'finComienzo': return (attackerCs.states && attackerCs.states.condena) ? attackerCs.states.condena : 0;
    case 'lienzoSangre': { var side = (combatState.player.characters.indexOf(attackerCs) >= 0) ? combatState.player : combatState.bot; return (side.hand || []).filter(function(id){ return id === 'paint_roja'; }).length; }
    case 'contraofensiva': { if (csHasState(attackerCs, 'furia')) return (attackerCs.states && attackerCs.states.furiaTarget === (enemyActive ? enemyActive.id : null)) ? 6 : 5; return 3; }
    case 'inconsistencia': return 2;
    case 'destruccionLogica': return 3;
    case 'deudaSangre': return 3;
    case 'retribucionFinal': { var a = enemySide.characters[enemySide.activeIndex]; var ren = (a.states && a.states.rencor) || 0; return ren > 0 ? 3 + Math.max(0, ren - 1) : 0; }
    case 'degradacion': return 4 + (attackerCs.manuelStacks || 0);
    case 'suficiente': { var amz = enemySide.characters.filter(function(c){ return !c.dead && csHasState(c, 'amenaza'); }); return amz.length > 0 ? 3 : 0; }
    case 'scratch': {
      var sDmg = ability.damage || 1;
      if (combatState.environment && combatState.environment.id === 'sobrecarga_epileptica') sDmg += 1;
      var sSide = (combatState.player.characters.indexOf(attackerCs) >= 0) ? combatState.player : combatState.bot;
      if (sSide.structures && sSide.structures.some(function(s){ return s.kind === 'mesaDJ'; })) sDmg += 1;
      return sDmg;
    }
    default: return 0;
  }
}
function predictPiercing(active, ability) {
  if (ability.piercing) return true;
  if (active.cardNextAttackPiercing) return true;
  if (['finComienzo','inconsistencia','destruccionLogica','suficiente'].indexOf(ability.kind) !== -1) return true;
  var eq = getEquipmentAttackBonus(active); return eq.piercing;
}
function predictSelfDamage(ability, active) {
  switch (ability.kind) {
    case 'autolesion': return ability.selfDamage || 1;
    case 'interpretacion': return 1;
    case 'degradacion': return 2 + (active.manuelStacks || 0);
    default: return ability.selfDamage || 0;
  }
}
function predictHeal(ability, active) {
  if (ability.kind === 'ecoVital') return 0; // cura aliados, no a sí misma
  if (ability.kind === 'armonia') {
    var side = (combatState.player.characters.indexOf(active) >= 0) ? combatState.player : combatState.bot;
    var sint = side.characters.filter(function(c){ return c !== active && !c.dead && csHasState(c, 'sintonia'); }).length;
    return Math.max(0, 5 - sint);
  }
  if (ability.heal) return ability.heal;
  return 0;
}
function predictShieldGain(ability) { if (ability.kind === 'hipotesisSolida') return 2; if (ability.shieldSelf) return ability.shieldSelf; return 0; }
function getGenericBonuses(attackerCs) { var b = { pendingBuff:0, cardBonus:0, equipBonus:0 }; if (attackerCs.pendingBuff) b.pendingBuff = attackerCs.pendingBuff; if (attackerCs.cardNextAttackBonus) b.cardBonus = attackerCs.cardNextAttackBonus; var eq = getEquipmentAttackBonus(attackerCs); b.equipBonus = eq.bonus; return b; }

function getEffectiveCostFull(active, ability) {
  var base = getEffectiveAbilityCost(active, ability.cost);
  if (active.id === 'manuel' && ability.kind === 'degradacion' && active.manuelStacks > 0) {
    var reduction = active.manuelStacks, newCost = {}, keys = Object.keys(base);
    for (var i = 0; i < keys.length && reduction > 0; i++) {
      var k = keys[i];
      if (k === 'any' || k === 'same') { newCost[k] = base[k]; continue; }
      var take = Math.min(base[k], reduction);
      newCost[k] = base[k] - take;
      reduction -= take;
    }
    return newCost;
  }
  // ✅ EX de Artemis: la definitiva cuesta 2 dados más (de aceptación)
  if (active.id === 'artemis' && ability.kind === 'estratosfera' && active.exActive) {
    var exCost = {};
    Object.keys(base).forEach(function(k){ exCost[k] = base[k]; });
    exCost.aceptacion = (exCost.aceptacion || 0) + 2;
    return exCost;
  }
  // ✅ Adela: +1 dado de transformación al coste si tiene marca
  if (active.id === 'adela' && adelaCostBonus(active) > 0 && base.transformacion) {
    var adelaCost = {};
    Object.keys(base).forEach(function(k){ adelaCost[k] = base[k]; });
    adelaCost.transformacion = (adelaCost.transformacion || 0) + adelaCostBonus(active);
    return adelaCost;
  }
  // ✅ Hunger: x2 en TODOS los costes si tiene marca
  if (active.id === 'hunger' && hungerMarkMultiplier(active) > 1) {
    var hCost = {};
    Object.keys(base).forEach(function(k){ hCost[k] = base[k] * hungerMarkMultiplier(active); });
    return hCost;
  }
  // ✅ Internet EX: -1 dado en TODAS sus habilidades si su vida ≤ 2
  if (active.id === 'internet' && active.exActive && active.hp <= 2) {
    var intCost = {};
    var rem = 1;
    Object.keys(base).forEach(function(k){
      if (rem > 0) {
        var take = Math.min(base[k], rem);
        var left = base[k] - take;
        rem -= take;
        if (left > 0) intCost[k] = left;
      } else {
        intCost[k] = base[k];
      }
    });
    return intCost;
  }
  // ✅ Neón: Scratch con Mesa de DJ → -1 cualquiera, +1 ilusión
  if (active.id === 'neon' && ability.kind === 'scratch') {
    var sdNeon = (combatState.player.characters.indexOf(active) >= 0) ? combatState.player : combatState.bot;
    var hasMesaN = sdNeon.structures && sdNeon.structures.some(function(s){ return s.kind === 'mesaDJ'; });
    if (hasMesaN) {
      var cNeon = {};
      Object.keys(base).forEach(function(k){ cNeon[k] = base[k]; });
      cNeon.ilusion = (cNeon.ilusion || 0) + 1;
      cNeon.any = Math.max(0, (cNeon.any || 0) - 1);
      return cNeon;
    }
  }
  // ✅ EX-María: el coste de "roce posible" sube en x1 any por repetición
  if (active.id === 'exmaria' && ability.kind === 'rocePosible') {
    var rCounter = (active.states && active.states.roceCounter) || 0;
    var rCost = {};
    Object.keys(base).forEach(function(k){ rCost[k] = base[k]; });
    rCost.any = (rCost.any || 0) + rCounter;
    return rCost;
  }
  return base;
}

function getEffectiveAbilityCost(active, cost) {
  if (active.cardNextAbilityFree) return {};
  var disc = active.cardNextAbilityDiscount || 0; if (disc <= 0) return cost;
  var res = {}, rem = disc;
  if (cost.any && cost.any > 0) { var r = Math.min(cost.any, rem); if (cost.any - r > 0) res.any = cost.any - r; rem -= r; }
  if (rem > 0 && cost.same && cost.same > 0) { var r2 = Math.min(cost.same, rem); if (cost.same - r2 > 0) res.same = cost.same - r2; rem -= r2; }
  Object.keys(cost).forEach(function(k){ if (k === 'any' || k === 'same') return; var r3 = Math.min(cost[k], rem); if (cost[k] - r3 > 0) res[k] = cost[k] - r3; rem -= r3; });
  return res;
}
function applyGenericDamageMods(active, dmg, isElemental) {
  var add = 0;
  if (active.pendingBuff) { add += active.pendingBuff; logCombat('💪 Impulso: +' + active.pendingBuff); }
  if (active.cardNextAttackBonus) { add += active.cardNextAttackBonus; logCombat('🎴 Carta: +' + active.cardNextAttackBonus); }
  var eq = getEquipmentAttackBonus(active); if (eq.bonus > 0) { add += eq.bonus; logCombat('⚔️ Equipo: +' + eq.bonus); }
  var base = dmg + add;
  if (active.cardNextAttackDouble) { base *= 2; logCombat('🎴 Daño duplicado'); }
  if (combatState && dmg > 0) {
    var side = combatState.player.characters.indexOf(active) >= 0 ? combatState.player : combatState.bot;
    var consR = side.consonance;
    if (consR && consR.type === 'single' && consR.element === 'redencion' && !side.firstAttackUsed) {
      var bonusR = consR.level === 3 ? 3 : 2;
      base += bonusR;
      side.firstAttackUsed = true;
      logCombat('🩸 Redención: +' + bonusR + ' daño (primer ataque)');
    }
    // ✅ Alter: bono a elementales del equipo (si hay buff activo)
    if (isElemental && side.alterUltBuff && side.alterUltBuff.amount > 0 && side.alterUltBuff.roundsLeft > 0 && active.id !== 'alter') {
      base += side.alterUltBuff.amount;
      logCombat('💥 Omnes Deam Salutate: +' + side.alterUltBuff.amount + ' daño');
    }
  }
  return base;
}
function applyDamageWithMods(targetCs, dmg, forcedPiercing, sideKey, idx, attackerCs) {
  var side = combatState[sideKey], piercing = forcedPiercing;
  if (attackerCs) {
    var eq = getEquipmentAttackBonus(attackerCs); if (eq.piercing) piercing = true;
    // ── EX hook saliente (se aplica antes de escudos/reducciones) ──
    dmg = exHookModifyOutgoingDamage(attackerCs, dmg, targetCs);
  }
  if (targetCs.cardMarkBonus) dmg += targetCs.cardMarkBonus;
  return dealDamageToChar(targetCs, dmg, { piercing:piercing, targetSide:side, targetSideKey:sideKey, targetIdx:idx, attackerCs:attackerCs });
}

function executeAction(who, actionType, preSpentDice) {
  if (!combatState || combatState.phase !== 'playing') return;
  var side = combatState[who], active = side.characters[side.activeIndex]; if (!active || active.dead) return;
  var ability = active.character.abilities[actionType]; if (!ability) return;
  var effCost = getEffectiveCostFull(active, ability);
  var effEnergyCost = active.cardNextAbilityFree ? 0 : (ability.energyCost || 0);
  if (effEnergyCost && active.energy < effEnergyCost) return;
  if (!preSpentDice && sumCost(effCost) > 0) { var res = trySpendDice(side.dice, effCost); if (!res.ok) return; side.dice = res.remaining; }
  if (effEnergyCost > 0) { active.energy -= effEnergyCost; logCombat('⚡ ' + active.character.name + ' gasta ' + effEnergyCost + ' energía'); }
  var label = who === 'player' ? (combatState.pvp ? '🦋 J1' : '🦋 Tú') : (combatState.pvp ? '🦋 J2' : '📖 El rival');
  if (actionType === 'ultimate') { logCombat('💥 ¡' + label + ' desata ' + ability.name + '!'); playSound('ult'); flashUlt(); }
  else logCombat('▶️ ' + label + ' usa ' + ability.name);

  var enemyKey = who === 'player' ? 'bot' : 'player';
  var enemySide = combatState[enemyKey];
  var enemyActive = enemySide.characters[enemySide.activeIndex];

  if (actionType === 'ultimate') {
    side.characters.forEach(function(ally) {
      if (ally.id === 'eloy' && !ally.dead && ally !== active) {
        var pE = ally.energy;
        ally.energy = Math.min(ally.maxEnergy, ally.energy + 1);
        if (ally.energy > pE) logCombat('⚡ Eloy gana 1 energía (Sincronía Cognitiva)');
      }
    });
  }

  var ctx = {
    who: who,
    side: side,
    active: active,
    enemyKey: enemyKey,
    enemySide: enemySide,
    enemyActive: enemyActive,
    ability: ability,
    actionType: actionType,
    shouldEndTurn: true,
    pendingBuffConsumed: false
  };

  var handler = ACTION_HANDLERS[ability.kind];
  if (handler) handler(ctx);
  else logCombat('⚠️ Habilidad sin implementar: ' + ability.name);

  if (ability.energy && ability.energy > 0 && !active.dead) {
    // ✅ EX-María no gana energía con sus propias habilidades
    if (active.id === 'exmaria') {
      logCombat('🌻 EX-María no gana energía de sus propias habilidades');
    } else {
      var p = active.energy; active.energy = Math.min(active.maxEnergy, active.energy + ability.energy);
      if (active.energy > p) logCombat('⚡ +' + (active.energy - p) + ' energía');
    }
  }
  if (!active.dead) {
    active.cardNextAbilityDiscount = 0; active.cardNextAbilityFree = false;
    active.cardNextAttackBonus = 0; active.cardNextAttackPiercing = false; active.cardNextAttackDouble = false;
    if (!(active.id === 'jose' && ability.kind === 'impulso')) {
      if (ctx.pendingBuffConsumed || active.id !== 'jose') active.pendingBuff = 0;
    }
  }
  if (active.id === 'jose' && !active.dead) {
    csSetState(active, 'acelerado', false);
  }

  renderCombat();
  if (enemySide.characters.every(function(c){ return c.dead; })) { setTimeout(function(){ endCombat(who); }, 400); return; }
  if (side.characters.every(function(c){ return c.dead; })) { setTimeout(function(){ endCombat(who === 'player' ? 'bot' : 'player'); }, 400); return; }
  if (ctx.shouldEndTurn === false) return;
  setTimeout(nextTurn, 400);
}

function processDeathsAtRoundEnd(who) {
  var side = combatState[who];
  if (side.characters[side.activeIndex] && side.characters[side.activeIndex].dead) {
    var nx = getNextAliveIndex(side, side.activeIndex);
    if (nx >= 0) { side.activeIndex = nx; logCombat('➡️ ' + side.characters[nx].character.name + ' pasa a activo'); }
  }
  return side.characters.every(function(c){ return c.dead; });
}
function getChangeRules(who) {
  var side = combatState[who], cons = side.consonance;
  var rules = { diceCost:1, quick:false, discounted:false };
  if (cons && cons.type === 'single' && cons.element === 'transformacion' && !side.firstChangeUsed) {
    if (cons.level === 2) { rules.diceCost = 0; rules.discounted = true; }
    else if (cons.level === 3) { rules.diceCost = 0; rules.quick = true; rules.discounted = true; }
  }
  return rules;
}
function getChangeRulesForTarget(who, targetIndex) {
  var rules = getChangeRules(who);
  var side = combatState[who];
  if (targetIndex !== undefined && side.characters[targetIndex] && side.characters[targetIndex].id === 'jose') {
    rules.quick = true;
  }
  return rules;
}
function tryChangeCharacter(who, targetIndex) {
  if (!combatState || combatState.phase !== 'playing') return false;
  var side = combatState[who];
  if (side.activeIndex === targetIndex) return false;
  if (side.characters[targetIndex].dead) return false;
  var rules = getChangeRulesForTarget(who, targetIndex);
  if (rules.diceCost > 0) { var r = trySpendDice(side.dice, { any:rules.diceCost }); if (!r.ok) return false; side.dice = r.remaining; }
  if (rules.discounted) side.firstChangeUsed = true;
  var oldN = side.characters[side.activeIndex].character.name, newN = side.characters[targetIndex].character.name;
  var oldChar = side.characters[side.activeIndex];
  if (oldChar.id === 'jose') csSetState(oldChar, 'acelerado', false);
  side.activeIndex = targetIndex;
  hungerOnEnter(who, side.characters[targetIndex], oldChar);
  if (side.characters[targetIndex].id === 'jose') csSetState(side.characters[targetIndex], 'acelerado', true);
  // ✅ EX de Google: al cambiar desde Google, el nuevo activo gana 1 escudo
  applyGoogleExOnChange(oldChar, side, targetIndex, who);
  var sfx = rules.quick ? ' (acción rápida)' : (rules.discounted ? ' (gratis)' : '');
  logCombat('🔄 ' + (who === 'player' ? (combatState.pvp ? 'J1' : 'Tú') : (combatState.pvp ? 'J2' : 'El rival')) + ': ' + oldN + ' → ' + newN + sfx);
  var sfx = rules.quick ? ' (acción rápida)' : (rules.discounted ? ' (gratis)' : '');
  logCombat('🔄 ' + (who === 'player' ? (combatState.pvp ? 'J1' : 'Tú') : (combatState.pvp ? 'J2' : 'El rival')) + ': ' + oldN + ' → ' + newN + sfx);
  // ✅ Killer Tunes: cambio de personaje → 1 daño al enemigo activo
  if (typeof triggerKillerTunesDamage === 'function') triggerKillerTunesDamage(who);
  playSound('change');
  return rules.quick ? 'quick' : true;
}

function botCanUseAbility(botSide, active, ability, actionType) {
  if (ability.energyCost && active.energy < ability.energyCost) return false;
  if (ability.kind === 'obraMaestra') { var hasOptim = botSide.structures && botSide.structures.some(function(st){ return st.kind === 'optimizacion'; }); if (!hasOptim) return false; }
  if (ability.kind === 'amorSuficiente') {
    if (active.hp <= 1) return false;
    if (!botSide.characters.some(function(c){ return c.dead; })) return false;
  }
  var effCost = getEffectiveCostFull(active, ability);
  return trySpendDice(botSide.dice, effCost).ok;
}
function botChooseAction() {
  var bot = combatState.bot, active = bot.characters[bot.activeIndex], char = active.character;
  if (char.abilities.ultimate && botCanUseAbility(bot, active, char.abilities.ultimate, 'ultimate')) return { type:'ultimate' };
  if (active.hp < active.maxHp * 0.35) { for (var i = 0; i < bot.characters.length; i++) { if (i === bot.activeIndex || bot.characters[i].dead) continue; if (bot.characters[i].hp > active.hp + 2) { var rules = getChangeRulesForTarget('bot', i); if (rules.diceCost === 0 || trySpendDice(bot.dice, { any:rules.diceCost }).ok) return { type:'change', index:i }; } } }
  if (botCanUseAbility(bot, active, char.abilities.normal, 'normal')) return { type:'normal' };
  if (botCanUseAbility(bot, active, char.abilities.elemental, 'elemental')) return { type:'elemental' };
  return null;
}
function botTurn() {
  if (!combatState || combatState.pvp || combatState.phase !== 'playing' || combatState.botDone || combatState.turn !== 'bot') return;
  var action = botChooseAction();
  if (action) { setTimeout(function(){ if (!combatState || combatState.pvp) return; if (action.type === 'change') { var r = tryChangeCharacter('bot', action.index); renderCombat(); if (r === 'quick') setTimeout(botTurn, 500); else if (r) setTimeout(nextTurn, 400); else setTimeout(botTurn, 400); } else executeAction('bot', action.type); }, 500); }
  else { logCombat('🤖 El rival no puede actuar'); setTimeout(function(){ declareEnd('bot'); }, 500); }
}
function nextTurn() {
  if (!combatState || combatState.phase === 'ended') return;
  if (combatState.playerDone && combatState.botDone) { endRound(); return; }
  // ✅ Sandbox modo player-only: siempre vuelve a ser el turno del jugador
  if (currentGameMode === 'sandbox' && sandboxTurnMode === 'player-only') {
    combatState.turn = 'player';
    renderCombat();
    return;
  }
  var next = combatState.turn === 'player' ? 'bot' : 'player';
  if (next === 'player' && combatState.playerDone) next = 'bot';
  else if (next === 'bot' && combatState.botDone) next = 'player';
  combatState.turn = next;
  if (next === 'bot') {
    if (combatState.pvp) {
      showBanner('TURNO JUGADOR 2', 1200);
      renderCombat();
    } else {
      showBanner('TURNO DEL RIVAL', 1200);
      renderCombat();
      if (!combatState.botDone) setTimeout(botTurn, 1400);
    }
  }
  else {
    showBanner(combatState.pvp ? 'TURNO JUGADOR 1' : (combatState.mode === 'auto' ? 'TURNO J1 (AUTO)' : 'TU TURNO'), 1200);
    renderCombat();
    if (combatState.mode === 'auto' && !combatState.playerDone) setTimeout(autoPlayerTurn, 900);
  }
}
function declareEnd(who) {
  if (!combatState || combatState.phase === 'ended' || combatState[who + 'Done']) return;
  combatState[who + 'Done'] = true;
  // ✅ Neón (pasiva): +2 escudo + cambio al siguiente aliado si está activa
  var sdDecl = combatState[who];
  var activeDecl = sdDecl.characters[sdDecl.activeIndex];
  if (activeDecl && !activeDecl.dead && activeDecl.id === 'neon') {
    var nxDecl = getNextAliveIndex(sdDecl, sdDecl.activeIndex);
    // ✅ Solo aplica el escudo + cambio si REALMENTE puede cambiar de personaje.
    if (nxDecl >= 0 && nxDecl !== sdDecl.activeIndex) {
      addOrRefreshShield(activeDecl, 'neon_passive', 2);
      sdDecl.activeIndex = nxDecl;
      logCombat('🎆 Neón (pasiva): +2 escudo y cambia a ' + sdDecl.characters[nxDecl].character.name);
      triggerKillerTunesDamage(who);
    } else {
      logCombat('🎆 Neón (pasiva): no puede cambiar de personaje (no hay otros aliados vivos) — sin escudo');
    }
  }
  // ✅ Sandbox player-only: declarar fin de ronda termina la ronda directamente
  if (currentGameMode === 'sandbox' && sandboxTurnMode === 'player-only' && who === 'player') {
    combatState.botDone = true;
  }
  if (combatState.pvp && !combatState.firstDeclarer) combatState.firstDeclarer = who;
  if (combatState.pvp) {
    if (who === 'player') { logCombat('🛑 Jugador 1 declara fin de ronda'); showBanner('J1: FIN DE RONDA', 1400); }
    else { logCombat('🛑 Jugador 2 declara fin de ronda'); showBanner('J2: FIN DE RONDA', 1400); }
  } else if (who === 'player') { logCombat('🛑 Tú declaras fin de ronda'); showBanner('DECLARAS FIN DE RONDA', 1400); }
  else { logCombat('🛑 El rival declara fin de ronda'); showBanner('RIVAL DECLARA FIN', 1400); }
  if (combatState.playerDone && combatState.botDone) { setTimeout(endRound, 1500); return; }
  setTimeout(nextTurn, 1500);
}
function endRound() {
  if (!combatState) return;
  playSound('endRound'); showBanner('FIN DE RONDA', 1600);
  applySupportEndOfRoundEffects('player'); applySupportEndOfRoundEffects('bot');
  // ── Orath: pasiva al final de ronda ──
  ['player','bot'].forEach(function(wk){
    var sd = combatState[wk];
    var orathCs = sd.characters.find(function(c){ return c.id === 'orath' && !c.dead; });
    var cruces = countCruzMadera(sd);
    if (orathCs && cruces > 0 && sd.activeIndex === sd.characters.indexOf(orathCs)) {
      var ek = wk === 'player' ? 'bot' : 'player';
      var es = combatState[ek];
      var ea = es.characters[es.activeIndex];
      if (ea && !ea.dead) {
        triggerMarkOrResonance(ea, 'redencion', wk, ek, es.activeIndex);
        logCombat('✝️ Orath marca al enemigo activo con redención');
      }
      destroyAllCruzMadera(wk);
    }
  });
  // ── Minuto de Silencio: el escudo se desvanece ──
  ['player','bot'].forEach(function(wk){
    combatState[wk].characters.forEach(function(c){
      if (c.id === 'orath' && csHasState(c, 'minutoSilencioShield')) {
        csSetState(c, 'minutoSilencioShield', false);
        c.shields = (c.shields || []).filter(function(sh){ return sh.source !== 'orath_minuto'; });
        logCombat('🔮 El escudo de Minuto de Silencio se desvanece');
      }
    });
  });
  applyStructureEndOfRoundEffects('player'); applyStructureEndOfRoundEffects('bot');

  // ══════════════════════════════════════════════════════════════
  // ✅ EX-María: efectos diferidos de fin de ronda
  // ══════════════════════════════════════════════════════════════
  // 1) Daño / curación diferidos de EX-María
  ['player','bot'].forEach(function(wk){
    combatState[wk].characters.forEach(function(c){
      if (c.id === 'exmaria' && !c.dead) {
        if (c.states && c.states.delayedDamage > 0) {
          var dDmg = c.states.delayedDamage;
          c.states.delayedDamage = 0;
          var dSide = sideOfChar(c);
          dealDamageToChar(c, dDmg, { targetSide: dSide.side, targetSideKey: dSide.key, targetIdx: dSide.side.characters.indexOf(c), skipExmariaDelay: true });
          logCombat('🌻 EX-María recibe ' + dDmg + ' daño diferido');
        }
        if (c.states && c.states.delayedHealing > 0) {
          var dHeal = c.states.delayedHealing;
          c.states.delayedHealing = 0;
          healChar(c, dHeal, { skipExmariaDelay: true });
          logCombat('🌻 EX-María recibe ' + dHeal + ' curación diferida');
        }
      }
    });
  });
  // 2) Golpes diferidos de "roce posible"
  ['player','bot'].forEach(function(wk){
    var sd = combatState[wk];
    if (!sd.pendingRoceHits || !sd.pendingRoceHits.length) return;
    sd.pendingRoceHits.forEach(function(hit){
      var tS = combatState[hit.targetSideKey];
      var tgt = tS.characters[hit.targetIdx];
      if (tgt && !tgt.dead) {
        dealDamageToChar(tgt, hit.damage, { targetSide: tS, targetSideKey: hit.targetSideKey, targetIdx: hit.targetIdx });
        logCombat('🌻 Roce posible: ' + tgt.character.name + ' recibe ' + hit.damage + ' daño diferido');
      }
    });
    sd.pendingRoceHits = [];
  });
  // 3) Chequeos de "amor verdadero"
  ['player','bot'].forEach(function(wk){
    var sd = combatState[wk];
    if (!sd.pendingAmorVerdadero || !sd.pendingAmorVerdadero.length) return;
    sd.pendingAmorVerdadero.forEach(function(entry) {
      var eS = combatState[entry.enemySideKey];
      var eT = eS.characters[entry.enemyIdx];
      var mariaS = sd.characters.find(function(c){ return c.id === 'exmaria' && !c.dead; });
      if (!mariaS) return;
      if (!eT || eT.dead) return;
      var mMark = csAllMarks(mariaS).length > 0;
      var eMark = csAllMarks(eT).length > 0;
      if (mMark === eMark) {
        healChar(mariaS, 2);
        logCombat('🌻 Amor verdadero: María +2 HP (ambos ' + (mMark ? 'marcados' : 'sin marca') + ')');
      } else {
        var mS = sideOfChar(mariaS);
        dealDamageToChar(mariaS, 1, { targetSide: mS.side, targetSideKey: mS.key, targetIdx: mS.side.characters.indexOf(mariaS) });
        logCombat('🌻 Amor verdadero: María recibe 1 daño (solo uno marcado)');
      }
    });
    sd.pendingAmorVerdadero = [];
  });
  // 4) Chequeos de "amor suficiente"
  ['player','bot'].forEach(function(wk){
    var sd = combatState[wk];
    if (!sd.pendingAmorSuficiente || !sd.pendingAmorSuficiente.length) return;
    sd.pendingAmorSuficiente.forEach(function(entry) {
      var revivedCs = sd.characters.find(function(c){ return c.id === entry.revivedId; });
      var mariaS = sd.characters.find(function(c){ return c.id === 'exmaria' && !c.dead; });
      if (!mariaS) return;
      if (!revivedCs || revivedCs.dead) return;
      healChar(mariaS, 2);
      logCombat('🌻 Amor suficiente: el revivido sobrevive, María +2 HP');
    });
    sd.pendingAmorSuficiente = [];
  });
  // 5) EX-María: +1 energía (pasiva) + consolidación de la energía pendiente
  ['player','bot'].forEach(function(wk){
    combatState[wk].characters.forEach(function(c){
      if (c.id === 'exmaria' && !c.dead) {
        c.energy = Math.min(c.maxEnergy, c.energy + 1);
        if (c._flushPendingEnergy) c._flushPendingEnergy();
        logCombat('🌻 EX-María: energía consolidada al final de ronda');
      }
    });
  });
  // 6) Reset del contador de "roce posible"
  ['player','bot'].forEach(function(wk){
    combatState[wk].characters.forEach(function(c){
      if (c.id === 'exmaria' && c.states) c.states.roceCounter = 0;
    });
  });
  // ✅ Reset del contador de "Cosecha" de María (base)
  ['player','bot'].forEach(function(wk){
    combatState[wk].characters.forEach(function(c){
      if (c.id === 'maria' && c.states) c.states.cosechaCounter = 0;
    });
  });
  // ✅ Google (pasiva): 1 daño verdadero al final de la ronda si activó su pasiva
  ['player','bot'].forEach(function(wk){
    combatState[wk].characters.forEach(function(c){
      if (c.id === 'google' && !c.dead && csHasState(c, 'googleEndDamage')) {
        csSetState(c, 'googleEndDamage', false);
        var dSideG = sideOfChar(c);
        dealDamageToChar(c, 1, { piercing: true, targetSide: dSideG.side, targetSideKey: dSideG.key, targetIdx: dSideG.side.characters.indexOf(c) });
        logCombat('🔍 Google (pasiva): 1 daño verdadero al final de la ronda');
      }
    });
  });
  // ✅ NC (pasiva): Podrida + autodaño al final de la ronda
  ['player','bot'].forEach(function(wk){
    var sd = combatState[wk];
    var ncCs = sd.characters.find(function(c){ return c.id === 'nc' && !c.dead; });
    if (!ncCs) return;

    // Podrida: 1 daño al enemigo activo (o a todos si usó la ult esta ronda)
    if (csHasState(ncCs, 'podrida')) {
      var ek = wk === 'player' ? 'bot' : 'player';
      var es = combatState[ek];
      if (sd.podridaHitsAll) {
        es.characters.forEach(function(c, i){
          if (c.dead) return;
          dealDamageToChar(c, 1, { targetSide: es, targetSideKey: ek, targetIdx: i });
          logCombat('🦠 Podrida: 1 daño a ' + c.character.name + ' (todos)');
        });
      } else {
        var ea = es.characters[es.activeIndex];
        if (ea && !ea.dead) {
          dealDamageToChar(ea, 1, { targetSide: es, targetSideKey: ek, targetIdx: es.activeIndex });
          logCombat('🦠 Podrida: 1 daño a ' + ea.character.name);
        }
      }
    }

    // Pasiva: NC recibe 1 daño al final de la ronda (si sigue viva)
    if (!ncCs.dead && ncCs.hp > 0) {
      var ncSide = sideOfChar(ncCs);
      dealDamageToChar(ncCs, 1, { targetSide: ncSide.side, targetSideKey: ncSide.key, targetIdx: ncSide.side.characters.indexOf(ncCs) });
      logCombat('🎯 NC (pasiva): 1 daño al final de la ronda');
    }
  });
  // ✅ Reset flag Podrida-a-todos
  ['player','bot'].forEach(function(wk){ combatState[wk].podridaHitsAll = false; });

  // ✅ María (base): pasiva Florecimiento (fin de ronda)
  // Si el entorno es Campo de Girasoles (y es suyo) y ella está activa → cura 1 HP a todos los aliados.
  ['player','bot'].forEach(function(wk){
    var sd = combatState[wk];
    var mariaCs = sd.characters.find(function(c){ return c.id === 'maria' && !c.dead; });
    if (!mariaCs) return;
    if (sd.activeIndex !== sd.characters.indexOf(mariaCs)) return;
    var env = combatState.environment;
    if (!env || env.id !== 'campo_girasoles' || env.ownerSide !== wk) return;
    sd.characters.forEach(function(c){ if (!c.dead) healChar(c, 1); });
    logCombat('🌻 Florecimiento (fin de ronda): María activa → aliados +1 HP');
  });

  // ── Entorno: efecto de fin de ronda ──
  if (combatState.environment) {
    var envCur = combatState.environment;
    // ✅ Campo de Girasoles: el efecto pasivo (+1 a toda curación del equipo dueño)
    // se aplica dentro de healChar(). No hay heal por ronda ni semillas.
    if (envCur.id === 'sobrecarga_epileptica') {
      var ownerEnvSide = combatState[envCur.ownerSide];
      var nxEnv = getNextAliveIndex(ownerEnvSide, ownerEnvSide.activeIndex);
      if (nxEnv >= 0 && nxEnv !== ownerEnvSide.activeIndex) {
        ownerEnvSide.activeIndex = nxEnv;
        logCombat('⚡ Sobrecarga Epiléptica: ' + ownerEnvSide.characters[nxEnv].character.name + ' pasa a activo');
        triggerKillerTunesDamage(envCur.ownerSide);
        if (typeof renderCombat === 'function') renderCombat();
      }
    }
    envCur.roundsLeft--;
    if (envCur.roundsLeft <= 0) {
      logCombat('🌍 El entorno ' + envCur.name + ' desaparece');
      combatState.environment = null;
    }
    updateEnvironmentVisuals();
  }
  ['player','bot'].forEach(function(wk){ var sd = combatState[wk]; if (sd.hand) sd.hand = sd.hand.filter(function(cid){ return !PAINT_CARDS[cid]; }); });
  var pdead = processDeathsAtRoundEnd('player'), bdead = processDeathsAtRoundEnd('bot');
  renderCombat();
  if (bdead) { setTimeout(function(){ endCombat('player'); }, 600); return; }
  if (pdead) { setTimeout(function(){ endCombat('bot'); }, 600); return; }
  combatState.round++; combatState.playerDone = false; combatState.botDone = false;
  combatState.player.firstChangeUsed = false; combatState.player.firstAttackUsed = false;
  combatState.bot.firstChangeUsed = false; combatState.bot.firstAttackUsed = false;
  // ✅ Alter: la definitiva dura 2 rondas; al final de cada ronda se decrementa.
  ['player','bot'].forEach(function(wk){
    var sd = combatState[wk];
    if (sd.alterUltBuff && sd.alterUltBuff.roundsLeft > 0) {
      sd.alterUltBuff.roundsLeft--;
      if (sd.alterUltBuff.roundsLeft <= 0) {
        sd.alterUltBuff.amount = 0;
        logCombat('💥 Omnes Deam Salutate se desvanece');
      }
    }
  });
  if (combatState.player.obraMaestraTurns > 0) combatState.player.obraMaestraTurns--;
  if (combatState.bot.obraMaestraTurns > 0) combatState.bot.obraMaestraTurns--;
  ['player','bot'].forEach(function(wk){ combatState[wk].characters.forEach(function(c){
    c.pendingBuff = 0; c.cardMarkBonus = 0;
    if (c.states) {
      c.states.acelerado = false;
      c.states.furia = false; c.states.furiaPending = false; c.states.furiaTarget = null;
      // ✅ Alter: pierde 1 punto de invulnerabilidad al final de cada ronda
      if (c.id === 'alter' && c.states.invulnerabilidad > 0) {
        c.states.invulnerabilidad = Math.max(0, c.states.invulnerabilidad - 1);
        logCombat('🛡️ Alter pierde 1 invulnerabilidad (queda ' + c.states.invulnerabilidad + ')');
      }
      if (c.id !== 'alter') c.states.invulnerabilidad = 0;
      // ✅ Hunger: si al final de la ronda tiene marca, pierde 2 HP
      if (c.id === 'hunger' && !c.dead && hasAnyMark(c)) {
        c.hp = Math.max(0, c.hp - 2);
        logCombat('👹 Hunger pierde 2 HP por su marca (queda ' + c.hp + '/' + c.maxHp + ')');
        if (c.hp <= 0) {
          var hSide = combatState[wk];
          handleDeath(wk, hSide.characters.indexOf(c));
        }
      }
    }
  }); });
  combatState.player.neonUltChangeDamage = false;
  combatState.bot.neonUltChangeDamage = false;
  combatState.player.rerolled = false; combatState.player.selected = {}; combatState.player.rollingIds = {};
  combatState.player.cardsUsedThisRound = {};
  if (combatState.pvp) {
    combatState.bot.rerolled = false; combatState.bot.selected = {}; combatState.bot.rollingIds = {};
    combatState.bot.cardsUsedThisRound = {};
  }
  setTimeout(function(){
    // ✅ Sandbox: saltar setup PvP entre rondas
    if (currentGameMode === 'sandbox') {
      rollDiceForSide('player', false);
      rollDiceForSide('bot', false);
      for (var i = 0; i < 2; i++) { drawFromDeck('player'); drawFromDeck('bot'); }
      combatState.phase = 'playing';
      combatState.turn = 'player';
      combatState.pvp = (sandboxTurnMode !== 'bot');
      logCombat('═══ Ronda ' + combatState.round + ' ═══');
      renderCombat();
      beginRoundPlay();
      return;
    }
    if (!combatState) return;
    combatState.phase = 'rolling';
    if (combatState.pvp) {
      pvpSetupPhase = 'p1-roll';
      logCombat('═══ Ronda ' + combatState.round + ' ═══');
      renderCombat();
      runPvpSetupStep();
      return;
    }
    combatState.turn = 'player';
    logCombat('═══ Ronda ' + combatState.round + ' ═══'); logCombat('🎲 Lanzas dados');
    rollDiceForSide('player', false); rollDiceForSide('bot', false);
    renderCombat();
    if (combatState.mode === 'auto') {
      // Auto: no mostramos overlay, arrancamos la ronda directamente
      startDrawPhase();
      return;
    }
    showRollOverlay();
  }, 1700);
}
function endCombat(winner) {
  if (!combatState) return;
  combatState.phase = 'ended'; combatState.winner = winner;
  if (currentCombatSlot !== null) clearCombatSlot(currentCombatSlot);
  var ov = document.getElementById('combatEndOverlay'), em = document.getElementById('combatEndEmoji'), ti = document.getElementById('combatEndTitle'), su = document.getElementById('combatEndSub');
  if (!ov || !em || !ti || !su) return;
  hideBanner(); hideRollOverlay(); hideDrawOverlay(); hideTooltip(); hideConfirmation();
  if (combatState.pvp) {
    if (winner === 'player') { em.textContent = '🏆'; ti.textContent = '¡Gana Jugador 1!'; ti.style.color = 'var(--accent)'; su.textContent = 'Ha derrotado al equipo del Jugador 2'; playSound('victory'); }
    else { em.textContent = '🏆'; ti.textContent = '¡Gana Jugador 2!'; ti.style.color = 'var(--accent)'; su.textContent = 'Ha derrotado al equipo del Jugador 1'; playSound('victory'); }
  } else {
    if (winner === 'player') { em.textContent = '🏆'; ti.textContent = '¡Victoria!'; ti.style.color = 'var(--accent)'; su.textContent = 'Has derrotado a todo el equipo rival'; playSound('victory'); }
    else { em.textContent = '💀'; ti.textContent = 'Derrota'; ti.style.color = '#c82d3c'; su.textContent = 'Tu equipo ha caído'; playSound('defeat'); }
  }
  setTimeout(function(){ ov.classList.add('open'); }, 400);
}
function flashUlt(){ var c = document.getElementById('combatContent'); if (!c) return; c.classList.add('ult-cast'); setTimeout(function(){ c.classList.remove('ult-cast'); }, 800); }

/* ═══ MARÍA / EX-MARÍA: helpers ═══ */
function getMariaTarget(side, mariaCs) {
  var candidates = [];
  side.characters.forEach(function(c, i) {
    if (c === mariaCs || c.dead) return;
    candidates.push({ cs: c, idx: i });
  });
  if (!candidates.length) return -1;
  var minHp = Math.min.apply(null, candidates.map(function(x){ return x.cs.hp; }));
  var tied = candidates.filter(function(x){ return x.cs.hp === minHp; });
  if (tied.length === 1) return tied[0].idx;
  // Desempate: siguiente aliado en reserva (circular desde el activo)
  var activeIdx = side.activeIndex;
  var n = side.characters.length;
  for (var k = 1; k <= n; k++) {
    var idx = (activeIdx + k) % n;
    for (var j = 0; j < tied.length; j++) {
      if (tied[j].idx === idx) return tied[j].idx;
    }
  }
  return tied[0].idx;
}

/* ═══ GOOGLE EX: helper para cambio de personaje ═══ */
function applyGoogleExOnChange(oldChar, side, newIndex, turnKey) {
  if (!oldChar || oldChar.id !== 'google') return;
  // Doble comprobación por si acaso `exActive` no estuviera seteado
  var hasEx = oldChar.exActive
    || (combatState && combatState.exCharId && combatState.exCharId[turnKey] === 'google');
  if (!hasEx) return;
  var newActive = side.characters[newIndex];
  if (!newActive || newActive.dead) return;
  addOrRefreshShield(newActive, 'google_ex', 1);
  logCombat('🔍 EX Google: ' + newActive.character.name + ' +1 escudo');
}

function previewPlayerAction(actionType) {
  var side = getTurnSide(); var enemySide = getEnemySide();
  if (!side || !enemySide) return null;
  var active = side.characters[side.activeIndex];
  var ability = active.character.abilities[actionType];
  var target = enemySide.characters[enemySide.activeIndex];
  var preview = {
    ability:ability, active:active, target:target,
    piercing:false, baseDmg:0, buffDmg:0, cardBonus:0, redencionDmg:0, markBonus:0,
    equipDmg:0, supportDmg:0, optimizationDmg:0, erikBonus:0, obraMaestraDmg:0, carrerillaBonus:0,
    alterBuffDmg:0,
    flatReduction:0, rawDmg:0, totalDmg:0, trueDmg:0, shieldAbsorbed:0,
    heal:0, healApplied:0, shieldSelf:0, selfDamage:0, reflectDmg:0, condenaGain:0,
    energyGain:ability.energy || 0, energyCost:ability.energyCost || 0,
    targetHpBefore:target ? target.hp : 0, targetHpAfter:target ? target.hp : 0,
    targetShieldBefore:target ? totalShield(target) : 0, targetShieldAfter:target ? totalShield(target) : 0,
    activeHpBefore:active.hp, activeHpAfter:active.hp,
    activeShieldBefore:totalShield(active), activeShieldAfter:totalShield(active),
    willKill:false, willDieFromSelf:false, notes:[]
  };
  preview.baseDmg = computeBaseDamageForAbility(active, ability, actionType);
  preview.selfDamage = predictSelfDamage(ability, active);
  preview.heal = predictHeal(ability, active);
  preview.healApplied = Math.min(preview.heal, active.maxHp - active.hp);
  preview.shieldSelf = predictShieldGain(ability);
  preview.reflectDmg = getReflectDamage(enemySide);

  var applyGeneric = ['damage','trazoVivo','intervencion','aceleron','instinto','deudaSangre','graciaPicara','cosecha','rocePosible'].indexOf(ability.kind) !== -1;
  if (ability.target === 'enemy' && preview.baseDmg > 0 && target) {
    if (applyGeneric) {
      var gb = getGenericBonuses(active);
      preview.buffDmg = gb.pendingBuff;
      preview.cardBonus = gb.cardBonus;
      preview.equipDmg = gb.equipBonus;
      preview.supportDmg = getSupportAttackBonus(side);
      if (actionType === 'normal' || actionType === 'elemental') preview.optimizationDmg = getOptimizationBonus(side);
      if (active.id === 'erik') preview.erikBonus = applyErikPassive(active);
      if (active.id === 'eevee' && csHasState(active, 'furia') && active.states.furiaTarget === target.id && actionType === 'normal') preview.notes.push('🔥 Furia: +1');
      var consR = side.consonance;
      if (consR && consR.type === 'single' && consR.element === 'redencion' && !side.firstAttackUsed) preview.redencionDmg = consR.level === 3 ? 3 : 2;
      if (target.cardMarkBonus) preview.markBonus = target.cardMarkBonus;
      var isElementalLike = (actionType === 'elemental') || (ability.kind === 'graciaPicara');
      if (isElementalLike && side.alterUltBuff && side.alterUltBuff.amount > 0 && side.alterUltBuff.roundsLeft > 0 && active.id !== 'alter') {
        preview.alterBuffDmg = side.alterUltBuff.amount;
        preview.notes.push('💥 Omnes Deam Salutate: +' + side.alterUltBuff.amount + ' daño');
      }
      if (active.id === 'artemis' && csHasState(active, 'carrerilla') && ability.kind === 'damage') {
        preview.carrerillaBonus = 2;
        preview.notes.push('🏃 Carrerilla: +2 daño');
        if (actionType === 'normal') preview.notes.push('⚡ +1 energía extra');
      }
    }
    if (!applyGeneric && actionType === 'elemental' && side.alterUltBuff && side.alterUltBuff.amount > 0 && side.alterUltBuff.roundsLeft > 0 && active.id !== 'alter') {
      if (ability.kind === 'inconsistencia' || ability.kind === 'degradacion') {
        preview.alterBuffDmg = side.alterUltBuff.amount;
        preview.notes.push('💥 Omnes Deam Salutate: +' + side.alterUltBuff.amount + ' daño');
      }
    }
    if (actionType === 'ultimate' && side.obraMaestraTurns > 0 && applyGeneric) preview.obraMaestraDmg = preview.baseDmg;
    var coreDmg = preview.baseDmg + (preview.carrerillaBonus || 0);
    if (active.cardNextAttackDouble && applyGeneric) coreDmg *= 2;
    if (preview.obraMaestraDmg > 0) coreDmg += preview.obraMaestraDmg;
    var raw = coreDmg + preview.buffDmg + preview.cardBonus + preview.equipDmg + preview.supportDmg + preview.optimizationDmg + preview.erikBonus + preview.markBonus + preview.redencionDmg + (preview.alterBuffDmg || 0);
    if (preview.notes.indexOf('🔥 Furia: +1') !== -1) raw += 1;
    preview.rawDmg = raw;
    preview.flatReduction = getDamageReduction(target, enemySide);
    var afterRed = Math.max(0, raw - preview.flatReduction);
    if (csHasState(target, 'vulnerable') && afterRed > 0) { afterRed = Math.max(0, afterRed - 1); preview.notes.push('💔 Vulnerable: -1'); }
    preview.totalDmg = afterRed;
    preview.piercing = predictPiercing(active, ability);
    if (preview.piercing) preview.trueDmg = afterRed;
    else { preview.shieldAbsorbed = Math.min(preview.targetShieldBefore, afterRed); preview.trueDmg = afterRed - preview.shieldAbsorbed; preview.targetShieldAfter = preview.targetShieldBefore - preview.shieldAbsorbed; }
    preview.targetHpAfter = Math.max(0, target.hp - preview.trueDmg);
    preview.willKill = preview.targetHpAfter <= 0;
  }

  // ==== Predicciones específicas por habilidad ====

  if (ability.kind === 'carrerilla') {
    preview.notes.push('🏃 Siguiente ataque +2 daño (+1 energía extra si es el ataque normal)');
    preview.notes.push('⚡ No gana energía con esta habilidad');
  }
  if (ability.kind === 'estratosfera') {
    if (csHasState(active, 'vuelo')) {
      var carrP = csHasState(active, 'carrerilla') ? 2 : 0;
      var exP = (active.exActive) ? 2 : 0;
      if (carrP > 0) preview.notes.push('🏃 Carrerilla: +2 daño (aplicado)');
      if (exP > 0) preview.notes.push('🌟 EX Artemis: +2 daño base');
      preview.notes.push('💥 ' + (6 + carrP + exP) + ' daño penetrante a TODOS los enemigos');
      preview.notes.push('🏷️ Marca con aceptación a los que sobrevivan');
      preview.notes.push('💀 Artemis muere');
      preview.willDieFromSelf = true;
    } else {
      preview.notes.push('🦅 Entra en Vuelo (no hace daño)');
    }
  }

  if (ability.kind === 'autolesion' && active.id === 'alaya' && csHasState(active, 'castigada')) {
    preview.condenaGain = 1;
    preview.notes.push('💀 +1 condena');
  }

  if (ability.kind === 'trazoVivo') {
    var paint = active.paintEquipped;
    if (paint === 'roja') preview.notes.push('🔴 Pintura Roja: +2 daño');
    else if (paint === 'azul') { preview.shieldSelf = (preview.shieldSelf || 0) + 1; preview.notes.push('🔵 Pintura Azul: +1 escudo'); }
    else if (paint === 'verde') { var healV = Math.min(2, active.maxHp - active.hp); preview.healApplied = (preview.healApplied || 0) + healV; preview.notes.push('🟢 Pintura Verde: +' + healV + ' HP'); }
    else preview.notes.push('🏷️ Marca con expresión');
    if (paint) preview.notes.push('🎨 La pintura se consume');
  }

  if (ability.kind === 'interpretacion') {
    preview.notes.push('🎨 Genera 3 cartas de pintura (roja/azul/verde)');
  }

  if (ability.kind === 'lienzoSangre') {
    var pr = (side.hand||[]).filter(function(id){ return id === 'paint_roja'; }).length;
    var pa = (side.hand||[]).filter(function(id){ return id === 'paint_azul'; }).length;
    var pv = (side.hand||[]).filter(function(id){ return id === 'paint_verde'; }).length;
    if (pr + pa + pv === 0) preview.notes.push('❌ Sin pinturas en mano');
    else {
      if (pr) preview.notes.push('🔴 +' + pr + ' daño por pinturas rojas');
      if (pa) { preview.shieldSelf = (preview.shieldSelf || 0) + pa; preview.notes.push('🔵 +' + pa + ' HP al primer escudo'); }
      if (pv) { var healL = Math.min(pv, active.maxHp - active.hp); preview.healApplied = (preview.healApplied || 0) + healL; preview.notes.push('🟢 +' + healL + ' HP'); }
    }
  }

  if (ability.kind === 'deudaSangre') {
    preview.notes.push('💢 Aplica 1 Rencor al enemigo');
    if (preview.trueDmg > 0) {
      var healBonusPrev = 0;
      if (active && active.equipment) active.equipment.forEach(function(eqId){
        var eq = CARD_DB[eqId]; if (eq && eq.effect && eq.effect.healBonus) healBonusPrev += eq.effect.healBonus;
      });
      var healD = Math.min(preview.trueDmg, 3) + healBonusPrev;
      healD = Math.min(healD, active.maxHp - active.hp);
      preview.healApplied = healD;
      preview.notes.push('🩸 Cura ' + healD + ' HP (máx. 3 por daño + bonos)');
    } else {
      preview.notes.push('🩸 No cura (no hubo daño verdadero)');
    }
  }

  if (ability.kind === 'ecoVital') {
    var alliesEco = side.characters.filter(function(c){ return c !== active && !c.dead; });
    preview.notes.push('🎵 ' + alliesEco.length + ' aliado(s) +2 HP y Sintonía');
    preview.healApplied = 0;
  }

  if (ability.kind === 'armonia') {
    preview.notes.push('🏷️ Marca al enemigo con protección');
  }

  if (ability.kind === 'hipotesisSolida') {
    preview.notes.push('🛡️ +2 escudo; si un enemigo lo golpea, lo marca con comprensión');
  }

  if (ability.kind === 'conclusion') {
    var alliesCon = side.characters.filter(function(c){ return c !== active && !c.dead; });
    preview.notes.push('🛡️ ' + alliesCon.length + ' aliado(s) +1 escudo y +1 energía');
  }

  if (ability.kind === 'defensaActiva') {
    preview.notes.push('💠 Al próximo ataque: -1 daño y contraataque');
  }

  if (ability.kind === 'suficiente') {
    var amz = enemySide.characters.filter(function(c){ return !c.dead && csHasState(c, 'amenaza'); });
    if (!amz.length) preview.notes.push('❌ No hay Amenazas');
    else preview.notes.push('🚨 Afecta a ' + amz.length + ' enemigo(s) Amenaza (3 daño penetrante c/u)');
    var vuln = side.characters.filter(function(c){ return !c.dead && csHasState(c, 'vulnerable'); });
    if (vuln.length) preview.notes.push('🛡️ ' + vuln.length + ' aliado(s) Vulnerable(s) +3 escudo');
  }

  if (ability.kind === 'retribucionFinal') {
    var conRencor = enemySide.characters.filter(function(c){ return !c.dead && c.states && c.states.rencor > 0; });
    if (!conRencor.length) preview.notes.push('❌ Ningún enemigo tiene Rencor');
    else {
      var totalRetr = conRencor.reduce(function(acc, c){ return acc + 3 + Math.max(0, c.states.rencor - 1); }, 0);
      preview.notes.push('💢 Afecta a ' + conRencor.length + ' enemigo(s) con Rencor (' + totalRetr + ' daño total)');
    }
  }

  if (ability.kind === 'degradacion') {
    var selfDeg = 2 + (active.manuelStacks || 0);
    preview.selfDamage = selfDeg;
    preview.notes.push('🩸 Autodaño: ' + selfDeg);
  }

  if (ability.kind === 'decadencia') {
    preview.notes.push('📈 +1 stack (Degradación: +1 daño, -1 coste)');
  }

  if (ability.kind === 'optimizacion') preview.notes.push('🏛️ Coloca estructura (2 rondas): +2 daño aliados, 1 daño final de ronda + marca comprensión');
  if (ability.kind === 'obraMaestra') {
    var hasOpt = side.structures && side.structures.some(function(st){ return st.kind === 'optimizacion'; });
    if (hasOpt) preview.notes.push('💥 Definitivas x2 daño (2 rondas)');
    else preview.notes.push('❌ Requiere estructura Optimización en campo');
  }
  if (ability.kind === 'penitencia') preview.notes.push('🩸 Entra en Castigada');
  if (ability.kind === 'bajoAlas') preview.notes.push('💔 Aliado con menos vida → Vulnerable');
  if (ability.kind === 'impulso') preview.notes.push('💪 +2 al siguiente ataque normal; pasa a reserva');
  if (ability.kind === 'contraofensiva' && csHasState(active, 'furia')) {
    preview.notes.push('🔥 Furia activa');
  }
  if (ability.kind === 'reescritura') preview.notes.push('📜 Restaura apoyo propio / destruye apoyo enemigo');
  if (ability.kind === 'canon') preview.notes.push('📜 Roba hasta 3 apoyos y activa los del campo');

  // Cálculo de autodaño / muerte propia
  var selfTot = preview.selfDamage + preview.reflectDmg;
  if (selfTot > 0) preview.activeHpAfter = Math.max(0, active.hp - selfTot);
  preview.willDieFromSelf = preview.activeHpAfter <= 0 && selfTot > 0;
  if (preview.shieldSelf > 0) preview.activeShieldAfter = preview.activeShieldBefore + preview.shieldSelf;

  if (ability.kind === 'finComienzo') {
    var condenaNow = (active.states && active.states.condena) || 0;
    preview.baseDmg = condenaNow;
    preview.piercing = true;
    preview.trueDmg = condenaNow;
    preview.targetHpAfter = Math.max(0, preview.targetHpBefore - condenaNow);
    preview.willKill = preview.targetHpAfter <= 0;
    if (condenaNow === 0) {
      preview.willDieFromSelf = true;
      preview.notes.push('⚠️ Sin condena: no infliges daño y mueres');
    } else {
      preview.notes.push('🔻 Daño = condena (' + condenaNow + ') penetrante');
      preview.notes.push('💀 Si el objetivo sobrevive, Alaya muere');
    }
    preview.notes.push('🏷️ Marca con redención a TODOS los enemigos vivos');
  }

  if (ability.kind === 'ojoPorOjo') {
    var cP = countCruzMadera(side);
    preview.notes.push('✝️ ' + cP + ' cruz(es) en campo → +' + cP + ' daño');
  }
  if (ability.kind === 'minutoSilencio') {
    preview.notes.push('🔮 +2 escudo; se desvanece al final de la ronda');
    preview.notes.push('✝️ Si el escudo es golpeado: Cruz de Madera');
  }
  if (ability.kind === 'diosTeAmpare') {
    var cPP = countCruzMadera(combatState.player), cBB = countCruzMadera(combatState.bot);
    var totC = cPP + cBB;
    var resN = enemySide.characters.filter(function(c, i){ return !c.dead && i !== enemySide.activeIndex; }).length;
    preview.notes.push('💥 Destruye ' + totC + ' Cruz(es) de Madera en el campo');
    preview.notes.push('💥 ' + totC + ' daño a ' + resN + ' enemigo(s) en reserva');
  }
  if (ability.kind === 'conversionPsicologica') {
    var invNow = (active.states && active.states.invulnerabilidad) || 0;
    preview.notes.push('🛡️ Invulnerabilidad: ' + invNow + ' → ' + Math.min(3, invNow + 1));
    var totalStolenEnergy = 0;
    var ownSide = (combatState.player.characters.indexOf(active) >= 0) ? combatState.player : combatState.bot;
    ownSide.characters.forEach(function(a){ if (a !== active && !a.dead && a.energy > 0) totalStolenEnergy += a.energy; });
    if (totalStolenEnergy === 0) preview.notes.push('🔮 No hay energía que robar');
    else {
      var roomE = Math.max(0, active.maxEnergy - active.energy);
      var gainE = Math.min(roomE, totalStolenEnergy);
      var overE = totalStolenEnergy - gainE;
      if (gainE > 0) preview.notes.push('🔮 +' + gainE + ' energía (total: ' + (active.energy + gainE) + '/' + active.maxEnergy + ')');
      if (overE > 0) preview.notes.push('🔮 ' + overE + ' sobrante → ' + overE + ' dado(s) de ilusión');
    }
  }
  if (ability.kind === 'omnesDeam') {
    var ultNow = (ownSide && ownSide.alterUltBuff) ? (ownSide.alterUltBuff.amount || 0) : 0;
    preview.notes.push('💥 +3 daño a elementales del equipo durante 2 rondas (total: +' + (ultNow + 3) + ')');
  }

  if (ability.kind === 'scratch') {
    if (combatState.environment && combatState.environment.id === 'sobrecarga_epileptica') preview.notes.push('⚡ +1 daño por Sobrecarga Epiléptica');
    var hasMesaPrev = side.structures && side.structures.some(function(s){ return s.kind === 'mesaDJ'; });
    if (hasMesaPrev) preview.notes.push('🎧 Mesa de DJ: +1 daño · coste 2 ilusión + 1 cualquiera');
  }
  if (ability.kind === 'remix') {
    var hasMesaPrev2 = side.structures && side.structures.some(function(s){ return s.kind === 'mesaDJ'; });
    if (hasMesaPrev2) preview.notes.push('🎭 Mesa de DJ ya activa → marca al enemigo con Ilusión');
    else preview.notes.push('🎧 Coloca Mesa de DJ (2 rondas)');
  }
  if (ability.kind === 'killerTunes') {
    preview.notes.push('🌍 Establece entorno: Sobrecarga Epiléptica (2 rondas)');
    preview.notes.push('🎵 Cambios de personaje del equipo → 1 daño al enemigo (resto de ronda)');
  }

  // ✅ María (base)
  if (ability.kind === 'cosecha') {
    var cosechaCounterP = (active.states && active.states.cosechaCounter) || 0;
    if (cosechaCounterP === 0) {
      preview.notes.push('🌻 Primera Cosecha de la ronda: solo 1 daño');
    } else {
      preview.notes.push('🌻 Repetición #' + (cosechaCounterP + 1) + ': 1 daño + cura 1 HP');
      var cosechaHealP = getMariaTarget(side, active);
      if (cosechaHealP < 0) {
        preview.notes.push('⚠️ Sin otros aliados vivos: no hay curación');
      } else {
        preview.notes.push('💚 ' + side.characters[cosechaHealP].character.name + ' +1 HP');
      }
    }
  }
  if (ability.kind === 'caricia') {
    var ctT = getMariaTarget(side, active);
    var ctNoOne = (ctT < 0) || (side.characters[ctT].hp >= side.characters[ctT].maxHp);
    if (!ctNoOne) {
      var ctCs = side.characters[ctT];
      preview.notes.push('💚 Cura 3 HP a ' + ctCs.character.name + ' (' + ctCs.hp + '/' + ctCs.maxHp + ')');
    } else {
      preview.notes.push('💚 Sin aliados a los que curar → María se cura 2 HP y marca al enemigo con Aceptación');
    }
  }
  if (ability.kind === 'amor') {
    var fallenP = null;
    if (side.lastDeadAlly) fallenP = side.characters.find(function(c){ return c.id === side.lastDeadAlly && c.dead; });
    if (!fallenP) fallenP = side.characters.find(function(c){ return c.dead; });
    if (fallenP) {
      preview.notes.push('✝️ Revive a ' + fallenP.character.name + ' con 3 HP (máx. 5)');
    } else {
      preview.notes.push('⚠️ Sin aliado caído: solo se establece el entorno');
    }
    preview.notes.push('🌻 Coloca/refresca Campo de Girasoles (2 rondas)');
  }

  // ✅ EX-María
  if (ability.kind === 'rocePosible') {
    var rcP = (active.states && active.states.roceCounter) || 0;
    preview.notes.push('⏳ Daño diferido al final de la ronda: ' + (1 + rcP) + ' HP al enemigo activo');
    if (rcP > 0) preview.notes.push('🔁 Repetición #' + (rcP + 1) + ' (+' + rcP + ' daño, +' + rcP + ' dado cualquiera)');
  }
  if (ability.kind === 'amorVerdadero') {
    preview.notes.push('🏷️ Marca al enemigo con Aceptación');
    preview.notes.push('⚖️ Al final de la ronda: ambos marcados o ambos sin marca → +2 HP a María; solo uno → -1 HP');
    preview.notes.push('💀 Si el enemigo muere antes, no se resuelve');
  }
  if (ability.kind === 'amorSuficiente') {
    var blockedEx = false;
    if (active.hp <= 1) blockedEx = true;
    if (!side.characters.some(function(c){ return c.dead; })) blockedEx = true;
    if (blockedEx) { playSound('error'); var bU2 = document.getElementById('ultimateBtn'); if (bU2) { bU2.classList.add('shake'); setTimeout(function(){ bU2.classList.remove('shake'); }, 400); } return; }
  }

  return preview;
}
function buildPreviewBodyHTML(preview) {
  var html = '<div class="confirm-body">';
  if (preview.rawDmg > 0 || preview.trueDmg > 0) {
    var hasB = preview.buffDmg || preview.cardBonus || preview.equipDmg || preview.supportDmg || preview.optimizationDmg || preview.erikBonus || preview.markBonus || preview.redencionDmg || preview.obraMaestraDmg || preview.carrerillaBonus || preview.alterBuffDmg;
    if (hasB) {
      html += '<div class="confirm-row"><span class="confirm-row-label">Daño base</span><span class="confirm-row-value damage">' + preview.baseDmg + '</span></div>';
      if (preview.buffDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Impulso</span><span class="confirm-row-value bonus">+' + preview.buffDmg + '</span></div>';
      if (preview.cardBonus) html += '<div class="confirm-row"><span class="confirm-row-label">+ Carta</span><span class="confirm-row-value bonus">+' + preview.cardBonus + '</span></div>';
      if (preview.equipDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Equipo</span><span class="confirm-row-value bonus">+' + preview.equipDmg + '</span></div>';
      if (preview.supportDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Apoyos</span><span class="confirm-row-value bonus">+' + preview.supportDmg + '</span></div>';
      if (preview.optimizationDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Optimización</span><span class="confirm-row-value bonus">+' + preview.optimizationDmg + '</span></div>';
      if (preview.obraMaestraDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Obra Maestra</span><span class="confirm-row-value bonus">+' + preview.obraMaestraDmg + '</span></div>';
      if (preview.erikBonus) html += '<div class="confirm-row"><span class="confirm-row-label">+ Inspiración</span><span class="confirm-row-value bonus">+' + preview.erikBonus + '</span></div>';
      if (preview.alterBuffDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Omnes Deam</span><span class="confirm-row-value bonus">+' + preview.alterBuffDmg + '</span></div>';
      if (preview.redencionDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Redención</span><span class="confirm-row-value bonus">+' + preview.redencionDmg + '</span></div>';
      if (preview.markBonus) html += '<div class="confirm-row"><span class="confirm-row-label">+ Marca</span><span class="confirm-row-value bonus">+' + preview.markBonus + '</span></div>';
            if (preview.carrerillaBonus) html += '<div class="confirm-row"><span class="confirm-row-label">+ Carrerilla</span><span class="confirm-row-value bonus">+' + preview.carrerillaBonus + '</span></div>';
    } else {
      html += '<div class="confirm-row"><span class="confirm-row-label">Daño base</span><span class="confirm-row-value damage">' + preview.baseDmg + '</span></div>';
    }
    if (preview.flatReduction) html += '<div class="confirm-row"><span class="confirm-row-label">− Reducción</span><span class="confirm-row-value shield">−' + preview.flatReduction + '</span></div>';
    if (!preview.piercing && preview.shieldAbsorbed > 0) html += '<div class="confirm-row"><span class="confirm-row-label">− Escudo absorbe</span><span class="confirm-row-value shield">−' + preview.shieldAbsorbed + '</span></div>';
    html += '<div class="confirm-row"><span class="confirm-row-label">Daño verdadero</span><span class="confirm-row-value true-dmg">' + preview.trueDmg + '</span></div>';
  }
  if (preview.healApplied > 0) html += '<div class="confirm-row"><span class="confirm-row-label">Curación propia</span><span class="confirm-row-value heal">+' + preview.healApplied + ' HP</span></div>';
  if (preview.shieldSelf) html += '<div class="confirm-row"><span class="confirm-row-label">Escudo propio</span><span class="confirm-row-value shield">+' + preview.shieldSelf + '</span></div>';
  if (preview.selfDamage) html += '<div class="confirm-row"><span class="confirm-row-label">Autodaño</span><span class="confirm-row-value damage">−' + preview.selfDamage + ' HP</span></div>';
  if (preview.reflectDmg) html += '<div class="confirm-row"><span class="confirm-row-label">Trampa refleja</span><span class="confirm-row-value damage">−' + preview.reflectDmg + ' HP</span></div>';
  if (preview.condenaGain) html += '<div class="confirm-row"><span class="confirm-row-label">+ Condena</span><span class="confirm-row-value bonus">+' + preview.condenaGain + '</span></div>';
  html += '</div>';
  if (preview.notes && preview.notes.length) html += '<div style="margin-top: 0.5rem; padding: 0.6rem 0.8rem; background: rgba(240,200,96,0.08); border: 1px solid rgba(240,200,96,0.25); border-radius: 8px; font-size: 0.78rem; line-height: 1.5;">' + preview.notes.join(' · ') + '</div>';
  if (preview.willKill) html += '<div class="confirm-warning">💀 ¡Eliminará a ' + preview.target.character.name + '!</div>';
  if (preview.willDieFromSelf) html += '<div class="confirm-warning">💀 ¡' + preview.active.character.name + ' morirá tras usar esta habilidad!</div>';
  return html;
}
function showActionConfirmation(actionType, ability, onConfirm) {
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent'); if (!ov || !content) return;
  hideTooltip();
  var side = getTurnSide(); if (!side) return;
  var active = side.characters[side.activeIndex];
  var effCost = getEffectiveCostFull(active, ability);
  var totalCost = sumCost(effCost);
  var autoIds = autoSelectDiceForCost(effCost, { targetElement: active ? active.character.element : null });
  var selectedIds = {}; autoIds.forEach(function(id){ selectedIds[id] = true; });
  var typeIcon = actionType === 'normal' ? '⚔️' : (actionType === 'elemental' ? '🔮' : '💥');
  var typeName = actionType === 'normal' ? 'Ataque Normal' : (actionType === 'elemental' ? 'Habilidad Elemental' : 'Habilidad Definitiva');
  var preview = previewPlayerAction(actionType);
  function getSel(){ return side.dice.filter(function(d){ return selectedIds[d.id]; }); }
  function build() {
    var sc = Object.keys(selectedIds).length, isFull = sc === totalCost;
    var isComplete = totalCost === 0 || (isFull && trySpendDice(getSel(), effCost).ok);
    var html = '<div class="confirm-title">' + typeIcon + ' ' + typeName + '</div><div class="confirm-subtitle">' + ability.name + '</div>';
    html += '<div class="confirm-cost-section"><div class="confirm-cost-label">Coste requerido</div><div class="confirm-cost-dice">';
    if (totalCost === 0) html += '<span class="die die-energy">Sin coste</span>';
    if (effCost.any) html += '<span class="die die-any">🎲 <b>×' + effCost.any + '</b></span>';
    if (effCost.same) html += '<span class="die die-any">🎲 <b>×' + effCost.same + ' iguales</b></span>';
    Object.keys(effCost).forEach(function(k){ if (k === 'any' || k === 'same') return; html += '<span class="die" style="--dc:' + ELEMENT_COLORS[k] + ';">' + ELEMENT_EMOJI[k] + ' <b>×' + effCost[k] + '</b></span>'; });
    if (ability.energyCost && !active.cardNextAbilityFree) html += '<span class="die die-energy">⚡ <b>×' + ability.energyCost + '</b></span>';
    html += '</div></div>';
    if (totalCost > 0) {
      var dh = ''; sortDiceForDisplay(side.dice, side).forEach(function(d){ var col = d.type === 'omni' ? '240, 200, 96' : ELEMENT_COLORS[d.type]; var em = d.type === 'omni' ? '✨' : ELEMENT_EMOJI[d.type]; var sel = selectedIds[d.id], lk = !sel && isFull; var cls = 'confirm-die'; if (sel) cls += ' selected'; if (lk) cls += ' locked'; dh += '<div class="' + cls + '" data-die-id="' + d.id + '" style="--dc: ' + col + ';">' + em + '</div>'; });
      html += '<div class="confirm-dice-picker"><div class="confirm-dice-label"><span>Selecciona dados</span><span class="confirm-dice-count' + (isFull ? ' is-complete' : '') + '">' + sc + ' / ' + totalCost + '</span></div><div class="confirm-dice-pool">' + dh + '</div></div>';
      if (!isComplete) html += '<div class="confirm-valid-msg error">Selecciona ' + (totalCost - sc) + ' dado(s) más</div>';
    }
    if (preview) html += buildPreviewBodyHTML(preview);
    html += '<div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="confirmCancelBtn">Cancelar</button><button class="confirm-btn confirm-accept" id="confirmAcceptBtn"' + (!isComplete ? ' disabled' : '') + '>Ejecutar</button></div>';
    content.innerHTML = html;
    var picker = content.querySelector('.confirm-dice-pool');
    if (picker) picker.addEventListener('click', function(e){ var de = e.target.closest('.confirm-die'); if (!de || de.classList.contains('locked')) return; var id = de.dataset.dieId; if (selectedIds[id]) { delete selectedIds[id]; playSound('deselect'); } else { if (Object.keys(selectedIds).length >= totalCost) { playSound('error'); return; } selectedIds[id] = true; playSound('select'); } build(); });
    document.getElementById('confirmCancelBtn').addEventListener('click', function(){ hideConfirmation(); playSound('deselect'); });
    var ab = document.getElementById('confirmAcceptBtn');
    if (ab && !ab.disabled) ab.addEventListener('click', function(){ var fd = getSel(); if (totalCost > 0) { var t = trySpendDice(fd, effCost); if (!t.ok) return; } hideConfirmation(); playSound('confirm'); onConfirm(fd); });
  }
  build(); ov.classList.add('show');
}
function playerActionRequest(actionType) {
  if (!combatState || combatState.phase !== 'playing') return;
  if (!canHumanControlCurrentTurn()) return;
  if (isTurnDone()) return;
  // (El botón EX del sidebar ya no se usa: la EX se elige en combatStartConfirm)
  if (actionType === 'ex') { playSound('error'); return; }
  var turnKey = getTurnKey();
  var side = combatState[turnKey];
  var active = side.characters[side.activeIndex]; if (!active || active.dead) return;
  var ability = active.character.abilities[actionType]; if (!ability) return;
  if (ability.kind === 'obraMaestra') {
    var hasOptim = side.structures && side.structures.some(function(st){ return st.kind === 'optimizacion'; });
    if (!hasOptim) { playSound('error'); var btnIdU = actionType === 'ultimate' ? 'ultimateBtn' : (actionType === 'elemental' ? 'elementalBtn' : 'normalBtn'); var bU = document.getElementById(btnIdU); if (bU) { bU.classList.add('shake'); setTimeout(function(){ bU.classList.remove('shake'); }, 400); } return; }
  }
  if (ability.kind === 'amorSuficiente') {
    var blockedEx = false;
    if (active.hp <= 1) blockedEx = true;
    if (!side.characters.some(function(c){ return c.dead; })) blockedEx = true;
    if (blockedEx) { playSound('error'); var bU2 = document.getElementById('ultimateBtn'); if (bU2) { bU2.classList.add('shake'); setTimeout(function(){ bU2.classList.remove('shake'); }, 400); } return; }
  }
  if (ability.energyCost && active.energy < ability.energyCost && !active.cardNextAbilityFree) { playSound('error'); return; }
  var effCost = getEffectiveCostFull(active, ability);
  if (sumCost(effCost) > 0 && !trySpendDice(side.dice, effCost).ok) {
    playSound('error');
    var btnId = actionType === 'normal' ? 'normalBtn' : (actionType === 'elemental' ? 'elementalBtn' : 'ultimateBtn');
    var btn = document.getElementById(btnId); if (btn) { btn.classList.add('shake'); setTimeout(function(){ btn.classList.remove('shake'); }, 400); }
    return;
  }
  showActionConfirmation(actionType, ability, function(selectedDice){
    var spentIds = {}; selectedDice.forEach(function(d){ spentIds[d.id] = true; });
    side.dice = side.dice.filter(function(d){ return !spentIds[d.id]; });
    renderCombat(); executeAction(turnKey, actionType, selectedDice);
  });
}

function showChangeConfirmation(targetIndex, onConfirm) {
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent'); if (!ov || !content) return;
  hideTooltip();
  var turnKey = getTurnKey();
  var side = combatState[turnKey];
  var rules = getChangeRulesForTarget(turnKey, targetIndex), diceCost = rules.diceCost;
  var newChar = side.characters[targetIndex];
  var oldChar = side.characters[side.activeIndex];
  var newCol = ELEMENT_COLORS[newChar.character.element];
  var selectedIds = {};
  if (diceCost > 0) { var auto = autoSelectDiceForCost({ any:diceCost }, { targetElement:newChar.character.element }); auto.forEach(function(id){ selectedIds[id] = true; }); }
  function getSel(){ return side.dice.filter(function(d){ return selectedIds[d.id]; }); }
  function build() {
    var sc = Object.keys(selectedIds).length;
    var isComplete = diceCost === 0 || (sc === diceCost && trySpendDice(getSel(), { any:diceCost }).ok);
    var html = '<div class="confirm-title">🔄 Cambio de Personaje</div>';
    html += '<div class="confirm-subtitle">' + oldChar.character.name + ' → ' + newChar.character.name + '</div>';
    html += '<div class="confirm-target" style="background: rgba(' + newCol + ', 0.1);"><span style="font-size: 1.2rem;">' + newChar.character.emoji + '</span>Nuevo activo: <b>' + newChar.character.name + '</b><span class="confirm-target-sub">' + ELEMENT_EMOJI[newChar.character.element] + ' ' + ELEMENT_NAMES[newChar.character.element] + '</span></div>';
    if (diceCost > 0) {
      html += '<div class="confirm-cost-section"><div class="confirm-cost-label">Coste requerido</div><div class="confirm-cost-dice"><span class="die die-any">🎲 <b>×' + diceCost + '</b></span></div></div>';
      var dh = ''; sortDiceForDisplay(side.dice, side).forEach(function(d){ var col = d.type === 'omni' ? '240, 200, 96' : ELEMENT_COLORS[d.type]; var em = d.type === 'omni' ? '✨' : ELEMENT_EMOJI[d.type]; var sel = selectedIds[d.id], lk = !sel && sc >= diceCost; var cls = 'confirm-die'; if (sel) cls += ' selected'; if (lk) cls += ' locked'; dh += '<div class="' + cls + '" data-die-id="' + d.id + '" style="--dc: ' + col + ';">' + em + '</div>'; });
      html += '<div class="confirm-dice-picker"><div class="confirm-dice-label"><span>Selecciona dados</span><span class="confirm-dice-count' + (sc === diceCost ? ' is-complete' : '') + '">' + sc + ' / ' + diceCost + '</span></div><div class="confirm-dice-pool">' + dh + '</div></div>';
      if (isComplete) html += '<div class="confirm-valid-msg ok">✓ Coste cubierto</div>';
      else if (sc === diceCost) html += '<div class="confirm-valid-msg error">✕ Selección no válida</div>';
      else html += '<div class="confirm-valid-msg error">Selecciona ' + (diceCost - sc) + ' dado(s) más</div>';
    } else {
      html += '<div class="confirm-body" style="margin-top: 0.8rem;"><strong style="color: var(--accent);">Cambio gratuito</strong> por consonancia de Transformación.</div>';
    }
    if (newChar.id === 'jose') html += '<div class="confirm-body" style="margin-top: 0.4rem; font-size: 0.8rem; color: var(--accent);">🦋 Jose se considera Acelerado hasta terminar su acción.</div>';
    html += '<div class="confirm-body"><div class="confirm-hp-change"><div class="confirm-hp-box"><div class="confirm-hp-value">' + newChar.hp + '/' + newChar.maxHp + '</div><div class="confirm-hp-label">HP</div></div><div class="confirm-hp-arrow">·</div><div class="confirm-hp-box"><div class="confirm-hp-value" style="color: var(--accent);">' + newChar.energy + '/' + newChar.maxEnergy + '</div><div class="confirm-hp-label">Energía</div></div></div>';
    html += '<div class="confirm-rows">';
    if (rules.quick) html += '<div class="confirm-row"><span class="confirm-row-label">Tipo</span><span class="confirm-row-value bonus">Acción Rápida (no pasa turno)</span></div>';
    else html += '<div class="confirm-row"><span class="confirm-row-label">Tipo</span><span class="confirm-row-value">Pasa turno</span></div>';
    html += '</div></div>';
    html += '<div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="confirmCancelBtn">Cancelar</button><button class="confirm-btn confirm-accept" id="confirmAcceptBtn"' + (!isComplete ? ' disabled' : '') + '>Cambiar</button></div>';
    content.innerHTML = html;
    var picker = content.querySelector('.confirm-dice-pool');
    if (picker) picker.addEventListener('click', function(e){ var de = e.target.closest('.confirm-die'); if (!de || de.classList.contains('locked')) return; var id = de.dataset.dieId; if (selectedIds[id]) { delete selectedIds[id]; playSound('deselect'); } else { if (Object.keys(selectedIds).length >= diceCost) { playSound('error'); return; } selectedIds[id] = true; playSound('select'); } build(); });
    document.getElementById('confirmCancelBtn').addEventListener('click', function(){ hideConfirmation(); playSound('deselect'); });
    var ab = document.getElementById('confirmAcceptBtn');
    if (ab && !ab.disabled) ab.addEventListener('click', function(){ var fd = getSel(); if (diceCost > 0) { var t = trySpendDice(fd, { any:diceCost }); if (!t.ok) return; } hideConfirmation(); playSound('confirm'); onConfirm(fd); });
  }
  build(); ov.classList.add('show');
}
function playerChangeCharacterRequest(targetIndex) {
  if (!combatState || combatState.phase !== 'playing') return;
  if (!canHumanControlCurrentTurn()) return;
  if (isTurnDone()) return;
  var turnKey = getTurnKey();
  var side = combatState[turnKey];
  if (side.activeIndex === targetIndex) {
    if (typeof renderCombat === 'function') renderCombat();
    return;
  }
  if (side.characters[targetIndex].dead) return;
  var rules = getChangeRulesForTarget(turnKey, targetIndex);
  if (rules.diceCost > 0 && !trySpendDice(side.dice, { any:rules.diceCost }).ok) { playSound('error'); return; }
  showChangeConfirmation(targetIndex, function(selectedDice){
    if (rules.diceCost > 0) { var spentIds = {}; selectedDice.forEach(function(d){ spentIds[d.id] = true; }); side.dice = side.dice.filter(function(d){ return !spentIds[d.id]; }); }
    if (rules.discounted) side.firstChangeUsed = true;
    var oldN = side.characters[side.activeIndex].character.name;
    var newN = side.characters[targetIndex].character.name;
    var oldChar = side.characters[side.activeIndex];
    if (oldChar.id === 'jose') csSetState(oldChar, 'acelerado', false);
    side.activeIndex = targetIndex;
    hungerOnEnter(turnKey, side.characters[targetIndex], oldChar);
    if (side.characters[targetIndex].id === 'jose') csSetState(side.characters[targetIndex], 'acelerado', true);
    // ✅ EX de Google: al cambiar desde Google, el nuevo activo gana 1 escudo
    applyGoogleExOnChange(oldChar, side, targetIndex, turnKey);
    var sfx = rules.quick ? ' (acción rápida)' : (rules.discounted ? ' (gratis)' : '');
    var sfx = rules.quick ? ' (acción rápida)' : (rules.discounted ? ' (gratis)' : '');
    var label = combatState.pvp ? (turnKey === 'player' ? 'J1' : 'J2') : 'Tú';
    logCombat('🔄 ' + label + ': ' + oldN + ' → ' + newN + sfx);
    if (typeof triggerKillerTunesDamage === 'function') triggerKillerTunesDamage(turnKey);
    playSound('change'); renderCombat();
    if (!rules.quick) setTimeout(nextTurn, 400);
  });
}
