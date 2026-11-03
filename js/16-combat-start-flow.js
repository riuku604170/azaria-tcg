function renderCombatStartTeamPreview(who) {
  // who: 'player' (J1 / no-PvP) o 'p2' (J2 en PvP)
  var prev = document.getElementById('combatStartTeamPreview'); if (!prev) return;
  var teamIds, chosen;
  if (who === 'p2') {
    teamIds = (pvpP2Team && pvpP2Team.length === 3) ? pvpP2Team : getRandomBotTeam();
    chosen = pendingExChoiceP2;
  } else {
    teamIds = (pendingCombatTeam && pendingCombatTeam.length === 3) ? pendingCombatTeam : team;
    chosen = pendingExChoice;
  }
  prev.innerHTML = teamIds.map(function(id){
    var c = CHARACTERS[id]; if (!c) return '';
    var col = ELEMENT_COLORS[c.element];
    var hasEx = !!(COMBAT_CHARS[id] && COMBAT_CHARS[id].abilities && COMBAT_CHARS[id].abilities.ex);
    var showExBtn = exCombatEnabled && hasEx;
    var isOn = (chosen === id);
    var exBtnHtml = showExBtn
      ? '<button class="start-preview-ex-btn' + (isOn ? ' selected' : '') + '" data-ex-char="' + id + '" title="Activar EX de ' + c.name + '">🌟</button>'
      : '';
    return '<div class="start-preview-card' + (isOn ? ' ex-on' : '') + '" data-char="' + id + '" style="--el: ' + col + ';">' + exBtnHtml + '<div class="start-preview-img" data-fallback="' + c.emoji + '"><img src="' + c.img + '" alt="' + c.name + '" onerror="this.style.display=\'none\';" style="width:100%;height:100%;object-fit:cover;border-radius:8px;"></div><div class="start-preview-name">' + c.name + '</div><div class="start-preview-element">' + ELEMENT_EMOJI[c.element] + ' ' + ELEMENT_NAMES[c.element] + '</div></div>';
  }).join('');
  if (exCombatEnabled) {
    prev.querySelectorAll('.start-preview-ex-btn').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var cid = btn.dataset.exChar;
        if (who === 'p2') {
          pendingExChoiceP2 = (pendingExChoiceP2 === cid) ? null : cid;
          renderCombatStartTeamPreview('p2');
        } else {
          pendingExChoice = (pendingExChoice === cid) ? null : cid;
          renderCombatStartTeamPreview('player');
        }
        updateCombatStartConfirmState();
      });
    });
  }
}

function refreshExToggleBtnForConfirm() {
  var btn = document.getElementById('exToggleBtn'); if (!btn) return;
  btn.setAttribute('aria-pressed', exCombatEnabled ? 'true' : 'false');
  btn.disabled = combatStartConfirmForP2;
  if (combatStartConfirmForP2) {
    btn.title = exCombatEnabled ? 'El Jugador 1 activó las EX en esta partida' : 'El Jugador 1 desactivó las EX en esta partida';
  } else {
    btn.title = exCombatEnabled ? 'EX ACTIVADAS — clic para desactivar' : 'EX DESACTIVADAS — clic para activar';
  }
}

// ✅ Enganchar el listener UNA VEZ al cargar (no en cada apertura del confirm)
document.addEventListener('click', function(e){
  var btn = e.target.closest('#exToggleBtn');
  if (!btn) return;
  if (combatStartConfirmForP2) return;
  e.preventDefault();
  exCombatEnabled = !exCombatEnabled;
  if (!exCombatEnabled) pendingExChoice = null;
  renderCombatStartTeamPreview('player');
  refreshExToggleBtnForConfirm();
  updateCombatStartConfirmState();
  playSound('select');
});

function showCombatStartConfirm(slotNum) {
  initAudio();
  var ov = document.getElementById('combatStartConfirm'), prev = document.getElementById('combatStartTeamPreview'); if (!ov || !prev) return;
  combatStartConfirmForP2 = false;
  exCombatEnabled = false;
  pendingExChoice = null;
  renderCombatStartTeamPreview('player');
  refreshExToggleBtnForConfirm();
  var sub = document.getElementById('combatStartConfirmSub');
  if (sub) {
    var modeTxt = pendingPvpMode ? 'PvP Local' : 'vs Rival';
    sub.textContent = 'Ranura ' + (slotNum + 1) + ' · ' + modeTxt + ' · Tu equipo y mazo están listos';
  }
  ov.classList.add('show'); playSound('banner');
  updateCombatStartConfirmState();
  refreshGameModeBtn();
}
function showCombatStartConfirmForP2(slotNum) {
  initAudio();
  var ov = document.getElementById('combatStartConfirm'), prev = document.getElementById('combatStartTeamPreview'); if (!ov || !prev) return;
  combatStartConfirmForP2 = true;
  pendingExChoiceP2 = null;
  renderCombatStartTeamPreview('p2');
  refreshExToggleBtnForConfirm();
  var sub = document.getElementById('combatStartConfirmSub');
  if (sub) sub.textContent = 'Ranura ' + (slotNum + 1) + ' · PvP Local · Jugador 2';
  ov.classList.add('show'); playSound('banner');
  updateCombatStartConfirmState();
  refreshGameModeBtn();
}
function updateCombatStartConfirmState() {
  var content = document.querySelector('#combatStartConfirm .combat-start-confirm-content');
  if (!content) return;
  // Limpiar avisos previos
  var oldWarn = content.querySelector('.game-mode-warning');
  if (oldWarn) oldWarn.remove();
  var oldExWarn = content.querySelector('.ex-selection-warning');
  if (oldExWarn) oldExWarn.remove();

  var confirmBtn = document.getElementById('combatStartConfirmBtn');

  // ✅ Los 3 modos están permitidos: nada de bloquear por modo.
  var modeOk = true;

  // Solo bloquea por EX si el toggle está ON y no hay EX elegida.
  var exOk = true;
  if (exCombatEnabled) {
    if (combatStartConfirmForP2) exOk = !!pendingExChoiceP2;
    else exOk = !!pendingExChoice;
  }

  if (confirmBtn) confirmBtn.disabled = !(modeOk && exOk);

  if (exCombatEnabled && !exOk) {
    var exWarn = document.createElement('div');
    exWarn.className = 'ex-selection-warning';
    exWarn.style.cssText = 'padding: 0.5rem 0.7rem; border-radius: 8px; background: rgba(240,200,96,0.15); border: 1px solid rgba(240,200,96,0.5); color: var(--accent); font-size: 0.78rem; font-weight: 700; text-align: center; margin-top: 0.6rem; line-height: 1.4;';
    exWarn.textContent = '🌟 Elige un personaje con EX activa para empezar (o desactiva las EX).';
    content.appendChild(exWarn);
  }
}
function hideCombatStartConfirm(){ var ov = document.getElementById('combatStartConfirm'); if (ov) ov.classList.remove('show'); }

