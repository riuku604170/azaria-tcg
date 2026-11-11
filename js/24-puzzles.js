/* ═══════════════════════════════════════════════════════════════════
   PUZZLES — desafíos de combate
   ═══════════════════════════════════════════════════════════════════ */

var PUZZLES = [
  {
    id: 'pz_golpe_certero',
    name: 'Golpe Certero',
    difficulty: '⭐',
    description: 'Derrota a Eevee con Tenshi en una sola ronda. Usa cartas de bonus y tu ataque normal.',
    hint: 'Tenshi pega con Intervención. Añade cartas de daño antes del golpe.',
    playerTeam: ['tenshi', 'maria', 'eloy'],
    enemyTeam: ['eevee', 'nc', 'ren'],
    overrides: {
      playerActiveIndex: 0,
      enemyActiveIndex: 0,
      playerHp: [11, 8, 12],
      enemyHp: [4, 1, 1],       // Eevee débil, los demás fuera de combate
      enemyDead: [false, true, true],
      playerStartDice: 8,
      playerStartEnergy: [3, 0, 0],
      playerStartHand: ['c_golpe', 'c_colera', 'c_precision']
    }
  },
  {
    id: 'pz_sobrevive',
    name: 'Contrareloj',
    difficulty: '⭐⭐',
    description: 'Sobrevive 3 rondas completas con Tenshi sin usar ataque. Solo escudos y apoyos.',
    hint: 'Coloca apoyos defensivos y escudos. El objetivo es aguantar, no atacar.',
    playerTeam: ['tenshi', 'eloy', 'maria'],
    enemyTeam: ['ren', 'eevee', 'nc'],
    overrides: {
      playerActiveIndex: 0,
      enemyActiveIndex: 0,
      playerHp: [11, 12, 8],
      enemyHp: [9, 9, 12],
      playerStartDice: 8,
      playerStartEnergy: [0, 0, 0],
      playerStartHand: ['c_aura', 'c_barrera', 'sp_barrera_espiritual', 'sp_muralla_antigua'],
      customWinCondition: function() {
        return combatState && combatState.round >= 4 && !combatState.player.characters.every(function(c){ return c.dead; });
      }
    }
  },
  {
    id: 'pz_combo',
    name: 'Combo Redención',
    difficulty: '⭐⭐⭐',
    description: 'Gana usando la consonancia de Redención (2+ personajes del mismo tipo). Tenshi + Eevee + Abla.',
    hint: 'La Redención da bonus al primer ataque de la ronda. Aprovecha el modificador de consonancia.',
    playerTeam: ['tenshi', 'eevee', 'abla'],
    enemyTeam: ['ren', 'maria', 'eloy'],
    overrides: {
      playerActiveIndex: 0,
      enemyActiveIndex: 0,
      playerHp: [11, 9, 9],
      enemyHp: [9, 8, 12],
      playerStartDice: 10,
      playerStartEnergy: [0, 0, 0],
      playerStartHand: ['c_golpe', 'c_colera', 'c_claridad', 'c_chispa']
    }
  }
];

function getPuzzleSolvedState() {
  try {
    var raw = localStorage.getItem('azaria_puzzles_solved');
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch(e) { return {}; }
}
function markPuzzleSolved(id) {
  var solved = getPuzzleSolvedState();
  solved[id] = true;
  try { localStorage.setItem('azaria_puzzles_solved', JSON.stringify(solved)); } catch(e) {}
}

function renderPuzzles() {
  var grid = document.getElementById('puzzlesGrid');
  if (!grid) return;
  grid.innerHTML =
    '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--muted);">' +
      '<div style="font-size: 4rem; opacity: 0.5; margin-bottom: 1rem;">🧩</div>' +
      '<div style="font-size: 1.3rem; font-weight: 900; color: var(--accent); margin-bottom: 0.6rem; letter-spacing: 0.05em;">Próximamente</div>' +
      '<div style="font-size: 0.9rem; line-height: 1.7; max-width: 480px; margin: 0 auto;">' +
        'Estamos preparando desafíos pre-construidos con objetivos únicos.<br>' +
        'Muy pronto podrás demostrar que dominas el sistema en escenarios como <strong>"gana en 1 turno"</strong> o <strong>"sobrevive 3 rondas sin atacar"</strong>.' +
      '</div>' +
    '</div>';
}

function startPuzzle(id) {
  var puzzle = PUZZLES.find(function(p){ return p.id === id; });
  if (!puzzle) return;
  initAudio();
  preloadCombatImages();
  initCombatStars();

  pendingCombatTeam = puzzle.playerTeam.slice();
  pendingCombatDeck = null;
  pvpP2Team = puzzle.enemyTeam.slice();
  pvpP2Deck = null;
  currentSlotMode = null;
  currentCombatSlot = null;
  currentGameMode = 'puzzle';

  var m = document.getElementById('combatModal');
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }

  startPuzzleCombat(puzzle);
}

