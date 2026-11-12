// ✅ Con el nuevo orden (select → roll), la consonancia de Ilusión debe
// aplicarse también en la tirada inicial del jugador, porque ya se conoce
// el personaje activo. El parámetro `first` se mantiene por compatibilidad
// pero ya no bloquea la Ilusión.
function rollDiceForSide(who, first){
  var s = combatState[who];
  var baseCount = 8;
  // ✅ Vittoria: pasiva + EX modifican el número de dados
  var vittoriaCs = s.characters.find(function(c){ return c.id === 'vittoria'; });
  if (vittoriaCs) {
    var deadAllies = s.characters.filter(function(c){ return c !== vittoriaCs && c.dead; }).length;
    var mods = [];
    if (deadAllies >= 2) { baseCount -= 3; mods.push('-3 (pasiva ambos aliados)'); }
    else if (deadAllies === 1) { baseCount -= 1; mods.push('-1 (pasiva 1 aliado)'); }
    if (!vittoriaCs.dead && vittoriaCs.exActive) { baseCount += 1; mods.push('+1 (EX)'); }
    if (mods.length) logCombat('👑 Vittoria: ' + mods.join(' · ') + ' → ' + Math.max(1, baseCount) + ' dados');
  }
  s.dice = rollCombatDice(Math.max(1, baseCount));
  applyIlusion(s, who);
  if (who === 'bot' && !combatState.pvp && typeof botMaybeReroll === 'function') {
    botMaybeReroll();
  }
}
function applyIlusion(side, who) {
  var c = side.consonance;
  if (!c || c.type !== 'single' || c.element !== 'ilusion') return;
  var active = side.characters[side.activeIndex];
  if (!active || active.dead) return;
  var el = active.character.element;
  var need = (c.level === 3) ? 4 : 2;
  var valid = 0;
  side.dice.forEach(function(d){ if (d.type === el || d.type === 'omni') valid++; });
  var miss = need - valid;
  if (miss <= 0) return;
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
  if (startBtn) startBtn.disabled = true;
  var rrB = document.getElementById('rollRerollBtn');
  if (rrB) rrB.disabled = true;
  renderRollOverlay();
  setTimeout(function(){
    if (!combatState) return;
    combatState[sideKey].isRollingAnim = false;
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
  else {
    if (!combatState.pvp && combatState.firstDeclarer) {
      combatState.turn = combatState.firstDeclarer;
      combatState.firstDeclarer = null;
    }
    beginRoundPlay();
  }
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
  var col = ELEMENT_COLORS[cd.element];
  var vis = ['normal','elemental','ultimate','passive','ex'];
  var abh = '';
  var order = { normal:0, elemental:1, ultimate:2, passive:3, ex:4 };
  var sorted = cd.abilities.slice().sort(function(a, b){ return (order[a.type] || 99) - (order[b.type] || 99); });
  sorted.forEach(function(ab){
    if (vis.indexOf(ab.type) === -1) return;
    var brd;
    if (ab.type === 'ultimate')      brd = 'rgba(240,200,96,0.9)';
    else if (ab.type === 'passive')  brd = 'rgba(165,131,255,0.85)';
    else if (ab.type === 'ex')       brd = 'rgba(240,200,96,1)';
    else                             brd = 'rgba(' + col + ', 0.6)';
    abh += '<div class="ht-ab-item" style="border-left-color: ' + brd + '; background: rgba(255,255,255,0.04); padding: 0.8rem 1rem; margin-bottom: 0.7rem; border-radius: 10px;">';
    abh += buildAbilityInfoHTML(cs.id, ab);
    abh += '</div>';
  });
  var html = '<div class="select-detail-inner" style="--el: ' + col + ';">';
  html += '<div class="select-detail-portrait" data-fallback="' + cd.emoji + '"><img src="img/' + cs.id + '.png" alt="' + cd.name + '" style="width:100%; height:100%; object-fit:cover; border-radius:14px;" onerror="this.style.display=\'none\';"><div style="position:absolute; bottom:10px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.85); padding: 0.25rem 0.8rem; border-radius: 20px; font-weight: 800; font-size: 0.8rem; color: rgb(' + col + '); border: 1px solid rgba(' + col + ', 0.6); white-space: nowrap; z-index: 3;">❤️ ' + cs.hp + '/' + cs.maxHp + ' HP</div></div>';
  html += '<div class="select-detail-info"><div style="font-size: 0.75rem; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: rgb(' + col + '); margin-bottom: 0.6rem;">' + ELEMENT_EMOJI[cd.element] + ' ' + ELEMENT_NAMES[cd.element] + ' · ' + (cd.category || cd.set) + '</div>';
  html += '<h2 style="font-size: 2rem; font-weight: 900; margin-bottom: 0.5rem; background: linear-gradient(90deg, #fff, rgb(' + col + ')); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.02em;">' + cd.name + '</h2>';
  html += '<p style="color: var(--muted); font-style: italic; font-size: 0.88rem; line-height: 1.6; margin-bottom: 1.2rem; border-left: 2px solid rgba(' + col + ', 0.4); padding-left: 0.8rem;">"' + cd.concept + '"</p>';
  html += '<div style="max-height: 440px; overflow-y: auto; padding-right: 0.4rem; scrollbar-width: thin;">' + abh + '</div></div></div>';
  html += '<div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: center; flex-wrap: wrap;"><button class="btn btn-outline" id="selectBackBtn" style="padding: 0.8rem 2rem;">← Volver</button><button class="btn" id="selectConfirmBtn" style="padding: 0.8rem 2.5rem;">✓ Comenzar con ' + cd.name + '</button></div>';
  d.innerHTML = html;
  d.classList.add('show');
  attachAbilityTermListeners(d, cs.id);
  document.getElementById('selectBackBtn').addEventListener('click', function(){ hideSelectDetail(); playSound('deselect'); });
  document.getElementById('selectConfirmBtn').addEventListener('click', function(){
    hideTooltip();
    var sk = combatState.turn;
    combatState[sk].activeIndex = idx;
    var who = combatState.pvp ? (sk === 'player' ? 'J1' : 'J2') : '';
    playSound('confirm');
    logCombat('🦋 ' + (who ? who + ' empieza' : 'Empiezas') + ' con ' + cs.character.name);
    hideSelectOverlay(); renderCombat();
    if (combatState.pvp && pvpSetupPhase) { advancePvpSetup(); return; }
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
    var csIdx = side.characters.indexOf(cs);
    cs.equipment.forEach(function(eqId){
      var eq = CARD_DB[eqId]; if (!eq || !eq.effect) return;
      var flashed = false;
      if (eq.effect.healPerRound) { var b = cs.hp; cs.hp = Math.min(cs.maxHp, cs.hp + eq.effect.healPerRound); if (cs.hp > b) { logCombat('🎴 ' + eq.name + ': +' + (cs.hp - b) + ' HP'); if (!flashed) { flashCharCard(who, csIdx, '+' + (cs.hp - b) + ' HP', '#7aff9a'); flashed = true; } } }
      if (eq.effect.energyPerRound) { var p = cs.energy; cs.energy = Math.min(cs.maxEnergy, cs.energy + eq.effect.energyPerRound); if (cs.energy > p) { logCombat('🎴 ' + eq.name + ': +' + (cs.energy - p) + ' energía'); if (!flashed) { flashCharCard(who, csIdx, '+' + (cs.energy - p) + ' ⚡', '#f0c860'); flashed = true; } } }
      if (eq.effect.elementDicePerRound && who === 'player') { for (var i = 0; i < eq.effect.elementDicePerRound; i++) side.dice.push({ type:cs.character.element, id:uid(), justAdded:true }); flashCharCard(who, csIdx, '+' + eq.effect.elementDicePerRound + ' 🎲', '#a583ff'); }
      if (eq.effect.elementDicePerRound && who === 'bot' && combatState.pvp) { for (var i2 = 0; i2 < eq.effect.elementDicePerRound; i2++) side.dice.push({ type:cs.character.element, id:uid(), justAdded:true }); flashCharCard(who, csIdx, '+' + eq.effect.elementDicePerRound + ' 🎲', '#a583ff'); }
    });
  });
}
function applySupportRoundStartEffects(who) {
  var side = combatState[who], active = side.characters[side.activeIndex];
  if (!side.supports) return;
  var _maxSupStart = (typeof getMaxSupports === 'function') ? getMaxSupports(who) : 4;
  for (var i = 0; i < _maxSupStart; i++) {
    var sp = side.supports[i]; if (!sp) continue;
    var card = CARD_DB[sp.cardId]; if (!card || !card.effect) continue;
    var e = card.effect;
    var suppSel = '#' + (who === 'player' ? 'player' : 'bot') + 'SupportsGrid .side-slot-filled[data-slot="' + i + '"]';
    var flashed = false;
    var _flashSupp = function(txt, col) { if (!flashed) { flashCombatElement(suppSel, txt, col); flashed = true; } };
    if (e.energyPerRound && active && !active.dead) { var p = active.energy; active.energy = Math.min(active.maxEnergy, active.energy + e.energyPerRound); if (active.energy > p) { logCombat('📜 ' + card.name + ': +' + (active.energy - p) + ' energía'); _flashSupp('+' + (active.energy - p) + ' ⚡', '#f0c860'); } }
    if (e.shieldPerRound && active && !active.dead) { addOrRefreshShield(active, 'support_' + card.id, e.shieldPerRound); logCombat('📜 ' + card.name + ': +' + e.shieldPerRound + ' escudo'); _flashSupp('+' + e.shieldPerRound + ' 🛡️', '#7ac8ff'); }
    if (e.teamShieldPerRound) { side.characters.forEach(function(c){ if (!c.dead) addOrRefreshShield(c, 'support_' + card.id, e.teamShieldPerRound); }); _flashSupp('🛡️ equipo', '#7ac8ff'); }
    if (e.teamEnergyPerRound) { side.characters.forEach(function(c){ if (!c.dead) c.energy = Math.min(c.maxEnergy, c.energy + e.teamEnergyPerRound); }); _flashSupp('⚡ equipo', '#f0c860'); }
    if (e.elementDiePerRound && who === 'player' && active && !active.dead) { for (var d = 0; d < e.elementDiePerRound; d++) side.dice.push({ type:active.character.element, id:uid(), justAdded:true }); _flashSupp('🎲', '#a583ff'); }
    if (e.omniDiePerRound && who === 'player') { for (var o = 0; o < e.omniDiePerRound; o++) side.dice.push({ type:'omni', id:uid(), justAdded:true }); _flashSupp('✨', '#f0c860'); }
    if (e.elementDiePerRound && who === 'bot' && combatState.pvp && active && !active.dead) { for (var d2 = 0; d2 < e.elementDiePerRound; d2++) side.dice.push({ type:active.character.element, id:uid(), justAdded:true }); _flashSupp('🎲', '#a583ff'); }
    if (e.omniDiePerRound && who === 'bot' && combatState.pvp) { for (var o2 = 0; o2 < e.omniDiePerRound; o2++) side.dice.push({ type:'omni', id:uid(), justAdded:true }); _flashSupp('✨', '#f0c860'); }
  }
}
function applySupportEndOfRoundEffects(who) {
  var side = combatState[who], active = side.characters[side.activeIndex];
  if (!side.supports) return;
  var _maxSupEnd = (typeof getMaxSupports === 'function') ? getMaxSupports(who) : 4;
  for (var i = 0; i < _maxSupEnd; i++) {
    var sp = side.supports[i]; if (!sp) continue;
    var card = CARD_DB[sp.cardId]; if (!card || !card.effect) continue;
    var e = card.effect;
    var suppSel = '#' + (who === 'player' ? 'player' : 'bot') + 'SupportsGrid .side-slot-filled[data-slot="' + i + '"]';
    var flashed = false;
    var _flashSupp = function(txt, col) { if (!flashed) { flashCombatElement(suppSel, txt, col); flashed = true; } };
    if (e.healPerRound && active && !active.dead) { var b = active.hp; active.hp = Math.min(active.maxHp, active.hp + e.healPerRound); if (active.hp > b) { logCombat('📜 ' + card.name + ': +' + (active.hp - b) + ' HP'); _flashSupp('+' + (active.hp - b) + ' HP', '#7aff9a'); } }
    if (e.drawPerRound && who === 'player') { for (var d = 0; d < e.drawPerRound; d++) drawFromDeck(who); _flashSupp('+1 🎴', '#a583ff'); }
    if (e.drawPerRound && who === 'bot' && combatState.pvp) { for (var d2 = 0; d2 < e.drawPerRound; d2++) drawFromDeck(who); _flashSupp('+1 🎴', '#a583ff'); }
    if (e.teamHealPerRound) { side.characters.forEach(function(cs){ if (!cs.dead) cs.hp = Math.min(cs.maxHp, cs.hp + e.teamHealPerRound); }); _flashSupp('+' + e.teamHealPerRound + ' equipo', '#7aff9a'); }
    sp.duration--; if (sp.duration <= 0) { logCombat('📜 ' + card.name + ' se desvanece'); side.supports[i] = null; }
  }

  // ✅ DAVID: Corona Dorada — 1 daño al portador si no hay David vivo en su equipo
  side.characters.forEach(function(c){
    if (c.dead || !c.equipment) return;
    if (c.equipment.indexOf('david_corona') < 0) return;
    var hasD = side.characters.some(function(x){ return x.id === 'david' && !x.dead; });
    if (!hasD) {
      dealDamageToChar(c, 1, { targetSide:side, targetSideKey:who, targetIdx:side.characters.indexOf(c) });
      logCombat('👑 Corona Dorada: 1 daño al portador (sin David en el equipo)');
    }
  });

  // ✅ ERIKXD: Cámara confiable — si está en reserva y tiene usos, 1 daño al enemigo activo
  side.characters.forEach(function(c){
    if (c.dead || !c.equipment) return;
    if (c.equipment.indexOf('erikxd_camara_confiable') < 0) return;
    if (!(c.states && c.states.cameraUsos > 0)) return;
    if (side.activeIndex === side.characters.indexOf(c)) return;
    var eKey = who === 'player' ? 'bot' : 'player';
    var eSide = combatState[eKey];
    var eActive = eSide.characters[eSide.activeIndex];
    if (eActive && !eActive.dead) {
      dealDamageToChar(eActive, 1, { targetSide:eSide, targetSideKey:eKey, targetIdx:eSide.activeIndex });
      c.states.cameraUsos -= 1;
      logCombat('📷 Cámara confiable (en reserva): 1 daño a ' + eActive.character.name + ' · usos: ' + c.states.cameraUsos);
      if (c.states.cameraUsos <= 0) {
        var ci = c.equipment.indexOf('erikxd_camara_confiable');
        if (ci >= 0) {
          c.equipment.splice(ci, 1);
          if (!side.discardPile) side.discardPile = [];
          side.discardPile.push('erikxd_camara_confiable');
          logCombat('📷 Cámara confiable agotada');
        }
      }
    }
  });
}
function applyStructureEndOfRoundEffects(who) {
  var side = combatState[who];
  if (!side || !side.structures || !side.structures.length) return;

  var enemySide = combatState[who === 'player' ? 'bot' : 'player'];
  var enemyKey  = who === 'player' ? 'bot' : 'player';

  function _flashStruct(idx, txt, col) {
    flashCombatElement(
      '#' + (who === 'player' ? 'player' : 'bot') + 'StructuresGrid .side-slot-filled[data-struct-slot="' + idx + '"]',
      txt, col
    );
  }

  for (var i = side.structures.length - 1; i >= 0; i--) {
    var st = side.structures[i];
    if (!st) continue;

    if (st.kind === 'optimizacion') {
      var ea = enemySide.characters[enemySide.activeIndex];
      if (ea && !ea.dead) {
        dealDamageToChar(ea, 1, { targetSide: enemySide, targetSideKey: enemyKey, targetIdx: enemySide.activeIndex });
        if (!ea.dead) triggerMarkOrResonance(ea, 'comprension', who, enemyKey, enemySide.activeIndex);
        logCombat('🏛️ Optimización: 1 daño y marca comprensión');
        _flashStruct(i, '−1 HP', '#ff8a98');
      }
      st.roundsActive = (typeof st.roundsActive === 'number' ? st.roundsActive : Math.max(0, 2 - st.duration)) + 1;
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
        _flashStruct(i, '−1 HP', '#ff8a98');
      }
      st.duration--;
      if (st.duration <= 0) { logCombat('🤖 Android se desvanece'); side.structures.splice(i, 1); }
    }

    if (st.kind === 'cruzSangre') continue;

    if (st.kind === 'metaQuest') {
      st.duration--;
      if (st.duration <= 0) { logCombat('📘 Meta Quest se desvanece'); side.structures.splice(i, 1); }
      else { _flashStruct(i, '📘', '#7ac8ff'); }
    }

    if (st.kind === 'mesaDJ') {
      try {
        var nxMesa = getNextAliveIndex(side, side.activeIndex);
        if (nxMesa >= 0 && nxMesa !== side.activeIndex) {
          side.activeIndex = nxMesa;
          logCombat('🎧 Mesa de DJ: ' + side.characters[nxMesa].character.name + ' pasa a activo');
          if (typeof triggerKillerTunesDamage === 'function') triggerKillerTunesDamage(who);
          if (typeof renderCombat === 'function') renderCombat();
        }
        st.duration--;
        if (st.duration <= 0) { logCombat('🎧 Mesa de DJ se desvanece'); side.structures.splice(i, 1); }
        else { _flashStruct(i, '🎧', '#a583ff'); }
      } catch (err) { console.error('[Mesa de DJ] Error:', err); }
    }

    if (st.kind === 'prisionEterea') {
      var eveCs = side.characters.find(function(c){ return c.id === 'eve' && !c.dead; });
      if (eveCs && eveCs.hp > 2) {
        var aliveAllies = side.characters.filter(function(c){ return c !== eveCs && !c.dead; });
        if (aliveAllies.length) {
          var toGive = Math.min(2, eveCs.hp - 1);
          if (aliveAllies.length === 1) {
            healChar(aliveAllies[0], toGive);
            eveCs.hp -= toGive;
          } else {
            var eachA = Math.floor(toGive / 2);
            healChar(aliveAllies[0], eachA);
            healChar(aliveAllies[1], toGive - eachA);
            eveCs.hp -= toGive;
          }
          logCombat('🔮 Prisión etérea: ' + toGive + ' HP repartidos');
        }
      }
      st.duration--;
      if (st.duration <= 0) { side.structures.splice(i, 1); }
    }

    // ✅ ERIKXD: Cámara profesional
    if (st.kind === 'camaraProfesional') {
      var erikxdCs = side.characters.find(function(c){ return c.id === 'erikxd' && !c.dead; });
      if (side.nostalgiaBaitActive) {
        enemySide.characters.forEach(function(c, idx){
          if (!c.dead) dealDamageToChar(c, 2, { targetSide:enemySide, targetSideKey:enemyKey, targetIdx:idx });
        });
        if (erikxdCs) dealDamageToChar(erikxdCs, 2, { targetSide:side, targetSideKey:who, targetIdx:side.characters.indexOf(erikxdCs) });
        logCombat('📸 Nostalgia-Bait: cámaras pegan a todos los enemigos (+2 cada uno) y ErikXD recibe 2');
      } else {
        var eaC = enemySide.characters[enemySide.activeIndex];
        if (eaC && !eaC.dead) dealDamageToChar(eaC, 1, { targetSide:enemySide, targetSideKey:enemyKey, targetIdx:enemySide.activeIndex });
      }
      if (erikxdCs) erikxdCs.energy = Math.min(erikxdCs.maxEnergy, erikxdCs.energy + 1);
      st.duration--;
      if (st.duration <= 0) { logCombat('📸 Cámara profesional desaparece'); side.structures.splice(i, 1); }
      else { _flashStruct(i, '📸', '#7ac8ff'); }
    }
  }
}
function beginRoundPlay() {
  if (!combatState) return;
  combatState.phase = 'playing';
  combatState.roundStarting = true;
  combatState.player.selected = {};
  combatState.bot.selected = {};
  combatState.player.anyAllyDiedThisRound = false;
  combatState.bot.anyAllyDiedThisRound = false;
  var activeSide = combatState.pvp ? combatState[combatState.turn] : combatState.player;
  var pc = activeSide.consonance, toast = null;
  if (pc) { if (pc.type === 'diverse') toast = '🌈 DIVERSO · +2 OMNIDADOS'; else toast = ELEMENT_EMOJI[pc.element] + ' ' + ELEMENT_NAMES[pc.element].toUpperCase() + ' · ' + pc.level + ' PERSONAJES'; }
  var bannerText = 'TU TURNO';
  if (combatState.pvp) bannerText = combatState.turn === 'player' ? 'TURNO JUGADOR 1' : 'TURNO JUGADOR 2';
  else if (combatState.turn === 'bot') bannerText = 'TURNO DEL RIVAL';
  showBanner(bannerText, 1400);
  renderCombat();
  var applyEff = function() {
    if (!combatState || combatState.phase === 'ended') return;
    ['player','bot'].forEach(function(wk){
      combatState[wk].characters.forEach(function(c){
        if (!c.dead) exHookRoundStart(c, wk);
        if (c.id === 'neon' && !c.dead) {
          var sdN = combatState[wk];
          if (sdN.activeIndex === sdN.characters.indexOf(c)) {
            var healedN = healChar(c, 4);
            if (healedN > 0) logCombat('🎆 Neón (pasiva): +' + healedN + ' HP');
          }
        }
        if (c.id === 'google' && !c.dead) {
          var sdG = combatState[wk];
          if (sdG.activeIndex === sdG.characters.indexOf(c)) {
            var teamElsG = computeTeamElements(sdG);
            var activeElG = c.character.element;
            var candidatesG = sdG.dice.filter(function(d){ return d.type !== 'omni'; });
            if (candidatesG.length) {
              var worstG = candidatesG.slice().sort(function(a, b){ return getDiePriority(a, teamElsG, activeElG) - getDiePriority(b, teamElsG, activeElG); })[0];
              if (worstG) { worstG.type = 'omni'; logCombat('🔍 Google (pasiva): dado menos relevante → omnidado'); }
            }
            csSetState(c, 'googleEndDamage', true);
          }
        }
        if (c.id === 'facebook' && !c.dead) {
          var sdF = combatState[wk];
          if (sdF.activeIndex === sdF.characters.indexOf(c)) {
            var teamElsF = computeTeamElements(sdF);
            var candidatesF = sdF.dice.filter(function(d){ return d.type !== 'aceptacion' && d.type !== 'omni'; });
            if (candidatesF.length) {
              var worstF = candidatesF.slice().sort(function(x, y){
                return getDiePriority(x, teamElsF, 'aceptacion') - getDiePriority(y, teamElsF, 'aceptacion');
              })[0];
              if (worstF) { worstF.type = 'aceptacion'; logCombat('📘 Facebook (pasiva): dado menos relevante → Aceptación'); }
            }
          }
        }
      });
    });
    if (combatState.round === 1) {
      ['player','bot'].forEach(function(wk){
        var mariaCs = combatState[wk].characters.find(function(c){ return c.id === 'maria' && !c.dead; });
        if (!mariaCs) return;
        var env = combatState.environment;
        if (!env || env.id !== 'campo_girasoles') { setEnvironment('campo_girasoles', mariaCs, wk); }
      });
    }
    var pm = applyRoundStartEffects('player'), bm = applyRoundStartEffects('bot');
    if (combatState.round === 1) { var cm = applyComprensionStart('player'); if (cm) pm.push(cm); var cmb = applyComprensionStart('bot'); if (cmb) bm.push(cmb); }
    applyEquipmentRoundStartEffects('player'); applyEquipmentRoundStartEffects('bot');
    if (!combatState.pvp && combatState.mode !== 'sandbox') {
      var _botDrawCount = (combatState.round === 1) ? 5 : 2;
      var _botDrawn = 0;
      for (var _bi = 0; _bi < _botDrawCount; _bi++) { if (drawFromDeck('bot')) _botDrawn++; }
      if (_botDrawn > 0) logCombat('🎴 El rival roba ' + _botDrawn + ' carta(s)');
      if (combatState.round === 1) botSmartMulligan();
    }
    applySupportRoundStartEffects('player'); applySupportRoundStartEffects('bot');
    combatState.player.characters.forEach(function(c){ if (c.states) c.states.acelerado = false; });
    combatState.bot.characters.forEach(function(c){ if (c.states) c.states.acelerado = false; });
    logCombat('⚔️ ¡Comienza el combate!'); pm.forEach(function(m){ logCombat(m); });
    ['player','bot'].forEach(function(wk){
      combatState[wk].characters.forEach(function(c){
        if (c.id === 'youtube' && c.states) c.states.ytEnteredThisRound = 0;
      });
    });
    ['player','bot'].forEach(function(wk){
      combatState[wk].characters.forEach(function(c){
        if (c.id === 'sage' && c.states) c.states.sageEnteredThisTurn = false;
      });
    });
    ['player','bot'].forEach(function(wk){
      var sd = combatState[wk];
      sd.characters.forEach(function(c){
        if (c.id !== 'youtube' || c.dead) return;
        var isActive = sd.activeIndex === sd.characters.indexOf(c);
        if (isActive && c.exActive && combatState.round > 1) {
          if (!c.states) c.states = {};
          c.states.ytPopFrozen = true;
          logCombat('📺 EX Money Money Money: popularidad congelada esta ronda');
          var ek = wk === 'player' ? 'bot' : 'player';
          var es = combatState[ek];
          if (!es.structures) es.structures = [];
          var mon = es.structures.find(function(st){ return st.kind === 'monetizacion'; });
          if (mon) { mon.usos = Math.min(3, (mon.usos || 0) + 1); logCombat('💸 Monetización reforzada: ' + mon.usos + ' usos'); }
          else { es.structures.push({ kind:'monetizacion', usos:1 }); logCombat('💸 Monetización colocada: 1 uso'); }
        } else {
          if (!c.states) c.states = {};
          c.states.ytPopFrozen = false;
        }
        if (isActive) {
          onYouTubeBecomeActive(c);
          if (hasAnyMark(c)) loseYouTubePop(c, 1, 'empieza ronda con marca');
          else gainYouTubePop(c, 1, 'empieza ronda sin marca');
        }
        if (!c.forma) c.forma = (c.popularidad || 0) >= 5 ? 'idol' : 'casual';
      });
    });
    if (combatState.round === 1) {
      ['player','bot'].forEach(function(wk){
        var yt = combatState[wk].characters.find(function(c){ return c.id === 'youtube' && c.exActive; });
        if (!yt) return;
        var ek = wk === 'player' ? 'bot' : 'player';
        var es = combatState[ek];
        if (!es.structures) es.structures = [];
        if (!es.structures.some(function(st){ return st.kind === 'monetizacion'; })) {
          es.structures.push({ kind:'monetizacion', usos:3 });
          logCombat('💸 EX YouTube: Monetización (3 usos) colocada en campo rival');
        }
      });
    }
    ['player','bot'].forEach(function(wk){
      var xCs = combatState[wk].characters.find(function(c){ return c.id === 'x' && c.exActive && !c.dead; });
      if (xCs) { drawFromDeck(wk); logCombat('✖️ EX X: +1 carta robada'); }
    });
    combatState.roundStarting = false;
    renderCombat();
    if (!combatState.pvp && combatState.turn === 'bot' && !combatState.botDone && combatState.phase === 'playing') {
      setTimeout(function(){ if (combatState && !combatState.botDone && combatState.turn === 'bot') botTurn(); }, 600);
    }
  };
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
      var exB = (attackerCs.exActive) ? 2 : 0;
      return 6 + carrB + exB;
    }
    case 'carrerilla': return 0;
    case 'damage': return ability.damage || 0;
    case 'cosecha': return ability.damage || 1;
    case 'pilarFundamental': return ability.damage || 3;
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
    case 'zasca': return ability.damage || 2;
    case 'allEyesOnMe': return ability.damage || 1;
    case 'littleBooBoo': return ability.damage || 2;
    case 'sueloALaCara': {
      var sd = ability.damage || 2;
      if (attackerCs.equipment && attackerCs.equipment.length) sd += attackerCs.equipment.length;
      return sd;
    }
    case 'vittoriaNormal': return ability.damage || 1;
    case 'hotToGo': return 2 + (attackerCs.forma === 'idol' ? 1 : 0);
    case 'theWorldIsMine': { var popWim = attackerCs.popularidad || 0; return 2 + Math.floor(popWim / 2); }
    case 'sublevacion': return 4;
    case 'petiteEtoile': return 3;
    case 'sageNormal': { var dec = (attackerCs.states && attackerCs.states.decidida) || 0; return 3 + dec; }
    case 'feliciaNormal': {
      var fDmg = 1;
      if (csHasState(attackerCs, 'drogada')) fDmg += 2;
      if (csHasState(attackerCs, 'doubleDown')) fDmg *= 2;
      return fDmg;
    }
    case 'davidNormal': return 1 + (combatState._currentIsCounterAttack ? 1 : 0);
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
  if (ability.kind === 'ecoVital') return 0;
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

/* ═══ Vittoria: modificador de coste por pasiva ═══ */
function applyVittoriaCostModifier(cs, baseCost, ability) {
  if (cs.id !== 'vittoria') return baseCost;
  var sInfo = sideOfChar(cs);
  if (!sInfo) return baseCost;
  var deadAllies = sInfo.side.characters.filter(function(c){ return c !== cs && c.dead; }).length;
  var isUltimate = ability && ability.kind === 'vistoUltimate';
  if (deadAllies === 0) return baseCost;
  if (deadAllies >= 2) {
    if (isUltimate) return baseCost;
    var elem = cs.character.element;
    var newCost = {};
    newCost[elem] = 1;
    return newCost;
  }
  var total = sumCost(baseCost);
  if (total <= 0) return baseCost;
  var result = {};
  Object.keys(baseCost).forEach(function(k){ result[k] = baseCost[k]; });
  var rem = 1;
  if (result.any && result.any > 0) { result.any -= 1; rem = 0; if (result.any === 0) delete result.any; }
  if (rem > 0 && result.same && result.same > 0) { result.same -= 1; rem = 0; if (result.same === 0) delete result.same; }
  if (rem > 0) {
    var keys = Object.keys(result);
    for (var i = 0; i < keys.length && rem > 0; i++) {
      var k = keys[i];
      if (k === 'any' || k === 'same') continue;
      result[k] -= 1;
      rem = 0;
      if (result[k] <= 0) delete result[k];
    }
  }
  return result;
}

function getEffectiveCostFull(active, ability) {
  var base = getEffectiveAbilityCost(active, ability.cost);
  if (active.id === 'vittoria') {
    base = applyVittoriaCostModifier(active, base, ability);
  }
  if (active.id === 'felicia') {
    if (csHasState(active, 'drogada')) {
      if (ability.kind === 'feliciaNormal') base.expresion = (base.expresion || 0) + 2;
      else if (ability.kind === 'feliciaElemental') base.expresion = (base.expresion || 0) + 1;
    }
    if (csHasState(active, 'doubleDown')) {
      if (ability.kind === 'feliciaNormal') base.expresion = (base.expresion || 0) + 1;
      else if (ability.kind === 'feliciaElemental') base.expresion = (base.expresion || 0) + 1;
    }
  }
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
  if (active.id === 'artemis' && ability.kind === 'estratosfera' && active.exActive) {
    var exCost = {};
    Object.keys(base).forEach(function(k){ exCost[k] = base[k]; });
    exCost.aceptacion = (exCost.aceptacion || 0) + 2;
    return exCost;
  }
  if (active.id === 'adela' && adelaCostBonus(active) > 0 && base.transformacion) {
    var adelaCost = {};
    Object.keys(base).forEach(function(k){ adelaCost[k] = base[k]; });
    adelaCost.transformacion = (adelaCost.transformacion || 0) + adelaCostBonus(active);
    return adelaCost;
  }
  if (active.id === 'hunger' && hungerMarkMultiplier(active) > 1) {
    var hCost = {};
    Object.keys(base).forEach(function(k){ hCost[k] = base[k] * hungerMarkMultiplier(active); });
    return hCost;
  }
  if (active.id === 'internet' && active.exActive && active.hp <= 2) {
    var intCost = {};
    Object.keys(base).forEach(function(k){ intCost[k] = base[k]; });
    var rem = 1;
    if (intCost.any && intCost.any > 0) { var r1 = Math.min(intCost.any, rem); intCost.any -= r1; rem -= r1; if (intCost.any === 0) delete intCost.any; }
    if (rem > 0 && intCost.same && intCost.same > 0) { var r2 = Math.min(intCost.same, rem); intCost.same -= r2; rem -= r2; if (intCost.same === 0) delete intCost.same; }
    if (rem > 0) {
      var keys2 = Object.keys(intCost);
      for (var i2 = 0; i2 < keys2.length && rem > 0; i2++) {
        var k2 = keys2[i2];
        if (k2 === 'any' || k2 === 'same') continue;
        var r3 = Math.min(intCost[k2], rem);
        intCost[k2] -= r3; rem -= r3;
        if (intCost[k2] === 0) delete intCost[k2];
      }
    }
    return intCost;
  }
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
  if (active.id === 'exmaria' && ability.kind === 'rocePosible') {
    var rCounter = (active.states && active.states.roceCounter) || 0;
    var rCost = {};
    Object.keys(base).forEach(function(k){ rCost[k] = base[k]; });
    rCost.any = (rCost.any || 0) + rCounter;
    return rCost;
  }
  if (active && (csHasState(active, 'irritacion') || combatState._activeUnderIrritation)) {
    var irrCost = {};
    Object.keys(base).forEach(function(k){ irrCost[k] = base[k]; });
    irrCost.any = (irrCost.any || 0) + 1;
    return irrCost;
  }
  if (active.id === 'sage' && ability.kind === 'sageNormal') {
    var sageDec = (active.states && active.states.decidida) || 0;
    if (sageDec > 0) {
      var sageCost = {};
      Object.keys(base).forEach(function(k){ sageCost[k] = base[k]; });
      sageCost.any = (sageCost.any || 0) + sageDec;
      return sageCost;
    }
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
  if (active.id === 'internet' && active.exActive && active.hp <= 2 && dmg > 0) {
    dmg *= 2;
    logCombat('🌐 EX Internet: daño base x2');
  }
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
    if (isElemental && side.alterUltBuff && side.alterUltBuff.amount > 0 && side.alterUltBuff.roundsLeft > 0 && active.id !== 'alter') {
      base += side.alterUltBuff.amount;
      logCombat('💥 Omnes Deam Salutate: +' + side.alterUltBuff.amount + ' daño');
    }
  }
  return base;
}

/* ═══ getEquipmentAttackBonus con bonus de David ═══ */
function getEquipmentAttackBonus(cs) {
  var bonus = 0, piercing = false;
  if (cs && cs.equipment) cs.equipment.forEach(function(eqId){
    var eq = CARD_DB[eqId];
    if (!eq || !eq.effect) {
      // ✅ DAVID: Espada Dorada — +1 daño (o +1+N con davidBuff) si David vivo en el equipo del portador
      if (eqId === 'david_espada') {
        var csS = sideOfChar(cs);
        if (csS) {
          var _david = csS.side.characters.find(function(x){ return x.id === 'david'; });
          if (_david && !_david.dead) {
            var _extra = (_david.states && _david.states.davidBuff) || 0;
            bonus += 1 + _extra;
          }
        }
      }
      return;
    }
    if (eq.effect.attackBonus) bonus += eq.effect.attackBonus;
    if (eq.effect.piercing) piercing = true;
  });
  return { bonus:bonus, piercing:piercing };
}

/* ═══ Iris: Advertido + redirección de ataques ═══ */
var AOE_ABILITY_KINDS = ['estratosfera','faseDeLimpieza','suficiente','retribucionFinal','sobreExageracion','diosTeAmpare'];

function addAdvertidoCharge(enemyCs, irisCs) {
  if (!enemyCs || !irisCs || !enemyCs.states) return;
  var maxCharges = irisCs.exActive ? 1 : 3;
  var current = enemyCs.states.advertido || 0;
  if (current >= maxCharges) {
    var eSide = sideOfChar(enemyCs);
    var irisSide = sideOfChar(irisCs);
    if (eSide && irisSide) {
      triggerMarkOrResonance(enemyCs, 'proteccion', irisSide.key, eSide.key, eSide.side.characters.indexOf(enemyCs));
      logCombat('⚠️ ' + enemyCs.character.name + ' ya tenía el máximo de Advertido → marcado con Protección');
    }
    return;
  }
  enemyCs.states.advertido = current + 1;
  logCombat('⚠️ ' + enemyCs.character.name + ' recibe Advertido (' + (current + 1) + '/' + maxCharges + ')');
}

function maybeRedirectToIris(targetCs, targetSideKey, targetIdx, attackerCs, currentDmg) {
  if (!combatState || !targetCs || !attackerCs || !attackerCs.character) return null;
  if (targetCs.dead) return null;
  if (attackerCs === targetCs) return null;
  var kind = combatState._currentAbilityKind;
  if (kind && AOE_ABILITY_KINDS.indexOf(kind) !== -1) return null;
  var side = combatState[targetSideKey];

  // ✅ DAVID: Capa real — el portador dispara el contraataque de David
  if (targetCs.states && targetCs.states.capaReal) {
    // La lógica real vive en dealDamageToChar para evitar dobles disparos
  }

  var xCs = side.characters.find(function(c){ return c.id === 'x' && !c.dead && csHasState(c, 'provocacion'); });
  if (xCs && xCs !== targetCs) {
    logCombat('🎯 Provocación: ataque redirigido a X');
    return { newTarget: xCs, newSideKey: targetSideKey, newIdx: side.characters.indexOf(xCs), modifiedDmg: currentDmg };
  }

  var irisCs = side.characters.find(function(c){ return c.id === 'iris' && !c.dead; });
  if (!irisCs) return null;
  if (targetCs === irisCs) return null;

  var shouldRedirect = false, bonusDmg = 0, consumeBuenRecaudo = false;
  if (csHasState(targetCs, 'buenRecaudo')) { shouldRedirect = true; consumeBuenRecaudo = true; }
  if (irisCs.states && irisCs.states.advertenciaActive && side.activeIndex === targetIdx) { shouldRedirect = true; bonusDmg = 1; }
  if (!shouldRedirect) return null;

  if (consumeBuenRecaudo) csSetState(targetCs, 'buenRecaudo', false);
  addAdvertidoCharge(attackerCs, irisCs);
  logCombat('🛡️ Lealtad Imbatible: ataque redirigido a Iris' + (bonusDmg > 0 ? ' (+1 daño de Advertencia)' : ''));
  return { newTarget: irisCs, newSideKey: targetSideKey, newIdx: side.characters.indexOf(irisCs), modifiedDmg: currentDmg + bonusDmg };
}
function applyDamageWithMods(targetCs, dmg, forcedPiercing, sideKey, idx, attackerCs) {
  var side = combatState[sideKey], piercing = forcedPiercing;

  var redirectResult = maybeRedirectToIris(targetCs, sideKey, idx, attackerCs, dmg);
  if (redirectResult) {
    targetCs = redirectResult.newTarget;
    sideKey = redirectResult.newSideKey;
    idx = redirectResult.newIdx;
    side = combatState[sideKey];
    dmg = redirectResult.modifiedDmg;
  }

  if (attackerCs) {
    var eq = getEquipmentAttackBonus(attackerCs); if (eq.piercing) piercing = true;
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
  if (effEnergyCost && active.energy < effEnergyCost) {
    if (who === 'bot' && !combatState.botDone && combatState.turn === 'bot' && combatState.phase === 'playing') {
      logCombat('🤖 El rival no puede pagar la energía → fin de ronda');
      declareEnd('bot');
    }
    return;
  }
  var diceSpentThisAction = [];
  if (!preSpentDice && sumCost(effCost) > 0) {
    var res = trySpendDice(side.dice, effCost);
    if (!res.ok) {
      if (who === 'bot' && !combatState.botDone && combatState.turn === 'bot' && combatState.phase === 'playing') {
        logCombat('🤖 El rival no puede pagar los dados → fin de ronda');
        declareEnd('bot');
      }
      return;
    }
    diceSpentThisAction = res.spent || [];
    side.dice = res.remaining;
    if (typeof trackDiceSpent === 'function' && diceSpentThisAction.length > 0) trackDiceSpent(who, diceSpentThisAction.length);
  } else if (preSpentDice) {
    diceSpentThisAction = preSpentDice;
  }
  if (effEnergyCost > 0) {
    active.energy -= effEnergyCost;
    logCombat('⚡ ' + active.character.name + ' gasta ' + effEnergyCost + ' energía');
    if (typeof trackEnergySpent === 'function') trackEnergySpent(who, effEnergyCost);
  }
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
    who: who, side: side, active: active,
    enemyKey: enemyKey, enemySide: enemySide, enemyActive: enemyActive,
    ability: ability, actionType: actionType,
    shouldEndTurn: true,
    pendingBuffConsumed: false,
    hadStacks: false,
    isCounterAttack: !!combatState._currentIsCounterAttack,
    _preSpentDice: diceSpentThisAction
  };

  var activeIdx = side.activeIndex;
  showAbilityNamePopup(who, activeIdx, ability.name, actionType);

  combatState._resolvingAbility = true;

  setTimeout(function() {
    try {
      if (!combatState || combatState.phase === 'ended') return;

      combatState._currentActionType = actionType;
      combatState._currentAbilityKind = ability.kind;
      try {
        var handler = ACTION_HANDLERS[ability.kind];
        if (handler) handler(ctx);
        else logCombat('⚠️ Habilidad sin implementar: ' + ability.name);
      } finally {
        combatState._currentActionType = null;
        combatState._currentAbilityKind = null;
      }

      // ✅ Meta Quest
      if (actionType === 'normal' && !active.dead && side.structures) {
        var metaQ = side.structures.find(function(s){ return s.kind === 'metaQuest'; });
        if (metaQ) {
          healChar(active, 1);
          logCombat('📘 Meta Quest: ' + active.character.name + ' +1 HP (ataque normal)');
        }
      }

      // ✅ Ganancia de energía
      if (ability.energy && ability.energy > 0 && !active.dead) {
        var energyGain = ability.energy;
        if (active.id === 'erikxd') { energyGain = 0; logCombat('📸 ErikXD no gana energía de habilidades'); }
        if (active.id === 'manuel' && ability.kind === 'degradacion') {
          if (active.exActive) { energyGain = 2; logCombat('🌟 EX Manuel: Degradación otorga 2 energía'); }
          else if (ctx.hadStacks) { energyGain = 0; logCombat('📈 Manuel: Degradación resuelve acumulación → 0 energía'); }
        }
        if (active.id === 'exmaria') {
          logCombat('🌻 EX-María no gana energía de sus propias habilidades');
        } else if (energyGain > 0) {
          var p = active.energy; active.energy = Math.min(active.maxEnergy, active.energy + energyGain);
          if (active.energy > p) logCombat('⚡ +' + (active.energy - p) + ' energía');
        }
      }

      // ✅ Reset de bonos
      if (!active.dead) {
        active.cardNextAbilityDiscount = 0; active.cardNextAbilityFree = false;
        active.cardNextAttackBonus = 0; active.cardNextAttackPiercing = false; active.cardNextAttackDouble = false;
        if (!(active.id === 'jose' && ability.kind === 'impulso')) {
          if (ctx.pendingBuffConsumed || active.id !== 'jose') active.pendingBuff = 0;
        }
      }
      if (active.id === 'jose' && !active.dead) csSetState(active, 'acelerado', false);

      renderCombat();

      if (enemySide.characters.every(function(c){ return c.dead; })) { setTimeout(function(){ endCombat(who); }, 400); return; }
      if (side.characters.every(function(c){ return c.dead; })) { setTimeout(function(){ endCombat(who === 'player' ? 'bot' : 'player'); }, 400); return; }

      if (ctx.shouldEndTurn === false) {
        if (!combatState.pvp && combatState.turn === 'bot' && !combatState.botDone && combatState.phase === 'playing') {
          setTimeout(botTurn, 500);
        }
        return;
      }
      scheduleNextTurn(400);
    } catch (err) {
      console.error('[executeAction] Error en habilidad ' + (ability && ability.name) + ':', err);
      if (combatState) {
        logCombat('⚠️ Error al ejecutar ' + (ability ? ability.name : '?'));
        if (combatState.phase === 'playing') {
          if (who === 'bot' && combatState.turn === 'bot' && !combatState.botDone) declareEnd('bot');
          else setTimeout(nextTurn, 400);
        }
      }
    } finally {
      if (combatState) {
        combatState._resolvingAbility = false;
        combatState._currentIsCounterAttack = false;
      }
    }
  }, 700);
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
  var rules = { diceCost:1, quick:false, discounted:false, fromConsonance:false };
  if (cons && cons.type === 'single' && cons.element === 'transformacion' && !side.firstChangeUsed) {
    if (cons.level === 2) { rules.diceCost = 0; rules.discounted = true; rules.fromConsonance = true; }
    else if (cons.level === 3) { rules.diceCost = 0; rules.quick = true; rules.discounted = true; rules.fromConsonance = true; }
  }
  return rules;
}
function getChangeRulesForTarget(who, targetIndex) {
  var rules = getChangeRules(who);
  var side = combatState[who];
  var active = side.characters[side.activeIndex];
  var target = side.characters[targetIndex];
  if (active && active.id === 'sage') { rules.diceCost = 0; if (active.exActive) rules.quick = true; }
  if (target && target.id === 'sage' && active && active.id !== 'sage') { rules.diceCost = rules.diceCost + 1; }
  if (targetIndex !== undefined && side.characters[targetIndex] && side.characters[targetIndex].id === 'jose') {
    var joseCs = side.characters[targetIndex];
    rules.quick = true;
    if (joseCs.exActive) { rules.diceCost = 0; rules.discounted = true; }
  }
  return rules;
}
function transferActiveBuffs(oldCs, newCs) {
  if (!oldCs || !newCs || oldCs === newCs) return;
  var _numKeys = ['cardNextAttackBonus', 'cardNextAbilityDiscount', 'cardMarkBonus', 'nextCardDiscount'];
  _numKeys.forEach(function(k) { if (oldCs[k] > 0) { newCs[k] = (newCs[k] || 0) + oldCs[k]; oldCs[k] = 0; } });
  var _boolKeys = ['cardNextAttackPiercing', 'cardNextAttackDouble', 'cardNextAbilityFree'];
  _boolKeys.forEach(function(k) { if (oldCs[k]) { newCs[k] = true; oldCs[k] = false; } });
}
function tryChangeCharacter(who, targetIndex) {
  if (!combatState || combatState.phase !== 'playing') return false;
  var side = combatState[who];
  if (side.activeIndex === targetIndex) return false;
  if (side.characters[targetIndex].dead) return false;
  var rules = getChangeRulesForTarget(who, targetIndex);
  if (rules.diceCost > 0) { var r = trySpendDice(side.dice, { any:rules.diceCost }); if (!r.ok) return false; side.dice = r.remaining; }
  if (rules.fromConsonance) side.firstChangeUsed = true;
  var oldN = side.characters[side.activeIndex].character.name, newN = side.characters[targetIndex].character.name;
  var oldChar = side.characters[side.activeIndex];
  if (oldChar.id === 'jose') csSetState(oldChar, 'acelerado', false);
  side.activeIndex = targetIndex;
  hungerOnEnter(who, side.characters[targetIndex], oldChar);
  if (side.characters[targetIndex].id === 'jose') csSetState(side.characters[targetIndex], 'acelerado', true);
  applyGoogleExOnChange(oldChar, side, targetIndex, who);
  transferActiveBuffs(oldChar, side.characters[targetIndex]);
  var _newCs = side.characters[targetIndex];
  var _oldIdx = side.characters.indexOf(oldChar);
  if (oldChar && oldChar.id === 'sage' && _newCs.id !== 'sage' && oldChar.exActive && !oldChar.dead) {
    dealDamageToChar(oldChar, 1, { targetSide:side, targetSideKey:who, targetIdx:_oldIdx });
    logCombat('🐴 EX Sage: pierde 1 HP al salir');
  }
  if (_newCs && _newCs.id === 'sage' && oldChar.id !== 'sage' && !_newCs.dead) {
    csSetState(_newCs, 'sageEnteredThisTurn', true);
    _newCs.states = _newCs.states || {};
    _newCs.states.decidida = Math.min(3, (_newCs.states.decidida || 0) + 1);
    logCombat('🐴 Sage: +1 Decidida (' + _newCs.states.decidida + '/3)');
    dealDamageToChar(_newCs, 1, { targetSide:side, targetSideKey:who, targetIdx:targetIndex });
    logCombat('🐴 Sage: -1 HP al cambiar a ella');
  }
  var sfx = rules.quick ? ' (acción rápida)' : (rules.discounted ? ' (gratis)' : '');
  logCombat('🔄 ' + (who === 'player' ? (combatState.pvp ? 'J1' : 'Tú') : (combatState.pvp ? 'J2' : 'El rival')) + ': ' + oldN + ' → ' + newN + sfx);
  if (typeof triggerKillerTunesDamage === 'function') triggerKillerTunesDamage(who);
  var _enemyKey = who === 'player' ? 'bot' : 'player';
  if (combatState && combatState[_enemyKey] && combatState[_enemyKey].characters.every(function(c){ return c.dead; })) {
    setTimeout(function(){ if (combatState) endCombat(who); }, 400);
    return true;
  }
  if (side.characters[targetIndex] && side.characters[targetIndex].id === 'youtube') {
    onYouTubeBecomeActive(side.characters[targetIndex]);
  }
  playSound('change');
  return rules.quick ? 'quick' : true;
}

/* ═══════════════════════════════════════════════════════════════════
   BOT AI v2 — Cerebro con scoring, cartas, cambios y burbuja "pensando"
   ═══════════════════════════════════════════════════════════════════ */

var BOT_PERSONALITY = {
  proteccion:     { offense: 0.85, defense: 1.4, healing: 1.3, switching: 0.9 },
  comprension:    { offense: 1.0,  defense: 1.05, healing: 1.2, switching: 1.1 },
  expresion:      { offense: 1.15, defense: 0.9, healing: 1.0, switching: 1.1 },
  transformacion: { offense: 1.05, defense: 0.85, healing: 0.9, switching: 1.7 },
  aceptacion:     { offense: 1.0,  defense: 1.1, healing: 1.25, switching: 1.0 },
  redencion:      { offense: 1.5,  defense: 0.75, healing: 0.9, switching: 1.0 },
  ilusion:        { offense: 1.1,  defense: 1.0, healing: 0.9, switching: 1.2 }
};
var BOT_THINK_MIN_MS = 700;
var BOT_THINK_MAX_MS = 1600;
var BOT_MAX_CARDS_PER_TURN = 2;

function canBotAct() {
  if (!combatState) return false;
  if (combatState.pvp) return false;
  if (combatState.phase !== 'playing') return false;
  if (combatState.botDone) return false;
  if (combatState.turn !== 'bot') return false;
  if (combatState.roundStarting) return false;
  if (combatState._resolvingAbility) return false;
  return true;
}

/* ─── Burbuja "pensando" ─── */
function clearBotThinkBubble() {
  var b = document.getElementById('botThinkBubble');
  if (b) b.remove();
}
function showBotThinkBubble(html) {
  clearBotThinkBubble();
  if (!combatState || !combatState.bot) return;
  var card = document.querySelector('.combat-char-card[data-team="bot"][data-index="' + combatState.bot.activeIndex + '"]');
  if (!card) return;
  var bubble = document.createElement('div');
  bubble.className = 'bot-think-bubble';
  bubble.id = 'botThinkBubble';
  bubble.innerHTML = html;
  card.appendChild(bubble);
}
function updateBotThinkBubble(html) {
  var b = document.getElementById('botThinkBubble');
  if (b) b.innerHTML = html;
  else showBotThinkBubble(html);
}

/* ─── Mood / adaptación de ronda ─── */
function updateBotMood() {
  if (!combatState) return;
  var bot = combatState.bot, player = combatState.player;
  var botHp = bot.characters.filter(function(c){ return !c.dead; }).reduce(function(a,c){ return a + c.hp; }, 0);
  var playerHp = player.characters.filter(function(c){ return !c.dead; }).reduce(function(a,c){ return a + c.hp; }, 0);
  var botMaxHp = bot.characters.reduce(function(a,c){ return a + c.maxHp; }, 0);
  var playerMaxHp = player.characters.reduce(function(a,c){ return a + c.maxHp; }, 0);
  if (botMaxHp === 0 || playerMaxHp === 0) return;
  var diff = (botHp / botMaxHp) - (playerHp / playerMaxHp);
  var prev = combatState.botMood || 'neutral';
  if (diff > 0.15) combatState.botMood = 'aggressive';
  else if (diff < -0.15) combatState.botMood = 'defensive';
  else combatState.botMood = 'neutral';
  if (prev !== combatState.botMood && combatState.botMood !== 'neutral') {
    var emoji = combatState.botMood === 'aggressive' ? '⚔️' : '🛡️';
    logCombat(emoji + ' El rival cambia de actitud: ' + (combatState.botMood === 'aggressive' ? 'AGRESIVO' : 'DEFENSIVO'));
  }
}

/* ─── Estimaciones ─── */
function botEstimateEffectiveDamage(active, ability, actionType) {
  var baseDmg = computeBaseDamageForAbility(active, ability, actionType);
  if (baseDmg <= 0) return { damage: 0, trueDmg: 0, piercing: false, kill: false };
  var enemyActive = combatState.player.characters[combatState.player.activeIndex];
  if (!enemyActive) {
    enemyActive = combatState.player.characters.find(function(c){ return !c.dead; });
    if (!enemyActive) return { damage: 0, trueDmg: 0, piercing: false, kill: false };
  }
  var piercing = predictPiercing(active, ability);
  var est = baseDmg;
  if (active.pendingBuff) est += active.pendingBuff;
  if (active.cardNextAttackBonus) est += active.cardNextAttackBonus;
  var eq = getEquipmentAttackBonus(active);
  est += eq.bonus;
  if (eq.piercing) piercing = true;
  est += getSupportAttackBonus(combatState.bot);
  if (actionType === 'normal') est += getOptimizationBonus(combatState.bot);
  if (active.id === 'erik') est += applyErikPassive(active);
  if (actionType === 'ultimate') est = applyObraMaestraToBase(active, ability, actionType, est);
  est = Math.max(0, est - getDamageReduction(enemyActive, combatState.player));
  if (csHasState(enemyActive, 'vulnerable') && est > 0) est -= 1;
  var shield = totalShield(enemyActive);
  var trueDmg = piercing ? est : Math.max(0, est - shield);
  return { damage: est, trueDmg: trueDmg, piercing: piercing, kill: trueDmg >= enemyActive.hp };
}

function botScoreStateValue(ability, active, enemyActive) {
  var v = 0;
  switch (ability.kind) {
    case 'penitencia': v = (active.states && active.states.castigada) ? 2 : 8; break;
    case 'bajoAlas': v = 6; break;
    case 'hipotesisSolida': v = 7; break;
    case 'defensaActiva': v = 6; break;
    case 'optimizacion': {
      var hasPort = combatState.bot.structures && combatState.bot.structures.some(function(s){ return s.kind === 'optimizacion'; });
      v = hasPort ? 3 : 10;
      break;
    }
    case 'obraMaestra': v = 12; break;
    case 'decadencia': v = (active.manuelStacks || 0) >= 2 ? 1 : 6; break;
    case 'impulso': v = 5; break;
    case 'ecoVital': v = 7; break;
    case 'armonia': v = 6; break;
    case 'conclusion': v = 8; break;
    case 'carrerilla': v = 5; break;
    case 'conversionPsicologica': v = 6; break;
    case 'omnesDeam': v = 9; break;
    case 'reescritura': v = 4; break;
    case 'canon': v = 6; break;
    case 'remix': {
      var hasMesa = combatState.bot.structures && combatState.bot.structures.some(function(s){ return s.kind === 'mesaDJ'; });
      v = hasMesa ? 3 : 6;
      break;
    }
    case 'killerTunes': v = 7; break;
    case 'interpretacion': v = 5; break;
    case 'lienzoSangre': {
      var pr = (combatState.bot.hand || []).filter(function(id){ return id === 'paint_roja'; }).length;
      var pa = (combatState.bot.hand || []).filter(function(id){ return id === 'paint_azul'; }).length;
      var pv = (combatState.bot.hand || []).filter(function(id){ return id === 'paint_verde'; }).length;
      v = (pr + pa + pv) * 4;
      break;
    }
    case 'suficiente': {
      var amz = combatState.player.characters.filter(function(c){ return !c.dead && csHasState(c, 'amenaza'); });
      v = amz.length * 5;
      break;
    }
    case 'retribucionFinal': {
      var conRencor = combatState.player.characters.filter(function(c){ return !c.dead && c.states && c.states.rencor > 0; });
      v = conRencor.reduce(function(a, c){ return a + (c.states.rencor * 3); }, 0);
      break;
    }
    case 'muereElemental': v = 3; break;
    case 'diosTeAmpare': {
      var cruces = countCruzMadera(combatState.bot) + countCruzMadera(combatState.player);
      v = cruces * 2;
      break;
    }
    case 'protocoloSeguridad': v = 5; break;
    case 'pilarFundamental': v = 4; break;
    case 'vistoUltimate': v = 8; break;
    case 'irisAdvertencia': v = 7; break;
    case 'liderPunoHierro': {
      var hasAdv = enemyActive && enemyActive.states && enemyActive.states.advertido > 0;
      v = hasAdv ? 0 : 6;
      break;
    }
    case 'miCordura': {
      var hasMark = csAllMarks(active).indexOf('transformacion') !== -1;
      v = hasMark ? 0 : 6;
      break;
    }
    default: v = 0;
  }
  return v;
}

/* ─── Filtro de utilidad de definitivas ─── */
function botUltimateMakesSense(active, ability, enemyActive) {
  switch (ability.kind) {
    case 'suficiente': {
      return combatState.player.characters.some(function(c){ return !c.dead && csHasState(c, 'amenaza'); });
    }
    case 'retribucionFinal': {
      var totalAcum = combatState.player.characters
        .filter(function(c){ return !c.dead && c.states && c.states.rencor > 0; })
        .reduce(function(a, c){ return a + c.states.rencor; }, 0);
      return totalAcum >= 2;
    }
    case 'finComienzo': {
      var condena = (active.states && active.states.condena) || 0;
      if (condena === 0) return false;
      return condena >= enemyActive.hp;
    }
    case 'lienzoSangre': {
      var paints = (combatState.bot.hand || []).filter(function(id){ return id === 'paint_roja' || id === 'paint_azul' || id === 'paint_verde'; }).length;
      return paints >= 2;
    }
    case 'amor':
    case 'amorSuficiente': {
      if (active.hp <= 1) return false;
      return combatState.bot.characters.some(function(c){ return c.dead; });
    }
    case 'canon': {
      return combatState.bot.supports && combatState.bot.supports.some(function(s){ return s !== null; });
    }
    case 'omnesDeam': {
      return combatState.bot.characters.some(function(c){ return c.id !== 'alter' && !c.dead; });
    }
    case 'obraMaestra': {
      return combatState.bot.structures && combatState.bot.structures.some(function(s){ return s.kind === 'optimizacion'; });
    }
    case 'estratosfera': {
      if (!csHasState(active, 'vuelo')) return active.hp >= 5;
      return true;
    }
    default: return true;
  }
}

/* ─── Scoring de habilidades / cambios / cartas ─── */
function botScoreAbility(actionType, active, enemyActive) {
  var ability = active.character.abilities[actionType];
  if (!ability) return -1;
  var personality = BOT_PERSONALITY[active.character.element] || { offense: 1, defense: 1, healing: 1, switching: 1 };
  var score = 0;

  var dmgInfo = botEstimateEffectiveDamage(active, ability, actionType);
  score += dmgInfo.damage * 2.2 * personality.offense;
  if (dmgInfo.kill) {
    var _kP = (typeof getBotDifficultyInfo === 'function') ? getBotDifficultyInfo().killPriority : 30;
    score += _kP;
  }

  var heal = predictHeal(ability, active);
  var hpNeeded = active.maxHp - active.hp;
  score += Math.min(heal, hpNeeded) * 2.0 * personality.healing;
  if (active.hp <= active.maxHp * 0.3 && heal > 0) score += 8;

  score += predictShieldGain(ability) * 1.4 * personality.defense;

  var selfDmg = predictSelfDamage(ability, active);
  score -= selfDmg * 3;
  if (selfDmg >= active.hp) score -= 300;

  score += botScoreStateValue(ability, active, enemyActive);

  var effCost = getEffectiveCostFull(active, ability);
  score -= sumCost(effCost) * 0.5;

  if (combatState.botMood === 'aggressive') score *= 1.15;
  else if (combatState.botMood === 'defensive') {
    if (ability.kind === 'defensaActiva' || ability.kind === 'hipotesisSolida' || ability.kind === 'bajoAlas') score *= 1.5;
    else if (dmgInfo.damage > 0) score *= 0.85;
  }

  return score;
}

function botScoreChange(targetIdx, active, enemyActive) {
  var bot = combatState.bot;
  var target = bot.characters[targetIdx];
  if (!target || target.dead) return -1;
  var rules = getChangeRulesForTarget('bot', targetIdx);
  var score = (target.hp - active.hp) * 0.4;
  if (active.hp <= 3) score += 12;
  if (active.hp <= active.maxHp * 0.3) score += 5;
  if (rules.quick) score += 6;
  if (rules.diceCost === 0 && !rules.quick) score += 3;
  if (target.id === 'jose') score += 4;
  if (target.hp <= active.hp) score -= 2;
  score *= (BOT_PERSONALITY[active.character.element] || { switching: 1 }).switching;
  score -= rules.diceCost * 0.5;
  return score;
}

/* ═══ Reserva de dados para ataque ═══ */
function botMinAttackCost() {
  var bot = combatState.bot;
  var active = bot.characters[bot.activeIndex];
  if (!active || active.dead) return 0;
  var best = 999;
  ['normal', 'elemental', 'ultimate'].forEach(function(type){
    var ab = active.character.abilities[type];
    if (!ab) return;
    if (ab.energyCost && active.energy < ab.energyCost) return;
    var c = sumCost(getEffectiveCostFull(active, ab));
    if (c < best) best = c;
  });
  return best === 999 ? 0 : best;
}

function botScoreCard(cardId, card, active) {
  if (!card) return -1;
  var bot = combatState.bot;
  if (card.oncePerRound && bot.cardsUsedThisRound[cardId]) return -1;
  if (card.oncePerGame && bot.cardsUsedThisGame[cardId]) return -1;

  if (card.category === 'pintura') {
    var erik = bot.characters.find(function(c){ return c.id === 'erik' && !c.dead; });
    if (!erik || erik.paintEquipped) return -1;
    return 5;
  }

  // ✅ Pasivas: Eve y ErikXD no pueden recibir equipaciones
  if (card.category === 'equipo') {
    if (active.id === 'erikxd') return -1;
    if (active.id === 'eve' && card.effect && (card.effect.shieldBonus || card.effect.shieldPerRound || card.effect.healBonus || card.effect.healPerRound || card.effect.teamShieldBonus || card.effect.teamShieldInstant)) return -1;
  }

  var cost = adjustCardCostForPassives(card, bot);
  var cardDiceCost = sumCost(cost);
  if (!trySpendDice(bot.dice, cost).ok) return -1;

  var isDefensiveCard = ['heal','healAll','shield','shieldAll','revive'].indexOf(card.effectType) !== -1;
  var isBuffForAttack = ['nextAttackBonus','nextAttackDouble','nextAttackCritical','nextAttackPiercing','nextAbilityDiscount','nextAbilityFree'].indexOf(card.effectType) !== -1;
  var reserve = botMinAttackCost();
  var postDice = bot.dice.length - cardDiceCost;
  if (postDice < reserve && !isDefensiveCard) {
    return -1;
  }

  var score = 0;
  var hpNeeded = active.maxHp - active.hp;
  switch (card.effectType) {
    case 'heal':
      if (hpNeeded <= 0) return -1;
      score += Math.min(card.value, hpNeeded) * 2.0;
      if (active.hp <= active.maxHp * 0.35) score += 5;
      break;
    case 'healAll': {
      var totalHeal = 0;
      bot.characters.forEach(function(c){ if (!c.dead) totalHeal += Math.min(card.value, c.maxHp - c.hp); });
      if (totalHeal <= 0) return -1;
      score += totalHeal * 1.6;
      break;
    }
    case 'shield': score += card.value * 1.4; break;
    case 'shieldAll': score += bot.characters.filter(function(c){ return !c.dead; }).length * card.value * 1.2; break;
    case 'energy':
      if (active.energy >= active.maxEnergy) return -1;
      score += card.value * 2.2;
      break;
    case 'nextAttackBonus': {
      var bestAtk = Math.max(
        computeBaseDamageForAbility(active, active.character.abilities.normal, 'normal'),
        computeBaseDamageForAbility(active, active.character.abilities.elemental, 'elemental')
      );
      score += card.value * (1 + bestAtk * 0.4);
      break;
    }
    case 'nextAttackDouble': {
      var bestAtk2 = Math.max(
        computeBaseDamageForAbility(active, active.character.abilities.normal, 'normal'),
        computeBaseDamageForAbility(active, active.character.abilities.elemental, 'elemental')
      );
      score += bestAtk2 * 1.6;
      break;
    }
    case 'nextAttackCritical': {
      var bestAtk3 = Math.max(
        computeBaseDamageForAbility(active, active.character.abilities.normal, 'normal'),
        computeBaseDamageForAbility(active, active.character.abilities.elemental, 'elemental')
      );
      score += (card.value + bestAtk3) * 1.4;
      break;
    }
    case 'nextAttackPiercing': {
      var pActive = combatState.player.characters[combatState.player.activeIndex];
      score += (pActive && totalShield(pActive) >= 2) ? 5 : 1;
      break;
    }
    case 'nextAbilityDiscount':
      score += (card.value >= 2) ? 4 : 2;
      if (active.energy >= active.maxEnergy) score += 2;
      break;
    case 'nextAbilityFree': score += 8; break;
    case 'drawDiceOfActive': case 'drawTeamDice': score += card.value * 0.9; break;
    case 'rerollDice': score += card.value * 0.5; break;
    case 'convertDice': score += card.value * 0.6; break;
    case 'sacrificeDie': score += 1.5; break;
    case 'quickChange':
      score += active.hp <= 3 ? 4 : 1;
      break;
    case 'prepararContraataque': score += card.value * 1.2; break;
    case 'markEnemy': score += card.value * 1.5; break;
    case 'removeEnemyShields': {
      var pActive2 = combatState.player.characters[combatState.player.activeIndex];
      score += (pActive2 && totalShield(pActive2) >= 3) ? 5 : 0;
      break;
    }
    case 'forceEnemyChange': score += 2; break;
    case 'enemyAttackDebuff': score += card.value * 1.5; break;
    case 'revive':
      if (!bot.characters.some(function(c){ return c.dead; })) return -1;
      score += 12;
      break;
    default:
      if (card.effect) {
        var e = card.effect;
        var _dur = card.duration || 1;
        if (e.attackBonus)         score += e.attackBonus * 2;
        if (e.teamAttackBonus)     score += e.teamAttackBonus * 1.5 * _dur;
        if (e.shieldBonus)         score += e.shieldBonus * 1.4;
        if (e.shieldPerRound)      score += e.shieldPerRound * 1.2 * _dur;
        if (e.teamShieldPerRound)  score += e.teamShieldPerRound * 1.2 * _dur;
        if (e.teamShieldInstant)   score += e.teamShieldInstant * 1.2;
        if (e.damageReduction)     score += e.damageReduction * 1.5 * _dur;
        if (e.teamDamageReduction) score += e.teamDamageReduction * 1.5 * _dur;
        if (e.healBonus)           score += Math.min(e.healBonus, hpNeeded) * 1.5;
        if (e.healPerRound)        score += Math.min(e.healPerRound, hpNeeded) * 1.2 * _dur;
        if (e.teamHealPerRound)    score += e.teamHealPerRound * 1.2 * _dur;
        if (e.energyBonus)         score += e.energyBonus * 1.5;
        if (e.energyPerRound)      score += e.energyPerRound * 1.4 * _dur;
        if (e.teamEnergyPerRound)  score += e.teamEnergyPerRound * 1.4 * _dur;
        if (e.drawPerRound)        score += e.drawPerRound * 1.5 * _dur;
        if (e.selfDamage)          score -= e.selfDamage * 2;
        score += 1.5;
      }
      break;
  }
  // ✅ Opal: el límite de equipación es dinámico (3 slots)
  var _maxEqB = (typeof getMaxEquipment === 'function') ? getMaxEquipment(active) : 2;
  if (card.category === 'equipo' && active.equipment && active.equipment.length >= _maxEqB) score -= 2;
  if (card.category === 'apoyo' && bot.supports && bot.supports.indexOf(null) === -1) score -= 2;
  score -= cardDiceCost * 0.35;
  if (combatState.botMood === 'defensive') {
    if (isDefensiveCard) score *= 1.4;
    else if (isBuffForAttack) score *= 0.8;
  } else if (combatState.botMood === 'aggressive') {
    if (isBuffForAttack) score *= 1.4;
    else if (isDefensiveCard) score *= 0.8;
  }
  return score;
}

function botCanUseAbility(botSide, active, ability, actionType) {
  if (ability.energyCost && active.energy < ability.energyCost) return false;
  if (ability.kind === 'obraMaestra') {
    var hasOptim = botSide.structures && botSide.structures.some(function(st){ return st.kind === 'optimizacion'; });
    if (!hasOptim) return false;
  }
  if (ability.kind === 'amorSuficiente') {
    if (active.hp <= 1) return false;
    if (!botSide.characters.some(function(c){ return c.dead; })) return false;
  }
  var effCost = getEffectiveCostFull(active, ability);
  return trySpendDice(botSide.dice, effCost).ok;
}

/* ─── Elección ─── */
function botChooseBestCard() {
  var bot = combatState.bot;
  var active = bot.characters[bot.activeIndex];
  if (!active || active.dead) return null;
  if (!bot.hand || !bot.hand.length) return null;
  var candidates = [];
  var seen = {};
  bot.hand.forEach(function(cardId){
    if (seen[cardId]) return;
    seen[cardId] = true;
    var card = CARD_DB[cardId] || PAINT_CARDS[cardId];
    if (!card) return;
    var score = botScoreCard(cardId, card, active);
    if (score > 1.0) candidates.push({ cardId: cardId, card: card, score: score });
  });
  if (!candidates.length) return null;
  candidates.sort(function(a,b){ return b.score - a.score; });
  return botPickBestWeighted(candidates);
}

function botChooseAction() {
  var bot = combatState.bot;
  var active = bot.characters[bot.activeIndex];
  if (!active || active.dead) return null;
  var enemyActive = combatState.player.characters[combatState.player.activeIndex];
  if (!enemyActive || enemyActive.dead) {
    enemyActive = combatState.player.characters.find(function(c){ return !c.dead; });
    if (!enemyActive) return null;
  }
  var candidates = [];

  ['ultimate', 'normal', 'elemental'].forEach(function(type){
    var ability = active.character.abilities[type];
    if (!ability) return;
    if (!botCanUseAbility(bot, active, ability, type)) return;
    if (type === 'ultimate' && !botUltimateMakesSense(active, ability, enemyActive)) return;
    var score = botScoreAbility(type, active, enemyActive);
    candidates.push({ action: { type: type }, score: score });
  });

  var canAttackWithActive = ['normal', 'elemental', 'ultimate'].some(function(type){
    var ab = active.character.abilities[type];
    if (!ab) return false;
    if (ab.energyCost && active.energy < ab.energyCost) return false;
    return botCanUseAbility(bot, active, ab, type);
  });

  for (var i = 0; i < bot.characters.length; i++) {
    if (i === bot.activeIndex) continue;
    if (bot.characters[i].dead) continue;
    var chScore = botScoreChange(i, active, enemyActive);
    if (!canAttackWithActive) {
      var other = bot.characters[i];
      var otherCanAttack = ['normal', 'elemental', 'ultimate'].some(function(type){
        var ab = other.character.abilities[type];
        if (!ab) return false;
        if (ab.energyCost && other.energy < ab.energyCost) return false;
        return botCanUseAbility(bot, other, ab, type);
      });
      if (otherCanAttack) chScore = Math.max(chScore, 6);
    }
    if (chScore > 2.0) candidates.push({ action: { type: 'change', index: i }, score: chScore });
  }

  var bestScore = candidates.reduce(function(a, c){ return Math.max(a, c.score); }, 0);
  if (bestScore < 1.0) {
    var _normalAb = active.character.abilities.normal;
    if (_normalAb && botCanUseAbility(bot, active, _normalAb, 'normal')) return { type: 'normal' };
    var _elAb = active.character.abilities.elemental;
    if (_elAb && botCanUseAbility(bot, active, _elAb, 'elemental')) return { type: 'elemental' };
    return { type: 'end' };
  }

  var chosen = botPickBestWeighted(candidates);
  return chosen ? chosen.action : { type: 'end' };
}

/* ─── Ejecución de cartas del bot ─── */
function botPlayCard(cardId, card, onComplete) {
  var bot = combatState.bot;
  var active = bot.characters[bot.activeIndex];
  var fail = function() { if (onComplete) onComplete(false); return false; };

  if (!active || active.dead) return fail();
  if (card.oncePerRound && bot.cardsUsedThisRound[cardId]) return fail();
  if (card.oncePerGame && bot.cardsUsedThisGame[cardId]) return fail();
  if (card.category === 'pintura') {
    var erik = bot.characters.find(function(c){ return c.id === 'erik' && !c.dead; });
    if (!erik || erik.paintEquipped) return fail();
  }
  // ✅ Pasivas: Eve y ErikXD no pueden recibir equipaciones
  if (card.category === 'equipo') {
    if (active.id === 'erikxd') return fail();
    if (active.id === 'eve' && card.effect && (card.effect.shieldBonus || card.effect.shieldPerRound || card.effect.healBonus || card.effect.healPerRound || card.effect.teamShieldBonus || card.effect.teamShieldInstant)) return fail();
  }
  var cost = adjustCardCostForPassives(card, bot);
  var spendResult = trySpendDice(bot.dice, cost);
  if (!spendResult.ok) return fail();

  bot.dice = spendResult.remaining;
  if (active && active.nextCardDiscount > 0) {
    active.nextCardDiscount = 0;
    logCombat('📘 Protocolo de Seguridad: descuento consumido por el rival');
  }
  var hi = bot.hand.indexOf(cardId);
  if (hi >= 0) bot.hand.splice(hi, 1);
  if (card.oncePerRound) bot.cardsUsedThisRound[cardId] = true;
  if (card.oncePerGame) bot.cardsUsedThisGame[cardId] = true;
  if (!PAINT_CARDS[cardId]) { if (!bot.discardPile) bot.discardPile = []; bot.discardPile.push(cardId); }

  showUsedCardOverlay(card, 'bot', function() {
    if (!combatState || !canBotAct()) { if (onComplete) onComplete(false); return; }
    var a = combatState.bot.characters[combatState.bot.activeIndex];
    if (!a) { if (onComplete) onComplete(false); return; }
    var b = combatState.bot;

    if (card.category === 'pintura') {
      var e2 = b.characters.find(function(c){ return c.id === 'erik' && !c.dead; });
      if (e2) { e2.paintEquipped = card.paintColor; logCombat('🎨 Rival equipa ' + card.name + ' en ' + e2.character.name); }
    } else if (card.category === 'equipo') {
      if (!a.equipment) a.equipment = [];
      var _maxEqBP = (typeof getMaxEquipment === 'function') ? getMaxEquipment(a) : 2;
      if (a.equipment.length >= _maxEqBP) {
        // ✅ David: nunca quitar la Espada Dorada (slot 0)
        var _removeIdx = (a.id === 'david' && a.equipment[0] === 'david_espada') ? 1 : 0;
        var removed = a.equipment.splice(_removeIdx, 1)[0];
        if (!b.discardPile) b.discardPile = [];
        b.discardPile.push(removed);
      }
      a.equipment.push(cardId);
      if (card.effect) {
        if (card.effect.shieldBonus) addOrRefreshShield(a, 'eq_' + cardId, card.effect.shieldBonus);
        if (card.effect.energyBonus) a.energy = Math.min(a.maxEnergy, a.energy + card.effect.energyBonus);
        if (card.effect.healBonus) healChar(a, card.effect.healBonus);
        if (card.effect.selfDamage) { a.hp = Math.max(0, a.hp - card.effect.selfDamage); if (a.hp <= 0) handleDeath('bot', b.characters.indexOf(a)); }
      }
      logCombat('⚔️ Rival equipa ' + card.name);
    } else if (card.category === 'apoyo') {
      // ✅ ErikXD: 5 slots de apoyo
      if (!b.supports) b.supports = [null, null, null, null, null];
      var slot = b.supports.indexOf(null);
      if (slot === -1) slot = 0;
      b.supports[slot] = { cardId: cardId, duration: card.duration };
      if (card.effect && card.effect.shieldInstant) addOrRefreshShield(a, 'support_' + cardId, card.effect.shieldInstant);
      if (card.effect && card.effect.teamShieldInstant) b.characters.forEach(function(c){ if (!c.dead) addOrRefreshShield(c, 'support_' + cardId, card.effect.teamShieldInstant); });
      logCombat('📜 Rival coloca ' + card.name);
    } else {
      var savedPvp = combatState.pvp, savedTurn = combatState.turn;
      combatState.pvp = true; combatState.turn = 'bot';
      try { if (typeof applyCardEffect === 'function') applyCardEffect(card); } finally { combatState.pvp = savedPvp; combatState.turn = savedTurn; }
      logCombat('🎴 Rival usa ' + card.name);
    }
    playSound('card');
    renderCombat();
    if (onComplete) onComplete(true);
  });
  return true;
}

/* ─── Turno del bot ─── */
var _botWatchdogToken = 0;

function _botBailSafety() {
  if (!combatState) return;
  if (combatState.botDone) return;
  if (combatState.turn !== 'bot') return;
  if (combatState.phase !== 'playing') return;
  if (combatState.roundStarting) return;
  if (combatState._resolvingAbility) return;
  logCombat('🤖 El rival no puede actuar → fin de ronda');
  declareEnd('bot');
}

/* ═══ Bot: relanzar dados inservibles ═══ */
function botMaybeReroll() {
  var bot = combatState.bot;
  if (bot.rerolled) return false;
  var active = bot.characters[bot.activeIndex];
  if (!active || active.dead) return false;
  var el = active.character.element;
  var teamEls = bot.characters
    .filter(function(c){ return c !== active && !c.dead; })
    .map(function(c){ return c.character.element; });
  var useful = bot.dice.filter(function(d){ return d.type === el || d.type === 'omni'; }).length;
  if (useful >= 5) return false;
  var useless = bot.dice.filter(function(d){ return d.type !== el && d.type !== 'omni'; });
  if (useless.length < 1) return false;
  useless.sort(function(a, b){
    var aTeam = teamEls.indexOf(a.type) !== -1 ? 1 : 0;
    var bTeam = teamEls.indexOf(b.type) !== -1 ? 1 : 0;
    return aTeam - bTeam;
  });
  var need = Math.min(3, Math.max(1, 5 - useful));
  var toReroll = useless.slice(0, need);
  toReroll.forEach(function(d){
    d.type = Math.random() < 0.125 ? 'omni' : CONSONANCE_ORDER[Math.floor(Math.random() * 7)];
  });
  bot.rerolled = true;
  logCombat('🤖 El rival relanza ' + toReroll.length + ' dado(s) (fase de dados)');
  return true;
}

function botTurn(skipThink) {
  if (!canBotAct()) { _botBailSafety(); return; }
  var bot = combatState.bot;
  var active = bot.characters[bot.activeIndex];
  if (!active || active.dead) { declareEnd('bot'); return; }

  var myToken = ++_botWatchdogToken;
  setTimeout(function() {
    if (myToken !== _botWatchdogToken) return;
    if (!combatState) return;
    if (combatState.botDone) return;
    if (combatState.turn !== 'bot') return;
    if (combatState.phase !== 'playing') return;
    logCombat('🤖 El rival está tardando demasiado → forzando fin de ronda');
    combatState._resolvingAbility = false;
    declareEnd('bot');
  }, 15000);

  updateBotMood();
  showBotThinkBubble('🤔 Pensando<span class="bt-dots"></span>');

  var _thinkMult = (typeof getBotDifficultyInfo === 'function') ? getBotDifficultyInfo().thinkMultiplier : 1;
  var thinkTime = skipThink ? 300 : (BOT_THINK_MIN_MS + Math.random() * (BOT_THINK_MAX_MS - BOT_THINK_MIN_MS)) * _thinkMult;

  setTimeout(function() {
    if (!canBotAct()) { clearBotThinkBubble(); _botBailSafety(); return; }
    _botPlayCardsSequence(0, function() {
      setTimeout(function() {
        if (!canBotAct()) { clearBotThinkBubble(); _botBailSafety(); return; }
        clearBotThinkBubble();
        _botExecuteMainAction();
      }, 200);
    });
  }, thinkTime);
}

/* ═══ Selección ponderada por dificultad ═══ */
function botPickBestWeighted(candidates) {
  if (!candidates || !candidates.length) return null;
  candidates.sort(function(a, b){ return b.score - a.score; });
  var diff = (typeof BOT_DIFFICULTY !== 'undefined') ? BOT_DIFFICULTY : 'normal';

  if (diff === 'nightmare') return candidates[0];

  if (diff === 'hard') {
    var topH = candidates.slice(0, Math.min(2, candidates.length));
    var totalH = topH.reduce(function(a,c){ return a + Math.max(0.1, c.score * c.score); }, 0);
    var rollH = Math.random() * totalH;
    for (var i = 0; i < topH.length; i++) {
      rollH -= Math.max(0.1, topH[i].score * topH[i].score);
      if (rollH <= 0) return topH[i];
    }
    return topH[0];
  }

  if (diff === 'easy') {
    var topE = candidates.slice(0, Math.min(3, candidates.length));
    var totalE = topE.reduce(function(a,c){ return a + Math.max(0.5, Math.sqrt(Math.max(0, c.score))); }, 0);
    var rollE = Math.random() * totalE;
    for (var j = 0; j < topE.length; j++) {
      rollE -= Math.max(0.5, Math.sqrt(Math.max(0, topE[j].score)));
      if (rollE <= 0) return topE[j];
    }
    return topE[0];
  }

  var top = candidates.slice(0, Math.min(2, candidates.length));
  var total = top.reduce(function(a,c){ return a + Math.max(0.1, c.score); }, 0);
  var roll = Math.random() * total;
  for (var k = 0; k < top.length; k++) {
    roll -= Math.max(0.1, top[k].score);
    if (roll <= 0) return top[k];
  }
  return top[0];
}

function _botPlayCardsSequence(played, callback) {
  if (!canBotAct()) { callback(); return; }
  if (played >= BOT_MAX_CARDS_PER_TURN) { callback(); return; }
  var best = botChooseBestCard();
  if (!best) { callback(); return; }
  updateBotThinkBubble('🎴 ' + best.card.name);
  setTimeout(function() {
    if (!canBotAct()) { callback(); return; }
    botPlayCard(best.cardId, best.card, function() {
      if (!canBotAct()) { callback(); return; }
      setTimeout(function() {
        _botPlayCardsSequence(played + 1, callback);
      }, 600);
    });
  }, 400);
}

function _botExecuteMainAction() {
  if (!canBotAct()) { _botBailSafety(); return; }
  var action = botChooseAction();
  if (!action || action.type === 'end') {
    var _bactive = combatState.bot.characters[combatState.bot.activeIndex];
    var _useful = combatState.bot.dice.filter(function(d){ return d.type === _bactive.character.element || d.type === 'omni'; }).length;
    logCombat('🤖 El rival declara fin de ronda (activo: ' + _bactive.character.name + ', dados: ' + _bactive.character.element + '=' + _useful + '/' + combatState.bot.dice.length + ')');
    declareEnd('bot');
    return;
  }
  if (action.type === 'change') {
    var r = tryChangeCharacter('bot', action.index);
    renderCombat();
    if (r === 'quick') setTimeout(function() { botTurn(true); }, 400);
    else if (r) setTimeout(nextTurn, 400);
    else setTimeout(function() { _botExecuteMainAction(); }, 300);
  } else {
    executeAction('bot', action.type);
  }
}

/* ═══ Scheduler de nextTurn que bloquea input durante la transición ═══ */
function scheduleNextTurn(delay) {
  if (!combatState) return;
  combatState._pendingTurnAdvance = true;
  setTimeout(function(){
    if (combatState) combatState._pendingTurnAdvance = false;
    nextTurn();
  }, delay || 400);
}

function nextTurn() {
  if (!combatState || combatState.phase === 'ended') return;
  combatState._pendingTurnAdvance = false;

  // ✅ ERIKXD: "Fuera de plano" — si el que terminó su turno era ErikXD activo, forzar cambio a reserva
  var _prevTurn = combatState.turn;
  var _prevSide = combatState[_prevTurn];
  if (_prevSide) {
    var _prevActive = _prevSide.characters[_prevSide.activeIndex];
    if (_prevActive && !_prevActive.dead && _prevActive.id === 'erikxd') {
      var _nxE = getNextAliveIndex(_prevSide, _prevSide.activeIndex);
      if (_nxE >= 0 && _nxE !== _prevSide.activeIndex) {
        _prevSide.activeIndex = _nxE;
        logCombat('📸 Fuera de plano: ErikXD a reserva · ' + _prevSide.characters[_nxE].character.name + ' activo');
      }
    }
  }

  if (combatState.playerDone && combatState.botDone) { endRound(); return; }
  if (currentGameMode === 'sandbox' && sandboxTurnMode === 'player-only') {
    combatState.turn = 'player';
    renderCombat();
    return;
  }
  var next = combatState.turn === 'player' ? 'bot' : 'player';
  if (next === 'player' && combatState.playerDone) next = 'bot';
  else if (next === 'bot' && combatState.botDone) next = 'player';
  combatState.turn = next;
  var prevTurnSide = (next === 'player') ? 'bot' : 'player';
  if (combatState[prevTurnSide]) {
    combatState[prevTurnSide].characters.forEach(function(c){
      if (c.id === 'sage' && c.states) c.states.sageEnteredThisTurn = false;
    });
  }
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
  var sdDecl = combatState[who];
  var activeDecl = sdDecl.characters[sdDecl.activeIndex];
  if (activeDecl && !activeDecl.dead && activeDecl.id === 'neon') {
    var nxDecl = getNextAliveIndex(sdDecl, sdDecl.activeIndex);
    if (nxDecl >= 0 && nxDecl !== sdDecl.activeIndex) {
      addOrRefreshShield(activeDecl, 'neon_passive', 2);
      sdDecl.activeIndex = nxDecl;
      logCombat('🎆 Neón (pasiva): +2 escudo y cambia a ' + sdDecl.characters[nxDecl].character.name);
      triggerKillerTunesDamage(who);
    } else {
      logCombat('🎆 Neón (pasiva): no puede cambiar de personaje (no hay otros aliados vivos) — sin escudo');
    }
  }
  if (currentGameMode === 'sandbox' && sandboxTurnMode === 'player-only' && who === 'player') {
    combatState.botDone = true;
  }
  if (!combatState.firstDeclarer) combatState.firstDeclarer = who;
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
  if (combatState.roundEnding) return;
  combatState.roundEnding = true;
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
        logCombat('🔮 La Cobertura de Fe se desvanece');
      }
    });
  });
  applyStructureEndOfRoundEffects('player'); applyStructureEndOfRoundEffects('bot');

  // ═══ EX-María: efectos diferidos ═══
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
  ['player','bot'].forEach(function(wk){
    combatState[wk].characters.forEach(function(c){
      if (c.id === 'exmaria' && !c.dead) {
        c.energy = Math.min(c.maxEnergy, c.energy + 1);
        if (c._flushPendingEnergy) c._flushPendingEnergy();
        logCombat('🌻 EX-María: energía consolidada al final de ronda');
      }
    });
  });
  ['player','bot'].forEach(function(wk){
    combatState[wk].characters.forEach(function(c){
      if (c.id === 'exmaria' && c.states) c.states.roceCounter = 0;
    });
  });
  ['player','bot'].forEach(function(wk){
    combatState[wk].characters.forEach(function(c){
      if (c.id === 'maria' && c.states) c.states.cosechaCounter = 0;
    });
  });
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
  ['player','bot'].forEach(function(wk){
    var sd = combatState[wk];
    var ncCs = sd.characters.find(function(c){ return c.id === 'nc' && !c.dead; });
    if (!ncCs) return;
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
    if (!ncCs.dead && ncCs.hp > 0) {
      var ncSide = sideOfChar(ncCs);
      dealDamageToChar(ncCs, 1, { targetSide: ncSide.side, targetSideKey: ncSide.key, targetIdx: ncSide.side.characters.indexOf(ncCs) });
      logCombat('🎯 NC (pasiva): 1 daño al final de la ronda');
    }
  });
  ['player','bot'].forEach(function(wk){ combatState[wk].podridaHitsAll = false; });

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
    if (envCur.id === 'sobrecarga_epileptica') {
      var ownerEnvSide = combatState[envCur.ownerSide];
      var nxEnv = getNextAliveIndex(ownerEnvSide, ownerEnvSide.activeIndex);
      if (nxEnv >= 0 && nxEnv !== ownerEnvSide.activeIndex) {
        ownerEnvSide.activeIndex = nxEnv;
        logCombat('⚡ Sobrecarga Epiléptica: ' + ownerEnvSide.characters[nxEnv].character.name + ' pasa a activo');
        triggerKillerTunesDamage(envCur.ownerSide);
        flashCombatElement('#combatEnvironmentDisplay', '⚡ CAMBIO', '#5cb3ff');
        if (typeof renderCombat === 'function') renderCombat();
      }
    }
    if (envCur.id === 'campo_girasoles') {
      flashCombatElement('#combatEnvironmentDisplay', '🌻 +1 curación', '#7aff9a');
    }
    envCur.roundsLeft--;
    if (envCur.roundsLeft <= 0) {
      logCombat('🌍 El entorno ' + envCur.name + ' desaparece');
      combatState.environment = null;
    }
    updateEnvironmentVisuals();
  }

  // ✅ EX Abla (Sangría Persistente)
  ['player','bot'].forEach(function(wk){
    var sd = combatState[wk];
    var ablaEx = sd.characters.find(function(c){ return c.id === 'abla' && c.exActive && !c.dead; });
    if (!ablaEx) return;
    var ek = wk === 'player' ? 'bot' : 'player';
    var es = combatState[ek];
    es.characters.forEach(function(c, i){
      if (c.dead || !c.states || !c.states.rencor) return;
      dealDamageToChar(c, 1, { targetSide: es, targetSideKey: ek, targetIdx: i });
      logCombat('🌟 EX Abla: ' + c.character.name + ' con Rencor recibe 1 daño');
    });
  });

  // ═══ Vittoria: resolución de "Visto" ═══
  (function resolveVisto() {
    var vittoriaSideKey = null, vittoriaCs = null;
    ['player','bot'].forEach(function(wk){
      var vc = combatState[wk].characters.find(function(c){ return c.id === 'vittoria'; });
      if (vc) { vittoriaSideKey = wk; vittoriaCs = vc; }
    });
    if (!vittoriaCs) return;
    var affected = [];
    ['player','bot'].forEach(function(wk){
      combatState[wk].characters.forEach(function(c){
        if (!c.dead && c.states && c.states.visto) affected.push({ cs: c, sideKey: wk });
      });
    });
    if (affected.length === 0) return;
    var teamWiped = combatState[vittoriaSideKey].characters.every(function(c){ return c.dead; });
    if (vittoriaCs.dead && teamWiped) {
      affected.forEach(function(a){ csSetState(a.cs, 'visto', false); });
      logCombat('👁️ Visto: Vittoria fue la última en morir → no se resuelve');
      return;
    }
    var totalDmg = vittoriaCs.dead ? 12 : 6;
    var n = affected.length;
    var base = Math.floor(totalDmg / n);
    var remainder = totalDmg % n;
    logCombat('👁️ Visto: ' + totalDmg + ' daño penetrante repartido entre ' + n + (vittoriaCs.dead ? ' (Vittoria ha muerto)' : ''));
    affected.forEach(function(a, idx){
      var dmg = base + (idx < remainder ? 1 : 0);
      if (dmg > 0) {
        var tSide = combatState[a.sideKey];
        dealDamageToChar(a.cs, dmg, { piercing: true, targetSide: tSide, targetSideKey: a.sideKey, targetIdx: tSide.characters.indexOf(a.cs) });
      }
      csSetState(a.cs, 'visto', false);
      logCombat('  → ' + a.cs.character.name + ' recibe ' + dmg + ' daño penetrante');
    });
    if (vittoriaCs.dead) {
      vittoriaCs.dead = false;
      vittoriaCs.hp = 1;
      logCombat('👑 Vittoria revive con 1 HP');
      var vs = combatState[vittoriaSideKey];
      if (vs.activeIndex === -1 || vs.characters[vs.activeIndex].dead) vs.activeIndex = vs.characters.indexOf(vittoriaCs);
    }
  })();

  ['player','bot'].forEach(function(wk){ var sd = combatState[wk]; if (sd.hand) sd.hand = sd.hand.filter(function(cid){ return !PAINT_CARDS[cid]; }); });
  var pdead = processDeathsAtRoundEnd('player'), bdead = processDeathsAtRoundEnd('bot');
  renderCombat();
  if (bdead) { setTimeout(function(){ endCombat('player'); }, 600); return; }
  if (pdead) { setTimeout(function(){ endCombat('bot'); }, 600); return; }

  // ✅ Facebook EX
  ['player','bot'].forEach(function(wk){
    var sd = combatState[wk];
    var fb = sd.characters.find(function(c){ return c.id === 'facebook' && !c.dead; });
    if (fb && fb.exActive && !sd.anyAllyDiedThisRound) {
      drawFromDeck(wk);
      logCombat('📘 EX Facebook: ningún aliado derrotado → +1 carta');
    }
  });

  // ✅ Reset de entradas de YouTube
  ['player','bot'].forEach(function(wk){
    combatState[wk].characters.forEach(function(c){
      if (c.id === 'youtube' && c.states) {
        c.states.ytEnteredThisRound = 0;
        c.states.ytPopFrozen = false;
      }
    });
  });

  combatState.round++; combatState.playerDone = false; combatState.botDone = false;
  combatState.player.firstChangeUsed = false; combatState.player.firstAttackUsed = false;
  combatState.bot.firstChangeUsed = false; combatState.bot.firstAttackUsed = false;
  // ✅ Alter: decremento del buff
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

  // ✅ OPAL: decrementar resonanciasCuran
  ['player','bot'].forEach(function(wk){
    var s = combatState[wk];
    if (s.resonanciasCuran && s.resonanciasCuran.roundsLeft > 0) {
      s.resonanciasCuran.roundsLeft--;
      if (s.resonanciasCuran.roundsLeft <= 0) logCombat('🎨 Por un mundo lleno de color se desvanece');
    }
  });

  // ✅ ERIKXD: +1 energía si termina la ronda en reserva + reset Nostalgia-Bait
  ['player','bot'].forEach(function(wk){
    var sd = combatState[wk];
    var ek = sd.characters.find(function(c){ return c.id === 'erikxd' && !c.dead; });
    if (ek && sd.activeIndex !== sd.characters.indexOf(ek)) {
      ek.energy = Math.min(ek.maxEnergy, ek.energy + 1);
      logCombat('📸 ErikXD: +1 energía (en reserva)');
    }
  });
  combatState.player.nostalgiaBaitActive = false;
  combatState.bot.nostalgiaBaitActive = false;

  ['player','bot'].forEach(function(wk){ combatState[wk].characters.forEach(function(c){
    c.pendingBuff = 0; c.cardMarkBonus = 0;
    if (c.states) {
      c.states.acelerado = false;
      c.states.furia = false; c.states.furiaPending = false; c.states.furiaTarget = null;
      if (c.id === 'alter' && c.states.invulnerabilidad > 0) {
        c.states.invulnerabilidad = Math.max(0, c.states.invulnerabilidad - 1);
        logCombat('🛡️ Alter pierde 1 invulnerabilidad (queda ' + c.states.invulnerabilidad + ')');
      }
      if (c.id !== 'alter') c.states.invulnerabilidad = 0;
      if (c.id === 'hunger' && !c.dead && hasAnyMark(c)) {
        c.hp = Math.max(0, c.hp - 2);
        logCombat('👹 Hunger pierde 2 HP por su marca (queda ' + c.hp + '/' + c.maxHp + ')');
        if (c.hp <= 0) { var hSide = combatState[wk]; handleDeath(wk, hSide.characters.indexOf(c)); }
      }
      if (c.id === 'iris') {
        c.states.advertenciaActive = false;
        if (c.states.advertenciaShieldActive) {
          c.shields = (c.shields || []).filter(function(sh){ return sh.source !== 'iris_advertencia'; });
          c.states.advertenciaShieldActive = false;
          logCombat('🛡️ Advertencia: el escudo restante de Iris se desvanece');
        }
      }
      if (c.states.buenRecaudo) c.states.buenRecaudo = false;
      if (c.states.irritacion) c.states.irritacion = false;
      if (c.states.provocacion) c.states.provocacion = false;
      // ✅ DAVID: Capa real también se limpia al final de ronda si no se consumió
      if (c.states.capaReal) {
        c.states.capaReal = false;
        c.shields = (c.shields || []).filter(function(sh){ return sh.source !== 'capa_real'; });
      }
      if (c.id === 'sage' && c.states.decidida > 0) {
        c.states.decidida -= 1;
        logCombat('🐴 Sage: pierde 1 Decidida (' + c.states.decidida + '/3)');
        var _sageSide = sideOfChar(c);
        dealDamageToChar(c, 1, { targetSide:_sageSide.side, targetSideKey:_sageSide.key, targetIdx:_sageSide.side.characters.indexOf(c) });
        logCombat('🐴 Sage: -1 HP por pérdida de Decidida');
      }
    }
  }); });
  combatState.player.neonUltChangeDamage = false;
  combatState.bot.neonUltChangeDamage = false;
  combatState.player.rerolled = false; combatState.player.selected = {}; combatState.player.rollingIds = {};
  combatState.player.cardsUsedThisRound = {};
  combatState.bot.rerolled = false; combatState.bot.selected = {}; combatState.bot.rollingIds = {};
  combatState.bot.cardsUsedThisRound = {};
  setTimeout(function(){
    combatState.roundEnding = false;
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
      startDrawPhase();
      return;
    }
    showRollOverlay();
  }, 2400);
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