function showSlotSelectionDialog(){ initAudio(); var ov = document.getElementById('slotSelectionDialog'); if (!ov) return; renderSlotSelectionDialog(); ov.classList.add('show'); playSound('banner'); }
function hideSlotSelectionDialog(){ var ov = document.getElementById('slotSelectionDialog'); if (ov) ov.classList.remove('show'); }
function renderSlotSelectionDialog() {
  var list = document.getElementById('slotList'); if (!list) return;
  // ✅ Título dinámico según modo
  var titleEl = document.querySelector('#slotSelectionDialog .resume-combat-title');
  if (titleEl) {
    titleEl.textContent = '⚔️ ' + (currentSlotMode === 'pvp' ? 'Combates PvP Guardados' : 'Combates Solo Guardados');
  }
  var html = '';
  for (var i = 0; i < COMBAT_SLOT_COUNT; i++) {
    var sv = getSavedCombat(i);
    if (sv) {
      var chh = sv.player.characters.map(function(c){ return '<span class="slot-char-chip" style="--el: ' + ELEMENT_COLORS[c.character.element] + ';">' + c.character.emoji + ' ' + c.character.name + '</span>'; }).join('');
      var hp = sv.player.characters.map(function(c){ return c.hp + '/' + c.maxHp; }).join(' · ');
      var hl = sv.player.hand ? sv.player.hand.length : 0;
      var modeIcon = sv.pvp ? '👥 ' : '⚔️ ';
      // ✅ Badge EX: refleja el estado congelado al empezar la partida
      // ✅ Determinar qué personaje tiene EX activa en la partida guardada
      // ✅ Determinar qué personaje tiene EX activa en la partida guardada
      var svExName = null;
      if (sv.exCharId && sv.exCharId.player) {
        var exCs = sv.player.characters.find(function(c){ return c.id === sv.exCharId.player; });
        if (exCs) svExName = exCs.character.name;
      }
      var svEx = !!svExName;
      var exBadge = '<span class="slot-ex-badge ' + (svEx ? 'on' : 'off') + '" title="' + (svEx ? 'EX activa: ' + svExName : 'Partida sin EX') + '">' + (svEx ? '🌟 EX: ' + svExName : '🚫 EX OFF') + '</span>';
      html += '<div class="slot-item">' + exBadge + '<div class="slot-item-header"><span class="slot-item-title">Ranura ' + (i + 1) + '</span><span class="slot-item-round">' + modeIcon + 'Ronda ' + sv.round + ' · ' + (sv.turn === 'player' ? (sv.pvp ? 'J1' : 'Tu turno') : (sv.pvp ? 'J2' : 'Rival')) + '</span></div><div class="slot-item-preview">' + chh + '</div><div class="slot-hp-text">❤️ ' + hp + ' · 🎴 ' + hl + ' cartas en mano</div><div class="slot-item-actions"><button class="slot-action slot-resume" data-slot="' + i + '">▶️ Reanudar</button><button class="slot-action slot-delete" data-slot="' + i + '">🗑️ Borrar</button></div></div>';
    } else html += '<div class="slot-item empty"><div class="slot-item-header"><span class="slot-item-title">Ranura ' + (i + 1) + '</span></div><div class="slot-empty-text">— Vacía —</div></div>';
  }
  list.innerHTML = html;
  list.querySelectorAll('.slot-resume').forEach(function(btn){ btn.addEventListener('click', function(){ resumeCombatFromSlot(parseInt(btn.dataset.slot, 10)); }); });
  list.querySelectorAll('.slot-delete').forEach(function(btn){ btn.addEventListener('click', function(){ var s = parseInt(btn.dataset.slot, 10); if (!confirm('¿Borrar el combate guardado en la ranura ' + (s + 1) + '?')) return; clearCombatSlot(s); playSound('deselect'); if (hasAnySavedCombat()) renderSlotSelectionDialog(); else hideSlotSelectionDialog(); }); });
}
function showOverwriteDialog(){ initAudio(); var ov = document.getElementById('overwriteDialog'); if (!ov) return; renderOverwriteDialog(); ov.classList.add('show'); playSound('banner'); }
function hideOverwriteDialog(){ var ov = document.getElementById('overwriteDialog'); if (ov) ov.classList.remove('show'); }
function renderOverwriteDialog() {
  var list = document.getElementById('overwriteSlotList'); if (!list) return;
  var html = '';
  for (var i = 0; i < COMBAT_SLOT_COUNT; i++) {
    var sv = getSavedCombat(i);
        if (sv) {
      var ch = sv.player.characters.map(function(c){ return c.character.emoji; }).join(' ');
      var modeIcon = sv.pvp ? '👥 ' : '⚔️ ';
      var svExName2 = null;
      if (sv.exCharId && sv.exCharId.player) {
        var exCs2 = sv.player.characters.find(function(c){ return c.id === sv.exCharId.player; });
        if (exCs2) svExName2 = exCs2.character.name;
      }
      var svEx2 = !!svExName2;
      var exBadge2 = '<span class="slot-ex-badge ' + (svEx2 ? 'on' : 'off') + '" title="' + (svEx2 ? 'EX activa: ' + svExName2 : 'Partida sin EX') + '">' + (svEx2 ? '🌟 EX: ' + svExName2 : '🚫 EX OFF') + '</span>';
      html += '<div class="slot-item">' + exBadge2 + '<div class="slot-item-header"><span class="slot-item-title">Ranura ' + (i + 1) + '</span><span class="slot-item-round">' + modeIcon + 'Ronda ' + sv.round + '</span></div><div class="slot-item-preview" style="font-size:1.4rem;">' + ch + '</div><div class="slot-item-actions"><button class="slot-action slot-overwrite" data-slot="' + i + '">⚠️ Sobrescribir</button></div></div>';
    }
  }
  list.innerHTML = html;
  list.querySelectorAll('.slot-overwrite').forEach(function(btn){ btn.addEventListener('click', function(){ var s = parseInt(btn.dataset.slot, 10); if (!confirm('¿Sobrescribir la ranura ' + (s + 1) + '?')) return; hideOverwriteDialog(); prepareNewCombat(s); }); });
}
function prepareNewCombat(preferredSlot) {
  // ✅ Usamos la plantilla elegida para este combate si existe;
  // si no, caemos al team/deck del menú.
  var useTeam = (pendingCombatTeam && pendingCombatTeam.length === 3) ? pendingCombatTeam : team;
  var useDeck = (pendingCombatDeck && pendingCombatDeck.length === 30) ? pendingCombatDeck : deck;

  if (!Array.isArray(useTeam) || useTeam.length < 3) { showTeamMissingToast('Necesitas <strong>' + (3 - (useTeam ? useTeam.length : 0)) + '</strong> personaje(s) más.'); openTeamPanel(); scrollToCollection(); return; }
  var valid = useTeam.filter(function(id){ return COMBAT_CHARS[id]; });
  if (valid.length < 3) { showTeamMissingToast('Necesitas <strong>' + (3 - valid.length) + '</strong> personaje(s) válido(s) más.'); openTeamPanel(); scrollToCollection(); return; }
  if (!Array.isArray(useDeck) || useDeck.length !== 30) { var dm = 30 - (useDeck ? useDeck.length : 0); if (dm > 0) showTeamMissingToast('Necesitas <strong>' + dm + '</strong> carta(s) más en tu mazo.'); else showTeamMissingToast('Tu mazo tiene <strong>' + useDeck.length + '</strong> cartas. Debe tener <strong>30</strong>.'); closeTeamPanel(); scrollToDeck(); return; }
  var s = preferredSlot;
  if (s === null || s === undefined) { s = findEmptyCombatSlot(); if (s === -1) { showOverwriteDialog(); return; } }
  currentCombatSlot = s; showCombatStartConfirm(s);
}

