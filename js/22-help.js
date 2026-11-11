/* ═══════════════════════════════════════════════════════════════════
   AYUDA — Guía + Tutorial
   ═══════════════════════════════════════════════════════════════════ */

var HELP_ACTIVE_TAB = 'guide';
var TUTORIAL_STEPS = [];
var TUTORIAL_INDEX = 0;
var TUTORIAL_CHARS = {
  player: ['tenshi', 'maria', 'eloy'],
  rival:  ['eevee', 'nc', 'ren']
};

/* ═══ GLOSARIO (términos clicables) ═══ */
var GUIDE_GLOSSARY = {
  activo: { name: 'Activo', definition: 'Personaje del equipo que está en combate en ese momento. Solo él puede usar habilidades. Los otros dos están en reserva.' },
  reserva: { name: 'Reserva', definition: 'Los personajes del equipo que no están activos. Cambiar a uno de ellos cuesta dados (normalmente 1) y cede turno.' },
  turno: { name: 'Turno', definition: 'Momento en el que un jugador actúa dentro de una ronda. Los turnos se alternan entre ambos jugadores hasta que los dos declaran fin de ronda.' },
  ronda: { name: 'Ronda', definition: 'Ciclo completo de juego: fase de lanzamiento, fase de robo y fase de juego. Al final de la ronda se resuelven los efectos pasivos (estructuras, apoyos, entornos) y se pasa a la siguiente.' },
  mulligan: { name: 'Mulligan', definition: 'Acción única al empezar la partida: puedes descartar cartas de tu mano inicial y robar otras tantas. Solo se puede hacer una vez por partida, en la primera ronda.' },
  dado: { name: 'Dado', definition: 'Recurso que se obtiene al inicio de cada ronda. Cada dado pertenece a uno de los tipos de respuesta (🌸, 🛡️, 💡, etc.).' },
  omnidado: { name: 'Omnidado', definition: 'Dado especial (✨) que cuenta como cualquier tipo de respuesta al pagar costes. Aparece con baja probabilidad en cada tirada.' },
  coste: { name: 'Coste', definition: 'Cantidad de dados y/o energía que hay que gastar para usar una habilidad o jugar una carta.' },
  energia: { name: 'Energía', definition: 'Recurso (⚡) que se acumula al usar habilidades. Necesario para lanzar la Habilidad Definitiva. Persiste entre rondas hasta el máximo del personaje.' },
  consonancia: { name: 'Consonancia', definition: 'Bonus pasivo que se activa según la composición de elementos del equipo. Dos iguales activan un efecto menor; tres iguales activan el mayor; sin repetición activa Diverso.' },
  resonancia: { name: 'Resonancia', definition: 'Efecto que se dispara cuando un personaje recibe una segunda marca. Ambas marcas desaparecen y se aplica un efecto inmediato según la combinación.' },
  marca: { name: 'Marca', definition: 'Estado elemental que un personaje aplica a otro. Acumular una segunda marca dispara una Resonancia.' },
  estado: { name: 'Estado', definition: 'Ventaja o desventaja temporal que afecta al comportamiento de un personaje (Furia, Vulnerable, Castigada, etc.).' },
  estructura: { name: 'Estructura', definition: 'Objeto colocado en el campo por algunas habilidades. Dura varias rondas y tiene efectos pasivos por ronda. Máximo 4 por bando.' },
  apoyo: { name: 'Apoyo', definition: 'Carta que se coloca en el campo con duración limitada (1-4 rondas). Da bonos por ronda. Máximo 4 por bando.' },
  entorno: { name: 'Entorno', definition: 'Efecto global que afecta a ambos equipos. Solo puede haber uno activo a la vez en todo el combate.' },
  mazo: { name: 'Mazo', definition: 'Conjunto de 30 cartas con el que juegas. Al agotarse, el descarte se baraja y vuelve a formar el mazo.' },
  mano: { name: 'Mano', definition: 'Cartas robadas disponibles para jugar. Máximo 10 en mano.' },
  descarte: { name: 'Descarte', definition: 'Pila donde van las cartas usadas o descartadas. Cuando el mazo se agota, el descarte se baraja y forma el nuevo mazo.' },
  vida: { name: 'Vida', definition: 'Puntos de HP de un personaje. Cuando llega a 0, cae. El equipo pierde cuando caen sus 3 personajes.' },
  dano_base: { name: 'Daño base', definition: 'Valor propio de la habilidad según sus atributos, sin bufos ni nerfeos. Es el punto de partida.' },
  dano_normal: { name: 'Daño normal', definition: 'El daño estándar de cualquier ataque. Se reduce por escudos y reducciones normales.' },
  dano_final: { name: 'Daño final', definition: 'El resultado del golpe después de aplicar todos los modificadores (bufos, equipo, estados, etc.). No tiene por qué reflejarse íntegro en la vida del rival.' },
  dano_penetrante: { name: 'Daño penetrante', definition: 'Daño que atraviesa los escudos, pero se reduce por otras fuentes (como reducciones planas de daño).' },
  dano_verdadero: { name: 'Daño verdadero', definition: 'Literalmente lo que baja la vida del rival tras absorber escudos y reducciones. Es el número que ves reflejado en su HP.' },
  escudo: { name: 'Escudo', definition: 'Barrera que absorbe daño antes de que llegue a la vida. Cada personaje puede tener hasta 3 escudos distintos simultáneos; si llega uno nuevo, se elimina el de menor vida.' },
  reduccion: { name: 'Reducción de daño', definition: 'Valor plano que se resta al daño final antes de aplicar escudos. Se acumula con reducciones de equipo, apoyos y estados.' },
  accion_rapida: { name: 'Acción rápida', definition: 'Acción que no cede turno. Puedes seguir actuando después de hacerla. Jugar cartas suele ser acción rápida.' },
  accion_combate: { name: 'Acción de combate', definition: 'Acción que cede turno (pasa el turno al rival). Usar habilidades suele ser acción de combate.' },
  siete_respuestas: { name: 'Siete Respuestas', definition: 'Las siete filosofías que clasifican a los personajes: Protección, Comprensión, Expresión, Transformación, Aceptación, Redención e Ilusión.' },
  usuarios: { name: 'Usuarios', definition: 'Categoría de personajes que representan a los jugadores reales.' },
  hnn: { name: 'HNN', definition: 'Categoría de personajes que engloba a las criaturas y entidades creadas en el lore.' },
  btc: { name: 'BTC', definition: 'Categoría de personajes que representan plataformas y servicios digitales.' },
  lusior: { name: 'Lusior', definition: 'Categoría reservada para futuras incorporaciones.' },
  azaria: { name: 'Azaria', definition: 'Categoría reservada de personajes especiales.' },
  ataque_normal: { name: 'Ataque normal', definition: 'Habilidad básica de un personaje. Suele tener el coste más bajo y otorgar energía al impactar.' },
  habilidad_elemental: { name: 'Habilidad elemental', definition: 'Habilidad intermedia de un personaje. Más potente que el ataque normal, con efectos variados según el kit.' },
  habilidad_definitiva: { name: 'Habilidad definitiva', definition: 'La habilidad más potente del kit. Requiere energía acumulada además de dados. Suele cambiar el rumbo del combate.' },
  pasiva: { name: 'Pasiva', definition: 'Habilidad permanente que se activa automáticamente al cumplirse su condición, sin coste de dados.' },
  ex: { name: 'EX', definition: 'Habilidad extra de cada personaje. Se elige al empezar el combate y aporta un efecto adicional pasivo. Todos los personajes tienen una EX.' },
  pvp_local: { name: 'PvP Local', definition: 'Modo de juego en el que dos personas comparten un mismo dispositivo para enfrentarse.' },
  sandbox: { name: 'Sandbox', definition: 'Modo de pruebas para experimentar libremente con el estado del combate: editar vidas, dados, cartas, estados, etc.' }
};

