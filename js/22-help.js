/* ═══════════════════════════════════════════════════════════════════
   AYUDA — Guía + Tutorial
   ═══════════════════════════════════════════════════════════════════ */

var HELP_ACTIVE_TAB = 'guide';
var TUTORIAL_STEPS = [];
var TUTORIAL_INDEX = 0;
var TUTORIAL_CHARS = { player: ['erik','tenshi','eevee'], rival: ['tenshi','eloy','ren'] };

/* ═══ GUÍA ═══ */
var GUIDE_SECTIONS = [
  {
    id: 'intro',
    title: '1. Introducción',
    html: `
      <p><strong>Azaria TCG</strong> es un juego de cartas coleccionables y combate táctico por equipos. Enfrentas equipos de <strong>3 personajes</strong> en un combate por turnos donde el objetivo es eliminar a los 3 personajes rivales.</p>
      <p>Cada personaje pertenece a una de las <strong>Siete Respuestas</strong> (filosofías), que definen su elemento y su estilo de combate. Cada partida se construye con un <strong>equipo de 3 personajes</strong> y un <strong>mazo de 30 cartas</strong>.</p>
      <h3>¿Cómo se gana?</h3>
      <p>Reduciendo a 0 la vida de los 3 personajes del equipo rival. Si tu equipo cae primero, pierdes.</p>
    `
  },
  {
    id: 'respuestas',
    title: '2. Las Siete Respuestas',
    html: `
      <p>Cada personaje se clasifica por <strong>cómo responde al sufrimiento</strong>. Hay 7 respuestas, cada una con un elemento:</p>
      <ul>
        <li><strong>🛡️ Protección</strong> — Reducir el daño (escudos, defensa).</li>
        <li><strong>💡 Comprensión</strong> — Entenderlo (energía, control).</li>
        <li><strong>🌸 Expresión</strong> — Crear (marcas, condiciones).</li>
        <li><strong>🔥 Transformación</strong> — Adaptarse (cambio rápido, velocidad).</li>
        <li><strong>🌿 Aceptación</strong> — Asimilarlo (curación, aguante).</li>
        <li><strong>🩸 Redención</strong> — Actuar (daño, sacrificio).</li>
        <li><strong>🎭 Ilusión</strong> — Cuestionar la realidad (control, confusión).</li>
      </ul>
      <p>Cada personaje tiene su propio <strong>kit de habilidades</strong>: ataque normal, habilidad elemental, definitiva, pasiva y (opcionalmente) una EX.</p>
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
      <p>Las marcas son estados elementales que los personajes aplican a otros. Cuando un personaje recibe una <strong>segunda marca distinta</strong> a la que ya tiene, se desencadena una <strong>Resonancia</strong>: ambas marcas desaparecen y se aplica un efecto inmediato según la combinación.</p>
      <p>Hay 28 resonancias (7 elementos × 4 combinaciones posibles). Cada combinación de elementos produce un efecto distinto: daño bonus, curación, robo de cartas, energía, escudos, etc.</p>
      <p>Puedes consultar todas las resonancias en el menú principal.</p>
    `
  },
  {
    id: 'dados',
    title: '5. Dados y energía',
    html: `
      <h3>Dados</h3>
      <p>Al principio de cada ronda lanzas <strong>8 dados</strong>. Cada dado es de un tipo elemental o es un <strong>omnidado</strong> (comodín). Puedes relanzar los dados una vez por ronda (eliges cuáles).</p>
      <p>Cada habilidad tiene un coste de dados: dados de un elemento concreto + dados "cualesquiera" (de cualquier tipo).</p>
      <h3>Energía</h3>
      <p>Los personajes ganan <strong>energía</strong> al usar habilidades (normalmente +1 por uso). La energía es necesaria para lanzar la <strong>Habilidad Definitiva</strong>, que suele requerir 2-4 puntos.</p>
      <p>La energía <strong>no se pierde</strong> entre rondas: se acumula hasta el máximo del personaje.</p>
    `
  },
  {
    id: 'tipos-dano',
    title: '6. Tipos de daño',
    html: `
      <ul>
        <li><strong>Normal</strong> — Se reduce por escudos y reducciones.</li>
        <li><strong>Penetrante</strong> — <em>Ignora los escudos</em>. Se reduce por otras fuentes (como reducciones planas).</li>
        <li><strong>Verdadero</strong> — <em>Ignora todo</em>: escudos, reducciones, estados defensivos. Solo se reduce por inmunidades específicas (ej. Invulnerabilidad de Alter).</li>
      </ul>
      <h3>Daño base vs. daño final</h3>
      <p>El <strong>daño base</strong> es el que da la habilidad según sus atributos. El <strong>daño final</strong> es el que resulta tras aplicar bufos, equipo, cartas, etc. El <strong>daño verdadero</strong> es lo que realmente baja la vida del rival.</p>
    `
  },
  {
    id: 'estados',
    title: '7. Estados y marcas',
    html: `
      <p>Los personajes pueden tener <strong>estados</strong> (ventajas o desventajas temporales) y <strong>marcas</strong> (elementos aplicados por otros).</p>
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
      <p>Tu mazo tiene <strong>30 cartas</strong> (máx. 2 copias de cada una). Hay tres categorías principales:</p>
      <ul>
        <li><strong>⚔️ Equipo</strong> — Se equipan a un personaje. Aportan bonos permanentes (daño, escudos, reducciones, curación por ronda...).</li>
        <li><strong>📜 Apoyo</strong> — Se colocan en el campo. Tienen duración limitada (1-4 rondas) y dan bonos por ronda (curación, escudo, energía, robo de cartas...).</li>
        <li><strong>✨ Evento</strong> — Efectos inmediatos: buffs de ataque, curaciones, escudos, robo de dados, cambios rápidos, revivir...</li>
      </ul>
      <h3>Cartas de Pintura</h3>
      <p>Erik tiene 3 cartas especiales (Roja, Azul, Verde) que no van al mazo: las genera durante el combate con su habilidad elemental.</p>
    `
  },
  {
    id: 'mazo',
    title: '9. Construir el mazo',
    html: `
      <p>En la sección <strong>Mazo</strong> del menú puedes construir tu mazo de 30 cartas. Hay 3 formas:</p>
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
      <p>Al inicio de cada ronda lanzas 8 dados. Puedes relanzar los que quieras (una vez por ronda).</p>
      <h3>Fase de robo</h3>
      <p>Robas 5 cartas la primera ronda (con opción de mulligan), y 2 cartas las siguientes. Puedes tener hasta 10 cartas en mano.</p>
      <h3>Fase de juego</h3>
      <p>Se alternan los turnos. En tu turno puedes:</p>
      <ul>
        <li>Usar el ataque normal, la habilidad elemental o la definitiva del activo.</li>
        <li>Jugar cartas (eventos, equipos, apoyos).</li>
        <li>Cambiar de personaje (normalmente cuesta 1 dado).</li>
        <li>Declarar el fin de ronda.</li>
      </ul>
      <h3>Fin de ronda</h3>
      <p>Cuando ambos jugadores declaran fin, se resuelven los efectos de fin de ronda (estructuras, apoyos, entornos, pasivas), se descarta y se pasa a la siguiente ronda. <strong>El que declaró fin primero empieza la siguiente ronda.</strong></p>
    `
  },
  {
    id: 'estructuras',
    title: '11. Estructuras, apoyos y entornos',
    html: `
      <h3>Estructuras</h3>
      <p>Algunas habilidades colocan <strong>estructuras</strong> en el campo (hasta 4 simultáneas por bando). Suelen durar 2-3 rondas y tienen efectos por ronda (daño, curación, escudos, cambios de personaje...).</p>
      <h3>Apoyos</h3>
      <p>Las cartas de apoyo ocupan slots (hasta 4 por bando). Dan bonos por ronda mientras duren.</p>
      <h3>Entornos</h3>
      <p>Solo hay <strong>un entorno activo</strong> a la vez en todo el combate. Algunos personajes (María, Neón) pueden establecerlo. Afecta a ambos equipos según su descripción.</p>
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
    title: '13. Glosario rápido',
    html: `
      <ul>
        <li><strong>Activo</strong> — Personaje actualmente en combate del equipo. Solo él puede usar habilidades.</li>
        <li><strong>Reserva</strong> — Los otros 2 personajes del equipo. Cambiar a uno cuesta dados.</li>
        <li><strong>Omnidado</strong> — Dado comodín que cuenta como cualquier elemento.</li>
        <li><strong>Coste "any"</strong> — Dados de cualquier tipo.</li>
        <li><strong>Consonancia</strong> — Bonus pasivo por composición del equipo.</li>
        <li><strong>Resonancia</strong> — Efecto que se dispara cuando un personaje recibe una segunda marca distinta.</li>
        <li><strong>Ronda</strong> — Ciclo completo: lanzamiento + robo + juego. Ambas partes actúan.</li>
        <li><strong>Turno</strong> — Dentro de una ronda, cada jugador actúa en su turno.</li>
      </ul>
    `
  }
];

/* ═══ TUTORIAL: 25 pasos ═══ */
TUTORIAL_STEPS = [
  {
    text: '¡Hola! Soy <strong>Gregorio</strong>, y voy a guiarte por tu primer combate de Azaria TCG. Pulsa "Siguiente" cuando estés listo/a.',
    highlight: null,
    action: null
  },
  {
    text: 'Este es el <strong>tablero de combate</strong>. Arriba está tu rival, abajo estás tú. Cada uno tiene un equipo de 3 personajes.',
    highlight: '#tutorialStage .tutorial-board',
    action: null
  },
  {
    text: 'Los personajes de abajo son <strong>tu equipo</strong>. En este combate usas a Erik, Tenshi y Eevee. Cada uno pertenece a una de las Siete Respuestas.',
    highlight: '#tutorialPlayerTeam',
    action: 'showPlayerTeam'
  },
  {
    text: 'Los de arriba son el <strong>equipo rival</strong>. Tenshi, Eloy y Ren. Tienen sus propias habilidades y recursos.',
    highlight: '#tutorialRivalTeam',
    action: null
  },
  {
    text: 'El personaje con el borde dorado es el <strong>activo</strong>. Solo él puede usar habilidades. Los otros dos están en <strong>reserva</strong> y esperan su turno.',
    highlight: '.tutorial-char.active',
    action: null
  },
  {
    text: 'Cada ronda empiezas lanzando <strong>8 dados</strong>. Cada dado es de un elemento (🌸 para Expresión, 🛡️ para Protección, etc.) o es un <strong>omnidado</strong> ✨ que sirve para cualquier cosa.',
    highlight: '#tutorialDiceZone',
    action: 'rollDice'
  },
  {
    text: 'Puedes <strong>relanzar</strong> los dados que no te sirvan, una vez por ronda. Esto te ayuda a conseguir el elemento que necesitas.',
    highlight: '#tutorialDiceZone',
    action: null
  },
  {
    text: 'También robas <strong>cartas</strong>. La primera ronda robas 5, las siguientes 2. Las cartas se juegan durante tu turno como acciones rápidas.',
    highlight: '#tutorialHandZone',
    action: 'drawCards'
  },
  {
    text: 'Los dados se usan para pagar el <strong>coste de las habilidades</strong>. Por ejemplo, el ataque normal de Erik ("Trazo Vivo") cuesta 1 dado de 🌸 Expresión + 2 de cualquier tipo.',
    highlight: '#tutorialDiceZone',
    action: null
  },
  {
    text: 'Al usar una habilidad, el personaje gana <strong>energía</strong> ⚡. Con suficiente energía puedes lanzar la <strong>Habilidad Definitiva</strong>, que suele ser la más potente del kit.',
    highlight: '#tutorialEnergyZone',
    action: 'showEnergy'
  },
  {
    text: 'Veamos un <strong>ataque normal</strong> en acción. Erik ataca a Tenshi con Trazo Vivo. Se gastan 3 dados y hace daño.',
    highlight: '#tutorialDiceZone',
    action: 'erikAttack'
  },
  {
    text: 'Tenshi tenía <strong>4 de escudo</strong>. El escudo absorbe parte del daño antes de que llegue a su vida. El escudo desaparece cuando se agota.',
    highlight: '#tutorialRivalTeam .tutorial-char:first-child',
    action: 'showShield'
  },
  {
    text: 'Hay <strong>tres tipos de daño</strong>: normal (afectado por escudos), penetrante (ignora escudos pero no otras reducciones) y verdadero (ignora todo).',
    highlight: null,
    action: null
  },
  {
    text: 'Las habilidades también pueden aplicar <strong>marcas</strong>. Por ejemplo, Trazo Vivo marca a Tenshi con 🌸 Expresión. Las marcas son la base de las resonancias.',
    highlight: '#tutorialRivalTeam .tutorial-char:first-child',
    action: 'showMark'
  },
  {
    text: 'Si ese personaje recibe <strong>otra marca distinta</strong>, se desencadena una <strong>Resonancia</strong>: ambas marcas desaparecen y ocurre un efecto especial. Aquí lo verás en acción.',
    highlight: '#tutorialRivalTeam .tutorial-char:first-child',
    action: 'showResonance'
  },
  {
    text: 'Tu equipo también tiene una <strong>Consonancia</strong> según la composición de elementos. Mira el panel de consonancia activa: en este combate es "Diverso", que da 2 omnidados por ronda.',
    highlight: null,
    action: 'showConsonance'
  },
  {
    text: 'Ahora el turno del rival. Tenshi ataca con su habilidad elemental, que aplica <strong>Vulnerable</strong> a tu aliado con menos vida.',
    highlight: '#tutorialPlayerTeam',
    action: 'tenshiAttacks'
  },
  {
    text: 'Los <strong>estados</strong> como Vulnerable, Amenaza, Furia o Castigada modifican el comportamiento del personaje. Puedes ver su descripción pasando el ratón por encima de su badge.',
    highlight: null,
    action: null
  },
  {
    text: 'Cuando quieras cambiar al <strong>personaje activo</strong>, haz clic en otro de tu equipo. Cuesta 1 dado. Es útil para adaptarte al rival o activar pasivas.',
    highlight: '#tutorialPlayerTeam .tutorial-char:nth-child(2)',
    action: 'showChange'
  },
  {
    text: 'El <strong>registro</strong> de combate muestra todo lo que va pasando. Úsalo para revisar el orden de las acciones si te pierdes.',
    highlight: '#tutorialLogZone',
    action: 'showLog'
  },
  {
    text: 'Antes de terminar la ronda, puedes colocar <strong>cartas de apoyo</strong> o estructuras. Duran varias rondas y dan bonos constantes.',
    highlight: '#tutorialHandZone',
    action: 'showSupport'
  },
  {
    text: 'Cuando hayas hecho todo lo que querías, pulsa <strong>"Fin de ronda"</strong>. El rival también lo hará. Al final de la ronda se resuelven los efectos pasivos de estructuras, apoyos y entornos.',
    highlight: null,
    action: 'showEndRound'
  },
  {
    text: 'En la siguiente ronda, empieza el jugador que <strong>declaró fin de ronda primero</strong>. Después de eso, el turno se alterna.',
    highlight: null,
    action: null
  },
  {
    text: 'El combate continúa hasta que <strong>uno de los dos equipos pierde a sus 3 personajes</strong>. Coordina bien tus recursos: dados, energía, cartas y estados.',
    highlight: null,
    action: null
  },
  {
    text: '¡Eso es todo! Ya sabes lo básico. Puedes leer la <strong>Guía</strong> completa en la pestaña anterior para profundizar en cada sistema. ¡Buena suerte en tus combates! 🎉',
    highlight: null,
    action: 'endTutorial'
  }
];

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
    return '<section class="help-guide-section" id="guide-' + s.id + '"><h2>' + s.title + '</h2>' + s.html + '</section>';
  }).join('');
  // Scroll a sección al hacer click en el índice
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
}

/* ═══ TUTORIAL: estado inicial de la escena ═══ */
function resetTutorialScene() {
  var rivalTeam = document.getElementById('tutorialRivalTeam');
  var playerTeam = document.getElementById('tutorialPlayerTeam');
  var dice = document.getElementById('tutorialDice');
  var energy = document.getElementById('tutorialEnergy');
  var hand = document.getElementById('tutorialHand');
  var log = document.getElementById('tutorialLog');
  if (!rivalTeam || !playerTeam) return;

  // Rival: Tenshi, Eloy, Ren
  rivalTeam.innerHTML = [
    makeTutorialChar('tenshi', 'Tenshi', 'proteccion', '🛡️', 11, 11, 2, true),
    makeTutorialChar('eloy', 'Eloy', 'comprension', '📖', 12, 12, 1, false),
    makeTutorialChar('ren', 'Ren', 'ilusion', '🌀', 9, 9, 0, false)
  ].join('');

  // Player: Erik, Tenshi, Eevee
  playerTeam.innerHTML = [
    makeTutorialChar('erik', 'Erik', 'expresion', '🎨', 10, 10, 1, true),
    makeTutorialChar('tenshi', 'Tenshi', 'proteccion', '🛡️', 11, 11, 0, false),
    makeTutorialChar('eevee', 'Eevee', 'proteccion', '🦊', 9, 9, 0, false)
  ].join('');

  dice.innerHTML = '';
  energy.innerHTML = '';
  hand.innerHTML = '';
  log.innerHTML = '';
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
    var dice = document.getElementById('tutorialDice');
    if (!dice) return;
    var types = ['expresion','proteccion','proteccion','ilusion','comprension','omni','expresion','aceptacion'];
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
    var hand = document.getElementById('tutorialHand');
    if (!hand) return;
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
    var energy = document.getElementById('tutorialEnergy');
    if (!energy) return;
    energy.innerHTML = '<div class="tutorial-energy-pill">⚡ 1 / 2</div>';
  },
  erikAttack: function() {
    var target = document.querySelector('#tutorialRivalTeam .tutorial-char:first-child');
    if (!target) return;
    var rect = target.getBoundingClientRect();
    var stageRect = document.getElementById('tutorialStage').getBoundingClientRect();
    var float = document.createElement('div');
    float.className = 'tutorial-float';
    float.textContent = '−4';
    float.style.left = (rect.left - stageRect.left + rect.width/2 - 20) + 'px';
    float.style.top = (rect.top - stageRect.top + 30) + 'px';
    document.getElementById('tutorialStage').appendChild(float);
    setTimeout(function(){ if (float.parentNode) float.remove(); }, 1300);
    setTimeout(function(){
      var hp = target.querySelector('.tutorial-char-hp');
      if (hp) hp.textContent = '10/11';
      var bar = target.querySelector('.tutorial-char-bar-fill');
      if (bar) bar.style.width = (10/11*100) + '%';
    }, 400);
  },
  showShield: function() {
    // Añadimos un badge de escudo temporal
    var target = document.querySelector('#tutorialRivalTeam .tutorial-char:first-child');
    if (target) {
      target.style.boxShadow = '0 0 0 2px rgba(122,200,255,0.9)';
      setTimeout(function(){ target.style.boxShadow = ''; }, 2000);
    }
  },
  showMark: function() {
    var target = document.querySelector('#tutorialRivalTeam .tutorial-char:first-child');
    if (target) {
      var mark = document.createElement('div');
      mark.style.cssText = 'position:absolute; bottom:4px; right:4px; font-size:0.9rem; filter:drop-shadow(0 0 6px #fff);';
      mark.textContent = '🌸';
      target.appendChild(mark);
    }
  },
  showResonance: function() {
    var target = document.querySelector('#tutorialRivalTeam .tutorial-char:first-child');
    if (target) {
      var old = target.querySelector('div[style*="position:absolute"]');
      if (old) old.remove();
      var mark = document.createElement('div');
      mark.style.cssText = 'position:absolute; bottom:4px; right:4px; font-size:0.9rem; filter:drop-shadow(0 0 6px #fff); animation: fadeIn 0.3s;';
      mark.textContent = '🛡️';
      target.appendChild(mark);
      setTimeout(function(){
        // Flash de resonancia
        target.style.filter = 'brightness(2)';
        setTimeout(function(){ target.style.filter = ''; }, 300);
      }, 300);
    }
  },
  showConsonance: function() {
    var log = document.getElementById('tutorialLog');
    if (log) {
      var line = document.createElement('div');
      line.className = 'tutorial-log-line';
      line.textContent = '🌈 Consonancia: Diverso (+2 omnidados)';
      log.appendChild(line);
    }
  },
  tenshiAttacks: function() {
    var target = document.querySelector('#tutorialPlayerTeam .tutorial-char:last-child');
    if (!target) return;
    var float = document.createElement('div');
    float.className = 'tutorial-float';
    float.textContent = '💔';
    float.style.color = '#ff8a98';
    var stageRect = document.getElementById('tutorialStage').getBoundingClientRect();
    var rect = target.getBoundingClientRect();
    float.style.left = (rect.left - stageRect.left + rect.width/2 - 15) + 'px';
    float.style.top = (rect.top - stageRect.top + 30) + 'px';
    document.getElementById('tutorialStage').appendChild(float);
    setTimeout(function(){ if (float.parentNode) float.remove(); }, 1300);
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
        '🎲 Erik ataca a Tenshi por 4',
        '🏷️ Tenshi marcado con Expresión',
        '✨ Resonancia: Protección + Expresión → Abastecimiento',
        '🛡️ Tenshi aplica Vulnerable a Eevee'
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
function tutorialSkip() {
  tutorialNext();
}

/* ═══ Tabs del modal ═══ */
function switchHelpTab(tab) {
  // ✅ Tutorial desactivado temporalmente
  if (tab === 'tutorial') tab = 'guide';
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
  // ✅ Ayuda desactivada temporalmente mientras se rehace la guía
  var navBtn = document.getElementById('helpNavBtn');
  if (navBtn && navBtn.getAttribute('data-help-disabled') === '1') {
    if (typeof showTeamMissingToast === 'function') {
      showTeamMissingToast('📚 La guía estará disponible próximamente. Estamos rehaciéndola desde cero.');
    }
    if (typeof playSound === 'function') playSound('deselect');
    return;
  }

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
      if (navBtn.getAttribute('data-help-disabled') === '1') {
        // ✅ Ayuda desactivada temporalmente
        if (typeof showTeamMissingToast === 'function') {
          showTeamMissingToast('📚 La guía estará disponible próximamente. Estamos rehaciéndola desde cero.');
        }
        if (typeof playSound === 'function') playSound('deselect');
        return;
      }
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
  if (skipBtn) skipBtn.addEventListener('click', tutorialSkip);
  renderGuide();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHelp);
else initHelp();