function openCombat(mode) {
  mode = mode || 'solo';
  pendingPvpMode = (mode === 'pvp' || mode === 'sandbox');
  currentSlotMode = (mode === 'solo' || mode === 'pvp') ? mode : null;

  if (mode === 'auto' || mode === 'sandbox') {
  currentCombatSlot = null;
  }

  pendingCombatTeam = null;
  pendingCombatDeck = null;
  pendingCombatP2Team = null;
  pendingCombatP2Deck = null;

  if (mode === 'auto') {
    currentGameMode = 'auto';
    startTwoTeamsFlow('auto');
    return;
  }
  if (mode === 'sandbox') {
    currentGameMode = 'sandbox';
    startTwoTeamsFlow('sandbox');
    return;
  }

  currentGameMode = 'normal';

  if (hasAnySavedCombat()) {
    showSlotSelectionDialog();
    return;
  }
  startCombatWithTemplatePicker();
}

function startCombatWithTemplatePicker(){
  var p1Label = pendingPvpMode ? '⚔️ Jugador 1' : '⚔️ Combate';
  showTemplatePickerForCombat(p1Label, function(p1Template){
    var validTeam = p1Template.team.filter(function(id){ return CHARACTERS[id] && id !== 'hunger' && id !== 'exmaria'; }).slice(0, 3);
    var validDeck = p1Template.deck.filter(function(id){ return CARD_DB[id]; });
    var cnts = {};
    validDeck = validDeck.filter(function(id){ cnts[id] = (cnts[id]||0) + 1; return cnts[id] <= 2; }).slice(0, 30);
    pendingCombatTeam = validTeam;
    pendingCombatDeck = validDeck;

    if (validTeam.length !== 3 || validDeck.length !== 30) {
      showTeamMissingToast('La plantilla debe tener 3 personajes y 30 cartas');
      return;
    }

    var s = findEmptyCombatSlot();
    if (s === -1) { showOverwriteDialog(); return; }
    currentCombatSlot = s;

    // ✅ Mostrar SIEMPRE la confirmación del J1 (Solo y PvP)
    showCombatStartConfirm(s);
  });
}