/* ═══ GUÍA ═══ */
var GUIDE_SECTIONS = [
  {
    id: 'intro',
    title: '1. Introducción',
    html: `
      <p><strong>Azaria TCG</strong> es un juego de cartas coleccionables y combate táctico por equipos. Enfrentas equipos de 3 personajes en un combate por turnos donde el objetivo es eliminar a los 3 personajes rivales.</p>
      <p>Cada personaje pertenece a una de las **Siete Respuestas** (filosofías), que definen su estilo de combate. Cada partida se construye con un equipo de 3 personajes y un **mazo** de 30 cartas.</p>
      <h3>¿Cómo se gana?</h3>
      <p>Reduciendo a 0 la **vida** de los 3 personajes del equipo rival. Si tu equipo cae primero, pierdes.</p>
    `
  },
  {
    id: 'respuestas',
    title: '2. Las Siete Respuestas',
    html: `
      <p>Cada personaje se clasifica por cómo responde al sufrimiento. Hay 7 respuestas, cada una con un elemento:</p>
      <ul>
        <li><strong>🛡️ Protección</strong> — Reducir el daño (escudos, defensa).</li>
        <li><strong>💡 Comprensión</strong> — Entenderlo (energía, control).</li>
        <li><strong>🌸 Expresión</strong> — Crear y jugar con las **cartas**.</li>
        <li><strong>🔥 Transformación</strong> — Adaptarse (cambio rápido, velocidad).</li>
        <li><strong>🌿 Aceptación</strong> — Asimilarlo (curación, aguante).</li>
        <li><strong>🩸 Redención</strong> — Actuar (daño, sacrificio).</li>
        <li><strong>🎭 Ilusión</strong> — Cuestionar la realidad (control, confusión).</li>
      </ul>
      <p>Cada personaje tiene su propio kit de habilidades: **ataque normal**, **habilidad elemental**, **habilidad definitiva**, **pasiva** y **EX**. Todos los personajes tienen EX.</p>
    `
  },
  {
    id: 'consonancias',
    title: '3. Consonancias de equipo',
    html: `
      <p>Según cuántos personajes de tu equipo comparten la misma respuesta, obtienes ventajas pasivas:</p>
      <ul>
        <li><strong>2 iguales</strong> — Activas un efecto menor.</li>
        <li><strong>3 iguales</strong> — El efecto mayor sustituye al menor.</li>
        <li><strong>Sin repetición</strong> — Activas <strong>Diverso</strong>: obtienes 2 omnidados al inicio de cada ronda.</li>
      </ul>
      <p>Puedes consultar todas las consonancias en el menú principal.</p>
    `
  },
  {
    id: 'resonancias',
    title: '4. Resonancias (marcas)',
    html: `
      <p>Las **marcas** son estados elementales que los personajes aplican a otros. Cuando un personaje recibe una segunda marca, se desencadena una **Resonancia**: ambas marcas desaparecen y se aplica un efecto inmediato según la combinación.</p>
      <p>Hay 28 resonancias (7 elementos × 4 combinaciones posibles). Cada combinación produce un efecto distinto: daño bonus, curación, robo de cartas, energía, escudos, etc.</p>
      <p>Puedes consultar todas las resonancias en el menú principal.</p>
    `
  },
  {
    id: 'dados',
    title: '5. Dados y energía',
    html: `
      <h3>Dados</h3>
      <p>Al principio de cada ronda lanzas 8 **dados**. Cada dado pertenece a uno de los tipos de respuesta (🌸 Expresión, 🛡️ Protección, 💡 Comprensión, etc.) o es un **omnidado** (comodín). Puedes relanzar los dados una vez por ronda (eliges cuáles).</p>
      <p>Cada habilidad tiene un **coste** de dados: dados del tipo de su respuesta + dados "cualesquiera" (de cualquier tipo).</p>
      <h3>Energía</h3>
      <p>Los personajes ganan **energía** al usar habilidades (normalmente +1 por uso). La energía es necesaria para lanzar la **habilidad definitiva**, que suele requerir 2-4 puntos.</p>
      <p>La energía no se pierde entre rondas: se acumula hasta el máximo del personaje.</p>
    `
  },
  {
    id: 'tipos-dano',
    title: '6. Tipos de daño',
    html: `
      <p>Hay 5 tipos de <strong>daño</strong>, y un mismo golpe puede combinar varios al mismo tiempo:</p>
      <ul>
        <li><strong>Daño base</strong> — El valor propio de la habilidad, sin bufos ni nerfeos. Es el punto de partida antes de aplicar modificadores.</li>
        <li><strong>Daño normal</strong> — El daño estándar de cualquier ataque. Se reduce por escudos y reducciones normales.</li>
        <li><strong>Daño final</strong> — El resultado del golpe tras aplicar todos los modificadores (bufos, equipo, estados, etc.). No tiene por qué verse reflejado íntegro en la vida del rival.</li>
        <li><strong>Daño penetrante</strong> — Atraviesa escudos, pero se reduce por otras fuentes (como reducciones planas).</li>
        <li><strong>Daño verdadero</strong> — Es literalmente lo que baja la vida del rival.</li>
      </ul>
      <p>El flujo típico de un golpe es: se calcula el daño base, se aplican modificadores para obtener el daño final, y se determina cuánto llega realmente a la vida (daño verdadero) tras absorber escudos y reducciones.</p>
    `
  },
  {
    id: 'estados',
    title: '7. Estados y marcas',
    html: `
      <p>Los personajes pueden tener **estados** (ventajas o desventajas temporales) y **marcas** (elementos aplicados por otros).</p>
      <h3>Estados comunes</h3>
      <ul>
        <li><strong>Castigada</strong> — Toda curación recibida se convierte en daño verdadero.</li>
        <li><strong>Vulnerable</strong> — La próxima vez que reciba daño verdadero, se reduce en 1 y el atacante pasa a Amenaza.</li>
        <li><strong>Amenaza</strong> — Si ataca a un Vulnerable, se marca a sí mismo con Protección.</li>
        <li><strong>Furia</strong> — +1 al daño de los ataques normales contra el enemigo que la activó.</li>
        <li><strong>Sintonía</strong> — La próxima curación se propaga a los aliados en Sintonía.</li>
        <li><strong>Acelerado</strong> — El siguiente ataque normal es acelerado (+daño, +marca).</li>
      </ul>
      <p>Puedes ver la descripción completa de cada estado pasando el ratón por encima de su badge en combate.</p>
    `
  },
  {
    id: 'cartas',
    title: '8. Cartas del mazo',
    html: `
      <p>Tu **mazo** tiene 30 cartas (máx. 2 copias de cada una). Hay tres categorías principales:</p>
      <ul>
        <li><strong>⚔️ Equipo</strong> — Se equipan a un personaje. Aportan bonos permanentes (daño, escudos, reducciones, curación por ronda...).</li>
        <li><strong>📜 Apoyo</strong> — Se colocan en el campo. Tienen duración limitada (1-4 rondas) y dan bonos por ronda (curación, escudo, energía, robo de cartas...).</li>
        <li><strong>✨ Evento</strong> — Efectos inmediatos: buffs de ataque, curaciones, escudos, robo de dados, cambios rápidos, revivir...</li>
      </ul>
      <p>Algunos personajes tienen habilidades que generan sus propias <strong>cartas</strong> durante el combate. Estas cartas solo existen mientras dura la partida y no forman parte del mazo.</p>
    `
  },
  {
    id: 'mazo',
    title: '9. Construir el mazo',
    html: `
      <p>En la sección <strong>Mazo</strong> del menú puedes construir tu **mazo** de 30 cartas. Hay 3 formas:</p>
      <ul>
        <li><strong>Manual</strong> — Haz clic en las cartas del catálogo para añadir/eliminar.</li>
        <li><strong>Autogenerar</strong> — Un mazo equilibrado al azar (14 eventos, 10 equipos, 6 apoyos + relleno).</li>
        <li><strong>Plantillas</strong> — Guarda combinaciones de equipo+mazo. Hasta 12 plantillas con nombre.</li>
      </ul>
      <p>Puedes filtrar el catálogo por categoría y etiqueta.</p>
    `
  },
  {
    id: 'combate',
    title: '10. El combate paso a paso',
    html: `
      <h3>Fase de lanzamiento</h3>
      <p>Al inicio de cada ronda lanzas 8 **dados**. Puedes relanzar los que quieras (una vez por ronda).</p>
      <h3>Fase de robo</h3>
      <p>Robas 5 cartas la primera ronda (con opción de **mulligan**), y 2 cartas las siguientes. Puedes tener hasta 10 cartas en **mano**.</p>
      <h3>Fase de juego</h3>
      <p>Se alternan los **turnos**. En tu turno puedes:</p>
      <ul>
        <li>Usar habilidades del **activo**: ataque normal, elemental o definitiva. Suelen ser **acciones de combate** (ceden turno).</li>
        <li>Jugar cartas (eventos, equipos, apoyos). Suelen ser **acciones rápidas** (no ceden turno).</li>
        <li>Cambiar de personaje (normalmente cuesta 1 dado y cede turno).</li>
        <li>Declarar el fin de ronda.</li>
      </ul>
      <h3>Fin de ronda</h3>
      <p>Cuando ambos jugadores declaran fin, se resuelven los efectos de fin de ronda (estructuras, apoyos, entornos, pasivas), se descarta y se pasa a la siguiente **ronda**. El que declaró fin primero empieza la siguiente ronda.</p>
    `
  },
  {
    id: 'estructuras',
    title: '11. Estructuras, apoyos y entornos',
    html: `
      <h3>Estructuras</h3>
      <p>Algunas habilidades colocan **estructuras** en el campo (hasta 4 simultáneas por bando). Suelen durar 2-3 rondas y tienen efectos por ronda (daño, curación, escudos, cambios de personaje...).</p>
      <h3>Apoyos</h3>
      <p>Las cartas de **apoyo** ocupan slots (hasta 4 por bando). Dan bonos por ronda mientras duren.</p>
      <h3>Entornos</h3>
      <p>Solo hay un **entorno** activo a la vez en todo el combate. Algunos personajes pueden establecerlo. Afecta a ambos equipos según su descripción.</p>
    `
  },
  {
    id: 'tienda',
    title: '12. La tienda',
    html: `
      <p>La <strong>Tienda</strong> está accesible desde el nav. Aquí puedes comprar personajes y cartas con <strong>💎 dinero del juego</strong>.</p>
      <ul>
        <li>Los artículos bloqueados aparecen a color con su precio.</li>
        <li>Los que ya tienes aparecen al final, en gris.</li>
        <li>Algunas categorías (skins, marcos, dorsos, temas) están reservadas para futuras actualizaciones.</li>
      </ul>
      <h3>Códigos</h3>
      <p>Hay un botón 🔑 en la tienda para canjear códigos. Cada código se canjea una sola vez por save.</p>
    `
  },
  {
    id: 'glosario',
    title: '13. Glosario',
    html: `
      <p>A continuación tienes la lista completa de términos clave del juego. Además, cuando aparecen en el texto de la guía, están subrayados y puedes pulsarlos para ver su definición.</p>
      <h3>Combate</h3>
      <ul>
        <li><strong>Activo</strong> — Personaje en combate. Solo él puede usar habilidades.</li>
        <li><strong>Reserva</strong> — Los otros 2 personajes del equipo.</li>
        <li><strong>Turno</strong> — Momento en que un jugador actúa dentro de una ronda.</li>
        <li><strong>Ronda</strong> — Ciclo completo: lanzamiento + robo + juego.</li>
        <li><strong>Acción rápida</strong> — Acción que no cede turno (jugar cartas suele serlo).</li>
        <li><strong>Acción de combate</strong> — Acción que cede turno (usar habilidades suele serlo).</li>
        <li><strong>Mulligan</strong> — Cambio único de mano inicial al empezar la partida.</li>
      </ul>
      <h3>Recursos</h3>
      <ul>
        <li><strong>Dado</strong> — Recurso del tipo de una respuesta (🌸, 🛡️, 💡, etc.).</li>
        <li><strong>Omnidado</strong> — Comodín que sirve para cualquier tipo.</li>
        <li><strong>Coste</strong> — Dados y/o energía necesarios para una acción.</li>
        <li><strong>Energía</strong> — Recurso (⚡) para lanzar la definitiva.</li>
        <li><strong>Vida</strong> — Puntos de HP. Al llegar a 0, el personaje cae.</li>
      </ul>
      <h3>Daño</h3>
      <ul>
        <li><strong>Daño base</strong> — Valor propio de la habilidad sin modificadores.</li>
        <li><strong>Daño normal</strong> — Daño estándar de un ataque.</li>
        <li><strong>Daño final</strong> — Resultado tras aplicar todos los modificadores.</li>
        <li><strong>Daño penetrante</strong> — Atraviesa escudos.</li>
        <li><strong>Daño verdadero</strong> — Lo que baja la vida del rival.</li>
        <li><strong>Escudo</strong> — Barrera que absorbe daño antes de la vida.</li>
        <li><strong>Reducción de daño</strong> — Valor que se resta al daño final.</li>
      </ul>
      <h3>Estructuras y efectos</h3>
      <ul>
        <li><strong>Marca</strong> — Estado elemental. Una segunda marca dispara una resonancia.</li>
        <li><strong>Estado</strong> — Ventaja o desventaja temporal.</li>
        <li><strong>Estructura</strong> — Objeto colocado por habilidades con efecto por ronda.</li>
        <li><strong>Apoyo</strong> — Carta colocada en el campo con duración.</li>
        <li><strong>Entorno</strong> — Efecto global, uno por combate.</li>
        <li><strong>Consonancia</strong> — Bonus pasivo por composición del equipo.</li>
        <li><strong>Resonancia</strong> — Efecto al recibir una segunda marca.</li>
      </ul>
      <h3>Cartas</h3>
      <ul>
        <li><strong>Mazo</strong> — 30 cartas con las que juegas.</li>
        <li><strong>Mano</strong> — Cartas disponibles (máx. 10).</li>
        <li><strong>Descarte</strong> — Cartas usadas. Al agotarse el mazo, se baraja y vuelve.</li>
      </ul>
      <h3>Personajes</h3>
      <ul>
        <li><strong>Siete Respuestas</strong> — Las 7 filosofías de los personajes.</li>
        <li><strong>Ataque normal / elemental / definitiva</strong> — Las 3 habilidades activas del kit.</li>
        <li><strong>Pasiva / EX</strong> — Habilidades permanentes del kit. Todos los personajes tienen EX.</li>
        <li><strong>Usuarios / HNN / BTC / Lusior / Azaria</strong> — Categorías de personajes.</li>
      </ul>
    `
  }
];

