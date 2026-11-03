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