// ✅ Nueva: tras confirmar el J1 en PvP, se pide plantilla del J2 y su confirmación
function askP2TemplateAndConfirm() {
  showTemplatePickerForCombat('⚔️ Jugador 2', function(p2Template){
    var p2Team = p2Template.team.filter(function(id){ return CHARACTERS[id] && id !== 'hunger' && id !== 'exmaria'; }).slice(0, 3);
    var p2Deck = p2Template.deck.filter(function(id){ return CARD_DB[id]; });
    var c2 = {};
    p2Deck = p2Deck.filter(function(id){ c2[id] = (c2[id]||0) + 1; return c2[id] <= 2; }).slice(0, 30);
    if (p2Team.length !== 3 || p2Deck.length !== 30) {
      showTeamMissingToast('La plantilla del <strong>Jugador 2</strong> debe tener 3 personajes y 30 cartas');
      return;
    }
    pvpP2Team = p2Team;
    pvpP2Deck = p2Deck;

    // ✅ Restaurar la decisión EX del J1 para que el diálogo del J2 la muestre
    exCombatEnabled = !!window._pendingPlayerExEnabled;

    // ✅ Mostrar confirmación del J2 (toggle EX bloqueado)
    showCombatStartConfirmForP2(currentCombatSlot);
  });
}

/* ─── NUEVO: flujo de dos equipos (Auto / Sandbox) ─── */
function startTwoTeamsFlow(mode) {
  var p1Label = '⚔️ Equipo 1';
  showTemplatePickerForCombat(p1Label, function(t1){
    var p1Team = t1.team.filter(function(id){ return CHARACTERS[id] && id !== 'hunger' && id !== 'exmaria'; }).slice(0, 3);
    var p1Deck = t1.deck.filter(function(id){ return CARD_DB[id]; });
    var c1 = {};
    p1Deck = p1Deck.filter(function(id){ c1[id] = (c1[id]||0) + 1; return c1[id] <= 2; }).slice(0, 30);
    if (p1Team.length !== 3 || p1Deck.length !== 30) {
      showTeamMissingToast('La plantilla del <strong>Equipo 1</strong> debe tener 3 personajes y 30 cartas');
      return;
    }
    pendingCombatTeam = p1Team;
    pendingCombatDeck = p1Deck;

    showTemplatePickerForCombat('⚔️ Equipo 2', function(t2){
      var p2Team = t2.team.filter(function(id){ return CHARACTERS[id] && id !== 'hunger' && id !== 'exmaria'; }).slice(0, 3);
      var p2Deck = t2.deck.filter(function(id){ return CARD_DB[id]; });
      var c2 = {};
      p2Deck = p2Deck.filter(function(id){ c2[id] = (c2[id]||0) + 1; return c2[id] <= 2; }).slice(0, 30);
      if (p2Team.length !== 3 || p2Deck.length !== 30) {
        showTeamMissingToast('La plantilla del <strong>Equipo 2</strong> debe tener 3 personajes y 30 cartas');
        return;
      }
      pvpP2Team = p2Team;
      pvpP2Deck = p2Deck;
      currentCombatSlot = null;

      if (mode === 'auto') actuallyStartAutoCombat();
      else if (mode === 'sandbox') actuallyStartSandboxCombat();
    });
  });
}

function actuallyStartAutoCombat() {
  initAudio(); preloadCombatImages(); initCombatStars();
  var m = document.getElementById('combatModal');
  if (!m) return;
  m.classList.add('open'); document.body.style.overflow = 'hidden';
  startAutoCombat();
}

function actuallyStartSandboxCombat() {
  initAudio(); preloadCombatImages(); initCombatStars();
  // ✅ Mostrar el botón de toggle para poder abrir el panel manualmente
  var stBtn = document.getElementById('sandboxToggleBtn');
  if (stBtn) stBtn.style.display = 'grid';
  var m = document.getElementById('combatModal');
  if (!m) return;
  m.classList.add('open'); document.body.style.overflow = 'hidden';
  startSandboxCombat();
  // ❌ Eliminado: setTimeout(function(){ if (combatState) openSandboxPanel(); }, 400);
}

function startSandboxCombat() {
  var pids = getPlayerTeamIds();
  var bids = (pvpP2Team && pvpP2Team.length === 3) ? pvpP2Team.slice() : getRandomBotTeam();
  if (!pids) { closeCombat(); return; }

  var pDeck = (pendingCombatDeck && pendingCombatDeck.length === 30) ? pendingCombatDeck.slice() : generateRandomDeck();
  var bDeck = (pvpP2Deck && pvpP2Deck.length === 30) ? pvpP2Deck.slice() : generateRandomDeck();

  // ✅ Modo 'bot': pvp=false (el bot actúa solo)
  //    Modo 'player-only' y 'two-users': pvp=true (el usuario controla ambos)
  var pvpFlag = (sandboxTurnMode !== 'bot');

  combatState = {
    round: 1, turn: 'player', phase: 'playing',
    playerDone: false, botDone: false, winner: null, starterChosen: true,
    log: [],
    player: buildSideState(pids, null),
    bot: buildSideState(bids, null),
    pvp: pvpFlag,
    exCharId: { player: null, bot: null },
    exCombatEnabled: false,
    mode: 'sandbox'
  };
  combatState.player.consonance = getConsonanceForIds(pids);
  combatState.bot.consonance = getConsonanceForIds(bids);
  combatState.player.deck = shuffleArray(pDeck);
  combatState.bot.deck = shuffleArray(bDeck);
  combatState.player.hand = []; combatState.player.discardPile = [];
  combatState.player.cardsUsedThisRound = {}; combatState.player.cardsUsedThisGame = {}; combatState.player.drawSelection = {};
  combatState.bot.hand = []; combatState.bot.discardPile = [];
  combatState.bot.cardsUsedThisRound = {}; combatState.bot.cardsUsedThisGame = {}; combatState.bot.drawSelection = {};

  // Tirada inicial + robo para ambos sin overlays
  combatState.player.dice = rollCombatDice(8);
  combatState.bot.dice = rollCombatDice(8);
  applyIlusion(combatState.player, 'player');
  applyIlusion(combatState.bot, 'bot');
  for (var i = 0; i < 5; i++) { drawFromDeck('player'); drawFromDeck('bot'); }

  hideBanner();
  logCombat('⚙️ Combate Sandbox — modo: ' + sandboxTurnMode);
  logCombat('🦋 J1: ' + pids.map(function(id){ return COMBAT_CHARS[id].name; }).join(', '));
  logCombat('🦋 J2: ' + bids.map(function(id){ return COMBAT_CHARS[id].name; }).join(', '));

  renderCombat();
  beginRoundPlay();
}