/* ═══ Renderiza texto de la guía con términos clicables ═══ */
function renderGuideText(html) {
  if (!html) return '';
  return html.replace(/\*\*(.+?)\*\*/g, function(m, rawName) {
    var name = rawName.trim();
    var termKey = null;
    for (var key in GUIDE_GLOSSARY) {
      if (GUIDE_GLOSSARY[key].name.toLowerCase() === name.toLowerCase()) { termKey = key; break; }
    }
    if (!termKey) return '<strong>' + name + '</strong>';
    return '<span class="clickable-term" data-guide-term="' + termKey + '"><strong>' + name + '</strong></span>';
  });
}

/* ═══ AYUDA: render de la guía ═══ */
function renderGuide() {
  var toc = document.getElementById('helpGuideToc');
  var content = document.getElementById('helpGuideContent');
  if (!toc || !content) return;
  toc.innerHTML = '<div class="help-guide-toc-title">📑 Índice</div>' +
    GUIDE_SECTIONS.map(function(s){
      return '<a href="#guide-' + s.id + '" class="help-guide-toc-item" data-guide-anchor="' + s.id + '">' + s.title + '</a>';
    }).join('');
  content.innerHTML = GUIDE_SECTIONS.map(function(s){
    return '<section class="help-guide-section" id="guide-' + s.id + '"><h2>' + s.title + '</h2>' + renderGuideText(s.html) + '</section>';
  }).join('');

  // Click en índice → scroll
  toc.querySelectorAll('[data-guide-anchor]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      var target = document.getElementById('guide-' + a.dataset.guideAnchor);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        toc.querySelectorAll('.help-guide-toc-item').forEach(function(x){ x.classList.remove('active'); });
        a.classList.add('active');
      }
    });
  });

  // Click en término → popup
  content.querySelectorAll('.clickable-term[data-guide-term]').forEach(function(span){
    span.addEventListener('click', function(e){
      e.stopPropagation();
      var term = GUIDE_GLOSSARY[span.dataset.guideTerm];
      if (term && typeof showTermPopup === 'function') showTermPopup(span, term);
    });
  });
}