/* ═══ Popup con el nombre de la habilidad ═══ */
function showAbilityNamePopup(who, idx, name, actionType, customIcon) {
  var sel = '.combat-char-card[data-team="' + who + '"][data-index="' + idx + '"]';
  var card = document.querySelector(sel);
  if (!card) return;
  var rect = card.getBoundingClientRect();
  var isEnemy = (who === 'bot');

  var popup = document.createElement('div');
  popup.className = 'ability-name-popup';
  if (isEnemy) popup.classList.add('enemy');
  if (actionType === 'ultimate') popup.classList.add('ultimate');
  else if (actionType === 'elemental') popup.classList.add('elemental');
  else if (actionType === 'card') popup.classList.add('card');

  var icon = customIcon || (actionType === 'normal' ? '⚔️' : (actionType === 'elemental' ? '🔮' : (actionType === 'card' ? '🎴' : '💥')));
  popup.innerHTML = '<span class="anp-icon">' + icon + '</span><span class="anp-name">' + name + '</span>';

  var preferAbove = rect.top > 120;
  var left = rect.left + rect.width / 2;
  var top = preferAbove ? (rect.top - 8) : (rect.bottom + 8);

  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
  popup.style.transform = preferAbove ? 'translate(-50%, -100%) scale(0.6)' : 'translate(-50%, 0) scale(0.6)';
  document.body.appendChild(popup);

  requestAnimationFrame(function() {
    popup.classList.add('show');
    popup.style.transform = preferAbove ? 'translate(-50%, -100%) scale(1)' : 'translate(-50%, 0) scale(1)';
  });

  setTimeout(function() {
    popup.classList.remove('show');
    popup.style.transform = preferAbove ? 'translate(-50%, -100%) scale(0.6)' : 'translate(-50%, 0) scale(0.6)';
    setTimeout(function(){ if (popup.parentNode) popup.remove(); }, 400);
  }, 1400);
}