/* ═══ PvP SETUP ═══ */
function pvpPhaseSequence(){
  if (!combatState) return [];
  // ✅ Nuevo orden: el personaje inicial se elige ANTES de lanzar dados,
  // para que la consonancia de Ilusión pueda garantizar dados del tipo del activo.
  if (combatState.round === 1) return ['p1-select','p1-roll','p1-draw','p2-select','p2-roll','p2-draw','combat'];
  return ['p1-roll','p1-draw','p2-roll','p2-draw','combat'];
}
function actuallyStartPvpLocalCombat(){
  initAudio(); preloadCombatImages(); initCombatStars();
  var m = document.getElementById('combatModal');
  m.classList.add('open'); document.body.style.overflow = 'hidden';
  startPvpLocalCombat();
}
function startPvpLocalCombat(){
  var stBtn = document.getElementById('sandboxToggleBtn');
  if (stBtn) stBtn.style.display = (currentGameMode === 'sandbox') ? '' : 'none';
  var pids = getPlayerTeamIds();
  var bids = (pvpP2Team && pvpP2Team.length === 3) ? pvpP2Team.slice() : getRandomBotTeam();
  if (!pids) { closeCombat(); return; }
  if (currentCombatSlot !== null) clearCombatSlot(currentCombatSlot);

  var exEnabled = !!window._pendingPlayerExEnabled;
  var p1ExId = exEnabled ? (window._pendingPlayerEx || null) : null;
  if (p1ExId && (pids.indexOf(p1ExId) === -1 || !COMBAT_CHARS[p1ExId].abilities.ex)) p1ExId = null;
  var p2ExId = exEnabled ? (window._pendingP2Ex || null) : null;
  if (p2ExId && (bids.indexOf(p2ExId) === -1 || !COMBAT_CHARS[p2ExId].abilities.ex)) p2ExId = null;
  window._pendingPlayerEx = null;
  window._pendingP2Ex = null;
  window._pendingPlayerExEnabled = null;
  window._pendingP2ExEnabled = null;

  combatState = {
    round: 1, turn: 'player', phase: 'rolling',
    playerDone: false, botDone: false, winner: null, starterChosen: false,
    log: [],
    player: buildSideState(pids, p1ExId),
    bot:    buildSideState(bids, p2ExId),
    pvp: true,
    exCharId: { player: p1ExId, bot: p2ExId },
    exCombatEnabled: exEnabled,
    mode: currentGameMode
  };
  combatState.player.consonance = getConsonanceForIds(pids);
  combatState.bot.consonance    = getConsonanceForIds(bids);
  var useDeckP1 = (pendingCombatDeck && pendingCombatDeck.length === 30) ? pendingCombatDeck : deck;
  combatState.player.deck = shuffleArray(useDeckP1.slice());
  combatState.bot.deck    = shuffleArray((pvpP2Deck || generateRandomDeck()).slice());
  combatState.player.hand = []; combatState.player.discardPile = [];
  combatState.player.cardsUsedThisRound = {}; combatState.player.cardsUsedThisGame = {}; combatState.player.drawSelection = {};
  combatState.bot.hand = []; combatState.bot.discardPile = [];
  combatState.bot.cardsUsedThisRound = {}; combatState.bot.cardsUsedThisGame = {}; combatState.bot.drawSelection = {};

  var ov = document.getElementById('combatEndOverlay'); if (ov) ov.classList.remove('open');
  hideBanner();
  logCombat('⚔️ PvP Local — Ronda 1');
  logCombat('🦋 J1: ' + pids.map(function(id){ return COMBAT_CHARS[id].name; }).join(', '));
  logCombat('🦋 J2: ' + bids.map(function(id){ return COMBAT_CHARS[id].name; }).join(', '));

  pvpSetupPhase = 'p1-select';
  renderCombat();
  runPvpSetupStep();
}
function runPvpSetupStep(){
  if (!combatState || !combatState.pvp) return;
  var phase = pvpSetupPhase;
  var isRound1 = combatState.round === 1;
  if (phase === 'p1-select') {
    combatState.turn = 'player';
    showSelectOverlay();
  } else if (phase === 'p1-roll') {
    combatState.turn = 'player';
    combatState.phase = 'rolling';
    combatState.player.dice = rollCombatDice(8);
    applyIlusion(combatState.player, 'player');   // ✅ siempre, también ronda 1
    showBanner(isRound1 ? 'JUGADOR 1 — TIRADA INICIAL' : 'JUGADOR 1 — TIRADA', 1200);
    setTimeout(function(){ if (pvpSetupPhase === 'p1-roll') showRollOverlay(); }, 1200);
  } else if (phase === 'p1-draw') {
    combatState.turn = 'player';
    startDrawPhase();
  } else if (phase === 'p2-select') {
    combatState.turn = 'bot';
    showSelectOverlay();
  } else if (phase === 'p2-roll') {
    combatState.turn = 'bot';
    combatState.phase = 'rolling';
    combatState.bot.dice = rollCombatDice(8);
    applyIlusion(combatState.bot, 'bot');         // ✅ siempre, también ronda 1
    showBanner(isRound1 ? 'JUGADOR 2 — TIRADA INICIAL' : 'JUGADOR 2 — TIRADA', 1200);
    setTimeout(function(){ if (pvpSetupPhase === 'p2-roll') showRollOverlay(); }, 1200);
  } else if (phase === 'p2-draw') {
    combatState.turn = 'bot';
    startDrawPhase();
  }
}
function advancePvpSetup(){
  if (!combatState || !combatState.pvp) return false;
  var seq = pvpPhaseSequence();
  var idx = seq.indexOf(pvpSetupPhase);
  if (idx < 0) return false;
  if (idx >= seq.length - 1) return false;
  pvpSetupPhase = seq[idx + 1];
  if (pvpSetupPhase === 'p2-roll') {
    hideRollOverlay(); hideDrawOverlay(); hideSelectOverlay();
    renderCombat();
  }
  if (pvpSetupPhase === 'combat') {
    combatState.starterChosen = true;
    combatState.phase = 'playing';
    combatState.turn = combatState.firstDeclarer || 'player';
    combatState.firstDeclarer = null;
    pvpSetupPhase = null;
    hideRollOverlay(); hideDrawOverlay(); hideSelectOverlay();
    renderCombat();
    beginRoundPlay();
    return true;
  }
  runPvpSetupStep();
  return true;
}

