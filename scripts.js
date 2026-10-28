console.log('Azaria TCG — v33 Online Multiplayer');

/* ═══ CONSTANTES ═══ */
var ELEMENT_EMOJI = { redencion:'🩸', comprension:'💡', expresion:'🌸', proteccion:'🛡️', ilusion:'🎭', transformacion:'🔥', aceptacion:'🌿' };
var ELEMENT_COLORS = { redencion:'200,45,60', comprension:'255,215,100', expresion:'255,130,190', proteccion:'140,180,230', ilusion:'180,100,230', transformacion:'255,120,60', aceptacion:'130,220,140' };
var ELEMENT_NAMES = { redencion:'Redención', comprension:'Comprensión', expresion:'Expresión', proteccion:'Protección', ilusion:'Ilusión', transformacion:'Transformación', aceptacion:'Aceptación' };
var ABILITY_TYPES = { normal:'Ataque Normal', elemental:'Habilidad Elemental', ultimate:'Habilidad Definitiva', passive:'Habilidad Pasiva', ex:'EX' };
var ROLLING_COLOR = '160, 160, 180';
var CARD_TAG_COLORS = { 'Ataque':'200,45,60','Curación':'78,194,107','Defensa':'140,180,230','Energía':'240,200,96','Dados':'165,131,255','Utilidad':'255,130,190','Potente':'255,215,100','Arma':'200,45,60','Armadura':'140,180,230','Accesorio':'255,215,100','Estructura':'130,220,140','Aura':'255,130,190','Trampa':'180,100,230','Pintura':'255,130,190' };
var CARD_CATEGORY_META = { equipo:{label:'Equipo',icon:'⚔️',color:'200,45,60'}, apoyo:{label:'Apoyo',icon:'📜',color:'130,220,140'}, evento:{label:'Evento',icon:'✨',color:'165,131,255'}, pintura:{label:'Pintura',icon:'🎨',color:'255,130,190'} };