function showCardNamePopup(who, idx, card) {
  if (!card) return;
  showAbilityNamePopup(who, idx, card.name, 'card', card.emoji || '🎴');
}

/* ═══ Overlay de carta usada ═══ */
var _usedCardOverlayTimerHold = null;
var _usedCardOverlayTimerFade = null;

function _usedCardOverlayCleanup() {
  if (_usedCardOverlayTimerHold) { clearTimeout(_usedCardOverlayTimerHold); _usedCardOverlayTimerHold = null; }
  if (_usedCardOverlayTimerFade) { clearTimeout(_usedCardOverlayTimerFade); _usedCardOverlayTimerFade = null; }
  var ov = document.getElementById('usedCardOverlay');
  if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
}

function showUsedCardOverlay(card, who, onComplete) {
  if (!card) { if (onComplete) onComplete(); return; }
  var ov = document.getElementById('usedCardOverlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'usedCardOverlay';
    ov.className = 'used-card-overlay';
    document.body.appendChild(ov);
  }
  if (_usedCardOverlayTimerHold) { clearTimeout(_usedCardOverlayTimerHold); _usedCardOverlayTimerHold = null; }
  if (_usedCardOverlayTimerFade) { clearTimeout(_usedCardOverlayTimerFade); _usedCardOverlayTimerFade = null; }

  var meta = (typeof CARD_CATEGORY_META !== 'undefined' && CARD_CATEGORY_META[card.category]) || { label: 'Evento', icon: '✨', color: '165,131,255' };
  var catIcon = card.category === 'equipo' ? '⚔️ ' : card.category === 'apoyo' ? '📜 ' : card.category === 'pintura' ? '🎨 ' : card.category === 'plush' ? '🧸 ' : '✨ ';
  var costText = (typeof formatCardCost === 'function') ? formatCardCost(card) : '';
  var durationText = card.duration ? ' · ⏳ ' + card.duration + ' ronda(s)' : '';
  var isEnemy = (who === 'bot');
  ov.className = 'used-card-overlay' + (isEnemy ? ' from-bot' : ' from-player');
  ov.innerHTML =
    '<div class="used-card" style="--dc: ' + (card.color || '165,131,255') + '; --cat: ' + meta.color + ';">' +
      '<div class="used-card-top"><span class="used-card-cat">' + catIcon + meta.label + '</span><span class="used-card-tag">' + (card.tag || '') + '</span></div>' +
      '<div class="used-card-emoji">' + (card.emoji || '🎴') + '</div>' +
      '<div class="used-card-name">' + (card.name || '') + '</div>' +
      '<div class="used-card-cost">🎲 ' + costText + durationText + '</div>' +
      '<div class="used-card-effect">' + (card.effectText || '') + '</div>' +
    '</div>';
  requestAnimationFrame(function(){ ov.classList.add('show'); });

  _usedCardOverlayTimerHold = setTimeout(function(){
    _usedCardOverlayTimerHold = null;
    ov.classList.remove('show');
    _usedCardOverlayTimerFade = setTimeout(function(){
      _usedCardOverlayTimerFade = null;
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      if (onComplete) onComplete();
    }, 300);
  }, 1400);
}

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
  if (!oldChar.exActive) return;
  var newActive = side.characters[newIndex];
  if (!newActive || newActive.dead) return;
  addOrRefreshShield(newActive, 'google_ex', 1);
  logCombat('🔍 EX Google: ' + newActive.character.name + ' +1 escudo (total: ' + totalShield(newActive) + ')');
}

