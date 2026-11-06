/* ═══ CONSTANTES ═══ */
var ELEMENT_EMOJI = { redencion:'🩸', comprension:'💡', expresion:'🌸', proteccion:'🛡️', ilusion:'🎭', transformacion:'🔥', aceptacion:'🌿' };
var ELEMENT_COLORS = { redencion:'200,45,60', comprension:'255,215,100', expresion:'255,130,190', proteccion:'140,180,230', ilusion:'180,100,230', transformacion:'255,120,60', aceptacion:'130,220,140' };
var ELEMENT_NAMES = { redencion:'Redención', comprension:'Comprensión', expresion:'Expresión', proteccion:'Protección', ilusion:'Ilusión', transformacion:'Transformación', aceptacion:'Aceptación' };
var ABILITY_TYPES = { normal:'Ataque Normal', elemental:'Habilidad Elemental', ultimate:'Habilidad Definitiva', passive:'Habilidad Pasiva', ex:'EX' };
var ROLLING_COLOR = '160, 160, 180';
var CARD_TAG_COLORS = { 'Ataque':'200,45,60','Curación':'78,194,107','Defensa':'140,180,230','Energía':'240,200,96','Dados':'165,131,255','Utilidad':'255,130,190','Potente':'255,215,100','Arma':'200,45,60','Armadura':'140,180,230','Accesorio':'255,215,100','Estructura':'130,220,140','Aura':'255,130,190','Trampa':'180,100,230','Pintura':'255,130,190' };
var CARD_CATEGORY_META = { equipo:{label:'Equipo',icon:'⚔️',color:'200,45,60'}, apoyo:{label:'Apoyo',icon:'📜',color:'130,220,140'}, evento:{label:'Evento',icon:'✨',color:'165,131,255'}, pintura:{label:'Pintura',icon:'🎨',color:'255,130,190'} };

