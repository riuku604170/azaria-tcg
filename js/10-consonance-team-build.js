function getConsonanceForIds(ids) {
  var counts = {};
  ids.forEach(function(id){ var ch = COMBAT_CHARS[id]; if (!ch) return; counts[ch.element] = (counts[ch.element] || 0) + 1; });
  var maxCount = 0; Object.keys(counts).forEach(function(k){ if (counts[k] > maxCount) maxCount = counts[k]; });
  var maxEls = Object.keys(counts).filter(function(el){ return counts[el] === maxCount; });
  if (maxCount === 3) return { type:'single', element:maxEls[0], level:3 };
  if (maxCount === 2) return { type:'single', element:maxEls[0], level:2 };
  return { type:'diverse', level:3 };
}
function getPlayerTeamIds() {
  var source = (pendingCombatTeam && pendingCombatTeam.length === 3) ? pendingCombatTeam : team;
  if (Array.isArray(source) && source.length === 3) {
    var valid = source.filter(function(id){ return COMBAT_CHARS[id] && id !== 'hunger'; });
    if (valid.length === 3) return valid.slice();
  }
  return null;
}
/* ═══════════════════════════════════════════════════════════════════
   BOT BUILDER — Equipo y mazo por puntuación ponderada
   ═══════════════════════════════════════════════════════════════════ */

function _botPickWeighted(candidates) {
  if (!candidates || !candidates.length) return null;
  var total = 0;
  candidates.forEach(function(c){ total += Math.max(0.1, c.score); });
  if (total <= 0) return candidates[Math.floor(Math.random() * candidates.length)].item;
  var r = Math.random() * total;
  for (var i = 0; i < candidates.length; i++) {
    r -= Math.max(0.1, candidates[i].score);
    if (r <= 0) return candidates[i].item;
  }
  return candidates[candidates.length - 1].item;
}

function _botScoreCharacterForTeam(candidateId, currentTeamIds) {
  var cand = COMBAT_CHARS[candidateId];
  var candData = CHARACTERS[candidateId];
  if (!cand || !candData) return 0;
  if (currentTeamIds.indexOf(candidateId) !== -1) return 0;

  var score = 10;
  var candEl = cand.element;
  var elCounts = {};
  currentTeamIds.forEach(function(id){
    var ch = COMBAT_CHARS[id];
    if (ch) elCounts[ch.element] = (elCounts[ch.element] || 0) + 1;
  });
  var sameCount = elCounts[candEl] || 0;

  // Consonancia
  if (currentTeamIds.length === 1) {
    if (sameCount === 1) score += 35;
    else score += 10;
  } else if (currentTeamIds.length === 2) {
    if (sameCount === 2) score += 55;
    else if (sameCount === 1) score += 20;
    else {
      var a = COMBAT_CHARS[currentTeamIds[0]];
      var b = COMBAT_CHARS[currentTeamIds[1]];
      if (a && b && a.element !== b.element && candEl !== a.element && candEl !== b.element) {
        score += 40;
      }
    }
  }

  // Resonancias desbloqueadas
  currentTeamIds.forEach(function(id){
    var ch = COMBAT_CHARS[id];
    if (!ch) return;
    var found = RESONANCES.find(function(r){ 
      return (r.a === ch.element && r.b === candEl) || (r.a === candEl && r.b === ch.element);
    });
    if (found) score += 8;
  });

  // HP (prioriza algo con aguante)
  score += cand.hp * 0.6;

  // Variedad de categoría
  var sameCatCount = currentTeamIds.filter(function(id){
    return CHARACTERS[id] && CHARACTERS[id].category === candData.category;
  }).length;
  if (sameCatCount === 0) score += 5;

  return score;
}

function _botScoreCardForTeam(cardId, teamIds) {
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId];
  if (!card) return 0;
  var score = 5;

  var teamElements = teamIds.map(function(id){
    var ch = COMBAT_CHARS[id];
    return ch ? ch.element : null;
  }).filter(Boolean);

  // Match de coste
  if (card.cost) {
    Object.keys(card.cost).forEach(function(k){
      if (k === 'any' || k === 'same') return;
      var matches = teamElements.filter(function(te){ return te === k; }).length;
      score += matches * 4;
    });
    if (card.cost.same) score += 3;
  }

  // Sinergias por personaje
  if (teamIds.indexOf('erik') !== -1 && cardId.indexOf('paint_') === 0) score += 50;
  if (teamIds.indexOf('noah') !== -1 && card.tag === 'Curación') score += 15;
  if (teamIds.indexOf('maria') !== -1 && card.tag === 'Curación') score += 10;
  if (teamIds.indexOf('eloy') !== -1 && (card.tag === 'Defensa' || card.tag === 'Dados')) score += 8;
  if (teamIds.indexOf('adela') !== -1 && cardId === 'c_cafe_solo') score += 25;
  if (teamIds.indexOf('oliver') !== -1 && card.category === 'equipo') score += 8;
  if (teamIds.indexOf('tenshi') !== -1 && card.tag === 'Defensa') score += 6;
  if (teamIds.indexOf('alaya') !== -1 && (card.tag === 'Curación' || card.effectType === 'heal')) score += 6;

  // Etiqueta
  if (card.tag === 'Ataque') score += 3;
  if (card.tag === 'Potente') score += 5;
  if (card.tag === 'Curación') score += 2;
  if (card.tag === 'Defensa') score += 2;

  // Sin coste = utilidad general
  if (!card.cost || Object.keys(card.cost).length === 0) score += 4;

  return score;
}