/* ═══ TUTORIAL: 25 pasos ═══ */
TUTORIAL_STEPS = [
  { text: '¡Hola! Soy <strong>Gregorio</strong>, tu guía en Azaria TCG. Voy a enseñarte el combate siguiendo la <strong>Guía oficial</strong> del juego. ¿Empezamos?', highlight: null, action: null },
  { text: 'Este es el <strong>tablero</strong>. Arriba está tu rival, abajo tu equipo. Cada bando tiene <strong>3 personajes</strong> con vida y habilidades propias.', highlight: '#tutorialStage .tutorial-board', action: null },
  { text: 'Tu equipo son estos tres: <strong>Tenshi</strong> (🛡️ Protección), <strong>María</strong> (🌿 Aceptación) y <strong>Eloy</strong> (💡 Comprensión). Cada uno pertenece a una de las <strong>Siete Respuestas</strong> y tiene ataque normal, elemental, definitiva, pasiva y EX.', highlight: '#tutorialPlayerTeam', action: 'showPlayerTeam' },
  { text: 'El rival: <strong>Eevee</strong> (🛡️), <strong>NC</strong> (🛡️) y <strong>Ren</strong> (🎭). No los subestimes.', highlight: '#tutorialRivalTeam', action: null },
  { text: 'El personaje con el <strong>borde dorado</strong> es el <strong>activo</strong>. Solo él usa habilidades. Los otros dos están en <strong>reserva</strong>.', highlight: '.tutorial-char.active', action: null },
  { text: 'La <strong>composición</strong> del equipo importa. Tus 3 personajes son de tipos distintos → activas <strong>Diverso</strong>: <strong>+2 omnidados</strong> al inicio de cada ronda.', highlight: null, action: 'showConsonance' },
  { text: 'Cada ronda empiezas lanzando <strong>8 dados</strong>. Cada uno es de un elemento (🌸, 🛡️, 💡...) o un <strong>omnidado</strong> ✨ que sirve para cualquier coste.', highlight: '#tutorialDiceZone', action: 'rollDice' },
  { text: 'Puedes <strong>relanzar</strong> los dados que no te sirvan, <strong>una vez por ronda</strong>. Aprovecha para conseguir el tipo que necesitas.', highlight: '#tutorialDiceZone', action: null },
  { text: 'También robas <strong>cartas</strong>: 5 en la primera ronda, 2 las siguientes. Puedes tener hasta <strong>10</strong> en mano.', highlight: '#tutorialHandZone', action: 'drawCards' },
  { text: 'Cada habilidad cuesta <strong>dados</strong>. Por ejemplo, el ataque normal de Tenshi cuesta <strong>2 de 🛡️ + 1 cualquiera</strong>.', highlight: '#tutorialDiceZone', action: null },
  { text: 'Al usar habilidades ganas <strong>⚡ energía</strong>. Acumula suficiente para lanzar la <strong>Habilidad Definitiva</strong>, la más potente del kit.', highlight: '#tutorialEnergyZone', action: 'showEnergy' },
  { text: 'Veamos un <strong>ataque normal</strong>. Tenshi ataca a Eevee con Intervención. Se gastan dados y se hace daño.', highlight: '#tutorialRivalTeam', action: 'playerAttack' },
  { text: 'Hay <strong>5 tipos de daño</strong>: base, normal, final, <strong>penetrante</strong> (ignora escudos) y <strong>verdadero</strong> (lo que baja la vida del rival).', highlight: null, action: null },
  { text: 'El <strong>escudo</strong> absorbe daño antes de la vida. Máximo <strong>3 escudos distintos</strong> por personaje. Si llega uno nuevo, se elimina el de menor vida.', highlight: '#tutorialRivalTeam .tutorial-char:first-child', action: 'showShield' },
  { text: 'Las habilidades aplican <strong>marcas</strong>. Tenshi marca a Eevee con 🛡️ Protección. Las marcas son la base de las resonancias.', highlight: '#tutorialRivalTeam .tutorial-char:first-child', action: 'showMark' },
  { text: 'Si ese personaje recibe <strong>otra marca distinta</strong>, se desencadena una <strong>Resonancia</strong>: las dos marcas desaparecen y ocurre un efecto especial. Aquí lo verás.', highlight: '#tutorialRivalTeam .tutorial-char:first-child', action: 'showResonance' },
  { text: 'Los <strong>estados</strong> son ventajas o desventajas temporales: <em>Vulnerable</em>, <em>Amenaza</em>, <em>Furia</em>, <em>Castigada</em>... Pasa el ratón por su badge en combate real para ver la descripción.', highlight: null, action: 'showStateDemo' },
  { text: 'Para cambiar de <strong>personaje activo</strong>, haz clic en otro de tu equipo. Cuesta <strong>1 dado</strong> y cede turno (salvo acciones rápidas).', highlight: '#tutorialPlayerTeam .tutorial-char:nth-child(2)', action: 'showChange' },
  { text: 'El <strong>registro</strong> muestra todo lo que pasa. Úsalo para revisar el orden si te pierdes.', highlight: '#tutorialLogZone', action: 'showLog' },
  { text: 'Puedes jugar <strong>cartas de equipo, apoyo o evento</strong>. Equipo se equipa, apoyo se coloca con duración, evento aplica su efecto al instante.', highlight: '#tutorialHandZone', action: 'showSupport' },
  { text: 'Algunas habilidades colocan <strong>estructuras</strong> (máx. 4 por bando) o cambian el <strong>entorno</strong> (solo uno a la vez en todo el combate).', highlight: null, action: 'showStructure' },
  { text: 'Cuando hayas hecho todo, pulsa <strong>Fin de Ronda</strong>. Ambos declaran fin, se resuelven efectos pasivos y empieza la siguiente.', highlight: null, action: 'showEndRound' },
  { text: 'El jugador que <strong>declaró fin primero</strong> empieza la siguiente ronda. Después se alterna.', highlight: null, action: null },
  { text: 'El combate acaba cuando <strong>un equipo pierde a sus 3 personajes</strong>. Coordina dados, energía, cartas y estados.', highlight: null, action: null },
  { text: '¡Eso es todo! Puedes leer la <strong>Guía completa</strong> o consultar el botón <strong>💡 ¿Qué hago?</strong> durante el combate si te pierdes. ¡Buena suerte! 🎉', highlight: null, action: 'endTutorial' }
];