var STATUS_DESCRIPTIONS = {
  castigada: { name:'🩸 Castigada', text:'Cuando Alaya tiene este efecto, toda curación que reciba se convierte en daño verdadero (penetrante). Cada vez que Alaya recibe curación mientras está Castigada, gana 1 punto de Condena por cada punto de curación transformado en daño verdadero.' },
  condena: { name:'💀 Condena', text:'Recurso acumulado por Alaya mientras está Castigada y recibe curación. Su habilidad definitiva lo consume íntegramente como daño penetrante al enemigo.' },
  vulnerable: { name:'💔 Vulnerable', text:'Aplica una reducción de daño verdadero. Al recibir daño verdadero, el enemigo causante de dicho daño pasa a considerarse como Amenaza, y se elimina el efecto de Vulnerable.' },
  amenaza: { name:'🚨 Amenaza', text:'Al infligir daño a un enemigo considerado como Vulnerable estando ya marcado como Amenaza, se marca a sí mismo con Protección. La habilidad definitiva de Tenshi (Suficiente) explota esta condición infligiendo daño penetrante extra.' },
  furia: { name:'🔥 Furia', text:'Aumenta el daño infligido con el ataque normal en 1 punto. El estado se elimina al final de la ronda. No es acumulable. Se activa cuando Eevee recibe daño verdadero.' },
  defensaActiva: { name:'💠 Defensa Activa', text:'El daño del próximo golpe que reciba Eevee se reduce en 1, y contraataca inmediatamente con un ataque normal. Después, el estado se elimina.' },
  sintonia: { name:'🎵 Sintonía', text:'La siguiente curación que reciba también la recibirán el resto de aliados en Sintonía. Una vez ocurra, todos los aliados dejan de estar en Sintonía.' },
  acelerado: { name:'💨 Acelerado', text:'Se considera un ataque acelerado todo ataque normal ejecutado como primera acción tras cambiar de personaje a Jose en ese mismo turno.' },
  marca: { name:'🏷️ Marca elemental', text:'Si se aplica otra marca distinta a este personaje, ambas desaparecen al instante y se desencadena una Resonancia.' },
  manuelStacks: { name:'📈 Acumulación (Decadencia)', text:'Cada stack de Decadencia de Manuel suma +1 al daño base de Degradación (tanto al enemigo como a sí mismo) y reduce en 1 el coste de dados de Degradación.' },
  obraMaestra: { name:'💥 Obra Maestra', text:'Mientras esté activa, las habilidades definitivas de los aliados doblan su daño base (el valor numérico propio de la habilidad, sin bufos ni bonos), siempre que la estructura Portátil siga en el campo.' },
  rencor: { name:'💢 Rencor', text:'Acumulación de Abla sobre este personaje. La habilidad definitiva de Abla inflige daño adicional por cada acumulación y las consume al golpear.' },
  vuelo: { name:'🦅 Vuelo', text:'Artemis en vuelo: reduce en 2 el daño recibido. Si recibe daño verdadero recibe +3 de daño adicional, gana 1 de energía y pierde este efecto.' },
  carrerilla: { name:'🏃 Carrerilla', text:'El siguiente ataque de Artemis que cause daño añade +2 de daño. Si ese ataque es su ataque normal, gana 1 de energía adicional.' },
  cruzMadera: { name:'✝️ Cruz de Madera', text:'Estructura exclusiva de Orath. Causa 1 punto de daño al enemigo activo al ser destruida. Al final de la ronda, si Orath está activa, marca al enemigo activo con redención y se destruye.' },
  cruzSangre: { name:'✝️ Cruz de Sangre', text:'Estructura exclusiva de Orath generada al morir ella. Se destruye si un aliado muere. Al destruirse, revive al último aliado caído con 1 HP y 2 de escudo.' },
  invulnerabilidad: { name:'🛡️ Invulnerabilidad', text:'Cada punto de invulnerabilidad reduce en 1 el daño verdadero que recibe Alter. No se consume al absorber daño: Alter pierde 1 punto al final de cada ronda (máx 3). Solo se elimina por efectos que la quiten o por esta pérdida al final de ronda.' },
  podrida: { name:'🦠 Podrida', text:'Al final de cada ronda, NC inflige 1 daño al enemigo activo (a todos los enemigos si usó su definitiva ese turno). La lectura consume esta podredumbre para marcar al enemigo con Protección.' },
  advertido: { name:'⚠️ Advertido', text:'Cargas acumuladas sobre un enemigo de Iris. Máximo 3 cargas sin EX, 1 con EX. Cuando el enemigo está al máximo y recibe otra carga, en su lugar se le marca con Protección. Se consumen con el ataque normal de Iris cuando tiene EX activa.' },
  buenRecaudo: { name:'🛡️ Buen Recaudo', text:'Mientras dure, si este aliado es atacado, el daño es redirigido a Iris y el atacante gana 1 carga de Advertido. Se consume tras redirigir 1 ataque o al final de la ronda.' },
  advertenciaActive: { name:'⚔️ Advertencia', text:'Iris ha activado Advertencia: durante el resto de la ronda, los ataques dirigidos al activo de su equipo se redirigen a Iris con +1 de daño y otorgan 1 carga de Advertido al atacante.' },
  visto: { name:'👁️ Visto', text:'Al final de la ronda, todos los personajes con este efecto se reparten 6 de daño penetrante (a partes iguales) si Vittoria sigue viva, o 12 si ha muerto (reviviendo ella con 1 HP). Si Vittoria es la última en morir, no se aplica. El efecto se pierde tras resolverse.' },
};