function getSmartBotTeam() {
  var pool = Object.keys(COMBAT_CHARS).filter(function(id){
    if (id === 'hunger' || id === 'exmaria') return false;
    if (typeof isUnlocked === 'function' && !isUnlocked(id)) return false;
    if (CHARACTERS[id] && CHARACTERS[id].comingSoon) return false;
    return true;
  });
  if (pool.length < 3) {
    pool = Object.keys(COMBAT_CHARS).filter(function(id){
      return id !== 'hunger' && id !== 'exmaria';
    });
  }
  if (pool.length < 3) return pool.slice();

  // Pick 1 — cualquiera (aleatorio)
  var first = pool[Math.floor(Math.random() * pool.length)];
  var team = [first];

  // Pick 2 — ponderado por puntuación con el 1º
  var c2 = pool.filter(function(id){ return id !== first; }).map(function(id){
    return { item: id, score: _botScoreCharacterForTeam(id, team) };
  });
  team.push(_botPickWeighted(c2));

  // Pick 3 — ponderado por puntuación con el 1º y 2º
  var c3 = pool.filter(function(id){ return team.indexOf(id) === -1; }).map(function(id){
    return { item: id, score: _botScoreCharacterForTeam(id, team) };
  });
  team.push(_botPickWeighted(c3));

  return team;
}

function getSmartBotDeck(teamIds) {
  teamIds = teamIds || [];
  var pool = CARD_ORDER.filter(function(id){
    return (typeof isUnlocked !== 'function' || isUnlocked(id));
  });
  var scored = pool.map(function(id){
    return { item: id, score: _botScoreCardForTeam(id, teamIds) };
  });
  var deck = [];
  var copyCount = {};
  var safety = 0;

  while (deck.length < 30 && safety < 500) {
    var available = scored.filter(function(s){ return (copyCount[s.item] || 0) < 2; });
    if (!available.length) break;
    var picked = _botPickWeighted(available);
    if (!picked) break;
    deck.push(picked);
    copyCount[picked] = (copyCount[picked] || 0) + 1;
    safety++;
  }

  // Safety: rellenar hasta 30
  safety = 0;
  while (deck.length < 30 && safety < 500) {
    var id = CARD_ORDER[Math.floor(Math.random() * CARD_ORDER.length)];
    if ((copyCount[id] || 0) < 2) {
      deck.push(id);
      copyCount[id] = (copyCount[id] || 0) + 1;
    }
    safety++;
  }

  return deck;
}

/* ✅ Alias retro-compatible: los flujos que llamaban a getRandomBotTeam ahora usan el smart builder */
function getRandomBotTeam() {
  return getSmartBotTeam();
}
function getMaxEnergyFor(char){ if (char.abilities.ultimate && char.abilities.ultimate.energyCost) return char.abilities.ultimate.energyCost; return 3; }

// ✅ EX-María: retiene las ganancias de energía hasta el final de la ronda.
// El gasto de energía es inmediato (no se retrasa).
// Guardamos el valor real en `_energyValue` (numérico, serializable) para que
// el save/load de localStorage funcione.
function applyExmariaEnergyWrapper(cs) {
  if (!cs || cs.id !== 'exmaria') return;
  // Si ya tiene getter, no re-aplicar (p.ej. al reanudar cuando ya se aplicó).
  var desc = Object.getOwnPropertyDescriptor(cs, 'energy');
  if (desc && desc.get) return;
  if (!cs.states) cs.states = {};
  if (typeof cs._energyValue !== 'number') cs._energyValue = cs.energy || 0;
  if (typeof cs.states.energyPending !== 'number') cs.states.energyPending = 0;
  Object.defineProperty(cs, 'energy', {
    get: function() { return cs._energyValue; },
    set: function(v) {
      if (v > cs._energyValue) {
        cs.states.energyPending = (cs.states.energyPending || 0) + (v - cs._energyValue);
      } else {
        cs._energyValue = v;
      }
    },
    configurable: true
  });
  cs._flushPendingEnergy = function() {
    if (cs.states.energyPending > 0) {
      cs._energyValue = Math.min(cs.maxEnergy, cs._energyValue + cs.states.energyPending);
      cs.states.energyPending = 0;
      return true;
    }
    return false;
  };
}