function startPuzzleCombat(puzzle) {
  var pids = puzzle.playerTeam.slice();
  var bids = puzzle.enemyTeam.slice();
  var pDeck = generateRandomDeck();
  var bDeck = generateRandomDeck();

  combatState = {
    round: 1, turn: 'player', phase: 'rolling',
    playerDone: false, botDone: false, winner: null, starterChosen: false,
    log: [],
    player: buildSideState(pids, null),
    bot: buildSideState(bids, null),
    pvp: false,
    exCharId: { player: null, bot: null },
    exCombatEnabled: false,
    mode: 'puzzle',
    puzzleId: puzzle.id,
    puzzle: puzzle
  };

  combatState.player.consonance = getConsonanceForIds(pids);
  combatState.bot.consonance = getConsonanceForIds(bids);
  combatState.player.deck = shuffleArray(pDeck);
  combatState.bot.deck = shuffleArray(bDeck);
  combatState.player.hand = []; combatState.player.discardPile = [];
  combatState.player.cardsUsedThisRound = {}; combatState.player.cardsUsedThisGame = {}; combatState.player.drawSelection = {};
  combatState.bot.hand = []; combatState.bot.discardPile = [];
  combatState.bot.cardsUsedThisRound = {}; combatState.bot.cardsUsedThisGame = {}; combatState.bot.drawSelection = {};

  // Aplicar overrides
  var ov = puzzle.overrides || {};
  if (typeof ov.playerActiveIndex === 'number') combatState.player.activeIndex = ov.playerActiveIndex;
  if (typeof ov.enemyActiveIndex === 'number') combatState.bot.activeIndex = ov.enemyActiveIndex;
  if (Array.isArray(ov.playerHp)) combatState.player.characters.forEach(function(c, i){ if (ov.playerHp[i] != null) c.hp = ov.playerHp[i]; });
  if (Array.isArray(ov.enemyHp))  combatState.bot.characters.forEach(function(c, i){ if (ov.enemyHp[i] != null) c.hp = ov.enemyHp[i]; });
  if (Array.isArray(ov.enemyDead)) combatState.bot.characters.forEach(function(c, i){ if (ov.enemyDead[i]) c.dead = true; });
  if (typeof ov.playerStartDice === 'number') {
    combatState.player.dice = [];
    for (var i = 0; i < ov.playerStartDice; i++) {
      combatState.player.dice.push({ type: CONSONANCE_ORDER[Math.floor(Math.random()*7)], id: uid() });
    }
  }
  if (Array.isArray(ov.playerStartEnergy)) combatState.player.characters.forEach(function(c, i){ if (ov.playerStartEnergy[i] != null) c.energy = ov.playerStartEnergy[i]; });
  if (Array.isArray(ov.playerStartHand)) {
    combatState.player.hand = ov.playerStartHand.slice();
    // Quitar esas cartas del mazo para no duplicar
    ov.playerStartHand.forEach(function(cid){
      var idx = combatState.player.deck.indexOf(cid);
      if (idx >= 0) combatState.player.deck.splice(idx, 1);
    });
  }

  initCombatStats();
  hideBanner();
  logCombat('🧩 Puzzle: ' + puzzle.name);
  logCombat('📋 ' + puzzle.description);
  renderCombat();
  showSelectOverlay();
}

/* Win condition override */
var _origEndCombatForPuzzle = window.endCombat;
if (typeof _origEndCombatForPuzzle === 'function') {
  window.endCombat = function(winner) {
    if (combatState && combatState.mode === 'puzzle' && combatState.puzzle) {
      var pz = combatState.puzzle;
      var customWin = pz.overrides && typeof pz.overrides.customWinCondition === 'function' ? pz.overrides.customWinCondition() : null;
      if (customWin === true && winner !== 'player') {
        // Sobrescribir: el puzzle se considera ganado
        winner = 'player';
      }
      if (winner === 'player') {
        markPuzzleSolved(pz.id);
        setTimeout(function(){ if (typeof renderPuzzles === 'function') renderPuzzles(); }, 100);
      }
    }
    return _origEndCombatForPuzzle.apply(this, arguments);
  };
}

/* Init */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderPuzzles);
else renderPuzzles();