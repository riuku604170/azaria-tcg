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
function getRandomBotTeam() {
  var pool = Object.keys(COMBAT_CHARS).filter(function(id){
    if (id === 'hunger' || id === 'exmaria') return false;
    if (typeof isUnlocked === 'function' && !isUnlocked(id)) return false;
    return true;
  });
  // Fallback al pool completo si el jugador no tiene 3 personajes desbloqueados
  // (si no, el bot no tendría equipo y el combate no arrancaría)
  if (pool.length < 3) {
    pool = Object.keys(COMBAT_CHARS).filter(function(id){ return id !== 'hunger' && id !== 'exmaria'; });
  }
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  return pool.slice(0, 3);
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