/* ═══ TUTORIAL: estado inicial de la escena ═══ */
function resetTutorialScene() {
  var rivalTeam = document.getElementById('tutorialRivalTeam');
  var playerTeam = document.getElementById('tutorialPlayerTeam');
  var dice = document.getElementById('tutorialDice');
  var energy = document.getElementById('tutorialEnergy');
  var hand = document.getElementById('tutorialHand');
  var log = document.getElementById('tutorialLog');
  if (!rivalTeam || !playerTeam) return;

  rivalTeam.innerHTML = [
    makeTutorialChar('eevee', 'Eevee', 'proteccion', '🦊', 9, 9, 0, true),
    makeTutorialChar('nc',    'NC',    'proteccion', '🎯', 12, 12, 1, false),
    makeTutorialChar('ren',   'Ren',   'ilusion',    '🌀', 9, 9, 0, false)
  ].join('');

  playerTeam.innerHTML = [
    makeTutorialChar('tenshi', 'Tenshi', 'proteccion',  '⚔️', 11, 11, 2, true),
    makeTutorialChar('maria',  'María',  'aceptacion',  '🌺', 8, 8, 0, false),
    makeTutorialChar('eloy',   'Eloy',   'comprension', '📖', 12, 12, 1, false)
  ].join('');

  dice.innerHTML = ''; energy.innerHTML = ''; hand.innerHTML = ''; log.innerHTML = '';
  TUTORIAL_INDEX = 0;
  renderTutorialStep();
}

function makeTutorialChar(id, name, element, emoji, hp, maxHp, energy, active) {
  var col = ELEMENT_COLORS[element] || '140,180,230';
  return '<div class="tutorial-char' + (active ? ' active' : '') + '" style="--el: ' + col + ';">' +
    '<div class="tutorial-char-top">' +
      '<span class="tutorial-char-el">' + emoji + '</span>' +
      '<span class="tutorial-char-hp">' + hp + '/' + maxHp + '</span>' +
    '</div>' +
    '<div class="tutorial-char-portrait"><img src="img/' + id + '.png" alt="' + name + '" onerror="this.style.display=\'none\';"></div>' +
    '<div class="tutorial-char-name">' + name + '</div>' +
    '<div class="tutorial-char-energy">⚡ ' + energy + '</div>' +
    '<div class="tutorial-char-bar"><div class="tutorial-char-bar-fill" style="width:' + (hp/maxHp*100) + '%"></div></div>' +
  '</div>';
}

/* ═══ TUTORIAL: render de un paso ═══ */
function renderTutorialStep() {
  var bubble = document.getElementById('tutorialBubble');
  var text = document.getElementById('tutorialText');
  var prog = document.getElementById('tutorialProgress');
  var nextBtn = document.getElementById('tutorialNextBtn');
  if (!bubble || !text) return;

  // Limpiar highlights previos
  document.querySelectorAll('.tutorial-highlight').forEach(function(el){ el.classList.remove('tutorial-highlight'); });

  var step = TUTORIAL_STEPS[TUTORIAL_INDEX];
  if (!step) { closeHelpModal(); return; }

  text.innerHTML = step.text;
  if (prog) prog.textContent = (TUTORIAL_INDEX + 1) + ' / ' + TUTORIAL_STEPS.length;
  if (nextBtn) nextBtn.textContent = TUTORIAL_INDEX === TUTORIAL_STEPS.length - 1 ? '✓ Terminar' : 'Siguiente →';

  // Resaltar el elemento objetivo (con delay para que la animación de entrada se vea)
  if (step.highlight) {
    setTimeout(function(){
      var target = document.querySelector(step.highlight);
      if (target) target.classList.add('tutorial-highlight');
    }, 300);
  }

  // Ejecutar acción del paso
  if (step.action && typeof TUTORIAL_ACTIONS[step.action] === 'function') {
    setTimeout(function(){ TUTORIAL_ACTIONS[step.action](); }, 400);
  }

  bubble.classList.add('show');
}

