console.log('Azaria TCG — v34 PvP Local');

/* ═══ ESTADO GLOBAL ═══ */
var silentActionApply = false;
var pendingPvpMode = false;
var pvpSetupPhase = null;
var pvpP2Team = null;
var pvpP2Deck = null;
var pendingCombatTeam = null;
var pendingCombatDeck = null;
var pendingCombatP2Team = null;
var pendingCombatP2Deck = null;
var currentSlotMode = 'solo';  // 'solo' | 'pvp'
var sandboxTurnMode = 'player-only'; // 'player-only' | 'bot' | 'two-users'

// ── Sistema EX por personaje ──
var pendingExChoice = null;
var combatStartConfirmForP2 = false;
var exCombatEnabled = false;
var pendingExChoiceP2 = null;

/* ═══ MODO DE JUEGO ═══ */
// El modo se fija desde los botones de inicio (Solo / PvP / Auto / Sandbox).
// `currentGameMode` se actualiza en openCombat/startCombat y lo consume la lógica de combate.
var currentGameMode = 'normal';
// Stub no-op: mantiene compatibilidad con llamadas externas (showCombatStartConfirm, closeCombat).
function refreshGameModeBtn() {}

/* ═══ TIENDA / INVENTARIO ═══ */
var playerMoney = 0;
var unlockedIds = {};
var redeemedCodes = {};
var shopForceLocked = false;   // ✅ Modo prueba: si true, solo cuenta unlockedIds

function loadShopState() {
  try {
    var m = localStorage.getItem('azaria_money');
    playerMoney = m ? parseInt(m, 10) || 0 : 0;
    var u = localStorage.getItem('azaria_unlocked');
    if (u) { var arr = JSON.parse(u); if (Array.isArray(arr)) { unlockedIds = {}; arr.forEach(function(id){ unlockedIds[id] = true; }); } }
    var c = localStorage.getItem('azaria_redeemed_codes');
    if (c) { var arrC = JSON.parse(c); if (Array.isArray(arrC)) { redeemedCodes = {}; arrC.forEach(function(code){ redeemedCodes[code] = true; }); } }
    shopForceLocked = localStorage.getItem('azaria_force_locked') === '1';
  } catch (e) { console.warn('loadShopState:', e); }
}
function saveShopState() {
  try {
    localStorage.setItem('azaria_money', String(playerMoney));
    localStorage.setItem('azaria_unlocked', JSON.stringify(Object.keys(unlockedIds)));
    localStorage.setItem('azaria_redeemed_codes', JSON.stringify(Object.keys(redeemedCodes)));
    localStorage.setItem('azaria_force_locked', shopForceLocked ? '1' : '0');
  } catch (e) { console.warn('saveShopState:', e); }
}
function isUnlocked(id) {
  if (shopForceLocked) return !!unlockedIds[id];   // ✅ Solo lo comprado/canjeado
  if (unlockedIds[id]) return true;
  if (typeof CHARACTERS !== 'undefined' && CHARACTERS[id]) {
    return (CHARACTERS[id].category || '') !== 'Azaria';
  }
  return true;
}
function unlockId(id) { unlockedIds[id] = true; saveShopState(); }
function addMoney(n) { playerMoney += n; saveShopState(); if (typeof renderShopMoney === 'function') renderShopMoney(); }

loadShopState();

/* ═══ DIFICULTAD DEL BOT ═══ */
var BOT_DIFFICULTY = 'normal';
var BOT_DIFFICULTY_LEVELS = {
  easy:      { key:'easy',      name:'Fácil',     emoji:'🌱', killPriority: 15,  thinkMultiplier: 0.75, desc:'Comete errores, prioriza menos las muertes.' },
  normal:    { key:'normal',    name:'Normal',    emoji:'⚖️', killPriority: 30,  thinkMultiplier: 1.0,  desc:'Juega bien sin ser perfecto.' },
  hard:      { key:'hard',      name:'Difícil',   emoji:'🔥', killPriority: 55,  thinkMultiplier: 1.35, desc:'Prioriza muertes y jugadas óptimas.' },
  nightmare: { key:'nightmare', name:'Pesadilla', emoji:'💀', killPriority: 100, thinkMultiplier: 1.6,  desc:'Siempre elige la mejor opción, prioriza letales.' }
};
function loadBotDifficulty() {
  try {
    var v = localStorage.getItem('azaria_bot_difficulty');
    if (v && BOT_DIFFICULTY_LEVELS[v]) BOT_DIFFICULTY = v;
  } catch (e) {}
}
function setBotDifficulty(v) {
  if (!BOT_DIFFICULTY_LEVELS[v]) return;
  BOT_DIFFICULTY = v;
  try { localStorage.setItem('azaria_bot_difficulty', v); } catch (e) {}
}
function getBotDifficultyInfo() {
  return BOT_DIFFICULTY_LEVELS[BOT_DIFFICULTY] || BOT_DIFFICULTY_LEVELS.normal;
}
loadBotDifficulty();