var PHILOSOPHIES = {
  proteccion: { emoji:'🛡️', name:'Protección', tagline:'Reducir el daño', desc:'Afrontan el sufrimiento intentando reducir el daño, tanto para sí mismas como para quienes consideran importantes.', quote:'La Protección no consiste en tener miedo al daño, sino en decidir que impedirlo es la mejor manera de superar la adversidad.', consonance2:'El personaje activo recibe un escudo de 1 punto de vida al principio de cada ronda.', consonance3:'Todos los aliados reciben un escudo de 1 punto de vida al principio de cada ronda.' },
  comprension: { emoji:'💡', name:'Comprensión', tagline:'Entenderlo', desc:'Afrontan el sufrimiento intentando entenderlo. Creen que el conocimiento es la mejor herramienta para resolver cualquier problema.', quote:'La Comprensión no consiste en saberlo todo, sino en creer que siempre existe una forma mejor de actuar si se logra entender la situación.', consonance2:'Al inicio de la partida, el personaje activo comienza con 1 punto de energía.', consonance3:'Al inicio de la partida, todos los aliados comienzan con 1 punto de energía.' },
  expresion: { emoji:'🌸', name:'Expresión', tagline:'Crear', desc:'Afrontan el sufrimiento creando. Sienten la necesidad de dar forma a su mundo interior.', quote:'La Expresión no consiste en decir lo que uno siente, sino en transformar la experiencia en algo nuevo que antes no existía.', consonance2:'Al inicio de la partida, robas 2 cartas adicionales en tu primera mano (5 → 7).', consonance3:'Al principio de cada ronda, robas 1 carta adicional (2 → 3).' },
  transformacion: { emoji:'🔥', name:'Transformación', tagline:'Adaptarse al cambio', desc:'Afrontan el sufrimiento adaptándose al cambio. Prefieren moverse y aprovechar el impulso de la situación.', quote:'La Transformación no consiste en cambiar por cambiar, sino en entender que avanzar muchas veces implica dejar atrás lo que ya no funciona.', consonance2:'El primer cambio de personaje de cada ronda no cuesta dados.', consonance3:'El primer cambio de personaje de cada ronda es gratuito y se considera una acción rápida.' },
  aceptacion: { emoji:'🌿', name:'Aceptación', tagline:'Asimilarlo', desc:'Afrontan el sufrimiento asimilándolo. Entienden que no todo puede cambiarse y buscan convivir con lo ocurrido.', quote:'La Aceptación no consiste en rendirse ante el sufrimiento, sino en impedir que este siga teniendo poder sobre uno mismo.', consonance2:'Al comienzo de cada ronda, el personaje activo recupera 1 punto de vida.', consonance3:'Al comienzo de cada ronda, todos los aliados recuperan 1 punto de vida.' },
  redencion: { emoji:'🩸', name:'Redención', tagline:'Actuar', desc:'Afrontan el sufrimiento actuando. Asumen las consecuencias y transforman el dolor en fuerza.', quote:'La Redención no consiste en buscar el sufrimiento, sino en decidir que, si este llega, servirá para avanzar en lugar de detenerse.', consonance2:'El primer ataque que realice el personaje activo en cada ronda inflige 2 puntos de daño adicionales.', consonance3:'El primer ataque que realice cualquier aliado en cada ronda inflige 3 puntos de daño adicionales.' },
  ilusion: { emoji:'🎭', name:'Ilusión', tagline:'Cuestionar la realidad', desc:'Afrontan el sufrimiento cuestionando la realidad. Buscan nuevas perspectivas y alteran las condiciones del problema.', quote:'La Ilusión no consiste en engañar a los demás, sino en comprender que la realidad siempre ofrece más posibilidades de las que parecen existir a primera vista.', consonance2:'Al finalizar la fase de lanzamiento, al menos 2 de los dados serán del tipo de tu personaje activo u omnidados.', consonance3:'Al finalizar la fase de lanzamiento, al menos 4 de los dados serán del tipo de tu personaje activo u omnidados.' }
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
  },
  campo_girasoles: {
    id: 'campo_girasoles',
    name: 'Campo de Girasoles',
    emoji: '🌻',
    duration: 2,
    effectText: 'Todos los efectos curativos del equipo dueño del entorno aumentan en 1 punto.'
  }
};

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
    ownerCsId: casterCs ? casterCs.id : null,
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