/* ═══ TUTORIAL: acciones especiales ═══ */
var TUTORIAL_ACTIONS = {
  showPlayerTeam: function() {
    document.querySelectorAll('#tutorialPlayerTeam .tutorial-char').forEach(function(el, i){
      setTimeout(function(){ el.style.transform = 'scale(1.05)'; setTimeout(function(){ el.style.transform = ''; }, 250); }, i * 120);
    });
  },
  rollDice: function() {
    var dice = document.getElementById('tutorialDice'); if (!dice) return;
    var types = ['proteccion','proteccion','comprension','aceptacion','ilusion','omni','proteccion','comprension'];
    dice.innerHTML = '';
    types.forEach(function(t, i){
      setTimeout(function(){
        var isOmni = t === 'omni';
        var col = isOmni ? '240,200,96' : ELEMENT_COLORS[t];
        var em = isOmni ? '✨' : ELEMENT_EMOJI[t];
        var die = document.createElement('div');
        die.className = 'tutorial-die';
        die.style.setProperty('--dc', col);
        die.textContent = em;
        dice.appendChild(die);
      }, i * 80);
    });
  },
  drawCards: function() {
    var hand = document.getElementById('tutorialHand'); if (!hand) return;
    var cards = [
      { em:'🎯', name:'Golpe Certero', c:'200,45,60' },
      { em:'🛡️', name:'Aura Protectora', c:'140,180,230' },
      { em:'⚡', name:'Chispa Arcana', c:'240,200,96' }
    ];
    hand.innerHTML = '';
    cards.forEach(function(c, i){
      setTimeout(function(){
        var el = document.createElement('div');
        el.className = 'tutorial-card';
        el.style.setProperty('--dc', c.c);
        el.innerHTML = '<div class="tutorial-card-emoji">' + c.em + '</div><div class="tutorial-card-name">' + c.name + '</div>';
        hand.appendChild(el);
      }, i * 150);
    });
  },
  showEnergy: function() {
    var energy = document.getElementById('tutorialEnergy'); if (!energy) return;
    energy.innerHTML = '<div class="tutorial-energy-pill">⚡ 2 / 3</div>';
  },
  playerAttack: function() {
    var target = document.querySelector('#tutorialRivalTeam .tutorial-char:first-child');
    if (!target) return;
    var rect = target.getBoundingClientRect();
    var stageRect = document.getElementById('tutorialStage').getBoundingClientRect();
    var float = document.createElement('div');
    float.className = 'tutorial-float';
    float.textContent = '−3';
    float.style.left = (rect.left - stageRect.left + rect.width/2 - 20) + 'px';
    float.style.top = (rect.top - stageRect.top + 30) + 'px';
    document.getElementById('tutorialStage').appendChild(float);
    setTimeout(function(){ if (float.parentNode) float.remove(); }, 1300);
    setTimeout(function(){
      var hp = target.querySelector('.tutorial-char-hp');
      if (hp) hp.textContent = '6/9';
      var bar = target.querySelector('.tutorial-char-bar-fill');
      if (bar) bar.style.width = (6/9*100) + '%';
    }, 400);
  },
  showShield: function() {
    var target = document.querySelector('#tutorialRivalTeam .tutorial-char:first-child');
    if (target) {
      target.style.boxShadow = '0 0 0 2px rgba(122,200,255,0.9)';
      setTimeout(function(){ target.style.boxShadow = ''; }, 2000);
    }
  },
  showMark: function() {
    var target = document.querySelector('#tutorialRivalTeam .tutorial-char:first-child');
    if (!target) return;
    var mark = document.createElement('div');
    mark.dataset.tutMark = 'first';
    mark.style.cssText = 'position:absolute; bottom:4px; right:4px; font-size:0.9rem; filter:drop-shadow(0 0 6px #fff);';
    mark.textContent = '🛡️';
    target.appendChild(mark);
  },
  showResonance: function() {
    var target = document.querySelector('#tutorialRivalTeam .tutorial-char:first-child');
    if (!target) return;
    var old = target.querySelector('[data-tut-mark]');
    if (old) old.remove();
    var mark = document.createElement('div');
    mark.style.cssText = 'position:absolute; bottom:4px; right:4px; font-size:0.9rem; filter:drop-shadow(0 0 6px #fff);';
    mark.textContent = '🎭';
    target.appendChild(mark);
    setTimeout(function(){
      target.style.filter = 'brightness(2)';
      setTimeout(function(){ target.style.filter = ''; }, 350);
    }, 300);
    var log = document.getElementById('tutorialLog');
    if (log) {
      var div = document.createElement('div');
      div.className = 'tutorial-log-line';
      div.textContent = '✨ Resonancia: Protección + Ilusión';
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    }
  },
  showConsonance: function() {
    var log = document.getElementById('tutorialLog');
    if (log) {
      var line = document.createElement('div');
      line.className = 'tutorial-log-line';
      line.textContent = '🌈 Consonancia: Diverso (+2 omnidados)';
      log.appendChild(line);
      log.scrollTop = log.scrollHeight;
    }
  },
  showStateDemo: function() {
    var target = document.querySelector('#tutorialPlayerTeam .tutorial-char:first-child');
    if (!target) return;
    var badge = document.createElement('div');
    badge.style.cssText = 'position:absolute; bottom:38px; left:50%; transform:translateX(-50%); font-size:0.55rem; font-weight:800; padding:0.12rem 0.4rem; border-radius:6px; background:rgba(200,100,220,0.3); border:1px solid rgba(200,100,220,0.7); color:#e0a0ff; white-space:nowrap; z-index:10;';
    badge.textContent = '💔 Vulnerable';
    target.appendChild(badge);
    target.style.filter = 'brightness(1.5)';
    setTimeout(function(){ target.style.filter = ''; }, 400);
  },
  showChange: function() {
    var target = document.querySelector('#tutorialPlayerTeam .tutorial-char:nth-child(2)');
    if (target) {
      target.style.transform = 'scale(1.1)';
      target.style.boxShadow = '0 0 20px rgba(240,200,96,0.6)';
      setTimeout(function(){ target.style.transform = ''; target.style.boxShadow = ''; }, 1500);
    }
  },
  showLog: function() {
    var log = document.getElementById('tutorialLog');
    if (log) {
      var lines = [
        '🎲 Tenshi ataca a Eevee por 3',
        '🛡️ Tenshi marca a Eevee con Protección',
        '✨ Resonancia: Protección + Ilusión',
        '🎭 Eevee aplica Vulnerable a Tenshi'
      ];
      log.innerHTML = '';
      lines.forEach(function(l, i){
        setTimeout(function(){
          var div = document.createElement('div');
          div.className = 'tutorial-log-line';
          div.textContent = l;
          log.appendChild(div);
          log.scrollTop = log.scrollHeight;
        }, i * 200);
      });
    }
  },
  showSupport: function() {
    var hand = document.getElementById('tutorialHand');
    if (hand && !hand.querySelector('.tutorial-card')) {
      var el = document.createElement('div');
      el.className = 'tutorial-card';
      el.style.setProperty('--dc', '130,220,140');
      el.innerHTML = '<div class="tutorial-card-emoji">⛩️</div><div class="tutorial-card-name">Santuario</div>';
      hand.appendChild(el);
    }
  },
  showStructure: function() {
    var log = document.getElementById('tutorialLog');
    if (log) {
      var div = document.createElement('div');
      div.className = 'tutorial-log-line';
      div.textContent = '🏛️ Tenshi coloca una estructura (2 rondas)';
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    }
  },
  showEndRound: function() {
    var log = document.getElementById('tutorialLog');
    if (log) {
      var div = document.createElement('div');
      div.className = 'tutorial-log-line';
      div.style.color = 'var(--accent)';
      div.style.fontWeight = '800';
      div.textContent = '═══ FIN DE RONDA ═══';
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    }
  },
  endTutorial: function() {
    try { localStorage.setItem('azaria_tutorial_done', '1'); } catch (e) {}
    var nextBtn = document.getElementById('tutorialNextBtn');
    if (nextBtn) nextBtn.textContent = '✓ Cerrar';
  }
};

/* ═══ Navegación del tutorial ═══ */
function tutorialNext() {
  if (TUTORIAL_INDEX >= TUTORIAL_STEPS.length - 1) {
    closeHelpModal();
    return;
  }
  TUTORIAL_INDEX++;
  var bubble = document.getElementById('tutorialBubble');
  if (bubble) bubble.classList.remove('show');
  setTimeout(function(){ renderTutorialStep(); }, 250);
}
function tutorialSkipAll() {
  var ok = confirm('¿Seguro que quieres saltar el tutorial completo?\n\nPodrás volver a leerlo en cualquier momento desde "Ayuda → 🎓 Tutorial".');
  if (!ok) return;
  try { localStorage.setItem('azaria_tutorial_done', '1'); } catch(e) {}
  closeHelpModal();
}

/* ═══ Tabs del modal ═══ */
function switchHelpTab(tab) {
  HELP_ACTIVE_TAB = tab;
  document.querySelectorAll('.help-tab').forEach(function(b){ b.classList.toggle('active', b.dataset.helpTab === tab); });
  document.querySelectorAll('.help-panel').forEach(function(p){ p.classList.remove('active'); });
  var panel = document.getElementById('helpPanel' + (tab === 'guide' ? 'Guide' : 'Tutorial'));
  if (panel) panel.classList.add('active');
  if (tab === 'tutorial') {
    resetTutorialScene();
  }
}

/* ═══ Abrir / cerrar ═══ */
function openHelpModal() {
  var m = document.getElementById('helpModal'); if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderGuide();
  switchHelpTab(HELP_ACTIVE_TAB);
}
function closeHelpModal() {
  var m = document.getElementById('helpModal'); if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
}