function resumeCombatFromSlot(s) {
  var sv = getSavedCombat(s); if (!sv) return;
  currentCombatSlot = s; combatState = sv;
  if (!combatState.player.discardPile) combatState.player.discardPile = [];
  if (!combatState.player.initialDrawThisRound) combatState.player.initialDrawThisRound = [];
  if (!combatState.player.cardsUsedThisRound) combatState.player.cardsUsedThisRound = {};
  if (!combatState.player.cardsUsedThisGame) combatState.player.cardsUsedThisGame = {};
  if (!combatState.player.deck) combatState.player.deck = [];
  if (!combatState.player.hand) combatState.player.hand = [];
  if (!combatState.player.drawSelection) combatState.player.drawSelection = {};
  if (!combatState.player.supports) combatState.player.supports = [null,null,null,null];
  if (!combatState.bot.supports) combatState.bot.supports = [null,null,null,null];
  if (!combatState.player.structures) combatState.player.structures = [];
  if (!combatState.bot.structures) combatState.bot.structures = [];
  if (!combatState.bot.discardPile) combatState.bot.discardPile = [];
  if (typeof combatState.player.obraMaestraTurns === 'undefined') combatState.player.obraMaestraTurns = 0;
  if (typeof combatState.bot.obraMaestraTurns === 'undefined') combatState.bot.obraMaestraTurns = 0;
  // ✅ Restaurar EX por personaje desde exCharId
  if (!combatState.exCharId) combatState.exCharId = { player: null, bot: null };
  // ✅ Respetar el flag EX congelado al empezar la partida
  var resumedExEnabled = (typeof combatState.exCombatEnabled === 'boolean') ? combatState.exCombatEnabled : false;
  combatState.exCombatEnabled = resumedExEnabled;
  if (!resumedExEnabled) {
    combatState.exCharId = { player: null, bot: null };
  }
  if (!combatState.exCharId) combatState.exCharId = { player: null, bot: null };
  // Si el flag está OFF, forzamos exCharId null aunque lo guardado tuviera algo
  if (!resumedExEnabled) combatState.exCharId = { player: null, bot: null };
  combatState.player.characters.forEach(function(c){ if (COMBAT_CHARS[c.id]) c.character = COMBAT_CHARS[c.id]; if (!c.equipment) c.equipment = []; if (!c.states) c.states = {}; if (!c.marks) c.marks = {}; c.exActive = (c.id === combatState.exCharId.player); if (c.id === 'exmaria') applyExmariaEnergyWrapper(c); });
  combatState.bot.characters.forEach(function(c){ if (COMBAT_CHARS[c.id]) c.character = COMBAT_CHARS[c.id]; if (!c.equipment) c.equipment = []; if (!c.states) c.states = {}; if (!c.marks) c.marks = {}; c.exActive = (c.id === combatState.exCharId.bot); if (c.id === 'exmaria') applyExmariaEnergyWrapper(c); });
  // ✅ Neón: su HP máximo depende de si tiene EX activa (6 sin EX, 8 con EX).
  // Al reanudar una partida guardada, ajustamos el techo y la HP actual.
  ['player','bot'].forEach(function(wk){
    combatState[wk].characters.forEach(function(c){
      if (c.id === 'neon') {
        var targetMaxN = c.exActive ? 8 : 6;
        if (c.maxHp !== targetMaxN) {
          var diffN = targetMaxN - c.maxHp;
          c.maxHp = targetMaxN;
          if (diffN > 0) c.hp = Math.min(c.maxHp, c.hp + diffN);
          else c.hp = Math.min(c.hp, c.maxHp);
        }
      }
    });
  });
  if (typeof combatState.player.mulliganUsed === 'undefined') combatState.player.mulliganUsed = false;
  pendingPvpMode = !!combatState.pvp;
  hideSlotSelectionDialog();
  var m = document.getElementById('combatModal'); m.classList.add('open'); document.body.style.overflow = 'hidden';
  initAudio(); preloadCombatImages(); initCombatStars();

  // PvP mid-setup: reiniciar setup desde P1-select
  if (combatState.pvp && (combatState.phase === 'rolling' || combatState.phase === 'drawing')) {
    combatState.phase = 'rolling';
    combatState.turn = 'player';
    combatState.playerDone = false;
    combatState.botDone = false;
    combatState.player.initialDrawThisRound = [];
    combatState.player.drawSelection = {};
    combatState.bot.initialDrawThisRound = [];
    combatState.bot.drawSelection = {};
    // ✅ Reiniciar el setup desde la elección de personaje (nuevo orden)
    pvpSetupPhase = 'p1-select';
    combatState.starterChosen = false;
    combatState.firstDeclarer = null;
    renderCombat();
    runPvpSetupStep();
    return;
  }

  if (combatState.phase === 'rolling') {
    // ✅ Asegurarse de que no quedan restos de animación de una sesión anterior
    ['player','bot'].forEach(function(wk){
      if (combatState[wk]) { combatState[wk].isRollingAnim = false; combatState[wk].rollingIds = {}; }
    });
    renderCombat(); showRollOverlay();
  }
  else if (combatState.phase === 'drawing') { drawInitialShown = true; renderCombat(); renderDrawOverlay(); document.getElementById('drawOverlay').classList.add('show'); }
  else {
    renderCombat();
    if (combatState.phase === 'playing' && combatState.turn === 'bot' && !combatState.botDone && !combatState.pvp) setTimeout(botTurn, 800);
  }
}
function actuallyStartCombat() {
  var stBtn = document.getElementById('sandboxToggleBtn');
  if (stBtn) stBtn.style.display = (currentGameMode === 'sandbox') ? 'grid' : 'none';

  var m = document.getElementById('combatModal'); if (!m) return;
  initAudio(); preloadCombatImages(); initCombatStars();
  m.classList.add('open'); document.body.style.overflow = 'hidden';

  if (currentGameMode === 'auto') {
    startAutoCombat();
    return;
  }
  startCombat();
}
function closeCombat() {
  saveCombatState();
  var m = document.getElementById('combatModal'); if (!m) return;
  m.classList.remove('open'); document.body.style.overflow = '';
  combatState = null; combatEnvColor = null; currentCombatSlot = null;
  pvpSetupPhase = null;
  combatStartConfirmForP2 = false;
  exCombatEnabled = false;
  pendingExChoice = null;
  pendingExChoiceP2 = null;
  currentGameMode = 'normal';   // ✅ AÑADIR
  // ✅ Ocultar el panel y el toggle del sandbox al cerrar el combate
  var sp = document.getElementById('sandboxPanel'); if (sp) sp.hidden = true;
  var st = document.getElementById('sandboxToggleBtn'); if (st) st.style.display = 'none';
  sandboxOpen = false;
  hideBanner(); hideSelectOverlay(); hideTooltip(); hideConfirmation(); hideRollOverlay(); hideDrawOverlay(); refreshGameModeBtn();          // ✅ AÑADIR (refresca el botón del diálogo de inicio)
}
function startCombat() {
  if (pendingPvpMode) { startPvpLocalCombat(); return; }
  var pids = getPlayerTeamIds(), bids = getRandomBotTeam();
  if (!pids) {
    if (currentCombatSlot !== null) clearCombatSlot(currentCombatSlot);  // ✅ NUEVO
    if (currentGameMode === 'sandbox') {
      // En Sandbox no cerramos: dejamos que el panel permita montar el combate a mano.
      console.warn('[Sandbox] Sin equipo válido para arrancar el combate.');
      return;
    }
    closeCombat();
    return;
  }
  if (currentCombatSlot !== null) clearCombatSlot(currentCombatSlot);
  pvpSetupPhase = null;
  // ✅ Elegir EX del jugador (viene del confirm) y del bot (aleatorio)
  var exEnabled = !!window._pendingPlayerExEnabled;
  var playerExId = exEnabled ? (window._pendingPlayerEx || null) : null;
  if (playerExId && (pids.indexOf(playerExId) === -1 || !COMBAT_CHARS[playerExId].abilities.ex)) playerExId = null;
  var botExId = null;
  if (exEnabled) {
    var botExCandidates = bids.filter(function(id){ return COMBAT_CHARS[id].abilities && COMBAT_CHARS[id].abilities.ex; });
    botExId = botExCandidates.length ? botExCandidates[Math.floor(Math.random() * botExCandidates.length)] : null;
  }
  window._pendingPlayerEx = null;
  window._pendingPlayerExEnabled = null;

  combatState = { round:1, turn:'player', phase:'rolling', playerDone:false, botDone:false, winner:null, starterChosen:false, log:[], player:buildSideState(pids, playerExId), bot:buildSideState(bids, botExId), pvp:false, exCharId: { player: playerExId, bot: botExId }, exCombatEnabled: exEnabled, mode: currentGameMode };
  combatState.player.consonance = getConsonanceForIds(pids); combatState.bot.consonance = getConsonanceForIds(bids);
  var useDeck = (pendingCombatDeck && pendingCombatDeck.length === 30) ? pendingCombatDeck : deck;
  combatState.player.deck = shuffleArray(useDeck.slice());
  combatState.player.hand = []; combatState.player.discardPile = [];
  combatState.player.cardsUsedThisRound = {}; combatState.player.cardsUsedThisGame = {}; combatState.player.drawSelection = {};
  combatState.bot.hand = []; combatState.bot.discardPile = [];
  combatState.bot.cardsUsedThisRound = {}; combatState.bot.cardsUsedThisGame = {}; combatState.bot.drawSelection = {};
  // ✅ Ya no hay sincronización con exSystemEnabled: buildSideState ya ha puesto exActive
  var ov = document.getElementById('combatEndOverlay'); if (ov) ov.classList.remove('open');
  hideBanner();
  logCombat('⚔️ Combate 3v3 iniciado');
  logCombat('🤖 Rival: ' + bids.map(function(id){ return COMBAT_CHARS[id].name; }).join(', '));
  var pc = combatState.player.consonance;
  if (pc) { if (pc.type === 'diverse') logCombat('🎯 Consonancia J1: 🌈 Diverso'); else logCombat('🎯 Consonancia J1: ' + ELEMENT_EMOJI[pc.element] + ' ' + ELEMENT_NAMES[pc.element] + ' (' + pc.level + ' personajes)'); }

  logCombat('▶️ Ronda 1 · Elige tu personaje inicial');
  // ✅ Primero se elige el personaje (para que la consonancia de Ilusión
  // pueda garantizar dados del tipo del activo al lanzar después).
  combatState.phase = 'rolling'; // el select overlay se muestra por encima; phase se mantiene coherente
  renderCombat();
  showSelectOverlay();
}
function startAutoCombat(){
  var stBtn = document.getElementById('sandboxToggleBtn');
  if (stBtn) stBtn.style.display = 'none';

  var pids = getPlayerTeamIds();
  if (!pids) { closeCombat(); return; }
  var bids = (pvpP2Team && pvpP2Team.length === 3) ? pvpP2Team.slice() : getRandomBotTeam();
  var pDeck = (pendingCombatDeck && pendingCombatDeck.length === 30) ? pendingCombatDeck.slice() : generateRandomDeck();
  var bDeck = (pvpP2Deck && pvpP2Deck.length === 30) ? pvpP2Deck.slice() : generateRandomDeck();

  var pExId = null, bExId = null;

  combatState = {
    round: 1, turn: 'player', phase: 'rolling',
    playerDone: false, botDone: false, winner: null, starterChosen: false,
    log: [],
    player: buildSideState(pids, pExId),
    bot: buildSideState(bids, bExId),
    pvp: false,
    exCharId: { player: pExId, bot: bExId },
    exCombatEnabled: false,
    mode: 'auto'
  };
  combatState.player.consonance = getConsonanceForIds(pids);
  combatState.bot.consonance    = getConsonanceForIds(bids);
  combatState.player.deck = shuffleArray(pDeck);
  combatState.bot.deck    = shuffleArray(bDeck);
  combatState.player.hand = []; combatState.player.discardPile = [];
  combatState.player.cardsUsedThisRound = {}; combatState.player.cardsUsedThisGame = {}; combatState.player.drawSelection = {};
  combatState.bot.hand = []; combatState.bot.discardPile = [];
  combatState.bot.cardsUsedThisRound = {}; combatState.bot.cardsUsedThisGame = {}; combatState.bot.drawSelection = {};

  var ov = document.getElementById('combatEndOverlay'); if (ov) ov.classList.remove('open');
  hideBanner();
  logCombat('🤖 AUTO — Bot vs Bot');
  logCombat('🦋 J1: ' + pids.map(function(id){ return COMBAT_CHARS[id].name; }).join(', '));
  logCombat('🦋 J2: ' + bids.map(function(id){ return COMBAT_CHARS[id].name; }).join(', '));

  renderCombat();
  runAutoSetup();
}
function runAutoSetup(){
  if (!combatState || combatState.mode !== 'auto') return;
  // Elegir personaje inicial aleatorio para ambos
  combatState.player.activeIndex = Math.floor(Math.random() * 3);
  combatState.bot.activeIndex = Math.floor(Math.random() * 3);
  // Tirada
  rollDiceForSide('player', true);
  rollDiceForSide('bot', true);
  // Robo inicial
  var pDraw = combatState.round === 1 ? 5 : 2;
  for (var i = 0; i < pDraw; i++) { drawFromDeck('player'); drawFromDeck('bot'); }
  logCombat('🤖 Auto: ronda ' + combatState.round + ' lista');

  // Arrancar la ronda
  combatState.phase = 'playing';
  combatState.playerDone = false; combatState.botDone = false;
  beginRoundPlay();
  // El primer turno será del jugador, pero como es auto, lo juega el bot
  if (combatState.turn === 'player') {
    setTimeout(autoPlayerTurn, 900);
  }
}
function autoPlayerTurn(){
  if (!combatState || combatState.mode !== 'auto' || combatState.phase === 'ended') return;
  if (combatState.playerDone) { nextTurn(); return; }
  var side = combatState.player;
  var active = side.characters[side.activeIndex];
  if (!active || active.dead) { declareEnd('player'); return; }

  // Elegir acción: definitiva > cambio si HP bajo > normal > elemental
  var action = null;
  if (active.character.abilities.ultimate && trySpendDice(side.dice, getEffectiveCostFull(active, active.character.abilities.ultimate)).ok && (!active.character.abilities.ultimate.energyCost || active.energy >= active.character.abilities.ultimate.energyCost)) {
    action = { type:'ultimate' };
  } else if (active.hp < active.maxHp * 0.35) {
    for (var i = 0; i < side.characters.length; i++) {
      if (i === side.activeIndex || side.characters[i].dead) continue;
      if (side.characters[i].hp > active.hp + 2) { action = { type:'change', index:i }; break; }
    }
  }
  if (!action && trySpendDice(side.dice, getEffectiveCostFull(active, active.character.abilities.normal)).ok) action = { type:'normal' };
  if (!action && trySpendDice(side.dice, getEffectiveCostFull(active, active.character.abilities.elemental)).ok) action = { type:'elemental' };

  if (!action) { declareEnd('player'); return; }

  setTimeout(function(){
    if (!combatState || combatState.mode !== 'auto') return;
    if (action.type === 'change') {
      var rules = getChangeRulesForTarget('player', action.index);
      if (rules.diceCost > 0) { var rr = trySpendDice(side.dice, { any: rules.diceCost }); if (rr.ok) side.dice = rr.remaining; }
      side.activeIndex = action.index;
      logCombat('🤖 J1 cambia a ' + side.characters[action.index].character.name);
      renderCombat();
      setTimeout(autoPlayerTurn, 600);
    } else {
      executeAction('player', action.type);
    }
  }, 500);
}