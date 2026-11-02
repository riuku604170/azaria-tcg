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
var exCombatEnabled = false;      // ¿Esta partida usa EX?
var pendingExChoice = null;       // personaje con EX elegido por el J1 (o no-PvP)
var pendingExChoiceP2 = null;     // personaje con EX elegido por el J2 (PvP)
var combatStartConfirmForP2 = false; // ya lo tenías del arreglo anterior

/* ═══ MODO DE JUEGO (NORMAL / AUTO / SANDBOX) ═══ */
var GAME_MODES = ['normal', 'auto', 'sandbox'];
var GAME_MODE_LABELS = { normal: 'NORMAL', auto: 'AUTO', sandbox: 'SANDBOX' };
var currentGameMode = 'normal';

function refreshGameModeBtn() {
  var btn = document.getElementById('gameModeBtn');
  if (!btn) return;
  btn.textContent = GAME_MODE_LABELS[currentGameMode] || 'NORMAL';
  btn.setAttribute('data-mode', currentGameMode);
  btn.title = 'Modo: ' + (GAME_MODE_LABELS[currentGameMode] || 'NORMAL') + ' — clic para cambiar';
}
function cycleGameMode() {
  var i = GAME_MODES.indexOf(currentGameMode);
  currentGameMode = GAME_MODES[(i + 1) % GAME_MODES.length];
  refreshGameModeBtn();
  // Si el diálogo de inicio está abierto, refrescar el botón de empezar
  var confirmContent = document.getElementById('combatStartConfirm');
  if (confirmContent && confirmContent.classList.contains('show')) {
    updateCombatStartConfirmState();
  }
  playSound('select');
}
function initGameMode() {
  var btn = document.getElementById('gameModeBtn');
  if (!btn) return;
  refreshGameModeBtn();
  btn.addEventListener('click', cycleGameMode);
}

/* ═══ SISTEMA DE PARCHES ═══ */
var PATCHES = [
{
  version: 'v92.46',
  date: '2026-11-02',
  type: 'mayor',
  title: 'Me pican los cocos otra vez gente',
  changes: [
    'Erik quédate quieto.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    'Tú  también.',
    '¡OOOOH, ME VENGOOOO!'
  ]
},
{
  version: 'v46.92',
  date: '2026-11-02',
  type: 'minor',
  title: 'Me pican los cocos gente',
  changes: [
    '¡Oh, mi lefa!',
    'Así me gusta, Oliverín...'
  ]
},
{
  version: 'v46',
  date: '2026-11-02',
  type: 'major',
  title: 'lol',
  changes: [
    'Ni de puta coña escribo yo aquí todo lo que he hecho, averígualo bro.',
    'Me lefo. Para pensar.'
  ]
}
  // Añade aquí nuevos parches al principio del array (el más reciente primero).
  // Estructura: { version, date, type, title, changes: [] }
  // type: 'major' | 'minor' | 'fix' | 'balance'  (solo afecta al color del borde)
];

var PATCH_TYPE_LABEL = {
  major: 'Major',
  minor: 'Minor',
  fix: 'Fix',
  balance: 'Balance'
};
/* ═══ INDICADOR DE PARCHE NUEVO ═══ */
var PATCHES_SEEN_KEY = 'azaria_patches_seen_version';

function getLatestPatchVersion() {
  if (!Array.isArray(PATCHES) || !PATCHES.length) return null;
  return PATCHES[0].version || null;
}
function getSeenPatchVersion() {
  try { return localStorage.getItem(PATCHES_SEEN_KEY); } catch (e) { return null; }
}
function setSeenPatchVersion(v) {
  try { localStorage.setItem(PATCHES_SEEN_KEY, v); } catch (e) {}
}
function refreshPatchesBadge() {
  var badge = document.getElementById('patchesNewBadge');
  if (!badge) return;
  var latest = getLatestPatchVersion();
  var seen = getSeenPatchVersion();
  if (!latest) { badge.hidden = true; return; }
  badge.hidden = (latest === seen);
}
function markPatchesAsSeen() {
  var latest = getLatestPatchVersion();
  if (latest) setSeenPatchVersion(latest);
  refreshPatchesBadge();
}
function renderPatches() {
  var body = document.getElementById('patchesBody');
  if (!body) return;
  if (!PATCHES.length) {
    body.innerHTML = '<div style="text-align:center; color: var(--muted); font-style: italic; padding: 2rem;">Aún no hay parches registrados.</div>';
    return;
  }
  body.innerHTML = PATCHES.map(function(p, i) {
    var isLatest = i === 0;
    var typeCls = isLatest ? 'latest' : (p.type || 'minor');
    var typeLabel = isLatest ? 'Última' : (PATCH_TYPE_LABEL[p.type] || 'Cambios');
    var versionTxt = p.version + ' — ' + (p.title || '');
    var changesHtml = (p.changes || []).map(function(c) { return '<li>' + c + '</li>'; }).join('');
    return '<div class="patch-entry ' + typeCls + '">' +
      '<div class="patch-entry-head">' +
        '<span class="patch-version">' + p.version + '</span>' +
        '<span class="patch-badge ' + (isLatest ? 'latest' : '') + '">' + typeLabel + '</span>' +
        '<span class="patch-date">' + (p.date || '') + '</span>' +
      '</div>' +
      (p.title ? '<div class="patch-title">' + p.title + '</div>' : '') +
      '<ul class="patch-changes">' + changesHtml + '</ul>' +
    '</div>';
  }).join('');
}

function openPatchesModal() {
  var m = document.getElementById('patchesModal');
  if (!m) return;
  renderPatches();
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closePatchesModal() {
  var m = document.getElementById('patchesModal');
  if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
}
function initPatches() {
  var link = document.getElementById('patchesNavLink');
  if (link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      openPatchesModal();
      // ✅ Al abrir el modal, el usuario ya ha "visto" la última versión
      markPatchesAsSeen();
    });
  }
  var m = document.getElementById('patchesModal');
  if (m) {
    var closeBtn = document.getElementById('patchesCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closePatchesModal);
    var backdrop = m.querySelector('.patches-backdrop');
    if (backdrop) backdrop.addEventListener('click', closePatchesModal);
  }
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var modal = document.getElementById('patchesModal');
      if (modal && modal.classList.contains('open')) closePatchesModal();
    }
  });
  // ✅ Refrescar el badge al cargar la página
  refreshPatchesBadge();
}

/* ═══ CONSTANTES ═══ */
var ELEMENT_EMOJI = { redencion:'🩸', comprension:'💡', expresion:'🌸', proteccion:'🛡️', ilusion:'🎭', transformacion:'🔥', aceptacion:'🌿' };
var ELEMENT_COLORS = { redencion:'200,45,60', comprension:'255,215,100', expresion:'255,130,190', proteccion:'140,180,230', ilusion:'180,100,230', transformacion:'255,120,60', aceptacion:'130,220,140' };
var ELEMENT_NAMES = { redencion:'Redención', comprension:'Comprensión', expresion:'Expresión', proteccion:'Protección', ilusion:'Ilusión', transformacion:'Transformación', aceptacion:'Aceptación' };
var ABILITY_TYPES = { normal:'Ataque Normal', elemental:'Habilidad Elemental', ultimate:'Habilidad Definitiva', passive:'Habilidad Pasiva', ex:'EX' };
var ROLLING_COLOR = '160, 160, 180';
var CARD_TAG_COLORS = { 'Ataque':'200,45,60','Curación':'78,194,107','Defensa':'140,180,230','Energía':'240,200,96','Dados':'165,131,255','Utilidad':'255,130,190','Potente':'255,215,100','Arma':'200,45,60','Armadura':'140,180,230','Accesorio':'255,215,100','Estructura':'130,220,140','Aura':'255,130,190','Trampa':'180,100,230','Pintura':'255,130,190' };
var CARD_CATEGORY_META = { equipo:{label:'Equipo',icon:'⚔️',color:'200,45,60'}, apoyo:{label:'Apoyo',icon:'📜',color:'130,220,140'}, evento:{label:'Evento',icon:'✨',color:'165,131,255'}, pintura:{label:'Pintura',icon:'🎨',color:'255,130,190'} };

var STATUS_DESCRIPTIONS = {
  castigada: { name:'🩸 Castigada', text:'Toda curación que reciba se convierte en daño verdadero. Cada golpe recibido mientras dure el estado otorga +1 punto de condena.' },
  condena: { name:'💀 Condena', text:'Recurso acumulado por Alaya al recibir golpes. Su habilidad definitiva la consume íntegramente como daño penetrante al enemigo.' },
  vulnerable: { name:'💔 Vulnerable', text:'La primera vez que reciba daño verdadero se reduce en 1 y el atacante culpable pasa a estar Amenaza. Al recibir ese golpe, deja de ser Vulnerable.' },
  amenaza: { name:'🚨 Amenaza', text:'Estado que la habilidad definitiva de Tenshi (Suficiente) explota infligiendo daño penetrante extra.' },
  furia: { name:'🔥 Furia', text:'Los ataques normales de Eevee contra el enemigo que la hirió suman +1 de daño durante el resto de la ronda. Se reinicia al finalizar la ronda.' },
  defensaActiva: { name:'💠 Defensa Activa', text:'El próximo ataque recibido se reduce en 1 y Eevee contraataca inmediatamente con un ataque normal. Se consume al activarse.' },
  sintonia: { name:'🎵 Sintonía', text:'La próxima curación que reciba este personaje también la reciben todos los aliados en Sintonía. Una vez ocurre, todos dejan de estar en Sintonía.' },
  acelerado: { name:'💨 Acelerado', text:'Estado de Jose: el siguiente ataque normal que realice tras cambiar a él suma bono de daño y marca con transformación. Se consume al realizar la acción.' },
  marca: { name:'🏷️ Marca elemental', text:'Si se aplica otra marca distinta a este personaje, ambas desaparecen al instante y se desencadena una Resonancia.' },
  manuelStacks: { name:'📈 Acumulación (Decadencia)', text:'Cada stack de Decadencia de Manuel suma +1 al daño de su habilidad Degradación (tanto al enemigo como a sí mismo) y reduce en 1 el coste de dados de Degradación.' },
  obraMaestra: { name:'💥 Obra Maestra', text:'Mientras esté activa, las habilidades definitivas de los aliados hacen el doble de daño base (una vez por aliado).' },
  rencor: { name:'💢 Rencor', text:'Acumulación de Abla sobre este personaje. La habilidad definitiva de Abla inflige daño adicional por cada acumulación y consume todas al golpear.' },
  vuelo: { name:'🦅 Vuelo', text:'Artemis en vuelo: reduce en 2 el daño recibido. Si recibe daño verdadero recibe +3 de daño adicional, gana 1 de energía y pierde este efecto.' },
  carrerilla: { name:'🏃 Carrerilla', text:'El siguiente ataque de Artemis que cause daño añade +2 de daño. Si ese ataque es su ataque normal, gana 1 de energía adicional.' },
  cruzMadera: { name:'✝️ Cruz de Madera', text:'Estructura exclusiva de Orath. Causa 1 punto de daño al enemigo activo al ser destruida. Al final de la ronda, si Orath está activa, marca al enemigo activo con redención y se destruye.' },
  cruzSangre: { name:'✝️ Cruz de Sangre', text:'Estructura exclusiva de Orath generada al morir ella. Se destruye si un aliado muere. Al destruirse, revive al último aliado caído con 1 HP y 2 de escudo.' },
    invulnerabilidad: { name:'🛡️ Invulnerabilidad', text:'Cada punto de invulnerabilidad reduce en 1 el daño verdadero que recibe Alter. No se consume al absorber daño: Alter pierde 1 punto al final de cada ronda (máx 3). Solo se elimina por efectos que la quiten o por esta pérdida al final de ronda.' },
};

var PHILOSOPHIES = {
  proteccion: { emoji:'🛡️', name:'Protección', tagline:'Reducir el daño', desc:'Afrontan el sufrimiento intentando reducir el daño, tanto para sí mismas como para quienes consideran importantes.', quote:'La Protección no consiste en tener miedo al daño, sino en decidir que impedirlo es la mejor manera de superar la adversidad.', consonance2:'El personaje activo recibe un escudo de 1 punto de vida al principio de cada ronda.', consonance3:'Todos los aliados reciben un escudo de 1 punto de vida al principio de cada ronda.' },
  comprension: { emoji:'💡', name:'Comprensión', tagline:'Entenderlo', desc:'Afrontan el sufrimiento intentando entenderlo. Creen que el conocimiento es la mejor herramienta para resolver cualquier problema.', quote:'La Comprensión no consiste en saberlo todo, sino en creer que siempre existe una forma mejor de actuar si se logra entender la situación.', consonance2:'Al inicio de la partida, el personaje activo comienza con 1 punto de energía.', consonance3:'Al inicio de la partida, todos los aliados comienzan con 1 punto de energía.' },
  expresion: { emoji:'🌸', name:'Expresión', tagline:'Crear', desc:'Afrontan el sufrimiento creando. Sienten la necesidad de dar forma a su mundo interior.', quote:'La Expresión no consiste en decir lo que uno siente, sino en transformar la experiencia en algo nuevo que antes no existía.', consonance2:'Al inicio de la partida, robas 2 cartas adicionales en tu primera mano (5 → 7).', consonance3:'Al principio de cada ronda, robas 1 carta adicional (2 → 3).' },
  transformacion: { emoji:'🔥', name:'Transformación', tagline:'Adaptarse al cambio', desc:'Afrontan el sufrimiento adaptándose al cambio. Prefieren moverse y aprovechar el impulso de la situación.', quote:'La Transformación no consiste en cambiar por cambiar, sino en entender que avanzar muchas veces implica dejar atrás lo que ya no funciona.', consonance2:'El primer cambio de personaje de cada ronda no cuesta dados.', consonance3:'El primer cambio de personaje de cada ronda es gratuito y se considera una acción rápida.' },
  aceptacion: { emoji:'🌿', name:'Aceptación', tagline:'Asimilarlo', desc:'Afrontan el sufrimiento asimilándolo. Entienden que no todo puede cambiarse y buscan convivir con lo ocurrido.', quote:'La Aceptación no consiste en rendirse ante el sufrimiento, sino en impedir que este siga teniendo poder sobre uno mismo.', consonance2:'Al comienzo de cada ronda, el personaje activo recupera 1 punto de vida.', consonance3:'Al comienzo de cada ronda, todos los aliados recuperan 1 punto de vida.' },
  redencion: { emoji:'🩸', name:'Redención', tagline:'Actuar', desc:'Afrontan el sufrimiento actuando. Asumen las consecuencias y transforman el dolor en fuerza.', quote:'La Redención no consiste en buscar el sufrimiento, sino en decidir que, si este llega, servirá para avanzar en lugar de detenerse.', consonance2:'El primer ataque que realice el personaje activo en cada ronda inflige 2 puntos de daño adicionales.', consonance3:'El primer ataque que realice cualquier aliado en cada ronda inflige 3 puntos de daño adicionales.' },
  ilusion: { emoji:'🎭', name:'Ilusión', tagline:'Cuestionar la realidad', desc:'Afrontan el sufrimiento cuestionando la realidad. Buscan nuevas perspectivas y alteran las condiciones del problema.', quote:'La Ilusión no consiste en engañar a los demás, sino en comprender que la realidad siempre ofrece más posibilidades de las que parecen existir a primera vista.', consonance2:'Al finalizar la fase de lanzamiento, al menos uno de los dados será del tipo de tu personaje activo o un omnidado.', consonance3:'Al finalizar la fase de lanzamiento, al menos dos dados serán del tipo de tu personaje activo.' }
};
var CONSONANCE_ORDER = ['proteccion','comprension','expresion','transformacion','aceptacion','redencion','ilusion'];

/* ═══ ENTORNOS ═══ */
var ENVIRONMENTS = {
  sobrecarga_epileptica: {
    id: 'sobrecarga_epileptica',
    name: 'Sobrecarga Epiléptica',
    emoji: '⚡',
    duration: 2,
    effectText: 'Al final de la ronda, el aliado activo del equipo que estableció el entorno pasa al siguiente.'
  }
};

// Color del canvas de estrellas según entorno (null = dorado por defecto)
var combatEnvColor = null;

function setCombatCanvasColor(element) {
  if (!element) { combatEnvColor = null; return; }
  var rgb = ELEMENT_COLORS[element];
  if (!rgb) { combatEnvColor = null; return; }
  var parts = rgb.split(',').map(function(x){ return parseInt(x.trim(), 10); });
  combatEnvColor = { r: parts[0], g: parts[1], b: parts[2] };
}

function setEnvironment(envId, casterCs, ownerSideKey) {
  if (!combatState) return;
  var def = ENVIRONMENTS[envId];
  if (!def) return;
  var element = casterCs ? casterCs.character.element : 'ilusion';
  var previous = combatState.environment ? combatState.environment.name : null;
  combatState.environment = {
    id: envId,
    name: def.name,
    element: element,
    roundsLeft: def.duration,
    ownerSide: ownerSideKey,
    def: def
  };
  if (previous) logCombat('🌍 El entorno "' + previous + '" es reemplazado por "' + def.name + '"');
  else logCombat('🌍 Entorno establecido: ' + def.name + ' (' + def.duration + ' rondas)');
  playSound('banner');
  updateEnvironmentVisuals();
}

function clearEnvironment() {
  if (!combatState || !combatState.environment) return;
  logCombat('🌍 El entorno ' + combatState.environment.name + ' desaparece');
  combatState.environment = null;
  updateEnvironmentVisuals();
}

function updateEnvironmentVisuals() {
  var display = document.getElementById('combatEnvironmentDisplay');
  if (!display) return;
  if (!combatState || !combatState.environment) {
    display.hidden = true;
    setCombatCanvasColor(null);
    return;
  }
  var env = combatState.environment;
  var col = ELEMENT_COLORS[env.element] || '240, 200, 96';
  display.hidden = false;
  display.style.setProperty('--env-color', col);

  var icon   = document.getElementById('envIcon');
  var name   = document.getElementById('envName');
  var rounds = document.getElementById('envRounds');

  if (icon)   icon.textContent   = env.def.emoji || '🌍';
  if (name)   name.textContent   = env.name;
  if (rounds) rounds.textContent = env.roundsLeft + (env.roundsLeft === 1 ? ' ronda' : ' rondas');

  setCombatCanvasColor(env.element);
}

var RESONANCES = [
  { a:'proteccion', b:'proteccion', name:'Fortaleza', lore:'Dos defensas unidas se convierten en un muro infranqueable.', effect:'El personaje activo obtiene un escudo de 2 puntos de vida.' },
  { a:'proteccion', b:'comprension', name:'Preparación', lore:'Quien protege también sabe cuándo actuar.', effect:'Todos los aliados con escudo obtienen 1 punto de energía.' },
  { a:'proteccion', b:'expresion', name:'Abastecimiento', lore:'Una buena defensa permite preparar mejores recursos.', effect:'Roba 1 carta por cada aliado con escudo.' },
  { a:'proteccion', b:'transformacion', name:'Cobertura', lore:'El relevo nunca deja un punto vulnerable.', effect:'Al cambiar de personaje, el nuevo personaje activo obtiene un escudo de 2 puntos de vida.' },
  { a:'proteccion', b:'aceptacion', name:'Reconstitución', lore:'La seguridad facilita la recuperación.', effect:'Todos los aliados con escudo recuperan 1 punto de vida.' },
  { a:'proteccion', b:'redencion', name:'Contraataque', lore:'Una defensa sólida crea la oportunidad perfecta para responder.', effect:'Si el personaje que desencadena la Resonancia posee un escudo, su ataque inflige 2 puntos de daño adicionales.' },
  { a:'proteccion', b:'ilusion', name:'Camuflaje', lore:'La protección permite ocultar los verdaderos recursos.', effect:'Genera 1 dado del tipo de cada aliado que posea un escudo.' },
  { a:'comprension', b:'comprension', name:'Revelación', lore:'Dos perspectivas distintas encuentran la mejor solución.', effect:'Todos los aliados sin energía obtienen 1 punto de energía.' },
  { a:'comprension', b:'expresion', name:'Invención', lore:'Las ideas toman forma y generan nuevas posibilidades.', effect:'Roba 1 carta por cada punto de energía del personaje activo.' },
  { a:'comprension', b:'transformacion', name:'Planificación', lore:'Conocer el momento adecuado mejora cada movimiento.', effect:'Al cambiar de personaje, el nuevo personaje activo obtiene 1 punto de energía.' },
  { a:'comprension', b:'aceptacion', name:'Claridad', lore:'Comprender una situación ayuda a sobrellevarla.', effect:'Todos los aliados con energía recuperan 1 punto de vida.' },
  { a:'comprension', b:'redencion', name:'Lección', lore:'Los errores se convierten en experiencia.', effect:'Si el personaje que desencadena la Resonancia no tiene energía, su ataque inflige 2 puntos de daño adicionales.' },
  { a:'comprension', b:'ilusion', name:'Descifrado', lore:'Entender la verdad permite aprovecharla.', effect:'Obtén 1 dado del tipo del personaje activo por cada punto de energía que posea.' },
  { a:'expresion', b:'expresion', name:'Obra Maestra', lore:'Dos fuentes de creatividad alcanzan su máximo potencial.', effect:'Roba 2 cartas.' },
  { a:'expresion', b:'transformacion', name:'Improvisación', lore:'La creatividad se adapta al instante.', effect:'Al cambiar de personaje, roba 1 carta.' },
  { a:'expresion', b:'aceptacion', name:'Catarsis', lore:'Expresar lo que se siente ayuda a sanar.', effect:'La siguiente curación genera 1 carta.' },
  { a:'expresion', b:'redencion', name:'Sublimación', lore:'El sufrimiento se transforma en inspiración.', effect:'Roba 1 carta por cada punto de daño infligido.' },
  { a:'expresion', b:'ilusion', name:'Prestidigitación', lore:'La imaginación altera las posibilidades.', effect:'La siguiente carta intercambiada por dados generará 3 dados en lugar de 1.' },
  { a:'transformacion', b:'transformacion', name:'Impulso', lore:'El movimiento alimenta más movimiento.', effect:'El siguiente cambio de personaje se considera una acción rápida.' },
  { a:'transformacion', b:'aceptacion', name:'Adaptación', lore:'Cambiar también es una forma de recuperarse.', effect:'Al cambiar de personaje, el nuevo personaje activo recupera 1 punto de vida.' },
  { a:'transformacion', b:'redencion', name:'Embestida', lore:'La velocidad se convierte en agresividad.', effect:'Al cambiar de personaje, el primer ataque del nuevo personaje activo inflige 2 puntos de daño adicionales.' },
  { a:'transformacion', b:'ilusion', name:'Reposicionamiento', lore:'Cambiar de lugar altera el desarrollo del combate.', effect:'Al cambiar de personaje, obtén 2 dados del tipo del nuevo personaje activo.' },
  { a:'aceptacion', b:'aceptacion', name:'Serenidad', lore:'La calma devuelve el equilibrio.', effect:'El aliado con menos vida recupera 2 puntos de vida.' },
  { a:'aceptacion', b:'redencion', name:'Absolución', lore:'Perdonarse permite convertir el dolor en fuerza.', effect:'El siguiente daño que inflija el personaje activo también lo curará por esa misma cantidad.' },
  { a:'aceptacion', b:'ilusion', name:'Esperanza', lore:'Creer que es posible sanar también abre nuevas oportunidades.', effect:'La siguiente curación genera tantos dados del tipo del personaje activo como puntos de vida haya recuperado.' },
  { a:'redencion', b:'redencion', name:'Expiación', lore:'El sufrimiento alimenta la determinación.', effect:'El siguiente ataque inflige 1 punto de daño adicional.' },
  { a:'redencion', b:'ilusion', name:'Desesperación', lore:'Cuando ya no queda nada que perder, cualquier oportunidad sirve.', effect:'Si el personaje que desencadena la Resonancia se ha autoinfligido daño, genera 2 dados de su tipo.' },
  { a:'ilusion', b:'ilusion', name:'Paradoja', lore:'La realidad deja de comportarse como debería.', effect:'Relanza todos los dados restantes.' }
];

var CHARACTERS = {
  alaya: { name:'Alaya', element:'redencion', set:'Reminiscencia', category:'Usuarios', hp:10, emoji:'🌹', img:'img/alaya.png', concept:'Representa el beneficio del sacrificio y del dolor, basándose en recibir daño.', abilities: [
    { type:'normal', icon:'⚔️', name:'Autolesión', cost:'x1 dado de redención, x1 dado cualquiera', effect:'Alaya se golpea a sí misma y se inflige 1 punto de daño. No daña al enemigo: es una habilidad de autolesión pensada para acumular condena mediante su pasiva.' },
    { type:'elemental', icon:'🔮', name:'Penitencia', cost:'x2 dados de redención', effect:'Elimina todos los efectos activos sobre sí misma y entra en el estado Castigada, base de su pasiva.' },
    { type:'ultimate', icon:'💥', name:'El Fin del Comienzo', cost:'x3 dados de redención, x3 puntos de energía', effect:'Alaya gasta todos sus puntos de condena acumulados e inflige al enemigo un daño equivalente a dicha cantidad. Si el enemigo no muere, será Alaya quien muera. Independientemente del resultado, marca con redención a todos los enemigos.' },
    { type:'passive', icon:'🛡️', name:'Mártir Afligida', effect:'Cuando Alaya está Castigada, toda curación que reciba se convierte en daño verdadero. Cada vez que Alaya reciba daño mientras está Castigada, ganará 1 punto de condena por cada golpe recibido.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Si Alaya muere por su propia habilidad definitiva y en la mano del usuario hay una carta para revivir a un personaje, se le da la opción de utilizarla para revivirla inmediatamente y repetir el golpe de la definitiva. Tras ello, morirá de nuevo.' }
  ]},
  oliver: { name:'Óliver', element:'comprension', set:'Refinamiento', category:'Usuarios', hp:11, emoji:'🧠', img:'img/oliver.png', concept:'Su función es servir como soporte ofensivo potenciando a sus aliados mediante estructuras.', abilities: [
    { type:'normal', icon:'⚔️', name:'Corrección', cost:'x1 dado de comprensión, x1 dado cualquiera', effect:'Golpea al enemigo e inflige 1 punto de daño.' },
    { type:'elemental', icon:'🔮', name:'Optimización', cost:'x3 dados de comprensión', effect:'Coloca una estructura de 2 rondas que inflige 1 punto de daño al enemigo al final de cada ronda, marcándolo con comprensión. Mientras permanezca en el campo, los ataques normales y habilidades elementales de los aliados suman 2 puntos de daño. Volver a usarla extiende su duración en 1 ronda (máximo 3).' },
    { type:'ultimate', icon:'💥', name:'Obra Maestra', cost:'x4 dados de comprensión, x2 puntos de energía', effect:'Durante 2 rondas, las habilidades definitivas de los aliados hacen el doble de daño base, siempre y cuando la estructura de Optimización siga en el campo. Si no hay estructura, la habilidad no se puede usar.' },
    { type:'passive', icon:'🛡️', name:'Criterio de Excelencia', effect:'Todas las cartas de equipamiento cuestan un dado menos.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'La habilidad definitiva dobla el daño final en lugar del daño base.' }
  ]},
  erik: { name:'Erik', element:'expresion', set:'Magia de Pintura', category:'Usuarios', hp:10, emoji:'🎨', img:'img/erik.png', concept:'Sus habilidades están construidas para ser un personaje todoterreno consistente.', abilities: [
    { type:'normal', icon:'⚔️', name:'Trazo Vivo', cost:'x2 dados de expresión, x1 dado cualquiera', effect:'Golpea al enemigo, inflige 1 punto de daño y lo marca con expresión. Si lleva equipada una carta de pintura, no marca, pero aplica un bono según el color: Roja +2 daño, Azul escudo 1, Verde cura 2.' },
    { type:'elemental', icon:'🔮', name:'Interpretación', cost:'x3 dados de expresión', effect:'Pierde 1 punto de vida. Genera 3 cartas de pintura (roja, azul y verde). Estas cartas se equipan (una máximo) sobre Erik, no cuestan dados y se descartan al final de la siguiente ronda si no están equipadas.' },
    { type:'ultimate', icon:'💥', name:'Lienzo de Sangre', cost:'x3 dados de expresión, x2 puntos de energía', effect:'Consume todas las cartas de pintura no equipadas en mano: cada roja inflige 1 de daño, cada azul aumenta +1 la vida de su escudo, cada verde le cura 1 punto de vida.' },
    { type:'passive', icon:'🛡️', name:'Inspiración Solitaria', effect:'Cuantos menos aliados vivos haya, mayor será el efecto de sus habilidades: con 2 aliados +1 daño base/escudo/curación; con 1 aliado +2.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Todos los ataques normales marcan al enemigo con expresión.' }
  ]},
  tenshi: { name:'Tenshi', element:'proteccion', set:'Égida', category:'Usuarios', hp:11, emoji:'⚔️', img:'img/tenshi.png', concept:'Diseñado para defender a sus aliados mediante escudos, vulnerabilidad y amenazas.', abilities: [
    { type:'normal', icon:'⚔️', name:'Intervención', cost:'x2 dados de protección, x1 dado cualquiera', effect:'Inflige 2 puntos de daño al enemigo activo. Si el enemigo es Amenaza, suma 1 punto más y deja de ser Amenaza.' },
    { type:'elemental', icon:'🔮', name:'Bajo mis Alas', cost:'x3 dados de protección', effect:'El aliado con menos vida pasa a estar Vulnerable. La primera vez que reciba daño verdadero, se reduce 1 punto y el enemigo culpable pasa a Amenaza. Al recibir ese daño, deja de ser Vulnerable.' },
    { type:'ultimate', icon:'💥', name:'Suficiente', cost:'x4 dados de protección, x3 puntos de energía', effect:'Inflige 3 puntos de daño penetrante a todos los enemigos Amenaza, marcándolos con protección y dejando de estar Amenaza. Otorga 3 puntos de escudo al aliado Vulnerable.' },
    { type:'passive', icon:'🛡️', name:'Último Baluarte', effect:'Si un aliado Vulnerable va a morir, queda con 1 punto de vida y el activo cambia a Tenshi (acción rápida). Ocurre una vez por aliado. Dicho aliado recibe 1 escudo, sigue Vulnerable y el enemigo culpable pasa a Amenaza.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Si un enemigo Amenaza inflige daño verdadero a un aliado Vulnerable, el enemigo es marcado con protección.' }
  ]},
  eloy: { name:'Eloy', element:'comprension', set:'Cognición', category:'Usuarios', hp:12, emoji:'📖', img:'img/eloy.png', concept:'Sus cimientos son el conocimiento como útil para protegerse y mantenerse seguro.', abilities: [
    { type:'normal', icon:'⚔️', name:'Análisis', cost:'x1 dado de comprensión, x2 dados cualesquiera', effect:'Golpea al enemigo e inflige 2 puntos de daño. Eloy no obtiene energía con este ataque (ni con su habilidad elemental).' },
    { type:'elemental', icon:'🔮', name:'Hipótesis Sólida', cost:'x4 dados de comprensión', effect:'Alza un escudo de 2 puntos de vida. Cuando un enemigo golpea ese escudo, marca a dicho enemigo con comprensión.' },
    { type:'ultimate', icon:'💥', name:'Conclusión', cost:'x3 dados de comprensión, x3 puntos de energía', effect:'Otorga un escudo de 1 punto de vida a cada aliado excepto a sí mismo, y 1 punto de energía a cada aliado excepto a sí mismo.' },
    { type:'passive', icon:'🛡️', name:'Sincronía Cognitiva', effect:'Si un aliado usa su habilidad definitiva, Eloy gana 1 punto de energía (independiente de si Eloy ya actuó o no esa ronda). Eloy no obtiene energía con sus ataques normales ni elementales.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'La definitiva otorga 2 puntos de energía a los aliados en lugar de 1. La pasiva no tiene límite por ronda.' }
  ]},
  eevee: { name:'Eevee', element:'proteccion', set:'Instinto', category:'Usuarios', hp:10, emoji:'🦊', img:'img/eevee.png', concept:'Se quita relevancia hasta que se meten con ella.', abilities: [
    { type:'normal', icon:'⚔️', name:'Advertencia', cost:'x1 dado de protección, x2 dados cualesquiera', effect:'Golpea al enemigo e inflige 2 puntos de daño.' },
    { type:'elemental', icon:'🔮', name:'Defensa Activa', cost:'x4 dados de protección', effect:'Entra en estado de defensa activa: el daño del próximo ataque enemigo hacia ella se reduce en 1 punto y contraataca inmediatamente con un ataque normal. El estado se consume al activarse.' },
    { type:'ultimate', icon:'💥', name:'Contraofensiva', cost:'x3 dados de protección, x2 puntos de energía', effect:'Inflige 3 puntos al enemigo activo. Si está en Furia, inflige 5. Si el enemigo activo es quien activó su Furia, inflige 6 y lo marca con protección.' },
    { type:'passive', icon:'🛡️', name:'Instinto de Supervivencia', effect:'Cuando Eevee recibe un golpe que reduce su vida, entra en estado Furia a partir del siguiente turno, haciendo que inflija 1 punto de daño extra con el ataque normal al enemigo que la golpeó durante el resto de la ronda. Se reinicia al final de la ronda.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Su ataque normal automático (disparado por Defensa Activa) marca al enemigo con protección.' }
  ]},
  ren: { name:'Ren', element:'ilusion', set:'Distorsión', category:'Usuarios', hp:10, emoji:'🌀', img:'img/ren.png', concept:'Pretende hacer dudar del funcionamiento, mantener la duda y confundir.', abilities: [
    { type:'normal', icon:'⚔️', name:'Error', cost:'x1 dado de ilusión, x2 dados cualesquiera', effect:'Golpea al enemigo e inflige 2 puntos de daño normal.' },
    { type:'elemental', icon:'🔮', name:'Inconsistencia', cost:'x5 dados de ilusión', effect:'Golpea al enemigo e inflige 2 puntos de daño penetrante, fuerza el cambio al siguiente enemigo en reserva y marca al nuevo enemigo activo con ilusión.' },
    { type:'ultimate', icon:'💥', name:'Destrucción de Lógica', cost:'x4 dados de ilusión, x3 puntos de energía', effect:'Golpea al enemigo e inflige 3 puntos de daño penetrante, marcándolo con ilusión y forzando el cambio al siguiente enemigo en reserva.' },
    { type:'passive', icon:'🛡️', name:'Paso Fantasma', effect:'Al usar su habilidad elemental o definitiva, Ren pasa a la reserva y el siguiente personaje en reserva se convierte en activo.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Los aliados no pueden ser marcados por ilusión.' }
  ]},
  noah: { name:'Noah', element:'proteccion', set:'Resonancia', category:'Usuarios', hp:12, emoji:'⚓', img:'img/noah.png', concept:'Su única función es que sus compañeros estén bien…', abilities: [
    { type:'normal', icon:'⚔️', name:'Latido', cost:'x1 dado de protección, x1 dado cualquiera', effect:'Golpea al enemigo e inflige 1 punto de daño.' },
    { type:'elemental', icon:'🔮', name:'Eco Vital', cost:'x3 dados de protección', effect:'Cura 2 puntos de vida verdadera a todos los aliados excepto a sí misma. Dichos aliados pasan a Sintonía. La próxima curación que reciba uno de ellos también la reciben todos los aliados en Sintonía. Una vez ocurre, todos dejan de estar en Sintonía.' },
    { type:'ultimate', icon:'💥', name:'Armonía', cost:'x3 dados de protección, x3 puntos de energía', effect:'Ella misma pasa a Sintonía y se cura 5 puntos de vida, marcando al enemigo activo con protección. Por cada aliado en Sintonía adicional, la curación se reduce en 1.' },
    { type:'passive', icon:'🛡️', name:'Ecos de Compasión', effect:'Las cartas de curación cuestan un dado menos.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Al golpear a un enemigo marcado con protección, cura 1 punto a los aliados no Sintonizados.' }
  ]},
  abla: { name:'Abla', element:'redencion', set:'Venganza', category:'Usuarios', hp:10, emoji:'🗡️', img:'img/abla.png', concept:'Su manera de jugar deja clara su sed; no se olvida del daño que recibe y lo hace pagar.', abilities: [
    { type:'normal', icon:'⚔️', name:'Rencor', cost:'x1 dado de redención, x2 dados cualesquiera', effect:'Golpea al enemigo e inflige 2 puntos de daño.' },
    { type:'elemental', icon:'🔮', name:'Deuda de Sangre', cost:'x4 dados de redención', effect:'Golpea al enemigo e inflige 3 puntos de daño, aplicándole 1 acumulación de Rencor, y se cura el daño verdadero infligido.' },
    { type:'ultimate', icon:'💥', name:'Retribución Final', cost:'x3 dados de redención, x3 puntos de energía', effect:'Cada enemigo con Rencor recibe 3 de daño, más 1 punto por cada acumulación adicional de Rencor, consumiendo todas sus acumulaciones.' },
    { type:'passive', icon:'🛡️', name:'Agravio Eterno', effect:'Al resucitar inflige 1 punto de daño a todos los enemigos.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Los enemigos con Rencor reciben 1 punto de daño al final de la ronda.' }
  ]},
  manuel: { name:'Manuel', element:'redencion', set:'Entropía', category:'Usuarios', hp:11, emoji:'⚡', img:'img/manuel.png', concept:'Da grandes saltos sabiendo que si va a causar dolor, él también va a fastidiarse.', abilities: [
    { type:'normal', icon:'⚔️', name:'Ruptura', cost:'x2 dados de redención, x2 dados cualesquiera', effect:'Golpea al enemigo e inflige 3 puntos de daño.' },
    { type:'elemental', icon:'🔮', name:'Degradación', cost:'x5 dados de redención', effect:'Se autolesiona 2 puntos y golpea al enemigo infligiendo 4 puntos de daño, marcándolo con redención. Esta habilidad no genera energía si la definitiva está acumulada.' },
    { type:'ultimate', icon:'💥', name:'Decadencia', cost:'x3 dados de redención, x2 puntos de energía', effect:'Acumula +1 daño en su habilidad elemental (tanto al enemigo como a sí mismo) y reduce su coste en 1 dado. Se acumula hasta ejecutar la elemental. Al hacerlo, se reinicia la acumulación y los enemigos marcados con redención dejan de estarlo.' },
    { type:'passive', icon:'🛡️', name:'Tributo Vital', effect:'Al matar a un enemigo, Manuel recupera 1 punto de vida.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Usar la habilidad elemental otorga 2 puntos de energía en lugar de 1.' }
  ]},
  jose: { name:'Jose', element:'transformacion', set:'Inercia', category:'Usuarios', hp:10, emoji:'🦋', img:'img/jose.png', concept:'Aprovecha el flujo del juego para entrar y salir, usando esa velocidad para mejorar el daño.', abilities: [
    { type:'normal', icon:'⚔️', name:'Acelerón', cost:'x2 dados de transformación, x1 dado cualquiera', effect:'Inflige 2 puntos al enemigo. Si el ataque es acelerado (realizado tras cambiar a Jose en el mismo turno), suma 1 punto más y marca al enemigo con transformación.' },
    { type:'elemental', icon:'🔮', name:'Impulso', cost:'x3 dados de transformación', effect:'Durante el resto de la ronda, su siguiente ataque normal suma 2 puntos de daño. Después pasa a la reserva.' },
    { type:'ultimate', icon:'💥', name:'Instinto', cost:'x4 dados de transformación, x2 puntos de energía', effect:'Inflige 3 puntos al enemigo activo. Se considera un ataque normal, por lo que puede ser acelerado: si lo es, suma 2 puntos más y marca con transformación.' },
    { type:'passive', icon:'🛡️', name:'Cambio Cinético', effect:'Cambiar de personaje a Jose se considera una acción rápida.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Cambiar a Jose no cuesta dados.' }
  ]},
  josemi: { name:'Josemi', element:'expresion', set:'Cosmogénesis', category:'Usuarios', hp:10, emoji:'🎤', img:'img/josemi.png', concept:'Manipulación de cartas de apoyo y control del campo.', abilities: [
    { type:'normal', icon:'⚔️', name:'Esbozo', cost:'x1 dado de expresión, x2 dados cualesquiera', effect:'Inflige 2 puntos de daño al enemigo.' },
    { type:'elemental', icon:'🔮', name:'Reescritura', cost:'x3 dados de expresión', effect:'Restablece la duración de una carta de apoyo o estructura propia en el campo y destruye una carta de apoyo enemiga. Si no destruye ningún apoyo enemigo, marca al enemigo activo con expresión.' },
    { type:'ultimate', icon:'💥', name:'Canon', cost:'x5 dados de expresión, x2 puntos de energía', effect:'Roba hasta 3 cartas de apoyo del mazo y activa inmediatamente el beneficio de cada carta de apoyo propia que ya esté en el campo, sin reducir su duración restante.' },
    { type:'passive', icon:'🛡️', name:'Vestigios del Origen', effect:'Cuando una carta de apoyo propia desaparece del campo, otorga 1 dado del tipo del aliado activo.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Las cartas de apoyo cuestan un dado menos.' }
  ]},
  artemis: { name:'Artemis', element:'aceptacion', set:'Erik', category:'Eriks', hp:11, emoji:'🦅', img:'img/artemis.png', concept:'Vuela alto. Vuela alto por mí. Vuela alto por tí. Vuela alto por todos aquellos que dudaron de tu vuelo. Vuela alto por todo aquello que sientes que es correcto.', abilities: [
    { type:'normal', icon:'⚔️', name:'Disparo divino', cost:'x2 dados de aceptación, x2 dados cualesquiera', effect:'Causa 3 de daño físico al enemigo activo.' },
    { type:'elemental', icon:'🔮', name:'Carrerilla', cost:'x3 dados de aceptación', effect:'Su siguiente habilidad que cause daño añade 2 puntos de daño adicional. Esta habilidad no otorga energía. Si el siguiente ataque dañino es su ataque normal, el output de energía de ese ataque aumenta en 1 adicionalmente.' },
    { type:'ultimate', icon:'💥', name:'Mis dedos palpan el borde de la estratosfera', cost:'x6 dados de aceptación, x3 puntos de energía', effect:'Si no tiene el efecto "Vuelo", lo recibe. Si tenía el efecto "Vuelo" antes de usar esta habilidad, causa 6 de daño elemental a todos los enemigos, los marca con "Aceptación" y muere.' },
    { type:'passive', icon:'🛡️', name:'Vuelo', effect:'Bajo el efecto "Vuelo" recibe una reducción de daño de 2. Si recibe daño verdadero, recibe 3 de daño adicional, gana 1 de energía y pierde el efecto. No puede ser resucitada. Cartas que "resucitan" pueden ser consumidas por ella si está viva para recibir alternativamente salud equivalente a la de la resurrección. No puede usar cartas que aumenten su energía.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Su definitiva cuesta 2 dados más y aumenta en 2 su poder base.' }
  ]},
  neon: { name:'Neón', element:'ilusion', set:'Erik', category:'Eriks', hp:6, emoji:'🎆', img:'img/neon.png', concept:'Un set que distorsiona la realidad sonora, transformando el campo de batalla en un escenario donde la ilusión y el ritmo dictan el compás.', abilities: [
    { type:'normal', icon:'⚔️', name:'Scratch', cost:'x3 dados de ilusión', effect:'Inflige 1 punto de daño al enemigo activo. Si el entorno activo es "Sobrecarga Epiléptica", el daño aumenta en 1 punto. Si la estructura "Mesa de DJ" está activa en tu campo, el daño aumenta en 1 punto adicional y el coste de esta habilidad aumenta en 1 dado de ilusión.' },
    { type:'elemental', icon:'🔮', name:'Remix', cost:'x4 dados de ilusión', effect:'Coloca la estructura "Mesa de DJ" (2 rondas) si no estaba en tu campo. Si "Mesa de DJ" ya estaba activa, marca al enemigo activo con Ilusión.' },
    { type:'ultimate', icon:'💥', name:'Killer Tunes', cost:'x4 dados de ilusión, x3 puntos de energía', effect:'Cambia el entorno a "Sobrecarga Epiléptica" durante 2 rondas. Además, durante el resto de la ronda, los cambios de personaje de tu equipo causan 1 punto de daño al enemigo activo.' },
    { type:'passive', icon:'🛡️', name:'Frecuencia Constante', effect:'Si comienza la ronda como personaje activo, se cura 4 puntos de vida. Al declarar el fin de la ronda estando activa, cambia al siguiente aliado vivo y recibe 2 puntos de escudo.' },
    { type:'ex', icon:'🌟', name:'EX · Sobrecarga', effect:'Su vida máxima aumenta a 8 puntos de vida durante el resto de la partida.' }
  ]},
  vittoria:   { name:'Vittoria',  element:'aceptacion',     set:'Erik', category:'Eriks', hp:11, emoji:'👑', img:'img/vittoria.png',   concept:'', comingSoon:true, abilities:[] },
  sage:       { name:'Sage',      element:'transformacion', set:'Erik', category:'Eriks', hp:11, emoji:'🧙', img:'img/sage.png',       concept:'', comingSoon:true, abilities:[] },
  david:      { name:'David',     element:'redencion',      set:'Erik', category:'Eriks', hp:11, emoji:'🏹', img:'img/david.png',      concept:'', comingSoon:true, abilities:[] },
  ah:         { name:'A/H',       element:'ilusion',        set:'Erik', category:'Eriks', hp:11, emoji:'🎩', img:'img/ah.png',         concept:'', comingSoon:true, abilities:[] },
  felicia:    { name:'Felicia',   element:'expresion',      set:'Erik', category:'Eriks', hp:11, emoji:'🎀', img:'img/felicia.png',    concept:'', comingSoon:true, abilities:[] },
  nc:         { name:'NC',        element:'proteccion',     set:'Erik', category:'Eriks', hp:11, emoji:'🎯', img:'img/nc.png',         concept:'', comingSoon:true, abilities:[] },
  orath: { name:'Orath', element:'redencion', set:'Erik', category:'Eriks', hp:9, emoji:'🗿', img:'img/orath.png', concept:'Los demonios aman el frío y el silencio, pues la paz la desean todos los seres vivos. Sin embargo, sus pecados deben ser respondidos con un dolor similar al provocado hacia la vida misma, por lo que, en muerte, reciben un castigo de eterno sufrimiento, agonía que perciben en todos sus sentidos hasta que su cordura se calcine hasta terminar de chamuscar hasta la última mota de ceniza que quede de ellos.', abilities: [
    { type:'normal', icon:'⚔️', name:'Ojo por ojo', cost:'x2 dados de redención, x1 dado cualquiera', effect:'Causa 1 punto de daño físico al enemigo activo. Aumenta el daño en 1 punto por cada "Cruz de Madera" presente en el campo.' },
    { type:'elemental', icon:'🔮', name:'Minuto de silencio', cost:'x4 dados de redención', effect:'Genera un escudo de 2 puntos de vida para sí misma que, si no es destruido, desaparece al final de la ronda. Si su escudo es golpeado, genera 1 "Cruz de Madera" propia (solo puede generar una estructura de esta manera hasta que dicha estructura sea destruida).' },
    { type:'ultimate', icon:'💥', name:'Dios te ampare, maldito pecador', cost:'x3 dados de redención, x2 puntos de energía', effect:'Destruye todas las estructuras "Cruz de Madera" del campo. Causa 1 punto de daño a los enemigos en reserva por cada "Cruz de Madera" eliminada.' },
    { type:'passive', icon:'🛡️', name:'Vía Crucis', effect:'Si un aliado (diferente a Orath) recibe daño verdadero, se genera una estructura "Cruz de Madera" (una vez por aliado hasta que la cruz correspondiente sea destruida). Si termina la ronda, Orath está activa y hay estructuras "Cruz de Madera", el enemigo activo es marcado con redención y las cruces se destruyen. Cada "Cruz de Madera" causa 1 punto de daño al enemigo activo al ser destruida.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Si Orath muere genera una estructura "Cruz de Sangre". Si un aliado muere se destruye esta estructura. Al destruirse, revive al último aliado caído con 1 punto de salud y 2 puntos de escudo.' }
  ]},
  maria:      { name:'María',     element:'aceptacion',     set:'Erik', category:'Eriks', hp:11, emoji:'🌺', img:'img/maria.png',      concept:'', comingSoon:true, abilities:[] },
  erikxd:     { name:'ErikXD',    element:'proteccion',     set:'Erik', category:'Eriks', hp:11, emoji:'😎', img:'img/erikxd.png',     concept:'', comingSoon:true, abilities:[] },
  bella:      { name:'Bella',     element:'transformacion', set:'Erik', category:'Eriks', hp:11, emoji:'🦢', img:'img/bella.png',      concept:'', comingSoon:true, abilities:[] },
  esmeralda:  { name:'Esmeralda', element:'aceptacion',     set:'Erik', category:'Eriks', hp:11, emoji:'💎', img:'img/esmeralda.png',  concept:'', comingSoon:true, abilities:[] },
  iris:       { name:'Iris',      element:'proteccion',     set:'Erik', category:'Eriks', hp:11, emoji:'🌈', img:'img/iris.png',       concept:'', comingSoon:true, abilities:[] },
  amaya:      { name:'Amaya',     element:'comprension',    set:'Erik', category:'Eriks', hp:11, emoji:'🦉', img:'img/amaya.png',      concept:'', comingSoon:true, abilities:[] },
  adela: { name:'Adela', element:'transformacion', set:'Erik', category:'Eriks', hp:10, emoji:'🕊️', img:'img/adela.png', concept:'Un set dedicado a un alma pícara, una chica capaz, un alma libre que disfruta de las pequeñas gracias y desgracias de la vida.', abilities: [
    { type:'normal', icon:'⚔️', name:'Gracia Pícara', cost:'x2 dados de transformación, x1 dado cualquiera', effect:'Quita 1 punto de vida al enemigo activo. Se cura 1 punto de vida si causa daño verdadero al enemigo con dicho ataque.' },
    { type:'elemental', icon:'🔮', name:'Flechazo Tentador', cost:'x3 dados de transformación', effect:'Si el enemigo activo estaba marcado, le quita su marca primero y le causa 2 puntos de daño penetrante. Marca al enemigo activo con Transformación.' },
    { type:'ultimate', icon:'💥', name:'Mis Modales en el Suelo', cost:'x5 dados de transformación, x2 puntos de energía', effect:'Si no estaba marcada, se marca a ella misma con Transformación y pasa a tener 5 de vida (independientemente de si su cantidad de puntos de vida era mayor o menor). Si estaba marcada con Transformación, causa 4 puntos de daño al enemigo activo. Si estaba marcada con un elemento distinto a Transformación, se suicida.' },
    { type:'passive', icon:'🛡️', name:'Alma Pícara', effect:'Si es revivida y era marcada antaño con algún elemento, se transforma en Hunger Incarnate. Si está marcada con algún elemento, aumenta en 1 TODOS los efectos de sus habilidades y en 1 dado el precio consecuente (en dados de transformación).' },
    { type:'ex', icon:'🌟', name:'EX · Café para llevar', effect:'Comienza la partida con 2 cartas de "Café solo" en la mano (si existen en el mazo) y roba 3 cartas menos en su mano inicial.' }
  ]},
  hunger: { name:'Hunger Incarnate', element:'transformacion', set:'Erik', category:'Eriks', hp:5, emoji:'👹', img:'img/hunger.png', concept:'Un set dedicado a un monstruo, un ser hecho para manipular a todo aquello que toca, una entidad que destruye aquello que roza como si su tacto fuera veneno puro, un demonio traído desde lo más profundo del infierno para causar nada más que dolor y desesperación y que, no importa cuánto muera, siempre acaba volviendo para hacer de la vida de todos una absoluta pesadilla.', abilities: [
    { type:'normal', icon:'⚔️', name:'Muere', cost:'x1 dado de transformación, x1 dado cualquiera', effect:'Quita 1 punto de vida al enemigo activo. El daño aumenta en 1 punto si el enemigo activo está marcado por algún elemento.' },
    { type:'elemental', icon:'🔮', name:'MUERE', cost:'x3 dados de transformación', effect:'Si el enemigo activo estaba marcado, le quita su marca primero y le causa 2 de daño penetrante. Marca al enemigo activo con Transformación. El enemigo activo cambia al siguiente enemigo en reserva.' },
    { type:'ultimate', icon:'💥', name:'Mi cordura, en el suelo, hecha pedazos', cost:'x4 dados de transformación, x2 puntos de energía', effect:'Si no estaba marcada con Transformación, se marca a ella misma con Transformación y se cura al máximo. Si estaba marcada con Transformación, causa 4 de daño al enemigo activo.' },
    { type:'passive', icon:'🛡️', name:'Hambre Eterna', effect:'Siempre que sea revivida será curada hasta su salud máxima. Es inmune al límite de veces que puede ser revivida. Cambiar a ella causa 1 punto de daño al aliado que cambió a ella y cura 1 punto de vida a ella misma. Si está afectada por una marca, su daño base se duplica al igual que el coste de dados de todas sus habilidades. Si al final de la ronda está afectada por una marca, pierde 2 puntos de vida.' },
    { type:'ex', icon:'🌟', name:'EX · Café amargo', effect:'El "Café solo" pasa a ser gratis para ella, pero adicionalmente le causa 2 puntos de daño al usarlo.' }
  ]},
  alter: { name:'Alter', element:'ilusion', set:'Erik', category:'Eriks', hp:12, emoji:'🎭', img:'img/alter.png', concept:'Un set con el propósito de alzarse sobre el prójimo, de escalar desde el abismo hasta la más alta divinidad. Un set que, en manos indicadas, es capaz de traer consigo el poder de una inigualable deidad.', abilities: [
    { type:'normal', icon:'⚔️', name:'Amenaza a la Ontología', cost:'x1 dado de ilusión, x2 dados cualesquiera', effect:'Inflige 1 punto de daño al enemigo activo. Alter no genera energía con este ataque.' },
    { type:'elemental', icon:'🔮', name:'Conversión Psicológica', cost:'x3 dados de ilusión', effect:'Se otorga 1 punto de invulnerabilidad (máx. 3). Roba toda la energía del resto de personajes del equipo (si roba más puntos de energía de los que necesita, los desecha). Alter no genera energía con esta habilidad.' },
        { type:'ultimate', icon:'💥', name:'Omnes Deam Salutate', cost:'x4 dados de ilusión, x3 puntos de energía', effect:'Aumenta el daño de las habilidades elementales del resto de personajes del equipo en 3 puntos durante 2 rondas.' },
    { type:'passive', icon:'🛡️', name:'Dualismo Ontológico', effect:'Alter no genera energía con el uso del ataque normal o habilidad elemental. Por cada punto de invulnerabilidad, el daño verdadero que recibe Alter se reduce en 1 punto.' },
    { type:'ex', icon:'🌟', name:'EX · Buen Provecho', effect:'La habilidad elemental, en lugar de desechar los puntos de energía sobrantes (los que superan el máximo de energía de Alter), transforma dichos puntos en dados de ilusión.' }
  ]},
  eve:        { name:'Eve',       element:'comprension',    set:'Erik', category:'Eriks', hp:11, emoji:'🍎', img:'img/eve.png',        concept:'', comingSoon:true, abilities:[] },
  opal:       { name:'Opal',      element:'expresion',      set:'Erik', category:'Eriks', hp:11, emoji:'💠', img:'img/opal.png',       concept:'', comingSoon:true, abilities:[] },
  internet: { name:'Internet', element:'proteccion', set:'BTC', category:'BTC', hp:5, emoji:'🌐', img:'img/internet.png', concept:'Un set con el propósito de resistir, de aguantar el peso del mundo sobre sus hombros y de proteger lo que queda.', abilities: [
    { type:'normal', icon:'⚔️', name:'Orden', cost:'x1 dado de protección, x2 dados cualesquiera', effect:'Inflige 2 puntos de daño.' },
    { type:'elemental', icon:'🔮', name:'Daga de Ola', cost:'x3 dados de protección', effect:'Inflige 3 puntos de daño e Internet obtiene un escudo.' },
    { type:'ultimate', icon:'💥', name:'Fase de Limpieza', cost:'x3 dados de protección, x3 puntos de energía', effect:'Inflige 2 de daño a todo el equipo rival. Si con este golpe no se logra derrotar al menos al personaje activo del rival, Internet recibe 2 puntos de daño. Sin embargo, si eliminas al objetivo, robas una carta de tu mazo.' },
    { type:'passive', icon:'🛡️', name:'Orgullo de la Creadora', effect:'Cuando baje hasta 2 puntos de vida, gana inmediatamente 1 punto de energía de forma automática.' },
    { type:'ex', icon:'🌟', name:'EX · Último Recurso', effect:'Si su vida es de 2 puntos o menos, sus habilidades cuestan 1 dado menos y duplican su daño.' }
  ]},
};

var CARD_DB = {
  c_golpe:{ id:'c_golpe', name:'Golpe Certero', tag:'Ataque', emoji:'🎯', color:'200,45,60', cost:{any:1}, effectText:'Tu próximo ataque hace +2 de daño.', effectType:'nextAttackBonus', value:2 },
  c_precision:{ id:'c_precision', name:'Precisión Letal', tag:'Ataque', emoji:'🗡️', color:'200,45,60', cost:{any:2}, effectText:'Tu próximo ataque ignora escudos.', effectType:'nextAttackPiercing' },
  c_colera:{ id:'c_colera', name:'Cólera', tag:'Ataque', emoji:'💢', color:'200,45,60', cost:{same:2}, effectText:'Tu próximo ataque hace +3 de daño.', effectType:'nextAttackBonus', value:3 },
  c_ejecucion:{ id:'c_ejecucion', name:'Ejecución', tag:'Ataque', emoji:'💀', color:'200,45,60', cost:{any:3}, effectText:'Tu próximo ataque hace el doble de daño. Una vez por ronda.', effectType:'nextAttackDouble', oncePerRound:true },
  c_marcar:{ id:'c_marcar', name:'Marcar Objetivo', tag:'Ataque', emoji:'🏹', color:'200,45,60', cost:{any:1}, effectText:'El enemigo activo recibe +1 daño de todas las fuentes esta ronda.', effectType:'markEnemy', value:1 },
  c_bendicion:{ id:'c_bendicion', name:'Bendición Menor', tag:'Curación', emoji:'💚', color:'78,194,107', cost:{any:1}, effectText:'Cura 2 HP al personaje activo.', effectType:'heal', value:2 },
  c_restauracion:{ id:'c_restauracion', name:'Restauración', tag:'Curación', emoji:'🌿', color:'78,194,107', cost:{same:2}, effectText:'Cura 3 HP al personaje activo.', effectType:'heal', value:3 },
  c_curacion_grupal:{ id:'c_curacion_grupal', name:'Curación Grupal', tag:'Curación', emoji:'✨', color:'78,194,107', cost:{any:3}, effectText:'Todos los aliados curan 1 HP.', effectType:'healAll', value:1 },
  c_aura:{ id:'c_aura', name:'Aura Protectora', tag:'Defensa', emoji:'🛡️', color:'140,180,230', cost:{any:1}, effectText:'El personaje activo obtiene 2 escudos.', effectType:'shield', value:2 },
  c_barrera:{ id:'c_barrera', name:'Barrera Mágica', tag:'Defensa', emoji:'🔮', color:'140,180,230', cost:{any:2}, effectText:'El personaje activo obtiene 3 escudos.', effectType:'shield', value:3 },
  c_escudo_grupal:{ id:'c_escudo_grupal', name:'Escudo Grupal', tag:'Defensa', emoji:'⚔️', color:'140,180,230', cost:{any:2}, effectText:'Todos los aliados ganan 1 escudo.', effectType:'shieldAll', value:1 },
  c_purga:{ id:'c_purga', name:'Purga', tag:'Defensa', emoji:'🌪️', color:'140,180,230', cost:{any:2}, effectText:'Elimina todos los escudos del enemigo activo.', effectType:'removeEnemyShields' },
  c_contraataque:{ id:'c_contraataque', name:'Contraataque', tag:'Defensa', emoji:'⚡', color:'140,180,230', cost:{any:2}, effectText:'El siguiente ataque enemigo recibe 2 de daño. Una vez por ronda.', effectType:'prepararContraataque', value:2, oncePerRound:true },
  c_chispa:{ id:'c_chispa', name:'Chispa Arcana', tag:'Energía', emoji:'⚡', color:'240,200,96', cost:{any:1}, effectText:'El personaje activo gana 1 de energía.', effectType:'energy', value:1 },
  c_sobrecarga:{ id:'c_sobrecarga', name:'Sobrecarga', tag:'Energía', emoji:'🔋', color:'240,200,96', cost:{any:2}, effectText:'El personaje activo gana 2 de energía.', effectType:'energy', value:2 },
  c_sintonia:{ id:'c_sintonia', name:'Sintonía', tag:'Dados', emoji:'🎵', color:'165,131,255', cost:{any:1}, effectText:'Añade 1 dado del tipo del personaje activo.', effectType:'drawDiceOfActive', value:1 },
  c_mana:{ id:'c_mana', name:'Maná Abundante', tag:'Dados', emoji:'💎', color:'165,131,255', cost:{any:2}, effectText:'Añade 2 dados del tipo del personaje activo.', effectType:'drawDiceOfActive', value:2 },
  c_reorganizar:{ id:'c_reorganizar', name:'Reorganizar', tag:'Dados', emoji:'🔄', color:'165,131,255', cost:{any:1}, effectText:'Relanza hasta 2 dados (los menos útiles).', effectType:'rerollDice', value:2 },
  c_reordenamiento:{ id:'c_reordenamiento', name:'Reordenamiento Táctico', tag:'Dados', emoji:'🎲', color:'165,131,255', cost:{any:2}, effectText:'Relanza hasta 3 dados (los menos útiles).', effectType:'rerollDice', value:3 },
  c_transmutacion:{ id:'c_transmutacion', name:'Transmutación', tag:'Dados', emoji:'🌀', color:'165,131,255', cost:{any:1}, effectText:'Convierte 1 dado en el tipo del personaje activo.', effectType:'convertDice', value:1 },
  c_caos:{ id:'c_caos', name:'Caos Elemental', tag:'Dados', emoji:'🌈', color:'165,131,255', cost:{any:2}, effectText:'Convierte hasta 2 dados en el tipo del personaje activo.', effectType:'convertDice', value:2 },
  c_sacrificio:{ id:'c_sacrificio', name:'Sacrificio', tag:'Dados', emoji:'🔪', color:'165,131,255', cost:{}, effectText:'Descarta 1 dado (el menos útil) para añadir 2 del tipo del activo. Una vez por ronda.', effectType:'sacrificeDie', oncePerRound:true },
  c_cambio_veloz:{ id:'c_cambio_veloz', name:'Cambio Veloz', tag:'Utilidad', emoji:'🏃', color:'255,130,190', cost:{any:2}, effectText:'Cambia al siguiente aliado vivo como acción rápida. Una vez por ronda.', effectType:'quickChange', oncePerRound:true },
  c_foco:{ id:'c_foco', name:'Foco', tag:'Utilidad', emoji:'🎯', color:'255,130,190', cost:{any:1}, effectText:'Tu próxima habilidad cuesta 1 dado menos. Una vez por ronda.', effectType:'nextAbilityDiscount', value:1, oncePerRound:true },
  c_planificacion:{ id:'c_planificacion', name:'Planificación', tag:'Utilidad', emoji:'📋', color:'255,130,190', cost:{any:2}, effectText:'Tu próxima habilidad cuesta 2 dados menos. Una vez por ronda.', effectType:'nextAbilityDiscount', value:2, oncePerRound:true },
  c_provocacion:{ id:'c_provocacion', name:'Provocación', tag:'Utilidad', emoji:'😠', color:'255,130,190', cost:{any:1}, effectText:'Fuerza al enemigo a cambiar de personaje activo.', effectType:'forceEnemyChange' },
  c_distraccion:{ id:'c_distraccion', name:'Distracción', tag:'Utilidad', emoji:'💨', color:'255,130,190', cost:{}, effectText:'El próximo ataque enemigo hace 1 de daño menos. Una vez por ronda.', effectType:'enemyAttackDebuff', value:1, oncePerRound:true },
  c_hechizo:{ id:'c_hechizo', name:'Hechizo Definitivo', tag:'Potente', emoji:'🌟', color:'255,215,100', cost:{same:3}, effectText:'Tu próxima habilidad cuesta 0 dados y 0 energía. Una vez por partida.', effectType:'nextAbilityFree', oncePerGame:true },
  c_claridad:{ id:'c_claridad', name:'Momento de Claridad', tag:'Potente', emoji:'☀️', color:'255,215,100', cost:{any:3}, effectText:'Tu próximo ataque hace +3 de daño e ignora escudos. Una vez por ronda.', effectType:'nextAttackCritical', value:3, oncePerRound:true },
  c_bendicion_destino:{ id:'c_bendicion_destino', name:'Bendición del Destino', tag:'Potente', emoji:'🔮', color:'255,215,100', cost:{same:2}, effectText:'Añade 1 dado de cada tipo de tu equipo (máx. 3). Una vez por ronda.', effectType:'drawTeamDice', oncePerRound:true },
  c_cafe_solo:{ id:'c_cafe_solo', name:'Café solo', tag:'Energía', emoji:'☕', color:'240,200,96', cost:{same:3}, effectText:'Otorga 2 puntos de energía al aliado activo.', effectType:'energy', value:2 },
  c_resurreccion:{ id:'c_resurreccion', name:'Resurrección', tag:'Curación', emoji:'✝️', color:'78,194,107', cost:{same:3}, effectText:'Revive a un aliado caído con 2 HP y 1 de escudo. Una vez por partida.', effectType:'revive', value:2, oncePerGame:true },
};

var EQUIPMENT_CARDS = {
  eq_espada_corta:{ id:'eq_espada_corta', category:'equipo', name:'Espada Corta', tag:'Arma', emoji:'🗡️', color:'200,45,60', cost:{any:1}, effectText:'+1 daño en los ataques del personaje equipado.', effect:{attackBonus:1} },
  eq_mandoble:{ id:'eq_mandoble', category:'equipo', name:'Mandoble', tag:'Arma', emoji:'⚔️', color:'200,45,60', cost:{any:2}, effectText:'+2 daño en los ataques del personaje equipado.', effect:{attackBonus:2} },
  eq_espada_legendaria:{ id:'eq_espada_legendaria', category:'equipo', name:'Espada Legendaria', tag:'Arma', emoji:'🗡️', color:'200,45,60', cost:{any:3}, effectText:'+3 daño en los ataques del personaje equipado.', effect:{attackBonus:3} },
  eq_arco_largo:{ id:'eq_arco_largo', category:'equipo', name:'Arco Largo', tag:'Arma', emoji:'🏹', color:'200,45,60', cost:{same:2}, effectText:'+2 daño y los ataques infligen daño penetrante.', effect:{attackBonus:2, piercing:true} },
  eq_baston_magico:{ id:'eq_baston_magico', category:'equipo', name:'Bastón Mágico', tag:'Arma', emoji:'🪄', color:'200,45,60', cost:{any:2}, effectText:'+1 dado del elemento del personaje al inicio de cada ronda.', effect:{elementDicePerRound:1} },
  eq_guantes_poder:{ id:'eq_guantes_poder', category:'equipo', name:'Guantes de Poder', tag:'Arma', emoji:'🥊', color:'200,45,60', cost:{any:2}, effectText:'+2 daño y +1 energía al equipar.', effect:{attackBonus:2, energyBonus:1} },
  eq_hacha_guerra:{ id:'eq_hacha_guerra', category:'equipo', name:'Hacha de Guerra', tag:'Arma', emoji:'🪓', color:'200,45,60', cost:{any:3}, effectText:'+2 daño y los ataques infligen daño penetrante.', effect:{attackBonus:2, piercing:true} },
  eq_lanza_larga:{ id:'eq_lanza_larga', category:'equipo', name:'Lanza Larga', tag:'Arma', emoji:'🔱', color:'200,45,60', cost:{any:2}, effectText:'+1 daño y +1 escudo al equipar.', effect:{attackBonus:1, shieldBonus:1} },
  eq_alabarda_maldita:{ id:'eq_alabarda_maldita', category:'equipo', name:'Alabarda Maldita', tag:'Arma', emoji:'⚔️', color:'200,45,60', cost:{same:3}, effectText:'+3 daño pero -1 HP al equipar.', effect:{attackBonus:3, selfDamage:1} },
  eq_escudo_redondo:{ id:'eq_escudo_redondo', category:'equipo', name:'Escudo Redondo', tag:'Armadura', emoji:'🛡️', color:'140,180,230', cost:{any:1}, effectText:'+2 escudos al equipar.', effect:{shieldBonus:2} },
  eq_coraza_placas:{ id:'eq_coraza_placas', category:'equipo', name:'Coraza de Placas', tag:'Armadura', emoji:'⚙️', color:'140,180,230', cost:{any:2}, effectText:'+4 escudos al equipar.', effect:{shieldBonus:4} },
  eq_cota_malla:{ id:'eq_cota_malla', category:'equipo', name:'Cota de Malla', tag:'Armadura', emoji:'🧥', color:'140,180,230', cost:{same:2}, effectText:'Reduce en 1 el daño recibido.', effect:{damageReduction:1} },
  eq_peto_dragon:{ id:'eq_peto_dragon', category:'equipo', name:'Peto de Dragón', tag:'Armadura', emoji:'🐉', color:'140,180,230', cost:{any:3}, effectText:'Reduce en 2 el daño recibido.', effect:{damageReduction:2} },
  eq_egida_divina:{ id:'eq_egida_divina', category:'equipo', name:'Égida Divina', tag:'Armadura', emoji:'✨', color:'140,180,230', cost:{same:3}, effectText:'Reduce en 3 el daño recibido y +2 escudos al equipar.', effect:{damageReduction:3, shieldBonus:2} },
  eq_casco_hierro:{ id:'eq_casco_hierro', category:'equipo', name:'Casco de Hierro', tag:'Armadura', emoji:'🪖', color:'140,180,230', cost:{any:1}, effectText:'Reduce en 1 el daño recibido.', effect:{damageReduction:1} },
  eq_escudo_cristal:{ id:'eq_escudo_cristal', category:'equipo', name:'Escudo de Cristal', tag:'Armadura', emoji:'💎', color:'140,180,230', cost:{any:2}, effectText:'+3 escudos y +1 daño en ataques.', effect:{shieldBonus:3, attackBonus:1} },
  eq_armadura_ligera:{ id:'eq_armadura_ligera', category:'equipo', name:'Armadura Ligera', tag:'Armadura', emoji:'👕', color:'140,180,230', cost:{any:1}, effectText:'+2 escudos al equipar.', effect:{shieldBonus:2} },
  eq_amuleto_vida:{ id:'eq_amuleto_vida', category:'equipo', name:'Amuleto de Vida', tag:'Accesorio', emoji:'💚', color:'255,215,100', cost:{any:1}, effectText:'Cura 2 HP al equipar.', effect:{healBonus:2} },
  eq_anillo_sanador:{ id:'eq_anillo_sanador', category:'equipo', name:'Anillo Sanador', tag:'Accesorio', emoji:'💍', color:'255,215,100', cost:{any:2}, effectText:'Cura 1 HP al inicio de cada ronda.', effect:{healPerRound:1} },
  eq_pocion_energia:{ id:'eq_pocion_energia', category:'equipo', name:'Poción de Energía', tag:'Accesorio', emoji:'⚗️', color:'255,215,100', cost:{any:1}, effectText:'+1 energía al equipar.', effect:{energyBonus:1} },
  eq_orbe_poder:{ id:'eq_orbe_poder', category:'equipo', name:'Orbe de Poder', tag:'Accesorio', emoji:'🔮', color:'255,215,100', cost:{any:2}, effectText:'+1 energía al inicio de cada ronda.', effect:{energyPerRound:1} },
  eq_cetro_arcano:{ id:'eq_cetro_arcano', category:'equipo', name:'Cetro Arcano', tag:'Accesorio', emoji:'🪄', color:'255,215,100', cost:{same:2}, effectText:'+1 energía al equipar y +1 daño.', effect:{energyBonus:1, attackBonus:1} },
  eq_talisman_lunar:{ id:'eq_talisman_lunar', category:'equipo', name:'Talismán Lunar', tag:'Accesorio', emoji:'🌙', color:'255,215,100', cost:{any:2}, effectText:'+2 energía al equipar.', effect:{energyBonus:2} },
  eq_gema_elemental:{ id:'eq_gema_elemental', category:'equipo', name:'Gema Elemental', tag:'Accesorio', emoji:'💠', color:'255,215,100', cost:{same:2}, effectText:'+1 dado del elemento del personaje al inicio de cada ronda.', effect:{elementDicePerRound:1} },
  eq_botas_velocidad:{ id:'eq_botas_velocidad', category:'equipo', name:'Botas de Velocidad', tag:'Accesorio', emoji:'👟', color:'255,215,100', cost:{any:1}, effectText:'+2 escudos al equipar.', effect:{shieldBonus:2} },
  eq_capa_sombria:{ id:'eq_capa_sombria', category:'equipo', name:'Capa Sombría', tag:'Accesorio', emoji:'🧥', color:'255,215,100', cost:{any:2}, effectText:'Reduce en 1 el daño recibido y +1 escudo.', effect:{damageReduction:1, shieldBonus:1} },
  eq_cuerno_guerra:{ id:'eq_cuerno_guerra', category:'equipo', name:'Cuerno de Guerra', tag:'Accesorio', emoji:'📯', color:'255,215,100', cost:{any:2}, effectText:'+1 energía a todos los aliados al equipar.', effect:{teamEnergyBonus:1} },
  eq_estandarte_sagrado:{ id:'eq_estandarte_sagrado', category:'equipo', name:'Estandarte Sagrado', tag:'Accesorio', emoji:'🏴', color:'255,215,100', cost:{any:3}, effectText:'+1 escudo a todos los aliados al equipar.', effect:{teamShieldBonus:1} },
  eq_corona_reyes:{ id:'eq_corona_reyes', category:'equipo', name:'Corona de Reyes', tag:'Accesorio', emoji:'👑', color:'255,215,100', cost:{same:3}, effectText:'+1 daño y +1 energía al inicio de cada ronda.', effect:{attackBonus:1, energyPerRound:1} },
  eq_reliquia_antigua:{ id:'eq_reliquia_antigua', category:'equipo', name:'Reliquia Antigua', tag:'Accesorio', emoji:'🏺', color:'255,215,100', cost:{any:3}, effectText:'+1 daño, reduce 1 daño recibido y +2 escudos al equipar.', effect:{attackBonus:1, damageReduction:1, shieldBonus:2} }
};

var SUPPORT_CARDS = {
  sp_santuario_curativo:{ id:'sp_santuario_curativo', category:'apoyo', name:'Santuario Curativo', tag:'Estructura', emoji:'⛩️', color:'130,220,140', cost:{any:2}, duration:2, effectText:'Cura 1 HP al activo al final de cada ronda durante 2 rondas.', effect:{healPerRound:1} },
  sp_muro_contencion:{ id:'sp_muro_contencion', category:'apoyo', name:'Muro de Contención', tag:'Estructura', emoji:'🧱', color:'130,220,140', cost:{any:2}, duration:2, effectText:'+1 escudo al activo al inicio de cada ronda durante 2 rondas.', effect:{shieldPerRound:1} },
  sp_altar_poder:{ id:'sp_altar_poder', category:'apoyo', name:'Altar de Poder', tag:'Estructura', emoji:'🕯️', color:'130,220,140', cost:{any:2}, duration:2, effectText:'+1 energía al activo al inicio de cada ronda durante 2 rondas.', effect:{energyPerRound:1} },
  sp_torre_vigia:{ id:'sp_torre_vigia', category:'apoyo', name:'Torre de Vigía', tag:'Estructura', emoji:'🗼', color:'130,220,140', cost:{any:3}, duration:2, effectText:'Roba 1 carta al final de cada ronda durante 2 rondas.', effect:{drawPerRound:1} },
  sp_campo_fuerza:{ id:'sp_campo_fuerza', category:'apoyo', name:'Campo de Fuerza', tag:'Aura', emoji:'🔵', color:'255,130,190', cost:{any:3}, duration:2, effectText:'+1 escudo a todos los aliados al inicio de cada ronda durante 2 rondas.', effect:{teamShieldPerRound:1} },
  sp_bendicion_solar:{ id:'sp_bendicion_solar', category:'apoyo', name:'Bendición Solar', tag:'Aura', emoji:'☀️', color:'255,130,190', cost:{same:2}, duration:3, effectText:'Cura 1 HP a todos los aliados al final de cada ronda durante 3 rondas.', effect:{teamHealPerRound:1} },
  sp_zona_guerra:{ id:'sp_zona_guerra', category:'apoyo', name:'Zona de Guerra', tag:'Aura', emoji:'⚔️', color:'255,130,190', cost:{any:2}, duration:2, effectText:'+1 daño a los ataques de tus personajes durante 2 rondas.', effect:{teamAttackBonus:1} },
  sp_trampa_puas:{ id:'sp_trampa_puas', category:'apoyo', name:'Trampa de Púas', tag:'Trampa', emoji:'🗡️', color:'180,100,230', cost:{any:2}, duration:2, effectText:'Cuando el activo es atacado, el atacante recibe 1 de daño (2 rondas).', effect:{reflectDamage:1} },
  sp_portal_arcano:{ id:'sp_portal_arcano', category:'apoyo', name:'Portal Arcano', tag:'Estructura', emoji:'🌀', color:'130,220,140', cost:{any:3}, duration:2, effectText:'+1 omnidado al inicio de cada ronda durante 2 rondas.', effect:{omniDiePerRound:1} },
  sp_santuario_luna:{ id:'sp_santuario_luna', category:'apoyo', name:'Santuario de la Luna', tag:'Estructura', emoji:'🌙', color:'130,220,140', cost:{any:2}, duration:1, effectText:'Cura 3 HP al activo al final de esta ronda.', effect:{healPerRound:3} },
  sp_circulo_druidico:{ id:'sp_circulo_druidico', category:'apoyo', name:'Círculo Druídico', tag:'Estructura', emoji:'🌿', color:'130,220,140', cost:{same:2}, duration:3, effectText:'+1 escudo al activo al inicio de cada ronda durante 3 rondas.', effect:{shieldPerRound:1} },
  sp_aura_proteccion:{ id:'sp_aura_proteccion', category:'apoyo', name:'Aura de Protección', tag:'Aura', emoji:'🌟', color:'255,130,190', cost:{any:2}, duration:2, effectText:'Reduce en 1 el daño recibido por el activo durante 2 rondas.', effect:{damageReduction:1} },
  sp_muralla_antigua:{ id:'sp_muralla_antigua', category:'apoyo', name:'Muralla Antigua', tag:'Estructura', emoji:'🏰', color:'130,220,140', cost:{any:3}, duration:3, effectText:'+2 escudos a todos los aliados al colocarse (3 rondas).', effect:{teamShieldInstant:2} },
  sp_totem_guerra:{ id:'sp_totem_guerra', category:'apoyo', name:'Tótem de Guerra', tag:'Estructura', emoji:'🪶', color:'130,220,140', cost:{any:2}, duration:2, effectText:'+2 daño a los ataques del activo durante 2 rondas.', effect:{attackBonus:2} },
  sp_manantial_curativo:{ id:'sp_manantial_curativo', category:'apoyo', name:'Manantial Curativo', tag:'Estructura', emoji:'💧', color:'130,220,140', cost:{same:2}, duration:3, effectText:'Cura 2 HP al activo al final de cada ronda durante 3 rondas.', effect:{healPerRound:2} },
  sp_arma_flotante:{ id:'sp_arma_flotante', category:'apoyo', name:'Arma Mágica Flotante', tag:'Estructura', emoji:'🗡️', color:'130,220,140', cost:{any:2}, duration:2, effectText:'+1 daño a los ataques del activo durante 2 rondas.', effect:{attackBonus:1} },
  sp_barrera_espiritual:{ id:'sp_barrera_espiritual', category:'apoyo', name:'Barrera Espiritual', tag:'Aura', emoji:'🛡️', color:'255,130,190', cost:{any:1}, duration:3, effectText:'+3 escudos al activo al colocarse (3 rondas).', effect:{shieldInstant:3} },
  sp_ojo_vidente:{ id:'sp_ojo_vidente', category:'apoyo', name:'Ojo Vidente', tag:'Estructura', emoji:'👁️', color:'130,220,140', cost:{any:2}, duration:2, effectText:'Roba 2 cartas al final de cada ronda durante 2 rondas.', effect:{drawPerRound:2} },
  sp_campo_energia:{ id:'sp_campo_energia', category:'apoyo', name:'Campo de Energía', tag:'Aura', emoji:'⚡', color:'255,130,190', cost:{any:3}, duration:2, effectText:'+1 energía a todos los aliados al inicio de cada ronda durante 2 rondas.', effect:{teamEnergyPerRound:1} },
  sp_santuario_prohibido:{ id:'sp_santuario_prohibido', category:'apoyo', name:'Santuario Prohibido', tag:'Estructura', emoji:'🕯️', color:'130,220,140', cost:{any:3}, duration:4, effectText:'Cura 1 HP al activo al final de cada ronda durante 4 rondas.', effect:{healPerRound:1} },
  sp_muro_llamas:{ id:'sp_muro_llamas', category:'apoyo', name:'Muro de Llamas', tag:'Trampa', emoji:'🔥', color:'180,100,230', cost:{any:2}, duration:2, effectText:'Cuando el activo es atacado, el atacante recibe 2 de daño (2 rondas).', effect:{reflectDamage:2} },
  sp_gema_poder:{ id:'sp_gema_poder', category:'apoyo', name:'Gema de Poder', tag:'Estructura', emoji:'💎', color:'130,220,140', cost:{any:2}, duration:3, effectText:'+1 dado del elemento del activo al inicio de cada ronda durante 3 rondas.', effect:{elementDiePerRound:1} },
  sp_bibliotecario:{ id:'sp_bibliotecario', category:'apoyo', name:'Bibliotecario', tag:'Estructura', emoji:'📚', color:'130,220,140', cost:{any:2}, duration:3, effectText:'Roba 1 carta al final de cada ronda durante 3 rondas.', effect:{drawPerRound:1} },
  sp_oasis:{ id:'sp_oasis', category:'apoyo', name:'Oasis', tag:'Estructura', emoji:'🌴', color:'130,220,140', cost:{any:1}, duration:3, effectText:'Cura 1 HP al activo al final de cada ronda durante 3 rondas.', effect:{healPerRound:1} },
  sp_escudo_etereo:{ id:'sp_escudo_etereo', category:'apoyo', name:'Escudo Etéreo', tag:'Aura', emoji:'🌫️', color:'255,130,190', cost:{any:2}, duration:2, effectText:'Reduce en 1 el daño recibido por todos los aliados durante 2 rondas.', effect:{teamDamageReduction:1} },
  sp_estatua_heroe:{ id:'sp_estatua_heroe', category:'apoyo', name:'Estatua de Héroe', tag:'Estructura', emoji:'🗿', color:'130,220,140', cost:{any:2}, duration:3, effectText:'+1 escudo al activo al inicio de cada ronda durante 3 rondas.', effect:{shieldPerRound:1} },
  sp_aliento_viento:{ id:'sp_aliento_viento', category:'apoyo', name:'Aliento del Viento', tag:'Aura', emoji:'🌬️', color:'255,130,190', cost:{any:2}, duration:2, effectText:'Reduce en 1 el daño recibido por el activo durante 2 rondas.', effect:{damageReduction:1} },
  sp_pozo_almas:{ id:'sp_pozo_almas', category:'apoyo', name:'Pozo de Almas', tag:'Trampa', emoji:'💀', color:'180,100,230', cost:{any:2}, duration:2, effectText:'El rival pierde 1 energía al inicio de cada ronda durante 2 rondas.', effect:{enemyEnergyDrain:1} },
  sp_templo_antiguo:{ id:'sp_templo_antiguo', category:'apoyo', name:'Templo Antiguo', tag:'Estructura', emoji:'⛪', color:'130,220,140', cost:{any:3}, duration:2, effectText:'Cura 2 HP a todos los aliados al final de cada ronda durante 2 rondas.', effect:{teamHealPerRound:2} },
  sp_bateria_arcana:{ id:'sp_bateria_arcana', category:'apoyo', name:'Batería Arcana', tag:'Estructura', emoji:'🔋', color:'130,220,140', cost:{same:2}, duration:3, effectText:'+1 energía al activo al inicio de cada ronda durante 3 rondas.', effect:{energyPerRound:1} }
};

Object.keys(CARD_DB).forEach(function(id){ if (!CARD_DB[id].category) CARD_DB[id].category = 'evento'; });
Object.assign(CARD_DB, EQUIPMENT_CARDS, SUPPORT_CARDS);
var CARD_ORDER = Object.keys(CARD_DB);
var CARD_FILTER_ALL_TAGS = ['Ataque','Curación','Defensa','Energía','Dados','Utilidad','Potente','Arma','Armadura','Accesorio','Estructura','Aura','Trampa'];

var PAINT_CARDS = {
  paint_roja:{ id:'paint_roja', category:'pintura', name:'Pintura Roja', tag:'Pintura', emoji:'🔴', color:'220,60,60', cost:{}, effectText:'Equipable solo sobre Erik. Su Trazo Vivo inflige +2 de daño.', paintColor:'roja' },
  paint_azul:{ id:'paint_azul', category:'pintura', name:'Pintura Azul', tag:'Pintura', emoji:'🔵', color:'80,140,220', cost:{}, effectText:'Equipable solo sobre Erik. Su Trazo Vivo otorga 1 escudo.', paintColor:'azul' },
  paint_verde:{ id:'paint_verde', category:'pintura', name:'Pintura Verde', tag:'Pintura', emoji:'🟢', color:'90,200,110', cost:{}, effectText:'Equipable solo sobre Erik. Su Trazo Vivo cura 2 HP.', paintColor:'verde' }
};

var COMBAT_CHARS = {
  alaya: { name:'Alaya', element:'redencion', emoji:'🌹', hp:10, abilities: { 
    normal:{ name:'Autolesión', cost:{redencion:1, any:1}, target:'self', kind:'autolesion', selfDamage:1, energy:1 }, 
    elemental:{ name:'Penitencia', cost:{redencion:2}, target:'self', kind:'penitencia', energy:1 }, 
    ultimate:{ name:'El Fin del Comienzo', cost:{redencion:3}, energyCost:3, target:'enemy', kind:'finComienzo' },
    ex:{ name:'EX · Repetición del Fin', kind:'ex', target:'self', oncePerGame:true }
  }},
  oliver: { name:'Óliver', element:'comprension', emoji:'🧠', hp:11, abilities: { normal:{ name:'Corrección', cost:{comprension:1, any:1}, target:'enemy', kind:'damage', damage:1, energy:1 }, elemental:{ name:'Optimización', cost:{comprension:3}, target:'self', kind:'optimizacion', energy:1 }, ultimate:{ name:'Obra Maestra', cost:{comprension:4}, energyCost:2, target:'self', kind:'obraMaestra' } }},
  erik: { name:'Erik', element:'expresion', emoji:'🎨', hp:10, abilities: { normal:{ name:'Trazo Vivo', cost:{expresion:2, any:1}, target:'enemy', kind:'trazoVivo', damage:1, energy:1 }, elemental:{ name:'Interpretación', cost:{expresion:3}, target:'self', kind:'interpretacion', selfDamage:1, energy:1 }, ultimate:{ name:'Lienzo de Sangre', cost:{expresion:3}, energyCost:2, target:'self', kind:'lienzoSangre' } }},
  tenshi: { name:'Tenshi', element:'proteccion', emoji:'⚔️', hp:11, abilities: { normal:{ name:'Intervención', cost:{proteccion:2, any:1}, target:'enemy', kind:'intervencion', damage:2, energy:1 }, elemental:{ name:'Bajo mis Alas', cost:{proteccion:3}, target:'self', kind:'bajoAlas', energy:1 }, ultimate:{ name:'Suficiente', cost:{proteccion:4}, energyCost:3, target:'enemy', kind:'suficiente' } }},
  eloy: { name:'Eloy', element:'comprension', emoji:'📖', hp:12, abilities: { normal:{ name:'Análisis', cost:{comprension:1, any:2}, target:'enemy', kind:'damage', damage:2, energy:0 }, elemental:{ name:'Hipótesis Sólida', cost:{comprension:4}, target:'self', kind:'hipotesisSolida', energy:0 }, ultimate:{ name:'Conclusión', cost:{comprension:3}, energyCost:3, target:'self', kind:'conclusion' } }},
  eevee: { name:'Eevee', element:'proteccion', emoji:'🦊', hp:10, abilities: { normal:{ name:'Advertencia', cost:{proteccion:1, any:2}, target:'enemy', kind:'damage', damage:2, energy:1 }, elemental:{ name:'Defensa Activa', cost:{proteccion:4}, target:'self', kind:'defensaActiva', energy:1 }, ultimate:{ name:'Contraofensiva', cost:{proteccion:3}, energyCost:2, target:'enemy', kind:'contraofensiva' } }},
  ren: { name:'Ren', element:'ilusion', emoji:'🌀', hp:10, abilities: { normal:{ name:'Error', cost:{ilusion:1, any:2}, target:'enemy', kind:'damage', damage:2, energy:1 }, elemental:{ name:'Inconsistencia', cost:{ilusion:5}, target:'enemy', kind:'inconsistencia', energy:1 }, ultimate:{ name:'Destrucción de Lógica', cost:{ilusion:4}, energyCost:3, target:'enemy', kind:'destruccionLogica' } }},
  noah: { name:'Noah', element:'proteccion', emoji:'⚓', hp:12, abilities: { normal:{ name:'Latido', cost:{proteccion:1, any:1}, target:'enemy', kind:'damage', damage:1, energy:1 }, elemental:{ name:'Eco Vital', cost:{proteccion:3}, target:'self', kind:'ecoVital', energy:1 }, ultimate:{ name:'Armonía', cost:{proteccion:3}, energyCost:3, target:'self', kind:'armonia' } }},
  abla: { name:'Abla', element:'redencion', emoji:'🗡️', hp:10, abilities: { normal:{ name:'Rencor', cost:{redencion:1, any:2}, target:'enemy', kind:'damage', damage:2, energy:1 }, elemental:{ name:'Deuda de Sangre', cost:{redencion:4}, target:'enemy', kind:'deudaSangre', energy:1 }, ultimate:{ name:'Retribución Final', cost:{redencion:3}, energyCost:3, target:'enemy', kind:'retribucionFinal' } }},
  manuel: { name:'Manuel', element:'redencion', emoji:'⚡', hp:11, abilities: { normal:{ name:'Ruptura', cost:{redencion:2, any:2}, target:'enemy', kind:'damage', damage:3, energy:1 }, elemental:{ name:'Degradación', cost:{redencion:5}, target:'enemy', kind:'degradacion', energy:1 }, ultimate:{ name:'Decadencia', cost:{redencion:3}, energyCost:2, target:'self', kind:'decadencia' } }},
  jose: { name:'Jose', element:'transformacion', emoji:'🦋', hp:10, abilities: { normal:{ name:'Acelerón', cost:{transformacion:2, any:1}, target:'enemy', kind:'aceleron', energy:1 }, elemental:{ name:'Impulso', cost:{transformacion:3}, target:'self', kind:'impulso', energy:1 }, ultimate:{ name:'Instinto', cost:{transformacion:4}, energyCost:2, target:'enemy', kind:'instinto' } }},
  josemi: { name:'Josemi', element:'expresion', emoji:'🎤', hp:10, abilities: { normal:{ name:'Esbozo', cost:{expresion:1, any:2}, target:'enemy', kind:'damage', damage:2, energy:1 }, elemental:{ name:'Reescritura', cost:{expresion:3}, target:'enemy', kind:'reescritura', energy:1 }, ultimate:{ name:'Canon', cost:{expresion:5}, energyCost:2, target:'self', kind:'canon' } }},
  artemis: { name:'Artemis', element:'aceptacion', emoji:'🦅', hp:11, abilities: { 
    normal: { name:'Disparo divino', cost:{aceptacion:2, any:2}, target:'enemy', kind:'damage', damage:3, energy:1 }, 
    elemental: { name:'Carrerilla', cost:{aceptacion:3}, target:'self', kind:'carrerilla', energy:0 }, 
    ultimate: { name:'Mis dedos palpan el borde de la estratosfera', cost:{aceptacion:6}, energyCost:3, target:'enemy', kind:'estratosfera' },
    ex: { name:'EX · Estratosfera Mejorada', kind:'ex', target:'self' }
  }},
  orath: { name:'Orath', element:'redencion', emoji:'🗿', hp:9, abilities: {
    normal: { name:'Ojo por ojo', cost:{redencion:2, any:1}, target:'enemy', kind:'ojoPorOjo', damage:1, energy:1 },
    elemental: { name:'Minuto de silencio', cost:{redencion:4}, target:'self', kind:'minutoSilencio', energy:1 },
    ultimate: { name:'Dios te ampare, maldito pecador', cost:{redencion:3}, energyCost:2, target:'enemy', kind:'diosTeAmpare' },
    // ✅ EX: Cruz de Sangre. Sus efectos viven en handleDeath, gateados por
    // exSystemEnabled && orathCs.exActive. Aquí solo la declaramos para que
    // aparezca el botón EX del sidebar.
    ex: { name:'EX · Cruz de Sangre', kind:'ex', target:'self' }
  }},
  alter: { name:'Alter', element:'ilusion', emoji:'🎭', hp:12, abilities: {
    normal: { name:'Amenaza a la Ontología', cost:{ilusion:1, any:1}, target:'enemy', kind:'damage', damage:1, energy:0 },
    elemental: { name:'Conversión Psicológica', cost:{ilusion:3}, target:'self', kind:'conversionPsicologica', energy:0 },
    ultimate: { name:'Omnes Deam Salutate', cost:{ilusion:4}, energyCost:3, target:'self', kind:'omnesDeam' },
    ex: { name:'EX · Buen Provecho', kind:'ex', target:'self' }
  }},
  adela: { name:'Adela', element:'transformacion', emoji:'🕊️', hp:10, abilities: {
    normal: { name:'Gracia Pícara', cost:{transformacion:2, any:1}, target:'enemy', kind:'graciaPicara', damage:1, energy:1 },
    elemental: { name:'Flechazo Tentador', cost:{transformacion:3}, target:'enemy', kind:'flechazoTentador', energy:1 },
    ultimate: { name:'Mis Modales en el Suelo', cost:{transformacion:5}, energyCost:2, target:'enemy', kind:'misModales' },
    ex: { name:'EX · Café para llevar', kind:'ex', target:'self' }
  }},
  hunger: { name:'Hunger Incarnate', element:'transformacion', emoji:'👹', hp:5, abilities: {
    normal: { name:'Muere', cost:{transformacion:1, any:1}, target:'enemy', kind:'muereNormal', damage:1, energy:1 },
    elemental: { name:'MUERE', cost:{transformacion:3}, target:'enemy', kind:'muereElemental', energy:1 },
    ultimate: { name:'Mi cordura, en el suelo, hecha pedazos', cost:{transformacion:4}, energyCost:2, target:'enemy', kind:'miCordura' },
    ex: { name:'EX · Café amargo', kind:'ex', target:'self' }
  }},
  internet: { name:'Internet', element:'proteccion', emoji:'🌐', hp:5, abilities: {
    normal: { name:'Orden', cost:{proteccion:1, any:2}, target:'enemy', kind:'damage', damage:2, energy:1 },
    elemental: { name:'Daga de Ola', cost:{proteccion:3}, target:'enemy', kind:'dagaDeOla', damage:3, energy:1 },
    ultimate: { name:'Fase de Limpieza', cost:{proteccion:3}, energyCost:3, target:'enemy', kind:'faseDeLimpieza' },
    ex: { name:'EX · Último Recurso', kind:'ex', target:'self' }
  }},
  neon: { name:'Neón', element:'ilusion', emoji:'🎆', hp:6, abilities: {
    normal: { name:'Scratch', cost:{ilusion:3}, target:'enemy', kind:'scratch', damage:1, energy:1 },
    elemental: { name:'Remix', cost:{ilusion:4}, target:'self', kind:'remix', energy:1 },
    ultimate: { name:'Killer Tunes', cost:{ilusion:4}, energyCost:3, target:'self', kind:'killerTunes' },
    ex: { name:'EX · Sobrecarga', kind:'ex', target:'self' }
  }},
};

function normalize(s){ return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function sumCost(cost){ var t = 0; for (var k in cost) if (Object.prototype.hasOwnProperty.call(cost,k)) t += cost[k]; return t; }
function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function shuffleArray(arr){ var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function setSize(o){ return Object.keys(o).length; }
function toggleFilterKey(o, k){ if (o[k]) { delete o[k]; return false; } o[k] = true; return true; }

/* ═══ HELPERS ═══ */
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
  // PvP local y Sandbox dos-usuarios → el humano controla a quien tenga el turno
  if (combatState.pvp) return true;
  // Solo vs bot → el humano solo controla cuando es turno del "player"
  return combatState.turn === 'player';
}
function isOnline(){ return false; }
function isOnlineHost(){ return false; }
function isOnlineGuest(){ return false; }
function myStateKey(){ return 'player'; }
function sideKeyForUI(uiWho){ return uiWho; }
function getMySide(){ if (!combatState) return null; return combatState[combatState.turn] || combatState.player; }
function isMyTurn(){ if (!combatState) return false; return combatState.turn === 'player'; }

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
function countCruzMadera(side) {
  if (!side || !side.structures) return 0;
  return side.structures.filter(function(s){ return s.kind === 'cruzMadera'; }).length;
}
function spawnCruzMadera(whoKey, allyId, source) {
  var side = combatState[whoKey];
  if (!side.structures) side.structures = [];
  if (!side.cruzMaderaByAlly) side.cruzMaderaByAlly = {};
  var tag = source || allyId;
  if (side.cruzMaderaByAlly[tag]) return false;
  side.structures.push({ kind:'cruzMadera', duration:999, ownerId:allyId, source:tag });
  side.cruzMaderaByAlly[tag] = true;
  logCombat('✝️ Se genera una Cruz de Madera (' + (source === 'shield' ? 'escudo de Orath' : allyId) + ')');
  return true;
}
function destroyCruzMadera(side, whoKey, st, opts) {
  opts = opts || {};
  var idx = side.structures.indexOf(st);
  if (idx < 0) return;
  side.structures.splice(idx, 1);
  if (side.cruzMaderaByAlly) {
    if (st.ownerId && side.cruzMaderaByAlly[st.ownerId]) delete side.cruzMaderaByAlly[st.ownerId];
    if (st.source && side.cruzMaderaByAlly[st.source]) delete side.cruzMaderaByAlly[st.source];
  }
  logCombat('✝️ Cruz de Madera destruida');
  if (!opts.silent) {
    var ea = getEnemyActiveOf(whoKey);
    if (ea.active && !ea.active.dead) {
      dealDamageToChar(ea.active, 1, { targetSide:ea.side, targetSideKey:ea.key, targetIdx:ea.side.activeIndex });
    }
  }
}
function destroyAllCruzMadera(whoKey, opts) {
  var side = combatState[whoKey];
  if (!side.structures) return 0;
  var cruces = side.structures.filter(function(s){ return s.kind === 'cruzMadera'; });
  var count = cruces.length;
  cruces.forEach(function(st){ destroyCruzMadera(side, whoKey, st, opts); });
  return count;
}
function spawnCruzSangre(whoKey) {
  var side = combatState[whoKey];
  if (!side.structures) side.structures = [];
  if (side.cruzSangreActive) return;
  side.structures.push({ kind:'cruzSangre', duration:999 });
  side.cruzSangreActive = true;
  logCombat('✝️ Se genera la Cruz de Sangre');
}
function destroyCruzSangre(whoKey) {
  var side = combatState[whoKey];
  if (!side.structures) return;
  var idx = side.structures.findIndex(function(s){ return s.kind === 'cruzSangre'; });
  if (idx < 0) return;
  side.structures.splice(idx, 1);
  side.cruzSangreActive = false;
  logCombat('✝️ Cruz de Sangre destruida');
  if (side.lastDeadAlly) {
    var rev = side.characters.find(function(c){ return c.id === side.lastDeadAlly; });
    if (rev && rev.dead) {
      rev.dead = false;
      rev.hp = 1;
      if (!rev.shields) rev.shields = [];
      rev.shields.push({ source:'cruzSangre', hp:2, maxHp:2 });
      if (rev.id === 'hunger') {
        rev.hp = rev.maxHp;
        logCombat('👹 Hunger revive y se cura al máximo (' + rev.hp + '/' + rev.maxHp + ')');
      }
      if (side.activeIndex === -1 || side.characters[side.activeIndex].dead) side.activeIndex = side.characters.indexOf(rev);
      logCombat('✝️ Cruz de Sangre revive a ' + rev.character.name + ' con 1 HP y 2 escudo');
      // ✅ Adela: si es revivida y tenía marca, se transforma en Hunger
      if (rev.id === 'adela' && hasAnyMark(rev)) {
        transformAdelaToHunger(rev);
      }
    }
  }
}
function csHasState(cs, k){ return !!(cs && cs.states && cs.states[k]); }
function csSetState(cs, k, v){ if (!cs.states) cs.states = {}; cs.states[k] = v; }
function csAddMark(cs, el){ if (!cs.marks) cs.marks = {}; if (cs.marks[el]) return false; cs.marks[el] = true; return true; }
function csRemoveMark(cs, el){ if (cs && cs.marks) delete cs.marks[el]; }
function csHasMark(cs, el){ return !!(cs && cs.marks && cs.marks[el]); }
function csAllMarks(cs){ return cs && cs.marks ? Object.keys(cs.marks) : []; }
// ✅ Killer Tunes: dispara 1 daño al enemigo activo cuando el equipo de Neón
// hace un cambio de personaje durante el resto de la ronda.
function triggerKillerTunesDamage(sideKey) {
  if (!combatState) return;
  var side = combatState[sideKey];
  var side = combatState[sideKey];
  console.log('[KillerTunes] sideKey=', sideKey,
              '| neonUltChangeDamage=', side && side.neonUltChangeDamage,
              '| activeIndex=', side && side.activeIndex);
  if (!side || !side.neonUltChangeDamage) return;
  var ek = sideKey === 'player' ? 'bot' : 'player';
  var es = combatState[ek];
  var ea = es.characters[es.activeIndex];
  if (ea && !ea.dead) {
    dealDamageToChar(ea, 1, {
      targetSide: es,
      targetSideKey: ek,
      targetIdx: es.activeIndex
    });
    logCombat('🎵 Killer Tunes: cambio de personaje → 1 daño a ' + ea.character.name);
  }
}

function triggerMarkOrResonance(targetCs, newEl, who, targetSideKey, targetIdx) {
  var existing = csAllMarks(targetCs);
  if (existing.length > 0) {
    var oldEl = existing[0];
    csRemoveMark(targetCs, oldEl); csRemoveMark(targetCs, newEl);
    logCombat('✨ Resonancia: ' + ELEMENT_EMOJI[oldEl] + ' + ' + ELEMENT_EMOJI[newEl]);
    applyResonanceEffect(oldEl, newEl, who, targetSideKey);
  } else {
    csAddMark(targetCs, newEl);
    logCombat('🏷️ ' + targetCs.character.name + ' marcado con ' + ELEMENT_EMOJI[newEl]);
  }
}
function applyResonanceEffect(elA, elB, who, targetSideKey) {
  var side = combatState[who];
  var active = side.characters[side.activeIndex];
  var found = null;
  for (var i = 0; i < RESONANCES.length; i++) { var r = RESONANCES[i]; if ((r.a === elA && r.b === elB) || (r.a === elB && r.b === elA)) { found = r; break; } }
  if (!found) return;
  switch (found.name) {
    case 'Fortaleza': if (active && !active.dead) addOrRefreshShield(active, 'resonancia', 2); break;
    case 'Revelación': side.characters.forEach(function(c){ if (!c.dead && c.energy === 0) c.energy = Math.min(c.maxEnergy, c.energy + 1); }); break;
    case 'Obra Maestra': for (var d = 0; d < 2; d++) drawFromDeck(who); break;
    case 'Expiación': if (active) active.cardNextAttackBonus = (active.cardNextAttackBonus || 0) + 1; break;
    case 'Serenidad': { var alive = side.characters.filter(function(c){ return !c.dead; }); if (alive.length) { alive.sort(function(a,b){ return a.hp - b.hp; }); alive[0].hp = Math.min(alive[0].maxHp, alive[0].hp + 2); } break; }
    case 'Preparación': side.characters.forEach(function(c){ if (!c.dead && totalShield(c) > 0) c.energy = Math.min(c.maxEnergy, c.energy + 1); }); break;
    case 'Paradoja': side.dice = side.dice.map(function(d){ return { type: Math.random() < 0.125 ? 'omni' : CONSONANCE_ORDER[Math.floor(Math.random()*7)], id: d.id, justAdded: true }; }); break;
    default: logCombat('🔮 Resonancia aplicada: ' + found.name); break;
  }
}
function handleDeath(who, index) {
  var side = combatState[who], t = side.characters[index];
  if (!t || t.dead) return 'ok';
  t.dead = true;
  logCombat('💀 ' + t.character.name + ' ha caído');

  // ✅ Buscar a Orath en el MISMO side (el del personaje que muere).
  // Puede ser el propio Orath o un aliado suyo.
  var orathCs = side.characters.find(function(c){ return c.id === 'orath'; });

  // La Cruz de Sangre solo se genera si:
  //   - El sistema EX global está ON.
  //   - Orath existe en ese equipo.
  //   - Orath activó su EX (exActive === true) ANTES de morir.
  var cruzSangreAllowed = !!(orathCs && orathCs.exActive);

  // 1) Si muere Orath → generar Cruz de Sangre (solo si su EX estaba activa)
  if (t.id === 'orath') {
    if (cruzSangreAllowed) {
      spawnCruzSangre(who);
    } else {
      logCombat('✝️ Orath cae sin su EX activa: no se genera la Cruz de Sangre');
    }
  }

  // 2) Si muere un aliado distinto de Orath → registrar como último caído
  //    y destruir la Cruz de Sangre si existe.
  if (t.id !== 'orath') {
    side.lastDeadAlly = t.id;
    if (side.cruzSangreActive) {
      destroyCruzSangre(who);
    }
  }

  if (side.activeIndex === index) {
    var nx = getNextAliveIndex(side, index);
    if (nx === -1) return 'all_dead';
    side.activeIndex = nx;
    logCombat('➡️ ' + side.characters[nx].character.name + ' pasa a activo');
  }
  return 'ok';
}
function dealDamageToChar(targetCs, rawDamage, opts) {
  opts = opts || {};
  if (targetCs.dead) return 0;
  // ── EX hook entrante ──
  rawDamage = exHookModifyIncomingDamage(targetCs, rawDamage, opts.attackerCs);
  var side = opts.targetSide, sideKey = opts.targetSideKey, idx = opts.targetIdx;
  var flat = getDamageReduction(targetCs, side);
  if (csHasState(targetCs, 'vuelo')) flat += 2;
  if (flat > 0) rawDamage = Math.max(0, rawDamage - flat);
  if (csHasState(targetCs, 'vuelo') && rawDamage >= 0) logCombat('🦅 Vuelo: -2 daño');
  var vulnRed = 0;
  if (csHasState(targetCs, 'vulnerable') && rawDamage > 0) {
    vulnRed = 1; csSetState(targetCs, 'vulnerable', false);
    if (opts.attackerCs) csSetState(opts.attackerCs, 'amenaza', true);
  }
  rawDamage = Math.max(0, rawDamage - vulnRed);
  var defensaReduction = 0;
  if (csHasState(targetCs, 'defensaActiva') && rawDamage > 0 && opts.attackerCs) {
    defensaReduction = 1;
    rawDamage = Math.max(0, rawDamage - 1);
    csSetState(targetCs, 'defensaActiva', false);
    logCombat('💠 Defensa Activa: -1 daño');
  }
  var res = absorbWithShields(targetCs, rawDamage, !!opts.piercing);
  if (res.absorbed > 0) {
    logCombat('🛡️ Escudo absorbe ' + res.absorbed + (totalShield(targetCs) > 0 ? ' (queda ' + totalShield(targetCs) + ')' : ' ¡roto!'));
    // Escudo de Orath golpeado → Cruz de Madera
    if (opts.attackerCs && targetCs.id === 'orath' && csHasState(targetCs, 'minutoSilencioShield')) {
      var okCruz = spawnCruzMadera(sideKey, 'orath_shield', 'shield');
      if (okCruz) logCombat('✝️ El escudo de Orath es golpeado: Cruz de Madera propia');
    }
    if (csHasState(targetCs, 'hipotesisShieldActive') && opts.attackerCs && !opts.attackerCs.dead) {
      var attKey = (combatState.player.characters.indexOf(opts.attackerCs) >= 0) ? 'player' : 'bot';
      var attSide = combatState[attKey];
      var attIdx = attSide.characters.indexOf(opts.attackerCs);
      triggerMarkOrResonance(opts.attackerCs, 'comprension', sideKey, attKey, attIdx);
      logCombat('🛡️ Hipótesis Sólida: ' + opts.attackerCs.character.name + ' marcado con comprensión');
    }
  }
  if (res.overflow > 0) {
    // ✅ Alter: cada punto de invulnerabilidad reduce el daño verdadero en 1.
    // NO se consume: solo reduce. Se pierde 1 al final de cada ronda.
    if (targetCs.id === 'alter' && targetCs.states && targetCs.states.invulnerabilidad > 0) {
      var inv = targetCs.states.invulnerabilidad;
      var reduced = Math.min(inv, res.overflow);
      res.overflow -= reduced;
      logCombat('🛡️ Invulnerabilidad de Alter: -' + reduced + ' daño (invulnerabilidad sigue en ' + inv + ')');
      if (res.overflow <= 0) {
        logCombat('💥 Daño verdadero anulado por invulnerabilidad');
        return 0;
      }
    }
    targetCs.hp = Math.max(0, targetCs.hp - res.overflow);
    logCombat('💥 Daño verdadero: ' + res.overflow + ' · HP: ' + targetCs.hp + '/' + targetCs.maxHp);
    // ✅ Internet: si baja a 2 HP exactos (o por debajo por primera vez), +1 energía
    if (targetCs.id === 'internet' && targetCs.hp > 0 && targetCs.hp <= 2 && !targetCs.states.internetEnergyGranted) {
      targetCs.energy = Math.min(targetCs.maxEnergy, targetCs.energy + 1);
      targetCs.states.internetEnergyGranted = true;
      logCombat('🌐 Orgullo de la Creadora: Internet gana 1 energía al bajar a ' + targetCs.hp + ' HP');
    }
    triggerVibrate(sideKey, idx); playSound(opts.piercing ? 'pierce' : 'impact');
    if (csHasState(targetCs, 'vuelo')) {
      targetCs.hp = Math.max(0, targetCs.hp - 3);
      targetCs.energy = Math.min(targetCs.maxEnergy, targetCs.energy + 1);
      csSetState(targetCs, 'vuelo', false);
      logCombat('🦅 Vuelo perdido: +3 daño, +1 energía · HP: ' + targetCs.hp + '/' + targetCs.maxHp);
    }
    if (targetCs.id === 'alaya' && csHasState(targetCs, 'castigada') && targetCs.hp > 0) {
      targetCs.states.condena = (targetCs.states.condena || 0) + 1;
      logCombat('💀 Alaya gana 1 condena · Total: ' + targetCs.states.condena);
    }
    if (targetCs.id === 'eevee' && !targetCs.dead && targetCs.hp > 0) {
      csSetState(targetCs, 'furia', true);
      if (opts.attackerCs) csSetState(targetCs, 'furiaTarget', opts.attackerCs.id);
      logCombat('🔥 Eevee entra en Furia contra ' + (opts.attackerCs ? opts.attackerCs.character.name : 'el atacante'));
    }
    // Pasiva de Orath: si un aliado recibe daño verdadero → Cruz de Madera
    if (res.overflow > 0 && targetCs.id !== 'orath' && sideKey) {
      var orathAlly = combatState[sideKey].characters.find(function(c){ return c.id === 'orath' && !c.dead; });
      if (orathAlly) {
        spawnCruzMadera(sideKey, targetCs.id, targetCs.id);
      }
    }
    if (targetCs.hp <= 0) {
      // ── EX hook evitar muerte ──
      if (!exHookPreventDeath(targetCs, sideKey, idx)) {
        handleDeath(sideKey, idx);
      }
    }
  }
  if (defensaReduction > 0 && opts.attackerCs && !opts.attackerCs.dead && combatState) {
    var attCs = opts.attackerCs;
    var attKey2 = (combatState.player.characters.indexOf(attCs) >= 0) ? 'player' : 'bot';
    var attSide2 = combatState[attKey2];
    setTimeout(function() {
      if (!combatState || !attCs || attCs.dead) return;
      var attIdx2 = attSide2.characters.indexOf(attCs);
      dealDamageToChar(attCs, 2, { attackerCs: targetCs, targetSide: attSide2, targetSideKey: attKey2, targetIdx: attIdx2 });
      logCombat('⚡ Eevee contraataca a ' + attCs.character.name);
    }, 120);
  }
  return res.overflow;
}
function healChar(cs, amount) {
  if (!cs || cs.dead) return 0;
  // ── EX hook curación ──
  amount = exHookModifyHealing(cs, amount);
  if (cs.id === 'alaya' && csHasState(cs, 'castigada')) {
    logCombat('🩸 Alaya castigada: curación → daño verdadero');
    var sideKey = (combatState.player.characters.indexOf(cs) >= 0) ? 'player' : 'bot';
    var side = combatState[sideKey];
    var idx = side.characters.indexOf(cs);
    dealDamageToChar(cs, amount, { piercing:true, targetSide:side, targetSideKey:sideKey, targetIdx:idx });
    return -amount;
  }
  var before = cs.hp; cs.hp = Math.min(cs.maxHp, cs.hp + amount); var eff = cs.hp - before;
  if (eff > 0) logCombat('💚 ' + cs.character.name + ' +' + eff + ' HP');
  if (csHasState(cs, 'sintonia') && combatState) {
    var side2 = (combatState.player.characters.indexOf(cs) >= 0) ? combatState.player : combatState.bot;
    var sints = side2.characters.filter(function(c){ return c !== cs && !c.dead && csHasState(c, 'sintonia'); });
    if (sints.length) {
      sints.forEach(function(ally){ ally.hp = Math.min(ally.maxHp, ally.hp + eff); });
      logCombat('🎵 Sintonía: ' + sints.length + ' aliado(s) curan ' + eff);
      csSetState(cs, 'sintonia', false);
      sints.forEach(function(a){ csSetState(a, 'sintonia', false); });
    }
  }
  return eff;
}
function applyErikPassive(cs) {
  if (!cs || cs.id !== 'erik' || !combatState) return 0;
  var side = combatState.player.characters.indexOf(cs) >= 0 ? combatState.player : combatState.bot;
  var alive = side.characters.filter(function(c){ return !c.dead; }).length;
  if (alive === 2) return 1;
  if (alive === 1) return 2;
  return 0;
}
/* ═══ ADELA / HUNGER ═══ */
function hasAnyMark(cs){ return cs && cs.marks && Object.keys(cs.marks).length > 0; }

// Adela: +1 a TODOS los efectos de sus habilidades si tiene marca.
// El +1 se aplica al valor "numérico" de cada efecto (daño, curación, penetrante, etc.)
function adelaEffectBonus(cs){
  if (!cs || cs.id !== 'adela') return 0;
  return hasAnyMark(cs) ? 1 : 0;
}
// Adela: +1 dado de transformación al coste de sus habilidades si tiene marca.
function adelaCostBonus(cs){
  if (!cs || cs.id !== 'adela') return 0;
  return hasAnyMark(cs) ? 1 : 0;
}
// Hunger: daño base x2 y coste x2 si tiene marca.
function hungerMarkMultiplier(cs){
  if (!cs || cs.id !== 'hunger') return 1;
  return hasAnyMark(cs) ? 2 : 1;
}
// Cambio a Hunger: el aliado saliente recibe 1 de daño, Hunger se cura 1.
function hungerOnEnter(sideKey, newHungerCs, oldActiveCs){
  if (!newHungerCs || newHungerCs.id !== 'hunger') return;
  if (oldActiveCs && !oldActiveCs.dead) {
    var oldSide = sideOfChar(oldActiveCs);
    if (oldSide) {
      dealDamageToChar(oldActiveCs, 1, { targetSide:oldSide.side, targetSideKey:oldSide.key, targetIdx:oldSide.side.characters.indexOf(oldActiveCs) });
    }
  }
  if (!newHungerCs.dead) healChar(newHungerCs, 1);
}
function transformAdelaToHunger(cs){
  if (!cs || cs.id !== 'adela') return;
  var hungerChar = COMBAT_CHARS.hunger;
  cs.id = 'hunger';
  cs.character = hungerChar;
  cs.hp = hungerChar.hp;
  cs.maxHp = hungerChar.hp;
  cs.energy = 0;
  cs.maxEnergy = getMaxEnergyFor(hungerChar);
  cs.marks = {};
  cs.states = cs.states || {};
  cs.states.invulnerabilidad = 0;
  cs.noResurrectLimit = true;
  logCombat('👹 Adela se transforma en Hunger Incarnate');
}
/* ═══ HOOKS EX (pasivas permanentes) ═══
 * Una EX solo aplica si:
 *   1. El sistema EX global está ON (exSystemEnabled).
 *   2. El personaje concreto ha activado su pasiva (cs.exActive === true).
 * Mientras cs.exActive sea false, la EX de ese personaje no hace nada,
 * aunque el sistema global esté ON.
 */

function exHookModifyIncomingDamage(targetCs, damage, attackerCs) {
  if (!targetCs || !targetCs.exActive) return damage;
  // Ejemplo futuro (Alaya EX): if (targetCs.id === 'alaya') { ... }
  return damage;
}

function exHookModifyHealing(targetCs, amount) {
  if (!targetCs || !targetCs.exActive) return amount;
  return amount;
}

function exHookPreventDeath(cs, sideKey, idx) {
  if (!cs || !cs.exActive) return false;
  return false;
}

function exHookRoundStart(cs, sideKey) {
  if (!cs || !cs.exActive) return;
  // switch (cs.id) { case 'alaya': ... }
}

function exHookModifyOutgoingDamage(attackerCs, damage, targetCs) {
  if (!attackerCs || !attackerCs.exActive) return damage;
  return damage;
}
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
  // ✅ Excluir a Hunger (solo aparece por transformación de Adela)
  var pool = Object.keys(COMBAT_CHARS).filter(function(id){ return id !== 'hunger'; });
  for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  return pool.slice(0, 3);
}
function getMaxEnergyFor(char){ if (char.abilities.ultimate && char.abilities.ultimate.energyCost) return char.abilities.ultimate.energyCost; return 3; }
function buildSideState(ids, exCharId) {
  return {
    characters: ids.map(function(id) {
      var ch = COMBAT_CHARS[id];
      // ✅ EX Neón: vida máxima 8 en vez de 6
      var baseHp = ch.hp;
      var isNeonEx = (id === 'neon' && id === exCharId);
      if (isNeonEx) {
        baseHp = 8;
        console.log('[buildSideState] ✅ Neón con EX → HP máx =', baseHp);
      }
      return {
        id: id,
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

var audioCtx = null;
function initAudio(){ if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; } } if (audioCtx && audioCtx.state === 'suspended') { try { audioCtx.resume(); } catch (e) {} } }
function playSound(name) {
  if (!audioCtx) return;
  try {
    var t = audioCtx.currentTime;
    function beep(f, d, type, v, delay){ delay = delay || 0; var o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = type||'sine'; o.frequency.value = f; o.connect(g); g.connect(audioCtx.destination); g.gain.setValueAtTime(v||0.15, t+delay); g.gain.exponentialRampToValueAtTime(0.001, t+delay+d); o.start(t+delay); o.stop(t+delay+d); }
    function sweep(f1, f2, d, type, v, delay){ delay = delay || 0; var o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = type||'sine'; o.frequency.setValueAtTime(f1, t+delay); o.frequency.exponentialRampToValueAtTime(f2, t+delay+d); o.connect(g); g.connect(audioCtx.destination); g.gain.setValueAtTime(v||0.15, t+delay); g.gain.exponentialRampToValueAtTime(0.001, t+delay+d); o.start(t+delay); o.stop(t+delay+d); }
    switch (name) {
      case 'select': beep(1100, 0.06, 'sine', 0.08); break;
      case 'deselect': sweep(1100, 700, 0.06, 'sine', 0.06); break;
      case 'roll': sweep(200, 800, 0.15, 'sawtooth', 0.05); break;
      case 'diceReveal': beep(880, 0.06, 'triangle', 0.06); beep(1174, 0.08, 'triangle', 0.06, 0.04); beep(1568, 0.1, 'sine', 0.05, 0.08); break;
      case 'impact': beep(90, 0.15, 'square', 0.15); beep(60, 0.25, 'sine', 0.12, 0.03); break;
      case 'pierce': sweep(1400, 200, 0.2, 'sawtooth', 0.12); break;
      case 'shield': beep(300, 0.18, 'triangle', 0.12); break;
      case 'heal': beep(523, 0.1, 'sine', 0.1); beep(659, 0.1, 'sine', 0.1, 0.06); beep(784, 0.18, 'sine', 0.1, 0.12); break;
      case 'ult': beep(392, 0.15, 'square', 0.12); beep(523, 0.15, 'square', 0.12, 0.1); beep(659, 0.3, 'square', 0.14, 0.2); beep(784, 0.35, 'sawtooth', 0.1, 0.35); break;
      case 'change': sweep(800, 200, 0.22, 'sine', 0.1); break;
      case 'endRound': beep(440, 0.3, 'sine', 0.1); beep(330, 0.5, 'sine', 0.08, 0.15); break;
      case 'victory': beep(523, 0.15, 'square', 0.12); beep(659, 0.15, 'square', 0.12, 0.1); beep(784, 0.15, 'square', 0.12, 0.2); beep(1047, 0.55, 'square', 0.12, 0.35); break;
      case 'defeat': beep(392, 0.2, 'sawtooth', 0.1); beep(330, 0.2, 'sawtooth', 0.1, 0.15); beep(262, 0.55, 'sawtooth', 0.1, 0.3); break;
      case 'error': beep(140, 0.1, 'square', 0.1); break;
      case 'banner': beep(660, 0.08, 'sine', 0.06); beep(880, 0.12, 'sine', 0.07, 0.08); break;
      case 'omni': beep(660, 0.12, 'sine', 0.1); beep(880, 0.12, 'sine', 0.1, 0.08); break;
      case 'confirm': beep(523, 0.1, 'sine', 0.1); beep(659, 0.15, 'sine', 0.1, 0.08); break;
      case 'warning': beep(220, 0.1, 'square', 0.12); beep(180, 0.15, 'square', 0.12, 0.12); break;
      case 'card': beep(660, 0.06, 'sine', 0.1); beep(880, 0.1, 'sine', 0.1, 0.05); break;
      case 'draw': beep(440, 0.08, 'triangle', 0.08); beep(660, 0.1, 'triangle', 0.08, 0.08); break;
    }
  } catch (e) {}
}

var bannerToken = 0;
function showBanner(text, duration){ var b = document.getElementById('combatBanner'), t = document.getElementById('combatBannerText'); if (!b || !t) return; bannerToken++; var tok = bannerToken; t.textContent = text; b.classList.add('show'); playSound('banner'); setTimeout(function(){ if (tok === bannerToken) b.classList.remove('show'); }, duration || 1400); }
function hideBanner(){ var b = document.getElementById('combatBanner'); if (b) b.classList.remove('show'); }
function showDiversoToast(text){ var toast = document.getElementById('diversoToast'); if (!toast) return; if (text) toast.textContent = text; toast.classList.add('show'); setTimeout(function(){ toast.classList.remove('show'); }, 1800); }
function triggerVibrate(who, idx){ setTimeout(function(){ var card = document.querySelector('.combat-char-card[data-team="' + who + '"][data-index="' + idx + '"]'); if (card) { card.classList.add('vibrate', 'hit-flash'); setTimeout(function(){ card.classList.remove('vibrate', 'hit-flash'); }, 450); } }, 30); }

function renderPhilosophies() {
  var grid = document.getElementById('philosophyGrid'); if (!grid) return;
  grid.innerHTML = CONSONANCE_ORDER.map(function(key){ var p = PHILOSOPHIES[key]; return '<div class="philosophy-card reveal" style="--el: ' + ELEMENT_COLORS[key] + ';"><span class="philosophy-emoji">' + p.emoji + '</span><div class="philosophy-name">' + p.name + '</div><div class="philosophy-tagline">' + p.tagline + '</div><p class="philosophy-desc">' + p.desc + '</p><p class="philosophy-quote">"' + p.quote + '"</p></div>'; }).join('');
}
function renderConsonancias() {
  var grid = document.getElementById('consonanceGrid'); if (!grid) return;
  var cards = ['<div class="consonance-card reveal" style="--el: 240, 200, 96;"><div class="consonance-header"><span class="consonance-emoji">🌈</span><div><div class="consonance-name">Diverso</div><div class="consonance-sub">Composición mixta</div></div></div><div class="consonance-level"><div class="consonance-level-label">✨ Condición</div><div class="consonance-level-text">Ningún personaje del equipo comparte tipo.</div></div><div class="consonance-level"><div class="consonance-level-label">▶ Efecto</div><div class="consonance-level-text">Al comienzo de cada ronda, obtienes 2 omnidados.</div></div></div>'];
  CONSONANCE_ORDER.forEach(function(key){ var p = PHILOSOPHIES[key]; cards.push('<div class="consonance-card reveal" style="--el: ' + ELEMENT_COLORS[key] + ';"><div class="consonance-header"><span class="consonance-emoji">' + p.emoji + '</span><div><div class="consonance-name">' + p.name + '</div><div class="consonance-sub">' + p.tagline + '</div></div></div><div class="consonance-level"><div class="consonance-level-label">👥 2 personajes</div><div class="consonance-level-text">' + p.consonance2 + '</div></div><div class="consonance-level"><div class="consonance-level-label">👥 3 personajes</div><div class="consonance-level-text">' + p.consonance3 + '</div></div></div>'); });
  grid.innerHTML = cards.join('');
}
var CHAR_SORT_MODES = ['alpha', 'element', 'category'];
var CHAR_SORT_LABELS = {
  alpha:    '🔤 A → Z',
  element:  '🌈 Tipo',
  category: '📁 Categoría'
};
var CHAR_SORT_TITLES = {
  alpha:    'Orden actual: Alfabético (A → Z). Clic para cambiar.',
  element:  'Orden actual: por Tipo de Respuesta. Clic para cambiar.',
  category: 'Orden actual: por Categoría. Clic para cambiar.'
};
var CHAR_ELEMENT_ORDER = ['proteccion','comprension','expresion','transformacion','aceptacion','redencion','ilusion'];
var CHAR_CATEGORY_ORDER = ['Usuarios', 'Personajes', 'Eriks'];
var charSortMode = 'alpha';
var charFilterSet = {}, resFilterSet = {}, deckCatFilterSet = {}, deckTagFilterSet = {};
var CHARACTER_CATEGORIES = ['Eriks', 'Personajes', 'Usuarios', 'BTC'];
var CHARACTER_CATEGORY_COLORS = { 'Eriks':'255,120,60', 'Personajes':'130,220,140', 'Usuarios':'140,180,230', 'BTC':'92,179,255' };
var charCatFilterSet = {};
function updateCharSortBtn() {
  var btn = document.getElementById('charSortBtn');
  if (!btn) return;
  btn.textContent = CHAR_SORT_LABELS[charSortMode] || 'Ordenar';
  btn.title = CHAR_SORT_TITLES[charSortMode] || '';
}

function sortCharCards() {
  var grid = document.getElementById('cardsGrid');
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.char-card'));
  if (!cards.length) return;

  // ✅ Prioridad 1: personajes en el equipo, en el orden en que están en `team`.
  // Prioridad 2: el criterio actual (alpha / element / category).
  // Los que no están en el equipo van después, ordenados por el criterio actual.
  function teamRank(id) {
    var i = (typeof team !== 'undefined' && team) ? team.indexOf(id) : -1;
    return i === -1 ? 999 : i;
  }

  cards.sort(function(a, b) {
    var idA = a.dataset.character, idB = b.dataset.character;
    var rA = teamRank(idA), rB = teamRank(idB);
    // 1) Los del equipo siempre arriba, en su orden de selección.
    if (rA !== rB) return rA - rB;

    var chA = CHARACTERS[idA];
    var chB = CHARACTERS[idB];
    if (!chA || !chB) return 0;
    var nameA = normalize(chA.name);
    var nameB = normalize(chB.name);

    if (charSortMode === 'alpha') {
      return nameA.localeCompare(nameB);
    }
    if (charSortMode === 'element') {
      var idxA = CHAR_ELEMENT_ORDER.indexOf(chA.element);
      var idxB = CHAR_ELEMENT_ORDER.indexOf(chB.element);
      if (idxA === -1) idxA = 99;
      if (idxB === -1) idxB = 99;
      if (idxA !== idxB) return idxA - idxB;
      return nameA.localeCompare(nameB);
    }
    if (charSortMode === 'category') {
      var catA = CHAR_CATEGORY_ORDER.indexOf(chA.category || '');
      var catB = CHAR_CATEGORY_ORDER.indexOf(chB.category || '');
      if (catA === -1) catA = 99;
      if (catB === -1) catB = 99;
      if (catA !== catB) return catA - catB;
      return nameA.localeCompare(nameB);
    }
    return 0;
  });

  cards.forEach(function(card) { grid.appendChild(card); });
}

function setupCharSort() {
  var controls = document.querySelector('.collection-controls');
  if (!controls) return;

  var btn = document.getElementById('charSortBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'charSortBtn';
    btn.className = 'char-sort-btn';
    btn.setAttribute('aria-label', 'Cambiar orden de los personajes');
    controls.insertBefore(btn, controls.firstChild);

    btn.addEventListener('click', function() {
      var i = CHAR_SORT_MODES.indexOf(charSortMode);
      charSortMode = CHAR_SORT_MODES[(i + 1) % CHAR_SORT_MODES.length];
      updateCharSortBtn();
      sortCharCards();
      playSound('select');
    });
  }

  updateCharSortBtn();
  sortCharCards();
}
function renderCharFilter() {
  var bar = document.getElementById('charFilterBar'); if (!bar) return;
  var noneEl = setSize(charFilterSet) === 0;
  var noneCat = setSize(charCatFilterSet) === 0;

  var elBtns = ['<button class="filter-btn' + (noneEl ? ' active' : '') + '" data-filter="all" style="--fc: 240, 200, 96;">Todas</button>'];
  CONSONANCE_ORDER.forEach(function(key){
    var p = PHILOSOPHIES[key];
    elBtns.push('<button class="filter-btn' + (charFilterSet[key] ? ' active' : '') + '" data-filter="' + key + '" style="--fc: ' + ELEMENT_COLORS[key] + ';">' + p.emoji + ' ' + p.name + '</button>');
  });

  var catBtns = ['<button class="cat-filter-btn' + (noneCat ? ' active' : '') + '" data-catfilter="all" style="--fc: 240, 200, 96;">📚 Todas</button>'];
  CHARACTER_CATEGORIES.forEach(function(cat){
    var col = CHARACTER_CATEGORY_COLORS[cat] || '180,180,200';
    catBtns.push('<button class="cat-filter-btn' + (charCatFilterSet[cat] ? ' active' : '') + '" data-catfilter="' + cat + '" style="--fc: ' + col + ';">' + cat + '</button>');
  });

  bar.innerHTML = '<div class="filter-row">' + elBtns.join('') + '</div><div class="filter-row">' + catBtns.join('') + '</div>';

  bar.querySelectorAll('[data-filter]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var f = this.dataset.filter;
      if (f === 'all') charFilterSet = {}; else toggleFilterKey(charFilterSet, f);
      renderCharFilter(); applyFilters();
    });
  });
  bar.querySelectorAll('[data-catfilter]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var v = btn.dataset.catfilter;
      if (v === 'all') charCatFilterSet = {}; else toggleFilterKey(charCatFilterSet, v);
      renderCharFilter(); applyFilters();
    });
  });
}
function applyFilters() {
  var searchEl = document.getElementById('charSearch'); var query = searchEl ? normalize(searchEl.value.trim()) : '';
  var noneEl = setSize(charFilterSet) === 0;
  var noneCat = setSize(charCatFilterSet) === 0;
  var cards = document.querySelectorAll('.char-card'); var visible = 0;
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var cd = CHARACTERS[card.dataset.character];
    var nm = cd ? cd.name : '';
    var cat = cd ? (cd.category || '') : '';
    var elMatch = noneEl || !!charFilterSet[card.dataset.el];
    var catMatch = noneCat || !!charCatFilterSet[cat];
    if (elMatch && catMatch && (!query || normalize(nm).indexOf(query) !== -1)) {
      card.style.display = '';
      if (!card.classList.contains('visible')) card.classList.add('visible');
      visible++;
    } else card.style.display = 'none';
  }
  var counter = document.getElementById('charCounter');
  if (counter) counter.innerHTML = '<strong>' + visible + '</strong> de ' + cards.length;
}
function renderResonances() {
  var grid = document.getElementById('resonanceGrid'); if (!grid) return;
  grid.innerHTML = RESONANCES.map(function(r){ return '<div class="resonance-card" data-a="' + r.a + '" data-b="' + r.b + '" style="--ca: ' + ELEMENT_COLORS[r.a] + '; --cb: ' + ELEMENT_COLORS[r.b] + ';"><div class="resonance-header"><span class="resonance-types">' + ELEMENT_EMOJI[r.a] + ' + ' + ELEMENT_EMOJI[r.b] + '</span><span class="resonance-name">' + r.name + '</span></div><p class="resonance-lore">"' + r.lore + '"</p><p class="resonance-effect">' + r.effect + '</p></div>'; }).join('');
  renderResonanceFilters(); applyResonanceFilters();
}
function renderResonanceFilters() {
  var filterBar = document.getElementById('filterBar'); if (!filterBar) return;
  var none = setSize(resFilterSet) === 0;
  var filters = ['<button class="filter-btn' + (none ? ' active' : '') + '" data-filter="all" style="--fc: 240, 200, 96;">Todas</button>'];
  CONSONANCE_ORDER.forEach(function(key){ var p = PHILOSOPHIES[key]; filters.push('<button class="filter-btn' + (resFilterSet[key] ? ' active' : '') + '" data-filter="' + key + '" style="--fc: ' + ELEMENT_COLORS[key] + ';">' + p.emoji + ' ' + p.name + '</button>'); });
  filterBar.innerHTML = filters.join('');
  var btns = filterBar.querySelectorAll('.filter-btn');
  for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', function(){ var f = this.dataset.filter; if (f === 'all') resFilterSet = {}; else toggleFilterKey(resFilterSet, f); renderResonanceFilters(); applyResonanceFilters(); });
}
function applyResonanceFilters() {
  var grid = document.getElementById('resonanceGrid'); if (!grid) return;
  var none = setSize(resFilterSet) === 0;
  var cards = grid.querySelectorAll('.resonance-card');
  for (var i = 0; i < cards.length; i++) { var c = cards[i]; c.classList.toggle('hidden', !(none || !!resFilterSet[c.dataset.a] || !!resFilterSet[c.dataset.b])); }
}
function parseCost(text) {
  if (!text) return [];
  return text.split(/,\s*/).map(function(part){
    part = part.trim(); var m;
    if ((m = part.match(/x(\d+)\s+dados?\s+de\s+(.+)/i))) { var el = m[2].trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); return { count:+m[1], type:'element', element:el }; }
    if ((m = part.match(/x(\d+)\s+dados?\s+cual(?:es)?quiera/i))) return { count:+m[1], type:'any' };
    if ((m = part.match(/x(\d+)\s+puntos?\s+de\s+energía/i))) return { count:+m[1], type:'energy' };
    return { text:part };
  });
}
function renderCost(costText) {
  var parts = parseCost(costText); if (!parts.length) return '';
  return parts.map(function(p){
    if (p.text) return '<span class="die">' + p.text + '</span>';
    if (p.type === 'any') return '<span class="die die-any">🎲 <b>×' + p.count + '</b></span>';
    if (p.type === 'energy') return '<span class="die die-energy">⚡ <b>×' + p.count + '</b></span>';
    if (p.type === 'element') { var color = ELEMENT_COLORS[p.element] || '150,150,170'; var emoji = ELEMENT_EMOJI[p.element] || '🎲'; return '<span class="die" style="--dc:' + color + ';">' + emoji + ' <b>×' + p.count + '</b></span>'; }
    return '';
  }).join('');
}
function renderAbility(ab, elementColor) {
  var costHtml = ab.cost ? '<div class="ability-cost">' + renderCost(ab.cost) + '</div>' : '';
  var inlineStyle = ab.type === 'elemental' ? 'style="--abc:' + elementColor + ';"' : '';
  return '<div class="ability ability-' + ab.type + '" ' + inlineStyle + '><div class="ability-head"><span class="ability-type-icon">' + ab.icon + '</span><span class="ability-type">' + (ABILITY_TYPES[ab.type] || '') + '</span></div><h4 class="ability-name">' + ab.name + '</h4>' + costHtml + '<p class="ability-effect">' + ab.effect + '</p></div>';
}
function buildModalContent(charId, char, originalId) {
  var el = char.element;
  var obtainText = 'Se obtiene comprándolo en la tienda con cierto precio y un nivel de amistad concreto, tras vencerlo en una batalla (desbloqueado por ' + char.name + ').';
  // ✅ Botón de alternar Adela <-> Hunger
  var toggleHtml = '';
  if (charId === 'adela') {
    toggleHtml = '<button class="modal-toggle-view" data-toggle-view="hunger" title="Ver Hunger Incarnate">👹 Ver Hunger Incarnate</button>';
  } else if (charId === 'hunger') {
    toggleHtml = '<button class="modal-toggle-view" data-toggle-view="adela" title="Volver a Adela">🕊️ Volver a Adela</button>';
  }
  return '<div class="modal-header"><div class="modal-portrait" data-fallback="' + char.emoji + '"><img src="' + char.img + '" alt="' + char.name + '" class="portrait-img" style="opacity:0;" onload="this.style.opacity=1;" onerror="this.style.display=\'none\';"><div class="modal-hp-badge">' + char.hp + ' HP</div></div><div class="modal-info"><div class="modal-eyebrow"><span class="el-badge-lg">' + ELEMENT_EMOJI[el] + '</span>' + ELEMENT_NAMES[el] + ' · ' + char.set + '</div><h2 class="modal-title" id="modalTitle">' + char.name + '</h2><p class="modal-concept">"' + char.concept + '"</p>' + toggleHtml + '</div><button class="modal-close" aria-label="Cerrar">×</button></div><div class="modal-body"><div class="obtain-box"><div class="obtain-label">📍 Obtención</div><p class="obtain-text">' + obtainText + '</p></div><div class="abilities">' + char.abilities.map(function(ab){ return renderAbility(ab, ELEMENT_COLORS[el]); }).join('') + '</div></div>';
}
var modal = document.getElementById('cardModal');
var modalContent = document.getElementById('modalContent');
function openCharacter(id, viewId) {
  // viewId permite abrir el modal mostrando una "vista" distinta a la del id
  // (ej: abrir 'adela' pero mostrando 'hunger').
  var showId = viewId || id;
  var char = CHARACTERS[showId]; if (!char || !modal || !modalContent) return;
  modalContent.style.setProperty('--el', ELEMENT_COLORS[char.element]);
  modalContent.innerHTML = buildModalContent(showId, char, id);
  var closeBtn = modalContent.querySelector('.modal-close'); if (closeBtn) closeBtn.addEventListener('click', closeModal);
  // Botón para alternar Adela <-> Hunger dentro del mismo modal
  var toggleBtn = modalContent.querySelector('[data-toggle-view]');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      var targetView = toggleBtn.getAttribute('data-toggle-view');
      openCharacter(targetView, targetView);
    });
  }
  // Botón para cambiar el personaje activo del modal (solo Adela)
  var changeBtn = modalContent.querySelector('[data-modal-team-btn]');
  if (changeBtn) {
    changeBtn.addEventListener('click', function() {
      closeModal();
      toggleTeam(changeBtn.getAttribute('data-modal-team-btn'));
    });
  }
  modal.classList.add('open'); document.body.style.overflow = 'hidden';
}
function closeModal(){ if (!modal) return; modal.classList.remove('open'); document.body.style.overflow = ''; }
if (modal) { var backdrop = modal.querySelector('.card-modal-backdrop'); if (backdrop) backdrop.addEventListener('click', closeModal); }
document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeModal(); });

var team = [];
try { var stored = localStorage.getItem('azaria_team'); if (stored) { var parsed = JSON.parse(stored); if (Array.isArray(parsed)) team = parsed.filter(function(id){ return CHARACTERS[id]; }).slice(0, 3); } } catch (err) { team = []; }
function saveTeam(){ try { localStorage.setItem('azaria_team', JSON.stringify(team)); } catch (err) {} }
function toggleTeam(id) {
  if (!CHARACTERS[id]) return;
  if (!COMBAT_CHARS[id]) return;   // ✅ NUEVO: bloquea "Próximamente"
  if (id === 'hunger') return;
  initAudio();
  var idx = team.indexOf(id);
  if (idx >= 0) { team.splice(idx, 1); playSound('deselect'); }
  else { if (team.length >= 3) team.shift(); team.push(id); playSound('select'); }
  saveTeam(); renderTeamPanel();
}
function autoBuildTeam(){
  initAudio();
  var pool = shuffleArray(Object.keys(CHARACTERS).filter(function(id){ return id !== 'hunger'; }));
  team = pool.slice(0, 3);
  saveTeam(); renderTeamPanel(); playSound('confirm');
}
function computeTeam() {
  if (team.length < 3) return null;
  var counts = {};
  team.forEach(function(id){ var el = CHARACTERS[id].element; counts[el] = (counts[el] || 0) + 1; });
  var maxCount = 0; Object.keys(counts).forEach(function(k){ if (counts[k] > maxCount) maxCount = counts[k]; });
  var maxEls = Object.keys(counts).filter(function(el){ return counts[el] === maxCount; });
  var consonance;
  if (maxCount === 3) { var el3 = maxEls[0]; consonance = { type:'single', element:el3, level:3, name:PHILOSOPHIES[el3].name, sub:PHILOSOPHIES[el3].emoji + ' 3 personajes', effect:PHILOSOPHIES[el3].consonance3 }; }
  else if (maxCount === 2) { var el2 = maxEls[0]; consonance = { type:'single', element:el2, level:2, name:PHILOSOPHIES[el2].name, sub:PHILOSOPHIES[el2].emoji + ' 2 personajes', effect:PHILOSOPHIES[el2].consonance2 }; }
  else { consonance = { type:'diverse', name:'Diverso', sub:'🌈 Composición mixta', effect:'Al comienzo de cada ronda, obtienes 2 omnidados.' }; }
  var resonances = [];
  for (var i = 0; i < team.length; i++) for (var j = i + 1; j < team.length; j++) {
    var elA = CHARACTERS[team[i]].element, elB = CHARACTERS[team[j]].element, res = null;
    for (var k = 0; k < RESONANCES.length; k++) { var r = RESONANCES[k]; if ((r.a === elA && r.b === elB) || (r.a === elB && r.b === elA)) { res = r; break; } }
    if (res) resonances.push({ charA:CHARACTERS[team[i]].name, charB:CHARACTERS[team[j]].name, elA:elA, elB:elB, name:res.name, effect:res.effect });
  }
  return { consonance:consonance, resonances:resonances };
}
function renderTeamPanel() {
  var slotsEl = document.getElementById('teamSlots'); if (!slotsEl) return;
  var html = '';
  for (var i = 0; i < 3; i++) {
    var id = team[i];
    if (id && CHARACTERS[id]) { var char = CHARACTERS[id]; var el = char.element; html += '<div class="team-slot filled" style="--el: ' + ELEMENT_COLORS[el] + ';"><div class="team-slot-img">' + char.emoji + '</div><div class="team-slot-info"><div class="team-slot-name">' + char.name + '</div><div class="team-slot-element">' + ELEMENT_EMOJI[el] + ' ' + ELEMENT_NAMES[el] + '</div></div><button class="team-slot-remove" data-id="' + id + '" aria-label="Quitar">✕</button></div>'; }
    else html += '<div class="team-slot-empty">Slot ' + (i + 1) + ' vacío — haz clic en una carta</div>';
  }
  slotsEl.innerHTML = html;
  slotsEl.querySelectorAll('.team-slot-remove').forEach(function(btn){ btn.addEventListener('click', function(){ toggleTeam(btn.dataset.id); }); });
  var data = computeTeam();
  var consEl = document.getElementById('teamConsonance'); var resEl = document.getElementById('teamResonances');
  if (!data) {
    if (consEl) consEl.innerHTML = '<div class="team-section"><div class="team-section-title">🔮 Consonancia</div><p class="team-section-empty">Selecciona 3 personajes para ver la consonancia activa.</p></div>';
    if (resEl) resEl.innerHTML = '';
  } else {
    var c = data.consonance; var color = c.type === 'single' ? ELEMENT_COLORS[c.element] : '240, 200, 96';
    if (consEl) consEl.innerHTML = '<div class="team-section"><div class="team-section-title">🔮 Consonancia activa</div><div class="team-consonance-card" style="--el: ' + color + ';"><div class="team-consonance-sub">' + c.sub + '</div><div class="team-consonance-name">' + c.name + '</div><div class="team-consonance-effect">' + c.effect + '</div></div></div>';
    var resHtml = '<div class="team-section"><div class="team-section-title">💥 Resonancias disponibles (' + data.resonances.length + ')</div>';
    data.resonances.forEach(function(r){ resHtml += '<div class="team-res-item" style="--ca: ' + ELEMENT_COLORS[r.elA] + '; --cb: ' + ELEMENT_COLORS[r.elB] + ';"><div class="team-res-pair">' + r.charA + ' + ' + r.charB + '</div><div class="team-res-name">' + ELEMENT_EMOJI[r.elA] + ' + ' + ELEMENT_EMOJI[r.elB] + ' — ' + r.name + '</div><div class="team-res-effect">' + r.effect + '</div></div>'; });
    resHtml += '</div>';
    if (resEl) resEl.innerHTML = resHtml;
  }
  var tt = document.getElementById('teamToggleText'); if (tt) tt.textContent = 'Equipo (' + team.length + '/3)';
  var cards = document.querySelectorAll('.char-card');
  for (var ci = 0; ci < cards.length; ci++) cards[ci].classList.toggle('in-team', team.indexOf(cards[ci].dataset.character) !== -1);
  // ✅ Reordenar para que los del equipo suban arriba
  try { sortCharCards(); } catch (e) {}
}
function openTeamPanel(){ var p = document.getElementById('teamPanel'), t = document.getElementById('teamPanelToggle'); if (p) p.classList.add('open'); if (t) t.classList.add('hidden'); document.body.classList.add('team-panel-open'); }
function closeTeamPanel(){ var p = document.getElementById('teamPanel'), t = document.getElementById('teamPanelToggle'); if (p) p.classList.remove('open'); if (t) t.classList.remove('hidden'); document.body.classList.remove('team-panel-open'); }
var tpc = document.getElementById('teamPanelClose'); if (tpc) tpc.addEventListener('click', closeTeamPanel);
var tpt = document.getElementById('teamPanelToggle'); if (tpt) tpt.addEventListener('click', openTeamPanel);
var tcb = document.getElementById('teamClearBtn'); if (tcb) tcb.addEventListener('click', function(){ team = []; saveTeam(); renderTeamPanel(); });
var teamAutoBtn = document.getElementById('teamAutoBtn'); if (teamAutoBtn) teamAutoBtn.addEventListener('click', autoBuildTeam);

function setupCardClicks() {
  var cards = document.querySelectorAll('.char-card');
  for (var i = 0; i < cards.length; i++) (function(card){
    card.addEventListener('click', function(e){
      if (e.target.closest && e.target.closest('.card-info-btn')) return;
      toggleTeam(card.dataset.character);
    });
  })(cards[i]);
}
var searchEl = document.getElementById('charSearch'); if (searchEl) searchEl.addEventListener('input', applyFilters);

var deck = [];
try { var storedDeck = localStorage.getItem('azaria_deck'); if (storedDeck) { var parsedDeck = JSON.parse(storedDeck); if (Array.isArray(parsedDeck)) { var cnts = {}; deck = parsedDeck.filter(function(id){ if (!CARD_DB[id]) return false; cnts[id] = (cnts[id]||0) + 1; return cnts[id] <= 2; }).slice(0, 30); } } } catch (err) { deck = []; }
function saveDeck(){ try { localStorage.setItem('azaria_deck', JSON.stringify(deck)); } catch (err) {} }
function deckCardCount(id){ return deck.filter(function(c){ return c === id; }).length; }
function addDeckCard(id) { if (!CARD_DB[id]) return; initAudio(); if (deck.length >= 30 || deckCardCount(id) >= 2) { playSound('error'); return; } deck.push(id); playSound('select'); saveDeck(); renderDeckGrid(); }
function removeDeckCard(id) { if (!CARD_DB[id]) return; initAudio(); var i = deck.indexOf(id); if (i < 0) return; deck.splice(i, 1); playSound('deselect'); saveDeck(); renderDeckGrid(); }
function formatCardCost(card) {
  if (!card.cost || Object.keys(card.cost).length === 0) return 'Sin coste';
  var parts = [];
  if (card.cost.any) parts.push('x' + card.cost.any + ' cualquiera' + (card.cost.any > 1 ? 's' : ''));
  if (card.cost.same) parts.push('x' + card.cost.same + ' del mismo tipo');
  return parts.join(', ');
}
function renderCardFilter() {
  var bar = document.getElementById('deckFilterBar'); if (!bar) return;
  var noCat = setSize(deckCatFilterSet) === 0, noTag = setSize(deckTagFilterSet) === 0;
  var html = '<div class="filter-row">';
  html += '<button class="cat-filter-btn' + (noCat ? ' active' : '') + '" data-cat="all" style="--fc: 240, 200, 96;">📚 Todas</button>';
  html += '<button class="cat-filter-btn' + (deckCatFilterSet.equipo ? ' active' : '') + '" data-cat="equipo" style="--fc: 200, 45, 60;">⚔️ Equipo</button>';
  html += '<button class="cat-filter-btn' + (deckCatFilterSet.apoyo ? ' active' : '') + '" data-cat="apoyo" style="--fc: 130, 220, 140;">📜 Apoyo</button>';
  html += '<button class="cat-filter-btn' + (deckCatFilterSet.evento ? ' active' : '') + '" data-cat="evento" style="--fc: 165, 131, 255;">✨ Evento</button>';
  html += '</div><div class="filter-row">';
  html += '<button class="filter-btn' + (noTag ? ' active' : '') + '" data-cfilter="all" style="--fc: 240, 200, 96;">Todas</button>';
  CARD_FILTER_ALL_TAGS.forEach(function(tag){ var color = CARD_TAG_COLORS[tag] || '165, 131, 255'; html += '<button class="filter-btn' + (deckTagFilterSet[tag] ? ' active' : '') + '" data-cfilter="' + tag + '" style="--fc: ' + color + ';">' + tag + '</button>'; });
  html += '</div>';
  bar.innerHTML = html;
  bar.querySelectorAll('.cat-filter-btn').forEach(function(btn){ btn.addEventListener('click', function(){ var v = btn.dataset.cat; if (v === 'all') deckCatFilterSet = {}; else toggleFilterKey(deckCatFilterSet, v); renderCardFilter(); renderDeckGrid(); }); });
  bar.querySelectorAll('.filter-btn').forEach(function(btn){ btn.addEventListener('click', function(){ var v = btn.dataset.cfilter; if (v === 'all') deckTagFilterSet = {}; else toggleFilterKey(deckTagFilterSet, v); renderCardFilter(); renderDeckGrid(); }); });
}
function renderDeckGrid() {
  var grid = document.getElementById('deckGrid'); if (!grid) return;
  var dc = document.getElementById('deckCount'), dce = document.getElementById('deckCounter');
  if (dc) dc.textContent = deck.length;
  if (dce) dce.classList.toggle('complete', deck.length === 30);
  var isFull = deck.length >= 30;
  var noCat = setSize(deckCatFilterSet) === 0, noTag = setSize(deckTagFilterSet) === 0;
  var ids = CARD_ORDER.filter(function(id){ var c = CARD_DB[id]; return (noCat || !!deckCatFilterSet[c.category]) && (noTag || !!deckTagFilterSet[c.tag]); });
  if (!ids.length) { grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--muted); font-style: italic;">No hay cartas con este filtro.</div>'; return; }
  grid.innerHTML = ids.map(function(id){
    var card = CARD_DB[id], count = deckCardCount(id), isMaxed = count >= 2, isBlocked = isFull && count === 0;
    var cls = 'deck-card'; if (count > 0) cls += ' in-deck'; if (isMaxed) cls += ' maxed'; if (isBlocked) cls += ' blocked';
    var countBadge = count > 0 ? '<div class="deck-card-count">' + count + '/2</div>' : '';
    var removeBtn = count > 0 ? '<button class="deck-card-remove" data-remove-id="' + id + '" title="Quitar una copia" aria-label="Quitar una copia">✕</button>' : '';
    var catIcon = card.category === 'equipo' ? '⚔️ ' : card.category === 'apoyo' ? '📜 ' : '✨ ';
    return '<div class="' + cls + '" data-card-id="' + id + '" style="--dc: ' + card.color + ';">' +
      '<div class="deck-card-emoji">' + card.emoji + '</div>' +
      '<div class="deck-card-info"><div class="deck-card-name">' + card.name + '</div>' +
      '<div class="deck-card-cost">🎲 ' + formatCardCost(card) + (card.duration ? ' · ⏳ ' + card.duration + ' r' : '') + '</div>' +
      '<div class="deck-card-effect">' + card.effectText + '</div>' +
      '<span class="deck-card-tag">' + catIcon + card.tag + '</span></div>' + countBadge + removeBtn + '</div>';
  }).join('');
  grid.querySelectorAll('.deck-card').forEach(function(el){ el.addEventListener('click', function(e){ if (e.target.closest('.deck-card-remove')) return; if (el.classList.contains('blocked')) { playSound('error'); return; } addDeckCard(el.dataset.cardId); }); });
  grid.querySelectorAll('.deck-card-remove').forEach(function(btn){ btn.addEventListener('click', function(e){ e.stopPropagation(); removeDeckCard(btn.dataset.removeId); }); });
}
function autoBuildDeck() {
  deck = [];
  var ev = CARD_ORDER.filter(function(id){ return CARD_DB[id].category === 'evento'; });
  var eq = CARD_ORDER.filter(function(id){ return CARD_DB[id].category === 'equipo'; });
  var ap = CARD_ORDER.filter(function(id){ return CARD_DB[id].category === 'apoyo'; });
  shuffleArray(ev).slice(0, Math.min(14, ev.length)).forEach(function(id){ deck.push(id); });
  shuffleArray(eq).slice(0, Math.min(10, eq.length)).forEach(function(id){ deck.push(id); });
  shuffleArray(ap).slice(0, Math.min(6, ap.length)).forEach(function(id){ deck.push(id); });
  var pool = shuffleArray(deck.slice()); var safety = 0;
  while (deck.length < 30 && safety < 200) { var p = pool[Math.floor(Math.random() * pool.length)]; if (deckCardCount(p) < 2) deck.push(p); safety++; }
  saveDeck(); renderDeckGrid(); playSound('confirm');
}
var autoBuildBtn = document.getElementById('autoBuildDeckBtn'); if (autoBuildBtn) autoBuildBtn.addEventListener('click', autoBuildDeck);
var deckClearBtn = document.getElementById('deckClearBtn'); if (deckClearBtn) deckClearBtn.addEventListener('click', function(){ deck = []; saveDeck(); renderDeckGrid(); });

var TEMPLATE_SLOT_COUNT = 12;
function getTemplateSlotKey(s){ return 'azaria_template_' + s; }
function getTemplate(s){ try { var st = localStorage.getItem(getTemplateSlotKey(s)); if (!st) return null; var p = JSON.parse(st); if (!p || !Array.isArray(p.team) || !Array.isArray(p.deck)) return null; return p; } catch (e) { return null; } }
function saveTemplate(s, t, d, name){ try { localStorage.setItem(getTemplateSlotKey(s), JSON.stringify({ team:t, deck:d, name:name || ('Ranura ' + (s + 1)), savedAt:Date.now() })); } catch (e) {} }
function clearTemplate(s){ try { localStorage.removeItem(getTemplateSlotKey(s)); } catch (e) {} }
function renderTemplateSlots() {
  var c = document.getElementById('templateSlots'); if (!c) return;
  var html = '';
  for (var i = 0; i < TEMPLATE_SLOT_COUNT; i++) {
    var t = getTemplate(i);
    if (t) {
      var validTeam = t.team.filter(function(id){ return CHARACTERS[id] && id !== 'hunger'; }).slice(0, 3);
      var tp = validTeam.map(function(id){ var ch = CHARACTERS[id]; return '<span class="template-char" style="--el: ' + ELEMENT_COLORS[ch.element] + ';" title="' + ch.name + '">' + ch.emoji + '</span>'; }).join('');
      if (!validTeam.length) tp = '<span style="color: var(--muted); font-size: 0.8rem;">Equipo vacío</span>';
      var tname = t.name || ('Ranura ' + (i + 1));
      html += '<div class="template-slot filled"><div class="template-slot-header">' + tname + '</div><div class="template-team-preview">' + tp + '</div><div class="template-deck-info">🎴 ' + t.deck.length + '/30 cartas</div><div class="template-actions"><button class="template-info-btn" data-slot="' + i + '" title="Ver info">👁️</button><button class="template-load-btn" data-slot="' + i + '">📂 Cargar</button><button class="template-save-btn" data-slot="' + i + '">💾 Guardar</button><button class="template-delete-btn" data-slot="' + i + '" title="Borrar plantilla">🗑️</button></div></div>';
    } else html += '<div class="template-slot empty"><div class="template-slot-header">Ranura ' + (i + 1) + '</div><div class="template-empty-text">— Vacía —</div><div class="template-actions"><button class="template-save-btn" data-slot="' + i + '">💾 Guardar actual</button></div></div>';   
  }
  c.innerHTML = html;
  c.querySelectorAll('.template-save-btn').forEach(function(btn){ btn.addEventListener('click', function(){
    var s = parseInt(btn.dataset.slot, 10);
    if (team.length !== 3) { showTeamMissingToast('Necesitas <strong>3 personajes</strong> en el equipo.'); return; }
    if (deck.length !== 30) { showTeamMissingToast('Necesitas <strong>30 cartas</strong> en el mazo (tienes ' + deck.length + ').'); return; }
    var existing = getTemplate(s);
    var defaultName = existing ? (existing.name || 'Ranura ' + (s + 1)) : 'Ranura ' + (s + 1);
    var inputName = prompt('Nombre de la plantilla:', defaultName);
    if (inputName === null) return;
    if (existing) { if (!confirm('¿Sobrescribir la plantilla "' + defaultName + '"?')) return; }
    saveTemplate(s, team.slice(), deck.slice(), (inputName || '').trim() || defaultName);
    renderTemplateSlots(); playSound('confirm');
  }); });
  c.querySelectorAll('.template-load-btn').forEach(function(btn){ btn.addEventListener('click', function(){
    var s = parseInt(btn.dataset.slot, 10);
    var t = getTemplate(s); if (!t) return;
    team = t.team.filter(function(id){ return CHARACTERS[id]; }).slice(0, 3);
    deck = t.deck.filter(function(id){ return CARD_DB[id]; }).slice(0, 30);
    var cnts = {}; deck = deck.filter(function(id){ cnts[id] = (cnts[id]||0) + 1; return cnts[id] <= 2; });
    saveTeam(); saveDeck(); renderTeamPanel(); renderDeckGrid(); playSound('confirm');
    showTeamMissingToast('✅ Plantilla "' + (t.name || ('Ranura ' + (s + 1))) + '" cargada.');
  }); });
  c.querySelectorAll('.template-delete-btn').forEach(function(btn){ btn.addEventListener('click', function(){
    var s = parseInt(btn.dataset.slot, 10);
    var t = getTemplate(s);
    var nm = t && t.name ? t.name : ('la plantilla ' + (s + 1));
    if (!confirm('¿Borrar "' + nm + '"?')) return;
    clearTemplate(s); renderTemplateSlots(); playSound('deselect');
  }); });
}
function showCardInfo(cardId) {
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId];
  if (!card) { console.warn('[showCardInfo] Carta no encontrada:', cardId); return; }
  var ov = document.getElementById('cardInfoDialog');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'cardInfoDialog';
    ov.className = 'card-info-dialog';
    document.body.appendChild(ov);
  }
  var meta = CARD_CATEGORY_META[card.category] || { label: 'Evento', icon: '✨', color: '165,131,255' };
  var costText = formatCardCost(card);
  var durationText = card.duration ? ' · ⏳ ' + card.duration + ' ronda(s)' : '';
  var html = '<div class="card-info-content" style="--dc: ' + card.color + ';">' +
    '<button class="card-info-close" id="cardInfoClose" aria-label="Cerrar">✕</button>' +
    '<div class="card-info-emoji">' + card.emoji + '</div>' +
    '<div class="card-info-name">' + card.name + '</div>' +
    '<div class="card-info-cat" style="--cat: ' + meta.color + ';">' + meta.icon + ' ' + meta.label + ' · ' + card.tag + '</div>' +
    '<div class="card-info-cost">🎲 ' + costText + durationText + '</div>' +
    '<div class="card-info-effect">' + card.effectText + '</div>' +
    '</div>';
  ov.innerHTML = html;
  ov.classList.add('show');
  document.getElementById('cardInfoClose').addEventListener('click', function(){ ov.classList.remove('show'); });
  ov.addEventListener('click', function(e){ if (e.target === ov) ov.classList.remove('show'); });
}
function showTemplatePreview(template, slot, onConfirm) {
  var validTeam = template.team.filter(function(id){ return CHARACTERS[id] && id !== 'hunger'; }).slice(0, 3);
  var validDeck = template.deck.filter(function(id){ return CARD_DB[id]; });
  var ov = document.getElementById('templatePreviewDialog');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'templatePreviewDialog';
    ov.className = 'template-preview-dialog';
    document.body.appendChild(ov);
  }

  var teamHtml = validTeam.map(function(id) {
    var ch = CHARACTERS[id];
    var col = ELEMENT_COLORS[ch.element];
    return '<div class="template-preview-card template-preview-clickable" data-char-id="' + id + '" style="--el: ' + col + ';" title="Ver información de ' + ch.name + '">' +
      '<div class="template-preview-card-portrait" data-fallback="' + ch.emoji + '">' +
        '<img src="' + ch.img + '" alt="' + ch.name + '" onerror="this.style.display=\'none\';" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">' +
      '</div>' +
      '<div class="template-preview-card-name">' + ch.name + '</div>' +
      '<div class="template-preview-card-el">' + ELEMENT_EMOJI[ch.element] + '</div>' +
    '</div>';
  }).join('');

  var deckHtml = validDeck.map(function(id) {
    var c = CARD_DB[id];
    return '<div class="template-preview-deck-card template-preview-clickable" data-card-id="' + id + '" style="--dc: ' + c.color + ';" title="Ver información de ' + c.name + '">' +
      '<div class="template-preview-deck-emoji">' + c.emoji + '</div>' +
      '<div class="template-preview-deck-name">' + c.name + '</div>' +
    '</div>';
  }).join('');

  var html = '<div class="template-preview-content">';
  html += '<div class="template-preview-title">' + (template.name || 'Ranura ' + (slot + 1)) + '</div>';
  html += '<p class="template-preview-sub">' + validDeck.length + ' cartas · ' + validTeam.length + ' personajes</p>';
  html += '<div class="template-preview-team">' + teamHtml + '</div>';
  html += '<div class="template-preview-deck-label">🎴 Mazo (' + validDeck.length + ' cartas) — desliza horizontalmente · clic para ver info</div>';
  html += '<div class="template-preview-deck-scroll">' + deckHtml + '</div>';
  html += '<div class="template-preview-buttons">';
  html += '<button class="confirm-btn confirm-cancel" id="templatePreviewCancel">Cerrar</button>';
  if (onConfirm) html += '<button class="confirm-btn confirm-accept" id="templatePreviewConfirm">✓ Usar esta plantilla</button>';
  html += '</div></div>';
  ov.innerHTML = html;
  ov.classList.add('show');

  // ── Clics sobre personajes ──
  ov.querySelectorAll('[data-char-id]').forEach(function(el){
    el.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      openCharacter(el.dataset.charId);
    });
  });

  // ── Clics sobre cartas ──
  ov.querySelectorAll('[data-card-id]').forEach(function(el){
    el.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      showCardInfo(el.dataset.cardId);
    });
  });

  // ── Cerrar ──
  document.getElementById('templatePreviewCancel').addEventListener('click', function(){
    ov.classList.remove('show');
  });
  if (onConfirm) {
    document.getElementById('templatePreviewConfirm').addEventListener('click', function(){
      ov.classList.remove('show');
      onConfirm();
    });
  }
}

function showTemplatePickerForCombat(playerLabel, onSelect) {
  initAudio();
  var templates = [];
  for (var i = 0; i < TEMPLATE_SLOT_COUNT; i++) {
    var t = getTemplate(i);
    if (t) templates.push({ slot: i, template: t });
  }
  var currentTeamValid = (team.length === 3 && team.every(function(id){ return CHARACTERS[id]; }));
  var currentDeckValid = (deck.length === 30 && deck.every(function(id){ return CARD_DB[id]; }));

  var ov = document.getElementById('templatePickerDialog');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'templatePickerDialog';
    ov.className = 'template-picker-dialog';
    document.body.appendChild(ov);
  }

  var html = '<div class="template-picker-content">';
  html += '<div class="template-picker-title">' + playerLabel + ' — Elige tu plantilla</div>';
  html += '<p class="template-picker-sub">Selecciona una plantilla guardada o usa tu equipo actual</p>';

  if (currentTeamValid && currentDeckValid) {
    var currentTeamHtml = team.map(function(id){
      var ch = CHARACTERS[id];
      return '<div class="template-picker-char" style="--el: ' + ELEMENT_COLORS[ch.element] + ';">' +
        '<div class="template-picker-char-emoji">' + ch.emoji + '</div>' +
        '<div class="template-picker-char-name">' + ch.name + '</div>' +
      '</div>';
    }).join('');
    html += '<div class="template-picker-item current" data-slot="-1">';
    html += '<div class="template-picker-item-name">📋 Equipo y mazo actuales</div>';
    html += '<div class="template-picker-team">' + currentTeamHtml + '</div>';
    html += '<div class="template-picker-deck-info">🎴 ' + deck.length + ' cartas</div>';
    html += '</div>';
  }

  if (templates.length === 0) {
    if (!(currentTeamValid && currentDeckValid)) {
      html += '<div class="template-picker-empty">⚠️ No hay plantillas guardadas y tu equipo/mazo actuales no son válidos.</div>';
    }
  } else {
    html += '<div class="template-picker-grid">';
  templates.forEach(function(t) {
    if (!t.template || !Array.isArray(t.template.team) || !Array.isArray(t.template.deck)) return;
    var validTeam = t.template.team.filter(function(id){ return CHARACTERS[id] && id !== 'hunger'; }).slice(0, 3);
    var teamHtml = validTeam.map(function(id){
      var ch = CHARACTERS[id];
      return '<div class="template-picker-char" style="--el: ' + ELEMENT_COLORS[ch.element] + ';">' +
        '<div class="template-picker-char-emoji">' + ch.emoji + '</div>' +
        '<div class="template-picker-char-name">' + ch.name + '</div>' +
      '</div>';
    }).join('');
    html += '<div class="template-picker-item" data-slot="' + t.slot + '">';
    html += '<div class="template-picker-item-name">' + (t.template.name || 'Ranura ' + (t.slot + 1)) + '</div>';
    html += '<div class="template-picker-team">' + teamHtml + '</div>';
    html += '<div class="template-picker-deck-info">🎴 ' + t.template.deck.length + ' cartas</div>';
    html += '</div>';
  });
    html += '</div>';
  }

  html += '<div class="template-picker-buttons">';
  html += '<button class="confirm-btn confirm-cancel" id="templatePickerCancel">Cancelar</button>';
  html += '</div></div>';

  ov.innerHTML = html;
  ov.classList.add('show');
  document.getElementById('templatePickerCancel').addEventListener('click', function(){ ov.classList.remove('show'); });

  ov.querySelectorAll('.template-picker-item').forEach(function(el){
    el.addEventListener('click', function(){
      var slot = parseInt(el.dataset.slot, 10);
      if (slot === -1) {
        ov.classList.remove('show');
        onSelect({ team: team.slice(), deck: deck.slice() });
      } else {
        var t = getTemplate(slot);
        if (!t) return;
        ov.classList.remove('show');
        showTemplatePreview(t, slot, function(){ onSelect(t); });
      }
    });
  });
}

function trySpendDice(dice, cost) {
  var pool = dice.slice(), spent = [], remaining = {};
  Object.keys(cost).forEach(function(k){ remaining[k] = cost[k]; });
  if (remaining.same && remaining.same > 0) {
    var groups = {};
    pool.forEach(function(d, i){ if (d.type !== 'omni') { if (!groups[d.type]) groups[d.type] = []; groups[d.type].push(i); } });
    var omniIdx = pool.map(function(d, i){ return d.type === 'omni' ? i : -1; }).filter(function(i){ return i >= 0; });
    var best = null;
    Object.keys(groups).forEach(function(t){ var c = groups[t].length + omniIdx.length; if (c >= remaining.same) { if (!best || groups[t].length > best.primary.length) best = { primary:groups[t], omni:omniIdx }; } });
    if (omniIdx.length >= remaining.same) { if (!best || omniIdx.length > best.primary.length) best = { primary:[], omni:omniIdx }; }
    if (!best) return { ok:false };
    var used = {}, needed = remaining.same, all = best.primary.concat(best.omni);
    for (var bi = all.length - 1; bi >= 0 && needed > 0; bi--) { if (!used[all[bi]]) { used[all[bi]] = true; needed--; } }
    var np = [];
    for (var pi = 0; pi < pool.length; pi++) { if (used[pi]) spent.push(pool[pi]); else np.push(pool[pi]); }
    pool = np; remaining.same = 0;
  }
  var specific = Object.keys(remaining).filter(function(k){ return k !== 'any' && k !== 'same' && k !== 'energy'; });
  for (var s = 0; s < specific.length; s++) {
    var type = specific[s], need = remaining[type];
    for (var i = pool.length - 1; i >= 0 && need > 0; i--) if (pool[i].type === type) { spent.push(pool.splice(i, 1)[0]); need--; }
    for (var j = pool.length - 1; j >= 0 && need > 0; j--) if (pool[j].type === 'omni') { spent.push(pool.splice(j, 1)[0]); need--; }
    if (need > 0) return { ok:false };
  }
  if (remaining.any && remaining.any > 0) {
    var na = remaining.any;
    for (var k = pool.length - 1; k >= 0 && na > 0; k--) if (pool[k].type !== 'omni') { spent.push(pool.splice(k, 1)[0]); na--; }
    for (var l = pool.length - 1; l >= 0 && na > 0; l--) if (pool[l].type === 'omni') { spent.push(pool.splice(l, 1)[0]); na--; }
    if (na > 0) return { ok:false };
  }
  return { ok:true, spent:spent, remaining:pool };
}
function formatCost(cost, energyCost) {
  var parts = [];
  Object.keys(cost).forEach(function(k){ if (k === 'any') parts.push('🎲 ×' + cost.any); else if (k === 'same') parts.push('🎲 ' + cost.same + ' iguales'); else parts.push(ELEMENT_EMOJI[k] + ' ×' + cost[k]); });
  if (energyCost) parts.push('⚡ ×' + energyCost);
  return parts.join(' · ');
}
function getDiePriority(die, teamEls, targetEl) { if (die.type === 'omni') return 5; var info = teamEls[die.type]; if (!info || (!info.living && !info.dead)) return 1; if (!info.living && info.dead) return 2; if (targetEl && die.type !== targetEl) return 3; return 4; }
function computeTeamElements(side) { var te = {}; side.characters.forEach(function(c){ var el = c.character.element; if (!te[el]) te[el] = { living:false, dead:false }; if (c.dead) te[el].dead = true; else te[el].living = true; }); return te; }
function autoSelectDiceForCost(cost, opts) {
  opts = opts || {}; var side = getActiveSide(); if (!side) return [];
  var selectedIds = [], pool = side.dice.slice();
  var teamEls = computeTeamElements(side), targetEl = opts.targetElement || null;
  if (!targetEl) { var act = side.characters[side.activeIndex]; if (act) targetEl = act.character.element; }
  if (cost.same && cost.same > 0) {
    var cnts = {}, omniC = 0;
    pool.forEach(function(d){ if (d.type === 'omni') omniC++; else cnts[d.type] = (cnts[d.type] || 0) + 1; });
    var best = null;
    Object.keys(cnts).forEach(function(t){ var tot = cnts[t] + omniC; if (tot >= cost.same) { if (!best || cnts[t] > cnts[best]) best = t; } });
    if (!best && omniC >= cost.same) best = 'omni';
    if (!best) return [];
    var need = cost.same, np = [];
    for (var i = 0; i < pool.length; i++) { if (need > 0 && pool[i].type === best) { selectedIds.push(pool[i].id); need--; } else np.push(pool[i]); }
    if (best !== 'omni') { for (var j = 0; j < np.length && need > 0; j++) { if (np[j].type === 'omni') { selectedIds.push(np[j].id); need--; np.splice(j, 1); j--; } } }
    pool = np;
  }
  Object.keys(cost).forEach(function(type){ if (type === 'any' || type === 'same' || type === 'energy') return; var need = cost[type], np = []; for (var i = 0; i < pool.length; i++) { if (need > 0 && pool[i].type === type) { selectedIds.push(pool[i].id); need--; } else np.push(pool[i]); } pool = np; np = []; for (var j = 0; j < pool.length; j++) { if (need > 0 && pool[j].type === 'omni') { selectedIds.push(pool[j].id); need--; } else np.push(pool[j]); } pool = np; });
  var na = cost.any || 0;
  while (na > 0 && pool.length > 0) { var bi = 0, bp = getDiePriority(pool[0], teamEls, targetEl); for (var k = 1; k < pool.length; k++) { var p = getDiePriority(pool[k], teamEls, targetEl); if (p < bp) { bp = p; bi = k; } } selectedIds.push(pool[bi].id); pool.splice(bi, 1); na--; }
  return selectedIds;
}
function sortDiceForDisplay(dice, side) {
  if (!dice) return [];
  if (!side || !side.characters || !side.characters.length) return dice.slice();
  var active = side.characters[side.activeIndex], activeEl = active && !active.dead ? active.character.element : null;
  var teamEls = [];
  side.characters.forEach(function(c){ if (!c || c.dead) return; var el = c.character.element; if (el !== activeEl && teamEls.indexOf(el) === -1) teamEls.push(el); });
  var tc = {}; dice.forEach(function(d){ tc[d.type] = (tc[d.type] || 0) + 1; });
  var cache = {};
  function getKey(type) {
    if (cache[type]) return cache[type];
    var key;
    if (type === 'omni') key = [0, 0, 0];
    else if (type === activeEl) key = [1, 0, 0];
    else if (teamEls.indexOf(type) !== -1) { var di = CONSONANCE_ORDER.indexOf(type); if (di === -1) di = 99; key = [2, 0, di]; }
    else { var c = tc[type] || 0; var d2 = CONSONANCE_ORDER.indexOf(type); if (d2 === -1) d2 = 99; key = [3, -c, d2]; }
    cache[type] = key; return key;
  }
  return dice.slice().sort(function(a, b){ var ka = getKey(a.type), kb = getKey(b.type); for (var i = 0; i < 3; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i]; return 0; });
}

var DICE_ELEMENTS = CONSONANCE_ORDER.slice(), selectedDiceElements = {};
DICE_ELEMENTS.forEach(function(k){ selectedDiceElements[k] = true; });
var diceCount = 3, isRolling = false;
function renderDiceSimulator() {
  var elC = document.getElementById('simElements');
  if (elC) {
    var html = '';
    DICE_ELEMENTS.forEach(function(key){ var p = PHILOSOPHIES[key]; html += '<button class="sim-el-toggle' + (selectedDiceElements[key] ? ' active' : '') + '" data-el="' + key + '" style="--ec: ' + ELEMENT_COLORS[key] + ';">' + p.emoji + ' ' + p.name + '</button>'; });
    elC.innerHTML = html;
    elC.querySelectorAll('.sim-el-toggle').forEach(function(btn){ btn.addEventListener('click', function(){ var el = btn.dataset.el; var c = 0; Object.keys(selectedDiceElements).forEach(function(k){ if (selectedDiceElements[k]) c++; }); if (selectedDiceElements[el]) { if (c > 1) selectedDiceElements[el] = false; } else selectedDiceElements[el] = true; renderDiceSimulator(); }); });
  }
  var cC = document.getElementById('simCount');
  if (cC) {
    var h = ''; for (var n = 1; n <= 8; n++) h += '<button class="sim-count-btn' + (n === diceCount ? ' active' : '') + '" data-n="' + n + '">' + n + '</button>';
    cC.innerHTML = h;
    cC.querySelectorAll('.sim-count-btn').forEach(function(btn){ btn.addEventListener('click', function(){ diceCount = parseInt(btn.dataset.n, 10); renderDiceSimulator(); }); });
  }
}
function rollDiceSim() {
  if (isRolling) return; isRolling = true;
  var btn = document.getElementById('simRoll'), res = document.getElementById('simResult'), sum = document.getElementById('simSummary');
  if (!res || !sum) { isRolling = false; return; }
  if (btn) btn.disabled = true; sum.innerHTML = '';
  var rh = ''; for (var i = 0; i < diceCount; i++) rh += '<div class="sim-die rolling">🎲</div>';
  res.innerHTML = rh;
  setTimeout(function(){
    var els = Object.keys(selectedDiceElements).filter(function(k){ return selectedDiceElements[k]; });
    var dice = []; for (var i = 0; i < diceCount; i++) { if (Math.random() < 0.08) dice.push({ type:'omni' }); else dice.push({ type:els[Math.floor(Math.random() * els.length)] }); }
    var dh = ''; dice.forEach(function(d){ if (d.type === 'omni') dh += '<div class="sim-die omnidie">✨</div>'; else dh += '<div class="sim-die" style="--dc: ' + ELEMENT_COLORS[d.type] + ';">' + ELEMENT_EMOJI[d.type] + '</div>'; });
    res.innerHTML = dh;
    var cnt = {}, omniC = 0; dice.forEach(function(d){ if (d.type === 'omni') omniC++; else cnt[d.type] = (cnt[d.type] || 0) + 1; });
    var sh = ''; Object.keys(cnt).forEach(function(el){ sh += '<span class="sim-summary-item" style="--sc: ' + ELEMENT_COLORS[el] + ';">' + ELEMENT_EMOJI[el] + ' <b>×' + cnt[el] + '</b></span>'; });
    if (omniC > 0) sh += '<span class="sim-summary-item" style="--sc: 240, 200, 96;">✨ <b>×' + omniC + '</b></span>';
    sum.innerHTML = sh; if (btn) btn.disabled = false; isRolling = false;
  }, 700);
}
var simRollBtn = document.getElementById('simRoll'); if (simRollBtn) simRollBtn.addEventListener('click', rollDiceSim);

var combatStarsInited = false;
function initCombatStars() {
  if (combatStarsInited) return; combatStarsInited = true;
  var cvs = document.getElementById('combatStars'); if (!cvs) return;
  var cctx = cvs.getContext('2d'), cs = [], cW, cH;
  function resizeC() { cW = cvs.width = window.innerWidth; cH = cvs.height = window.innerHeight; cs = []; for (var i = 0; i < 140; i++) cs.push({ x:Math.random()*cW, y:Math.random()*cH, r:Math.random()*1.4+0.3, vx:(Math.random()-0.5)*0.12, vy:(Math.random()-0.5)*0.12, a:Math.random()*0.5+0.2 }); }
  function drawC() {
    cctx.clearRect(0, 0, cW, cH);

    // ✅ Color de las estrellas según entorno activo (o dorado por defecto)
    var starFillColor = combatEnvColor
      ? 'rgba(' + combatEnvColor.r + ', ' + combatEnvColor.g + ', ' + combatEnvColor.b + ', '
      : 'rgba(240, 220, 180, ';
    var starLineBase = combatEnvColor
      ? 'rgba(' + combatEnvColor.r + ', ' + combatEnvColor.g + ', ' + combatEnvColor.b + ', '
      : 'rgba(240, 200, 96, ';

    for (var i = 0; i < cs.length; i++) {
      var s = cs[i];
      s.x += s.vx; s.y += s.vy;
      if (s.x < 0) s.x = cW; if (s.x > cW) s.x = 0;
      if (s.y < 0) s.y = cH; if (s.y > cH) s.y = 0;
      cctx.beginPath();
      cctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      cctx.fillStyle = starFillColor + s.a + ')';
      cctx.fill();
    }
    for (var p = 0; p < cs.length; p++) for (var q = p + 1; q < cs.length; q++) {
      var dx = cs[p].x - cs[q].x, dy = cs[p].y - cs[q].y, d = Math.sqrt(dx*dx + dy*dy);
      if (d < 120) {
        cctx.beginPath();
        cctx.moveTo(cs[p].x, cs[p].y);
        cctx.lineTo(cs[q].x, cs[q].y);
        cctx.strokeStyle = starLineBase + ((1 - d/120) * 0.12) + ')';
        cctx.lineWidth = 0.5;
        cctx.stroke();
      }
    }
    requestAnimationFrame(drawC);
  }
  window.addEventListener('resize', resizeC); resizeC(); drawC();

  var envDisplay = document.getElementById('combatEnvironmentDisplay');
  if (envDisplay && !envDisplay.dataset.bound) {
    envDisplay.dataset.bound = '1';
    envDisplay.addEventListener('mouseenter', function() {
      if (!combatState || !combatState.environment) return;
      var env = combatState.environment;
      hoverTooltip.innerHTML =
        '<div class="ht-header">🌍 Entorno activo</div>' +
        '<div class="ht-name">' + (env.def.emoji || '🌍') + ' ' + env.name + '</div>' +
        '<div class="ht-sub">' + ELEMENT_EMOJI[env.element] + ' ' + ELEMENT_NAMES[env.element] + ' · ' + env.roundsLeft + ' ronda(s) restantes</div>' +
        '<div class="ht-effect">' + env.def.effectText + '</div>';
      hoverTooltip.classList.add('show');
      positionTooltip(hoverTooltip, envDisplay.getBoundingClientRect(), 'above');
    });
    envDisplay.addEventListener('mouseleave', hideTooltip);
  }
}

var hoverTooltip = document.getElementById('hoverTooltip');
function positionTooltip(tt, rect, prefer) {
  var w = tt.offsetWidth, h = tt.offsetHeight, left, top;
  if (prefer === 'left') { left = rect.left - w - 12; top = rect.top + rect.height/2 - h/2; if (left < 12) left = rect.right + 12; }
  else if (prefer === 'above') { left = rect.left + rect.width/2 - w/2; top = rect.top - h - 12; if (top < 12) top = rect.bottom + 12; }
  else { left = rect.left; top = rect.bottom + 12; }
  left = Math.max(12, Math.min(left, window.innerWidth - w - 12)); top = Math.max(12, Math.min(top, window.innerHeight - h - 12));
  tt.style.left = left + 'px'; tt.style.top = top + 'px';
}
function showStatusTooltip(anchor, key, data) {
  var d = STATUS_DESCRIPTIONS[key]; if (!d) return;
  var extra = '';
  if (data && data.value !== null && data.value !== undefined) {
    if (key === 'condena') extra = '<div class="ht-sub">Puntos actuales: <b>' + data.value + '</b></div>';
    if (key === 'manuelStacks') extra = '<div class="ht-sub">Stacks actuales: <b>' + data.value + '</b></div>';
    if (key === 'obraMaestra') extra = '<div class="ht-sub">Rondas restantes: <b>' + data.value + '</b></div>';
    if (key === 'rencor') extra = '<div class="ht-sub">Acumulaciones: <b>' + data.value + '</b></div>';
  }
  hoverTooltip.innerHTML = '<div class="ht-header">' + d.name + '</div>' + extra + '<div class="ht-effect">' + d.text + '</div>';
  hoverTooltip.classList.add('show'); positionTooltip(hoverTooltip, anchor.getBoundingClientRect(), 'above');
}
function getFullAbilityText(charId, type){ var char = CHARACTERS[charId]; if (!char) return null; for (var i = 0; i < char.abilities.length; i++) if (char.abilities[i].type === type) return char.abilities[i]; return null; }
function showAbilityTooltip(btn, type) {
  if (!combatState || combatState.phase !== 'playing') return;
  var side = getActiveSide(); if (!side) return;
  var active = side.characters[side.activeIndex]; if (!active) return;
  var ab = getFullAbilityText(active.id, type); if (!ab) return;
  var icon = type === 'normal' ? '⚔️' : (type === 'elemental' ? '🔮' : '💥');
  var name = type === 'normal' ? 'Ataque Normal' : (type === 'elemental' ? 'Habilidad Elemental' : 'Habilidad Definitiva');
  var html = '<div class="ht-header">' + icon + ' ' + name + '</div><div class="ht-name">' + ab.name + '</div>';
  if (ab.cost) html += '<div class="ht-cost">' + renderCost(ab.cost) + '</div>';
  html += '<div class="ht-effect">' + ab.effect + '</div>';
  hoverTooltip.innerHTML = html; hoverTooltip.classList.add('show'); positionTooltip(hoverTooltip, btn.getBoundingClientRect(), 'left');
}
function showCharTooltip(card, cs) {
  if (!cs) return;
  var cd = CHARACTERS[cs.id]; if (!cd) return;
  var vis = ['normal','elemental','ultimate'], col = ELEMENT_COLORS[cd.element];
  var html = '<div class="ht-header" style="color: rgb(' + col + ');">' + ELEMENT_EMOJI[cd.element] + ' ' + ELEMENT_NAMES[cd.element] + '</div>';
  html += '<div class="ht-name" style="background: linear-gradient(90deg, #fff, rgb(' + col + ')); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">' + cd.name + '</div>';
  html += '<div class="ht-sub">' + cd.set + ' · ' + cs.hp + '/' + cs.maxHp + ' HP · 🛡️ ' + totalShield(cs) + '</div>';
  cd.abilities.forEach(function(ab){
    if (vis.indexOf(ab.type) === -1) return;
    var icon = ab.type === 'normal' ? '⚔️' : (ab.type === 'elemental' ? '🔮' : '💥');
    var name = ab.type === 'normal' ? 'Ataque Normal' : (ab.type === 'elemental' ? 'Habilidad Elemental' : 'Habilidad Definitiva');
    var brd = ab.type === 'ultimate' ? 'rgba(240,200,96,0.9)' : 'rgba(' + col + ', 0.6)';
    html += '<div class="ht-ab-item" style="border-left-color: ' + brd + ';"><div class="ht-ab-type" style="color: rgb(' + col + ');">' + icon + ' ' + name + '</div><div class="ht-ab-name">' + ab.name + '</div>';
    if (ab.cost) html += '<div class="ht-cost">' + renderCost(ab.cost) + '</div>';
    html += '</div>';
  });
  hoverTooltip.innerHTML = html; hoverTooltip.classList.add('show'); positionTooltip(hoverTooltip, card.getBoundingClientRect(), 'above');
}
function showEquipmentTooltip(anchor, cs) {
  if (!cs) return;
  var has = (cs.equipment && cs.equipment.length) || cs.paintEquipped;
  if (!has) return;
  var html = '<div class="ht-header">⚔️ Equipamiento</div><div class="ht-name">' + cs.character.name + '</div>';
  (cs.equipment || []).forEach(function(eqId){ var eq = CARD_DB[eqId]; if (!eq) return; html += '<div class="ht-ab-item" style="border-left-color: rgb(' + eq.color + ');"><div class="ht-ab-type" style="color: rgb(' + eq.color + ');">' + eq.emoji + ' ' + eq.tag + '</div><div class="ht-ab-name">' + eq.name + '</div><div class="ht-effect" style="font-size:0.75rem;">' + eq.effectText + '</div></div>'; });
  if (cs.paintEquipped) { var p = PAINT_CARDS['paint_' + cs.paintEquipped]; if (p) html += '<div class="ht-ab-item" style="border-left-color: rgb(' + p.color + ');"><div class="ht-ab-type" style="color: rgb(' + p.color + ');">🎨 Pintura</div><div class="ht-ab-name">' + p.name + '</div><div class="ht-effect" style="font-size:0.75rem;">' + p.effectText + '</div></div>'; }
  hoverTooltip.innerHTML = html; hoverTooltip.classList.add('show'); positionTooltip(hoverTooltip, anchor.getBoundingClientRect(), 'above');
}
function showSupportTooltip(anchor, sup) {
  if (!sup) return;
  var card = CARD_DB[sup.cardId]; if (!card) return;
  hoverTooltip.innerHTML = '<div class="ht-header">📜 Carta de Apoyo</div><div class="ht-name">' + card.emoji + ' ' + card.name + '</div><div class="ht-sub">' + card.tag + ' · ' + sup.duration + ' ronda(s)</div><div class="ht-effect">' + card.effectText + '</div>';
  hoverTooltip.classList.add('show'); positionTooltip(hoverTooltip, anchor.getBoundingClientRect(), 'left');
}
function showStructureTooltip(anchor, st) {
  if (!st) return;
  var html = '<div class="ht-header">🏛️ Estructura</div>';
  if (st.kind === 'optimizacion') {
    html += '<div class="ht-name">🧠 Optimización</div><div class="ht-sub">' + st.duration + ' ronda(s) · de Óliver</div><div class="ht-effect">+2 daño a ataques normales y elementales de los aliados. Inflige 1 de daño al enemigo al final de la ronda y lo marca con comprensión.</div>';
  } else if (st.kind === 'cruzMadera') {
    html += '<div class="ht-name">✝️ Cruz de Madera</div><div class="ht-sub">Estructura de Orath</div><div class="ht-effect">Causa 1 punto de daño al enemigo activo al ser destruida. Al final de la ronda, si Orath está activa, marca al enemigo activo con redención y se destruye.</div>';
  } else if (st.kind === 'cruzSangre') {
    html += '<div class="ht-name">✝️ Cruz de Sangre</div><div class="ht-sub">Estructura de Orath</div><div class="ht-effect">Se destruye si un aliado muere. Al destruirse, revive al último aliado caído con 1 HP y 2 de escudo.</div>';
  } else if (st.kind === 'mesaDJ') {
  html += '<div class="ht-name">🎧 Mesa de DJ</div><div class="ht-sub">' + st.duration + ' ronda(s) · Estructura de Neón</div><div class="ht-effect">Al final de la ronda, el aliado activo del equipo pasa al siguiente.</div>';
  }
  hoverTooltip.innerHTML = html;
  hoverTooltip.classList.add('show');
  positionTooltip(hoverTooltip, anchor.getBoundingClientRect(), 'left');
}
function showShieldTooltip(anchor, cs) {
  if (!cs) return;
  var html = '<div class="ht-header">🛡️ Escudos</div><div class="ht-name">' + cs.character.name + '</div>';
  if (!cs.shields || !cs.shields.length) html += '<div class="ht-effect">Sin escudos.</div>';
  else cs.shields.forEach(function(sh){ html += '<div class="ht-ab-item" style="border-left-color:#7ac8ff;"><div class="ht-ab-name">🛡️ ' + sh.hp + ' / ' + sh.maxHp + '</div><div class="ht-effect" style="font-size:0.72rem;">Fuente: ' + sh.source + '</div></div>'; });
  hoverTooltip.innerHTML = html; hoverTooltip.classList.add('show'); positionTooltip(hoverTooltip, anchor.getBoundingClientRect(), 'above');
}
function hideTooltip(){ if (hoverTooltip) hoverTooltip.classList.remove('show'); }

var COMBAT_SLOT_COUNT = 3;
var currentCombatSlot = null;

function getCombatSlotKey(s){ return 'azaria_saved_combat_' + currentSlotMode + '_' + s; }
function getSavedCombat(s){ try { var st = localStorage.getItem(getCombatSlotKey(s)); if (!st) return null; var p = JSON.parse(st); if (p.phase === 'ended') return null; return p; } catch (e) { return null; } }
function saveCombatToSlot(s){ if (!combatState || combatState.phase === 'ended') return; if (!currentSlotMode) return; combatState.player.dice.forEach(function(d){ d.justAdded = false; }); try { localStorage.setItem(getCombatSlotKey(s), JSON.stringify(combatState)); } catch (e) {} }
function clearCombatSlot(s){ try { localStorage.removeItem(getCombatSlotKey(s)); } catch (e) {} }
function saveCombatState(){ if (!combatState || combatState.phase === 'ended') return; if (currentCombatSlot === null) return; saveCombatToSlot(currentCombatSlot); }
function clearSavedCombat(){ if (currentCombatSlot === null) return; clearCombatSlot(currentCombatSlot); }
function findEmptyCombatSlot(){ for (var i = 0; i < COMBAT_SLOT_COUNT; i++) if (!getSavedCombat(i)) return i; return -1; }
function hasAnySavedCombat(){ for (var i = 0; i < COMBAT_SLOT_COUNT; i++) if (getSavedCombat(i)) return true; return false; }
var combatState = null;
function rollCombatDice(baseCount) { var t = CONSONANCE_ORDER, d = []; for (var i = 0; i < baseCount; i++) { if (Math.random() < 0.125) d.push({ type:'omni', id:uid() }); else d.push({ type:t[Math.floor(Math.random()*7)], id:uid() }); } return d; }
function logCombat(msg){ if (!combatState) return; combatState.log.push(msg); if (combatState.log.length > 100) combatState.log.shift(); }
function showTeamMissingToast(msg) {
  var ex = document.querySelector('.team-missing-toast'); if (ex) ex.remove();
  var toast = document.createElement('div'); toast.className = 'team-missing-toast';
  toast.innerHTML = '<span class="team-missing-toast-icon">⚠️</span>' + msg;
  document.body.appendChild(toast); playSound('warning');
  setTimeout(function(){ toast.classList.add('show'); }, 10);
  setTimeout(function(){ toast.classList.remove('show'); setTimeout(function(){ if (toast.parentNode) toast.remove(); }, 400); }, 3500);
}
function scrollToCollection(){ setTimeout(function(){ var s = document.getElementById('cartas'); if (s) s.scrollIntoView({ behavior:'smooth', block:'start' }); }, 250); }
function scrollToDeck(){ setTimeout(function(){ var s = document.getElementById('mazo'); if (s) s.scrollIntoView({ behavior:'smooth', block:'start' }); }, 300); }
function drawFromDeck(who) {
  var side = combatState[who]; if (!side.discardPile) side.discardPile = [];
  if (side.deck.length === 0) { if (side.discardPile.length > 0) { side.deck = shuffleArray(side.discardPile.slice()); side.discardPile = []; logCombat('♻️ Descarte barajado (' + side.deck.length + ')'); } else return null; }
  var cid = side.deck.shift(); side.hand.push(cid); return cid;
}
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
    var validTeam = p1Template.team.filter(function(id){ return CHARACTERS[id] && id !== 'hunger'; }).slice(0, 3);
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
    var p2Team = p2Template.team.filter(function(id){ return CHARACTERS[id] && id !== 'hunger'; }).slice(0, 3);
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
    var p1Team = t1.team.filter(function(id){ return CHARACTERS[id] && id !== 'hunger'; }).slice(0, 3);
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
      var p2Team = t2.team.filter(function(id){ return CHARACTERS[id] && id !== 'hunger'; }).slice(0, 3);
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
    if (!isRound1) applyIlusion(combatState.player, 'player');
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
    if (!isRound1) applyIlusion(combatState.bot, 'bot');
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
  combatState.player.characters.forEach(function(c){ if (COMBAT_CHARS[c.id]) c.character = COMBAT_CHARS[c.id]; if (!c.equipment) c.equipment = []; if (!c.states) c.states = {}; if (!c.marks) c.marks = {}; c.exActive = (c.id === combatState.exCharId.player); });
  combatState.bot.characters.forEach(function(c){ if (COMBAT_CHARS[c.id]) c.character = COMBAT_CHARS[c.id]; if (!c.equipment) c.equipment = []; if (!c.states) c.states = {}; if (!c.marks) c.marks = {}; c.exActive = (c.id === combatState.exCharId.bot); });
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
  var c = side.consonance; if (!c || c.type !== 'single' || c.element !== 'ilusion') return;
  var active = side.characters[side.activeIndex]; if (!active || active.dead) return;
  var el = active.character.element, m = 0;
  side.dice.forEach(function(d){ if (d.type === el) m++; else if (c.level === 2 && d.type === 'omni') m++; });
  var need = c.level === 3 ? 2 : 1, miss = need - m; if (miss <= 0) return;
  var conv = 0;
  for (var i = 0; i < side.dice.length && conv < miss; i++) if (side.dice[i].type !== el && side.dice[i].type !== 'omni') { side.dice[i] = { type:el, id:side.dice[i].id }; conv++; }
  if (c.level === 3) for (var j = 0; j < side.dice.length && conv < miss; j++) if (side.dice[j].type === 'omni') { side.dice[j] = { type:el, id:side.dice[j].id }; conv++; }
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
      });
    });
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
  // ✅ Neón: Scratch +1 dado de ilusión si Mesa de DJ está activa
  if (active.id === 'neon' && ability.kind === 'scratch') {
    var sdNeon = (combatState.player.characters.indexOf(active) >= 0) ? combatState.player : combatState.bot;
    var hasMesaN = sdNeon.structures && sdNeon.structures.some(function(s){ return s.kind === 'mesaDJ'; });
    if (hasMesaN) {
      var cNeon = {};
      Object.keys(base).forEach(function(k){ cNeon[k] = base[k]; });
      cNeon.ilusion = (cNeon.ilusion || 0) + 1;
      return cNeon;
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
  var shouldEndTurn = true;
  var pendingBuffConsumed = false;

  if (actionType === 'ultimate') {
    side.characters.forEach(function(ally) {
      if (ally.id === 'eloy' && !ally.dead && ally !== active) {
        var pE = ally.energy;
        ally.energy = Math.min(ally.maxEnergy, ally.energy + 1);
        if (ally.energy > pE) logCombat('⚡ Eloy gana 1 energía (Sincronía Cognitiva)');
      }
    });
  }

  switch (ability.kind) {
    case 'carrerilla': {
      csSetState(active, 'carrerilla', true);
      logCombat('🏃 Carrerilla: siguiente ataque +2 daño · +1 energía extra si es normal');
      break;
    }
    case 'estratosfera': {
      var wasInVuelo = csHasState(active, 'vuelo');
      if (!wasInVuelo) {
        csSetState(active, 'vuelo', true);
        logCombat('🦅 Artemis entra en Vuelo');
      } else {
        var carrerillaBonus = 0;
        if (csHasState(active, 'carrerilla')) {
          carrerillaBonus = 2;
          csSetState(active, 'carrerilla', false);
          logCombat('🏃 Carrerilla: +2 daño a cada enemigo');
        }
        var hitCount = 0;
        var exEstratosfera = (active.exActive) ? 2 : 0; // ✅ EX: +2 daño base
        var estratosferaDmg = 6 + carrerillaBonus + exEstratosfera;
        enemySide.characters.forEach(function(c, i){
          if (c.dead) return;
          applyDamageWithMods(c, estratosferaDmg, false, enemyKey, i, active);
          hitCount++;
          if (!c.dead) triggerMarkOrResonance(c, 'aceptacion', who, enemyKey, i);
        });
        logCombat('💥 Estratosfera: ' + estratosferaDmg + ' daño a ' + hitCount + ' enemigo(s)');
        if (!active.dead) {
          active.hp = 0;
          handleDeath(who, side.activeIndex);
          logCombat('💀 Artemis muere por el precio de su definitiva');
        }
      }
      break;
    }
    case 'damage': {
      var dmg = ability.damage || 0;
      var carrerillaEnergyBonus = 0;
      if (active.id === 'artemis' && csHasState(active, 'carrerilla')) {
        dmg += 2;
        csSetState(active, 'carrerilla', false);
        logCombat('🏃 Carrerilla: +2 daño');
        if (actionType === 'normal') carrerillaEnergyBonus = 1;
      }
      dmg = applyGenericDamageMods(active, dmg, actionType === 'elemental');
      if (active.pendingBuff) pendingBuffConsumed = true;
      if (actionType === 'normal' || actionType === 'elemental') { var ob = getOptimizationBonus(side); if (ob > 0) { dmg += ob; logCombat('🏛️ Optimización: +' + ob); } }
      if (actionType === 'ultimate' && side.obraMaestraTurns > 0) { dmg *= 2; logCombat('💥 Obra Maestra: daño x2'); }
      if (active.id === 'erik') { var eb = applyErikPassive(active); if (eb > 0) { dmg += eb; logCombat('🩸 Inspiración: +' + eb); } }
      if (active.id === 'eevee' && csHasState(active, 'furia') && active.states.furiaTarget === enemyActive.id && actionType === 'normal') { dmg += 1; logCombat('🔥 Furia: +1'); }
      applyDamageWithMods(enemyActive, dmg, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
      if (carrerillaEnergyBonus > 0 && !active.dead) {
        var pe = active.energy;
        active.energy = Math.min(active.maxEnergy, active.energy + carrerillaEnergyBonus);
        if (active.energy > pe) logCombat('🏃 Carrerilla: +' + (active.energy - pe) + ' energía extra');
      }
      break;
    }
    case 'autolesion': {
      active.hp = Math.max(0, active.hp - (ability.selfDamage || 1));
      logCombat('🩸 ' + active.character.name + ' se autolesiona ' + (ability.selfDamage || 1));
      if (active.hp <= 0) { handleDeath(who, side.activeIndex); }
      else if (active.id === 'alaya' && csHasState(active, 'castigada')) { active.states.condena = (active.states.condena || 0) + 1; logCombat('💀 Alaya gana 1 condena · Total: ' + active.states.condena); }
      playSound('impact');
      break;
    }
    case 'penitencia': {
      active.states = active.states || {}; active.states.castigada = true;
      active.marks = {}; active.states.vulnerable = false; active.states.amenaza = false;
      logCombat('🩸 ' + active.character.name + ' entra en Castigada');
      break;
    }
    case 'finComienzo': {
      var condena = active.states && active.states.condena ? active.states.condena : 0;
      logCombat('💥 Condena acumulada: ' + condena);

      // Referencia estable al objetivo ANTES de cualquier cambio de estado
      var targetCs = enemySide.characters[enemySide.activeIndex];

      // Daño penetrante = condena. Si condena = 0 no hace daño.
      if (condena > 0 && targetCs && !targetCs.dead) {
        applyDamageWithMods(targetCs, condena, true, enemyKey, enemySide.activeIndex, active);
        logCombat('💥 Daño de condena: ' + condena + ' (penetrante)');
      } else {
        logCombat('⚠️ Alaya no tiene condena: no inflige daño');
      }

      // Reset SIEMPRE
      if (active.states) active.states.condena = 0;

      // Marcar con redención a TODOS los enemigos vivos (independientemente del resultado)
      var markedCount = 0;
      enemySide.characters.forEach(function(c, i){
        if (!c.dead) {
          triggerMarkOrResonance(c, 'redencion', who, enemyKey, i);
          markedCount++;
        }
      });
      logCombat('🏷️ Marcados con redención: ' + markedCount + ' enemigo(s)');

      // Comprobar si el OBJETIVO murió → si sobrevive, Alaya muere
      var targetDied = targetCs ? (targetCs.dead || targetCs.hp <= 0) : true;
      if (!targetDied && !active.dead) {
        active.hp = 0;
        handleDeath(who, side.activeIndex);
        logCombat('💀 ' + active.character.name + ' muere por el precio de su definitiva (' + targetCs.character.name + ' sobrevivió)');
      } else if (targetDied) {
        logCombat('✅ ' + targetCs.character.name + ' ha caído: Alaya sobrevive');
      }
      break;
    }
    case 'trazoVivo': {
      var paint = active.paintEquipped;
      var baseDmg = ability.damage || 1;
      if (paint === 'roja') { baseDmg += 2; logCombat('🎨 Pintura Roja: +2'); }
      baseDmg = applyGenericDamageMods(active, baseDmg);
      if (active.pendingBuff) pendingBuffConsumed = true;
      if (actionType === 'normal') { var ob2 = getOptimizationBonus(side); if (ob2 > 0) { baseDmg += ob2; logCombat('🏛️ Optimización: +' + ob2); } }
      var eb2 = applyErikPassive(active); if (eb2 > 0) { baseDmg += eb2; logCombat('🩸 Inspiración: +' + eb2); }
      applyDamageWithMods(enemyActive, baseDmg, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
      if (paint === 'azul') { addOrRefreshShield(active, 'erik_paint_azul', 1); logCombat('🎨 Pintura Azul: +1 escudo'); }
      if (paint === 'verde') { healChar(active, 2); logCombat('🎨 Pintura Verde: cura 2'); }
      if (!paint) { if (!enemyActive.dead) triggerMarkOrResonance(enemyActive, 'expresion', who, enemyKey, enemySide.activeIndex); }
      if (paint) { active.paintEquipped = null; logCombat('🎨 La pintura se ha consumido'); }
      break;
    }
    case 'interpretacion': {
      active.hp = Math.max(0, active.hp - 1); logCombat('🩸 ' + active.character.name + ' pierde 1 HP');
      if (active.hp <= 0) handleDeath(who, side.activeIndex);
      ['paint_roja', 'paint_azul', 'paint_verde'].forEach(function(pid){ if (!side.hand) side.hand = []; side.hand.push(pid); logCombat('🎨 Generada: ' + PAINT_CARDS[pid].name); });
      break;
    }
    case 'lienzoSangre': {
      var pR = 0, pA = 0, pV = 0;
      if (!side.hand) side.hand = [];
      for (var pi = side.hand.length - 1; pi >= 0; pi--) { var cid = side.hand[pi]; if (cid === 'paint_roja') { pR++; side.hand.splice(pi, 1); } else if (cid === 'paint_azul') { pA++; side.hand.splice(pi, 1); } else if (cid === 'paint_verde') { pV++; side.hand.splice(pi, 1); } }
      if (pR > 0) { applyDamageWithMods(enemyActive, pR, false, enemyKey, enemySide.activeIndex, active); logCombat('🔴 ' + pR + ' daño por pinturas rojas'); }
      if (pA > 0) { var hs = healShieldBy(active, pA); logCombat('🔵 Escudo +' + hs + ' HP'); }
      if (pV > 0) { healChar(active, pV); logCombat('🟢 Cura ' + pV); }
      if (!pR && !pA && !pV) logCombat('❌ No había pinturas en la mano');
      break;
    }
    case 'intervencion': {
      var d2 = ability.damage || 2;
      if (csHasState(enemyActive, 'amenaza')) { d2 += 1; csSetState(enemyActive, 'amenaza', false); logCombat('🚨 Amenaza: +1 daño, ya no es Amenaza'); }
      d2 = applyGenericDamageMods(active, d2);
      if (active.pendingBuff) pendingBuffConsumed = true;
      if (actionType === 'normal') { var ob3 = getOptimizationBonus(side); if (ob3 > 0) { d2 += ob3; logCombat('🏛️ Optimización: +' + ob3); } }
      applyDamageWithMods(enemyActive, d2, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
      break;
    }
    case 'bajoAlas': {
      var allies = side.characters.filter(function(c){ return !c.dead && c.id !== 'tenshi'; });
      if (!allies.length) { logCombat('❌ No hay aliados a proteger'); break; }
      allies.sort(function(a, b){ return a.hp - b.hp; });
      csSetState(allies[0], 'vulnerable', true);
      logCombat('💔 ' + allies[0].character.name + ' es Vulnerable');
      break;
    }
    case 'suficiente': {
      var amz = enemySide.characters.filter(function(c){ return !c.dead && csHasState(c, 'amenaza'); });
      if (!amz.length) logCombat('❌ No hay Amenazas');
      amz.forEach(function(cs){
        applyDamageWithMods(cs, 3, true, enemyKey, enemySide.characters.indexOf(cs), active);
        csSetState(cs, 'amenaza', false);
        if (!cs.dead) triggerMarkOrResonance(cs, 'proteccion', who, enemyKey, enemySide.characters.indexOf(cs));
      });
      if (amz.length) logCombat('🚨 Amenazas dejan de ser Amenaza');
      var vuln = side.characters.filter(function(c){ return !c.dead && csHasState(c, 'vulnerable'); });
      vuln.forEach(function(c){ addOrRefreshShield(c, 'tenshi_ultimate', 3); });
      if (vuln.length) logCombat('🛡️ ' + vuln[0].character.name + ' +3 escudo');
      break;
    }
    case 'hipotesisSolida': { addOrRefreshShield(active, 'eloy_hipotesis', 2); active.states = active.states || {}; active.states.hipotesisShieldActive = true; logCombat('🛡️ +2 escudo (Hipótesis Sólida)'); break; }
    case 'conclusion': { side.characters.forEach(function(cs){ if (cs === active || cs.dead) return; addOrRefreshShield(cs, 'eloy_conclusion', 1); cs.energy = Math.min(cs.maxEnergy, cs.energy + 1); }); logCombat('🛡️ Aliados +1 escudo y +1 energía'); break; }
    case 'defensaActiva': { csSetState(active, 'defensaActiva', true); logCombat('💠 Defensa Activa'); break; }
    case 'contraofensiva': {
      var dmgC = 3;
      if (csHasState(active, 'furia')) { dmgC = 5; if (active.states && active.states.furiaTarget === enemyActive.id) dmgC = 6; }
      applyDamageWithMods(enemyActive, dmgC, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
      if (active.states && active.states.furiaTarget === enemyActive.id && !enemyActive.dead) triggerMarkOrResonance(enemyActive, 'proteccion', who, enemyKey, enemySide.activeIndex);
      break;
    }
    case 'conversionPsicologica': {
      // +1 invulnerabilidad (máx 3)
      var invBefore = (active.states && active.states.invulnerabilidad) || 0;
      var invAfter = Math.min(3, invBefore + 1);
      csSetState(active, 'invulnerabilidad', invAfter);
      logCombat('🛡️ Alter: invulnerabilidad ' + invBefore + ' → ' + invAfter);

      // Robar toda la energía de los aliados
      var stolenEnergy = 0;
      side.characters.forEach(function(ally){
        if (ally === active || ally.dead) return;
        if (ally.energy > 0) {
          stolenEnergy += ally.energy;
          logCombat('🔮 ' + ally.character.name + ' pierde ' + ally.energy + ' energía');
          ally.energy = 0;
        }
      });

      if (stolenEnergy === 0) {
        logCombat('🔮 No había energía que robar');
      } else {
        // ✅ Alter gana energía hasta su máximo (3). El sobrante se convierte
        // en dados de ilusión (siempre, sin necesidad de EX).
        var roomForEnergy = Math.max(0, active.maxEnergy - active.energy);
        var energyGained = Math.min(roomForEnergy, stolenEnergy);
        var overflow = stolenEnergy - energyGained;
        active.energy += energyGained;
        if (energyGained > 0) logCombat('🔮 Alter recupera ' + energyGained + ' energía (total: ' + active.energy + '/' + active.maxEnergy + ')');
        if (overflow > 0) {
          for (var di = 0; di < overflow; di++) {
            side.dice.push({ type:'ilusion', id:uid(), justAdded:true });
          }
          logCombat('🔮 ' + overflow + ' energía sobrante → ' + overflow + ' dado(s) de ilusión');
        }
      }
      break;
    }
    case 'omnesDeam': {
      // +3 daño a elementales del resto del equipo durante 2 rondas.
      // Si ya había un bono activo, se acumula el daño y se refresca a 2 rondas.
      if (!side.alterUltBuff) side.alterUltBuff = { amount: 0, roundsLeft: 0 };
      side.alterUltBuff.amount = (side.alterUltBuff.amount || 0) + 3;
      side.alterUltBuff.roundsLeft = 2;
      logCombat('💥 Omnes Deam Salutate: +' + side.alterUltBuff.amount + ' daño a elementales del equipo (2 rondas)');
      break;
    }
    case 'inconsistencia': {
      // ✅ Buff de Alter: +3 al daño base si es elemental y hay buff activo
      var incDmg = 2;
      if (actionType === 'elemental' && side.alterUltBuff && side.alterUltBuff.amount > 0 && side.alterUltBuff.roundsLeft > 0 && active.id !== 'alter') {
        incDmg += side.alterUltBuff.amount;
        logCombat('💥 Omnes Deam Salutate: +' + side.alterUltBuff.amount + ' daño');
      }
      applyDamageWithMods(enemyActive, incDmg, true, enemyKey, enemySide.activeIndex, active);
      var nx = getNextAliveIndex(enemySide, enemySide.activeIndex);
      if (nx >= 0) { enemySide.activeIndex = nx; logCombat('🔄 Enemigo forzado a ' + enemySide.characters[nx].character.name); triggerMarkOrResonance(enemySide.characters[nx], 'ilusion', who, enemyKey, nx); }
      var rsv = getNextAliveIndex(side, side.activeIndex);
      if (rsv >= 0) { logCombat('👻 Paso Fantasma: Ren a reserva'); side.activeIndex = rsv; triggerKillerTunesDamage(who); }
      break;
    }
    case 'destruccionLogica': {
      if (!enemyActive.dead) triggerMarkOrResonance(enemyActive, 'ilusion', who, enemyKey, enemySide.activeIndex);
      applyDamageWithMods(enemyActive, 3, true, enemyKey, enemySide.activeIndex, active);
      var nx2 = getNextAliveIndex(enemySide, enemySide.activeIndex);
      if (nx2 >= 0) { enemySide.activeIndex = nx2; logCombat('🔄 Enemigo forzado'); }
      var rsv2 = getNextAliveIndex(side, side.activeIndex);
      if (rsv2 >= 0) { logCombat('👻 Paso Fantasma: Ren a reserva'); side.activeIndex = rsv2; triggerKillerTunesDamage(who); }
      break;
    }
    case 'ecoVital': { side.characters.forEach(function(cs){ if (cs === active || cs.dead) return; healChar(cs, 2); csSetState(cs, 'sintonia', true); }); logCombat('🎵 Aliados +2 HP y en Sintonía'); break; }
    case 'armonia': {
      var sint = side.characters.filter(function(c){ return c !== active && !c.dead && csHasState(c, 'sintonia'); }).length;
      var healAmt = Math.max(0, 5 - sint);
      csSetState(active, 'sintonia', true);
      healChar(active, healAmt);
      if (!enemyActive.dead) triggerMarkOrResonance(enemyActive, 'proteccion', who, enemyKey, enemySide.activeIndex);
      logCombat('🎵 Armonía: cura ' + healAmt + ' y marca protección');
      break;
    }
    case 'deudaSangre': {
      var baseDeuda = applyGenericDamageMods(active, 3, actionType === 'elemental');
      var dealt = applyDamageWithMods(enemyActive, baseDeuda, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
      if (!enemyActive.dead) {
        enemyActive.states = enemyActive.states || {};
        enemyActive.states.rencor = (enemyActive.states.rencor || 0) + 1;
        logCombat('💢 ' + enemyActive.character.name + ' acumula Rencor (' + enemyActive.states.rencor + ')');
      }
      logCombat('🩸 Deuda de Sangre: ' + baseDeuda + ' daño');
      if (dealt > 0) {
        // ✅ El daño verdadero puede superar 3 por bonos, pero la curación
        // por la habilidad misma tiene tope de 3 HP (daño base de la habilidad).
        // Los bonos de curación se aplican después del tope.
        var healFromAbility = Math.min(dealt, 3);
        // Bonos de curación (equipo, apoyos, etc.)
        var healBonus = 0;
        if (active && active.equipment) active.equipment.forEach(function(eqId){
          var eq = CARD_DB[eqId]; if (eq && eq.effect && eq.effect.healBonus) healBonus += eq.effect.healBonus;
        });
        // (Añadir aquí más fuentes de bonos de curación si las hubiera en el futuro)
        var totalHeal = healFromAbility + healBonus;
        if (totalHeal > 0) {
          var healed = healChar(active, totalHeal);
          logCombat('🩸 Deuda de Sangre: +' + healed + ' HP' + (healBonus > 0 ? ' (incluye +' + healBonus + ' de bonos)' : ''));
        }
      }
      break;
    }
    case 'retribucionFinal': {
      var totalHits = 0;
      enemySide.characters.forEach(function(cs){
        if (cs.dead || !cs.states || !cs.states.rencor) return;
        var acum = cs.states.rencor;
        var dmg = 3 + Math.max(0, acum - 1);
        applyDamageWithMods(cs, dmg, false, enemyKey, enemySide.characters.indexOf(cs), active);
        cs.states.rencor = 0;
        totalHits++;
        logCombat('💥 ' + cs.character.name + ' recibe ' + dmg + ' de Retribución Final (consumido Rencor)');
      });
      if (totalHits === 0) logCombat('❌ Ningún enemigo tenía Rencor');
      break;
    }
    case 'degradacion': {
      var self = 2 + (active.manuelStacks || 0);
      active.hp = Math.max(0, active.hp - self);
      logCombat('🩸 Autolesión ' + self);
      if (active.hp <= 0) { handleDeath(who, side.activeIndex); break; }
      // ✅ Buff de Alter: +3 al daño base si es elemental y hay buff activo
      var degDmg = 4 + (active.manuelStacks || 0);
      if (actionType === 'elemental' && side.alterUltBuff && side.alterUltBuff.amount > 0 && side.alterUltBuff.roundsLeft > 0 && active.id !== 'alter') {
        degDmg += side.alterUltBuff.amount;
        logCombat('💥 Omnes Deam Salutate: +' + side.alterUltBuff.amount + ' daño');
      }
      applyDamageWithMods(enemyActive, degDmg, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
      if (!enemyActive.dead) triggerMarkOrResonance(enemyActive, 'redencion', who, enemyKey, enemySide.activeIndex);
      active.manuelStacks = 0;
      enemySide.characters.forEach(function(c){ csRemoveMark(c, 'redencion'); });
      break;
    }
    case 'decadencia': { active.manuelStacks = (active.manuelStacks || 0) + 1; logCombat('📈 Manuel acumula +1 (stack ' + active.manuelStacks + ')'); break; }
    case 'aceleron': {
      var isAcel = csHasState(active, 'acelerado'); var dmgA = 2 + (isAcel ? 1 : 0); dmgA = applyGenericDamageMods(active, dmgA);
      if (active.pendingBuff) pendingBuffConsumed = true;
      if (actionType === 'normal') { var ob4 = getOptimizationBonus(side); if (ob4 > 0) { dmgA += ob4; logCombat('🏛️ Optimización: +' + ob4); } }
      applyDamageWithMods(enemyActive, dmgA, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
      if (isAcel && !enemyActive.dead) triggerMarkOrResonance(enemyActive, 'transformacion', who, enemyKey, enemySide.activeIndex);
      break;
    }
    case 'impulso': {
      active.pendingBuff = (active.pendingBuff || 0) + 2;
      logCombat('💪 Impulso: +2 al siguiente ataque normal (persiste hasta consumirse)');
      var jr = getNextAliveIndex(side, side.activeIndex);
      if (jr >= 0) { logCombat('🦋 Jose a reserva'); side.activeIndex = jr; triggerKillerTunesDamage(who); shouldEndTurn = false; }
      break;
    }
    case 'instinto': {
      var isAc2 = csHasState(active, 'acelerado'); var dmgI = 3 + (isAc2 ? 2 : 0); dmgI = applyGenericDamageMods(active, dmgI);
      if (active.pendingBuff) pendingBuffConsumed = true;
      if (side.obraMaestraTurns > 0) { dmgI *= 2; logCombat('💥 Obra Maestra: daño x2'); }
      applyDamageWithMods(enemyActive, dmgI, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
      if (isAc2 && !enemyActive.dead) triggerMarkOrResonance(enemyActive, 'transformacion', who, enemyKey, enemySide.activeIndex);
      break;
    }
    case 'reescritura': {
      var destroyed = false, restored = false;
      for (var si = 0; si < 4; si++) { if (side.supports && side.supports[si]) { var spc = CARD_DB[side.supports[si].cardId]; if (spc && spc.duration) { side.supports[si].duration = spc.duration; restored = true; logCombat('📜 ' + spc.name + ' restablecido a ' + spc.duration + ' rondas'); } break; } }
      if (side.structures) {
        for (var sti = 0; sti < side.structures.length; sti++) {
          if (side.structures[sti].kind === 'optimizacion') { side.structures[sti].duration = 2; restored = true; logCombat('🏛️ Optimización restablecida a 2 rondas'); break; }
        }
      }
      for (var ei = 0; ei < 4; ei++) { if (enemySide.supports && enemySide.supports[ei]) { logCombat('📜 Apoyo enemigo destruido'); enemySide.supports[ei] = null; destroyed = true; break; } }
      if (!destroyed && !enemyActive.dead) triggerMarkOrResonance(enemyActive, 'expresion', who, enemyKey, enemySide.activeIndex);
      break;
    }
    case 'canon': {
      var dc = 0;
      for (var di = side.deck.length - 1; di >= 0 && dc < 3; di--) {
        var cid2 = side.deck[di]; var c2 = CARD_DB[cid2];
        if (c2 && c2.category === 'apoyo') { side.hand.push(cid2); side.deck.splice(di, 1); dc++; logCombat('📜 Robas ' + c2.name); }
      }
      if (side.supports) {
        side.supports.forEach(function(sp){
          if (!sp) return;
          var sc = CARD_DB[sp.cardId]; if (!sc || !sc.effect) return;
          var e = sc.effect;
          var activated = false;
          if (e.shieldInstant && active && !active.dead) { addOrRefreshShield(active, 'canon_' + sc.id + '_' + uid(), e.shieldInstant); activated = true; }
          if (e.teamShieldInstant) { side.characters.forEach(function(c){ if (!c.dead) addOrRefreshShield(c, 'canon_' + sc.id + '_' + uid(), e.teamShieldInstant); }); activated = true; }
          if (e.healPerRound && active && !active.dead) { healChar(active, e.healPerRound); activated = true; }
          if (e.shieldPerRound && active && !active.dead) { addOrRefreshShield(active, 'canon_' + sc.id + '_' + uid(), e.shieldPerRound); activated = true; }
          if (e.teamShieldPerRound) { side.characters.forEach(function(c){ if (!c.dead) addOrRefreshShield(c, 'canon_' + sc.id + '_' + uid(), e.teamShieldPerRound); }); activated = true; }
          if (e.teamHealPerRound) { side.characters.forEach(function(cs){ if (!cs.dead) healChar(cs, e.teamHealPerRound); }); activated = true; }
          if (e.energyPerRound && active && !active.dead) { active.energy = Math.min(active.maxEnergy, active.energy + e.energyPerRound); activated = true; }
          if (e.teamEnergyPerRound) { side.characters.forEach(function(c){ if (!c.dead) c.energy = Math.min(c.maxEnergy, c.energy + e.teamEnergyPerRound); }); activated = true; }
          if (e.drawPerRound) { for (var d = 0; d < e.drawPerRound; d++) drawFromDeck(who); activated = true; }
          if (e.elementDiePerRound && active && !active.dead) { for (var ei3 = 0; ei3 < e.elementDiePerRound; ei3++) side.dice.push({ type:active.character.element, id:uid(), justAdded:true }); activated = true; }
          if (e.omniDiePerRound) { for (var oi = 0; oi < e.omniDiePerRound; oi++) side.dice.push({ type:'omni', id:uid(), justAdded:true }); activated = true; }
          if (activated) logCombat('📜 Canon activa: ' + sc.name);
        });
      }
      break;
    }
    case 'optimizacion': {
      if (!side.structures) side.structures = [];
      var existing = null;
      for (var si2 = 0; si2 < side.structures.length; si2++) { if (side.structures[si2].kind === 'optimizacion') { existing = side.structures[si2]; break; } }
      if (existing) { existing.duration = Math.min(3, existing.duration + 1); logCombat('🏛️ Optimización extendida a ' + existing.duration + ' rondas'); }
      else { side.structures.push({ kind:'optimizacion', duration:2 }); logCombat('🏛️ Optimización colocada (2 rondas)'); }
      break;
    }
    case 'obraMaestra': {
      var hasOptim = side.structures && side.structures.some(function(st){ return st.kind === 'optimizacion'; });
      if (!hasOptim) { logCombat('❌ Obra Maestra requiere la estructura de Optimización en el campo'); shouldEndTurn = false; break; }
      side.obraMaestraTurns = 2;
      logCombat('💥 Obra Maestra activa durante 2 rondas: definitivas x2 daño');
      break;
    }
    case 'ojoPorOjo': {
      var crucesP = countCruzMadera(side);
      var dmgO = 1 + crucesP;
      logCombat('✝️ Ojo por ojo: ' + crucesP + ' cruz(es) → ' + dmgO + ' daño');
      dmgO = applyGenericDamageMods(active, dmgO);
      applyDamageWithMods(enemyActive, dmgO, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
      break;
    }
    case 'minutoSilencio': {
      addOrRefreshShield(active, 'orath_minuto', 2);
      csSetState(active, 'minutoSilencioShield', true);
      logCombat('🔮 Minuto de silencio: +2 escudo (se desvanece al final de la ronda)');
      break;
    }
    case 'diosTeAmpare': {
      // Destruye TODAS las Cruces de Madera del campo (ambos lados).
      // IMPORTANTE: NO usar { silent:true }, porque cada cruz debe infligir
      // su propio daño (1 al enemigo activo del dueño de la cruz) al destruirse.
      // Ese daño es de la ESTRUCTURA, no de la definitiva.
      var countP = destroyAllCruzMadera('player');
      var countB = destroyAllCruzMadera('bot');
      var total = countP + countB;
      logCombat('💥 Dios te ampare: ' + total + ' Cruz(es) de Madera destruida(s)');
      // Daño ADICIONAL de la definitiva: 1 a cada enemigo en reserva por cada cruz
      var reserva = enemySide.characters.filter(function(c, i){ return !c.dead && i !== enemySide.activeIndex; });
      reserva.forEach(function(c){
        var i = enemySide.characters.indexOf(c);
        applyDamageWithMods(c, total, false, enemyKey, i, active);
      });
      if (reserva.length) logCombat('💥 ' + total + ' daño adicional a ' + reserva.length + ' enemigo(s) en reserva');
      break;
    }
    case 'ex': {
      // Activa la pasiva EX del personaje para el resto de la partida.
      // No es una acción que "se gasta": es un interruptor que se enciende
      // y se queda encendido hasta que el personaje muera.
      // Los hooks (exHook*) consultan active.exActive para saber si aplican.
      active.exActive = true;
      logCombat('🌟 EX activada (pasiva permanente): ' + (ability.name || 'Habilidad EX') + ' de ' + active.character.name);
      // NOTA: si la EX debe tener un efecto inmediato al activarse (ej: curar 2 HP
      // al activar), añádelo aquí. Los efectos continuos van en los hooks exHook*.
      break;
    }
    case 'graciaPicara': {
      // ✅ Ataque normal de Adela: se considera DAÑO DE HABILIDAD ELEMENTAL
      // a efectos de bonos (Alter, etc.), aunque actionType sea 'normal'.
      var gpDmg = 1 + adelaEffectBonus(active);
      gpDmg = applyGenericDamageMods(active, gpDmg, true); // isElemental = true
      var gpDealt = applyDamageWithMods(enemyActive, gpDmg, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
      if (gpDealt > 0) {
        var gpHeal = 1 + adelaEffectBonus(active);
        healChar(active, gpHeal);
        logCombat('🩸 Gracia Pícara: cura ' + gpHeal + ' HP');
      }
      break;
    }
    case 'flechazoTentador': {
      // Adela: si el enemigo estaba marcado, quita la marca y le causa
      // 2 (+1 si Adela tiene marca) de daño penetrante.
      // SIEMPRE marca con Transformación al enemigo (si sobrevive), con o sin daño.
      var ftDmg = 2 + adelaEffectBonus(active);
      var ftHadMark = csAllMarks(enemyActive).length > 0;
      if (ftHadMark) {
        var oldMarks = csAllMarks(enemyActive);
        oldMarks.forEach(function(el){ csRemoveMark(enemyActive, el); });
        logCombat('🏷️ Flechazo Tentador: marca quitada (' + oldMarks.map(function(e){ return ELEMENT_EMOJI[e]; }).join(' ') + ')');
        applyDamageWithMods(enemyActive, ftDmg, true, enemyKey, enemySide.activeIndex, active);
      }
      // ✅ Marcar SIEMPRE con Transformación (si el enemigo sigue vivo)
      if (!enemyActive.dead) triggerMarkOrResonance(enemyActive, 'transformacion', who, enemyKey, enemySide.activeIndex);
      break;
    }
    case 'misModales': {
      // Adela: si no estaba marcada, se marca con Transformación y pasa a 5 HP. Si estaba marcada con Transformación, 4 (+1 si marca) de daño. Si marcada con otro, se suicida.
      var mmMarks = csAllMarks(active);
      if (mmMarks.length === 0) {
        triggerMarkOrResonance(active, 'transformacion', who, who, side.activeIndex);
        var targetHp = 5;
        active.hp = Math.min(targetHp, active.maxHp);
        logCombat('💥 Mis Modales en el Suelo: Adela se marca y pasa a ' + active.hp + ' HP');
      } else if (mmMarks.indexOf('transformacion') !== -1) {
        var mmDmg = 4 + adelaEffectBonus(active);
        applyDamageWithMods(enemyActive, mmDmg, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
      } else {
        // Marcada con otro elemento → se suicida
        active.hp = 0;
        logCombat('💀 Adela se suicida (marcada con ' + mmMarks.map(function(e){ return ELEMENT_EMOJI[e]; }).join(' ') + ')');
        handleDeath(who, side.activeIndex);
      }
      break;
    }
    case 'muereNormal': {
      // Hunger: 1 daño, +1 si el enemigo está marcado. Multiplicado x2 si Hunger tiene marca.
      var mnDmg = 1 + (hasAnyMark(enemyActive) ? 1 : 0);
      mnDmg = mnDmg * hungerMarkMultiplier(active);
      applyDamageWithMods(enemyActive, mnDmg, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
      break;
    }
    case 'muereElemental': {
      // Hunger: si el enemigo estaba marcado, quita la marca y 2 de daño penetrante. Luego marca con Transformación. Fuerza cambio de enemigo.
      var meDmg = 2 * hungerMarkMultiplier(active);
      var meHadMark = csAllMarks(enemyActive).length > 0;
      if (meHadMark) {
        var oldMe = csAllMarks(enemyActive);
        oldMe.forEach(function(el){ csRemoveMark(enemyActive, el); });
        logCombat('🏷️ MUERE: marca quitada (' + oldMe.map(function(e){ return ELEMENT_EMOJI[e]; }).join(' ') + ')');
        applyDamageWithMods(enemyActive, meDmg, true, enemyKey, enemySide.activeIndex, active);
      }
      if (!enemyActive.dead) triggerMarkOrResonance(enemyActive, 'transformacion', who, enemyKey, enemySide.activeIndex);
      var meNext = getNextAliveIndex(enemySide, enemySide.activeIndex);
      if (meNext >= 0) { enemySide.activeIndex = meNext; logCombat('🔄 Enemigo forzado a ' + enemySide.characters[meNext].character.name); }
      break;
    }
    case 'miCordura': {
      // Hunger: si no está marcada con Transformación, se marca y se cura al máximo. Si lo está, 4 daño (x2 si marca).
      var mcMarks = csAllMarks(active);
      if (mcMarks.indexOf('transformacion') === -1) {
        triggerMarkOrResonance(active, 'transformacion', who, who, side.activeIndex);
        var beforeHp = active.hp;
        active.hp = active.maxHp;
        logCombat('💥 Mi cordura: Hunger se marca y se cura ' + (active.hp - beforeHp) + ' HP (total ' + active.hp + '/' + active.maxHp + ')');
      } else {
        var mcDmg = 4 * hungerMarkMultiplier(active);
        applyDamageWithMods(enemyActive, mcDmg, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
      }
      break;
    }
    case 'dagaDeOla': {
      // 3 daño + escudo propio (1). Con EX, +1 dado menos (gestionado en getEffectiveCostFull)
      // y daño x2.
      var ddBase = 3;
      var ddExMult = 1;
      if (active.id === 'internet' && active.exActive && active.hp <= 2) {
        ddExMult = 2;
      }
      var ddDmg = ddBase * ddExMult;
      applyDamageWithMods(enemyActive, ddDmg, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
      addOrRefreshShield(active, 'internet_daga', 1);
      logCombat('🌊 Daga de Ola: +1 escudo a Internet');
      break;
    }
    case 'faseDeLimpieza': {
      // 2 daño a todo el equipo rival. Si no se derrota al activo, Internet recibe 2 de daño.
      // Si se derrota al activo, roba 1 carta.
      var fdlDmg = 2;
      var fdlExMult = 1;
      if (active.id === 'internet' && active.exActive && active.hp <= 2) {
        fdlExMult = 2;
      }
      fdlDmg *= fdlExMult;
      var fdlActiveDead = false;
      enemySide.characters.forEach(function(c, i){
        if (c.dead) return;
        var wasActive = (i === enemySide.activeIndex);
        applyDamageWithMods(c, fdlDmg, predictPiercing(active, ability), enemyKey, i, active);
        if (wasActive && c.dead) fdlActiveDead = true;
      });
      if (!fdlActiveDead && !active.dead) {
        // No se derrotó al activo → Internet recibe 2 de daño
        var fdlSide = (combatState.player.characters.indexOf(active) >= 0) ? combatState.player : combatState.bot;
        var fdlSideKey = (combatState.player.characters.indexOf(active) >= 0) ? 'player' : 'bot';
        var fdlIdx = fdlSide.characters.indexOf(active);
        dealDamageToChar(active, 2, { targetSide:fdlSide, targetSideKey:fdlSideKey, targetIdx:fdlIdx });
        logCombat('💥 Fase de Limpieza: Internet recibe 2 de daño por no derrotar al activo');
      } else if (fdlActiveDead) {
        // Se derrotó al activo → roba 1 carta
        drawFromDeck(who);
        logCombat('🎴 Fase de Limpieza: robas 1 carta por derrotar al activo');
      }
      break;
    }
    case 'scratch': {
      var scratchDmg = 1;
      if (combatState.environment && combatState.environment.id === 'sobrecarga_epileptica') {
        scratchDmg += 1;
        logCombat('⚡ Scratch: +1 daño (Sobrecarga Epiléptica)');
      }
      var hasMesaScratch = side.structures && side.structures.some(function(s){ return s.kind === 'mesaDJ'; });
      if (hasMesaScratch) {
        scratchDmg += 1;
        logCombat('🎧 Scratch: +1 daño (Mesa de DJ)');
      }
      scratchDmg = applyGenericDamageMods(active, scratchDmg);
      if (active.pendingBuff) pendingBuffConsumed = true;
      if (actionType === 'normal') { var obScr = getOptimizationBonus(side); if (obScr > 0) { scratchDmg += obScr; logCombat('🏛️ Optimización: +' + obScr); } }
      applyDamageWithMods(enemyActive, scratchDmg, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
      break;
    }
    case 'remix': {
      if (!side.structures) side.structures = [];
      var mesaRemix = side.structures.find(function(s){ return s.kind === 'mesaDJ'; });
      if (mesaRemix) {
        if (!enemyActive.dead) {
          triggerMarkOrResonance(enemyActive, 'ilusion', who, enemyKey, enemySide.activeIndex);
          logCombat('🎭 Remix: enemigo marcado con Ilusión');
        }
      } else {
        side.structures.push({ kind:'mesaDJ', duration:2 });
        logCombat('🎧 Remix: Mesa de DJ colocada (2 rondas)');
      }
      break;
    }
    case 'killerTunes': {
      setEnvironment('sobrecarga_epileptica', active, who);
      side.neonUltChangeDamage = true;
      logCombat('🎵 Killer Tunes: durante el resto de la ronda, los cambios de personaje de tu equipo causan 1 daño al enemigo');
      break;
    }
    default: logCombat('⚠️ Habilidad sin implementar: ' + ability.name);
  }

  if (ability.energy && ability.energy > 0 && !active.dead) {
    var p = active.energy; active.energy = Math.min(active.maxEnergy, active.energy + ability.energy);
    if (active.energy > p) logCombat('⚡ +' + (active.energy - p) + ' energía');
  }
  if (!active.dead) {
    active.cardNextAbilityDiscount = 0; active.cardNextAbilityFree = false;
    active.cardNextAttackBonus = 0; active.cardNextAttackPiercing = false; active.cardNextAttackDouble = false;
    if (!(active.id === 'jose' && ability.kind === 'impulso')) {
      if (pendingBuffConsumed || active.id !== 'jose') active.pendingBuff = 0;
    }
  }
  if (active.id === 'jose' && !active.dead) {
    csSetState(active, 'acelerado', false);
  }

  renderCombat();
  if (enemySide.characters.every(function(c){ return c.dead; })) { setTimeout(function(){ endCombat(who); }, 400); return; }
  if (side.characters.every(function(c){ return c.dead; })) { setTimeout(function(){ endCombat(who === 'player' ? 'bot' : 'player'); }, 400); return; }
  if (shouldEndTurn === false) return;
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
    addOrRefreshShield(activeDecl, 'neon_passive', 2);
    var nxDecl = getNextAliveIndex(sdDecl, sdDecl.activeIndex);
    if (nxDecl >= 0 && nxDecl !== sdDecl.activeIndex) {
      sdDecl.activeIndex = nxDecl;
      logCombat('🎆 Neón (pasiva): +2 escudo y cambia a ' + sdDecl.characters[nxDecl].character.name);
      triggerKillerTunesDamage(who);
    } else {
      logCombat('🎆 Neón (pasiva): +2 escudo (no hay más aliados vivos)');
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
        if (typeof renderCombat === 'function') renderCombat();   // ✅
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

function adjustCardCostForPassives(card, side) {
  var adjusted = {};
  Object.keys(card.cost || {}).forEach(function(k){ adjusted[k] = card.cost[k]; });
  if (card.category === 'equipo') { var oa = side.characters.some(function(c){ return c.id === 'oliver' && !c.dead; }); if (oa) { if (adjusted.any && adjusted.any > 0) adjusted.any = Math.max(0, adjusted.any - 1); else if (adjusted.same && adjusted.same > 0) adjusted.same = Math.max(0, adjusted.same - 1); } }
  if (card.tag === 'Curación') { var na = side.characters.some(function(c){ return c.id === 'noah' && !c.dead; }); if (na) { if (adjusted.any && adjusted.any > 0) adjusted.any = Math.max(0, adjusted.any - 1); else if (adjusted.same && adjusted.same > 0) adjusted.same = Math.max(0, adjusted.same - 1); } }
  return adjusted;
}
function applyCardEffect(card) {
  var side = getActiveSide(); if (!side || !combatState) return;
  var enemySide = combatState[getEnemyKey()];
  var active = side.characters[side.activeIndex]; if (!active || active.dead) return;
  var enemyActive = enemySide.characters[enemySide.activeIndex];
  switch (card.effectType) {
    case 'nextAttackBonus': active.cardNextAttackBonus = (active.cardNextAttackBonus || 0) + card.value; logCombat('🎴 Próximo ataque +' + card.value); break;
    case 'nextAttackPiercing': active.cardNextAttackPiercing = true; logCombat('🎴 Próximo ataque penetrante'); break;
    case 'nextAttackDouble': active.cardNextAttackDouble = true; logCombat('🎴 Próximo ataque x2'); break;
    case 'nextAttackCritical': active.cardNextAttackBonus = (active.cardNextAttackBonus || 0) + card.value; active.cardNextAttackPiercing = true; break;
    case 'heal': healChar(active, card.value); break;
    case 'healAll': side.characters.forEach(function(c){ if (!c.dead) healChar(c, card.value); }); break;
    case 'shield': addOrRefreshShield(active, 'card_' + card.id, card.value); playSound('shield'); break;
    case 'shieldAll': side.characters.forEach(function(c){ if (!c.dead) addOrRefreshShield(c, 'card_' + card.id, card.value); }); break;
    case 'removeEnemyShields': enemyActive.shields = []; logCombat('🎴 Escudos enemigos eliminados'); break;
    case 'energy': active.energy = Math.min(active.maxEnergy, active.energy + card.value); break;
    case 'drawDiceOfActive': for (var i = 0; i < card.value; i++) side.dice.push({ type:active.character.element, id:uid(), justAdded:true }); break;
    case 'drawTeamDice': var dr = 0; side.characters.forEach(function(c){ if (!c.dead && dr < 3) { side.dice.push({ type:c.character.element, id:uid(), justAdded:true }); dr++; } }); break;
    case 'rerollDice': { var te = computeTeamElements(side); var tE = active.character.element; var s = side.dice.slice().sort(function(a, b){ return getDiePriority(b, te, tE) - getDiePriority(a, te, tE); }); s.slice(0, Math.min(card.value, s.length)).forEach(function(d){ if (Math.random() < 0.125) d.type = 'omni'; else d.type = CONSONANCE_ORDER[Math.floor(Math.random() * 7)]; }); break; }
    case 'convertDice': { var te2 = computeTeamElements(side); var tE2 = active.character.element; var s2 = side.dice.slice().sort(function(a, b){ return getDiePriority(b, te2, tE2) - getDiePriority(a, te2, tE2); }); s2.slice(0, Math.min(card.value, s2.length)).forEach(function(d){ if (d.type !== tE2) d.type = tE2; }); break; }
    case 'sacrificeDie': { if (side.dice.length > 0) { var te3 = computeTeamElements(side); var tE3 = active.character.element; var w = side.dice.slice().sort(function(a, b){ return getDiePriority(b, te3, tE3) - getDiePriority(a, te3, tE3); })[0]; side.dice = side.dice.filter(function(d){ return d.id !== w.id; }); for (var k = 0; k < 2; k++) side.dice.push({ type:tE3, id:uid(), justAdded:true }); } break; }
    case 'quickChange': { var ni = getNextAliveIndex(side, side.activeIndex); if (ni >= 0) { side.activeIndex = ni; } break; }
    case 'nextAbilityDiscount': active.cardNextAbilityDiscount = (active.cardNextAbilityDiscount || 0) + card.value; break;
    case 'nextAbilityFree': active.cardNextAbilityFree = true; break;
    case 'markEnemy': enemyActive.cardMarkBonus = (enemyActive.cardMarkBonus || 0) + card.value; break;
    case 'forceEnemyChange': { var niE = getNextAliveIndex(enemySide, enemySide.activeIndex); if (niE >= 0) { enemySide.activeIndex = niE; } break; }
    case 'enemyAttackDebuff': side.enemyAttackDebuff = (side.enemyAttackDebuff || 0) + card.value; break;
    case 'prepararContraataque': side.contraataque = (side.contraataque || 0) + (card.value || 2); break;
    case 'revive': {
      // Revive a un aliado caído (a elección). Solo si hay aliados caídos.
      var deadAllies = side.characters.filter(function(c){ return c.dead; });
      if (!deadAllies.length) { logCombat('❌ No hay aliados caídos para revivir'); playSound('error'); break; }
      // Por simplicidad: revivir al último caído (lastDeadAlly si existe) o al primero.
      var targetRev = null;
      if (side.lastDeadAlly) {
        targetRev = side.characters.find(function(c){ return c.id === side.lastDeadAlly && c.dead; });
      }
      if (!targetRev) targetRev = deadAllies[0];
      // Respetar "no puede ser resucitada" (Artemis)
      if (targetRev.id === 'artemis') { logCombat('❌ Artemis no puede ser revivida'); playSound('error'); break; }
      targetRev.dead = false;
      targetRev.hp = Math.min(card.value || 2, targetRev.maxHp);
      if (!targetRev.shields) targetRev.shields = [];
      targetRev.shields.push({ source:'resurreccion', hp:1, maxHp:1 });
      // Si es Adela y tiene marca, se transforma en Hunger
      if (targetRev.id === 'adela' && hasAnyMark(targetRev)) {
        transformAdelaToHunger(targetRev);
      }
      // Si es Hunger, se cura al máximo (pasiva)
      if (targetRev.id === 'hunger') {
        targetRev.hp = targetRev.maxHp;
      }
      logCombat('✝️ Resurrección: ' + targetRev.character.name + ' vuelve con ' + targetRev.hp + ' HP');
      break;
    }
  }
  // ✅ Hunger EX: Café solo le hace 2 de daño al usarlo
  if (card.id === 'c_cafe_solo' && active && active.id === 'hunger' && active.exActive) {
    var hSideKey = (combatState.player.characters.indexOf(active) >= 0) ? 'player' : 'bot';
    var hSide = combatState[hSideKey];
    var hIdx = hSide.characters.indexOf(active);
    dealDamageToChar(active, 2, { targetSide:hSide, targetSideKey:hSideKey, targetIdx:hIdx });
    logCombat('☕ Café amargo: Hunger recibe 2 de daño');
  }
}
function canPayCardCost(cost){ var side = getActiveSide(); if (!side) return false; var t = sumCost(cost); if (t === 0) return true; return trySpendDice(side.dice, cost).ok; }
function cardEnergyTargetType(card) {
  if (card.effectType === 'energy') return 'active';
  if (card.category === 'apoyo' && card.effect) {
    if (card.effect.energyPerRound) return 'active';
    if (card.effect.teamEnergyPerRound) return 'team';
  }
  if (card.category === 'equipo' && card.effect) {
    if (card.effect.teamEnergyBonus || card.effect.teamEnergyPerRound) return 'team';
    if (card.effect.energyBonus || card.effect.energyPerRound) return 'target';
  }
  return null;
}
function cardWouldGiveEnergyToArtemis(card, side) {
  var tt = cardEnergyTargetType(card);
  if (!tt) return false;
  if (tt === 'active') {
    var act = side.characters[side.activeIndex];
    return act && act.id === 'artemis';
  }
  if (tt === 'team') {
    return side.characters.some(function(c){ return c.id === 'artemis' && !c.dead; });
  }
  return false; // 'target' → se comprueba al elegir a quién equipar
}
function playCardRequest(cardId) {
  if (!combatState || combatState.phase !== 'playing') return;
  if (!canHumanControlCurrentTurn()) return;
  if (isTurnDone()) return;
  var side = getTurnSide(); if (!side) return;
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId]; if (!card) return;

  if (card.oncePerRound && side.cardsUsedThisRound[cardId]) { playSound('error'); return; }
  if (card.oncePerGame && side.cardsUsedThisGame[cardId]) { playSound('error'); return; }

  var artemisBlock = cardWouldGiveEnergyToArtemis(card, side);
  var adjustedCost = adjustCardCostForPassives(card, side);
  // ✅ Hunger EX: Café solo gratis
  var hungerActive = side.characters[side.activeIndex];
  if (card.id === 'c_cafe_solo' && hungerActive && hungerActive.id === 'hunger' && hungerActive.exActive) {
    adjustedCost = {};
  }
  showCardConfirmation(cardId, adjustedCost, function(selectedDice){
    var spentIds = {}; selectedDice.forEach(function(d){ spentIds[d.id] = true; });
    side.dice = side.dice.filter(function(d){ return !spentIds[d.id]; });
    applyCardPlay(cardId, selectedDice);
  }, artemisBlock);
}
function finalizeCardPlay(cardId) {
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId]; if (!card) return;
  var player = getActiveSide(); if (!player) return;
  if (card.oncePerRound) player.cardsUsedThisRound[cardId] = true;
  if (card.oncePerGame) player.cardsUsedThisGame[cardId] = true;
  var hi = player.hand.indexOf(cardId); if (hi >= 0) player.hand.splice(hi, 1);
  if (!PAINT_CARDS[cardId]) { if (!player.discardPile) player.discardPile = []; player.discardPile.push(cardId); }
  playSound('card');
}
function refundDice(spent){ var side = getActiveSide(); if (!spent || !side) return; spent.forEach(function(d){ d.justAdded = false; side.dice.push(d); }); }
function applyCardPlay(cardId, spentDice) {
  if (!combatState) return;
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId]; if (!card) return;
  var player = getActiveSide(); if (!player) return;
  if (card.category === 'pintura') {
    var erik = player.characters.find(function(c){ return c.id === 'erik' && !c.dead; });
    if (!erik) { playSound('error'); logCombat('❌ Erik no está en pie'); return; }
    if (erik.paintEquipped) { playSound('error'); logCombat('❌ Erik ya tiene pintura'); return; }
    finalizeCardPlay(cardId); erik.paintEquipped = card.paintColor; logCombat('🎨 ' + erik.character.name + ' equipa ' + card.name);
    renderCombat(); return;
  }
  if (card.category === 'equipo') {
    showEquipmentTargetDialog(cardId, function(ti, ri){
      finalizeCardPlay(cardId);
      var target = player.characters[ti];
      if (!target.equipment) target.equipment = [];
      if (ri >= 0) target.equipment[ri] = cardId; else target.equipment.push(cardId);
      var eq = CARD_DB[cardId];
      if (eq && eq.effect) {
        if (eq.effect.shieldBonus) addOrRefreshShield(target, 'eq_' + cardId, eq.effect.shieldBonus);
        if (eq.effect.energyBonus) target.energy = Math.min(target.maxEnergy, target.energy + eq.effect.energyBonus);
        if (eq.effect.healBonus) healChar(target, eq.effect.healBonus);
        if (eq.effect.selfDamage) { target.hp = Math.max(0, target.hp - eq.effect.selfDamage); if (target.hp <= 0) { var who = combatState.player.characters.indexOf(target) >= 0 ? 'player' : 'bot'; handleDeath(who, player.characters.indexOf(target)); } }
      }
      renderCombat();
    }, function cancel(){ refundDice(spentDice); renderCombat(); });
  } else if (card.category === 'apoyo') {
    if (!player.supports) player.supports = [null,null,null,null];
    var es = -1; for (var i = 0; i < 4; i++) if (!player.supports[i]) { es = i; break; }
    if (es === -1) {
      showSupportReplaceDialog(cardId, function(si){
        finalizeCardPlay(cardId);
        player.supports[si] = { cardId:cardId, duration:card.duration };
        if (card.effect && card.effect.shieldInstant) addOrRefreshShield(player.characters[player.activeIndex], 'support_' + cardId, card.effect.shieldInstant);
        if (card.effect && card.effect.teamShieldInstant) player.characters.forEach(function(c){ if (!c.dead) addOrRefreshShield(c, 'support_' + cardId, card.effect.teamShieldInstant); });
        renderCombat();
      }, function cancel(){ refundDice(spentDice); renderCombat(); });
    } else {
      finalizeCardPlay(cardId);
      player.supports[es] = { cardId:cardId, duration:card.duration };
      if (card.effect && card.effect.shieldInstant) addOrRefreshShield(player.characters[player.activeIndex], 'support_' + cardId, card.effect.shieldInstant);
      if (card.effect && card.effect.teamShieldInstant) player.characters.forEach(function(c){ if (!c.dead) addOrRefreshShield(c, 'support_' + cardId, card.effect.teamShieldInstant); });
      renderCombat();
    }
  } else { finalizeCardPlay(cardId); applyCardEffect(card); renderCombat(); }
}

function hideConfirmation(){ var ov = document.getElementById('confirmOverlay'); if (ov) ov.classList.remove('show'); }
function showEquipmentTargetDialog(cardId, onConfirm, onCancel) {
  var card = CARD_DB[cardId]; if (!card) return;
  var _targetType = cardEnergyTargetType(card);
  var _blocksArtemisTarget = (_targetType === 'target');
  var player = getActiveSide(); if (!player) return;
  if (silentActionApply) { onConfirm(player.activeIndex, (player.characters[player.activeIndex].equipment||[]).length >= 2 ? 0 : -1); return; }
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent');
  if (!ov || !content) { onCancel(); return; }
  hideTooltip();
  var html = '<div class="confirm-title">⚔️ Equipar Carta</div><div class="confirm-subtitle">' + card.emoji + ' ' + card.name + '</div><div class="confirm-body">' + card.effectText + '</div><div class="confirm-char-selector">';
  player.characters.forEach(function(cs, i){
    if (cs.dead) return;
    var _isArtemisBlocked = _blocksArtemisTarget && cs.id === 'artemis';
    html += '<div class="confirm-char-option' + (_isArtemisBlocked ? ' confirm-char-option-blocked' : '') + '" data-idx="' + i + '" style="--el: ' + ELEMENT_COLORS[cs.character.element] + ';"' + (_isArtemisBlocked ? ' title="Artemis no puede recibir energía"' : '') + '><div class="confirm-char-emoji">' + cs.character.emoji + '</div><div class="confirm-char-name">' + cs.character.name + '</div><div class="confirm-char-equip">';
    if (!cs.equipment) cs.equipment = [];
    for (var ei = 0; ei < 2; ei++) { var eqId = cs.equipment[ei]; if (eqId && CARD_DB[eqId]) html += '<span class="confirm-char-equip-icon">' + CARD_DB[eqId].emoji + '</span>'; else html += '<span class="confirm-char-equip-empty">+</span>'; }
    html += '</div></div>';
  });
  html += '</div><div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="equipCancelBtn">Cancelar</button></div>';
  content.innerHTML = html;
  content.querySelectorAll('.confirm-char-option').forEach(function(el){ el.addEventListener('click', function(){
    if (el.classList.contains('confirm-char-option-blocked')) { playSound('error'); return; }
    var i = parseInt(el.dataset.idx, 10), t = player.characters[i];
    if (t.equipment && t.equipment.length >= 2) showEquipmentReplaceDialog(cardId, i, onConfirm, onCancel);
    else { hideConfirmation(); onConfirm(i, -1); }
  }); });
  document.getElementById('equipCancelBtn').addEventListener('click', function(){ hideConfirmation(); onCancel(); });
  ov.classList.add('show');
}
function showEquipmentReplaceDialog(cardId, ti, onConfirm, onCancel) {
  var card = CARD_DB[cardId]; if (!card) return;
  var player = getActiveSide(); if (!player) return;
  var target = player.characters[ti];
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent');
  if (!ov || !content) { onCancel(); return; }
  var html = '<div class="confirm-title">⚠️ Reemplazar Equipamiento</div><div class="confirm-subtitle">' + target.character.name + '</div><div class="confirm-body">Selecciona el equipamiento a sustituir.</div><div class="confirm-char-equip-large">';
  for (var i = 0; i < 2; i++) { var eqId = target.equipment[i]; var eq = eqId ? CARD_DB[eqId] : null; if (eq) html += '<div class="confirm-equip-card" data-idx="' + i + '"><div class="confirm-equip-emoji">' + eq.emoji + '</div><div class="confirm-equip-name">' + eq.name + '</div><div class="confirm-equip-effect">' + eq.effectText + '</div></div>'; }
  html += '</div><div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="equipReplaceCancelBtn">Cancelar</button></div>';
  content.innerHTML = html;
  content.querySelectorAll('.confirm-equip-card').forEach(function(el){ el.addEventListener('click', function(){ var i = parseInt(el.dataset.idx, 10); hideConfirmation(); onConfirm(ti, i); }); });
  document.getElementById('equipReplaceCancelBtn').addEventListener('click', function(){ hideConfirmation(); onCancel(); });
  ov.classList.add('show');
}
function showSupportReplaceDialog(cardId, onConfirm, onCancel) {
  var card = CARD_DB[cardId]; if (!card) return;
  var player = getActiveSide(); if (!player) return;
  if (silentActionApply) { onConfirm(0); return; }
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent');
  if (!ov || !content) { onCancel(); return; }
  var html = '<div class="confirm-title">⚠️ Apoyos Llenos</div><div class="confirm-subtitle">' + card.emoji + ' ' + card.name + '</div><div class="confirm-body">Selecciona un apoyo a sustituir.</div><div class="confirm-support-grid">';
  for (var i = 0; i < 4; i++) { var sp = player.supports[i]; if (sp) { var spc = CARD_DB[sp.cardId]; if (spc) html += '<div class="confirm-support-card" data-idx="' + i + '"><div class="confirm-support-emoji">' + spc.emoji + '</div><div class="confirm-support-name">' + spc.name + '</div><div class="confirm-support-duration">⏳ ' + sp.duration + ' r</div></div>'; } }
  html += '</div><div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="supportReplaceCancelBtn">Cancelar</button></div>';
  content.innerHTML = html;
  content.querySelectorAll('.confirm-support-card').forEach(function(el){ el.addEventListener('click', function(){ var i = parseInt(el.dataset.idx, 10); hideConfirmation(); onConfirm(i); }); });
  document.getElementById('supportReplaceCancelBtn').addEventListener('click', function(){ hideConfirmation(); onCancel(); });
  ov.classList.add('show');
}

function showDiscardDieSelection(cardId, onConfirmDiscard) {
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent'); if (!ov || !content) return;
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId]; if (!card) return;
  var side = getActiveSide(); if (!side) return;
  var active = side.characters[side.activeIndex]; if (!active || active.dead) return;
  var targetElement = active.character.element;
  var selectedDieId = null;
  // ✅ Usar la prioridad real de "qué dado es más prescindible":
  //   1 = tipo que no tienes en el equipo (mejor candidato a convertir)
  //   2 = tipo de aliado muerto
  //   3 = tipo de aliado vivo (no activo)
  //   4 = tipo del activo (no se puede convertir, ya es del tipo correcto)
  //   5 = omni (nunca se convierte)
  // Elegimos el dado con MENOR prioridad (más prescindible) que no sea
  // del tipo del activo ni omni.
  var teamEls = computeTeamElements(side);
  var bestPriority = 999;
  for (var i = 0; i < side.dice.length; i++) {
    var d = side.dice[i];
    if (d.type === targetElement) continue; // ya es del tipo del activo
    if (d.type === 'omni') continue;         // nunca convertir un omni
    var prio = getDiePriority(d, teamEls, targetElement);
    if (prio < bestPriority) {
      bestPriority = prio;
      selectedDieId = d.id;
    }
  }
  function build() {
    var html = '<div class="confirm-title">🗑️ Descartar Carta</div>';
    html += '<div class="confirm-subtitle">' + card.emoji + ' ' + card.name + '</div>';
    html += '<div class="confirm-body"><div style="margin-bottom: 0.5rem;">Descarta esta carta para cambiar <strong>1 dado</strong> al tipo del activo (<strong style="color: rgb(' + ELEMENT_COLORS[targetElement] + ');">' + ELEMENT_EMOJI[targetElement] + ' ' + ELEMENT_NAMES[targetElement] + '</strong>).</div><div style="font-size: 0.75rem; color: var(--muted); font-style: italic;">Acción rápida: no pasa el turno.</div></div>';
    html += '<div class="confirm-dice-picker"><div class="confirm-dice-label"><span>Selecciona 1 dado</span><span class="confirm-dice-count' + (selectedDieId ? ' is-complete' : '') + '">' + (selectedDieId ? '1 / 1' : '0 / 1') + '</span></div><div class="confirm-dice-pool">';
    sortDiceForDisplay(side.dice, side).forEach(function(d){
      var alreadyTarget = d.type === targetElement;
      var isOmni = d.type === 'omni';
      // ✅ Omnidado: bloqueado (no se puede seleccionar para convertir)
      // ✅ Dado ya del tipo del activo: bloqueado (no tiene sentido convertirlo)
      var col = isOmni ? '240, 200, 96' : ELEMENT_COLORS[d.type];
      var em = isOmni ? '✨' : ELEMENT_EMOJI[d.type];
      var isSel = selectedDieId === d.id;
      var isLocked = alreadyTarget || isOmni || (!isSel && selectedDieId !== null);
      var cls = 'confirm-die';
      if (isSel) cls += ' selected';
      if (isLocked) cls += ' locked';
      html += '<div class="' + cls + '" data-die-id="' + d.id + '" style="--dc: ' + col + ';">' + em + '</div>';
    });
    html += '</div></div>';
    html += '<div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="discardCancelBtn">Cancelar</button><button class="confirm-btn confirm-accept" id="discardAcceptBtn"' + (!selectedDieId ? ' disabled' : '') + '>Convertir dado</button></div>';
    content.innerHTML = html;
    var picker = content.querySelector('.confirm-dice-pool');
    if (picker) picker.addEventListener('click', function(e){
      var de = e.target.closest('.confirm-die');
      if (!de || de.classList.contains('locked')) return;
      var id = de.dataset.dieId;
      if (selectedDieId === id) { selectedDieId = null; playSound('deselect'); } else { selectedDieId = id; playSound('select'); }
      build();
    });
    document.getElementById('discardCancelBtn').addEventListener('click', function(){ hideConfirmation(); playSound('deselect'); });
    var ab = document.getElementById('discardAcceptBtn');
    if (ab && !ab.disabled) ab.addEventListener('click', function(){ hideConfirmation(); playSound('confirm'); onConfirmDiscard(selectedDieId); });
  }
  build(); ov.classList.add('show');
}
function showCardConfirmation(cardId, adjustedCost, onConfirm, artemisBlock) {
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent'); if (!ov || !content) return;
  hideTooltip();
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId]; if (!card) return;
  var side = getActiveSide(); if (!side) return;
  var totalCost = sumCost(adjustedCost);
  var active = side.characters[side.activeIndex];
  var autoIds = autoSelectDiceForCost(adjustedCost, { targetElement: active ? active.character.element : null });
  var selectedIds = {}; autoIds.forEach(function(id){ selectedIds[id] = true; });
  function getSel(){ return side.dice.filter(function(d){ return selectedIds[d.id]; }); }
  function build() {
    var sc = Object.keys(selectedIds).length, isFull = sc === totalCost;
    var isComplete = totalCost === 0 || (isFull && trySpendDice(getSel(), adjustedCost).ok);
    var canPlay = isComplete && !artemisBlock;
    var catL = card.category === 'equipo' ? '⚔️ Equipo' : card.category === 'apoyo' ? '📜 Apoyo' : card.category === 'pintura' ? '🎨 Pintura' : '✨ Evento';
    var html = '<div class="confirm-title">' + catL + ' · ' + card.tag + '</div><div class="confirm-subtitle">' + card.emoji + ' ' + card.name + '</div><div class="confirm-body">' + card.effectText + '</div>';
    if (totalCost === 0) html += '<div class="confirm-cost-section"><div class="confirm-cost-label">Coste</div><div class="confirm-cost-dice"><span class="die die-energy">Sin coste</span></div></div>';
    else {
      html += '<div class="confirm-cost-section"><div class="confirm-cost-label">Coste requerido</div><div class="confirm-cost-dice">';
      if (adjustedCost.any) html += '<span class="die die-any">🎲 <b>×' + adjustedCost.any + '</b></span>';
      if (adjustedCost.same) html += '<span class="die die-any">🎲 <b>×' + adjustedCost.same + ' iguales</b></span>';
      html += '</div></div>';
      var dh = ''; sortDiceForDisplay(side.dice, side).forEach(function(d){ var col = d.type === 'omni' ? '240, 200, 96' : ELEMENT_COLORS[d.type]; var em = d.type === 'omni' ? '✨' : ELEMENT_EMOJI[d.type]; var sel = selectedIds[d.id], lk = !sel && isFull; var cls = 'confirm-die'; if (sel) cls += ' selected'; if (lk) cls += ' locked'; dh += '<div class="' + cls + '" data-die-id="' + d.id + '" style="--dc: ' + col + ';">' + em + '</div>'; });
      html += '<div class="confirm-dice-picker"><div class="confirm-dice-label"><span>Selecciona dados</span><span class="confirm-dice-count' + (isFull ? ' is-complete' : '') + '">' + sc + ' / ' + totalCost + '</span></div><div class="confirm-dice-pool">' + dh + '</div></div>';
      if (isComplete) html += '<div class="confirm-valid-msg ok">✓ Listo</div>';
    }
    if (artemisBlock) {
      html += '<div class="confirm-warning">🦅 Artemis no puede recibir energía. Puedes descartar esta carta, pero no jugarla.</div>';
    }
    html += '<div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="confirmCancelBtn">Cancelar</button>';
    if (side.dice.length > 0) html += '<button class="confirm-btn confirm-discard" id="confirmDiscardBtn" title="Descartar esta carta para cambiar un dado al tipo del activo">🗑️ Descartar</button>';
    html += '<button class="confirm-btn confirm-accept" id="confirmAcceptBtn"' + (!canPlay ? ' disabled' : '') + '>Jugar</button></div>';
    content.innerHTML = html;                       // ← LÍNEA QUE FALTABA
    var picker = content.querySelector('.confirm-dice-pool');
    if (picker) picker.addEventListener('click', function(e){ var de = e.target.closest('.confirm-die'); if (!de || de.classList.contains('locked')) return; var id = de.dataset.dieId; if (selectedIds[id]) { delete selectedIds[id]; playSound('deselect'); } else { if (Object.keys(selectedIds).length >= totalCost) { playSound('error'); return; } selectedIds[id] = true; playSound('select'); } build(); });
    document.getElementById('confirmCancelBtn').addEventListener('click', function(){ hideConfirmation(); playSound('deselect'); });
    var discardBtn = document.getElementById('confirmDiscardBtn');
    if (discardBtn) discardBtn.addEventListener('click', function(){
      if (!side || side.dice.length === 0) { playSound('error'); return; }
      showDiscardDieSelection(cardId, function(dieId) {
        var hi = side.hand.indexOf(cardId);
        if (hi >= 0) side.hand.splice(hi, 1);
        if (!PAINT_CARDS[cardId]) { if (!side.discardPile) side.discardPile = []; side.discardPile.push(cardId); }
        var die = side.dice.find(function(d){ return d.id === dieId; });
        if (die) {
          var act = side.characters[side.activeIndex];
          if (act && !act.dead) { die.type = act.character.element; die.justAdded = true; logCombat('🗑️ Descartas ' + card.name + ' → dado convertido a ' + ELEMENT_EMOJI[act.character.element]); }
        }
        playSound('card'); renderCombat();
      });
    });
    var ab = document.getElementById('confirmAcceptBtn');
    if (ab && !ab.disabled) ab.addEventListener('click', function(){ var fd = getSel(); if (totalCost > 0) { var t = trySpendDice(fd, adjustedCost); if (!t.ok) return; } hideConfirmation(); playSound('confirm'); onConfirm(fd); });
  }
  build(); ov.classList.add('show');
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

  var applyGeneric = ['damage','trazoVivo','intervencion','aceleron','instinto','deudaSangre','graciaPicara'].indexOf(ability.kind) !== -1;
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
      // ✅ Alter: bono a elementales del equipo (si hay buff activo)
      // ✅ Adela graciaPicara y elementales reciben el buff de Alter
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
    // ✅ Buff de Alter también para elementales que no pasan por applyGeneric
    // (inconsistencia, degradacion)
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
      var exP = (active.exActive && exSystemEnabled) ? 2 : 0;
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
    var healI = 0; // no cura
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
      // ✅ Tope de 3 HP de curación por la habilidad misma (daño base).
      // Los bonos de curación se suman después.
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
    if (hasMesaPrev) preview.notes.push('🎧 +1 daño por Mesa de DJ (coste +1 ilusión)');
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
    // ✅ Si el clic cae sobre el que ya es activo, forzar render y salir
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
    var sfx = rules.quick ? ' (acción rápida)' : (rules.discounted ? ' (gratis)' : '');
    var label = combatState.pvp ? (turnKey === 'player' ? 'J1' : 'J2') : 'Tú';
    logCombat('🔄 ' + label + ': ' + oldN + ' → ' + newN + sfx);
    // ✅ Killer Tunes: cambio de personaje → 1 daño al enemigo activo
    if (typeof triggerKillerTunesDamage === 'function') triggerKillerTunesDamage(turnKey);
    playSound('change'); renderCombat();
    if (!rules.quick) setTimeout(nextTurn, 400);
  });
}

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
    if (isActive && !isDead) html += '<span class="ccc-active-star">⭐</span>';
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
    }
    if (cs.manuelStacks > 0) badges.push('<span class="ccc-badge" data-status="manuelStacks" data-value="' + cs.manuelStacks + '" style="--bc: 200,150,60;">📈 +' + cs.manuelStacks + '</span>');
    if (side.obraMaestraTurns > 0 && isActive) badges.push('<span class="ccc-badge" data-status="obraMaestra" data-value="' + side.obraMaestraTurns + '" style="--bc: 240,200,96;">💥 Obra Maestra (' + side.obraMaestraTurns + ')</span>');
    if (cs.marks) Object.keys(cs.marks).forEach(function(el){ var em = ELEMENT_EMOJI[el] || '🏷️'; var cl = ELEMENT_COLORS[el] || '240,200,96'; badges.push('<span class="ccc-badge mark" data-status="marca" style="--bc: ' + cl + ';">' + em + ' Marca</span>'); });
    // ✅ Alter: marcar a los aliados potenciados por Omnes Deam Salutate
    if (side.alterUltBuff && side.alterUltBuff.amount > 0 && side.alterUltBuff.roundsLeft > 0 && cs.id !== 'alter' && !isDead) {
      badges.push('<span class="ccc-badge alter-buff" title="Omnes Deam Salutate: +' + side.alterUltBuff.amount + ' daño a elementales (' + side.alterUltBuff.roundsLeft + ' ronda(s))">💥 +' + side.alterUltBuff.amount + ' elem. (' + side.alterUltBuff.roundsLeft + ')</span>');
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

[{ btnId:'normalBtn', type:'normal' }, { btnId:'elementalBtn', type:'elemental' }, { btnId:'ultimateBtn', type:'ultimate' }].forEach(function(item){ var b = document.getElementById(item.btnId); if (!b) return; b.addEventListener('mouseenter', function(){ showAbilityTooltip(b, item.type); }); b.addEventListener('mouseleave', hideTooltip); });
['playerTeam','botTeam'].forEach(function(teamId){
  var el = document.getElementById(teamId);
  if (!el) return;
  el.addEventListener('mouseover', function(e){ var card = e.target.closest('.combat-char-card'); if (!card || card.classList.contains('dead')) return; if (e.relatedTarget && card.contains(e.relatedTarget)) return; if (!combatState || combatState.phase === 'ended') return; if (e.target.closest('.ccc-badge')) return; var sideKey = card.dataset.team; var idx = parseInt(card.dataset.index, 10); if (idx === combatState[sideKey].activeIndex) return; showCharTooltip(card, combatState[sideKey].characters[idx]); });
  el.addEventListener('mouseout', function(e){ var card = e.target.closest('.combat-char-card'); if (!card) return; if (e.relatedTarget && card.contains(e.relatedTarget)) return; if (e.target.closest('.ccc-badge')) return; hideTooltip(); });
});
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

function populateCalcSelects(){ var a = document.getElementById('calcAttacker'), d = document.getElementById('calcDefender'); if (!a || !d) return; var ids = Object.keys(COMBAT_CHARS); var opts = ids.map(function(id){ var ch = COMBAT_CHARS[id]; return '<option value="' + id + '">' + ch.emoji + ' ' + ch.name + ' — ' + ELEMENT_NAMES[ch.element] + '</option>'; }).join(''); a.innerHTML = opts; d.innerHTML = opts; a.value = 'jose'; d.value = 'eloy'; }
function getCalcAbilityType(){ var t = document.querySelector('.calc-ability-tab.active'); return t ? t.dataset.type : 'normal'; }
function getCalcAbility(){ var a = document.getElementById('calcAttacker'); if (!a) return null; var ch = COMBAT_CHARS[a.value]; if (!ch) return null; return ch.abilities[getCalcAbilityType()] || null; }
function renderCalcAbilityInfo(){ var el = document.getElementById('calcAbilityInfo'); if (!el) return; var ab = getCalcAbility(); if (!ab) { el.innerHTML = ''; return; } var costHtml = ''; if (ab.cost) { var cs = formatCost(ab.cost, ab.energyCost); costHtml = '<div style="margin-top: 0.4rem; font-size: 0.75rem;">' + cs + '</div>'; } var notes = []; if (ab.damage) notes.push('Daño base: ' + ab.damage); if (ab.piercing) notes.push('Penetrante'); if (ab.selfDamage) notes.push('Autodaño ' + ab.selfDamage); el.innerHTML = '<div class="calc-ability-info-name">' + ab.name + '</div>' + (notes.length ? '<div style="color: var(--accent); margin-top: 0.4rem;">' + notes.join(' · ') + '</div>' : '') + costHtml; }
function computeCalcDamage(){
  var a = document.getElementById('calcAttacker'), d = document.getElementById('calcDefender'); if (!a || !d) return null;
  var attacker = COMBAT_CHARS[a.value], defender = COMBAT_CHARS[d.value]; if (!attacker || !defender) return null;
  var ab = getCalcAbility(); if (!ab) return null;
  var aHp = parseInt(document.getElementById('calcAttackerHp').value, 10) || 0;
  var buff = parseInt(document.getElementById('calcAttackerBuff').value, 10) || 0;
  var redLv = parseInt(document.getElementById('calcRedencionConsonance').value, 10) || 0;
  var first = document.getElementById('calcFirstAttack').checked;
  var dHp = parseInt(document.getElementById('calcDefenderHp').value, 10) || 0;
  var dSh = parseInt(document.getElementById('calcDefenderShield').value, 10) || 0;
  var flat = parseInt(document.getElementById('calcDefenderFlatReduction').value, 10) || 0;
  var pct = parseInt(document.getElementById('calcDefenderPctReduction').value, 10) || 0;
  var mod = parseInt(document.getElementById('calcDefenderDmgModifier').value, 10) || 0;
  var base = ab.damage || 0, buffD = 0, redD = 0;
  if (ab.target === 'enemy' && base > 0) { buffD = buff; if (redLv > 0 && first) redD = redLv === 3 ? 3 : 2; }
  var sub = base + buffD + redD;
  var afterMod = sub * (1 + mod / 100);
  var afterFlat = Math.max(0, afterMod - flat);
  var totalD = Math.round(afterFlat * (1 - pct / 100));
  var pierce = !!ab.piercing, shieldAbs = 0, trueD = totalD, dShAfter = dSh;
  if (!pierce && dSh > 0 && totalD > 0) { shieldAbs = Math.min(dSh, totalD); trueD = totalD - shieldAbs; dShAfter = dSh - shieldAbs; }
  var dHpAfter = Math.max(0, dHp - trueD), dKilled = dHpAfter <= 0;
  var selfD = ab.selfDamage || 0, aHpAfter = Math.max(0, aHp - selfD), aKilled = aHpAfter <= 0;
  return { attacker:attacker, defender:defender, ability:ab, isPiercing:pierce, baseDmg:base, buffDmg:buffD, redencionDmg:redD, subtotal:sub, dmgModifier:mod, flatReduction:flat, pctReduction:pct, totalDamage:totalD, shieldAbsorbed:shieldAbs, trueDamage:trueD, defenderHpBefore:dHp, defenderHpAfter:dHpAfter, defenderShieldBefore:dSh, defenderShieldAfter:dShAfter, defenderKilled:dKilled, selfDamage:selfD, attackerHpBefore:aHp, attackerHpAfter:aHpAfter, attackerKilled:aKilled };
}
function renderCalcResult(){
  var c = document.getElementById('calcResult'); if (!c) return;
  var r = computeCalcDamage(); if (!r) { c.innerHTML = '<div class="calc-result-empty">Configura el atacante y el defensor.</div>'; return; }
  var isAtk = r.ability.target === 'enemy' && r.baseDmg > 0;
  var html = '<div class="calc-result-grid">';
  html += '<div class="calc-result-section attacker"><div class="calc-result-section-title">⚔️ ' + r.attacker.emoji + ' ' + r.attacker.name + '</div>';
  if (isAtk) { if (r.baseDmg) html += '<div class="calc-result-row"><span class="calc-result-label">Daño base</span><span class="calc-result-value damage">' + r.baseDmg + '</span></div>'; if (r.buffDmg) html += '<div class="calc-result-row"><span class="calc-result-label">+ Impulso</span><span class="calc-result-value bonus">+' + r.buffDmg + '</span></div>'; if (r.redencionDmg) html += '<div class="calc-result-row"><span class="calc-result-label">+ Redención</span><span class="calc-result-value bonus">+' + r.redencionDmg + '</span></div>'; if (r.flatReduction) html += '<div class="calc-result-row"><span class="calc-result-label">− Reducción</span><span class="calc-result-value shield">−' + r.flatReduction + '</span></div>'; html += '<div class="calc-result-total"><div class="calc-result-total-label">Daño total</div><div class="calc-result-total-value damage">' + r.totalDamage + '</div></div>'; }
  if (r.selfDamage) html += '<div class="calc-result-row"><span class="calc-result-label">Autodaño</span><span class="calc-result-value damage">−' + r.selfDamage + '</span></div>';
  html += '</div>';
  html += '<div class="calc-result-section defender"><div class="calc-result-section-title">🛡️ ' + r.defender.emoji + ' ' + r.defender.name + '</div>';
  if (isAtk) { html += '<div class="calc-result-total"><div class="calc-result-total-label">Daño verdadero</div><div class="calc-result-total-value true-dmg">' + r.trueDamage + '</div></div>'; html += '<div class="calc-hp-change"><div class="calc-hp-box"><div class="calc-hp-value">' + r.defenderHpBefore + '</div><div class="calc-hp-label">HP antes</div></div><div class="calc-hp-arrow">→</div><div class="calc-hp-box"><div class="calc-hp-value ' + (r.defenderHpAfter < r.defenderHpBefore ? 'down' : '') + '">' + r.defenderHpAfter + '</div><div class="calc-hp-label">HP después</div></div></div>'; }
  else html += '<div class="calc-result-row"><span class="calc-result-label">Habilidad sobre sí mismo</span><span class="calc-result-value neutral">sin daño</span></div>';
  html += '</div></div>';
  if (isAtk && r.defenderKilled) html += '<div class="calc-result-warning kill">💀 ¡' + r.defender.name + ' moriría!</div>';
  c.innerHTML = html;
}
function setupDamageCalculator(){
  populateCalcSelects();
  var a = document.getElementById('calcAttacker'), d = document.getElementById('calcDefender'); if (!a || !d) return;
  a.addEventListener('change', function(){ var ch = COMBAT_CHARS[a.value]; if (ch) { var hp = document.getElementById('calcAttackerHp'); hp.value = ch.hp; hp.max = ch.hp; } renderCalcAbilityInfo(); renderCalcResult(); });
  d.addEventListener('change', function(){ var ch = COMBAT_CHARS[d.value]; if (ch) { var hp = document.getElementById('calcDefenderHp'); hp.value = ch.hp; hp.max = ch.hp; } renderCalcResult(); });
  document.querySelectorAll('.calc-ability-tab').forEach(function(tab){ tab.addEventListener('click', function(){ document.querySelectorAll('.calc-ability-tab').forEach(function(t){ t.classList.remove('active'); }); tab.classList.add('active'); renderCalcAbilityInfo(); renderCalcResult(); }); });
  ['calcAttackerHp','calcAttackerShield','calcAttackerBuff','calcRedencionConsonance','calcFirstAttack','calcDefenderHp','calcDefenderShield','calcDefenderFlatReduction','calcDefenderPctReduction','calcDefenderDmgModifier'].forEach(function(id){ var el = document.getElementById(id); if (!el) return; el.addEventListener('input', renderCalcResult); el.addEventListener('change', renderCalcResult); });
  var aCh = COMBAT_CHARS[a.value]; if (aCh) { var hp1 = document.getElementById('calcAttackerHp'); hp1.value = aCh.hp; hp1.max = aCh.hp; }
  var dCh = COMBAT_CHARS[d.value]; if (dCh) { var hp2 = document.getElementById('calcDefenderHp'); hp2.value = dCh.hp; hp2.max = dCh.hp; }
  renderCalcAbilityInfo(); renderCalcResult();
}

function addInfoButtons() {
  var cards = document.querySelectorAll('.char-card');
  for (var i = 0; i < cards.length; i++) (function(card){
    var portrait = card.querySelector('.portrait'); if (!portrait) return;
    var btn = document.createElement('button');
    btn.className = 'card-info-btn';
    btn.innerHTML = 'i';
    btn.title = 'Ver detalles del personaje';
    btn.setAttribute('aria-label', 'Ver detalles');
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      openCharacter(card.dataset.character);
    });
    portrait.appendChild(btn);
  })(cards[i]);
}

/* ═══ SANDBOX ═══ */
var sandboxOpen = false;
var sandboxTab = 'global';   // antes: 'char'
var sandboxCharSide = 'player';
var sandboxCharIdx = 0;

function openSandboxPanel() {
  console.log('[Sandbox] openSandboxPanel called');
  var p = document.getElementById('sandboxPanel');
  var t = document.getElementById('sandboxToggleBtn');
  if (!p) { console.error('[Sandbox] #sandboxPanel NOT FOUND'); return; }
  sandboxOpen = true;
  p.hidden = false;
  p.style.display = 'flex';       // ✅ forzar display por si acaso
  p.style.zIndex = '3000';        // ✅ por encima del modal
  if (t && currentGameMode !== 'sandbox') t.style.display = 'none';
  try {
    renderSandboxPanel();
  } catch (err) {
    console.error('[Sandbox] renderSandboxPanel ERROR:', err);
  }
  var sb = document.getElementById('sandboxBody');
  if (!sb || !sb.innerHTML.trim()) {
    if (sb) sb.innerHTML = '<div class="sb-empty">No hay combate activo.</div>';
  }
  console.log('[Sandbox] panel visible? hidden=', p.hidden, '| display=', p.style.display, '| zIndex=', p.style.zIndex);
}
function closeSandboxPanel() {
  var p = document.getElementById('sandboxPanel');
  var t = document.getElementById('sandboxToggleBtn');
  if (!p) return;
  sandboxOpen = false;
  p.hidden = true;
  if (t) t.style.display = (currentGameMode === 'sandbox') ? '' : 'none';
}
function renderSandboxPanel() {
  var body = document.getElementById('sandboxBody');   // ✅ AÑADIR
  if (!combatState) {
    if (body) body.innerHTML = '<div class="sb-empty">No hay combate activo.</div>';
    return;
  }
  if (!body) return;
  var html = '';
  if (sandboxTab === 'global') html = sbRenderGlobal();
  else if (sandboxTab === 'char') html = sbRenderChar();
  else if (sandboxTab === 'dice') html = sbRenderDice();
  else if (sandboxTab === 'cards') html = sbRenderCards();
  else if (sandboxTab === 'fx') html = sbRenderFx();
  body.innerHTML = html;
  sbBindEvents();
}

/* ═══════════════════════════════════════════════════════════════
   SANDBOX v2 — Entorno de pruebas completo
   ═══════════════════════════════════════════════════════════════ */

var SB_STATE_KEYS = [
  'castigada','vulnerable','amenaza','furia','furiaPending',
  'defensaActiva','sintonia','acelerado','vuelo','carrerilla',
  'minutoSilencioShield','hipotesisShieldActive','internetEnergyGranted'
];
var SB_NUMERIC_KEYS = ['condena','invulnerabilidad','rencor'];
var SB_SIDE_NUMS = ['enemyAttackDebuff','contraataque','obraMaestraTurns'];
var SB_EQUIP_IDS = Object.keys(EQUIPMENT_CARDS);
var SB_SUPPORT_IDS = Object.keys(SUPPORT_CARDS);
var SB_CARD_IDS = Object.keys(CARD_DB);

function sbAllChars() {
  var out = [];
  if (!combatState) return out;
  ['player','bot'].forEach(function(sk){
    combatState[sk].characters.forEach(function(cs, i){
      out.push({ sideKey: sk, idx: i, cs: cs, side: combatState[sk] });
    });
  });
  return out;
}
function sbTargetSelect(selected, id) {
  var opts = sbAllChars().map(function(item){
    var label = (item.sideKey === 'player' ? 'J1' : 'J2') + ' · ' + item.cs.character.name;
    var val = item.sideKey + ':' + item.idx;
    return '<option value="' + val + '"' + (selected === val ? ' selected' : '') + '>' + label + '</option>';
  }).join('');
  return '<select id="' + id + '">' + opts + '</select>';
}
function sbConsonanceLabel(c) {
  if (!c) return '—';
  if (c.type === 'diverse') return '🌈 Diverso';
  return (PHILOSOPHIES[c.element] ? PHILOSOPHIES[c.element].emoji : '') + ' ' + (c.level || 0) + '/3';
}

/* ─── GLOBAL ─── */
function sbRenderGlobal() {
  if (!combatState) return '';
  var c = combatState, h = '';

  h += '<div class="sb-section"><div class="sb-section-title">Modo de turno (Sandbox)</div>';
  h += '<div class="sb-row"><select id="sbTurnMode" style="flex:1;padding:0.3rem 0.5rem;background:rgba(0,0,0,0.4);border:1px solid rgba(92,179,255,0.3);border-radius:8px;color:#fff;font-family:inherit;font-size:0.78rem;">';
  h += '<option value="player-only"' + (sandboxTurnMode === 'player-only' ? ' selected' : '') + '>Solo usuario (turno permanente)</option>';
  h += '<option value="bot"' + (sandboxTurnMode === 'bot' ? ' selected' : '') + '>Jugar contra bot</option>';
  h += '<option value="two-users"' + (sandboxTurnMode === 'two-users' ? ' selected' : '') + '>Control manual de ambos</option>';
  h += '</select></div>';
  h += '<div class="sb-row" style="font-size:0.65rem;color:var(--muted);font-style:italic;">Solo usuario: tus acciones no ceden turno. Contra bot: el rival responde. Manual: controlas ambos equipos.</div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Ronda, turno y fase</div>';
  h += '<div class="sb-row"><label>Ronda</label><input type="number" id="sbRound" value="' + c.round + '" min="1"></div>';
  h += '<div class="sb-row"><button class="sb-btn" id="sbNextRoundBtn" style="flex:1;">⏭️ Siguiente ronda</button><button class="sb-btn danger" id="sbForceEndRoundBtn" style="flex:1;">⏹️ Fin de ronda</button></div>';
  h += '<div class="sb-row"><label>Turno</label><select id="sbTurn" style="flex:1;"><option value="player"' + (c.turn === 'player' ? ' selected' : '') + '>J1</option><option value="bot"' + (c.turn === 'bot' ? ' selected' : '') + '>J2</option></select></div>';
  h += '<div class="sb-row"><label>Fase</label><select id="sbPhase" style="flex:1;">' + ['playing','rolling','drawing','ended'].map(function(p){ return '<option value="' + p + '"' + (c.phase === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></div>';
  h += '<div class="sb-row"><label>J1 fin</label><input type="checkbox" id="sbPlayerDone"' + (c.playerDone ? ' checked' : '') + '></div>';
  h += '<div class="sb-row"><label>J2 fin</label><input type="checkbox" id="sbBotDone"' + (c.botDone ? ' checked' : '') + '></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Forzar resultado</div>';
  h += '<div class="sb-row"><button class="sb-btn warn" id="sbWinPlayerBtn" style="flex:1;">🏆 Gana J1</button><button class="sb-btn warn" id="sbWinBotBtn" style="flex:1;">🏆 Gana J2</button></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Consonancia (forzar)</div>';
  ['player','bot'].forEach(function(sk){
    var cons = c[sk].consonance || {};
    var curEl = cons.element || '';
    var curType = cons.type || 'diverse';
    h += '<div class="sb-row"><label>' + (sk === 'player' ? 'J1' : 'J2') + '</label><select data-sb-cons="' + sk + '" style="flex:1;">';
    h += '<option value="diverse"' + (curType === 'diverse' ? ' selected' : '') + '>🌈 Diverso</option>';
    CONSONANCE_ORDER.forEach(function(el){
      h += '<option value="' + el + '"' + (curType === 'single' && curEl === el ? ' selected' : '') + '>' + ELEMENT_EMOJI[el] + ' ' + ELEMENT_NAMES[el] + '</option>';
    });
    h += '</select></div>';
  });
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Contadores del lado</div>';
  ['player','bot'].forEach(function(sk){
    var side = c[sk];
    h += '<div style="margin:0.4rem 0 0.2rem;font-size:0.68rem;font-weight:800;color:#5cb3ff;text-transform:uppercase;">' + (sk === 'player' ? 'J1' : 'J2') + '</div>';
    SB_SIDE_NUMS.forEach(function(k){
      h += '<div class="sb-row"><label>' + k + '</label><input type="number" data-sb-snum="' + sk + ':' + k + '" value="' + (side[k] || 0) + '" min="0"></div>';
    });
    h += '<div class="sb-row"><label>firstChangeUsed</label><input type="checkbox" data-sb-sbool="' + sk + ':firstChangeUsed"' + (side.firstChangeUsed ? ' checked' : '') + '></div>';
    h += '<div class="sb-row"><label>firstAttackUsed</label><input type="checkbox" data-sb-sbool="' + sk + ':firstAttackUsed"' + (side.firstAttackUsed ? ' checked' : '') + '></div>';
    h += '<div class="sb-row"><label>alterUltBuff amount</label><input type="number" data-sb-alter-amt="' + sk + '" value="' + ((side.alterUltBuff && side.alterUltBuff.amount) || 0) + '" min="0"></div>';
    h += '<div class="sb-row"><label>alterUltBuff rounds</label><input type="number" data-sb-alter-rnd="' + sk + '" value="' + ((side.alterUltBuff && side.alterUltBuff.roundsLeft) || 0) + '" min="0"></div>';
  });
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Vista general</div>';
  ['player','bot'].forEach(function(sk){
    var side = c[sk];
    h += '<div style="margin:0.3rem 0 0.1rem;font-size:0.68rem;font-weight:800;color:#5cb3ff;">' + (sk === 'player' ? 'J1' : 'J2') + '</div>';
    side.characters.forEach(function(cs, i){
      var isActive = i === side.activeIndex;
      h += '<div class="sb-row" style="font-size:0.7rem;"><span style="flex:1;">' + (isActive ? '⭐ ' : '') + cs.character.name + (cs.dead ? ' 💀' : '') + '</span><span style="color:' + (cs.dead ? '#ff8a98' : '#7aff9a') + ';">' + (cs.dead ? 'KO' : cs.hp + 'HP · ' + cs.energy + 'E') + '</span></div>';
    });
    h += '<div class="sb-row" style="font-size:0.7rem;"><span style="flex:1;">Deck/Hand/Discard</span><span>' + side.deck.length + ' / ' + side.hand.length + ' / ' + (side.discardPile ? side.discardPile.length : 0) + '</span></div>';
  });
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Global</div>';
  h += '<div class="sb-row"><label>EX combate</label><input type="checkbox" id="sbExEnabled"' + (c.exCombatEnabled ? ' checked' : '') + '></div>';
  h += '<div class="sb-row"><button class="sb-btn warn" id="sbEndCombatBtn" style="width:100%;">⏹ Terminar combate</button></div>';
  h += '</div>';

  return h;
}

/* ─── PERSONAJE ─── */
function sbRenderChar() {
  if (!combatState) return '';
  var sideKey = sandboxCharSide, side = combatState[sideKey];
  var cs = side.characters[sandboxCharIdx] || side.characters[0];
  if (!cs) return '';
  var h = '';

  h += '<div class="sb-section"><div class="sb-section-title">Selecciona personaje</div><div class="sb-char-selector">';
  h += '<button class="sb-char-chip' + (sideKey === 'player' ? ' active' : '') + '" data-sb-side="player" style="--el: 140,180,230;">J1</button>';
  h += '<button class="sb-char-chip' + (sideKey === 'bot' ? ' active' : '') + '" data-sb-side="bot" style="--el: 200,45,60;">J2</button>';
  side.characters.forEach(function(c, i){
    h += '<button class="sb-char-chip' + (i === sandboxCharIdx ? ' active' : '') + '" data-sb-char-idx="' + i + '" style="--el:' + ELEMENT_COLORS[c.character.element] + ';">' + c.character.emoji + ' ' + c.character.name + '</button>';
  });
  h += '</div>';
  h += '<div class="sb-row"><label>ID</label><span>' + cs.id + '</span></div>';
  h += '<div class="sb-row"><label>HP</label><input type="number" id="sbHp" value="' + cs.hp + '" min="0" max="' + cs.maxHp + '"> / ' + cs.maxHp + '</div>';
  h += '<div class="sb-row"><label>Max HP</label><input type="number" id="sbMaxHp" value="' + cs.maxHp + '" min="1"></div>';
  h += '<div class="sb-row"><label>Energía</label><input type="number" id="sbEnergy" value="' + cs.energy + '" min="0" max="' + cs.maxEnergy + '"> / ' + cs.maxEnergy + '</div>';
  h += '<div class="sb-row"><label>Max energía</label><input type="number" id="sbMaxEnergy" value="' + cs.maxEnergy + '" min="1"></div>';
  h += '<div class="sb-row"><button class="sb-btn" id="sbSetActiveBtn" style="flex:1;">⭐ Poner activo</button><button class="sb-btn danger" id="sbKillChar" style="flex:1;">💀 Matar</button></div>';
  h += '<div class="sb-row"><button class="sb-btn warn" id="sbFullHeal" style="width:100%;">💚 Curar al máximo</button></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Escudos</div>';
  h += '<div class="sb-row"><label>Total</label><span>' + totalShield(cs) + '</span></div>';
  (cs.shields || []).forEach(function(sh, i){
    h += '<div class="sb-row"><span style="flex:1;font-size:0.72rem;">🛡️ ' + sh.hp + '/' + sh.maxHp + ' (' + sh.source + ')</span><button class="sb-btn danger" data-sb-rm-shield="' + i + '">✕</button></div>';
  });
  h += '<div class="sb-row"><input type="number" id="sbShieldAmt" value="1" min="0" style="width:55px;"><input type="text" id="sbShieldSrc" placeholder="fuente" value="sandbox" style="flex:1;padding:0.3rem 0.5rem;background:rgba(0,0,0,0.4);border:1px solid rgba(92,179,255,0.3);border-radius:8px;color:#fff;font-family:inherit;font-size:0.78rem;"><button class="sb-btn" id="sbAddShield">+</button></div>';
  h += '<div class="sb-row"><button class="sb-btn danger" id="sbShieldClear" style="width:100%;">Vaciar escudos</button></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Estados</div>';
  SB_STATE_KEYS.forEach(function(k){
    h += '<div class="sb-row"><label>' + k + '</label><input type="checkbox" data-sb-state="' + k + '"' + (cs.states && cs.states[k] ? ' checked' : '') + '></div>';
  });
  SB_NUMERIC_KEYS.forEach(function(k){
    h += '<div class="sb-row"><label>' + k + '</label><input type="number" data-sb-state-num="' + k + '" value="' + ((cs.states && cs.states[k]) || 0) + '" min="0"></div>';
  });
  h += '<div class="sb-row"><label>manuelStacks</label><input type="number" id="sbManuelStacks" value="' + (cs.manuelStacks || 0) + '" min="0"></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Marcas</div>';
  CONSONANCE_ORDER.forEach(function(el){
    h += '<div class="sb-row"><label>' + ELEMENT_EMOJI[el] + ' ' + ELEMENT_NAMES[el] + '</label><input type="checkbox" data-sb-mark="' + el + '"' + (cs.marks && cs.marks[el] ? ' checked' : '') + '></div>';
  });
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Bonos y modificadores</div>';
  h += '<div class="sb-row"><label>pendingBuff</label><input type="number" id="sbPendingBuff" value="' + (cs.pendingBuff || 0) + '" min="0"></div>';
  h += '<div class="sb-row"><label>cardNextAttackBonus</label><input type="number" id="sbCardAtkBonus" value="' + (cs.cardNextAttackBonus || 0) + '" min="0"></div>';
  h += '<div class="sb-row"><label>cardNextAttackPiercing</label><input type="checkbox" id="sbCardPierce"' + (cs.cardNextAttackPiercing ? ' checked' : '') + '></div>';
  h += '<div class="sb-row"><label>cardNextAttackDouble</label><input type="checkbox" id="sbCardDouble"' + (cs.cardNextAttackDouble ? ' checked' : '') + '></div>';
  h += '<div class="sb-row"><label>cardNextAbilityDiscount</label><input type="number" id="sbCardDisc" value="' + (cs.cardNextAbilityDiscount || 0) + '" min="0"></div>';
  h += '<div class="sb-row"><label>cardNextAbilityFree</label><input type="checkbox" id="sbCardFree"' + (cs.cardNextAbilityFree ? ' checked' : '') + '></div>';
  h += '<div class="sb-row"><label>cardMarkBonus</label><input type="number" id="sbCardMarkBonus" value="' + (cs.cardMarkBonus || 0) + '" min="0"></div>';
  h += '<div class="sb-row"><label>exActive</label><input type="checkbox" id="sbExActive"' + (cs.exActive ? ' checked' : '') + '></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Equipamiento</div>';
  (cs.equipment || []).forEach(function(eqId, i){
    var eq = CARD_DB[eqId]; if (!eq) return;
    h += '<div class="sb-row"><span style="flex:1;font-size:0.72rem;">' + eq.emoji + ' ' + eq.name + '</span><button class="sb-btn danger" data-sb-rm-equip="' + i + '">✕</button></div>';
  });
  if (!cs.equipment || !cs.equipment.length) h += '<div class="sb-row" style="font-style:italic;color:var(--muted);font-size:0.72rem;">Sin equipamiento</div>';
  h += '<div class="sb-row"><select id="sbAddEquipSel" style="flex:1;font-size:0.7rem;"><option value="">— Añadir —</option>' + SB_EQUIP_IDS.map(function(id){ var eq = EQUIPMENT_CARDS[id]; return '<option value="' + id + '">' + eq.emoji + ' ' + eq.name + '</option>'; }).join('') + '</select><button class="sb-btn" id="sbAddEquipBtn">+</button></div>';
  h += '<div class="sb-row"><button class="sb-btn danger" id="sbClearEquip" style="width:100%;">Vaciar equipamiento</button></div>';
  h += '<div class="sb-row"><label>Pintura Erik</label><select id="sbPaint" style="flex:1;"><option value="">—</option>' + ['roja','azul','verde'].map(function(c){ return '<option value="' + c + '"' + (cs.paintEquipped === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>';
  h += '</div>';

  return h;
}

/* ─── DADOS ─── */
function sbRenderDice() {
  if (!combatState) return '';
  var h = '';
  ['player','bot'].forEach(function(sk){
    var side = combatState[sk];
    h += '<div class="sb-section"><div class="sb-section-title">Dados ' + (sk === 'player' ? 'J1' : 'J2') + ' (' + side.dice.length + ')</div>';
    if (side.dice.length) {
      side.dice.forEach(function(d, i){
        var isOm = d.type === 'omni';
        h += '<div class="sb-row"><span style="width:24px;text-align:center;">' + (isOm ? '✨' : ELEMENT_EMOJI[d.type]) + '</span>';
        h += '<select data-sb-die-type="' + sk + ':' + i + '" style="flex:1;font-size:0.7rem;"><option value="omni"' + (isOm ? ' selected' : '') + '>omni</option>' + CONSONANCE_ORDER.map(function(el){ return '<option value="' + el + '"' + (d.type === el ? ' selected' : '') + '>' + ELEMENT_NAMES[el] + '</option>'; }).join('') + '</select>';
        h += '<button class="sb-btn danger" data-sb-rm-die="' + sk + ':' + i + '">✕</button></div>';
      });
    } else {
      h += '<div class="sb-row" style="font-style:italic;color:var(--muted);font-size:0.72rem;">Sin dados</div>';
    }
    h += '<div class="sb-row"><select data-sb-add-die-sel="' + sk + '" style="flex:1;font-size:0.7rem;"><option value="omni">✨ omni</option>' + CONSONANCE_ORDER.map(function(el){ return '<option value="' + el + '">' + ELEMENT_EMOJI[el] + ' ' + ELEMENT_NAMES[el] + '</option>'; }).join('') + '</select><input type="number" data-sb-add-die-count="' + sk + '" value="1" min="1" style="width:50px;padding:0.3rem;background:rgba(0,0,0,0.4);border:1px solid rgba(92,179,255,0.3);border-radius:8px;color:#fff;font-family:inherit;font-size:0.8rem;"><button class="sb-btn" data-sb-add-die-btn="' + sk + '">+</button></div>';
    h += '<div class="sb-row"><button class="sb-btn" data-sb-add-specific="' + sk + ':omni" title="+1 omni">✨</button>';
    CONSONANCE_ORDER.forEach(function(el){
      h += '<button class="sb-btn" data-sb-add-specific="' + sk + ':' + el + '" style="background:rgba(' + ELEMENT_COLORS[el] + ',0.2);border-color:rgba(' + ELEMENT_COLORS[el] + ',0.6);color:rgb(' + ELEMENT_COLORS[el] + ');" title="+1 ' + ELEMENT_NAMES[el] + '">' + ELEMENT_EMOJI[el] + '</button>';
    });
    h += '</div>';
    h += '<div class="sb-row"><button class="sb-btn" data-sb-roll-dice="' + sk + '">🎲 Tirar 8</button><button class="sb-btn danger" data-sb-clear-dice="' + sk + '" style="flex:1;">Vaciar</button></div>';
    h += '</div>';
  });
  return h;
}

/* ─── CARTAS ─── */
function sbRenderCards() {
  if (!combatState) return '';
  var h = '';
  ['player','bot'].forEach(function(sk){
    var side = combatState[sk];
    h += '<div class="sb-section"><div class="sb-section-title">Mano ' + (sk === 'player' ? 'J1' : 'J2') + ' (' + side.hand.length + ')</div>';
    side.hand.forEach(function(cid, i){
      var card = CARD_DB[cid] || PAINT_CARDS[cid];
      h += '<div class="sb-row"><span style="flex:1;font-size:0.7rem;">' + (card ? card.emoji + ' ' + card.name : cid) + '</span><button class="sb-btn danger" data-sb-rm-hand="' + sk + ':' + i + '">✕</button></div>';
    });
    if (!side.hand.length) h += '<div class="sb-row" style="font-style:italic;color:var(--muted);font-size:0.72rem;">Mano vacía</div>';
    h += '<div class="sb-row"><select data-sb-add-card-sel="' + sk + '" style="flex:1;font-size:0.7rem;"><option value="">— Elegir carta —</option>' + SB_CARD_IDS.map(function(id){ var c = CARD_DB[id]; return '<option value="' + id + '">' + c.emoji + ' ' + c.name + ' [' + c.category + ']</option>'; }).join('') + '</select><input type="number" data-sb-add-card-count="' + sk + '" value="1" min="1" style="width:50px;padding:0.3rem;background:rgba(0,0,0,0.4);border:1px solid rgba(92,179,255,0.3);border-radius:8px;color:#fff;font-family:inherit;font-size:0.8rem;"><button class="sb-btn" data-sb-add-card-btn="' + sk + '">+</button></div>';
    h += '<div class="sb-row"><button class="sb-btn" data-sb-draw="' + sk + '">Robar 1</button><button class="sb-btn" data-sb-draw-n="' + sk + '">Robar 5</button><button class="sb-btn danger" data-sb-clear-hand="' + sk + '">Vaciar</button></div>';
    h += '<div class="sb-row" style="font-size:0.7rem;"><span style="flex:1;">Deck/Discard</span><span>' + side.deck.length + ' / ' + (side.discardPile ? side.discardPile.length : 0) + '</span></div>';
    h += '<div class="sb-row"><button class="sb-btn warn" data-sb-reshuffle="' + sk + '">♻️ Barajar descarte al mazo</button></div>';
    h += '</div>';

    h += '<div class="sb-section"><div class="sb-section-title">Apoyos ' + (sk === 'player' ? 'J1' : 'J2') + '</div>';
    for (var i = 0; i < 4; i++) {
      var sp = side.supports[i];
      if (sp) {
        var spC = CARD_DB[sp.cardId];
        h += '<div class="sb-row"><span style="flex:1;font-size:0.72rem;">' + (spC ? spC.emoji + ' ' + spC.name : sp.cardId) + ' (' + sp.duration + 'r)</span><button class="sb-btn danger" data-sb-rm-support="' + sk + ':' + i + '">✕</button></div>';
      } else {
        h += '<div class="sb-row"><span style="flex:1;font-size:0.72rem;color:var(--muted);">Slot ' + (i+1) + ' vacío</span></div>';
      }
    }
    h += '<div class="sb-row"><select data-sb-add-support-sel="' + sk + '" style="flex:1;font-size:0.7rem;"><option value="">— Añadir apoyo —</option>' + SB_SUPPORT_IDS.map(function(id){ var c = SUPPORT_CARDS[id]; return '<option value="' + id + '">' + c.emoji + ' ' + c.name + '</option>'; }).join('') + '</select><button class="sb-btn" data-sb-add-support-btn="' + sk + '">+</button></div>';
    h += '</div>';
  });
  return h;
}

/* ─── EFECTOS ─── */
function sbRenderFx() {
  if (!combatState) return '';
  var h = '';

  h += '<div class="sb-section"><div class="sb-section-title">Daño / Curación / Escudo</div>';
  h += '<div class="sb-row"><label>Objetivo</label>' + sbTargetSelect(null, 'sbFxTarget') + '</div>';
  h += '<div class="sb-row"><label>Daño</label><input type="number" id="sbFxDmg" value="1" min="0" style="width:60px;"><label style="flex:0;min-width:auto;">Piercing</label><input type="checkbox" id="sbFxPierce"></div>';
  h += '<div class="sb-row"><button class="sb-btn" id="sbApplyDmg" style="flex:1;">💥 Daño</button><button class="sb-btn warn" id="sbApplyDmgAll" style="flex:1;">💥 A todos</button></div>';
  h += '<div class="sb-row"><label>Curación</label><input type="number" id="sbFxHeal" value="1" min="0" style="width:60px;"></div>';
  h += '<div class="sb-row"><button class="sb-btn" id="sbApplyHeal" style="flex:1;">💚 Curar</button><button class="sb-btn warn" id="sbApplyHealAll" style="flex:1;">💚 A todos</button></div>';
  h += '<div class="sb-row"><label>Escudo</label><input type="number" id="sbFxShield" value="1" min="0" style="width:60px;"><input type="text" id="sbFxShieldSrc" value="sandbox" style="flex:1;padding:0.3rem 0.5rem;background:rgba(0,0,0,0.4);border:1px solid rgba(92,179,255,0.3);border-radius:8px;color:#fff;font-family:inherit;font-size:0.78rem;"></div>';
  h += '<div class="sb-row"><button class="sb-btn" id="sbApplyShield" style="flex:1;">🛡️ Dar escudo</button><button class="sb-btn danger" id="sbClearShields" style="flex:1;">Vaciar escudos</button></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Estados / Marcas</div>';
  h += '<div class="sb-row"><label>Objetivo</label>' + sbTargetSelect(null, 'sbFxTarget2') + '</div>';
  h += '<div class="sb-row"><label>Estado</label><select id="sbFxState" style="flex:1;">' + SB_STATE_KEYS.map(function(k){ return '<option value="' + k + '">' + k + '</option>'; }).join('') + '</select></div>';
  h += '<div class="sb-row"><button class="sb-btn" id="sbFxStateOn">✅ Activar</button><button class="sb-btn danger" id="sbFxStateOff">❌ Desactivar</button></div>';
  h += '<div class="sb-row"><label>Marca</label><select id="sbFxMark" style="flex:1;">' + CONSONANCE_ORDER.map(function(el){ return '<option value="' + el + '">' + ELEMENT_EMOJI[el] + ' ' + ELEMENT_NAMES[el] + '</option>'; }).join('') + '</select></div>';
  h += '<div class="sb-row"><button class="sb-btn" id="sbFxMarkAdd">🏷️ Aplicar</button><button class="sb-btn danger" id="sbFxMarkRemove">❌ Quitar</button></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Resonancias</div>';
  h += '<div class="sb-row"><label>A</label><select id="sbResA" style="flex:1;">' + CONSONANCE_ORDER.map(function(el){ return '<option value="' + el + '">' + ELEMENT_EMOJI[el] + ' ' + ELEMENT_NAMES[el] + '</option>'; }).join('') + '</select></div>';
  h += '<div class="sb-row"><label>B</label><select id="sbResB" style="flex:1;">' + CONSONANCE_ORDER.map(function(el){ return '<option value="' + el + '">' + ELEMENT_EMOJI[el] + ' ' + ELEMENT_NAMES[el] + '</option>'; }).join('') + '</select></div>';
  h += '<div class="sb-row"><button class="sb-btn" id="sbForceResonance" style="width:100%;">🔮 Disparar resonancia</button></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Probar carta</div>';
  h += '<div class="sb-row"><select id="sbTestCard" style="flex:1;font-size:0.7rem;"><option value="">— Elegir carta —</option>' + SB_CARD_IDS.map(function(id){ var c = CARD_DB[id]; return '<option value="' + id + '">' + c.emoji + ' ' + c.name + '</option>'; }).join('') + '</select><button class="sb-btn" id="sbTestCardBtn">▶️</button></div>';
  h += '<div class="sb-row" style="font-size:0.65rem;color:var(--muted);font-style:italic;">Aplica el efecto sin gastar dados. Usa el turno actual para determinar el lado.</div>';
  h += '</div>';

  return h;
}

/* ─── EVENTOS ─── */
function sbBindEvents() {
  var body = document.getElementById('sandboxBody');
  if (!body || !combatState) return;

  function getCs() { return combatState[sandboxCharSide].characters[sandboxCharIdx]; }
  function refresh() { renderCombat(); renderSandboxPanel(); }

  body.querySelectorAll('[data-sb-side]').forEach(function(el){
    el.addEventListener('click', function(){ sandboxCharSide = el.dataset.sbSide; sandboxCharIdx = 0; renderSandboxPanel(); });
  });
  body.querySelectorAll('[data-sb-char-idx]').forEach(function(el){
    el.addEventListener('click', function(){ sandboxCharIdx = parseInt(el.dataset.sbCharIdx, 10); renderSandboxPanel(); });
  });

  // ── Personaje: HP / energía / acciones ──
  var hpEl = document.getElementById('sbHp');
  if (hpEl) hpEl.addEventListener('change', function(){ getCs().hp = Math.max(0, Math.min(getCs().maxHp, parseInt(hpEl.value, 10) || 0)); refresh(); });
  var maxHpEl = document.getElementById('sbMaxHp');
  if (maxHpEl) maxHpEl.addEventListener('change', function(){ getCs().maxHp = Math.max(1, parseInt(maxHpEl.value, 10) || 1); if (getCs().hp > getCs().maxHp) getCs().hp = getCs().maxHp; refresh(); });
  var enEl = document.getElementById('sbEnergy');
  if (enEl) enEl.addEventListener('change', function(){ getCs().energy = Math.max(0, Math.min(getCs().maxEnergy, parseInt(enEl.value, 10) || 0)); refresh(); });
  var maxEnEl = document.getElementById('sbMaxEnergy');
  if (maxEnEl) maxEnEl.addEventListener('change', function(){ getCs().maxEnergy = Math.max(1, parseInt(maxEnEl.value, 10) || 1); if (getCs().energy > getCs().maxEnergy) getCs().energy = getCs().maxEnergy; refresh(); });
  var activeBtn = document.getElementById('sbSetActiveBtn');
  if (activeBtn) activeBtn.addEventListener('click', function(){ combatState[sandboxCharSide].activeIndex = sandboxCharIdx; refresh(); });
  var killBtn = document.getElementById('sbKillChar');
  if (killBtn) killBtn.addEventListener('click', function(){ getCs().hp = 0; handleDeath(sandboxCharSide, sandboxCharIdx); refresh(); });
  var healBtn = document.getElementById('sbFullHeal');
  if (healBtn) healBtn.addEventListener('click', function(){ getCs().hp = getCs().maxHp; getCs().dead = false; refresh(); });

  // ── Escudos ──
  body.querySelectorAll('[data-sb-rm-shield]').forEach(function(el){
    el.addEventListener('click', function(){ if (getCs().shields) getCs().shields.splice(parseInt(el.dataset.sbRmShield, 10), 1); refresh(); });
  });
  var addShieldBtn = document.getElementById('sbAddShield');
  if (addShieldBtn) addShieldBtn.addEventListener('click', function(){
    var amt = parseInt(document.getElementById('sbShieldAmt').value, 10) || 1;
    var src = document.getElementById('sbShieldSrc').value || 'sandbox';
    addOrRefreshShield(getCs(), src, amt); refresh();
  });
  var shieldClearBtn = document.getElementById('sbShieldClear');
  if (shieldClearBtn) shieldClearBtn.addEventListener('click', function(){ getCs().shields = []; refresh(); });

  // ── Estados y numéricos ──
  body.querySelectorAll('[data-sb-state]').forEach(function(el){
    el.addEventListener('change', function(){ csSetState(getCs(), el.dataset.sbState, el.checked); refresh(); });
  });
  body.querySelectorAll('[data-sb-state-num]').forEach(function(el){
    el.addEventListener('change', function(){ csSetState(getCs(), el.dataset.sbStateNum, Math.max(0, parseInt(el.value, 10) || 0)); refresh(); });
  });
  var manuelEl = document.getElementById('sbManuelStacks');
  if (manuelEl) manuelEl.addEventListener('change', function(){ getCs().manuelStacks = Math.max(0, parseInt(manuelEl.value, 10) || 0); refresh(); });

  // ── Marcas ──
  body.querySelectorAll('[data-sb-mark]').forEach(function(el){
    el.addEventListener('change', function(){
      if (el.checked) { if (!getCs().marks) getCs().marks = {}; getCs().marks[el.dataset.sbMark] = true; }
      else { csRemoveMark(getCs(), el.dataset.sbMark); }
      refresh();
    });
  });

  // ── Bonos numéricos / booleanos ──
  var numMap = { sbPendingBuff:'pendingBuff', sbCardAtkBonus:'cardNextAttackBonus', sbCardDisc:'cardNextAbilityDiscount', sbCardMarkBonus:'cardMarkBonus' };
  Object.keys(numMap).forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', function(){ getCs()[numMap[id]] = Math.max(0, parseInt(el.value, 10) || 0); refresh(); });
  });
  var boolMap = { sbCardPierce:'cardNextAttackPiercing', sbCardDouble:'cardNextAttackDouble', sbCardFree:'cardNextAbilityFree', sbExActive:'exActive' };
  Object.keys(boolMap).forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', function(){
      var cs = getCs();
      cs[boolMap[id]] = el.checked;
      // ✅ Neón: la EX cambia su HP máximo entre 6 y 8
      if (cs.id === 'neon' && id === 'sbExActive') {
        var targetMax = el.checked ? 8 : 6;
        var diff = targetMax - cs.maxHp;
        cs.maxHp = targetMax;
        if (diff > 0) cs.hp = Math.min(cs.maxHp, cs.hp + diff);
        else cs.hp = Math.min(cs.hp, cs.maxHp);
      }
      refresh();
    });
  });

  // ── Equipamiento ──
  body.querySelectorAll('[data-sb-rm-equip]').forEach(function(el){
    el.addEventListener('click', function(){ if (getCs().equipment) getCs().equipment.splice(parseInt(el.dataset.sbRmEquip, 10), 1); refresh(); });
  });
  var addEquipBtn = document.getElementById('sbAddEquipBtn');
  if (addEquipBtn) addEquipBtn.addEventListener('click', function(){
    var sel = document.getElementById('sbAddEquipSel');
    if (!sel.value) return;
    if (!getCs().equipment) getCs().equipment = [];
    if (getCs().equipment.length >= 2) getCs().equipment.shift();
    getCs().equipment.push(sel.value);
    refresh();
  });
  var clearEquipBtn = document.getElementById('sbClearEquip');
  if (clearEquipBtn) clearEquipBtn.addEventListener('click', function(){ getCs().equipment = []; refresh(); });
  var paintEl = document.getElementById('sbPaint');
  if (paintEl) paintEl.addEventListener('change', function(){ getCs().paintEquipped = paintEl.value || null; refresh(); });

  // ── GLOBAL: ronda / turno / fase / fin ──
  var rEl = document.getElementById('sbRound');
  if (rEl) rEl.addEventListener('change', function(){ combatState.round = Math.max(1, parseInt(rEl.value, 10) || 1); refresh(); });
  var tEl = document.getElementById('sbTurn');
  if (tEl) tEl.addEventListener('change', function(){ combatState.turn = tEl.value; refresh(); });
  var pEl = document.getElementById('sbPhase');
  if (pEl) pEl.addEventListener('change', function(){ combatState.phase = pEl.value; refresh(); });
  var pd = document.getElementById('sbPlayerDone');
  if (pd) pd.addEventListener('change', function(){ combatState.playerDone = pd.checked; refresh(); });
  var bd = document.getElementById('sbBotDone');
  if (bd) bd.addEventListener('change', function(){ combatState.botDone = bd.checked; refresh(); });

  var nextRoundBtn = document.getElementById('sbNextRoundBtn');
  if (nextRoundBtn) nextRoundBtn.addEventListener('click', function(){ try { endRound(); } catch (e) { console.error(e); } });
  var forceEndRoundBtn = document.getElementById('sbForceEndRoundBtn');
  if (forceEndRoundBtn) forceEndRoundBtn.addEventListener('click', function(){ try { endRound(); } catch (e) { console.error(e); } });

  var winP = document.getElementById('sbWinPlayerBtn');
  if (winP) winP.addEventListener('click', function(){ endCombat('player'); });
  var winB = document.getElementById('sbWinBotBtn');
  if (winB) winB.addEventListener('click', function(){ endCombat('bot'); });

  // ── GLOBAL: consonancia forzada ──
  body.querySelectorAll('[data-sb-cons]').forEach(function(sel){
    sel.addEventListener('change', function(){
      var sk = sel.dataset.sbCons;
      var v = sel.value;
      if (v === 'diverse') combatState[sk].consonance = { type:'diverse', level:3 };
      else combatState[sk].consonance = { type:'single', element:v, level:3 };
      refresh();
    });
  });

  // ── GLOBAL: contadores del lado ──
  body.querySelectorAll('[data-sb-snum]').forEach(function(el){
    el.addEventListener('change', function(){
      var parts = el.dataset.sbSnum.split(':');
      combatState[parts[0]][parts[1]] = Math.max(0, parseInt(el.value, 10) || 0);
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-sbool]').forEach(function(el){
    el.addEventListener('change', function(){
      var parts = el.dataset.sbSbool.split(':');
      combatState[parts[0]][parts[1]] = el.checked;
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-alter-amt]').forEach(function(el){
    el.addEventListener('change', function(){
      var sk = el.dataset.sbAlterAmt;
      if (!combatState[sk].alterUltBuff) combatState[sk].alterUltBuff = { amount:0, roundsLeft:0 };
      combatState[sk].alterUltBuff.amount = Math.max(0, parseInt(el.value, 10) || 0);
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-alter-rnd]').forEach(function(el){
    el.addEventListener('change', function(){
      var sk = el.dataset.sbAlterRnd;
      if (!combatState[sk].alterUltBuff) combatState[sk].alterUltBuff = { amount:0, roundsLeft:0 };
      combatState[sk].alterUltBuff.roundsLeft = Math.max(0, parseInt(el.value, 10) || 0);
      refresh();
    });
  });

  var exE = document.getElementById('sbExEnabled');
  if (exE) exE.addEventListener('change', function(){ combatState.exCombatEnabled = exE.checked; refresh(); });
  var endC = document.getElementById('sbEndCombatBtn');
  if (endC) endC.addEventListener('click', function(){ closeSandboxPanel(); endCombat(combatState.winner || 'player'); });

  // ── DADOS ──
  body.querySelectorAll('[data-sb-die-type]').forEach(function(sel){
    sel.addEventListener('change', function(){
      var parts = sel.dataset.sbDieType.split(':');
      var d = combatState[parts[0]].dice[parseInt(parts[1], 10)];
      if (d) { d.type = sel.value; refresh(); }
    });
  });
  body.querySelectorAll('[data-sb-rm-die]').forEach(function(el){
    el.addEventListener('click', function(){
      var parts = el.dataset.sbRmDie.split(':');
      combatState[parts[0]].dice.splice(parseInt(parts[1], 10), 1);
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-add-die-btn]').forEach(function(el){
    el.addEventListener('click', function(){
      var sk = el.dataset.sbAddDieBtn;
      var sel = document.querySelector('[data-sb-add-die-sel="' + sk + '"]');
      var cnt = parseInt(document.querySelector('[data-sb-add-die-count="' + sk + '"]').value, 10) || 1;
      for (var i = 0; i < cnt; i++) combatState[sk].dice.push({ type: sel.value, id: uid(), justAdded: true });
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-add-specific]').forEach(function(el){
    el.addEventListener('click', function(){
      var parts = el.dataset.sbAddSpecific.split(':');
      combatState[parts[0]].dice.push({ type: parts[1], id: uid(), justAdded: true });
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-roll-dice]').forEach(function(el){
    el.addEventListener('click', function(){ combatState[el.dataset.sbRollDice].dice = rollCombatDice(8); refresh(); });
  });
  body.querySelectorAll('[data-sb-clear-dice]').forEach(function(el){
    el.addEventListener('click', function(){ combatState[el.dataset.sbClearDice].dice = []; refresh(); });
  });

  // ── CARTAS ──
  body.querySelectorAll('[data-sb-rm-hand]').forEach(function(el){
    el.addEventListener('click', function(){
      var parts = el.dataset.sbRmHand.split(':');
      combatState[parts[0]].hand.splice(parseInt(parts[1], 10), 1);
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-add-card-btn]').forEach(function(el){
    el.addEventListener('click', function(){
      var sk = el.dataset.sbAddCardBtn;
      var sel = document.querySelector('[data-sb-add-card-sel="' + sk + '"]');
      if (!sel.value) return;
      var cnt = parseInt(document.querySelector('[data-sb-add-card-count="' + sk + '"]').value, 10) || 1;
      for (var i = 0; i < cnt; i++) combatState[sk].hand.push(sel.value);
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-draw]').forEach(function(el){
    el.addEventListener('click', function(){ drawFromDeck(el.dataset.sbDraw); refresh(); });
  });
  body.querySelectorAll('[data-sb-draw-n]').forEach(function(el){
    el.addEventListener('click', function(){ for (var i = 0; i < 5; i++) drawFromDeck(el.dataset.sbDrawN); refresh(); });
  });
  body.querySelectorAll('[data-sb-clear-hand]').forEach(function(el){
    el.addEventListener('click', function(){ combatState[el.dataset.sbClearHand].hand = []; refresh(); });
  });
  body.querySelectorAll('[data-sb-reshuffle]').forEach(function(el){
    el.addEventListener('click', function(){
      var side = combatState[el.dataset.sbReshuffle];
      if (!side.discardPile) side.discardPile = [];
      side.deck = side.deck.concat(side.discardPile);
      side.deck = shuffleArray(side.deck);
      side.discardPile = [];
      refresh();
    });
  });

  // ── APOYOS ──
  body.querySelectorAll('[data-sb-rm-support]').forEach(function(el){
    el.addEventListener('click', function(){
      var parts = el.dataset.sbRmSupport.split(':');
      combatState[parts[0]].supports[parseInt(parts[1], 10)] = null;
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-add-support-btn]').forEach(function(el){
    el.addEventListener('click', function(){
      var sk = el.dataset.sbAddSupportBtn;
      var sel = document.querySelector('[data-sb-add-support-sel="' + sk + '"]');
      if (!sel.value) return;
      var side = combatState[sk];
      if (!side.supports) side.supports = [null,null,null,null];
      var empty = side.supports.indexOf(null);
      if (empty === -1) empty = 0;
      var card = CARD_DB[sel.value];
      side.supports[empty] = { cardId: sel.value, duration: card.duration || 2 };
      refresh();
    });
  });

  // ── FX: daño / curación / escudo ──
  function splitTarget(sel) { var p = sel.value.split(':'); return { sk: p[0], idx: parseInt(p[1], 10) }; }

  var apD = document.getElementById('sbApplyDmg');
  if (apD) apD.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget'));
    var dmg = parseInt(document.getElementById('sbFxDmg').value, 10) || 0;
    var pierce = document.getElementById('sbFxPierce').checked;
    var s = combatState[t.sk];
    dealDamageToChar(s.characters[t.idx], dmg, { piercing: pierce, targetSide: s, targetSideKey: t.sk, targetIdx: t.idx });
    refresh();
  });
  var apDAll = document.getElementById('sbApplyDmgAll');
  if (apDAll) apDAll.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget'));
    var dmg = parseInt(document.getElementById('sbFxDmg').value, 10) || 0;
    var pierce = document.getElementById('sbFxPierce').checked;
    var enemySk = t.sk === 'player' ? 'bot' : 'player';
    var s = combatState[enemySk];
    s.characters.forEach(function(c, i){ if (!c.dead) dealDamageToChar(c, dmg, { piercing: pierce, targetSide: s, targetSideKey: enemySk, targetIdx: i }); });
    refresh();
  });

  var apH = document.getElementById('sbApplyHeal');
  if (apH) apH.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget'));
    var amt = parseInt(document.getElementById('sbFxHeal').value, 10) || 0;
    healChar(combatState[t.sk].characters[t.idx], amt);
    refresh();
  });
  var apHAll = document.getElementById('sbApplyHealAll');
  if (apHAll) apHAll.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget'));
    var amt = parseInt(document.getElementById('sbFxHeal').value, 10) || 0;
    var s = combatState[t.sk];
    s.characters.forEach(function(c){ if (!c.dead) healChar(c, amt); });
    refresh();
  });

  var apS = document.getElementById('sbApplyShield');
  if (apS) apS.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget'));
    var amt = parseInt(document.getElementById('sbFxShield').value, 10) || 0;
    var src = document.getElementById('sbFxShieldSrc').value || 'sandbox';
    addOrRefreshShield(combatState[t.sk].characters[t.idx], src, amt);
    refresh();
  });
  var clearShBtn = document.getElementById('sbClearShields');
  if (clearShBtn) clearShBtn.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget'));
    combatState[t.sk].characters[t.idx].shields = [];
    refresh();
  });

  // ── FX: estado / marca ──
  var stateOn = document.getElementById('sbFxStateOn');
  if (stateOn) stateOn.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget2'));
    var k = document.getElementById('sbFxState').value;
    csSetState(combatState[t.sk].characters[t.idx], k, true);
    refresh();
  });
  var stateOff = document.getElementById('sbFxStateOff');
  if (stateOff) stateOff.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget2'));
    var k = document.getElementById('sbFxState').value;
    csSetState(combatState[t.sk].characters[t.idx], k, false);
    refresh();
  });
  var markAdd = document.getElementById('sbFxMarkAdd');
  if (markAdd) markAdd.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget2'));
    var el = document.getElementById('sbFxMark').value;
    if (!combatState[t.sk].characters[t.idx].marks) combatState[t.sk].characters[t.idx].marks = {};
    combatState[t.sk].characters[t.idx].marks[el] = true;
    refresh();
  });
  var markRem = document.getElementById('sbFxMarkRemove');
  if (markRem) markRem.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget2'));
    var el = document.getElementById('sbFxMark').value;
    csRemoveMark(combatState[t.sk].characters[t.idx], el);
    refresh();
  });

  // ── FX: resonancia manual ──
  var fRes = document.getElementById('sbForceResonance');
  if (fRes) fRes.addEventListener('click', function(){
    var a = document.getElementById('sbResA').value, b = document.getElementById('sbResB').value;
    applyResonanceEffect(a, b, 'player', 'bot');
    refresh();
  });

  // ── FX: probar carta ──
  var testBtn = document.getElementById('sbTestCardBtn');
  if (testBtn) testBtn.addEventListener('click', function(){
    var sel = document.getElementById('sbTestCard');
    if (!sel.value) return;
    var card = CARD_DB[sel.value] || PAINT_CARDS[sel.value];
    if (!card) return;
    try { applyCardEffect(card); } catch (e) { console.error(e); }
    refresh();
  });

  var tmSel = document.getElementById('sbTurnMode');
  if (tmSel) tmSel.addEventListener('change', function(){
    var newMode = tmSel.value;
    var wasBot  = sandboxTurnMode === 'bot';
    var nowBot  = newMode === 'bot';

    sandboxTurnMode = newMode;

    if (combatState) {
      combatState.pvp = !nowBot;

      // ── A "solo usuario": forzar el turno al jugador y limpiar flags de fin
      if (newMode === 'player-only') {
        combatState.turn       = 'player';
        combatState.playerDone = false;
        combatState.botDone    = false;
      }

      // ── De dos-usuarios → bot: si es turno del rival, que el bot lo juegue
      if (nowBot && !wasBot && combatState.turn === 'bot'
          && !combatState.botDone && combatState.phase === 'playing') {
        setTimeout(botTurn, 800);
      }
    }

    renderCombat();
    renderSandboxPanel();
  });
}

var initFns = [
  ['renderPhilosophies', renderPhilosophies],
  ['renderConsonancias', renderConsonancias],
  ['renderCharFilter', renderCharFilter],
  ['renderResonances', renderResonances],
  ['renderDiceSimulator', renderDiceSimulator],
  ['applyFilters', applyFilters],
  ['addInfoButtons', addInfoButtons],
  ['setupCardClicks', setupCardClicks],
  ['setupCharSort', setupCharSort],
  ['renderTeamPanel', renderTeamPanel],
  ['renderCardFilter', renderCardFilter],
  ['renderDeckGrid', renderDeckGrid],
  ['setupDamageCalculator', setupDamageCalculator],
  ['renderTemplateSlots', renderTemplateSlots],
  ['initPatches', initPatches],
  ['initGameMode', initGameMode],
  ['initSandbox', initSandbox]
];

// En initSandbox:
function initSandbox() {
  // Toggle y cierre del panel
  document.addEventListener('click', function(e){
    var tgl = e.target.closest('#sandboxToggleBtn');
    if (tgl) {
      e.preventDefault();
      e.stopPropagation();
      if (sandboxOpen) closeSandboxPanel(); else openSandboxPanel();
      return;
    }
    var cl = e.target.closest('#sandboxCloseBtn');
    if (cl) {
      e.preventDefault();
      e.stopPropagation();
      closeSandboxPanel();
    }
  });

  // ✅ NUEVO: click en las pestañas del panel
  document.querySelectorAll('.sandbox-tab').forEach(function(tab){
    tab.addEventListener('click', function(e){
      e.preventDefault();
      document.querySelectorAll('.sandbox-tab').forEach(function(t){ t.classList.remove('active'); });
      tab.classList.add('active');
      sandboxTab = tab.dataset.sbTab || 'char';
      if (sandboxOpen) renderSandboxPanel();
    });
  });
}

initFns.forEach(function(p){ try { p[1](); } catch (e) { console.error('Init error in ' + p[0] + ':', e); } });
// Delegación permanente para el botón 👁️ de las plantillas
(function setupTemplateInfoDelegation(){
  var container = document.getElementById('templateSlots');
  if (!container) return;
  container.addEventListener('click', function(e){
    var btn = e.target.closest('.template-info-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    var s = parseInt(btn.dataset.slot, 10);
    if (isNaN(s)) return;
    var t = getTemplate(s);
    if (t) showTemplatePreview(t, s, null);
  });
})();

setTimeout(function(){ var rv = document.querySelectorAll('.reveal'); for (var i = 0; i < rv.length; i++) if (!rv[i].classList.contains('visible')) rv[i].classList.add('visible'); }, 2000);
console.log('Azaria TCG — init completado');

var canvas = document.getElementById('stars'), ctx = canvas ? canvas.getContext('2d') : null;
var stars = [], W, H;
function resizeBg(){ if (!canvas) return; W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; stars = []; for (var i = 0; i < 160; i++) stars.push({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.4+0.3, vx:(Math.random()-0.5)*0.12, vy:(Math.random()-0.5)*0.12, a:Math.random()*0.5+0.2 }); }
function drawBg(){ if (!ctx) return; ctx.clearRect(0,0,W,H); for (var i = 0; i < stars.length; i++){ var s = stars[i]; s.x += s.vx; s.y += s.vy; if (s.x<0) s.x=W; if (s.x>W) s.x=0; if (s.y<0) s.y=H; if (s.y>H) s.y=0; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fillStyle='rgba(240,220,180,'+s.a+')'; ctx.fill(); } for (var p=0;p<stars.length;p++) for (var q=p+1;q<stars.length;q++){ var dx=stars[p].x-stars[q].x, dy=stars[p].y-stars[q].y, d=Math.sqrt(dx*dx+dy*dy); if (d<120){ ctx.beginPath(); ctx.moveTo(stars[p].x,stars[p].y); ctx.lineTo(stars[q].x,stars[q].y); ctx.strokeStyle='rgba(240,200,96,'+((1-d/120)*0.12)+')'; ctx.lineWidth=0.5; ctx.stroke(); } } requestAnimationFrame(drawBg); }
window.addEventListener('resize', resizeBg); resizeBg(); drawBg();
var observer = new IntersectionObserver(function(entries){ entries.forEach(function(e, i){ if (e.isIntersecting) { setTimeout(function(){ e.target.classList.add('visible'); }, i * 60); observer.unobserve(e.target); } }); }, { threshold:0.1 });
document.querySelectorAll('.reveal').forEach(function(el){ observer.observe(el); });
var counterObs = new IntersectionObserver(function(entries){
  entries.forEach(function(entry){ if (!entry.isIntersecting) return; var el = entry.target, tgt = +el.dataset.target, sfx = el.dataset.suffix || '', start = performance.now();
    function up(now){ var p = Math.min((now - start) / 1800, 1), ez = 1 - Math.pow(1 - p, 3); el.textContent = Math.floor(ez * tgt).toLocaleString('es-ES') + sfx; if (p < 1) requestAnimationFrame(up); else el.textContent = tgt.toLocaleString('es-ES') + sfx; }
    requestAnimationFrame(up); counterObs.unobserve(el);
  });
}, { threshold:0.5 });
document.querySelectorAll('.num').forEach(function(n){ counterObs.observe(n); });
var heroT = document.querySelector('.hero h1');
if (heroT) window.addEventListener('mousemove', function(e){ var x = (e.clientX / window.innerWidth - 0.5) * 16, y = (e.clientY / window.innerHeight - 0.5) * 16; heroT.style.transform = 'translate(' + x + 'px, ' + y + 'px)'; });