/* ═══ Init ═══ */
function initHelp() {
  var navBtn = document.getElementById('helpNavBtn');
  if (navBtn) {
    navBtn.addEventListener('click', function(e){
      e.preventDefault();
      openHelpModal();
    });
  }
  var closeBtn = document.getElementById('helpCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeHelpModal);
  var backdrop = document.getElementById('helpBackdrop');
  if (backdrop) backdrop.addEventListener('click', closeHelpModal);
  document.querySelectorAll('.help-tab').forEach(function(tab){
    tab.addEventListener('click', function(){ switchHelpTab(tab.dataset.helpTab); });
  });
  var nextBtn = document.getElementById('tutorialNextBtn');
  if (nextBtn) nextBtn.addEventListener('click', tutorialNext);
  var skipBtn = document.getElementById('tutorialSkipBtn');
  if (skipBtn) skipBtn.addEventListener('click', tutorialSkipAll);
  renderGuide();

  // ✅ Auto-open del tutorial en el primer arranque
  var seenTutorial = false;
  try { seenTutorial = localStorage.getItem('azaria_tutorial_done') === '1'; } catch(e) {}
  if (!seenTutorial) {
    setTimeout(function() {
      openHelpModal();
      switchHelpTab('tutorial');
    }, 1800);
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHelp);
else initHelp();

/* ═══════════════════════════════════════════════════════════════════
   PANEL CONTEXTUAL "¿QUÉ HAGO AHORA?"
   ═══════════════════════════════════════════════════════════════════ */

var _wtdInterval = null;

function ensureWhatToDoButton() {
  if (document.getElementById('whatToDoBtn')) return;
  var content = document.getElementById('combatContent');
  if (!content) return;
  var btn = document.createElement('button');
  btn.id = 'whatToDoBtn';
  btn.className = 'what-to-do-btn';
  btn.textContent = '💡 ¿Qué hago?';
  btn.addEventListener('click', function(e){ e.stopPropagation(); toggleWhatToDo(); });
  content.appendChild(btn);
}

function getCombatSuggestions() {
  if (!combatState || combatState.phase !== 'playing') return [];
  var side = combatState[combatState.turn];
  if (!side) return [];
  var active = side.characters[side.activeIndex];
  if (!active || active.dead) return [];

  var out = [];
  var char = active.character;

  // Definitiva
  if (char.abilities.ultimate) {
    var ult = char.abilities.ultimate;
    var canPayEnergy = !ult.energyCost || active.energy >= ult.energyCost || active.cardNextAbilityFree;
    var ultCost = getEffectiveCostFull(active, ult);
    var canPayDice = sumCost(ultCost) === 0 || trySpendDice(side.dice, ultCost).ok;
    if (canPayEnergy && canPayDice) {
      out.push({ type: 'ultimate', text: '💥 Puedes usar tu Definitiva: <strong>' + ult.name + '</strong>' });
    } else if (!canPayEnergy && ult.energyCost) {
      out.push({ type: 'info', text: '⚡ Te faltan <strong>' + (ult.energyCost - active.energy) + '</strong> de energía para tu Definitiva' });
    }
  }

  // Normal / elemental
  ['normal', 'elemental'].forEach(function(type) {
    var ab = char.abilities[type]; if (!ab) return;
    var c = getEffectiveCostFull(active, ab);
    var ok = (sumCost(c) === 0 || trySpendDice(side.dice, c).ok) && (!ab.energyCost || active.energy >= ab.energyCost || active.cardNextAbilityFree);
    if (ok) {
      out.push({ type: 'ability', text: (type === 'normal' ? '⚔️' : '🔮') + ' Puedes usar <strong>' + ab.name + '</strong>' });
    }
  });

  // Cartas jugables
  var playable = (side.hand || []).filter(function(cid){
    var card = CARD_DB[cid] || PAINT_CARDS[cid] || (typeof PLUSH_CARDS !== 'undefined' && PLUSH_CARDS[cid]);
    if (!card) return false;
    if (card.oncePerRound && side.cardsUsedThisRound[cid]) return false;
    if (card.oncePerGame && side.cardsUsedThisGame[cid]) return false;
    var cost = adjustCardCostForPassives(card, side);
    return sumCost(cost) === 0 || trySpendDice(side.dice, cost).ok;
  });
  if (playable.length > 0) {
    out.push({ type: 'card', text: '🎴 Puedes jugar <strong>' + playable.length + '</strong> carta(s) de tu mano' });
  }

  // Cierre
  out.push({ type: 'info', text: '🛑 Cuando termines, declara <strong>Fin de Ronda</strong>' });
  return out;
}

function updateWhatToDoButton() {
  var btn = document.getElementById('whatToDoBtn');
  if (!btn) return;
  var hasCombat = typeof combatState !== 'undefined' && combatState && combatState.phase === 'playing';
  btn.style.display = hasCombat ? '' : 'none';
  var canControl = hasCombat && typeof canHumanControlCurrentTurn === 'function' && canHumanControlCurrentTurn();
  btn.disabled = !canControl;
  btn.style.opacity = canControl ? '1' : '0.45';
  btn.style.cursor = canControl ? 'pointer' : 'not-allowed';
  btn.title = canControl ? '' : 'Solo puedes consultar durante tu turno';
  if (!canControl) {
    var panel = document.getElementById('whatToDoPanel');
    if (panel && panel.classList.contains('show')) {
      panel.classList.remove('show');
      if (_wtdInterval) { clearInterval(_wtdInterval); _wtdInterval = null; }
    }
  }
}

function renderWhatToDo() {
  var panel = document.getElementById('whatToDoPanel');
  if (!panel) return;
  if (!combatState || combatState.phase !== 'playing') {
    panel.innerHTML = '<div class="wtd-header">💡 ¿Qué hago ahora?</div><div class="wtd-item wtd-info">No hay combate activo.</div>';
    return;
  }
  var suggestions = getCombatSuggestions();
  var html = '<div class="wtd-header">💡 ¿Qué hago ahora?</div>';
  if (!suggestions.length) {
    html += '<div class="wtd-item wtd-info">No hay acciones claras. Declara fin de ronda.</div>';
  } else {
    suggestions.forEach(function(s){
      html += '<div class="wtd-item wtd-' + s.type + '">' + s.text + '</div>';
    });
  }
  panel.innerHTML = html;
}

function toggleWhatToDo() {
  var panel = document.getElementById('whatToDoPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'whatToDoPanel';
    panel.className = 'what-to-do-panel';
    (document.getElementById('combatContent') || document.body).appendChild(panel);
  }
  var open = panel.classList.contains('show');
  if (open) {
    panel.classList.remove('show');
    if (_wtdInterval) { clearInterval(_wtdInterval); _wtdInterval = null; }
  } else {
    renderWhatToDo();
    panel.classList.add('show');
    _wtdInterval = setInterval(function() {
      if (!combatState || combatState.phase === 'ended') {
        panel.classList.remove('show');
        clearInterval(_wtdInterval); _wtdInterval = null;
        return;
      }
      renderWhatToDo();
    }, 1000);
  }
}

// ✅ Crear el botón cuando arranca el juego (combatContent ya está en el DOM)
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureWhatToDoButton);
else ensureWhatToDoButton();

/* ═══════════════════════════════════════════════════════════════════
   COACH-MARKS contextuales — primera vez que se abre un combate
   ═══════════════════════════════════════════════════════════════════ */

var coachMarksState = { active: false, index: 0, pending: false };

var COACH_MARKS_STEPS = [
  {
    selector: '#combatDice',
    title: '🎲 Tus dados',
    text: 'Los gastas para pagar habilidades y cartas. Al inicio de cada ronda se relanzan (8 dados) y puedes relanzar los que no te sirvan <strong>una vez</strong>.'
  },
  {
    selector: '#combatHand',
    title: '🎴 Tu mano',
    text: 'Juega cartas desde aquí durante tu turno. Suelen ser <strong>acciones rápidas</strong>: no ceden turno. Máximo 10 en mano.'
  },
  {
    selector: '.actions-section',
    title: '⚔️ Tus acciones',
    text: 'Usa tu <strong>ataque normal</strong>, <strong>habilidad elemental</strong> o <strong>definitiva</strong>. Suelen ceder turno al rival. El botón de fin de ronda está justo debajo.'
  },
  {
    selector: '#endRoundBtn',
    title: '🛑 Fin de ronda',
    text: 'Cuando hayas hecho todo, pulsa aquí. La siguiente ronda la empieza el jugador que declaró fin primero.'
  }
];

function showCoachMarks() {
  coachMarksState.pending = false;
  if (typeof combatState === 'undefined' || !combatState || combatState.phase !== 'playing') return;
  coachMarksState.active = true;
  coachMarksState.index = 0;

  var blocker = document.createElement('div');
  blocker.id = 'coachBlocker';
  blocker.style.cssText = 'position: fixed; inset: 0; z-index: 9050; background: transparent; pointer-events: auto; cursor: default;';
  blocker.addEventListener('click', function(e){ e.stopPropagation(); e.preventDefault(); });
  blocker.addEventListener('mousedown', function(e){ e.stopPropagation(); e.preventDefault(); });
  document.body.appendChild(blocker);

  renderCoachStep();
}

function renderCoachStep() {
  var step = COACH_MARKS_STEPS[coachMarksState.index];
  if (!step) { endCoachMarks(); return; }
  var target = document.querySelector(step.selector);
  if (!target) {
    coachMarksState.index++;
    if (coachMarksState.index >= COACH_MARKS_STEPS.length) endCoachMarks();
    else renderCoachStep();
    return;
  }

  // Asegurar que el target está visible (por si el sidebar scrollea en mobile)
  try { target.scrollIntoView({ block: 'center' }); } catch (e) {}

  var oldHl = document.getElementById('coachHighlight'); if (oldHl) oldHl.remove();
  var oldTt = document.getElementById('coachMarkTooltip'); if (oldTt) oldTt.remove();

  var rect = target.getBoundingClientRect();

  // ── Foco visual (box-shadow spread = oscurece todo lo demás) ──
  var hl = document.createElement('div');
  hl.id = 'coachHighlight';
  hl.style.cssText =
    'position: fixed;' +
    'left: ' + rect.left + 'px; top: ' + rect.top + 'px;' +
    'width: ' + rect.width + 'px; height: ' + rect.height + 'px;' +
    'z-index: 9100; pointer-events: none;' +
    'border-radius: 10px;' +
    'box-shadow: 0 0 0 3px var(--accent), 0 0 0 9999px rgba(0,0,0,0.78);' +
    'transition: left 0.25s, top 0.25s, width 0.25s, height 0.25s;';
  document.body.appendChild(hl);

  // ── Tooltip ──
  var isFirst = coachMarksState.index === 0;
  var isLast  = coachMarksState.index === COACH_MARKS_STEPS.length - 1;
  var tooltip = document.createElement('div');
  tooltip.id = 'coachMarkTooltip';
  tooltip.className = 'coach-mark-tooltip';
  tooltip.innerHTML =
    '<div class="cm-title">' + step.title + '</div>' +
    '<div class="cm-text">' + step.text + '</div>' +
    '<div class="cm-buttons">' +
      (!isFirst ? '<button class="cm-btn cm-btn-skip" id="coachBack">← Atrás</button>' : '') +
      '<button class="cm-btn cm-btn-skip" id="coachSkip">Saltar</button>' +
      '<button class="cm-btn cm-btn-next" id="coachNext">' + (isLast ? '¡Entendido!' : 'Siguiente →') + '</button>' +
    '</div>' +
    '<div class="coach-mark-progress">' + (coachMarksState.index + 1) + ' / ' + COACH_MARKS_STEPS.length + '</div>';
  document.body.appendChild(tooltip);

  positionCoachTooltip(tooltip, rect);

  document.getElementById('coachNext').addEventListener('click', coachNext);
  document.getElementById('coachSkip').addEventListener('click', endCoachMarks);
  if (!isFirst) document.getElementById('coachBack').addEventListener('click', coachBack);
}

function coachNext() {
  coachMarksState.index++;
  if (coachMarksState.index >= COACH_MARKS_STEPS.length) endCoachMarks();
  else renderCoachStep();
}

function coachBack() {
  if (coachMarksState.index > 0) {
    coachMarksState.index--;
    renderCoachStep();
  }
}

function endCoachMarks() {
  try { localStorage.setItem('azaria_coachmarks_done', '1'); } catch(e) {}
  coachMarksState.active = false;
  coachMarksState.pending = false;
  var b = document.getElementById('coachBlocker');     if (b) b.remove();
  var h = document.getElementById('coachHighlight');   if (h) h.remove();
  var t = document.getElementById('coachMarkTooltip'); if (t) t.remove();
}

function positionCoachTooltip(tooltip, rect) {
  var tw = tooltip.offsetWidth;
  var th = tooltip.offsetHeight;
  var margin = 16;
  var left = rect.left - tw - margin;
  var top  = rect.top + (rect.height - th) / 2;

  if (left < margin) left = rect.right + margin;
  if (left + tw > window.innerWidth - margin) {
    left = Math.max(margin, (window.innerWidth - tw) / 2);
    top  = rect.top - th - margin;
    if (top < margin) top = rect.bottom + margin;
  }
  top  = Math.max(margin, Math.min(top,  window.innerHeight - th - margin));
  left = Math.max(margin, Math.min(left, window.innerWidth  - tw - margin));
  tooltip.style.left = left + 'px';
  tooltip.style.top  = top + 'px';
}

/* ─── Polling: actualiza el botón ¿Qué hago? y detecta el primer combate ─── */
(function startAssistPolling() {
  setInterval(function() {
    // 1) Estado del botón "¿Qué hago?" (se deshabilita fuera de tu turno)
    if (typeof updateWhatToDoButton === 'function') updateWhatToDoButton();

    // 2) Limpieza si el combate se cierra con coach-marks abiertos
    if (typeof combatState === 'undefined' || !combatState) {
      if (coachMarksState.active) endCoachMarks();
      else coachMarksState.pending = false;
      return;
    }

    // 3) Trigger de coach-marks (solo 1 vez, primer combate real)
    if (coachMarksState.active || coachMarksState.pending) return;
    if (combatState.phase !== 'playing') return;
    if (combatState.turn !== 'player') return;
    if (combatState.pvp) return;
    if (combatState.mode === 'auto' || combatState.mode === 'sandbox') return;
    if (combatState.roundStarting) return;
    try {
      if (localStorage.getItem('azaria_coachmarks_done') === '1') return;
    } catch(e) { return; }
    if (!document.querySelector('#combatDice') || !document.querySelector('#combatHand')) return;
    if (!document.getElementById('whatToDoBtn')) return;  // asegura que combatContent ya está

    coachMarksState.pending = true;
    setTimeout(showCoachMarks, 500);
  }, 800);
})();