var pendingPvpMode = false;
var pendingOnlineMode = false;
var peerObj = null;
var peerConn = null;
var pendingGuestTeam = null;
var pendingGuestDeck = null;
var _broadcastTimer = null;
var silentActionApply = false;
// Servidor propio desactivado temporalmente (Render + CORS + path duplicado)
// Cuando lo arreglemos, restauramos el objeto con host/port/path correctos.
var PEER_CONFIG = null;

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
  rencor: { name:'💢 Rencor', text:'Acumulación de Abla sobre este personaje. La habilidad definitiva de Abla inflige daño adicional por cada acumulación y consume todas al golpear.' }
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
  alaya: { name:'Alaya', element:'redencion', set:'Reminiscencia', hp:10, emoji:'🌹', img:'img/alaya.png', concept:'Representa el beneficio del sacrificio y del dolor, basándose en recibir daño.', abilities: [
    { type:'normal', icon:'⚔️', name:'Autolesión', cost:'x1 dado de redención, x1 dado cualquiera', effect:'Alaya se golpea a sí misma y se inflige 1 punto de daño. No daña al enemigo: es una habilidad de autolesión pensada para acumular condena mediante su pasiva.' },
    { type:'elemental', icon:'🔮', name:'Penitencia', cost:'x2 dados de redención', effect:'Elimina todos los efectos activos sobre sí misma y entra en el estado Castigada, base de su pasiva.' },
    { type:'ultimate', icon:'💥', name:'El Fin del Comienzo', cost:'x3 dados de redención, x3 puntos de energía', effect:'Alaya gasta todos sus puntos de condena acumulados e inflige al enemigo un daño equivalente a dicha cantidad. Si el enemigo no muere, será Alaya quien muera. Independientemente del resultado, marca con redención a todos los enemigos.' },
    { type:'passive', icon:'🛡️', name:'Mártir Afligida', effect:'Cuando Alaya está Castigada, toda curación que reciba se convierte en daño verdadero. Cada vez que Alaya reciba daño mientras está Castigada, ganará 1 punto de condena por cada golpe recibido.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Si Alaya muere por su propia habilidad definitiva y en la mano del usuario hay una carta para revivir a un personaje, se le da la opción de utilizarla para revivirla inmediatamente y repetir el golpe de la definitiva. Tras ello, morirá de nuevo.' }
  ]},
  oliver: { name:'Óliver', element:'comprension', set:'Refinamiento', hp:11, emoji:'🧠', img:'img/oliver.png', concept:'Su función es servir como soporte ofensivo potenciando a sus aliados mediante estructuras.', abilities: [
    { type:'normal', icon:'⚔️', name:'Corrección', cost:'x1 dado de comprensión, x1 dado cualquiera', effect:'Golpea al enemigo e inflige 1 punto de daño.' },
    { type:'elemental', icon:'🔮', name:'Optimización', cost:'x3 dados de comprensión', effect:'Coloca una estructura de 2 rondas que inflige 1 punto de daño al enemigo al final de cada ronda, marcándolo con comprensión. Mientras permanezca en el campo, los ataques normales y habilidades elementales de los aliados suman 2 puntos de daño. Volver a usarla extiende su duración en 1 ronda (máximo 3).' },
    { type:'ultimate', icon:'💥', name:'Obra Maestra', cost:'x4 dados de comprensión, x2 puntos de energía', effect:'Durante 2 rondas, las habilidades definitivas de los aliados hacen el doble de daño base, siempre y cuando la estructura de Optimización siga en el campo. Si no hay estructura, la habilidad no se puede usar.' },
    { type:'passive', icon:'🛡️', name:'Criterio de Excelencia', effect:'Todas las cartas de equipamiento cuestan un dado menos.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'La habilidad definitiva dobla el daño final en lugar del daño base.' }
  ]},
  erik: { name:'Erik', element:'expresion', set:'Magia de Pintura', hp:10, emoji:'🎨', img:'img/erik.png', concept:'Sus habilidades están construidas para ser un personaje todoterreno consistente.', abilities: [
    { type:'normal', icon:'⚔️', name:'Trazo Vivo', cost:'x2 dados de expresión, x1 dado cualquiera', effect:'Golpea al enemigo, inflige 1 punto de daño y lo marca con expresión. Si lleva equipada una carta de pintura, no marca, pero aplica un bono según el color: Roja +2 daño, Azul escudo 1, Verde cura 2.' },
    { type:'elemental', icon:'🔮', name:'Interpretación', cost:'x3 dados de expresión', effect:'Pierde 1 punto de vida. Genera 3 cartas de pintura (roja, azul y verde). Estas cartas se equipan (una máximo) sobre Erik, no cuestan dados y se descartan al final de la siguiente ronda si no están equipadas.' },
    { type:'ultimate', icon:'💥', name:'Lienzo de Sangre', cost:'x3 dados de expresión, x2 puntos de energía', effect:'Consume todas las cartas de pintura no equipadas en mano: cada roja inflige 1 de daño, cada azul aumenta +1 la vida de su escudo, cada verde le cura 1 punto de vida.' },
    { type:'passive', icon:'🛡️', name:'Inspiración Solitaria', effect:'Cuantos menos aliados vivos haya, mayor será el efecto de sus habilidades: con 2 aliados +1 daño base/escudo/curación; con 1 aliado +2.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Todos los ataques normales marcan al enemigo con expresión.' }
  ]},
  tenshi: { name:'Tenshi', element:'proteccion', set:'Égida', hp:11, emoji:'⚔️', img:'img/tenshi.png', concept:'Diseñado para defender a sus aliados mediante escudos, vulnerabilidad y amenazas.', abilities: [
    { type:'normal', icon:'⚔️', name:'Intervención', cost:'x2 dados de protección, x1 dado cualquiera', effect:'Inflige 2 puntos de daño al enemigo activo. Si el enemigo es Amenaza, suma 1 punto más y deja de ser Amenaza.' },
    { type:'elemental', icon:'🔮', name:'Bajo mis Alas', cost:'x3 dados de protección', effect:'El aliado con menos vida pasa a estar Vulnerable. La primera vez que reciba daño verdadero, se reduce 1 punto y el enemigo culpable pasa a Amenaza. Al recibir ese daño, deja de ser Vulnerable.' },
    { type:'ultimate', icon:'💥', name:'Suficiente', cost:'x4 dados de protección, x3 puntos de energía', effect:'Inflige 3 puntos de daño penetrante a todos los enemigos Amenaza, marcándolos con protección y dejando de estar Amenaza. Otorga 3 puntos de escudo al aliado Vulnerable.' },
    { type:'passive', icon:'🛡️', name:'Último Baluarte', effect:'Si un aliado Vulnerable va a morir, queda con 1 punto de vida y el activo cambia a Tenshi (acción rápida). Ocurre una vez por aliado. Dicho aliado recibe 1 escudo, sigue Vulnerable y el enemigo culpable pasa a Amenaza.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Si un enemigo Amenaza inflige daño verdadero a un aliado Vulnerable, el enemigo es marcado con protección.' }
  ]},
  eloy: { name:'Eloy', element:'comprension', set:'Cognición', hp:12, emoji:'📖', img:'img/eloy.png', concept:'Sus cimientos son el conocimiento como útil para protegerse y mantenerse seguro.', abilities: [
    { type:'normal', icon:'⚔️', name:'Análisis', cost:'x1 dado de comprensión, x2 dados cualesquiera', effect:'Golpea al enemigo e inflige 2 puntos de daño. Eloy no obtiene energía con este ataque (ni con su habilidad elemental).' },
    { type:'elemental', icon:'🔮', name:'Hipótesis Sólida', cost:'x4 dados de comprensión', effect:'Alza un escudo de 2 puntos de vida. Cuando un enemigo golpea ese escudo, marca a dicho enemigo con comprensión.' },
    { type:'ultimate', icon:'💥', name:'Conclusión', cost:'x3 dados de comprensión, x3 puntos de energía', effect:'Otorga un escudo de 1 punto de vida a cada aliado excepto a sí mismo, y 1 punto de energía a cada aliado excepto a sí mismo.' },
    { type:'passive', icon:'🛡️', name:'Sincronía Cognitiva', effect:'Si un aliado usa su habilidad definitiva, Eloy gana 1 punto de energía (independiente de si Eloy ya actuó o no esa ronda). Eloy no obtiene energía con sus ataques normales ni elementales.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'La definitiva otorga 2 puntos de energía a los aliados en lugar de 1. La pasiva no tiene límite por ronda.' }
  ]},
  eevee: { name:'Eevee', element:'proteccion', set:'Instinto', hp:10, emoji:'🦊', img:'img/eevee.png', concept:'Se quita relevancia hasta que se meten con ella.', abilities: [
    { type:'normal', icon:'⚔️', name:'Advertencia', cost:'x1 dado de protección, x2 dados cualesquiera', effect:'Golpea al enemigo e inflige 2 puntos de daño.' },
    { type:'elemental', icon:'🔮', name:'Defensa Activa', cost:'x4 dados de protección', effect:'Entra en estado de defensa activa: el daño del próximo ataque enemigo hacia ella se reduce en 1 punto y contraataca inmediatamente con un ataque normal. El estado se consume al activarse.' },
    { type:'ultimate', icon:'💥', name:'Contraofensiva', cost:'x3 dados de protección, x2 puntos de energía', effect:'Inflige 3 puntos al enemigo activo. Si está en Furia, inflige 5. Si el enemigo activo es quien activó su Furia, inflige 6 y lo marca con protección.' },
    { type:'passive', icon:'🛡️', name:'Instinto de Supervivencia', effect:'Cuando Eevee recibe un golpe que reduce su vida, entra en estado Furia a partir del siguiente turno, haciendo que inflija 1 punto de daño extra con el ataque normal al enemigo que la golpeó durante el resto de la ronda. Se reinicia al final de la ronda.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Su ataque normal automático (disparado por Defensa Activa) marca al enemigo con protección.' }
  ]},
  ren: { name:'Ren', element:'ilusion', set:'Distorsión', hp:10, emoji:'🌀', img:'img/ren.png', concept:'Pretende hacer dudar del funcionamiento, mantener la duda y confundir.', abilities: [
    { type:'normal', icon:'⚔️', name:'Error', cost:'x1 dado de ilusión, x2 dados cualesquiera', effect:'Golpea al enemigo e inflige 2 puntos de daño normal.' },
    { type:'elemental', icon:'🔮', name:'Inconsistencia', cost:'x5 dados de ilusión', effect:'Golpea al enemigo e inflige 2 puntos de daño penetrante, fuerza el cambio al siguiente enemigo en reserva y marca al nuevo enemigo activo con ilusión.' },
    { type:'ultimate', icon:'💥', name:'Destrucción de Lógica', cost:'x4 dados de ilusión, x3 puntos de energía', effect:'Golpea al enemigo e inflige 3 puntos de daño penetrante, marcándolo con ilusión y forzando el cambio al siguiente enemigo en reserva.' },
    { type:'passive', icon:'🛡️', name:'Paso Fantasma', effect:'Al usar su habilidad elemental o definitiva, Ren pasa a la reserva y el siguiente personaje en reserva se convierte en activo.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Los aliados no pueden ser marcados por ilusión.' }
  ]},
  noah: { name:'Noah', element:'proteccion', set:'Resonancia', hp:12, emoji:'⚓', img:'img/noah.png', concept:'Su única función es que sus compañeros estén bien…', abilities: [
    { type:'normal', icon:'⚔️', name:'Latido', cost:'x1 dado de protección, x1 dado cualquiera', effect:'Golpea al enemigo e inflige 1 punto de daño.' },
    { type:'elemental', icon:'🔮', name:'Eco Vital', cost:'x3 dados de protección', effect:'Cura 2 puntos de vida verdadera a todos los aliados excepto a sí misma. Dichos aliados pasan a Sintonía. La próxima curación que reciba uno de ellos también la reciben todos los aliados en Sintonía. Una vez ocurre, todos dejan de estar en Sintonía.' },
    { type:'ultimate', icon:'💥', name:'Armonía', cost:'x3 dados de protección, x3 puntos de energía', effect:'Ella misma pasa a Sintonía y se cura 5 puntos de vida, marcando al enemigo activo con protección. Por cada aliado en Sintonía adicional, la curación se reduce en 1.' },
    { type:'passive', icon:'🛡️', name:'Ecos de Compasión', effect:'Las cartas de curación cuestan un dado menos.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Al golpear a un enemigo marcado con protección, cura 1 punto a los aliados no Sintonizados.' }
  ]},
  abla: { name:'Abla', element:'redencion', set:'Venganza', hp:10, emoji:'🗡️', img:'img/abla.png', concept:'Su manera de jugar deja clara su sed; no se olvida del daño que recibe y lo hace pagar.', abilities: [
    { type:'normal', icon:'⚔️', name:'Rencor', cost:'x1 dado de redención, x2 dados cualesquiera', effect:'Golpea al enemigo e inflige 2 puntos de daño.' },
    { type:'elemental', icon:'🔮', name:'Deuda de Sangre', cost:'x4 dados de redención', effect:'Golpea al enemigo e inflige 3 puntos de daño, aplicándole 1 acumulación de Rencor, y se cura el daño verdadero infligido.' },
    { type:'ultimate', icon:'💥', name:'Retribución Final', cost:'x3 dados de redención, x3 puntos de energía', effect:'Cada enemigo con Rencor recibe 3 de daño, más 1 punto por cada acumulación adicional de Rencor, consumiendo todas sus acumulaciones.' },
    { type:'passive', icon:'🛡️', name:'Agravio Eterno', effect:'Al resucitar inflige 1 punto de daño a todos los enemigos.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Los enemigos con Rencor reciben 1 punto de daño al final de la ronda.' }
  ]},
  manuel: { name:'Manuel', element:'redencion', set:'Entropía', hp:11, emoji:'⚡', img:'img/manuel.png', concept:'Da grandes saltos sabiendo que si va a causar dolor, él también va a fastidiarse.', abilities: [
    { type:'normal', icon:'⚔️', name:'Ruptura', cost:'x2 dados de redención, x2 dados cualesquiera', effect:'Golpea al enemigo e inflige 3 puntos de daño.' },
    { type:'elemental', icon:'🔮', name:'Degradación', cost:'x5 dados de redención', effect:'Se autolesiona 2 puntos y golpea al enemigo infligiendo 4 puntos de daño, marcándolo con redención. Esta habilidad no genera energía si la definitiva está acumulada.' },
    { type:'ultimate', icon:'💥', name:'Decadencia', cost:'x3 dados de redención, x2 puntos de energía', effect:'Acumula +1 daño en su habilidad elemental (tanto al enemigo como a sí mismo) y reduce su coste en 1 dado. Se acumula hasta ejecutar la elemental. Al hacerlo, se reinicia la acumulación y los enemigos marcados con redención dejan de estarlo.' },
    { type:'passive', icon:'🛡️', name:'Tributo Vital', effect:'Al matar a un enemigo, Manuel recupera 1 punto de vida.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Usar la habilidad elemental otorga 2 puntos de energía en lugar de 1.' }
  ]},
  jose: { name:'Jose', element:'transformacion', set:'Inercia', hp:10, emoji:'🦋', img:'img/jose.png', concept:'Aprovecha el flujo del juego para entrar y salir, usando esa velocidad para mejorar el daño.', abilities: [
    { type:'normal', icon:'⚔️', name:'Acelerón', cost:'x2 dados de transformación, x1 dado cualquiera', effect:'Inflige 2 puntos al enemigo. Si el ataque es acelerado (realizado tras cambiar a Jose en el mismo turno), suma 1 punto más y marca al enemigo con transformación.' },
    { type:'elemental', icon:'🔮', name:'Impulso', cost:'x3 dados de transformación', effect:'Durante el resto de la ronda, su siguiente ataque normal suma 2 puntos de daño. Después pasa a la reserva.' },
    { type:'ultimate', icon:'💥', name:'Instinto', cost:'x4 dados de transformación, x2 puntos de energía', effect:'Inflige 3 puntos al enemigo activo. Se considera un ataque normal, por lo que puede ser acelerado: si lo es, suma 2 puntos más y marca con transformación.' },
    { type:'passive', icon:'🛡️', name:'Cambio Cinético', effect:'Cambiar de personaje a Jose se considera una acción rápida.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Cambiar a Jose no cuesta dados.' }
  ]},
  josemi: { name:'Josemi', element:'expresion', set:'Cosmogénesis', hp:10, emoji:'🎤', img:'img/josemi.png', concept:'Manipulación de cartas de apoyo y control del campo.', abilities: [
    { type:'normal', icon:'⚔️', name:'Esbozo', cost:'x1 dado de expresión, x2 dados cualesquiera', effect:'Inflige 2 puntos de daño al enemigo.' },
    { type:'elemental', icon:'🔮', name:'Reescritura', cost:'x3 dados de expresión', effect:'Restablece la duración de una carta de apoyo o estructura propia en el campo y destruye una carta de apoyo enemiga. Si no destruye ningún apoyo enemigo, marca al enemigo activo con expresión.' },
    { type:'ultimate', icon:'💥', name:'Canon', cost:'x5 dados de expresión, x2 puntos de energía', effect:'Roba hasta 3 cartas de apoyo del mazo y activa inmediatamente el beneficio de cada carta de apoyo propia que ya esté en el campo, sin reducir su duración restante.' },
    { type:'passive', icon:'🛡️', name:'Vestigios del Origen', effect:'Cuando una carta de apoyo propia desaparece del campo, otorga 1 dado del tipo del aliado activo.' },
    { type:'ex', icon:'🌟', name:'EX', effect:'Las cartas de apoyo cuestan un dado menos.' }
  ]}
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
  c_bendicion_destino:{ id:'c_bendicion_destino', name:'Bendición del Destino', tag:'Potente', emoji:'🔮', color:'255,215,100', cost:{same:2}, effectText:'Añade 1 dado de cada tipo de tu equipo (máx. 3). Una vez por ronda.', effectType:'drawTeamDice', oncePerRound:true }
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
var CARD_FILTER_ORDER = ['Ataque','Curación','Defensa','Energía','Dados','Utilidad','Potente'];
var CARD_FILTER_ALL_TAGS = ['Ataque','Curación','Defensa','Energía','Dados','Utilidad','Potente','Arma','Armadura','Accesorio','Estructura','Aura','Trampa'];

var PAINT_CARDS = {
  paint_roja:{ id:'paint_roja', category:'pintura', name:'Pintura Roja', tag:'Pintura', emoji:'🔴', color:'220,60,60', cost:{}, effectText:'Equipable solo sobre Erik. Su Trazo Vivo inflige +2 de daño.', paintColor:'roja' },
  paint_azul:{ id:'paint_azul', category:'pintura', name:'Pintura Azul', tag:'Pintura', emoji:'🔵', color:'80,140,220', cost:{}, effectText:'Equipable solo sobre Erik. Su Trazo Vivo otorga 1 escudo.', paintColor:'azul' },
  paint_verde:{ id:'paint_verde', category:'pintura', name:'Pintura Verde', tag:'Pintura', emoji:'🟢', color:'90,200,110', cost:{}, effectText:'Equipable solo sobre Erik. Su Trazo Vivo cura 2 HP.', paintColor:'verde' }
};

var COMBAT_CHARS = {
  alaya: { name:'Alaya', element:'redencion', emoji:'🌹', hp:10, abilities: { normal:{ name:'Autolesión', cost:{redencion:1, any:1}, target:'self', kind:'autolesion', selfDamage:1, energy:1 }, elemental:{ name:'Penitencia', cost:{redencion:2}, target:'self', kind:'penitencia', energy:1 }, ultimate:{ name:'El Fin del Comienzo', cost:{redencion:3}, energyCost:3, target:'enemy', kind:'finComienzo' } }},
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
  josemi: { name:'Josemi', element:'expresion', emoji:'🎤', hp:10, abilities: { normal:{ name:'Esbozo', cost:{expresion:1, any:2}, target:'enemy', kind:'damage', damage:2, energy:1 }, elemental:{ name:'Reescritura', cost:{expresion:3}, target:'enemy', kind:'reescritura', energy:1 }, ultimate:{ name:'Canon', cost:{expresion:5}, energyCost:2, target:'self', kind:'canon' } }}
};

function normalize(s){ return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function sumCost(cost){ var t = 0; for (var k in cost) if (Object.prototype.hasOwnProperty.call(cost,k)) t += cost[k]; return t; }
function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function shuffleArray(arr){ var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function setSize(o){ return Object.keys(o).length; }
function toggleFilterKey(o, k){ if (o[k]) { delete o[k]; return false; } o[k] = true; return true; }

/* ═══ PVP HELPERS ═══ */
function isPvp(){ return !!(combatState && combatState.pvp); }
function getActiveSide(){
  if (!combatState) return null;
  if (combatState.pvp) return combatState[combatState.turn];
  if (combatState.online) return combatState[myStateKey()];  // host=player, guest=bot
  return combatState.player;
}
function getTurnKey(){
  if (!combatState) return 'player';
  if (combatState.pvp) return combatState.turn;
  if (combatState.online) return myStateKey();
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

/* ═══ ONLINE HELPERS ═══ */
function isOnline(){ return !!(combatState && combatState.online); }
function isOnlineHost(){ return isOnline() && combatState.onlineRole === 'host'; }
function isOnlineGuest(){ return isOnline() && combatState.onlineRole === 'guest'; }
function myStateKey(){ return isOnlineGuest() ? 'bot' : 'player'; }
function sideKeyForUI(uiWho){ return isOnlineGuest() ? (uiWho === 'player' ? 'bot' : 'player') : uiWho; }
function getMySide(){ if (!combatState) return null; if (isOnlineGuest()) return combatState.bot; if (isOnlineHost()) return combatState.player; return combatState[combatState.turn] || combatState.player; }
function isMyTurn(){ if (!combatState) return false; return combatState.turn === myStateKey(); }

function netSend(data){ try { if (peerConn && peerConn.open) peerConn.send(data); } catch (e) {} }
function sanitizeStateForGuest(state){
  var clone = JSON.parse(JSON.stringify(state));
  clone.player.hand = new Array((state.player.hand||[]).length).fill('hidden');
  clone.player.deck = [];
  return clone;
}
function scheduleBroadcast(){
  if (!isOnlineHost()) return;
  if (_broadcastTimer) clearTimeout(_broadcastTimer);
  _broadcastTimer = setTimeout(function(){ _broadcastTimer = null; broadcastState(); }, 80);
}
function broadcastState(){
  if (!isOnlineHost() || !peerConn || !peerConn.open || !combatState) return;
  var san = sanitizeStateForGuest(combatState);
  netSend({ type:'state', state:san });
}
function receiveFullState(state){
  var wasNull = !combatState;
  combatState = state;
  combatState.online = true;
  combatState.onlineRole = 'guest';
  if (wasNull) {
    var m = document.getElementById('combatModal');
    m.classList.add('open'); document.body.style.overflow = 'hidden';
    initAudio(); preloadCombatImages(); initCombatStars();
    logCombat('🌐 Conectado al host');
  }
  if (state.phase === 'ended') {
    var ov = document.getElementById('combatEndOverlay'), em = document.getElementById('combatEndEmoji'), ti = document.getElementById('combatEndTitle'), su = document.getElementById('combatEndSub');
    if (state.winner === 'player') { em.textContent = '💀'; ti.textContent = 'Derrota'; ti.style.color = '#c82d3c'; su.textContent = 'El anfitrión te ha derrotado'; }
    else { em.textContent = '🏆'; ti.textContent = '¡Victoria!'; ti.style.color = 'var(--accent)'; su.textContent = 'Has derrotado al anfitrión'; }
    hideBanner(); hideRollOverlay(); hideDrawOverlay(); hideTooltip(); hideConfirmation();
    if (ov) ov.classList.add('open');
    return;
  }
  renderCombat();
}
function applyRemoteAction(action){
  if (!isOnlineHost() || !combatState || combatState.phase === 'ended') return;
  if (combatState.turn !== 'bot') return;
  if (action.kind === 'execute') {
    executeAction('bot', action.actionType);
  } else if (action.kind === 'change') {
    var res = tryChangeCharacter('bot', action.targetIndex);
    if (res && res !== 'quick') setTimeout(nextTurn, 400);
  } else if (action.kind === 'playCard') {
    var card = CARD_DB[action.cardId] || PAINT_CARDS[action.cardId];
    if (!card) return;
    var side = combatState.bot;
    var adjustedCost = adjustCardCostForPassives(card, side);
    var test = trySpendDice(side.dice, adjustedCost);
    if (!test.ok) { playSound('error'); logCombat('❌ J2 no puede pagar la carta'); return; }
    side.dice = test.remaining;
    silentActionApply = true;
    try { applyCardPlay(action.cardId, test.spent); } finally { silentActionApply = false; }
  } else if (action.kind === 'endTurn') {
    declareEnd('bot');
  }
  scheduleBroadcast();
}
function startOnlineCombatAsHost(){
  var pids = getPlayerTeamIds();
  if (!pids) { showTeamMissingToast('Tu equipo no está completo'); return; }
  if (!pendingGuestTeam) { showTeamMissingToast('El invitado no envió su equipo'); return; }
  if (currentCombatSlot !== null) clearCombatSlot(currentCombatSlot);
  var bids = pendingGuestTeam;
  combatState = { round:1, turn:'player', phase:'playing', playerDone:false, botDone:false, winner:null, starterChosen:true, log:[], player:buildSideState(pids), bot:buildSideState(bids), pvp:false, online:true, onlineRole:'host' };
  combatState.player.consonance = getConsonanceForIds(pids);
  combatState.bot.consonance = getConsonanceForIds(bids);
  combatState.player.deck = shuffleArray(deck.slice());
  combatState.bot.deck = pendingGuestDeck ? shuffleArray(pendingGuestDeck.slice()) : generateRandomDeck();
  combatState.player.hand = []; combatState.player.discardPile = [];
  combatState.bot.hand = []; combatState.bot.discardPile = [];
  combatState.player.activeIndex = 0; combatState.bot.activeIndex = 0;
  rollDiceForSide('player', true); rollDiceForSide('bot', true);
  for (var i = 0; i < 5; i++) drawFromDeck('player');
  for (var j = 0; j < 5; j++) drawFromDeck('bot');
  var ov = document.getElementById('combatEndOverlay'); if (ov) ov.classList.remove('open');
  hideBanner();
  logCombat('🌐 Combate online iniciado — Turno de J1');
  var m = document.getElementById('combatModal');
  m.classList.add('open'); document.body.style.overflow = 'hidden';
  initAudio(); preloadCombatImages(); initCombatStars();
  applyRoundStartEffects('player'); applyRoundStartEffects('bot');
  applyEquipmentRoundStartEffects('player'); applyEquipmentRoundStartEffects('bot');
  applySupportRoundStartEffects('player'); applySupportRoundStartEffects('bot');
  renderCombat();
  showBanner('TURNO JUGADOR 1', 1400);
  scheduleBroadcast();
}

var isCreatingPeer = false;

//function wakeUpServer(callback){
//  var serverHost = PEER_CONFIG.host;
//  var rs = document.getElementById('onlineRoomStatus');
//  var js = document.getElementById('onlineJoinStatus');
//  var statusEl = rs || js;
//  if (statusEl) statusEl.textContent = 'Despertando servidor (puede tardar 30s)...';

//  console.log('[NET] Wake-up: https://' + serverHost + '/peerjs/id');

//  var controller = new AbortController();
//  var timeout = setTimeout(function(){ try { controller.abort(); } catch(e){} }, 15000); // bajado a 15s

//  fetch('https://' + serverHost + '/peerjs/id', {
//    method: 'GET',
//    signal: controller.signal,
//    mode: 'cors'
//  })
//  .then(function(r){
//    clearTimeout(timeout);
//    console.log('[NET] Wake-up respuesta:', r.status);
//    callback();
//  })
//  .catch(function(e){
//    clearTimeout(timeout);
//    console.log('[NET] Wake-up error (seguimos igual):', e.message);
//    callback();
//  });
//}

function cleanupPeer(){
  if (peerObj) { try { peerObj.destroy(); } catch(e){} peerObj = null; }
  peerConn = null;
}

function initOnlineGuest(roomCode){
  cleanupPeer();

  var js = document.getElementById('onlineJoinStatus');
  function guestLog(msg){
    if (js) js.textContent = msg;
    console.log('[GUEST] ' + msg);
  }

  if (!roomCode || roomCode.length < 5) {
    guestLog('Código inválido (mínimo 5 caracteres).');
    return;
  }

  guestLog('Conectando a ' + roomCode + '...');
  console.log('[GUEST] initOnlineGuest() ejecutado, PEER_CONFIG=', PEER_CONFIG);

  // Mismos intentos que el host para garantizar que ambos acaban
  // en el MISMO servidor de señalización.
  var attempts = [];
  if (PEER_CONFIG && PEER_CONFIG.host) {
    attempts.push({
      name: 'servidor propio',
      factory: function(){ return new Peer(undefined, PEER_CONFIG); }
    });
  }
  attempts.push({
    name: 'servidor público',
    factory: function(){ return new Peer(); }
  });

  var idx = 0;

  function tryNext(){
    if (idx >= attempts.length) {
      guestLog('No se pudo conectar. Revisa tu conexión.');
      console.error('[GUEST] Todos los intentos fallaron');
      return;
    }
    var att = attempts[idx++];
    guestLog('Conectando a ' + att.name + '...');
    console.log('[GUEST] Intentando:', att.name);

    var peer;
    try { peer = att.factory(); }
    catch(e) {
      console.error('[GUEST] ' + att.name + ' excepción:', e);
      setTimeout(tryNext, 100);
      return;
    }
    peerObj = peer;

    var opened = false;
    var timer = setTimeout(function(){
      if (opened) return;
      console.warn('[GUEST] ' + att.name + ' timeout (12s)');
      try { peer.destroy(); } catch(e){}
      tryNext();
    }, 12000);

    peer.on('open', function(){
      opened = true;
      clearTimeout(timer);
      guestLog('Conectado. Estableciendo enlace con ' + roomCode + '...');
      console.log('[GUEST] ✅ Peer abierto, conectando a', roomCode);

      var conn = peer.connect(roomCode, { reliable: true });
      peerConn = conn;

      conn.on('open', function(){
        guestLog('Canal P2P establecido. Enviando equipo...');
        console.log('[GUEST] Canal P2P abierto');
        var pids = getPlayerTeamIds();
        if (!pids) { guestLog('Equipo incompleto.'); return; }
        try {
          conn.send({
            type: 'hello',
            team: pids,
            deck: deck.slice()
          });
        } catch(e) {
          guestLog('Error enviando equipo: ' + e.message);
          console.error(e);
        }
      });

      conn.on('data', function(data){
        if (!data) return;
        if (data.type === 'ready') {
          guestLog('Listo. Esperando inicio del combate...');
        } else if (data.type === 'state') {
          receiveFullState(data.state);
        }
      });

      conn.on('close', function(){ guestLog('Desconectado del host.'); });
      conn.on('error', function(err){ guestLog('Error conexión: ' + (err.type || '?')); });
    });

    peer.on('error', function(err){
      console.error('[GUEST] Error ' + att.name + ':', err);
      if (opened) return;
      clearTimeout(timer);
      try { peer.destroy(); } catch(e){}
      tryNext();
    });
  }

  tryNext();
}
function initOnlineGuest(code){
  if (isCreatingPeer) return;
  if (!code || !code.trim()) { alert('Introduce un código de sala'); return; }
  isCreatingPeer = true;
  code = code.trim().toLowerCase();
  var js = document.getElementById('onlineJoinStatus');
  var jb = document.getElementById('onlineJoinBtn');
  function guestLog(msg){ if (js) js.textContent = msg; console.log('[GUEST] ' + msg); }
  if (jb) jb.disabled = true;
  guestLog('Despertando servidor...');
  wakeUpServer(function(){
    guestLog('Conectando a ' + code + '...');
    cleanupPeer();
    try { peerObj = new Peer(PEER_CONFIG); }
    catch(e){ guestLog('Error: ' + e.message); isCreatingPeer = false; if (jb) jb.disabled = false; return; }
    var openTimeout = setTimeout(function(){
      guestLog('Timeout. El servidor no responde.');
      cleanupPeer(); isCreatingPeer = false; if (jb) jb.disabled = false;
    }, 40000);
    peerObj.on('open', function(){
      clearTimeout(openTimeout);
      isCreatingPeer = false;
      if (jb) jb.disabled = false;
      guestLog('Buscando sala ' + code + '...');
      connectToHost(code);
    });
    peerObj.on('error', function(err){
      clearTimeout(openTimeout);
      isCreatingPeer = false;
      if (jb) jb.disabled = false;
      if (err.type === 'peer-unavailable') guestLog('Sala no encontrada. Verifica el código.');
      else if (err.type === 'network') guestLog('Error de red.');
      else guestLog('Error PeerJS: ' + err.type);
      cleanupPeer();
    });
  }, js);

  function connectToHost(codeToTry){
    try { peerConn = peerObj.connect(codeToTry, { reliable:true }); }
    catch(e){ guestLog('Error al conectar: ' + e.message); isCreatingPeer = false; return; }
    var sent = false;
    var connectTimeout = setTimeout(function(){
      if (!peerConn || !peerConn.open) { guestLog('Timeout esperando al host.'); isCreatingPeer = false; }
    }, 20000);
    function sendHello(){
      if (sent || !peerConn || !peerConn.open) return;
      try { peerConn.send({ type:'hello', team:team, deck:deck }); sent = true; guestLog('Equipo enviado. Esperando inicio...'); }
      catch(e){ guestLog('Error enviando: ' + e.message); }
    }
    peerConn.on('open', function(){ clearTimeout(connectTimeout); guestLog('Conectado. Esperando ready del host...'); setTimeout(sendHello, 1000); });
    peerConn.on('data', function(data){
      if (!data) return;
      if (data.type === 'ready') { guestLog('Host listo. Enviando equipo...'); sendHello(); }
      else if (data.type === 'state') { hideOnlineLobbyDialog(); receiveFullState(data.state); }
    });
    peerConn.on('close', function(){ guestLog('Desconectado del host'); isCreatingPeer = false; });
    peerConn.on('error', function(err){ guestLog('Error conexión: ' + err.type); isCreatingPeer = false; });
  }
}

function showOnlineLobbyDialog(){
  initAudio();
  if (team.length !== 3) { showTeamMissingToast('Necesitas <strong>3 personajes</strong> en tu equipo.'); openTeamPanel(); scrollToCollection(); return; }
  if (deck.length !== 30) { showTeamMissingToast('Necesitas <strong>30 cartas</strong> en tu mazo (tienes ' + deck.length + ').'); closeTeamPanel(); scrollToDeck(); return; }
  var ov = document.getElementById('onlineLobbyDialog');
  if (ov) ov.classList.add('show');
}
function hideOnlineLobbyDialog(){ var ov = document.getElementById('onlineLobbyDialog'); if (ov) ov.classList.remove('show'); }

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
function csHasState(cs, k){ return !!(cs && cs.states && cs.states[k]); }
function csSetState(cs, k, v){ if (!cs.states) cs.states = {}; cs.states[k] = v; }
function csAddMark(cs, el){ if (!cs.marks) cs.marks = {}; if (cs.marks[el]) return false; cs.marks[el] = true; return true; }
function csRemoveMark(cs, el){ if (cs && cs.marks) delete cs.marks[el]; }
function csHasMark(cs, el){ return !!(cs && cs.marks && cs.marks[el]); }
function csAllMarks(cs){ return cs && cs.marks ? Object.keys(cs.marks) : []; }

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
  var side = opts.targetSide, sideKey = opts.targetSideKey, idx = opts.targetIdx;
  var flat = getDamageReduction(targetCs, side);
  if (flat > 0) rawDamage = Math.max(0, rawDamage - flat);
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
    if (csHasState(targetCs, 'hipotesisShieldActive') && opts.attackerCs && !opts.attackerCs.dead) {
      var attKey = (combatState.player.characters.indexOf(opts.attackerCs) >= 0) ? 'player' : 'bot';
      var attSide = combatState[attKey];
      var attIdx = attSide.characters.indexOf(opts.attackerCs);
      triggerMarkOrResonance(opts.attackerCs, 'comprension', sideKey, attKey, attIdx);
      logCombat('🛡️ Hipótesis Sólida: ' + opts.attackerCs.character.name + ' marcado con comprensión');
    }
  }
  if (res.overflow > 0) {
    targetCs.hp = Math.max(0, targetCs.hp - res.overflow);
    logCombat('💥 Daño verdadero: ' + res.overflow + ' · HP: ' + targetCs.hp + '/' + targetCs.maxHp);
    triggerVibrate(sideKey, idx); playSound(opts.piercing ? 'pierce' : 'impact');
    if (targetCs.id === 'alaya' && csHasState(targetCs, 'castigada') && targetCs.hp > 0) {
      targetCs.states.condena = (targetCs.states.condena || 0) + 1;
      logCombat('💀 Alaya gana 1 condena · Total: ' + targetCs.states.condena);
    }
    if (targetCs.id === 'eevee' && !targetCs.dead && targetCs.hp > 0) {
      csSetState(targetCs, 'furia', true);
      if (opts.attackerCs) csSetState(targetCs, 'furiaTarget', opts.attackerCs.id);
      logCombat('🔥 Eevee entra en Furia contra ' + (opts.attackerCs ? opts.attackerCs.character.name : 'el atacante'));
    }
    if (targetCs.hp <= 0) handleDeath(sideKey, idx);
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
  if (Array.isArray(team) && team.length === 3) {
    var valid = team.filter(function(id){ return COMBAT_CHARS[id]; });
    if (valid.length === 3) return valid.slice();
  }
  return null;
}
function getRandomBotTeam() {
  var pool = Object.keys(COMBAT_CHARS);
  for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  return pool.slice(0, 3);
}
function getMaxEnergyFor(char){ if (char.abilities.ultimate && char.abilities.ultimate.energyCost) return char.abilities.ultimate.energyCost; return 3; }
function buildSideState(ids) {
  return {
    characters: ids.map(function(id) {
      var ch = COMBAT_CHARS[id];
      return { id:id, character:ch, hp:ch.hp, maxHp:ch.hp, energy:0, maxEnergy:getMaxEnergyFor(ch), shields:[], pendingBuff:0, dead:false, equipment:[], paintEquipped:null, states:{}, marks:{}, cardNextAttackBonus:0, cardNextAttackPiercing:false, cardNextAttackDouble:false, cardNextAbilityDiscount:0, cardNextAbilityFree:false, cardMarkBonus:0, manuelStacks:0 };
    }),
    activeIndex:0, dice:[], rerolled:false, selected:{}, isRollingAnim:false, rollingIds:{},
    consonance:null, firstChangeUsed:false, firstAttackUsed:false,
    deck:[], hand:[], discardPile:[], supports:[null,null,null,null], structures:[],
    initialDrawThisRound:[], mulliganUsed:false, drawSelection:{},
    cardsUsedThisRound:{}, cardsUsedThisGame:{},
    enemyAttackDebuff:0, contraataque:0, obraMaestraTurns:0
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
var charFilterSet = {}, resFilterSet = {}, deckCatFilterSet = {}, deckTagFilterSet = {};
function renderCharFilter() {
  var bar = document.getElementById('charFilterBar'); if (!bar) return;
  var none = setSize(charFilterSet) === 0;
  var buttons = ['<button class="filter-btn' + (none ? ' active' : '') + '" data-filter="all" style="--fc: 240, 200, 96;">Todas</button>'];
  CONSONANCE_ORDER.forEach(function(key){ var p = PHILOSOPHIES[key]; buttons.push('<button class="filter-btn' + (charFilterSet[key] ? ' active' : '') + '" data-filter="' + key + '" style="--fc: ' + ELEMENT_COLORS[key] + ';">' + p.emoji + ' ' + p.name + '</button>'); });
  bar.innerHTML = buttons.join('');
  var btns = bar.querySelectorAll('.filter-btn');
  for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', function(){ var f = this.dataset.filter; if (f === 'all') charFilterSet = {}; else toggleFilterKey(charFilterSet, f); renderCharFilter(); applyFilters(); });
}
function applyFilters() {
  var searchEl = document.getElementById('charSearch'); var query = searchEl ? normalize(searchEl.value.trim()) : '';
  var none = setSize(charFilterSet) === 0;
  var cards = document.querySelectorAll('.char-card'); var visible = 0;
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i]; var cd = CHARACTERS[card.dataset.character]; var nm = cd ? cd.name : '';
    if ((none || !!charFilterSet[card.dataset.el]) && (!query || normalize(nm).indexOf(query) !== -1)) { card.style.display = ''; if (!card.classList.contains('visible')) card.classList.add('visible'); visible++; }
    else card.style.display = 'none';
  }
  var counter = document.getElementById('charCounter'); if (counter) counter.innerHTML = '<strong>' + visible + '</strong> de ' + cards.length;
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
function buildModalContent(char) {
  var el = char.element;
  var obtainText = 'Se obtiene comprándolo en la tienda con cierto precio y un nivel de amistad concreto, tras vencerlo en una batalla (desbloqueado por ' + char.name + ').';
  return '<div class="modal-header"><div class="modal-portrait" data-fallback="' + char.emoji + '"><img src="' + char.img + '" alt="' + char.name + '" class="portrait-img" style="opacity:0;" onload="this.style.opacity=1;" onerror="this.style.display=\'none\';"><div class="modal-hp-badge">' + char.hp + ' HP</div></div><div class="modal-info"><div class="modal-eyebrow"><span class="el-badge-lg">' + ELEMENT_EMOJI[el] + '</span>' + ELEMENT_NAMES[el] + ' · ' + char.set + '</div><h2 class="modal-title" id="modalTitle">' + char.name + '</h2><p class="modal-concept">"' + char.concept + '"</p></div><button class="modal-close" aria-label="Cerrar">×</button></div><div class="modal-body"><div class="obtain-box"><div class="obtain-label">📍 Obtención</div><p class="obtain-text">' + obtainText + '</p></div><div class="abilities">' + char.abilities.map(function(ab){ return renderAbility(ab, ELEMENT_COLORS[el]); }).join('') + '</div></div>';
}
var modal = document.getElementById('cardModal');
var modalContent = document.getElementById('modalContent');
function openCharacter(id) {
  var char = CHARACTERS[id]; if (!char || !modal || !modalContent) return;
  modalContent.style.setProperty('--el', ELEMENT_COLORS[char.element]);
  modalContent.innerHTML = buildModalContent(char);
  var closeBtn = modalContent.querySelector('.modal-close'); if (closeBtn) closeBtn.addEventListener('click', closeModal);
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
  initAudio();
  var idx = team.indexOf(id);
  if (idx >= 0) { team.splice(idx, 1); playSound('deselect'); }
  else { if (team.length >= 3) team.shift(); team.push(id); playSound('select'); }
  saveTeam(); renderTeamPanel(); if (team.length > 0) openTeamPanel();
}
function autoBuildTeam(){ initAudio(); var pool = shuffleArray(Object.keys(CHARACTERS).slice()); team = pool.slice(0, 3); saveTeam(); renderTeamPanel(); playSound('confirm'); if (team.length > 0) openTeamPanel(); }
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
}
function openTeamPanel(){ var p = document.getElementById('teamPanel'), t = document.getElementById('teamPanelToggle'); if (p) p.classList.add('open'); if (t) t.classList.add('hidden'); document.body.classList.add('team-panel-open'); }
function closeTeamPanel(){ var p = document.getElementById('teamPanel'), t = document.getElementById('teamPanelToggle'); if (p) p.classList.remove('open'); if (t) t.classList.remove('hidden'); document.body.classList.remove('team-panel-open'); }
var tpc = document.getElementById('teamPanelClose'); if (tpc) tpc.addEventListener('click', closeTeamPanel);
var tpt = document.getElementById('teamPanelToggle'); if (tpt) tpt.addEventListener('click', openTeamPanel);
var tcb = document.getElementById('teamClearBtn'); if (tcb) tcb.addEventListener('click', function(){ team = []; saveTeam(); renderTeamPanel(); });
var teamAutoBtn = document.getElementById('teamAutoBtn'); if (teamAutoBtn) teamAutoBtn.addEventListener('click', autoBuildTeam);
function addInfoButtons() {
  var cards = document.querySelectorAll('.char-card');
  for (var i = 0; i < cards.length; i++) (function(card){
    var portrait = card.querySelector('.portrait'); if (!portrait) return;
    var btn = document.createElement('button'); btn.className = 'card-info-btn'; btn.innerHTML = 'i'; btn.title = 'Ver detalles del personaje'; btn.setAttribute('aria-label', 'Ver detalles');
    btn.addEventListener('click', function(e){ e.stopPropagation(); openCharacter(card.dataset.character); });
    portrait.appendChild(btn);
  })(cards[i]);
}
function setupCardClicks() {
  var cards = document.querySelectorAll('.char-card');
  for (var i = 0; i < cards.length; i++) (function(card){ card.addEventListener('click', function(e){ if (e.target.closest && e.target.closest('.card-info-btn')) return; toggleTeam(card.dataset.character); }); })(cards[i]);
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

var TEMPLATE_SLOT_COUNT = 3;
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
      var validTeam = t.team.filter(function(id){ return CHARACTERS[id]; });
      var tp = validTeam.map(function(id){ var ch = CHARACTERS[id]; return '<span class="template-char" style="--el: ' + ELEMENT_COLORS[ch.element] + ';" title="' + ch.name + '">' + ch.emoji + '</span>'; }).join('');
      if (!validTeam.length) tp = '<span style="color: var(--muted); font-size: 0.8rem;">Equipo vacío</span>';
      var tname = t.name || ('Ranura ' + (i + 1));
      html += '<div class="template-slot filled"><div class="template-slot-header">' + tname + '</div><div class="template-team-preview">' + tp + '</div><div class="template-deck-info">🎴 ' + t.deck.length + '/30 cartas</div><div class="template-actions"><button class="template-load-btn" data-slot="' + i + '">📂 Cargar</button><button class="template-save-btn" data-slot="' + i + '">💾 Guardar</button><button class="template-delete-btn" data-slot="' + i + '" title="Borrar plantilla">🗑️</button></div></div>';
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
function canAfford(side, charState, ability) {
  if (ability.energyCost && charState.energy < ability.energyCost) return false;
  return trySpendDice(side.dice, ability.cost).ok;
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
    for (var i = 0; i < cs.length; i++) { var s = cs[i]; s.x += s.vx; s.y += s.vy; if (s.x < 0) s.x = cW; if (s.x > cW) s.x = 0; if (s.y < 0) s.y = cH; if (s.y > cH) s.y = 0; cctx.beginPath(); cctx.arc(s.x, s.y, s.r, 0, Math.PI*2); cctx.fillStyle = 'rgba(240, 220, 180, ' + s.a + ')'; cctx.fill(); }
    for (var p = 0; p < cs.length; p++) for (var q = p + 1; q < cs.length; q++) { var dx = cs[p].x - cs[q].x, dy = cs[p].y - cs[q].y, d = Math.sqrt(dx*dx + dy*dy); if (d < 120) { cctx.beginPath(); cctx.moveTo(cs[p].x, cs[p].y); cctx.lineTo(cs[q].x, cs[q].y); cctx.strokeStyle = 'rgba(240, 200, 96, ' + ((1 - d/120) * 0.12) + ')'; cctx.lineWidth = 0.5; cctx.stroke(); } }
    requestAnimationFrame(drawC);
  }
  window.addEventListener('resize', resizeC); resizeC(); drawC();
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
  if (st.kind === 'optimizacion') html += '<div class="ht-name">🧠 Optimización</div><div class="ht-sub">' + st.duration + ' ronda(s) · de Óliver</div><div class="ht-effect">+2 daño a ataques normales y elementales de los aliados. Inflige 1 de daño al enemigo al final de la ronda y lo marca con comprensión.</div>';
  hoverTooltip.innerHTML = html; hoverTooltip.classList.add('show'); positionTooltip(hoverTooltip, anchor.getBoundingClientRect(), 'left');
}
function showShieldTooltip(anchor, cs) {
  if (!cs) return;
  var html = '<div class="ht-header">🛡️ Escudos</div><div class="ht-name">' + cs.character.name + '</div>';
  if (!cs.shields || !cs.shields.length) html += '<div class="ht-effect">Sin escudos.</div>';
  else cs.shields.forEach(function(sh){ html += '<div class="ht-ab-item" style="border-left-color:#7ac8ff;"><div class="ht-ab-name">🛡️ ' + sh.hp + ' / ' + sh.maxHp + '</div><div class="ht-effect" style="font-size:0.72rem;">Fuente: ' + sh.source + '</div></div>'; });
  hoverTooltip.innerHTML = html; hoverTooltip.classList.add('show'); positionTooltip(hoverTooltip, anchor.getBoundingClientRect(), 'above');
}
function hideTooltip(){ if (hoverTooltip) hoverTooltip.classList.remove('show'); }

var COMBAT_SLOT_COUNT = 3, currentCombatSlot = null;
function getCombatSlotKey(s){ return 'azaria_saved_combat_' + s; }
function getSavedCombat(s){ try { var st = localStorage.getItem(getCombatSlotKey(s)); if (!st) return null; var p = JSON.parse(st); if (p.phase === 'ended') return null; return p; } catch (e) { return null; } }
function saveCombatToSlot(s){ if (!combatState || combatState.phase === 'ended') return; combatState.player.dice.forEach(function(d){ d.justAdded = false; }); try { localStorage.setItem(getCombatSlotKey(s), JSON.stringify(combatState)); } catch (e) {} }
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

function showCombatStartConfirm(slotNum) {
  initAudio();
  var ov = document.getElementById('combatStartConfirm'), prev = document.getElementById('combatStartTeamPreview'); if (!ov || !prev) return;
  prev.innerHTML = team.map(function(id){ var c = CHARACTERS[id]; if (!c) return ''; var col = ELEMENT_COLORS[c.element]; return '<div class="start-preview-card" style="--el: ' + col + ';"><div class="start-preview-img" data-fallback="' + c.emoji + '"><img src="' + c.img + '" alt="' + c.name + '" onerror="this.style.display=\'none\';" style="width:100%;height:100%;object-fit:cover;border-radius:8px;"></div><div class="start-preview-name">' + c.name + '</div><div class="start-preview-element">' + ELEMENT_EMOJI[c.element] + ' ' + ELEMENT_NAMES[c.element] + '</div></div>'; }).join('');
  var sub = document.getElementById('combatStartConfirmSub');
  if (sub) {
    var modeTxt = pendingPvpMode ? 'PvP Local' : 'vs Rival';
    sub.textContent = 'Ranura ' + (slotNum + 1) + ' · ' + modeTxt + ' · Tu equipo y mazo están listos';
  }
  ov.classList.add('show'); playSound('banner');
}
function hideCombatStartConfirm(){ var ov = document.getElementById('combatStartConfirm'); if (ov) ov.classList.remove('show'); }
function showSlotSelectionDialog(){ initAudio(); var ov = document.getElementById('slotSelectionDialog'); if (!ov) return; renderSlotSelectionDialog(); ov.classList.add('show'); playSound('banner'); }
function hideSlotSelectionDialog(){ var ov = document.getElementById('slotSelectionDialog'); if (ov) ov.classList.remove('show'); }
function renderSlotSelectionDialog() {
  var list = document.getElementById('slotList'); if (!list) return;
  var html = '';
  for (var i = 0; i < COMBAT_SLOT_COUNT; i++) {
    var sv = getSavedCombat(i);
    if (sv) {
      var chh = sv.player.characters.map(function(c){ return '<span class="slot-char-chip" style="--el: ' + ELEMENT_COLORS[c.character.element] + ';">' + c.character.emoji + ' ' + c.character.name + '</span>'; }).join('');
      var hp = sv.player.characters.map(function(c){ return c.hp + '/' + c.maxHp; }).join(' · ');
      var hl = sv.player.hand ? sv.player.hand.length : 0;
      var modeIcon = sv.pvp ? '👥 ' : (sv.online ? '🌐 ' : '⚔️ ');
      html += '<div class="slot-item"><div class="slot-item-header"><span class="slot-item-title">Ranura ' + (i + 1) + '</span><span class="slot-item-round">' + modeIcon + 'Ronda ' + sv.round + ' · ' + (sv.turn === 'player' ? (sv.pvp ? 'J1' : 'Tu turno') : (sv.pvp ? 'J2' : 'Rival')) + '</span></div><div class="slot-item-preview">' + chh + '</div><div class="slot-hp-text">❤️ ' + hp + ' · 🎴 ' + hl + ' cartas en mano</div><div class="slot-item-actions"><button class="slot-action slot-resume" data-slot="' + i + '">▶️ Reanudar</button><button class="slot-action slot-delete" data-slot="' + i + '">🗑️ Borrar</button></div></div>';
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
    if (sv) { var ch = sv.player.characters.map(function(c){ return c.character.emoji; }).join(' '); var modeIcon = sv.pvp ? '👥 ' : (sv.online ? '🌐 ' : '⚔️ '); html += '<div class="slot-item"><div class="slot-item-header"><span class="slot-item-title">Ranura ' + (i + 1) + '</span><span class="slot-item-round">' + modeIcon + 'Ronda ' + sv.round + '</span></div><div class="slot-item-preview" style="font-size:1.4rem;">' + ch + '</div><div class="slot-item-actions"><button class="slot-action slot-overwrite" data-slot="' + i + '">⚠️ Sobrescribir</button></div></div>'; }
  }
  list.innerHTML = html;
  list.querySelectorAll('.slot-overwrite').forEach(function(btn){ btn.addEventListener('click', function(){ var s = parseInt(btn.dataset.slot, 10); if (!confirm('¿Sobrescribir la ranura ' + (s + 1) + '?')) return; hideOverwriteDialog(); prepareNewCombat(s); }); });
}
function prepareNewCombat(preferredSlot) {
  if (!Array.isArray(team) || team.length < 3) { showTeamMissingToast('Necesitas <strong>' + (3 - (team ? team.length : 0)) + '</strong> personaje(s) más.'); openTeamPanel(); scrollToCollection(); return; }
  var valid = team.filter(function(id){ return COMBAT_CHARS[id]; });
  if (valid.length < 3) { showTeamMissingToast('Necesitas <strong>' + (3 - valid.length) + '</strong> personaje(s) válido(s) más.'); openTeamPanel(); scrollToCollection(); return; }
  if (!Array.isArray(deck) || deck.length !== 30) { var dm = 30 - (deck ? deck.length : 0); if (dm > 0) showTeamMissingToast('Necesitas <strong>' + dm + '</strong> carta(s) más en tu mazo.'); else showTeamMissingToast('Tu mazo tiene <strong>' + deck.length + '</strong> cartas. Debe tener <strong>30</strong>.'); closeTeamPanel(); scrollToDeck(); return; }
  var s = preferredSlot;
  if (s === null || s === undefined) { s = findEmptyCombatSlot(); if (s === -1) { showOverwriteDialog(); return; } }
  currentCombatSlot = s; showCombatStartConfirm(s);
}
function openCombat(mode){
  pendingPvpMode = (mode === 'pvp');
  if (hasAnySavedCombat()) { showSlotSelectionDialog(); return; }
  prepareNewCombat(null);
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
  combatState.player.characters.forEach(function(c){ if (COMBAT_CHARS[c.id]) c.character = COMBAT_CHARS[c.id]; if (!c.equipment) c.equipment = []; if (!c.states) c.states = {}; if (!c.marks) c.marks = {}; });
  combatState.bot.characters.forEach(function(c){ if (COMBAT_CHARS[c.id]) c.character = COMBAT_CHARS[c.id]; if (!c.equipment) c.equipment = []; if (!c.states) c.states = {}; if (!c.marks) c.marks = {}; });
  if (typeof combatState.player.mulliganUsed === 'undefined') combatState.player.mulliganUsed = false;
  pendingPvpMode = !!combatState.pvp;
  pendingOnlineMode = !!combatState.online;
  hideSlotSelectionDialog();
  var m = document.getElementById('combatModal'); m.classList.add('open'); document.body.style.overflow = 'hidden';
  initAudio(); preloadCombatImages(); initCombatStars();
  if (combatState.phase === 'rolling') { renderCombat(); showRollOverlay(); }
  else if (combatState.phase === 'drawing') { drawInitialShown = true; renderCombat(); renderDrawOverlay(); document.getElementById('drawOverlay').classList.add('show'); }
  else {
    renderCombat();
    if (combatState.phase === 'playing' && combatState.turn === 'bot' && !combatState.botDone && !combatState.pvp && !combatState.online) setTimeout(botTurn, 800);
  }
}
function actuallyStartCombat(){ var m = document.getElementById('combatModal'); if (!m) return; initAudio(); preloadCombatImages(); initCombatStars(); m.classList.add('open'); document.body.style.overflow = 'hidden'; startCombat(); }
function closeCombat() {
  saveCombatState();
  var m = document.getElementById('combatModal'); if (!m) return;
  m.classList.remove('open'); document.body.style.overflow = '';
  if (peerConn) { try { peerConn.close(); } catch(e) {} peerConn = null; }
  if (peerObj) { try { peerObj.destroy(); } catch(e) {} peerObj = null; }
  pendingOnlineMode = false; pendingGuestTeam = null; pendingGuestDeck = null;
  combatState = null; currentCombatSlot = null;
  hideBanner(); hideSelectOverlay(); hideTooltip(); hideConfirmation(); hideRollOverlay(); hideDrawOverlay();
}
function startCombat() {
  var pids = getPlayerTeamIds(), bids = getRandomBotTeam();
  if (!pids) { closeCombat(); return; }
  if (currentCombatSlot !== null) clearCombatSlot(currentCombatSlot);
  var isPvp = !!pendingPvpMode;
  combatState = { round:1, turn:'player', phase:'rolling', playerDone:false, botDone:false, winner:null, starterChosen:false, log:[], player:buildSideState(pids), bot:buildSideState(bids), pvp:isPvp };
  combatState.player.consonance = getConsonanceForIds(pids); combatState.bot.consonance = getConsonanceForIds(bids);
  combatState.player.deck = shuffleArray(deck.slice());
  if (isPvp) combatState.bot.deck = generateRandomDeck();
  combatState.player.hand = []; combatState.player.discardPile = [];
  combatState.player.cardsUsedThisRound = {}; combatState.player.cardsUsedThisGame = {}; combatState.player.drawSelection = {};
  combatState.bot.hand = []; combatState.bot.discardPile = [];
  combatState.bot.cardsUsedThisRound = {}; combatState.bot.cardsUsedThisGame = {}; combatState.bot.drawSelection = {};
  var ov = document.getElementById('combatEndOverlay'); if (ov) ov.classList.remove('open');
  hideBanner();
  logCombat('⚔️ Combate 3v3 iniciado' + (isPvp ? ' (PvP Local)' : ''));
  logCombat((isPvp ? '👥 J1: ' : '🤖 Rival: ') + bids.map(function(id){ return COMBAT_CHARS[id].name; }).join(', '));
  var pc = combatState.player.consonance;
  if (pc) { if (pc.type === 'diverse') logCombat('🎯 Consonancia J1: 🌈 Diverso'); else logCombat('🎯 Consonancia J1: ' + ELEMENT_EMOJI[pc.element] + ' ' + ELEMENT_NAMES[pc.element] + ' (' + pc.level + ' personajes)'); }

  if (isPvp) {
    rollDiceForSide('player', true);
    rollDiceForSide('bot', true);
    for (var i = 0; i < 5; i++) drawFromDeck('player');
    for (var j = 0; j < 5; j++) drawFromDeck('bot');
    combatState.player.activeIndex = 0;
    combatState.bot.activeIndex = 0;
    combatState.starterChosen = true;
    combatState.phase = 'playing';
    combatState.turn = 'player';
    logCombat('🎴 Ambos roban 5 cartas');
    logCombat('⚔️ Turno de Jugador 1');
    hideRollOverlay();
    renderCombat();
    beginRoundPlay();
    return;
  }

  logCombat('▶️ Ronda 1 · Lanza tus dados');
  rollDiceForSide('player', true);
  rollDiceForSide('bot', true);
  renderCombat();
  showRollOverlay();
}
function rollDiceForSide(who, first){ var s = combatState[who]; s.dice = rollCombatDice(8); if (!(who === 'player' && first)) applyIlusion(s, who); }
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
    if (!combatState || combatState.player.isRollingAnim || combatState.player.rerolled) return;
    combatState.player.selected = {};
    combatState.player.dice.forEach(function(d) { if (d.type !== 'omni') combatState.player.selected[d.id] = true; });
    playSound('select');
    renderRollOverlay();
  });
  rollControls.insertBefore(btn, rollControls.firstChild);
}
function showRollOverlay() {
  if (!combatState) return;
  var ov = document.getElementById('rollOverlay'), sub = document.getElementById('rollSubtitle'); if (!ov || !sub) return;
  ensureSelectNonOmniBtn();
  sub.textContent = 'Ronda ' + combatState.round; ov.classList.add('show'); playSound('roll');
  combatState.player.isRollingAnim = true; renderRollOverlay();
  setTimeout(function(){ if (!combatState) return; combatState.player.isRollingAnim = false; renderRollOverlay(); playSound('diceReveal'); }, 900);
}
function hideRollOverlay(){ var ov = document.getElementById('rollOverlay'); if (ov) ov.classList.remove('show'); }
function renderRollOverlay() {
  if (!combatState) return;
  var player = combatState.player;
  var main = document.getElementById('rollDiceMain'), rerollBtn = document.getElementById('rollRerollBtn'), startBtn = document.getElementById('rollStartBtn');
  function renderDie(d) {
    var isRolling = player.isRollingAnim || (player.rollingIds && player.rollingIds[d.id]);
    var isSel = player.selected[d.id];
    var col = isRolling ? ROLLING_COLOR : (d.type === 'omni' ? '240, 200, 96' : ELEMENT_COLORS[d.type]);
    var em = isRolling ? '🎲' : (d.type === 'omni' ? '✨' : ELEMENT_EMOJI[d.type]);
    var cls = 'roll-die'; if (isRolling) cls += ' rolling'; if (d.type === 'omni' && !isRolling) cls += ' omni'; if (isSel) cls += ' selected';
    return '<div class="' + cls + '" data-id="' + d.id + '" data-type="' + d.type + '" style="--dc: ' + col + ';">' + em + '</div>';
  }
  if (main) { main.innerHTML = sortDiceForDisplay(player.dice, player).map(renderDie).join(''); main.querySelectorAll('.roll-die').forEach(function(el){ el.addEventListener('click', function(){ if (combatState.player.isRollingAnim) return; toggleDieSelection(el.dataset.id); renderRollOverlay(); }); }); }
  var isRolling = player.isRollingAnim;
  if (rerollBtn) { var sc = Object.keys(player.selected).length; rerollBtn.disabled = player.rerolled || sc === 0 || isRolling; rerollBtn.textContent = player.rerolled ? '🎲 Ya relanzado' : (sc > 0 ? '🎲 Relanzar ' + sc : '🎲 Relanzar seleccionados'); }
  if (startBtn) startBtn.disabled = isRolling;
  var selAllBtn = document.getElementById('selectNonOmniBtn');
  if (selAllBtn) { selAllBtn.disabled = player.rerolled || isRolling; }
}
function toggleDieSelection(id){
  if (!combatState || combatState.phase === 'ended') return;
  var s = combatState.player;
  if (combatState.phase === 'rolling') {
    if (s.rerolled) { playSound('error'); return; }
    var die = s.dice.find(function(d){ return d.id === id; });
    if (die && die.type === 'omni') { playSound('error'); return; }
  }
  if (s.selected[id]) { delete s.selected[id]; playSound('deselect'); } else { s.selected[id] = true; playSound('select'); }
}
function rerollSelected() {
  if (!combatState || combatState.player.rerolled || combatState.player.isRollingAnim) return;
  var selected = Object.keys(combatState.player.selected);
  selected = selected.filter(function(id){
    var die = combatState.player.dice.find(function(d){ return d.id === id; });
    return die && die.type !== 'omni';
  });
  if (!selected.length) return;
  playSound('roll'); combatState.player.rollingIds = {};
  selected.forEach(function(id){ combatState.player.rollingIds[id] = true; });
  if (combatState.phase === 'rolling') renderRollOverlay(); else renderCombat();
  setTimeout(function(){
    if (!combatState) return;
    combatState.player.dice = combatState.player.dice.map(function(d){ if (combatState.player.rollingIds[d.id]) { if (Math.random() < 0.125) return { type:'omni', id:d.id }; return { type:CONSONANCE_ORDER[Math.floor(Math.random()*7)], id:d.id }; } return d; });
    combatState.player.rollingIds = {}; combatState.player.rerolled = true; combatState.player.selected = {};
    logCombat('🎲 Relanzas ' + selected.length + ' dado(s)'); playSound('diceReveal');
    if (combatState.phase === 'rolling') renderRollOverlay(); else renderCombat();
  }, 900);
}

var drawInitialShown = false;
function startCombatPhase(){ if (!combatState || combatState.phase !== 'rolling') return; hideRollOverlay(); startDrawPhase(); }
function startDrawPhase() {
  if (!combatState) return;
  combatState.phase = 'drawing'; combatState.player.initialDrawThisRound = []; combatState.player.drawSelection = {};
  if (combatState.round === 1) combatState.player.mulliganUsed = false;
  var base = combatState.round === 1 ? 5 : 2;
  var bonus = getCardDrawBonus(combatState.player, combatState.round === 1);
  var dc = base + bonus, drawn = [];
  for (var i = 0; i < dc; i++) { var c = drawFromDeck('player'); if (c) drawn.push(c); }
  combatState.player.initialDrawThisRound = drawn;
  var msg = bonus > 0 ? ' (+' + bonus + ' por Expresión)' : '';
  logCombat('🎴 Robas ' + drawn.length + ' carta(s)' + msg);
  drawInitialShown = true; playSound('draw'); renderCombat(); showDrawOverlay();
}
function getCardDrawBonus(side, first){ var c = side.consonance; if (!c || c.type !== 'single' || c.element !== 'expresion') return 0; if (c.level === 2) return first ? 2 : 0; if (c.level === 3) return 1; return 0; }
function showDrawOverlay(){ var ov = document.getElementById('drawOverlay'); if (!ov) return; renderDrawOverlay(); ov.classList.add('show'); }
function hideDrawOverlay(){ var ov = document.getElementById('drawOverlay'); if (ov) ov.classList.remove('show'); }
function renderDrawOverlay() {
  if (!combatState) return;
  var player = combatState.player;
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
  var player = combatState.player;
  if (combatState.round !== 1 || player.mulliganUsed) return;
  var keys = Object.keys(player.drawSelection || {}); if (!keys.length) return;
  var ri = {}; keys.forEach(function(k){ var p = k.split('_'); var idx = parseInt(p[p.length-1], 10); if (!isNaN(idx)) ri[idx] = true; });
  var keep = [], back = [];
  player.initialDrawThisRound.forEach(function(cid, i){ if (ri[i]) back.push(cid); else keep.push(cid); });
  back.forEach(function(cid){ var hi = player.hand.indexOf(cid); if (hi >= 0) player.hand.splice(hi, 1); player.deck.push(cid); });
  player.deck = shuffleArray(player.deck);
  var nd = []; for (var i = 0; i < back.length; i++) { var c = drawFromDeck('player'); if (c) nd.push(c); }
  player.initialDrawThisRound = keep.concat(nd); player.mulliganUsed = true; player.drawSelection = {};
  logCombat('🔄 Mulligan: ' + back.length + ' carta(s) cambiada(s)');
  drawInitialShown = true; playSound('draw'); renderCombat(); renderDrawOverlay();
}
function onDrawContinue() {
  if (!combatState) return;
  hideDrawOverlay(); combatState.player.initialDrawThisRound = []; combatState.player.drawSelection = {};
  if (combatState.round === 1 && !combatState.starterChosen) { renderCombat(); showSelectOverlay(); }
  else beginRoundPlay();
}

function showSelectOverlay(){ var ov = document.getElementById('selectOverlay'); if (!ov) return; renderSelectOverlay(); ov.classList.add('show'); }
function hideSelectOverlay(){ var ov = document.getElementById('selectOverlay'); if (ov) ov.classList.remove('show'); hideSelectDetail(); }
function renderSelectOverlay() {
  if (!combatState) return;
  var c = document.getElementById('selectOptions'), d = document.getElementById('selectDetail'); if (!c || !d) return;
  d.classList.remove('show'); d.innerHTML = ''; c.style.display = '';
  c.innerHTML = combatState.player.characters.map(function(cs, i){ var col = ELEMENT_COLORS[cs.character.element]; return '<div class="select-char-card" data-index="' + i + '" style="--el: ' + col + ';"><div class="sel-portrait" data-fallback="' + cs.character.emoji + '"><img src="img/' + cs.id + '.png" alt="' + cs.character.name + '" onerror="this.style.display=\'none\';"></div><div class="sel-name">' + cs.character.name + '</div><div class="sel-element">' + ELEMENT_EMOJI[cs.character.element] + ' ' + ELEMENT_NAMES[cs.character.element] + '</div><div class="sel-stats"><span class="sel-hp">❤️ ' + cs.hp + '/' + cs.maxHp + '</span><span class="sel-energy">⚡ ' + cs.maxEnergy + '</span></div></div>'; }).join('');
  c.querySelectorAll('.select-char-card').forEach(function(card){ card.addEventListener('click', function(){ hideTooltip(); showSelectDetail(parseInt(card.dataset.index, 10)); }); });
}
function showSelectDetail(idx) {
  if (!combatState) return;
  var cs = combatState.player.characters[idx]; if (!cs) return;
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
  document.getElementById('selectConfirmBtn').addEventListener('click', function(){ hideTooltip(); combatState.player.activeIndex = idx; combatState.starterChosen = true; playSound('confirm'); logCombat('🦋 Empiezas con ' + cs.character.name); applyIlusion(combatState.player, 'player'); hideSelectOverlay(); renderCombat(); setTimeout(beginRoundPlay, 250); });
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
      if (eq.effect.elementDicePerRound && who === 'bot' && combatState.pvp) { for (var i = 0; i < eq.effect.elementDicePerRound; i++) side.dice.push({ type:cs.character.element, id:uid(), justAdded:true }); }
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
  var side = combatState[who]; if (!side.structures || !side.structures.length) return;
  var enemySide = combatState[who === 'player' ? 'bot' : 'player'];
  for (var i = side.structures.length - 1; i >= 0; i--) {
    var st = side.structures[i];
    if (st.kind === 'optimizacion') {
      var ea = enemySide.characters[enemySide.activeIndex];
      if (ea && !ea.dead) {
        dealDamageToChar(ea, 1, { targetSide:enemySide, targetSideKey:who === 'player' ? 'bot' : 'player', targetIdx:enemySide.activeIndex });
        if (!ea.dead) triggerMarkOrResonance(ea, 'comprension', who, who === 'player' ? 'bot' : 'player', enemySide.activeIndex);
        logCombat('🏛️ Optimización: 1 daño y marca comprensión');
      }
      st.duration--; if (st.duration <= 0) { logCombat('🏛️ Optimización se desvanece'); side.structures.splice(i, 1); }
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
  if (combatState.online) bannerText = combatState.turn === 'player' ? 'TURNO JUGADOR 1' : 'TURNO JUGADOR 2';
  showBanner(bannerText, 1400);
  renderCombat();
  var applyEff = function() {
    if (!combatState || combatState.phase === 'ended') return;
    var pm = applyRoundStartEffects('player'), bm = applyRoundStartEffects('bot');
    if (combatState.round === 1) { var cm = applyComprensionStart('player'); if (cm) pm.push(cm); var cmb = applyComprensionStart('bot'); if (cmb) bm.push(cmb); }
    applyEquipmentRoundStartEffects('player'); applyEquipmentRoundStartEffects('bot');
    applySupportRoundStartEffects('player'); applySupportRoundStartEffects('bot');
    combatState.player.characters.forEach(function(c){ if (c.states) c.states.acelerado = false; });
    combatState.bot.characters.forEach(function(c){ if (c.states) c.states.acelerado = false; });
    logCombat('⚔️ ¡Comienza el combate!'); pm.forEach(function(m){ logCombat(m); });
    renderCombat();
    if (isOnlineHost()) scheduleBroadcast();
  };
  if (toast) setTimeout(function(){ if (!combatState || combatState.phase === 'ended') return; showDiversoToast(toast); playSound('omni'); setTimeout(applyEff, 250); }, 1600);
  else setTimeout(applyEff, 1600);
}

function computeBaseDamageForAbility(attackerCs, ability, actionType) {
  var kind = ability.kind;
  var enemyKey = (combatState.player.characters.indexOf(attackerCs) >= 0) ? 'bot' : 'player';
  var enemySide = combatState[enemyKey];
  var enemyActive = enemySide.characters[enemySide.activeIndex];
  switch (kind) {
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
  if (ability.kind === 'ecoVital') return 2;
  if (ability.kind === 'armonia') { var side = (combatState.player.characters.indexOf(active) >= 0) ? combatState.player : combatState.bot; var sint = side.characters.filter(function(c){ return c !== active && !c.dead && csHasState(c, 'sintonia'); }).length; return Math.max(0, 5 - sint); }
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
function applyGenericDamageMods(active, dmg) {
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
  }
  return base;
}
function applyDamageWithMods(targetCs, dmg, forcedPiercing, sideKey, idx, attackerCs) {
  var side = combatState[sideKey], piercing = forcedPiercing;
  if (attackerCs) { var eq = getEquipmentAttackBonus(attackerCs); if (eq.piercing) piercing = true; }
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
  var label = who === 'player' ? (combatState.pvp || combatState.online ? '🦋 J1' : '🦋 Tú') : (combatState.pvp || combatState.online ? '🦋 J2' : '📖 El rival');
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
    case 'damage': {
      var dmg = ability.damage || 0;
      dmg = applyGenericDamageMods(active, dmg);
      if (active.pendingBuff) pendingBuffConsumed = true;
      if (actionType === 'normal' || actionType === 'elemental') { var ob = getOptimizationBonus(side); if (ob > 0) { dmg += ob; logCombat('🏛️ Optimización: +' + ob); } }
      if (actionType === 'ultimate' && side.obraMaestraTurns > 0) { dmg *= 2; logCombat('💥 Obra Maestra: daño x2'); }
      if (active.id === 'erik') { var eb = applyErikPassive(active); if (eb > 0) { dmg += eb; logCombat('🩸 Inspiración: +' + eb); } }
      if (active.id === 'eevee' && csHasState(active, 'furia') && active.states.furiaTarget === enemyActive.id && actionType === 'normal') { dmg += 1; logCombat('🔥 Furia: +1'); }
      applyDamageWithMods(enemyActive, dmg, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
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
      if (condena > 0) applyDamageWithMods(enemyActive, condena, true, enemyKey, enemySide.activeIndex, active);
      if (active.states) active.states.condena = 0;
      enemySide.characters.forEach(function(c, i){ if (!c.dead) triggerMarkOrResonance(c, 'redencion', who, enemyKey, i); });
      var anyEnemyAlive = enemySide.characters.some(function(c){ return !c.dead; });
      if (anyEnemyAlive) {
        active.hp = 0;
        handleDeath(who, side.activeIndex);
        logCombat('💀 Alaya muere por el precio de su definitiva');
        shouldEndTurn = 'checkEnd';
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
    case 'inconsistencia': {
      applyDamageWithMods(enemyActive, 2, true, enemyKey, enemySide.activeIndex, active);
      var nx = getNextAliveIndex(enemySide, enemySide.activeIndex);
      if (nx >= 0) { enemySide.activeIndex = nx; logCombat('🔄 Enemigo forzado a ' + enemySide.characters[nx].character.name); triggerMarkOrResonance(enemySide.characters[nx], 'ilusion', who, enemyKey, nx); }
      var rsv = getNextAliveIndex(side, side.activeIndex);
      if (rsv >= 0) { logCombat('👻 Paso Fantasma: Ren a reserva'); side.activeIndex = rsv; }
      break;
    }
    case 'destruccionLogica': {
      if (!enemyActive.dead) triggerMarkOrResonance(enemyActive, 'ilusion', who, enemyKey, enemySide.activeIndex);
      applyDamageWithMods(enemyActive, 3, true, enemyKey, enemySide.activeIndex, active);
      var nx2 = getNextAliveIndex(enemySide, enemySide.activeIndex);
      if (nx2 >= 0) { enemySide.activeIndex = nx2; logCombat('🔄 Enemigo forzado'); }
      var rsv2 = getNextAliveIndex(side, side.activeIndex);
      if (rsv2 >= 0) { logCombat('👻 Paso Fantasma: Ren a reserva'); side.activeIndex = rsv2; }
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
      var dealt = applyDamageWithMods(enemyActive, 3, predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
      if (!enemyActive.dead) {
        enemyActive.states = enemyActive.states || {};
        enemyActive.states.rencor = (enemyActive.states.rencor || 0) + 1;
        logCombat('💢 ' + enemyActive.character.name + ' acumula Rencor (' + enemyActive.states.rencor + ')');
      }
      if (dealt > 0) { healChar(active, dealt); logCombat('🩸 Deuda de Sangre: +' + dealt); }
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
      applyDamageWithMods(enemyActive, 4 + (active.manuelStacks || 0), predictPiercing(active, ability), enemyKey, enemySide.activeIndex, active);
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
      if (jr >= 0) { logCombat('🦋 Jose a reserva'); side.activeIndex = jr; shouldEndTurn = false; }
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
  if (side.characters[targetIndex].id === 'jose') csSetState(side.characters[targetIndex], 'acelerado', true);
  var sfx = rules.quick ? ' (acción rápida)' : (rules.discounted ? ' (gratis)' : '');
  logCombat('🔄 ' + (who === 'player' ? (combatState.pvp || combatState.online ? 'J1' : 'Tú') : (combatState.pvp || combatState.online ? 'J2' : 'El rival')) + ': ' + oldN + ' → ' + newN + sfx);
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
  if (!combatState || combatState.pvp || combatState.online || combatState.phase !== 'playing' || combatState.botDone || combatState.turn !== 'bot') return;
  var action = botChooseAction();
  if (action) { setTimeout(function(){ if (!combatState || combatState.pvp || combatState.online) return; if (action.type === 'change') { var r = tryChangeCharacter('bot', action.index); renderCombat(); if (r === 'quick') setTimeout(botTurn, 500); else if (r) setTimeout(nextTurn, 400); else setTimeout(botTurn, 400); } else executeAction('bot', action.type); }, 500); }
  else { logCombat('🤖 El rival no puede actuar'); setTimeout(function(){ declareEnd('bot'); }, 500); }
}
function nextTurn() {
  if (!combatState || combatState.phase === 'ended') return;
  if (combatState.playerDone && combatState.botDone) { endRound(); return; }
  var next = combatState.turn === 'player' ? 'bot' : 'player';
  if (next === 'player' && combatState.playerDone) next = 'bot';
  else if (next === 'bot' && combatState.botDone) next = 'player';
  combatState.turn = next;
  if (next === 'bot') {
    if (combatState.pvp) {
      showBanner('TURNO JUGADOR 2', 1200);
      renderCombat();
    } else if (combatState.online) {
      showBanner('TURNO JUGADOR 2', 1200);
      renderCombat();
    } else {
      showBanner('TURNO DEL RIVAL', 1200);
      renderCombat();
      if (!combatState.botDone) setTimeout(botTurn, 1400);
    }
  }
  else {
    showBanner(combatState.pvp || combatState.online ? 'TURNO JUGADOR 1' : 'TU TURNO', 1200);
    renderCombat();
  }
  if (isOnlineHost()) scheduleBroadcast();
}
function declareEnd(who) {
  if (!combatState || combatState.phase === 'ended' || combatState[who + 'Done']) return;
  combatState[who + 'Done'] = true;
  if (combatState.pvp && !combatState.firstDeclarer) combatState.firstDeclarer = who;
  if (combatState.pvp || combatState.online) {
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
  applyStructureEndOfRoundEffects('player'); applyStructureEndOfRoundEffects('bot');
  ['player','bot'].forEach(function(wk){ var sd = combatState[wk]; if (sd.hand) sd.hand = sd.hand.filter(function(cid){ return !PAINT_CARDS[cid]; }); });
  var pdead = processDeathsAtRoundEnd('player'), bdead = processDeathsAtRoundEnd('bot');
  renderCombat();
  if (bdead) { setTimeout(function(){ endCombat('player'); }, 600); return; }
  if (pdead) { setTimeout(function(){ endCombat('bot'); }, 600); return; }
  combatState.round++; combatState.playerDone = false; combatState.botDone = false;
  combatState.player.firstChangeUsed = false; combatState.player.firstAttackUsed = false;
  combatState.bot.firstChangeUsed = false; combatState.bot.firstAttackUsed = false;
  if (combatState.player.obraMaestraTurns > 0) combatState.player.obraMaestraTurns--;
  if (combatState.bot.obraMaestraTurns > 0) combatState.bot.obraMaestraTurns--;
  ['player','bot'].forEach(function(wk){ combatState[wk].characters.forEach(function(c){
    c.pendingBuff = 0; c.cardMarkBonus = 0;
    if (c.states) {
      c.states.acelerado = false;
      c.states.furia = false; c.states.furiaPending = false; c.states.furiaTarget = null;
    }
  }); });
  combatState.player.rerolled = false; combatState.player.selected = {}; combatState.player.rollingIds = {};
  combatState.player.cardsUsedThisRound = {};
  if (combatState.pvp || combatState.online) {
    combatState.bot.rerolled = false; combatState.bot.selected = {}; combatState.bot.rollingIds = {};
    combatState.bot.cardsUsedThisRound = {};
  }
  setTimeout(function(){
    if (!combatState) return;
    combatState.phase = 'rolling';
    if (combatState.pvp) {
      rollDiceForSide('player', false);
      rollDiceForSide('bot', false);
      for (var i = 0; i < 2; i++) drawFromDeck('player');
      for (var j = 0; j < 2; j++) drawFromDeck('bot');
      combatState.phase = 'playing';
      combatState.turn = combatState.firstDeclarer || 'player';
      combatState.firstDeclarer = null;
      logCombat('═══ Ronda ' + combatState.round + ' ═══');
      renderCombat();
      beginRoundPlay();
      return;
    }
    if (combatState.online) {
      // Host maneja ambos lados
      rollDiceForSide('player', false);
      rollDiceForSide('bot', false);
      for (var a = 0; a < 2; a++) drawFromDeck('player');
      for (var b = 0; b < 2; b++) drawFromDeck('bot');
      combatState.phase = 'playing';
      combatState.turn = 'player';
      logCombat('═══ Ronda ' + combatState.round + ' ═══');
      renderCombat();
      beginRoundPlay();
      scheduleBroadcast();
      return;
    }
    combatState.turn = 'player';
    logCombat('═══ Ronda ' + combatState.round + ' ═══'); logCombat('🎲 Lanzas dados');
    rollDiceForSide('player', false); rollDiceForSide('bot', false);
    renderCombat(); showRollOverlay();
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
  } else if (combatState.online) {
    if (isOnlineHost()) {
      if (winner === 'player') { em.textContent = '🏆'; ti.textContent = '¡Victoria!'; ti.style.color = 'var(--accent)'; su.textContent = 'Has derrotado al invitado'; playSound('victory'); }
      else { em.textContent = '💀'; ti.textContent = 'Derrota'; ti.style.color = '#c82d3c'; su.textContent = 'El invitado te ha derrotado'; playSound('defeat'); }
      broadcastState();
    } else {
      if (winner === 'bot') { em.textContent = '🏆'; ti.textContent = '¡Victoria!'; ti.style.color = 'var(--accent)'; su.textContent = 'Has derrotado al anfitrión'; playSound('victory'); }
      else { em.textContent = '💀'; ti.textContent = 'Derrota'; ti.style.color = '#c82d3c'; su.textContent = 'El anfitrión te ha derrotado'; playSound('defeat'); }
    }
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
  }
}
function canPayCardCost(cost){ var side = getActiveSide(); if (!side) return false; var t = sumCost(cost); if (t === 0) return true; return trySpendDice(side.dice, cost).ok; }
function playCardRequest(cardId) {
  if (!combatState || combatState.phase !== 'playing') return;
  if (isTurnDone()) return;
  if (isOnlineGuest()) {
    if (!isMyTurn()) return;
    var sideOC = getTurnSide();
    var cardOC = CARD_DB[cardId] || PAINT_CARDS[cardId];
    if (!cardOC) return;
    if (cardOC.oncePerRound && sideOC.cardsUsedThisRound[cardId]) { playSound('error'); return; }
    if (cardOC.oncePerGame && sideOC.cardsUsedThisGame[cardId]) { playSound('error'); return; }
    var adjOC = adjustCardCostForPassives(cardOC, sideOC);
    if (!trySpendDice(sideOC.dice, adjOC).ok) { playSound('error'); return; }
    netSend({ type:'action', action:{ kind:'playCard', cardId:cardId } });
    return;
  }
  var side = getTurnSide(); if (!side) return;
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId]; if (!card) return;
  if (card.oncePerRound && side.cardsUsedThisRound[cardId]) { playSound('error'); return; }
  if (card.oncePerGame && side.cardsUsedThisGame[cardId]) { playSound('error'); return; }
  var adjustedCost = adjustCardCostForPassives(card, side);
  showCardConfirmation(cardId, adjustedCost, function(selectedDice){
    var spentIds = {}; selectedDice.forEach(function(d){ spentIds[d.id] = true; });
    side.dice = side.dice.filter(function(d){ return !spentIds[d.id]; });
    applyCardPlay(cardId, selectedDice);
  });
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
    renderCombat(); if (isOnlineHost()) scheduleBroadcast(); return;
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
      renderCombat(); if (isOnlineHost()) scheduleBroadcast();
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
        renderCombat(); if (isOnlineHost()) scheduleBroadcast();
      }, function cancel(){ refundDice(spentDice); renderCombat(); });
    } else {
      finalizeCardPlay(cardId);
      player.supports[es] = { cardId:cardId, duration:card.duration };
      if (card.effect && card.effect.shieldInstant) addOrRefreshShield(player.characters[player.activeIndex], 'support_' + cardId, card.effect.shieldInstant);
      if (card.effect && card.effect.teamShieldInstant) player.characters.forEach(function(c){ if (!c.dead) addOrRefreshShield(c, 'support_' + cardId, card.effect.teamShieldInstant); });
      renderCombat(); if (isOnlineHost()) scheduleBroadcast();
    }
  } else { finalizeCardPlay(cardId); applyCardEffect(card); renderCombat(); if (isOnlineHost()) scheduleBroadcast(); }
}

function hideConfirmation(){ var ov = document.getElementById('confirmOverlay'); if (ov) ov.classList.remove('show'); }
function showEquipmentTargetDialog(cardId, onConfirm, onCancel) {
  var card = CARD_DB[cardId]; if (!card) return;
  var player = getActiveSide(); if (!player) return;
  if (silentActionApply) { onConfirm(player.activeIndex, (player.characters[player.activeIndex].equipment||[]).length >= 2 ? 0 : -1); return; }
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent');
  if (!ov || !content) { onCancel(); return; }
  hideTooltip();
  var html = '<div class="confirm-title">⚔️ Equipar Carta</div><div class="confirm-subtitle">' + card.emoji + ' ' + card.name + '</div><div class="confirm-body">' + card.effectText + '</div><div class="confirm-char-selector">';
  player.characters.forEach(function(cs, i){
    if (cs.dead) return;
    html += '<div class="confirm-char-option" data-idx="' + i + '" style="--el: ' + ELEMENT_COLORS[cs.character.element] + ';"><div class="confirm-char-emoji">' + cs.character.emoji + '</div><div class="confirm-char-name">' + cs.character.name + '</div><div class="confirm-char-equip">';
    if (!cs.equipment) cs.equipment = [];
    for (var ei = 0; ei < 2; ei++) { var eqId = cs.equipment[ei]; if (eqId && CARD_DB[eqId]) html += '<span class="confirm-char-equip-icon">' + CARD_DB[eqId].emoji + '</span>'; else html += '<span class="confirm-char-equip-empty">+</span>'; }
    html += '</div></div>';
  });
  html += '</div><div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="equipCancelBtn">Cancelar</button></div>';
  content.innerHTML = html;
  content.querySelectorAll('.confirm-char-option').forEach(function(el){ el.addEventListener('click', function(){ var i = parseInt(el.dataset.idx, 10), t = player.characters[i]; if (t.equipment && t.equipment.length >= 2) showEquipmentReplaceDialog(cardId, i, onConfirm, onCancel); else { hideConfirmation(); onConfirm(i, -1); } }); });
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
  for (var i = 0; i < side.dice.length; i++) {
    if (side.dice[i].type !== targetElement) {
      selectedDieId = side.dice[i].id;
      break;
    }
  }
  function build() {
    var html = '<div class="confirm-title">🗑️ Descartar Carta</div>';
    html += '<div class="confirm-subtitle">' + card.emoji + ' ' + card.name + '</div>';
    html += '<div class="confirm-body"><div style="margin-bottom: 0.5rem;">Descarta esta carta para cambiar <strong>1 dado</strong> al tipo del activo (<strong style="color: rgb(' + ELEMENT_COLORS[targetElement] + ');">' + ELEMENT_EMOJI[targetElement] + ' ' + ELEMENT_NAMES[targetElement] + '</strong>).</div><div style="font-size: 0.75rem; color: var(--muted); font-style: italic;">Acción rápida: no pasa el turno.</div></div>';
    html += '<div class="confirm-dice-picker"><div class="confirm-dice-label"><span>Selecciona 1 dado</span><span class="confirm-dice-count' + (selectedDieId ? ' is-complete' : '') + '">' + (selectedDieId ? '1 / 1' : '0 / 1') + '</span></div><div class="confirm-dice-pool">';
    sortDiceForDisplay(side.dice, side).forEach(function(d){
      var alreadyTarget = d.type === targetElement;
      var col = d.type === 'omni' ? '240, 200, 96' : ELEMENT_COLORS[d.type];
      var em = d.type === 'omni' ? '✨' : ELEMENT_EMOJI[d.type];
      var isSel = selectedDieId === d.id;
      var isLocked = alreadyTarget || (!isSel && selectedDieId !== null);
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
function showCardConfirmation(cardId, adjustedCost, onConfirm) {
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
    html += '<div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="confirmCancelBtn">Cancelar</button>';
    if (side.dice.length > 0) html += '<button class="confirm-btn confirm-discard" id="confirmDiscardBtn" title="Descartar esta carta para cambiar un dado al tipo del activo">🗑️ Descartar</button>';
    html += '<button class="confirm-btn confirm-accept" id="confirmAcceptBtn"' + (!isComplete ? ' disabled' : '') + '>Jugar</button></div>';
    content.innerHTML = html;
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
        playSound('card'); renderCombat(); if (isOnlineHost()) scheduleBroadcast();
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
  var targetIdx = enemySide.activeIndex, target = enemySide.characters[targetIdx];
  var preview = {
    ability:ability, active:active, target:target, targetType:ability.target,
    piercing:false, baseDmg:0, buffDmg:0, cardBonus:0, redencionDmg:0, markBonus:0,
    equipDmg:0, supportDmg:0, optimizationDmg:0, erikBonus:0, obraMaestraDmg:0,
    flatReduction:0, rawDmg:0, totalDmg:0, trueDmg:0, shieldAbsorbed:0,
    heal:0, healApplied:0, shieldSelf:0, buff:0, selfDamage:0, reflectDmg:0, condenaGain:0,
    energyGain:ability.energy || 0, energyCost:ability.energyCost || 0,
    targetHpBefore:target.hp, targetHpAfter:target.hp,
    targetShieldBefore:totalShield(target), targetShieldAfter:totalShield(target),
    activeHpBefore:active.hp, activeHpAfter:active.hp,
    activeShieldBefore:totalShield(active), activeShieldAfter:totalShield(active),
    willKill:false, willDieFromSelf:false, notes:[]
  };
  preview.baseDmg = computeBaseDamageForAbility(active, ability, actionType);
  preview.selfDamage = predictSelfDamage(ability, active);
  preview.heal = predictHeal(ability, active);
  preview.healApplied = Math.min(preview.heal, active.maxHp - active.hp);
  preview.shieldSelf = predictShieldGain(ability);
  var applyGeneric = ['damage','trazoVivo','intervencion','aceleron','instinto'].indexOf(ability.kind) !== -1;
  if (ability.target === 'enemy' && preview.baseDmg > 0) {
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
    }
    if (actionType === 'ultimate' && side.obraMaestraTurns > 0) preview.obraMaestraDmg = preview.baseDmg;
    var coreDmg = preview.baseDmg;
    if (active.cardNextAttackDouble && applyGeneric) coreDmg *= 2;
    if (preview.obraMaestraDmg > 0) coreDmg += preview.obraMaestraDmg;
    var raw = coreDmg + preview.buffDmg + preview.cardBonus + preview.equipDmg + preview.supportDmg + preview.optimizationDmg + preview.erikBonus + preview.markBonus + preview.redencionDmg;
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
  if (active.id === 'alaya' && csHasState(active, 'castigada')) {
    var hits = 0;
    if (ability.kind === 'autolesion') hits += 1;
    if (preview.reflectDmg > 0) hits += 1;
    if (hits > 0) preview.condenaGain = hits;
  }
  if (preview.condenaGain > 0) preview.notes.push('💀 +' + preview.condenaGain + ' condena');
  preview.reflectDmg = getReflectDamage(enemySide);
  var selfTot = preview.selfDamage + preview.reflectDmg;
  if (selfTot > 0) preview.activeHpAfter = Math.max(0, active.hp - selfTot);
  preview.willDieFromSelf = preview.activeHpAfter <= 0 && selfTot > 0;
  if (preview.shieldSelf > 0) preview.activeShieldAfter = preview.activeShieldBefore + preview.shieldSelf;
  if (ability.kind === 'interpretacion') preview.notes.push('🎨 Genera 3 cartas de pintura');
  if (ability.kind === 'optimizacion') preview.notes.push('🏛️ Coloca estructura (2 rondas)');
  if (ability.kind === 'obraMaestra') { var hasOpt = side.structures && side.structures.some(function(st){ return st.kind === 'optimizacion'; }); if (hasOpt) preview.notes.push('💥 Definitivas x2 daño (2 rondas)'); else preview.notes.push('❌ Requiere estructura Optimización'); }
  if (ability.kind === 'penitencia') preview.notes.push('🩸 Entra en Castigada');
  if (ability.kind === 'bajoAlas') preview.notes.push('💔 Aliado con menos vida → Vulnerable');
  if (ability.kind === 'defensaActiva') preview.notes.push('💠 Estado Defensa Activa');
  if (ability.kind === 'conclusion') preview.notes.push('🛡️ Aliados +1 escudo y +1 energía');
  if (ability.kind === 'impulso') preview.notes.push('💪 +2 al siguiente ataque normal, pasa a reserva');
  if (ability.kind === 'ecoVital') preview.notes.push('🎵 Aliados +2 HP y Sintonía');
  if (ability.kind === 'deudaSangre') preview.notes.push('💢 Aplica 1 Rencor al enemigo');
  if (ability.kind === 'retribucionFinal') {
    var conRencor = enemySide.characters.filter(function(c){ return !c.dead && c.states && c.states.rencor > 0; });
    if (!conRencor.length) preview.notes.push('❌ Ningún enemigo tiene Rencor');
    else preview.notes.push('💢 Afecta a ' + conRencor.length + ' enemigo(s) con Rencor');
  }
  if (ability.kind === 'decadencia' && active.manuelStacks >= 0) preview.notes.push('📈 Acumula +1 daño y -1 coste a Degradación');
  if (ability.kind === 'lienzoSangre') {
    var pr = (side.hand||[]).filter(function(id){ return id === 'paint_roja'; }).length;
    var pa = (side.hand||[]).filter(function(id){ return id === 'paint_azul'; }).length;
    var pv = (side.hand||[]).filter(function(id){ return id === 'paint_verde'; }).length;
    if (pr + pa + pv === 0) preview.notes.push('❌ Sin pinturas en mano');
    else { if (pr) preview.notes.push('🔴 ' + pr + ' daño'); if (pa) preview.notes.push('🔵 Escudo +' + pa); if (pv) preview.notes.push('🟢 Cura ' + pv); }
  }
  if (ability.kind === 'finComienzo') {
    var condenaNow = active.states && active.states.condena ? active.states.condena : 0;
    if (condenaNow > 0) preview.notes.push('🔻 Consume ' + condenaNow + ' de condena');
    preview.willDieFromSelf = true;
    preview.notes.push('💀 Alaya morirá tras usar esta habilidad si el enemigo sigue en pie');
  }
  return preview;
}
function buildPreviewBodyHTML(preview) {
  var html = '<div class="confirm-body">';
  if (preview.rawDmg > 0 || preview.trueDmg > 0) {
    var hasB = preview.buffDmg || preview.cardBonus || preview.equipDmg || preview.supportDmg || preview.optimizationDmg || preview.erikBonus || preview.markBonus || preview.redencionDmg || preview.obraMaestraDmg;
    if (hasB) {
      html += '<div class="confirm-row"><span class="confirm-row-label">Daño base</span><span class="confirm-row-value damage">' + preview.baseDmg + '</span></div>';
      if (preview.buffDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Impulso</span><span class="confirm-row-value bonus">+' + preview.buffDmg + '</span></div>';
      if (preview.cardBonus) html += '<div class="confirm-row"><span class="confirm-row-label">+ Carta</span><span class="confirm-row-value bonus">+' + preview.cardBonus + '</span></div>';
      if (preview.equipDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Equipo</span><span class="confirm-row-value bonus">+' + preview.equipDmg + '</span></div>';
      if (preview.supportDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Apoyos</span><span class="confirm-row-value bonus">+' + preview.supportDmg + '</span></div>';
      if (preview.optimizationDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Optimización</span><span class="confirm-row-value bonus">+' + preview.optimizationDmg + '</span></div>';
      if (preview.obraMaestraDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Obra Maestra</span><span class="confirm-row-value bonus">+' + preview.obraMaestraDmg + '</span></div>';
      if (preview.erikBonus) html += '<div class="confirm-row"><span class="confirm-row-label">+ Inspiración</span><span class="confirm-row-value bonus">+' + preview.erikBonus + '</span></div>';
      if (preview.redencionDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Redención</span><span class="confirm-row-value bonus">+' + preview.redencionDmg + '</span></div>';
      if (preview.markBonus) html += '<div class="confirm-row"><span class="confirm-row-label">+ Marca</span><span class="confirm-row-value bonus">+' + preview.markBonus + '</span></div>';
    }
    if (preview.flatReduction) html += '<div class="confirm-row"><span class="confirm-row-label">− Reducción</span><span class="confirm-row-value shield">−' + preview.flatReduction + '</span></div>';
    if (!preview.piercing && preview.shieldAbsorbed > 0) html += '<div class="confirm-row"><span class="confirm-row-label">− Escudo absorbe</span><span class="confirm-row-value shield">−' + preview.shieldAbsorbed + '</span></div>';
    html += '<div class="confirm-row"><span class="confirm-row-label">Daño verdadero</span><span class="confirm-row-value true-dmg">' + preview.trueDmg + '</span></div>';
  }
  if (preview.healApplied) html += '<div class="confirm-row"><span class="confirm-row-label">Curación</span><span class="confirm-row-value heal">+' + preview.healApplied + ' HP</span></div>';
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
  if (isTurnDone()) return;
  if (isOnlineGuest()) {
    if (!isMyTurn()) return;
    var sideO = getTurnSide();
    var activeO = sideO.characters[sideO.activeIndex];
    if (!activeO || activeO.dead) return;
    var abilityO = activeO.character.abilities[actionType];
    if (!abilityO) return;
    if (abilityO.kind === 'obraMaestra') { var hasOpt = sideO.structures && sideO.structures.some(function(st){ return st.kind === 'optimizacion'; }); if (!hasOpt) { playSound('error'); return; } }
    if (abilityO.energyCost && activeO.energy < abilityO.energyCost && !activeO.cardNextAbilityFree) { playSound('error'); return; }
    var effCostO = getEffectiveCostFull(activeO, abilityO);
    if (sumCost(effCostO) > 0 && !trySpendDice(sideO.dice, effCostO).ok) { playSound('error'); return; }
    netSend({ type:'action', action:{ kind:'execute', actionType:actionType } });
    return;
  }
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
  if (isTurnDone()) return;
  if (isOnlineGuest()) {
    var tkO = getTurnKey();
    var sideO2 = combatState[tkO];
    if (sideO2.activeIndex === targetIndex || sideO2.characters[targetIndex].dead) return;
    var rulesO = getChangeRulesForTarget(tkO, targetIndex);
    if (rulesO.diceCost > 0 && !trySpendDice(sideO2.dice, { any: rulesO.diceCost }).ok) { playSound('error'); return; }
    netSend({ type:'action', action:{ kind:'change', targetIndex:targetIndex } });
    return;
  }
  var turnKey = getTurnKey();
  var side = combatState[turnKey];
  if (side.activeIndex === targetIndex) return;
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
    if (side.characters[targetIndex].id === 'jose') csSetState(side.characters[targetIndex], 'acelerado', true);
    var sfx = rules.quick ? ' (acción rápida)' : (rules.discounted ? ' (gratis)' : '');
    var label = combatState.pvp || combatState.online ? (turnKey === 'player' ? 'J1' : 'J2') : 'Tú';
    logCombat('🔄 ' + label + ': ' + oldN + ' → ' + newN + sfx);
    playSound('change'); renderCombat(); if (isOnlineHost()) scheduleBroadcast();
    if (!rules.quick) setTimeout(nextTurn, 400);
  });
}

function renderDice() {
  var c = document.getElementById('combatDice'); if (!c) return;
  var side = isOnline() ? getMySide() : getActiveSide();
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
  var c = document.getElementById('combatHand'); if (!c || !combatState) return;
  var side = isOnline() ? getMySide() : getActiveSide();
  if (!side) return;
  var hc = document.getElementById('handCount'); if (hc) hc.textContent = side.hand.length;
  if (!side.hand.length) { c.innerHTML = '<div class="combat-hand-empty">Sin cartas en mano</div>'; return; }
  var canAct = isOnline() ? isMyTurn() : (!isTurnDone() && combatState.phase === 'playing');
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
  var actualWho = sideKeyForUI(who);
  if (actualWho === getTurnKey()) hideTooltip();
  var containerId = who === 'player' ? 'playerTeam' : 'botTeam';
  var c = document.getElementById(containerId); if (!c) return;
  var side = combatState[actualWho];
  var isPlayerSide = who === 'player';
  var isHumanSide = isOnline() ? (actualWho === myStateKey()) : (actualWho === 'player');
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
    }
    if (cs.manuelStacks > 0) badges.push('<span class="ccc-badge" data-status="manuelStacks" data-value="' + cs.manuelStacks + '" style="--bc: 200,150,60;">📈 +' + cs.manuelStacks + '</span>');
    if (side.obraMaestraTurns > 0 && isActive) badges.push('<span class="ccc-badge" data-status="obraMaestra" data-value="' + side.obraMaestraTurns + '" style="--bc: 240,200,96;">💥 Obra Maestra (' + side.obraMaestraTurns + ')</span>');
    if (cs.marks) Object.keys(cs.marks).forEach(function(el){ var em = ELEMENT_EMOJI[el] || '🏷️'; var cl = ELEMENT_COLORS[el] || '240,200,96'; badges.push('<span class="ccc-badge mark" data-status="marca" style="--bc: ' + cl + ';">' + em + ' Marca</span>'); });
    if (badges.length) html += '<div class="ccc-badges">' + badges.join('') + '</div>';
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
  var actualWho = sideKeyForUI(uiWho);
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
    for (var si = 0; si < 4; si++) { var st = structs[si]; if (st) sHtml += '<div class="side-slot-filled" data-struct-slot="' + si + '" style="--dc: 130,220,140;">🧠<span class="side-slot-duration">' + st.duration + '</span></div>'; else sHtml += '<div class="side-slot-empty">+</div>'; }
    sg.innerHTML = sHtml;
    sg.querySelectorAll('.side-slot-filled').forEach(function(el){ el.addEventListener('mouseenter', function(){ var i = parseInt(el.dataset.structSlot, 10); if (structs[i]) showStructureTooltip(el, structs[i]); }); el.addEventListener('mouseleave', hideTooltip); });
  }
}
function renderConsonanceCombat() {
  var el = document.getElementById('consonanceCardCombat'); if (!el || !combatState) return;
  var side = isOnline() ? getMySide() : getActiveSide();
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
  else if (isOnline()) {
    if (isMyTurn()) { t.textContent = 'TU TURNO'; t.className = 'combat-turn-ind player'; }
    else { t.textContent = 'RIVAL'; t.className = 'combat-turn-ind bot'; }
  }
  else if (combatState.turn === 'player') { t.textContent = combatState.pvp ? 'JUGADOR 1' : 'TU TURNO'; t.className = 'combat-turn-ind player'; }
  else { t.textContent = combatState.pvp ? 'JUGADOR 2' : 'RIVAL'; t.className = 'combat-turn-ind bot'; }
}
function updateCombatActions() {
  if (!combatState) return;
  var isTurn = isOnline() ? isMyTurn() : (!isTurnDone() && combatState.phase === 'playing');
  var side = isOnline() ? getMySide() : getActiveSide();
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
}
function renderCombatLog(){ var el = document.getElementById('combatLog'); if (!el) return; el.innerHTML = combatState.log.map(function(l){ return '<div class="log-line">' + l + '</div>'; }).join(''); el.scrollTop = el.scrollHeight; }
function renderCombat() {
  if (!combatState) return;
  var r = document.getElementById('combatRound'); if (r) r.textContent = combatState.round;
  updateTurnIndicator(); renderConsonanceCombat();
  renderTeamCards('player'); renderTeamCards('bot');
  renderSupports('player'); renderSupports('bot');
  renderDice(); renderHand(); updateCombatActions(); renderCombatLog();
  if (isOnlineHost()) scheduleBroadcast();
}

[{ btnId:'normalBtn', type:'normal' }, { btnId:'elementalBtn', type:'elemental' }, { btnId:'ultimateBtn', type:'ultimate' }].forEach(function(item){ var b = document.getElementById(item.btnId); if (!b) return; b.addEventListener('mouseenter', function(){ showAbilityTooltip(b, item.type); }); b.addEventListener('mouseleave', hideTooltip); });
['playerTeam','botTeam'].forEach(function(teamId){
  var el = document.getElementById(teamId);
  if (!el) return;
  el.addEventListener('mouseover', function(e){ var card = e.target.closest('.combat-char-card'); if (!card || card.classList.contains('dead')) return; if (e.relatedTarget && card.contains(e.relatedTarget)) return; if (!combatState || combatState.phase === 'ended') return; if (e.target.closest('.ccc-badge')) return; var sideKey = card.dataset.team; var idx = parseInt(card.dataset.index, 10); if (idx === combatState[sideKey].activeIndex) return; showCharTooltip(card, combatState[sideKey].characters[idx]); });
  el.addEventListener('mouseout', function(e){ var card = e.target.closest('.combat-char-card'); if (!card) return; if (e.relatedTarget && card.contains(e.relatedTarget)) return; if (e.target.closest('.ccc-badge')) return; hideTooltip(); });
});
var openCombatBtn = document.getElementById('openCombatBtn'); if (openCombatBtn) openCombatBtn.addEventListener('click', function(){ openCombat(); });
var openPvpBtn = document.getElementById('openPvpBtn'); if (openPvpBtn) openPvpBtn.addEventListener('click', function(){ openCombat('pvp'); });
var openOnlineBtn = document.getElementById('openOnlineBtn'); if (openOnlineBtn) openOnlineBtn.addEventListener('click', showOnlineLobbyDialog);
var jugarCombatBtn = document.getElementById('jugarCombatBtn'); if (jugarCombatBtn) jugarCombatBtn.addEventListener('click', function(){ openCombat(); });
var jugarPvpBtn = document.getElementById('jugarPvpBtn'); if (jugarPvpBtn) jugarPvpBtn.addEventListener('click', function(){ openCombat('pvp'); });
var jugarOnlineBtn = document.getElementById('jugarOnlineBtn'); if (jugarOnlineBtn) jugarOnlineBtn.addEventListener('click', showOnlineLobbyDialog);
var combatCloseBtn = document.getElementById('combatCloseBtn'); if (combatCloseBtn) combatCloseBtn.addEventListener('click', closeCombat);
var combatEndBtn = document.getElementById('combatEndBtn'); if (combatEndBtn) combatEndBtn.addEventListener('click', function(){ clearSavedCombat(); closeCombat(); });
var normalBtn = document.getElementById('normalBtn'); if (normalBtn) normalBtn.addEventListener('click', function(){ playerActionRequest('normal'); });
var elementalBtn = document.getElementById('elementalBtn'); if (elementalBtn) elementalBtn.addEventListener('click', function(){ playerActionRequest('elemental'); });
var ultimateBtn = document.getElementById('ultimateBtn'); if (ultimateBtn) ultimateBtn.addEventListener('click', function(){ playerActionRequest('ultimate'); });
var endRoundBtn = document.getElementById('endRoundBtn'); if (endRoundBtn) endRoundBtn.addEventListener('click', function(){
  if (isOnlineGuest()) { if (!isMyTurn()) return; netSend({ type:'action', action:{ kind:'endTurn' } }); return; }
  declareEnd(getTurnKey());
});
var rollRerollBtn = document.getElementById('rollRerollBtn'); if (rollRerollBtn) rollRerollBtn.addEventListener('click', rerollSelected);
var rollStartBtn = document.getElementById('rollStartBtn'); if (rollStartBtn) rollStartBtn.addEventListener('click', startCombatPhase);
var drawMulliganBtn = document.getElementById('drawMulliganBtn'); if (drawMulliganBtn) drawMulliganBtn.addEventListener('click', doMulligan);
var drawContinueBtn = document.getElementById('drawContinueBtn'); if (drawContinueBtn) drawContinueBtn.addEventListener('click', onDrawContinue);
var combatStartCancelBtn = document.getElementById('combatStartCancelBtn'); if (combatStartCancelBtn) combatStartCancelBtn.addEventListener('click', function(){ hideCombatStartConfirm(); playSound('deselect'); });
var combatStartConfirmBtn = document.getElementById('combatStartConfirmBtn'); if (combatStartConfirmBtn) combatStartConfirmBtn.addEventListener('click', function(){ hideCombatStartConfirm(); playSound('confirm'); actuallyStartCombat(); });
var slotCancelBtn = document.getElementById('slotCancelBtn'); if (slotCancelBtn) slotCancelBtn.addEventListener('click', function(){ hideSlotSelectionDialog(); playSound('deselect'); });
var slotNewCombatBtn = document.getElementById('slotNewCombatBtn'); if (slotNewCombatBtn) slotNewCombatBtn.addEventListener('click', function(){ hideSlotSelectionDialog(); prepareNewCombat(null); });
var overwriteCancelBtn = document.getElementById('overwriteCancelBtn'); if (overwriteCancelBtn) overwriteCancelBtn.addEventListener('click', function(){ hideOverwriteDialog(); playSound('deselect'); });
var onlineLobbyCloseBtn = document.getElementById('onlineLobbyCloseBtn'); if (onlineLobbyCloseBtn) onlineLobbyCloseBtn.addEventListener('click', hideOnlineLobbyDialog);
document.querySelectorAll('.online-lobby-tab').forEach(function(tab){
  tab.addEventListener('click', function(){
    document.querySelectorAll('.online-lobby-tab').forEach(function(t){ t.classList.remove('active'); });
    tab.classList.add('active');
    var t = tab.dataset.tab;
    var cp = document.getElementById('onlineCreatePanel'), jp = document.getElementById('onlineJoinPanel');
    if (cp) cp.style.display = (t === 'create') ? '' : 'none';
    if (jp) jp.style.display = (t === 'join') ? '' : 'none';
  });
});
var onlineCreateBtn = document.getElementById('onlineCreateBtn'); if (onlineCreateBtn) onlineCreateBtn.addEventListener('click', initOnlineHost);
var onlineJoinBtn = document.getElementById('onlineJoinBtn'); if (onlineJoinBtn) onlineJoinBtn.addEventListener('click', function(){ var code = document.getElementById('onlineJoinCode').value; initOnlineGuest(code); });
document.addEventListener('keydown', function(e){
  if (e.key !== 'Escape') return;
  var ow = document.getElementById('overwriteDialog'); if (ow && ow.classList.contains('show')) { hideOverwriteDialog(); return; }
  var sl = document.getElementById('slotSelectionDialog'); if (sl && sl.classList.contains('show')) { hideSlotSelectionDialog(); return; }
  var st = document.getElementById('combatStartConfirm'); if (st && st.classList.contains('show')) { hideCombatStartConfirm(); return; }
  var ol = document.getElementById('onlineLobbyDialog'); if (ol && ol.classList.contains('show')) { hideOnlineLobbyDialog(); return; }
  var cf = document.getElementById('confirmOverlay'); if (cf && cf.classList.contains('show')) { hideConfirmation(); return; }
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

var initFns = [
  ['renderPhilosophies', renderPhilosophies], ['renderConsonancias', renderConsonancias], ['renderCharFilter', renderCharFilter], ['renderResonances', renderResonances],
  ['renderDiceSimulator', renderDiceSimulator], ['applyFilters', applyFilters], ['addInfoButtons', addInfoButtons], ['setupCardClicks', setupCardClicks],
  ['renderTeamPanel', renderTeamPanel], ['renderCardFilter', renderCardFilter], ['renderDeckGrid', renderDeckGrid], ['setupDamageCalculator', setupDamageCalculator],
  ['renderTemplateSlots', renderTemplateSlots]
];
initFns.forEach(function(p){ try { p[1](); } catch (e) { console.error('Init error in ' + p[0] + ':', e); } });
if (team.length > 0) setTimeout(function(){ try { openTeamPanel(); } catch (e) {} }, 400);
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