/* ═══ YouTube: Popularidad y Forma ═══ */
function gainYouTubePop(cs, amount, reason) {
  if (!cs || cs.id !== 'youtube') return;
  if (cs.states && cs.states.ytPopFrozen) { logCombat('📺 Popularidad congelada (EX)'); return; }
  var old = cs.popularidad || 0;
  cs.popularidad = Math.min(7, old + amount);
  logCombat('📺 YouTube +' + amount + ' pop (' + old + '→' + cs.popularidad + ')' + (reason ? ' · ' + reason : ''));
  checkYouTubeForma(cs);
}
function loseYouTubePop(cs, amount, reason) {
  if (!cs || cs.id !== 'youtube') return;
  if (cs.states && cs.states.ytPopFrozen) return;
  var old = cs.popularidad || 0;
  cs.popularidad = Math.max(0, old - amount);
  if (cs.popularidad !== old) logCombat('📺 YouTube -' + amount + ' pop (' + old + '→' + cs.popularidad + ')' + (reason ? ' · ' + reason : ''));
  checkYouTubeForma(cs);
}
function checkYouTubeForma(cs) {
  if (!cs || cs.id !== 'youtube') return;
  var pop = cs.popularidad || 0;
  var newForma = pop >= 5 ? 'idol' : 'casual';
  var oldForma = cs.forma || 'casual';
  if (oldForma !== newForma) {
    cs.forma = newForma;
    logCombat('📺 YouTube → forma ' + newForma.toUpperCase());
  }
}
function onYouTubeBecomeActive(cs) {
  if (!cs || cs.id !== 'youtube') return;
  if (!cs.states) cs.states = {};
  var cnt = cs.states.ytEnteredThisRound || 0;
  cs.states.ytEnteredThisRound = cnt + 1;
  var gain = cnt === 0 ? 2 : 1;
  gainYouTubePop(cs, gain, 'entrada #' + (cnt + 1));
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

  var applyGeneric = [
    'damage','trazoVivo','intervencion','aceleron','instinto','deudaSangre','graciaPicara','cosecha','rocePosible','pilarFundamental',
    'zasca','allEyesOnMe','littleBooBoo','sueloALaCara','vittoriaNormal','hotToGo','theWorldIsMine','sublevacion','petiteEtoile','feliciaNormal','davidNormal'
  ].indexOf(ability.kind) !== -1;
  if (ability.target === 'enemy' && preview.baseDmg > 0 && target) {
    if (applyGeneric) {
      var gb = getGenericBonuses(active);
      preview.buffDmg = gb.pendingBuff;
      preview.cardBonus = gb.cardBonus;
      preview.equipDmg = gb.equipBonus;
      preview.supportDmg = getSupportAttackBonus(side);
      if (actionType === 'normal') preview.optimizationDmg = getOptimizationBonus(side);
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

  // ✅ Felicia
  if (ability.kind === 'feliciaNormal') {
    if (csHasState(active, 'drogada')) preview.notes.push('🩸 Drogada: +2 daño (ya aplicado en base)');
    if (csHasState(active, 'doubleDown')) preview.notes.push('🎲 Double Down: daño ×2 (ya aplicado, se consume)');
  }
  if (ability.kind === 'feliciaElemental') {
    var fTargetHp = csHasState(active, 'doubleDown') ? 8 : 4;
    preview.notes.push('🎲 HP objetivo → ' + fTargetHp + ' (ignora pasiva y límites)');
    if (csHasState(active, 'drogada')) {
      var fDraws = csHasState(active, 'doubleDown') ? 4 : 2;
      preview.notes.push('🩸 Drogada: roba ' + fDraws + ' + marca Expresión (se consume el snapshot inicial)');
    }
    if (csHasState(active, 'doubleDown')) preview.notes.push('🎲 Double Down consumido');
  }
  if (ability.kind === 'feliciaUltimate') {
    preview.notes.push('🎲 Activa Double Down · normal +1 exp, elemental +1 exp · próxima habilidad dobla efectos');
  }

  // ✅ David
  if (ability.kind === 'davidNormal') {
    preview.notes.push(combatState._currentIsCounterAttack ? '👑 Comandado: +1 daño (total 2)' : '👑 Manual: 1 daño · Comandado (contraataque automático): 2 daño');
  }
  if (ability.kind === 'davidElemental') {
    var nxDavid = getNextAliveIndex(side, side.activeIndex);
    if (nxDavid >= 0 && nxDavid !== side.activeIndex) preview.notes.push('👑 Cambia a ' + side.characters[nxDavid].character.name + ' · recibe Capa real (2 HP, dispara contraataque de David)');
    else preview.notes.push('⚠️ Sin aliados a los que cambiar');
  }
  if (ability.kind === 'davidUlt') {
    var allyActive = side.characters[side.activeIndex];
    if (allyActive && !allyActive.dead) {
      var hasEsp = allyActive.equipment && allyActive.equipment.indexOf('david_espada') >= 0;
      if (hasEsp) preview.notes.push('👑 Aliado con Espada: 2 daño + +1 permanente a Espada/Corona');
      else preview.notes.push('👑 Aliado sin Espada: recibe Corona Dorada (-1 daño recibido, +1 daño si David vivo)');
    }
  }

  // ✅ ErikXD
  if (ability.kind === 'erikxdNormal') {
    preview.notes.push('📸 Acción rápida');
    if (active.equipment && active.equipment.indexOf('erikxd_camara_confiable') >= 0 && active.states && active.states.cameraUsos > 0) preview.notes.push('📷 Cámara confiable: marca Protección (gasta 1 uso)');
  }
  if (ability.kind === 'erikxdSetup') {
    if (active.equipment && active.equipment.indexOf('erikxd_camara_confiable') >= 0) preview.notes.push('📸 Cámara confiable → Cámara profesional (3r)');
    else preview.notes.push('📸 Equipa Cámara confiable (3 usos)');
  }
  if (ability.kind === 'erikxdUlt') {
    preview.notes.push('📸 +3 escudo aliados · esta ronda cámaras pegan a todos con +1 daño · ErikXD también recibe el daño');
  }

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
    else preview.notes.push('🏷️ Marca con Ilusión');
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

  if (ability.kind === 'armonia') preview.notes.push('🏷️ Marca al enemigo con protección');
  if (ability.kind === 'hipotesisSolida') preview.notes.push('🛡️ +2 escudo; si un enemigo lo golpea, lo marca con comprensión');
  if (ability.kind === 'conclusion') {
    var alliesCon = side.characters.filter(function(c){ return c !== active && !c.dead; });
    preview.notes.push('🛡️ ' + alliesCon.length + ' aliado(s) +1 escudo y +1 energía');
  }
  if (ability.kind === 'defensaActiva') preview.notes.push('💠 Al próximo ataque: -1 daño y contraataque');

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
  if (ability.kind === 'decadencia') preview.notes.push('📈 +1 stack (Degradación: +1 daño, -1 coste)');

  if (ability.kind === 'optimizacion') {
    var hasOptim = side.structures && side.structures.some(function(st){ return st.kind === 'optimizacion'; });
    if (hasOptim) {
      preview.notes.push('🏛️ Extiende la estructura +1 ronda (máx 3) · +2 daño a ataques normales (mantiene bono si ya estaba activa)');
    } else {
      preview.notes.push('🏛️ Coloca estructura (2 rondas): +2 daño a ataques normales desde su 2ª ronda · 1 daño final de ronda + marca Comprensión');
    }
  }
  if (ability.kind === 'obraMaestra') {
    var hasOpt = side.structures && side.structures.some(function(st){ return st.kind === 'optimizacion'; });
    if (hasOpt) preview.notes.push('💥 Definitivas x2 daño (2 rondas)');
    else preview.notes.push('❌ Requiere estructura Optimización en campo');
  }
  if (ability.kind === 'penitencia') preview.notes.push('🩸 Entra en Castigada');
  if (ability.kind === 'bajoAlas') preview.notes.push('💔 Aliado con menos vida → Vulnerable');
  if (ability.kind === 'impulso') preview.notes.push('💪 +2 al siguiente ataque normal; pasa a reserva');
  if (ability.kind === 'contraofensiva' && csHasState(active, 'furia')) preview.notes.push('🔥 Furia activa');
  if (ability.kind === 'reescritura') preview.notes.push('📜 Restaura apoyo propio / destruye apoyo enemigo');
  if (ability.kind === 'canon') preview.notes.push('📜 Roba hasta 3 apoyos y activa los del campo');

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

  if (ability.kind === 'protocoloSeguridad') {
    preview.notes.push('🛡️ +2 escudo');
    preview.notes.push('📘 -1 dado a la siguiente carta jugada');
  }
  if (ability.kind === 'pilarFundamental') {
    var hasMQ = side.structures && side.structures.some(function(s){ return s.kind === 'metaQuest'; });
    if (hasMQ) preview.notes.push('📘 Meta Quest: ya activa');
    else preview.notes.push('📘 Coloca Meta Quest (2 rondas): activo +1 HP por ataque normal');
  }
  if (actionType === 'normal' && side.structures && side.structures.some(function(s){ return s.kind === 'metaQuest'; })) {
    preview.notes.push('📘 Meta Quest: +1 HP al activo tras el ataque normal');
  }

  if (ability.kind === 'cosecha') {
    var cosechaCounterP = (active.states && active.states.cosechaCounter) || 0;
    if (cosechaCounterP === 0) preview.notes.push('🌻 Primera Cosecha de la ronda: solo 1 daño');
    else {
      preview.notes.push('🌻 Repetición #' + (cosechaCounterP + 1) + ': 1 daño + cura 1 HP');
      var cosechaHealP = getMariaTarget(side, active);
      if (cosechaHealP < 0) preview.notes.push('⚠️ Sin otros aliados vivos: no hay curación');
      else preview.notes.push('💚 ' + side.characters[cosechaHealP].character.name + ' +1 HP');
    }
  }
  if (ability.kind === 'caricia') {
    var ctT = getMariaTarget(side, active);
    var ctNoOne = (ctT < 0) || (side.characters[ctT].hp >= side.characters[ctT].maxHp);
    if (!ctNoOne) { var ctCs = side.characters[ctT]; preview.notes.push('💚 Cura 3 HP a ' + ctCs.character.name + ' (' + ctCs.hp + '/' + ctCs.maxHp + ')'); }
    else preview.notes.push('💚 Sin aliados a los que curar → María se cura 2 HP y marca al enemigo con Aceptación');
  }
  if (ability.kind === 'amor') {
    var fallenP = null;
    if (side.lastDeadAlly) fallenP = side.characters.find(function(c){ return c.id === side.lastDeadAlly && c.dead; });
    if (!fallenP) fallenP = side.characters.find(function(c){ return c.dead; });
    if (fallenP) preview.notes.push('✝️ Revive a ' + fallenP.character.name + ' con 3 HP (máx. 5)');
    else preview.notes.push('⚠️ Sin aliado caído: solo se establece el entorno');
    preview.notes.push('🌻 Coloca/refresca Campo de Girasoles (2 rondas)');
  }

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

  // ═══ Efectos secundarios ═══
  preview.effects = [];
  var ef = preview.effects;

  if (ability.kind === 'zasca') ef.push({ type: 'state', icon: '😤', label: 'Irritación (1 ronda)', target: 'enemy' });
  if (ability.kind === 'circoMediatico') {
    ef.push({ type: 'state', icon: '🎯', label: 'Provocación (1 ronda)', target: 'self' });
    ef.push({ type: 'resource', icon: '🛡️', label: '+2 escudo', target: 'self' });
    ef.push({ type: 'resource', icon: '⚡', label: '−1 energía', target: 'enemy' });
  }
  if (ability.kind === 'sublevacion') ef.push({ type: 'text', icon: '🎲', label: 'Destruye 2 dados aleatorios del rival' });

  if (ability.kind === 'allEyesOnMe') {
    if (active.forma === 'idol') ef.push({ type: 'state', icon: '🏷️', label: 'Marca con Expresión', target: 'enemy' });
    else ef.push({ type: 'text', icon: '💭', label: 'En forma Casual no marca (necesitas 5+ pop)' });
  }
  if (ability.kind === 'hotToGo') {
    if (active.forma === 'casual') {
      ef.push({ type: 'resource', icon: '📺', label: '+2 Popularidad', target: 'self' });
      var nextPop = Math.min(7, (active.popularidad || 0) + 2);
      if (nextPop >= 5 && (active.popularidad || 0) < 5) {
        ef.push({ type: 'text', icon: '🎤', label: 'Cambio de forma: Casual → Idol' });
        ef.push({ type: 'resource', icon: '🎲', label: '+2 dados de Expresión (cambio de forma)', target: 'self' });
      }
    }
  }
  if (ability.kind === 'theWorldIsMine') {
    ef.push({ type: 'resource', icon: '📺', label: '−1 Popularidad', target: 'self' });
    var popNowWim = active.popularidad || 0;
    var bonusWim = Math.floor(popNowWim / 2);
    ef.push({ type: 'text', icon: '💥', label: 'Al activo: ' + (2 + bonusWim) + ' piercing · Al resto: 1 piercing' });
  }

  if (ability.kind === 'littleBooBoo') {
    if (csHasState(active, 'paillettes')) {
      if (active.exActive) ef.push({ type: 'text', icon: '🌟', label: 'EX Étoile: +1 daño adicional (Paillettes)' });
      ef.push({ type: 'resource', icon: '🛡️', label: '+1 escudo (fuente Paillettes, máx 3)', target: 'self' });
    }
  }
  if (ability.kind === 'pluschtier') {
    ef.push({ type: 'text', icon: '🐰', label: 'Genera Plüschhase en la mano (coste 0)' });
    ef.push({ type: 'text', icon: '🐻', label: 'Al usar Plüschhase → inyecta Plüschbär en mazo rival' });
  }
  if (ability.kind === 'petiteEtoile') {
    ef.push({ type: 'state', icon: '✨', label: 'Paillettes (hasta fin de combate)', target: 'self' });
    ef.push({ type: 'text', icon: '🛡️', label: 'Cada ataque normal: +1 escudo (máx 3)' });
  }

  if (ability.kind === 'sueloALaCara') {
    if (active.equipment && active.equipment.length) {
      ef.push({ type: 'text', icon: '💥', label: 'Rompe ' + active.equipment.length + ' equipación(es) propia(s) para +' + active.equipment.length + ' daño' });
    }
  }
  if (ability.kind === 'irisAdvertencia') {
    ef.push({ type: 'resource', icon: '🛡️', label: '+3 escudo (se pierde al fin de ronda)', target: 'self' });
    ef.push({ type: 'text', icon: '🔄', label: 'Cambia al siguiente aliado activo' });
    ef.push({ type: 'state', icon: '⚔️', label: 'Advertencia activa (resto de ronda)', target: 'self' });
    ef.push({ type: 'text', icon: '🎯', label: 'Ataques al activo se redirigen a Iris (+1 daño)' });
  }
  if (ability.kind === 'liderPunoHierro') {
    var hasAdv = enemyActive && enemyActive.states && enemyActive.states.advertido > 0;
    if (hasAdv) {
      ef.push({ type: 'text', icon: '🥊', label: 'Ataca con Suela a la Cara (+2 daño base fijo)' });
      if (active.exActive) ef.push({ type: 'text', icon: '🌟', label: 'EX: consume ' + (enemyActive.states.advertido || 0) + ' carga(s) para +' + ((enemyActive.states.advertido || 0) * 2) + ' daño extra' });
    } else {
      ef.push({ type: 'state', icon: '🛡️', label: 'Buen Recaudo a aliados vivos', target: 'team' });
      ef.push({ type: 'resource', icon: '🛡️', label: '+2 escudo', target: 'self' });
    }
  }

  if (ability.kind === 'vittoriaNormal') ef.push({ type: 'text', icon: '🎲', label: 'Reembolso de dados si mata al enemigo' });
  if (ability.kind === 'vittoriaAceptacion') {
    if (enemyActive && csHasMark(enemyActive, 'aceptacion')) ef.push({ type: 'resource', icon: '🌿', label: '+2 HP (enemigo ya marcado)', target: 'self' });
    else ef.push({ type: 'text', icon: '🌿', label: '1 daño penetrante + marca con Aceptación' });
  }
  if (ability.kind === 'vistoUltimate') {
    ef.push({ type: 'state', icon: '👁️', label: 'Visto (aliados + enemigo activo)', target: 'both' });
    ef.push({ type: 'text', icon: '👁️', label: 'Fin de ronda: 6 penetrante repartido (12 si Vittoria muere → revive con 1 HP)' });
  }

  if (ability.kind === 'intervencion' && enemyActive && csHasState(enemyActive, 'amenaza')) ef.push({ type: 'state', icon: '🚨', label: 'Quita Amenaza al enemigo', target: 'enemy' });
  if (ability.kind === 'bajoAlas') ef.push({ type: 'state', icon: '💔', label: 'Vulnerable al aliado con menos vida', target: 'team' });
  if (ability.kind === 'trazoVivo' && !active.paintEquipped) ef.push({ type: 'state', icon: '🎭', label: 'Marca con Ilusión', target: 'enemy' });
  if (ability.kind === 'graciaPicara' || ability.kind === 'flechazoTentador') ef.push({ type: 'state', icon: '🔥', label: 'Marca con Transformación', target: 'enemy' });
  if (ability.kind === 'aceleron' && csHasState(active, 'acelerado')) ef.push({ type: 'state', icon: '🔥', label: 'Marca con Transformación', target: 'enemy' });
  if (ability.kind === 'deudaSangre') ef.push({ type: 'state', icon: '💢', label: '+1 Rencor', target: 'enemy' });
  if (ability.kind === 'degradacion') ef.push({ type: 'state', icon: '🩸', label: 'Marca con Redención', target: 'enemy' });
  if (ability.kind === 'cosecha' && (active.states && active.states.cosechaCounter) >= 1) ef.push({ type: 'resource', icon: '🌿', label: '+1 HP al aliado con menos vida', target: 'team' });

  return preview;
}
function buildPreviewBodyHTML(preview) {
  var html = '<div class="confirm-body">';
  if (preview.rawDmg > 0 || preview.trueDmg > 0) {
    var hasB = preview.buffDmg || preview.cardBonus || preview.equipDmg || preview.supportDmg || preview.optimizationDmg || preview.erikBonus || preview.markBonus || preview.redencionDmg || preview.obraMaestraDmg || preview.carrerillaBonus || preview.alterBuffDmg;
    if (hasB) {
      html += '<div class="confirm-row"><span class="confirm-row-label">Daño base</span><span class="confirm-row-value damage">' + preview.baseDmg + '</span></div>';
      if (preview.buffDmg)          html += '<div class="confirm-row"><span class="confirm-row-label">+ Impulso</span><span class="confirm-row-value bonus">+' + preview.buffDmg + '</span></div>';
      if (preview.cardBonus)        html += '<div class="confirm-row"><span class="confirm-row-label">+ Carta</span><span class="confirm-row-value bonus">+' + preview.cardBonus + '</span></div>';
      if (preview.equipDmg)         html += '<div class="confirm-row"><span class="confirm-row-label">+ Equipo</span><span class="confirm-row-value bonus">+' + preview.equipDmg + '</span></div>';
      if (preview.supportDmg)       html += '<div class="confirm-row"><span class="confirm-row-label">+ Apoyos</span><span class="confirm-row-value bonus">+' + preview.supportDmg + '</span></div>';
      if (preview.optimizationDmg)  html += '<div class="confirm-row"><span class="confirm-row-label">+ Optimización</span><span class="confirm-row-value bonus">+' + preview.optimizationDmg + '</span></div>';
      if (preview.obraMaestraDmg)   html += '<div class="confirm-row"><span class="confirm-row-label">+ Obra Maestra</span><span class="confirm-row-value bonus">+' + preview.obraMaestraDmg + '</span></div>';
      if (preview.erikBonus)        html += '<div class="confirm-row"><span class="confirm-row-label">+ Inspiración</span><span class="confirm-row-value bonus">+' + preview.erikBonus + '</span></div>';
      if (preview.alterBuffDmg)     html += '<div class="confirm-row"><span class="confirm-row-label">+ Omnes Deam</span><span class="confirm-row-value bonus">+' + preview.alterBuffDmg + '</span></div>';
      if (preview.redencionDmg)     html += '<div class="confirm-row"><span class="confirm-row-label">+ Redención</span><span class="confirm-row-value bonus">+' + preview.redencionDmg + '</span></div>';
      if (preview.markBonus)        html += '<div class="confirm-row"><span class="confirm-row-label">+ Marca</span><span class="confirm-row-value bonus">+' + preview.markBonus + '</span></div>';
      if (preview.carrerillaBonus)  html += '<div class="confirm-row"><span class="confirm-row-label">+ Carrerilla</span><span class="confirm-row-value bonus">+' + preview.carrerillaBonus + '</span></div>';
    } else {
      html += '<div class="confirm-row"><span class="confirm-row-label">Daño base</span><span class="confirm-row-value damage">' + preview.baseDmg + '</span></div>';
    }
    if (preview.flatReduction)                         html += '<div class="confirm-row"><span class="confirm-row-label">− Reducción</span><span class="confirm-row-value shield">−' + preview.flatReduction + '</span></div>';
    if (!preview.piercing && preview.shieldAbsorbed > 0) html += '<div class="confirm-row"><span class="confirm-row-label">− Escudos absorben</span><span class="confirm-row-value shield">−' + preview.shieldAbsorbed + '</span></div>';
    html += '<div class="confirm-row"><span class="confirm-row-label"><strong>Daño verdadero</strong></span><span class="confirm-row-value true-dmg"><strong>' + preview.trueDmg + '</strong></span></div>';
    if (preview.target) {
      html += '<div class="confirm-row" style="font-size:0.75rem; opacity:0.85;"><span class="confirm-row-label">' + preview.target.character.name + '</span><span class="confirm-row-value">❤️ ' + preview.targetHpBefore + ' → ' + preview.targetHpAfter + ' · 🛡️ ' + preview.targetShieldBefore + ' → ' + preview.targetShieldAfter + '</span></div>';
    }
  }

  if (preview.healApplied > 0) html += '<div class="confirm-row"><span class="confirm-row-label">Curación propia</span><span class="confirm-row-value heal">+' + preview.healApplied + ' HP</span></div>';
  if (preview.shieldSelf)      html += '<div class="confirm-row"><span class="confirm-row-label">Escudo propio</span><span class="confirm-row-value shield">+' + preview.shieldSelf + '</span></div>';
  if (preview.selfDamage)      html += '<div class="confirm-row"><span class="confirm-row-label">Autodaño</span><span class="confirm-row-value damage">−' + preview.selfDamage + ' HP</span></div>';
  if (preview.reflectDmg)      html += '<div class="confirm-row"><span class="confirm-row-label">Trampa refleja</span><span class="confirm-row-value damage">−' + preview.reflectDmg + ' HP</span></div>';
  if (preview.condenaGain)     html += '<div class="confirm-row"><span class="confirm-row-label">+ Condena</span><span class="confirm-row-value bonus">+' + preview.condenaGain + '</span></div>';

  if (preview.effects && preview.effects.length) {
    var states = preview.effects.filter(function(e){ return e.type === 'state'; });
    var resources = preview.effects.filter(function(e){ return e.type === 'resource'; });
    var texts = preview.effects.filter(function(e){ return e.type === 'text'; });
    var targetLabel = { enemy: '🎯 Enemigo', self: '✨ Tú', team: '🛡️ Tu equipo', both: '🌐 Ambos' };
    if (states.length) {
      html += '<div class="confirm-preview-section"><div class="confirm-preview-title">🏷️ Estados aplicados</div>';
      states.forEach(function(e){ html += '<div class="confirm-preview-item state"><span class="cpv-icon">' + e.icon + '</span><span class="cpv-label">' + e.label + '</span>' + (e.target ? '<span class="cpv-target">' + (targetLabel[e.target] || '') + '</span>' : '') + '</div>'; });
      html += '</div>';
    }
    if (resources.length) {
      html += '<div class="confirm-preview-section"><div class="confirm-preview-title">⚡ Recursos</div>';
      resources.forEach(function(e){ html += '<div class="confirm-preview-item resource"><span class="cpv-icon">' + e.icon + '</span><span class="cpv-label">' + e.label + '</span>' + (e.target ? '<span class="cpv-target">' + (targetLabel[e.target] || '') + '</span>' : '') + '</div>'; });
      html += '</div>';
    }
    if (texts.length) {
      html += '<div class="confirm-preview-section"><div class="confirm-preview-title">✨ Efectos adicionales</div>';
      texts.forEach(function(e){ html += '<div class="confirm-preview-item text"><span class="cpv-icon">' + e.icon + '</span><span class="cpv-label">' + e.label + '</span></div>'; });
      html += '</div>';
    }
  }
  html += '</div>';

  if (preview.notes && preview.notes.length) {
    html += '<div style="margin-top: 0.5rem; padding: 0.6rem 0.8rem; background: rgba(240,200,96,0.08); border: 1px solid rgba(240,200,96,0.25); border-radius: 8px; font-size: 0.78rem; line-height: 1.5;">' + preview.notes.join(' · ') + '</div>';
  }
  if (preview.willKill) html += '<div class="confirm-warning">💀 ¡Eliminará a ' + preview.target.character.name + '!</div>';
  if (preview.willDieFromSelf) html += '<div class="confirm-warning">💀 ¡' + preview.active.character.name + ' morirá tras usar esta habilidad!</div>';
  return html;
}
function showActionConfirmation(actionType, ability, onConfirm) {
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent'); if (!ov || !content) return;
  hideTooltip();
  cancelHideTooltip();
  if (hoverTooltip) {
    hoverTooltip.classList.remove('show');
    hoverTooltip.classList.remove('interactive');
  }
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
    html += '<div class="confirm-ability-info">' + buildAbilityInfoHTML(active.id, actionType) + '</div>';
    if (preview) html += buildPreviewBodyHTML(preview);
    html += '<div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="confirmCancelBtn">Cancelar</button><button class="confirm-btn confirm-accept" id="confirmAcceptBtn"' + (!isComplete ? ' disabled' : '') + '>Ejecutar</button></div>';
    content.innerHTML = html;
    attachAbilityTermListeners(content, active.id);
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
  if (actionType === 'ex') { playSound('error'); return; }
  var turnKey = getTurnKey();
  var side = combatState[turnKey];
  var active = side.characters[side.activeIndex]; if (!active || active.dead) return;
  var ability = active.character.abilities[actionType]; if (!ability) return;
  if (ability.kind === 'obraMaestra') {
    var hasOptim = side.structures && side.structures.some(function(st){ return st.kind === 'optimizacion'; });
    if (!hasOptim) { playSound('error'); var btnIdU = actionType === 'ultimate' ? 'ultimateBtn' : (actionType === 'elemental' ? 'elementalBtn' : 'normalBtn'); var bU = document.getElementById(btnIdU); if (bU) { bU.classList.add('shake'); setTimeout(function(){ bU.classList.remove('shake'); }, 400); } return; }
  }
  if (ability.kind === 'sageUltimate') {
    if (!active.states || (active.states.decidida || 0) < 3) {
      playSound('error');
      var bUs = document.getElementById('ultimateBtn');
      if (bUs) { bUs.classList.add('shake'); setTimeout(function(){ bUs.classList.remove('shake'); }, 400); }
      return;
    }
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
    applyGoogleExOnChange(oldChar, side, targetIndex, turnKey);
    transferActiveBuffs(oldChar, side.characters[targetIndex]);
    var _newCs = side.characters[targetIndex];
    var _oldIdx = side.characters.indexOf(oldChar);
    if (oldChar && oldChar.id === 'sage' && _newCs.id !== 'sage' && oldChar.exActive && !oldChar.dead) {
      dealDamageToChar(oldChar, 1, { targetSide:side, targetSideKey:turnKey, targetIdx:_oldIdx });
      logCombat('🐴 EX Sage: pierde 1 HP al salir');
    }
    if (_newCs && _newCs.id === 'sage' && oldChar.id !== 'sage' && !_newCs.dead) {
      csSetState(_newCs, 'sageEnteredThisTurn', true);
      _newCs.states = _newCs.states || {};
      _newCs.states.decidida = Math.min(3, (_newCs.states.decidida || 0) + 1);
      logCombat('🐴 Sage: +1 Decidida (' + _newCs.states.decidida + '/3)');
      dealDamageToChar(_newCs, 1, { targetSide:side, targetSideKey:turnKey, targetIdx:targetIndex });
      logCombat('🐴 Sage: -1 HP al cambiar a ella');
    }
    var sfx = rules.quick ? ' (acción rápida)' : (rules.discounted ? ' (gratis)' : '');
    var label = combatState.pvp ? (turnKey === 'player' ? 'J1' : 'J2') : 'Tú';
    logCombat('🔄 ' + label + ': ' + oldN + ' → ' + newN + sfx);
    if (typeof triggerKillerTunesDamage === 'function') triggerKillerTunesDamage(turnKey);
    var _enemyKey2 = turnKey === 'player' ? 'bot' : 'player';
    if (combatState && combatState[_enemyKey2] && combatState[_enemyKey2].characters.every(function(c){ return c.dead; })) {
      playSound('change'); renderCombat();
      setTimeout(function(){ if (combatState) endCombat(turnKey); }, 400);
      return;
    }
    playSound('change'); renderCombat();
    if (!rules.quick) setTimeout(nextTurn, 400);
  });
}