function buildSideState(ids, exCharId) {
  return {
    characters: ids.map(function(id) {
      // ✅ Transformación María → EX-María si el jugador eligió la EX de María
      var isMariaExTransform = (id === 'maria' && exCharId === 'maria');
      var actualId = isMariaExTransform ? 'exmaria' : id;
      var ch = COMBAT_CHARS[actualId];
      var baseHp = ch.hp;
      var isNeonEx = (actualId === 'neon' && id === exCharId);
      if (isNeonEx) baseHp = 8;
      var cs = {
        id: actualId,
        character: ch,
        hp: baseHp,
        maxHp: baseHp,
        energy: 0,
        maxEnergy: getMaxEnergyFor(ch),
        shields: [],
        pendingBuff: 0,
        dead: false,
        equipment: [],
        paintEquipped: null,
        states: { internetEnergyGranted: false },
        marks: {},
        cardNextAttackBonus: 0,
        cardNextAttackPiercing: false,
        cardNextAttackDouble: false,
        cardNextAbilityDiscount: 0,
        cardNextAbilityFree: false,
        cardMarkBonus: 0,
        manuelStacks: 0,
        exActive: (id === exCharId),
        noResurrectLimit: (id === 'hunger'),
        neonUltChangeDamage: false
      };
      if (actualId === 'exmaria') applyExmariaEnergyWrapper(cs);
      return cs;
    }),
    activeIndex: 0,
    dice: [],
    rerolled: false,
    selected: {},
    isRollingAnim: false,
    rollingIds: {},
    consonance: null,
    firstChangeUsed: false,
    firstAttackUsed: false,
    deck: [],
    hand: [],
    discardPile: [],
    supports: [null, null, null, null],
    structures: [],
    initialDrawThisRound: [],
    mulliganUsed: false,
    drawSelection: {},
    cardsUsedThisRound: {},
    cardsUsedThisGame: {},
    enemyAttackDebuff: 0,
    contraataque: 0,
    obraMaestraTurns: 0,
    cruzMaderaByAlly: {},
    cruzMaderaFromShield: false,
    cruzSangreActive: false,
    lastDeadAlly: null,
    alterUltBuff: { amount: 0, roundsLeft: 0 },
    exCharId: exCharId || null
  };
}
function preloadCombatImages(){ Object.keys(COMBAT_CHARS).forEach(function(id){ var img = new Image(); img.src = 'img/' + id + '.png'; }); }

/* ═══════════════════════════════════════════════════════════════════
   BOT MULLIGAN — cambios inteligentes en mano inicial
   ═══════════════════════════════════════════════════════════════════ */

function _botMulliganScore(cid, teamIds) {
  var s = _botScoreCardForTeam(cid, teamIds);
  var card = CARD_DB[cid] || PAINT_CARDS[cid];
  if (!card) return s;

  // ✅ Penalizar costes de elementos que el equipo NO tiene.
  //    Una carta {ilusion:2} en un equipo sin Ilusión es casi injugable.
  if (card.cost) {
    var teamEls = teamIds.map(function(id){
      return COMBAT_CHARS[id] ? COMBAT_CHARS[id].element : null;
    }).filter(Boolean);
    Object.keys(card.cost).forEach(function(k){
      if (k === 'any' || k === 'same') return;
      if (teamEls.indexOf(k) === -1) s -= 4;
    });
  }

  // ✅ Premiar utilidad universal (van bien en cualquier mazo)
  if (card.tag === 'Energía') s += 3;
  if (card.tag === 'Dados') s += 2;
  if (card.tag === 'Utilidad') s += 2;

  return s;
}

function botSmartMulligan() {
  if (!combatState || !combatState.bot) return;
  var bot = combatState.bot;
  if (bot.mulliganUsed) return;
  if (combatState.round !== 1) return;
  if (combatState.pvp) return;
  if (combatState.mode === 'sandbox') return;

  var teamIds = bot.characters.map(function(c){ return c.id; });
  var scored = bot.hand.map(function(cid){
    return { cid: cid, score: _botMulliganScore(cid, teamIds) };
  });
  scored.sort(function(a, b){ return a.score - b.score; });

  var diff = (typeof BOT_DIFFICULTY !== 'undefined') ? BOT_DIFFICULTY : 'normal';
  var thresholds = { easy: 3, normal: 6, hard: 8, nightmare: 10 };
  var maxSwaps   = { easy: 1, normal: 2, hard: 3, nightmare: 4 };
  var thr = thresholds[diff] || 6;
  var mx  = maxSwaps[diff]   || 2;

  var toSwap = [];
  for (var i = 0; i < scored.length && toSwap.length < mx; i++) {
    if (scored[i].score < thr) toSwap.push(scored[i].cid);
  }

  bot.mulliganUsed = true;

  if (toSwap.length === 0) {
    logCombat('🤖 El rival mantiene su mano inicial');
    return;
  }

  // Devolver al mazo, barajar, robar
  toSwap.forEach(function(cid){
    var idx = bot.hand.indexOf(cid);
    if (idx >= 0) {
      bot.hand.splice(idx, 1);
      bot.deck.push(cid);
    }
  });
  bot.deck = shuffleArray(bot.deck);
  for (var i = 0; i < toSwap.length; i++) drawFromDeck('bot');

  var word = (toSwap.length === 1) ? 'carta cambiada' : 'cartas cambiadas';
  logCombat('🤖 El rival ajusta su mano inicial (' + toSwap.length + ' ' + word + ')');
}
