function normalize(s){ return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function sumCost(cost){ var t = 0; for (var k in cost) if (Object.prototype.hasOwnProperty.call(cost,k)) t += cost[k]; return t; }
function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function shuffleArray(arr){ var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function setSize(o){ return Object.keys(o).length; }
function toggleFilterKey(o, k){ if (o[k]) { delete o[k]; return false; } o[k] = true; return true; }

/* ═══ HELPERS DE TURNO / LADO ═══ */
function getActiveSide(){
  if (!combatState) return null;
  if (combatState.pvp) return combatState[combatState.turn];
  return combatState.player;
}
function getTurnKey(){
  if (!combatState) return 'player';
  if (combatState.pvp) return combatState.turn;
  return 'player';
}
function getTurnSide(){ return combatState ? combatState[getTurnKey()] : null; }
function getEnemyKey(){ return getTurnKey() === 'player' ? 'bot' : 'player'; }
function getEnemySide(){ return combatState ? combatState[getEnemyKey()] : null; }
function isTurnDone(){
  var tk = getTurnKey();
  if (!combatState) return false;
  return tk === 'player' ? combatState.playerDone : combatState.botDone;
}
function isPlayerTurn(){
  if (!combatState) return false;
  if (combatState.phase !== 'playing') return false;
  return combatState.turn === 'player';
}
function canHumanControlCurrentTurn() {
  if (!combatState) return false;
  if (combatState.mode === 'auto') return false;
  if (combatState.phase !== 'playing') return false;
  if (isTurnDone()) return false;
  if (combatState.pvp) return true;
  return combatState.turn === 'player';
}
function isOnline(){ return false; }
function isOnlineHost(){ return false; }
function isOnlineGuest(){ return false; }
function myStateKey(){ return 'player'; }
function sideKeyForUI(uiWho){ return uiWho; }
function getMySide(){ if (!combatState) return null; return combatState[combatState.turn] || combatState.player; }
function isMyTurn(){ if (!combatState) return false; return combatState.turn === 'player'; }

/* ═══ HELPERS DE MAZO / DAÑO / ESCUDO / EQUIPO ═══ */
function generateRandomDeck() {
  var d = [];
  var events = CARD_ORDER.filter(function(id){ return CARD_DB[id].category === 'evento'; });
  var equipos = CARD_ORDER.filter(function(id){ return CARD_DB[id].category === 'equipo'; });
  var apoyos = CARD_ORDER.filter(function(id){ return CARD_DB[id].category === 'apoyo'; });
  shuffleArray(events).slice(0, Math.min(14, events.length)).forEach(function(id){ d.push(id); });
  shuffleArray(equipos).slice(0, Math.min(10, equipos.length)).forEach(function(id){ d.push(id); });
  shuffleArray(apoyos).slice(0, Math.min(6, apoyos.length)).forEach(function(id){ d.push(id); });
  var pool = shuffleArray(d.slice());
  var safety = 0;
  while (d.length < 30 && safety < 200) {
    var p = pool[Math.floor(Math.random() * pool.length)];
    var cnt = d.filter(function(x){ return x === p; }).length;
    if (cnt < 2) d.push(p);
    safety++;
  }
  return d;
}
function getNextAliveIndex(side, fromIndex) {
  var n = side.characters.length;
  for (var k = 1; k <= n; k++) {
    var idx = (fromIndex + k) % n;
    if (!side.characters[idx].dead) return idx;
  }
  return -1;
}
function totalShield(cs){ if (!cs.shields || !cs.shields.length) return 0; return cs.shields.reduce(function(s,sh){ return s + Math.max(0, sh.hp); }, 0); }
function addOrRefreshShield(cs, source, amount) {
  if (!cs.shields) cs.shields = [];
  var ex = null;
  for (var i = 0; i < cs.shields.length; i++) if (cs.shields[i].source === source) { ex = cs.shields[i]; break; }
  if (ex) { ex.maxHp = Math.max(ex.maxHp, amount); ex.hp = ex.maxHp; }
  else cs.shields.push({ source:source, hp:amount, maxHp:amount });
}
function absorbWithShields(cs, amount, piercing) {
  if (piercing) return { absorbed:0, overflow:amount };
  if (!cs.shields) cs.shields = [];
  var remaining = amount, absorbed = 0;
  cs.shields.sort(function(a,b){ return a.hp - b.hp; });
  for (var i = 0; i < cs.shields.length && remaining > 0; i++) {
    var sh = cs.shields[i]; if (sh.hp <= 0) continue;
    var take = Math.min(sh.hp, remaining); sh.hp -= take; absorbed += take; remaining -= take;
  }
  cs.shields = cs.shields.filter(function(sh){ return sh.hp > 0; });
  return { absorbed:absorbed, overflow:remaining };
}
function healShieldBy(cs, amount) {
  if (!cs.shields || !cs.shields.length) return 0;
  var sh = cs.shields[0]; var before = sh.hp;
  sh.hp = Math.min(sh.maxHp, sh.hp + amount);
  return sh.hp - before;
}
function getEquipmentAttackBonus(cs) {
  var bonus = 0, piercing = false;
  if (cs && cs.equipment) cs.equipment.forEach(function(eqId){
    var eq = CARD_DB[eqId]; if (!eq || !eq.effect) return;
    if (eq.effect.attackBonus) bonus += eq.effect.attackBonus;
    if (eq.effect.piercing) piercing = true;
  });
  return { bonus:bonus, piercing:piercing };
}
function getSupportAttackBonus(side) {
  var bonus = 0;
  if (side && side.supports) side.supports.forEach(function(sp){
    if (!sp) return;
    var spCard = CARD_DB[sp.cardId]; if (!spCard || !spCard.effect) return;
    if (spCard.effect.attackBonus) bonus += spCard.effect.attackBonus;
    if (spCard.effect.teamAttackBonus) bonus += spCard.effect.teamAttackBonus;
  });
  return bonus;
}
function getDamageReduction(cs, side) {
  var red = 0;
  if (cs && cs.equipment) cs.equipment.forEach(function(eqId){
    var eq = CARD_DB[eqId]; if (eq && eq.effect && eq.effect.damageReduction) red += eq.effect.damageReduction;
  });
  if (side && side.supports) side.supports.forEach(function(sp){
    if (!sp) return;
    var c = CARD_DB[sp.cardId]; if (!c || !c.effect) return;
    if (c.effect.damageReduction) red += c.effect.damageReduction;
    if (c.effect.teamDamageReduction) red += c.effect.teamDamageReduction;
  });
  return red;
}
function getReflectDamage(side) {
  var r = 0;
  if (side && side.supports) side.supports.forEach(function(sp){
    if (!sp) return;
    var c = CARD_DB[sp.cardId];
    if (c && c.effect && c.effect.reflectDamage) r += c.effect.reflectDamage;
  });
  return r;
}
function getOptimizationBonus(side) {
  if (!side || !side.structures) return 0;
  for (var i = 0; i < side.structures.length; i++) if (side.structures[i].kind === 'optimizacion') return 2;
  return 0;
}
function sideOfChar(cs) {
  if (!combatState || !cs) return null;
  if (combatState.player.characters.indexOf(cs) >= 0) return { key:'player', side:combatState.player };
  if (combatState.bot.characters.indexOf(cs) >= 0) return { key:'bot', side:combatState.bot };
  return null;
}
function getEnemyActiveOf(whoKey) {
  var ek = whoKey === 'player' ? 'bot' : 'player';
  var es = combatState[ek];
  return { side:es, key:ek, active:es.characters[es.activeIndex] };
}