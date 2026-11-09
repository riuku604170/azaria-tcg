var CHARACTERS = {

  /* ═══════════════════════════════════════════════════════════════════
     USUARIOS
     ═══════════════════════════════════════════════════════════════════ */

  alaya: { name:'Alaya', element:'redencion', set:'Reminiscencia', category:'Usuarios', hp:10, emoji:'🌹', img:'img/alaya.png',
    concept:'Representa el beneficio del sacrificio y del dolor, basándose en recibir daño.',
    terms: [
      { key:'castigada', name:'Castigada', definition:'Mientras tenga este efecto, toda curación que reciba se convierte en daño verdadero (penetrante) en lugar de curarla.' },
      { key:'condena', name:'Condena', definition:'Recurso que Alaya acumula al recibir daño verdadero de fuentes que no son enemigas. Su habilidad definitiva lo consume íntegramente como daño penetrante.' },
      { key:'martir', name:'Mártir Afligida', definition:'Siempre que Alaya reciba daño verdadero de una fuente que no sea enemiga, gana 1 punto de Condena por cada punto de HP perdido. Con el efecto Castigada, la curación se convierte en daño verdadero y, por tanto, también genera Condena.' }
    ],
    abilities: [
      { type:'normal', icon:'⚔️', name:'Autolesión',
        description:'Se golpea a sí misma y se inflige daño verdadero leve. Como el daño proviene de sí misma, activa su pasiva **Mártir Afligida** y acumula **Condena**.',
        attributes: ['Coste: 1 dado de Redención + 1 dado cualquiera','Daño propio (penetrante): 1'] },
      { type:'elemental', icon:'🔮', name:'Penitencia',
        description:'Elimina todos los efectos sobre sí misma y se aplica el efecto **Castigada**.',
        attributes: ['Coste: 3 dados de Redención'] },
      { type:'ultimate', icon:'💥', name:'El Fin del Comienzo',
        description:'Alaya consume todos sus puntos de **Condena** e inflige al enemigo un daño equivalente. Si el enemigo no muere con esta habilidad, Alaya se suicida, marcando con Redención a todos los enemigos.',
        attributes: ['Coste: 3 dados de Redención + 3 puntos de energía','Daño por punto de Condena: 1'] },
      { type:'passive', icon:'🛡️', name:'Mártir Afligida',
        description:'Siempre que Alaya recibe daño verdadero de una fuente que no sea enemiga (ella misma, aliados, equipamientos, efectos propios, entorno, etc.), gana 1 punto de **Condena** por cada punto de daño verdadero recibido. Con el efecto **Castigada**, la curación se convierte en daño verdadero y, por tanto, también genera **Condena**.',
        attributes: null },
      { type:'ex', icon:'🌟', name:'EX · Resurrección Afligida',
        description:'Si Alaya muere por su propia habilidad definitiva y en la mano del usuario hay una carta para revivir a un personaje, dicha carta y todos los dados en la mano del usuario se consumen para revivir a Alaya inmediatamente y repetir el golpe de la habilidad definitiva, volviendo a marcar con Redención a todos los enemigos. Tras ello, se suicida de nuevo, independientemente de si el enemigo es derrotado o no.',
        attributes: null }
    ]},

  oliver: { name:'Óliver', element:'comprension', set:'Refinamiento', category:'Usuarios', hp:10, emoji:'🧠', img:'img/oliver.png',
    concept:'Su función es servir como soporte ofensivo potenciando a sus aliados.',
    terms: [
      { key:'portatil', name:'Portátil', definition:'Estructura de Óliver. Inflige 1 de daño al enemigo al final de la ronda, marcándolo con Comprensión. A partir de la segunda ronda de su duración, los ataques normales y habilidades elementales de los aliados reciben un aumento de daño. Volver a usar la habilidad elemental extiende su tiempo de vida.' }
    ],
    abilities: [
      { type:'normal', icon:'⚔️', name:'Corrección',
        description:'Golpea al enemigo activo e inflige daño leve.',
        attributes: ['Coste: 1 dado de Comprensión + 1 dado cualquiera','Daño base: 1'] },
      { type:'elemental', icon:'🔮', name:'Optimización',
        description:'Coloca la estructura **Portátil**.',
        attributes: ['Coste: 3 dados de Comprensión','Daño de la estructura: 1','Duración inicial de la estructura: 2 rondas','Aumento de daño de ataques normales y habilidades elementales: +2 (a partir de la 2ª ronda de la estructura)','Extensión de duración por cada uso: +1 ronda','Duración máxima de la estructura: 3 rondas'] },
      { type:'ultimate', icon:'💥', name:'Obra Maestra',
        description:'Las habilidades definitivas de los aliados duplican su daño base, siempre y cuando la estructura **Portátil** permanezca en el campo.',
        attributes: ['Coste: 4 dados de Comprensión + 2 puntos de energía','Duración del efecto: 2 rondas','Multiplicador del daño base de las habilidades definitivas: ×2','Activaciones por habilidad definitiva: 1'] },
      { type:'passive', icon:'🛡️', name:'Criterio de Excelencia',
        description:'Las cartas de equipamiento cuestan un dado de cualquier tipo menos.',
        attributes: null },
      { type:'ex', icon:'🌟', name:'EX · Perfeccionamiento Absoluto',
        description:'La habilidad definitiva dobla el daño final en lugar del daño base.',
        attributes: null }
    ]},

  erik: { name:'Erik', element:'expresion', set:'Magia de Pintura', category:'Usuarios', hp:10, emoji:'🎨', img:'img/erik.png',
    concept:'Sus habilidades están construidas para ser un personaje todoterreno consistente, que puede bastarse por sí mismo.',
    terms: [
      { key:'pintura_roja', name:'Pintura Roja', definition:'Aumenta el daño del siguiente ataque normal y se descarta. Solo puede equiparse sobre Erik.' },
      { key:'pintura_azul', name:'Pintura Azul', definition:'Otorga un escudo al realizar el siguiente ataque normal y se descarta. Solo puede equiparse sobre Erik.' },
      { key:'pintura_verde', name:'Pintura Verde', definition:'Otorga curación leve al realizar el siguiente ataque normal y se descarta. Solo puede equiparse sobre Erik.' }
    ],
    abilities: [
      { type:'normal', icon:'⚔️', name:'Trazo Vivo',
        description:'Golpea al enemigo e inflige daño leve, marcando al enemigo con Expresión. Si lleva equipada una carta de Pintura, no marca al enemigo, pero tendrá un efecto adicional dependiendo del color de la pintura: **Pintura Roja** aumenta el daño, **Pintura Azul** otorga un escudo y **Pintura Verde** cura.',
        attributes: ['Coste: 1 dado de Expresión + 2 dados cualesquiera','Daño base: 1','Daño adicional de Pintura Roja: 2','Escudo de Pintura Azul: 1','Curación de Pintura Verde: 2'] },
      { type:'elemental', icon:'🔮', name:'Interpretación',
        description:'Se golpea a sí mismo y se inflige daño verdadero leve. Luego genera una carta de **Pintura Roja**, una de **Pintura Azul** y una de **Pintura Verde**.',
        attributes: ['Coste: 3 dados de Expresión','Vida propia perdida: 1','Cartas de pintura generadas: 3'] },
      { type:'ultimate', icon:'💥', name:'Lienzo de Sangre',
        description:'Gasta todas las cartas de Pintura que posea en la mano y no estén equipadas, causando los siguientes efectos: **Pintura Roja** inflige daño al enemigo, **Pintura Azul** aumenta la vida de su escudo y **Pintura Verde** se cura a sí mismo.',
        attributes: ['Coste: 3 dados de Expresión + 2 puntos de energía','Daño por Pintura Roja: 1','Aumento del escudo por Pintura Azul: 1','Curación por Pintura Verde: 1'] },
      { type:'passive', icon:'🛡️', name:'Inspiración Solitaria',
        description:'Cuantos menos personajes con vida haya en campo, mayor será el efecto de sus habilidades. Con 2 personajes con vida: daño, escudo y curación base aumentan en 1 punto. Con 1 personaje con vida: aumentan en 2 puntos.',
        attributes: null },
      { type:'ex', icon:'🌟', name:'EX · Paleta Inagotable',
        description:'Todos los ataques normales marcan al enemigo con Expresión.',
        attributes: null }
    ]},

  tenshi: { name:'Tenshi', element:'proteccion', set:'Égida', category:'Usuarios', hp:11, emoji:'⚔️', img:'img/tenshi.png',
    concept:'Está diseñado para defender a sus aliados de manera moderada pero insistente.',
    terms: [
      { key:'vulnerable', name:'Vulnerable', definition:'Aplica una reducción de daño verdadero. Al recibir daño verdadero, el enemigo causante de dicho daño pasa a considerarse como Amenaza, y elimina el efecto.' },
      { key:'amenaza', name:'Amenaza', definition:'Al infligir daño a un enemigo considerado como Vulnerable estando ya marcado como Amenaza, se marca a sí mismo con Protección.' }
    ],
    abilities: [
      { type:'normal', icon:'⚔️', name:'Intervención',
        description:'Golpea al enemigo activo e inflige daño leve. Si el enemigo es considerado como **Amenaza**, este ataque aumenta su daño y dicho enemigo deja de ser considerado como tal.',
        attributes: ['Coste: 2 dados de Protección + 1 dado cualquiera','Daño base: 2','Daño adicional contra Amenaza: 1'] },
      { type:'elemental', icon:'🔮', name:'Bajo mis Alas',
        description:'El aliado con menos vida pasa a ser considerado como **Vulnerable**.',
        attributes: ['Coste: 2 dados de Protección','Reducción de daño verdadero: 1'] },
      { type:'ultimate', icon:'💥', name:'Suficiente',
        description:'Golpea a todos los enemigos considerados como **Amenaza** e inflige daño penetrante moderado. Otorga un escudo al aliado considerado como **Vulnerable**.',
        attributes: ['Coste: 3 dados de Protección + 3 puntos de energía','Daño penetrante: 3','Escudo otorgado: 3'] },
      { type:'passive', icon:'🛡️', name:'Último Baluarte',
        description:'Si un aliado que es considerado como **Vulnerable** recibe un ataque mortal, quedará con 1 punto de vida y el personaje activo cambia inmediatamente a Tenshi como acción rápida, pudiendo suceder una vez por aliado. Dicho aliado además no dejará de ser considerado de tal manera, recibirá un escudo de 1 punto de vida, y el enemigo culpable será considerado como **Amenaza**.',
        attributes: null },
      { type:'ex', icon:'🌟', name:'EX · Resguardo Divino',
        description:'Su habilidad definitiva marca a los enemigos golpeados con Protección.',
        attributes: null }
    ]},

  eloy: { name:'Eloy', element:'comprension', set:'Cognición', category:'Usuarios', hp:12, emoji:'📖', img:'img/eloy.png',
    concept:'Sus cimientos son el conocimiento como útil para protegerse y mantenerse seguro, ayudando a sus aliados.',
    terms: [
      { key:'firewall', name:'Firewall', definition:'Escudo de Eloy. Cuando es golpeado por un enemigo, dicho enemigo se marca con Comprensión.' }
    ],
    abilities: [
      { type:'normal', icon:'⚔️', name:'Análisis',
        description:'Golpea al enemigo activo e inflige daño leve.',
        attributes: ['Coste: 1 dado de Comprensión + 2 dados cualesquiera','Daño base: 2'] },
      { type:'elemental', icon:'🔮', name:'Hipótesis Sólida',
        description:'Se otorga a sí mismo el escudo **Firewall**.',
        attributes: ['Coste: 3 dados de Comprensión','Vida del escudo: 2'] },
      { type:'ultimate', icon:'💥', name:'Conclusión',
        description:'Otorga un escudo y energía a todos los aliados, a excepción de sí mismo.',
        attributes: ['Coste: 4 dados de Comprensión + 3 puntos de energía','Vida del escudo: 1','Aumento de energía: 1'] },
      { type:'passive', icon:'🛡️', name:'Sincronía Cognitiva',
        description:'Si un aliado usa su habilidad definitiva, Eloy obtiene 1 punto de energía. Eloy no obtiene puntos de energía con el uso del ataque normal o la habilidad elemental.',
        attributes: null },
      { type:'ex', icon:'🌟', name:'EX · Dominio Intelectual',
        description:'Su habilidad definitiva pasa a otorgar 2 puntos de energía a los aliados en lugar de uno.',
        attributes: null }
    ]},

  eevee: { name:'Eevee', element:'proteccion', set:'Instinto', category:'Usuarios', hp:9, emoji:'🦊', img:'img/eevee.png',
    concept:'Se quita relevancia hasta que se meten con ella.',
    terms: [
      { key:'defensaActiva', name:'Defensa Activa', definition:'El daño del próximo golpe que reciba se reduce, y contraataca inmediatamente con un ataque normal. Después, el estado se elimina.' },
      { key:'furia', name:'Furia', definition:'Aumenta el daño infligido con el ataque normal en 1 punto. El estado se elimina al final de la ronda.' }
    ],
    abilities: [
      { type:'normal', icon:'⚔️', name:'Advertencia',
        description:'Golpea al enemigo activo e inflige daño leve.',
        attributes: ['Coste: 1 dado de Protección + 2 dados cualesquiera','Daño base: 2'] },
      { type:'elemental', icon:'🔮', name:'Defensa Activa',
        description:'Eevee entra en estado de **Defensa Activa**.',
        attributes: ['Coste: 4 dados de Protección','Reducción de daño: 1'] },
      { type:'ultimate', icon:'💥', name:'Contraofensiva',
        description:'Golpea al enemigo activo e inflige daño moderado. Si Eevee estaba en estado de **Furia**, aumenta el daño del golpe. Si el enemigo activo es el que activó su estado de **Furia**, el daño aumenta aún más y marca al enemigo con Protección.',
        attributes: ['Coste: 4 dados de Protección + 2 puntos si energía','Daño base: 3','Daño base en estado de Furia: 5','Daño base contra el enemigo que activó su Furia: 6'] },
      { type:'passive', icon:'🛡️', name:'Instinto de Supervivencia',
        description:'Cuando Eevee recibe un golpe que le inflige daño verdadero, entra en estado de **Furia**. No es acumulable.',
        attributes: null },
      { type:'ex', icon:'🌟', name:'EX · Territorial',
        description:'Su ataque normal inmediato activado por la habilidad elemental marca al enemigo con Protección.',
        attributes: null }
    ]},

  ren: { name:'Ren', element:'ilusion', set:'Distorsión', category:'Usuarios', hp:9, emoji:'🌀', img:'img/ren.png',
    concept:'Pretende hacer dudar del funcionamiento, mantener la duda y confundir para poseer ventaja, jugando con las reglas.',
    terms: [],
    abilities: [
      { type:'normal', icon:'⚔️', name:'Error',
        description:'Golpea al enemigo activo e inflige daño leve.',
        attributes: ['Coste: 1 dado de Ilusión + 2 dados cualesquiera','Daño base: 2'] },
      { type:'elemental', icon:'🔮', name:'Inconsistencia',
        description:'Golpea al enemigo activo e inflige daño penetrante leve, fuerza el cambio al siguiente enemigo en reserva y marca al nuevo enemigo activo con Ilusión.',
        attributes: ['Coste: 5 dados de Ilusión','Daño base (penetrante): 2'] },
      { type:'ultimate', icon:'💥', name:'Destrucción de Lógica',
        description:'Golpea al enemigo activo e inflige daño penetrante moderado, marca al enemigo con Ilusión y fuerza el cambio al siguiente enemigo en reserva.',
        attributes: ['Coste: 4 dados de Ilusión + 3 puntos de energía','Daño base (penetrante): 3'] },
      { type:'passive', icon:'🛡️', name:'Paso Fantasma',
        description:'Realizar la habilidad elemental o definitiva hace que Ren pase a la reserva, siendo el nuevo personaje activo el siguiente personaje en reserva.',
        attributes: null },
      { type:'ex', icon:'🌟', name:'EX · Espejismo',
        description:'Los aliados no pueden ser marcados por Ilusión.',
        attributes: null }
    ]},

  noah: { name:'Noah', element:'proteccion', set:'Resonancia', category:'Usuarios', hp:8, emoji:'⚓', img:'img/noah.png',
    concept:'Su única función es que sus compañeros estén bien…',
    terms: [
      { key:'sintonia', name:'Sintonía', definition:'La siguiente curación que reciba también la recibirán el resto de aliados en Sintonía. Una vez esto suceda, todos los aliados dejarán de considerarse en Sintonía.' }
    ],
    abilities: [
      { type:'normal', icon:'⚔️', name:'Latido',
        description:'Golpea al enemigo activo e inflige daño bajo.',
        attributes: ['Coste: 1 dado de Protección + 1 dado cualquiera','Daño base: 1'] },
      { type:'elemental', icon:'🔮', name:'Eco Vital',
        description:'Cura al aliado que corresponda según el estado de **Sintonía** del equipo y lo incorpora a ella si aún no estaba. Si ambos aliados tienen la misma cantidad de vida, Noah se cura a sí misma y no cura a ningún aliado.',
        attributes: ['Coste: 3 dados de Protección','Curación base: 2','Curación base a aliados ya en Sintonía: 1'] },
      { type:'ultimate', icon:'💥', name:'Armonía',
        description:'Noah se considera en **Sintonía** y se otorga curación elevada a sí misma, marcando al enemigo activo con Protección. Por cada aliado considerado en **Sintonía**, a excepción de ella misma, la curación de esta habilidad se reduce.',
        attributes: ['Coste: 3 dados de Protección + 3 puntos de energía','Curación base: 5','Reducción de curación por aliado sintonizado: 1'] },
      { type:'passive', icon:'🛡️', name:'Ecos de Compasión',
        description:'Las cartas de curación cuestan un dado de cualquier tipo menos.',
        attributes: null },
      { type:'ex', icon:'🌟', name:'EX · Vibración Compasiva',
        description:'Al golpear a un enemigo marcado con Protección, cura 1 punto de vida a los aliados no considerados en **Sintonía**.',
        attributes: null }
    ]},

  abla: { name:'Abla', element:'redencion', set:'Venganza', category:'Usuarios', hp:9, emoji:'🗡️', img:'img/abla.png',
    concept:'Su manera de jugar deja clara su sed, no se olvida del daño que recibe y lo hace pagar.',
    terms: [
      { key:'rencor', name:'Rencor', definition:'Acumulación sobre un enemigo. La habilidad definitiva de Abla inflige daño adicional por cada acumulación y las consume al golpear.' }
    ],
    abilities: [
      { type:'normal', icon:'⚔️', name:'Rencor',
        description:'Golpea al enemigo activo e inflige daño leve.',
        attributes: ['Coste: 1 dado de Redención + 2 dados cualesquiera','Daño base: 2'] },
      { type:'elemental', icon:'🔮', name:'Deuda de Sangre',
        description:'Golpea al enemigo activo e inflige daño moderado, aplicando a dicho enemigo una acumulación de **Rencor**. Si el golpe inflige daño verdadero, se cura levemente.',
        attributes: ['Coste: 4 dados de Redención','Daño base: 3','Curación base: 1'] },
      { type:'ultimate', icon:'💥', name:'Retribución Final',
        description:'Golpea a todos los enemigos que posean acumulaciones de **Rencor** e inflige daño moderado, eliminando todas las acumulaciones sobre los enemigos. Cada acumulación de **Rencor** adicional que posea un enemigo aumenta levemente el daño de esta habilidad sobre dicho enemigo.',
        attributes: ['Coste: 4 dados de Redención + 3 puntos de energía','Daño base: 3','Aumento de daño por acumulación de Rencor adicional: 1'] },
      { type:'passive', icon:'🛡️', name:'Agravio Eterno',
        description:'Si Abla es revivida, inflige 1 punto de daño a todos los enemigos.',
        attributes: null },
      { type:'ex', icon:'🌟', name:'EX · Sangría Persistente',
        description:'Los enemigos que poseen acumulaciones de **Rencor** reciben 1 punto de daño al final de la ronda.',
        attributes: null }
    ]},

  manuel: { name:'Manuel', element:'redencion', set:'Entropía', category:'Usuarios', hp:11, emoji:'⚡', img:'img/manuel.png',
    concept:'Da grandes saltos sabiendo que si va a causar dolor, él también va a fastidiarse.',
    terms: [],
    abilities: [
      { type:'normal', icon:'⚔️', name:'Ruptura',
        description:'Golpea al enemigo activo e inflige daño moderado.',
        attributes: ['Coste: 2 dados de Redención + 2 dados cualesquiera','Daño base: 3'] },
      { type:'elemental', icon:'🔮', name:'Degradación',
        description:'Se inflige a sí mismo daño leve y golpea al enemigo, infligiendo daño moderado y marcándolo con Redención.',
        attributes: ['Coste: 5 dados de Redención','Daño propio: 2','Daño base: 4'] },
      { type:'ultimate', icon:'💥', name:'Decadencia',
        description:'Aumenta el daño base y daño propio de su habilidad elemental, y reduce su coste. Puede acumularse indefinidamente hasta que se ejecute la habilidad elemental. Al ejecutar la habilidad elemental, se reinicia la acumulación y los enemigos marcados con Redención dejan de estarlo. Además, el golpe no genera ningún punto de energía.',
        attributes: ['Coste: 3 dados de Redención + 2 puntos de energía','Aumento de daño propio: 1','Aumento de daño base: 1','Reducción del coste de la habilidad elemental: 1 dado'] },
      { type:'passive', icon:'🛡️', name:'Tributo Vital',
        description:'Si Manuel derrota a un enemigo con su habilidad elemental, recupera una cantidad de puntos de vida equivalente al daño verdadero que ha recibido el enemigo con dicho golpe.',
        attributes: null },
      { type:'ex', icon:'🌟', name:'EX · Caos Acelerado',
        description:'Usar la habilidad elemental otorga dos puntos de energía en lugar de uno.',
        attributes: null }
    ]},

  jose: { name:'Jose', element:'transformacion', set:'Inercia', category:'Usuarios', hp:9, emoji:'🦋', img:'img/jose.png',
    concept:'Aprovecha el flujo del juego para entrar y salir, usando esa velocidad para mejorar el daño.',
    terms: [
      { key:'acelerado', name:'Acelerado', definition:'Se considera un ataque acelerado todo ataque normal ejecutado como primera acción tras cambiar de personaje a Jose en ese mismo turno.' }
    ],
    abilities: [
      { type:'normal', icon:'⚔️', name:'Acelerón',
        description:'Golpea al enemigo activo e inflige daño leve. Si el ataque es **Acelerado**, aumenta su daño y marca al enemigo con Transformación.',
        attributes: ['Coste: 2 dados de Transformación + 1 dado cualquiera','Daño base: 2','Aumento por Acelerado: +1'] },
      { type:'elemental', icon:'🔮', name:'Impulso',
        description:'Durante el resto de la ronda, aumenta el daño base del siguiente ataque normal y pasa a personaje en reserva.',
        attributes: ['Coste: 3 dados de Transformación','Aumento de daño base del ataque normal: +2'] },
      { type:'ultimate', icon:'💥', name:'Instinto',
        description:'Golpea al enemigo activo e inflige daño moderado. La habilidad definitiva se considera un ataque normal. Si el ataque es **Acelerado**, aumenta su daño y marca al enemigo con Transformación.',
        attributes: ['Coste: 4 dados de Transformación + 2 puntos de energía','Daño base: 3','Aumento por Acelerado: +2'] },
      { type:'passive', icon:'🛡️', name:'Cambio Cinético',
        description:'Cambiar de personaje a Jose se considera una acción rápida.',
        attributes: null },
      { type:'ex', icon:'🌟', name:'EX · Inercia',
        description:'Cambiar de personaje a Jose no cuesta dados.',
        attributes: null }
    ]},

  josemi: { name:'Josemi', element:'expresion', set:'Cosmogénesis', category:'Usuarios', hp:11, emoji:'🎤', img:'img/josemi.png',
    concept:'Busca crear un mundo ficticio en el combate, manipulando a antojo las cartas de apoyo.',
    terms: [],
    abilities: [
      { type:'normal', icon:'⚔️', name:'Esbozo',
        description:'Golpea al enemigo e inflige daño leve.',
        attributes: ['Coste: 1 dado de Expresión + 2 dados cualesquiera','Daño base: 2'] },
      { type:'elemental', icon:'🔮', name:'Reescritura',
        description:'Restablece la duración de una carta de apoyo sobre el campo y destruye una enemiga. Si no destruye una carta de apoyo enemiga, marca al enemigo activo con Expresión.',
        attributes: ['Coste: 3 dados de Expresión','Cartas de apoyo cuya duración se restablece: 1','Cartas de apoyo destruidas: 1'] },
      { type:'ultimate', icon:'💥', name:'Canon',
        description:'Roba hasta tres cartas de apoyo del mazo y obtiene inmediatamente el beneficio de cada carta de apoyo en el campo de manera adicional.',
        attributes: ['Coste: 5 dados de Expresión + 2 puntos de energía','Cartas de apoyo robadas: 3'] },
      { type:'passive', icon:'🛡️', name:'Vestigios del Origen',
        description:'Las cartas de apoyo otorgan un dado del tipo del aliado activo al desaparecer del campo.',
        attributes: null },
      { type:'ex', icon:'🌟', name:'EX · Arquitectura Creativa',
        description:'Las cartas de apoyo cuestan un dado cualquiera menos.',
        attributes: null }
    ]},

  amsa:    { name:'Amsa',   element:'comprension',  set:'Erik', category:'Usuarios', hp:11, emoji:'🧩', img:'img/amsa.png',    comingSoon:true, abilities:[] },
  victor:  { name:'Víctor', element:'comprension',  set:'Erik', category:'Usuarios', hp:11, emoji:'📐', img:'img/victor.png',  comingSoon:true, abilities:[] },
  gabo:    { name:'Gabo',   element:'ilusion',      set:'Erik', category:'Usuarios', hp:11, emoji:'🃏', img:'img/gabo.png',    comingSoon:true, abilities:[] },
  vicky:   { name:'Vicky',  element:'expresion',    set:'Erik', category:'Usuarios', hp:11, emoji:'🎬', img:'img/vicky.png',   comingSoon:true, abilities:[] },

  /* ═══════════════════════════════════════════════════════════════════
     RESTO DEL ROSTER (sin cambios en este parche, mantienen estructura antigua
     y se normalizan con un adaptador en el render).
     ═══════════════════════════════════════════════════════════════════ */

  artemis:   { name:'Artemis',   element:'aceptacion',     set:'Erik', category:'HNN', hp:11, emoji:'🦅', img:'img/artemis.png',   concept:'Vuela alto. Vuela alto por mí. Vuela alto por tí. Vuela alto por todos aquellos que dudaron de tu vuelo. Vuela alto por todo aquello que sientes que es correcto.', abilities:[{ type:'normal', icon:'⚔️', name:'Disparo divino', cost:'x2 dados de aceptación, x2 dados cualesquiera', effect:'Causa 3 de daño físico al enemigo activo.' },{ type:'elemental', icon:'🔮', name:'Carrerilla', cost:'x3 dados de aceptación', effect:'Su siguiente habilidad que cause daño añade 2 puntos de daño adicional. Esta habilidad no otorga energía. Si el siguiente ataque dañino es su ataque normal, el output de energía de ese ataque aumenta en 1 adicionalmente.' },{ type:'ultimate', icon:'💥', name:'Mis dedos palpan el borde de la estratosfera', cost:'x6 dados de aceptación, x3 puntos de energía', effect:'Si no tiene el efecto "Vuelo", lo recibe. Si tenía el efecto "Vuelo" antes de usar esta habilidad, causa 6 de daño elemental a todos los enemigos, los marca con "Aceptación" y muere.' },{ type:'passive', icon:'🛡️', name:'Vuelo', effect:'Bajo el efecto "Vuelo" recibe una reducción de daño de 2. Si recibe daño verdadero, recibe 3 de daño adicional, gana 1 de energía y pierde el efecto. No puede ser resucitada.' },{ type:'ex', icon:'🌟', name:'EX', effect:'Su definitiva cuesta 2 dados más y aumenta en 2 su poder base.' }]},
  neon:      { name:'Neón',      element:'ilusion',        set:'Erik', category:'HNN', hp:6,  emoji:'🎆', img:'img/neon.png',      concept:'Un set que distorsiona la realidad sonora, transformando el campo de batalla en un escenario donde la ilusión y el ritmo dictan el compás.', abilities:[{ type:'normal', icon:'⚔️', name:'Scratch', cost:'x1 dado de ilusión, x2 dados cualesquiera', effect:'Inflige 1 punto de daño al enemigo activo. Si el entorno activo es "Sobrecarga Epiléptica", el daño aumenta en 1 punto. Si la estructura "Mesa de DJ" está activa en tu campo, el daño aumenta en 1 punto adicional y el coste de esta habilidad aumenta en 1 dado de ilusión.' },{ type:'elemental', icon:'🔮', name:'Remix', cost:'x4 dados de ilusión', effect:'Coloca la estructura "Mesa de DJ" (2 rondas) si no estaba en tu campo. Si "Mesa de DJ" ya estaba activa, marca al enemigo activo con Ilusión.' },{ type:'ultimate', icon:'💥', name:'Killer Tunes', cost:'x4 dados de ilusión, x3 puntos de energía', effect:'Cambia el entorno a "Sobrecarga Epiléptica" durante 2 rondas. Además, durante el resto de la ronda, los cambios de personaje de tu equipo causan 1 punto de daño al enemigo activo.' },{ type:'passive', icon:'🛡️', name:'Frecuencia Constante', effect:'Si comienza la ronda como personaje activo, se cura 4 puntos de vida. Al declarar el fin de la ronda estando activa, cambia al siguiente aliado vivo y recibe 2 puntos de escudo.' },{ type:'ex', icon:'🌟', name:'EX · Sobrecarga', effect:'Su vida máxima aumenta a 8 puntos de vida durante el resto de la partida.' }]},
  nc:        { name:'NC',        element:'proteccion',     set:'Erik', category:'HNN', hp:12, emoji:'🎯', img:'img/nc.png',        concept:'"El color es relativo..." -Att. Erik.', abilities:[{ type:'normal', icon:'⚔️', name:'Lectura', cost:'x1 dado de protección, x2 dados cualesquiera', effect:'Inflige 1 punto de daño al enemigo activo. Si NC posee el efecto "Podrida", marca al enemigo activo con Protección y pierde Podrida.' },{ type:'elemental', icon:'🔮', name:'Interpretación', cost:'x3 dados de protección', effect:'Si NC ya poseía "Podrida", se inflige a sí misma 1 punto de daño normal. Si no la poseía, se aplica a sí misma el efecto "Podrida". Si con esta habilidad su vida se ve afectada negativamente, obtiene un escudo de 2 puntos.' },{ type:'ultimate', icon:'💥', name:'Sobre-exageración', cost:'x4 dados de protección, x4 puntos de energía', effect:'Por el resto de la ronda, el daño que inflige "Podrida" afecta a todos los enemigos.' },{ type:'passive', icon:'🛡️', name:'Condiciones de vida poco favorables', effect:'NC recibe 1 punto de daño al final de cada ronda. Los efectos de salud sobre ella se reducen en 1 punto. No obtiene energía con el uso de habilidades, pero gana 1 punto de energía cada vez que recibe daño verdadero.' },{ type:'ex', icon:'🌟', name:'EX · Desquite artístico', effect:'NC comienza cada ronda con el efecto "Podrida".' }]},
  orath: { name:'Orath', element:'redencion', set:'Erik', category:'HNN', hp:9, emoji:'🗿', img:'img/orath.png', concept:'Los demonios aman el frío y el silencio, pues la paz la desean todos los seres vivos. Sin embargo, sus pecados deben ser respondidos con un dolor similar al provocado hacia la vida misma, por lo que, en muerte, reciben un castigo de eterno sufrimiento, agonía que perciben en todos sus sentidos hasta que su cordura se calcine hasta terminar de chamuscar hasta la última mota de ceniza que quede de ellos.',
    terms: [
      { key:'cobertura_fe', name:'Cobertura de Fe', definition:'Escudo de Orath. Se destruye al final de la ronda si no ha sido destruido antes. Si es golpeado, genera una Cruz de Madera (una vez por escudo).' }
    ],
    abilities:[
      { type:'normal', icon:'⚔️', name:'Ojo por ojo', cost:'x2 dados de redención, x1 dado cualquiera', effect:'Causa 1 punto de daño físico al enemigo activo. Aumenta el daño en 1 punto por cada "Cruz de Madera" presente en el campo.' },
      { type:'elemental', icon:'🔮', name:'Minuto de silencio', cost:'x4 dados de redención', effect:'Genera la **Cobertura de Fe** (escudo de 2 puntos de vida) para sí misma, que si no es destruido desaparece al final de la ronda. Si la Cobertura de Fe es golpeada, genera 1 "Cruz de Madera" propia (solo puede generar una estructura de esta manera hasta que dicha estructura sea destruida).' },
      { type:'ultimate', icon:'💥', name:'Dios te ampare, maldito pecador', cost:'x3 dados de redención, x2 puntos de energía', effect:'Destruye todas las estructuras "Cruz de Madera" del campo. Causa 1 punto de daño a los enemigos en reserva por cada "Cruz de Madera" eliminada.' },
      { type:'passive', icon:'🛡️', name:'Vía Crucis', effect:'Si un aliado (diferente a Orath) recibe daño verdadero, se genera una estructura "Cruz de Madera" (una vez por aliado hasta que la cruz correspondiente sea destruida). Si termina la ronda, Orath está activa y hay estructuras "Cruz de Madera", el enemigo activo es marcado con redención y las cruces se destruyen. Cada "Cruz de Madera" causa 1 punto de daño al enemigo activo al ser destruida.' },
      { type:'ex', icon:'🌟', name:'EX', effect:'Si Orath muere genera una estructura "Cruz de Sangre". Si un aliado muere se destruye esta estructura. Al destruirse, revive al último aliado caído con 1 punto de salud y 2 puntos de escudo.' }
    ]},
  maria:     { name:'María',     element:'aceptacion',     set:'Erik', category:'HNN', hp:8,  emoji:'🌺', img:'img/maria.png',     concept:'"Ojalá algún día puedas comprender mi dolor..."', abilities:[{ type:'normal', icon:'⚔️', name:'Cosecha', cost:'x1 dado de aceptación, x2 dados cualesquiera', effect:'Inflige 1 punto de daño al enemigo activo. La primera vez que se usa en la ronda, ese es todo el efecto. Si se repite durante la misma ronda, además cura 1 punto de vida al aliado con menos vida.' },{ type:'elemental', icon:'🔮', name:'Caricia', cost:'x4 dados de aceptación', effect:'Cura 3 puntos de vida al aliado con menos puntos de vida. Si no hay ningún aliado vivo al que curar, María se cura 2 puntos de vida a sí misma y marca al enemigo activo con Aceptación.' },{ type:'ultimate', icon:'💥', name:'Amor', cost:'x5 dados de aceptación, x3 puntos de energía', effect:'Solo puede usarse si hay al menos un aliado derrotado. Revive a un aliado derrotado con 3 puntos de vida (máx. 5). Después, coloca el entorno "Campo de Girasoles" durante 2 rondas.' },{ type:'passive', icon:'🛡️', name:'Florecimiento', effect:'Al principio de cada ronda, si el entorno actual no es "Campo de Girasoles", María lo establece (2 rondas).' },{ type:'ex', icon:'🌟', name:'Recuerdo', effect:'María comienza la partida transformada en EX-María.' }]},
  exmaria:   { name:'EX-María',  element:'aceptacion',     set:'Erik', category:'HNN', hp:8,  emoji:'🌺', img:'img/exmaria.png',   concept:'"Translúcido, borroso, gris desde la distancia..."', abilities:[{ type:'normal', icon:'⚔️', name:'Es acaso el roce posible', cost:'x1 dado de aceptación, x1 dado cualquiera', effect:'Inflige 1 punto de daño al enemigo actualmente activo al final de la ronda.' },{ type:'elemental', icon:'🔮', name:'Es acaso tu amor verdadero', cost:'x3 dados de aceptación', effect:'Marca al enemigo activo con Aceptación. Si al final de la ronda ambos tienen 1 marca o ambos 0 marcas, María recibe +2 HP.' },{ type:'ultimate', icon:'💥', name:'Es acaso mi amor suficiente', cost:'x4 dados de aceptación, x2 puntos de energía', effect:'No puede usarse si María tiene 1 HP o si no hay un aliado derrotado. María pierde toda su salud hasta tener 1 HP y revive a un aliado derrotado con una cantidad de HP equivalente a los perdidos.' },{ type:'passive', icon:'🛡️', name:'Espera Eterna', effect:'Si recibe un ataque, reduce en 1 el daño y guarda el punto reducido para recibirlo al final de la ronda.' }]},
  adela:     { name:'Adela',     element:'transformacion', set:'Erik', category:'HNN', hp:10, emoji:'🕊️', img:'img/adela.png',     concept:'Un set dedicado a un alma pícara...', abilities:[{ type:'normal', icon:'⚔️', name:'Gracia Pícara', cost:'x2 dados de transformación, x1 dado cualquiera', effect:'Quita 1 punto de vida al enemigo activo. Se cura 1 punto de vida si causa daño verdadero.' },{ type:'elemental', icon:'🔮', name:'Flechazo Tentador', cost:'x3 dados de transformación', effect:'Si el enemigo activo estaba marcado, le quita su marca primero y le causa 2 puntos de daño penetrante. Marca al enemigo activo con Transformación.' },{ type:'ultimate', icon:'💥', name:'Mis Modales en el Suelo', cost:'x5 dados de transformación, x2 puntos de energía', effect:'Si no estaba marcada, se marca a ella misma con Transformación y pasa a tener 5 de vida. Si estaba marcada con Transformación, causa 4 puntos de daño al enemigo activo. Si estaba marcada con otro elemento, se suicida.' },{ type:'passive', icon:'🛡️', name:'Alma Pícara', effect:'Si es revivida y era marcada antaño con algún elemento, se transforma en Hunger Incarnate.' },{ type:'ex', icon:'🌟', name:'EX · Café para llevar', effect:'Comienza la partida con 2 cartas de "Café solo" en la mano y roba 3 cartas menos en su mano inicial.' }]},
  hunger:    { name:'Hunger Incarnate', element:'transformacion', set:'Erik', category:'HNN', hp:5, emoji:'👹', img:'img/hunger.png', concept:'Un set dedicado a un monstruo...', abilities:[{ type:'normal', icon:'⚔️', name:'Muere', cost:'x1 dado de transformación, x1 dado cualquiera', effect:'Quita 1 punto de vida al enemigo activo. El daño aumenta en 1 punto si el enemigo está marcado.' },{ type:'elemental', icon:'🔮', name:'MUERE', cost:'x3 dados de transformación', effect:'Si el enemigo activo estaba marcado, le quita su marca primero y le causa 2 de daño penetrante. Marca al enemigo activo con Transformación. El enemigo activo cambia al siguiente en reserva.' },{ type:'ultimate', icon:'💥', name:'Mi cordura, en el suelo, hecha pedazos', cost:'x4 dados de transformación, x2 puntos de energía', effect:'Si no estaba marcada con Transformación, se marca a ella misma y se cura al máximo. Si estaba marcada con Transformación, causa 4 de daño al enemigo activo.' },{ type:'passive', icon:'🛡️', name:'Hambre Eterna', effect:'Siempre que sea revivida será curada hasta su salud máxima. Es inmune al límite de veces que puede ser revivida.' },{ type:'ex', icon:'🌟', name:'EX · Café amargo', effect:'El "Café solo" pasa a ser gratis para ella, pero adicionalmente le causa 2 puntos de daño al usarlo.' }]},
  alter:     { name:'Alter',     element:'ilusion',        set:'Erik', category:'HNN', hp:12, emoji:'🎭', img:'img/alter.png',     concept:'Un set con el propósito de alzarse sobre el prójimo...', abilities:[{ type:'normal', icon:'⚔️', name:'Amenaza a la Ontología', cost:'x1 dado de ilusión, x2 dados cualesquiera', effect:'Inflige 1 punto de daño al enemigo activo. Alter no genera energía con este ataque.' },{ type:'elemental', icon:'🔮', name:'Conversión Psicológica', cost:'x3 dados de ilusión', effect:'Se otorga 1 punto de invulnerabilidad (máx. 3). Roba toda la energía del resto de personajes del equipo. Alter no genera energía con esta habilidad.' },{ type:'ultimate', icon:'💥', name:'Omnes Deam Salutate', cost:'x4 dados de ilusión, x3 puntos de energía', effect:'Aumenta el daño de las habilidades elementales del resto de personajes del equipo en 3 puntos durante 2 rondas.' },{ type:'passive', icon:'🛡️', name:'Dualismo Ontológico', effect:'Alter no genera energía con el uso del ataque normal o habilidad elemental. Por cada punto de invulnerabilidad, el daño verdadero que recibe Alter se reduce en 1 punto.' },{ type:'ex', icon:'🌟', name:'EX · Buen Provecho', effect:'La habilidad elemental, en lugar de desechar los puntos de energía sobrantes, los transforma en dados de ilusión.' }]},
  internet:  { name:'Internet',  element:'proteccion',     set:'BTC',  category:'BTC',   hp:5,  emoji:'🌐', img:'img/internet.png',  concept:'Un set con el propósito de resistir...', abilities:[{ type:'normal', icon:'⚔️', name:'Orden', cost:'x1 dado de protección, x2 dados cualesquiera', effect:'Inflige 2 puntos de daño.' },{ type:'elemental', icon:'🔮', name:'Daga de Ola', cost:'x3 dados de protección', effect:'Inflige 3 puntos de daño e Internet obtiene un escudo.' },{ type:'ultimate', icon:'💥', name:'Fase de Limpieza', cost:'x3 dados de protección, x3 puntos de energía', effect:'Inflige 2 de daño a todo el equipo rival. Si con este golpe no se logra derrotar al activo del rival, Internet recibe 2 puntos de daño. Sin embargo, si eliminas al objetivo, robas una carta de tu mazo.' },{ type:'passive', icon:'🛡️', name:'Orgullo de la Creadora', effect:'Cuando baje hasta 2 puntos de vida, gana inmediatamente 1 punto de energía de forma automática.' },{ type:'ex', icon:'🌟', name:'EX · Último Recurso', effect:'Si su vida es de 2 puntos o menos, sus habilidades cuestan 1 dado menos y duplican su daño.' }]},
  google:    { name:'Google',    element:'comprension',    set:'BTC',  category:'BTC',   hp:10, emoji:'🔍', img:'img/google.png',    concept:'', abilities:[{ type:'normal', icon:'⚔️', name:'Consulta Rápida', cost:'x1 dado de comprensión, x1 dado cualquiera', effect:'Inflige 1 punto de daño al enemigo activo.' },{ type:'elemental', icon:'🔮', name:'Android', cost:'x3 dados de comprensión', effect:'Inflige 1 punto de daño penetrante al enemigo activo y coloca la estructura "Android" (2 rondas).' },{ type:'ultimate', icon:'💥', name:'Descanso Mental', cost:'x3 dados de comprensión, x2 puntos de energía', effect:'Cura 2 puntos de vida a todos los aliados y elimina todos los efectos sobre Google.' },{ type:'passive', icon:'🛡️', name:'Carga de Información', effect:'Si Google está activo al inicio de la ronda, el dado menos relevante se transforma en omnidado, pero Google sufre 1 punto de daño penetrante al final de la ronda.' },{ type:'ex', icon:'🌟', name:'Infraestructura Conectada', effect:'Cuando Google cambia a otro personaje, el nuevo personaje activo obtiene un escudo de 1 punto de vida.' }]},
  facebook:  { name:'Facebook',  element:'aceptacion',     set:'BTC',  category:'BTC',   hp:11, emoji:'📘', img:'img/facebook.png',  concept:'', abilities:[{ type:'normal', icon:'⚔️', name:'Buscando un Equilibrio', cost:'x1 dado de aceptación, x1 dado cualquiera', effect:'Inflige 1 punto de daño al enemigo activo.' },{ type:'elemental', icon:'🔮', name:'Protocolo de Seguridad', cost:'x4 dados de aceptación', effect:'Se otorga a sí mismo un escudo de 2 puntos de vida y reduce en 1 dado el coste de la siguiente carta.' },{ type:'ultimate', icon:'💥', name:'Pilar Fundamental', cost:'x3 dados de aceptación, x3 puntos de energía', effect:'Inflige 3 puntos de daño al enemigo activo. Si la estructura "Meta Quest" no estaba ya activa, la coloca (2 rondas).' },{ type:'passive', icon:'🛡️', name:'Mente Metódica', effect:'Si Facebook está activo al inicio de la ronda, el dado menos relevante se transforma en un dado de Aceptación.' },{ type:'ex', icon:'🌟', name:'Informes de Rendimiento', effect:'Al final de cada ronda, si ningún personaje de tu equipo fue derrotado, robas 1 carta de tu mazo.' }]},
  x: { name:'X', element:'transformacion', set:'BTC', category:'BTC', hp:11, emoji:'✖️', img:'img/x.png', concept:'', abilities:[
    { type:'normal', icon:'⚔️', name:'Zasca', cost:'x1 dado de Transformación, x2 dados cualesquiera', effect:'Inflige 2 puntos de daño físico y aplica Irritación al enemigo activo durante esa ronda. Mientras un personaje enemigo tenga Irritación, cada habilidad o carta que use cuesta 1 dado genérico extra.' },
    { type:'elemental', icon:'🔮', name:'Circo Mediático', cost:'x3 dados de Transformación', effect:'Otorga a X Provocación (el rival debe dirigir todos sus ataques hacia X durante esa ronda, pero pierde 1 de energía al activarse) y 2 puntos de escudo.' },
    { type:'ultimate', icon:'💥', name:'Sublevación', cost:'x3 dados de Transformación, x3 puntos de energía', effect:'Inflige 4 puntos de daño elemental al activo enemigo y destruye 2 dados aleatorios del oponente.' },
    { type:'passive', icon:'🛡️', name:'Superviviente de las Profundidades', effect:'La primera vez por partida que X fuera a recibir un golpe letal, su vida se queda en 1 en lugar de caer.' },
    { type:'ex', icon:'🌟', name:'EX · Consumidor de Dramas', effect:'Al comienzo de cada ronda, robas 1 carta adicional de tu mazo.' }
  ]},

  youtube: { name:'YouTube', element:'expresion', set:'BTC', category:'BTC', hp:9, emoji:'📺', img:'img/youtube.png', concept:'', abilities:[
    { type:'normal', icon:'⚔️', name:'All eyes on me!', cost:'x2 dados de Expresión, x1 dado cualquiera', effect:'Causa 1 punto de daño. Si está en forma Idol, marca al rival con Expresión.' },
    { type:'elemental', icon:'🔮', name:'Hot To Go!', cost:'x4 dados de Expresión', effect:'Causa 2 de daño elemental al activo (3 si está en forma Idol). Si está en forma Casual, recibe 2 de Popularidad. Si al usarla cambia de forma, recibe 2 dados de Expresión.' },
    { type:'ultimate', icon:'💥', name:'The World Is Mine', cost:'x5 dados de Expresión, x3 puntos de energía, x1 punto de Popularidad', effect:'Causa 2 de daño elemental penetrante al activo enemigo y 1 a los demás. Aumenta en 1 el daño elemental al activo por cada 2 puntos de Popularidad.' },
    { type:'passive', icon:'🛡️', name:'Fame', effect:'Gana Popularidad: +2 la primera vez en la ronda que entra activamente al combate, +1 las siguientes, +1 si la ronda comienza activa y sin ninguna marca. Pierde: -1 cada vez que recibe un ataque, -1 si la ronda comienza activa pero tiene alguna marca. Cambia de forma: <5 Popularidad → Casual, ≥5 Popularidad → Idol. Popularidad máx. 7.' },
    { type:'ex', icon:'🌟', name:'EX · Money, Money, Money', effect:'El rival recibe 1 estructura Monetización (3 usos) al inicio. Desde la ronda 2, si YouTube comienza la ronda activa, su Popularidad se congela esa ronda y coloca/refuerza Monetización con 1 uso. Monetización: las cartas del rival cuestan 1 dado genérico extra; pierde 1 uso por cada carta que juegue el rival.' }
  ]},

  traductor: { name:'Traductor', element:'ilusion', set:'BTC', category:'BTC', hp:10, emoji:'🗣️', img:'img/traductor.png', concept:'', abilities:[
    { type:'normal', icon:'⚔️', name:'Little Boo-Boo', cost:'x1 dado de Ilusión, x2 dados cualesquiera', effect:'Inflige 2 de daño al rival. Si tiene Paillettes activo, genera 1 punto de escudo acumulable (máx. 3).' },
    { type:'elemental', icon:'🔮', name:'Plüschtier', cost:'x4 dados de Ilusión', effect:'Crea Plüschhase en tu mano (coste 0). Al usar Plüschhase: cura 3 HP al activo e inyecta Plüschbär en el mazo rival. Al robar Plüschbär: 2 daño al activo rival + lo marca con Ilusión + inyecta Plüschkatze en tu mazo. Al robar Plüschkatze: cura 1 HP a todo tu equipo.' },
    { type:'ultimate', icon:'💥', name:'Petite Étoile', cost:'x3 dados de Ilusión, x2 puntos de energía', effect:'Hace 3 de daño al rival y aplica Paillettes a Traductor (mientras dure el combate, cada ataque normal genera 1 punto de escudo, hasta 3).' },
    { type:'passive', icon:'🛡️', name:'Freundschaft', effect:'Cada vez que tú o tu rival robáis y activáis una carta de peluche (Plüschhase, Plüschbär, Plüschkatze), Traductor recibe 1 punto de energía.' },
    { type:'ex', icon:'🌟', name:'EX · Étoile', effect:'Con Paillettes activo, el daño de tu Ataque Normal aumenta en 1 punto adicional.' }
  ]},

  instagram: { name:'Instagram', element:'expresion', set:'BTC', category:'BTC', hp:10, emoji:'📸', img:'img/instagram.png', concept:'', comingSoon:true, abilities:[] },
  whatsapp:  { name:'WhatsApp',  element:'ilusion',   set:'BTC', category:'BTC', hp:10, emoji:'💬', img:'img/whatsapp.png', concept:'', comingSoon:true, abilities:[] },
  /* Próximamente */
  vittoria: { name:'Vittoria', element:'aceptacion', set:'Erik', category:'HNN', hp:10, emoji:'👑', img:'img/vittoria.png', concept:'Aún recuerdo un día de playa con mi padre en el que me senté frente a la orilla y una ola enorme me tumbó al suelo. Mis ojos escocían demasiado y me puse a llorar. Lo único que oía era a mi padre riéndose de mí. De alguna forma esa memoria se me hace extrañamente nostálgica; me reafirma mi lugar en este mundo. -Att. Erik.', abilities:[
    { type:'normal', icon:'⚔️', name:'Habilidad normal', cost:'3 dados de aceptación', effect:'Causa 1 de daño normal al enemigo activo. Si el enemigo muere a partir de este ataque, Vittoria recibe de vuelta los dados invertidos en la habilidad.' },
    { type:'elemental', icon:'🔮', name:'Aceptación', cost:'3 dados de aceptación', effect:'Si el enemigo activo está marcado con Aceptación, Vittoria recibe 2 puntos de vida. Si no está marcado, causa 1 punto de daño penetrante y lo marca con Aceptación.' },
    { type:'ultimate', icon:'💥', name:'DEJA DE MIRARME CON ESOS OJOS', cost:'4 dados de aceptación, 3 puntos de energía', effect:'Los aliados y el enemigo activo reciben el efecto "Visto". Si Vittoria sigue viva al final de la ronda, todos los personajes con "Visto" se reparten 6 puntos de daño penetrante (a partes iguales) y pierden el efecto. Si no sigue viva, se reparten 12 puntos de daño penetrante (misma lógica), pierden el efecto y Vittoria revive con 1 punto de vida. Si ella es la última en morir en este turno, el daño y la resurrección no se aplican.' },
    { type:'passive', icon:'🛡️', name:'CÁLLATE, CÁLLATE, CÁLLATE, POR DIOS', effect:'Si un aliado ha sido derrotado, todas sus habilidades cuestan 1 dado menos y comienza la ronda con 1 dado menos en la fase de lanzamiento. Si ambos aliados han sido derrotados, todas sus habilidades cuestan 1 dado (excluyendo la definitiva) y comienza la ronda con 3 dados menos.' },
    { type:'ex', icon:'🌟', name:'EX · GRACIAS', effect:'Comienza la ronda con 1 dado más en la fase de lanzamiento.' }
  ]},
  sage: { name:'Sage', element:'redencion', set:'Erik', category:'HNN', hp:12, emoji:'🐴', img:'img/sage.png',
    concept: "El incendio se levanta con la flama de sus pasos. Sus herraduras arden, queman, reducen a ceniza aquello que tocan con su gracia cuando la dama galopa. A todo aquel que se interponga en su camino, pobre de él, pobre de ella, pobres de ambos cuando choquen, le pido mi más sentido, dolido, pésame.",
    abilities: [
      { type:'normal', icon:'⚔️', name:"Galope pasional de la gracia del señor", cost:'x2 dados de Redención, x2 dados cualesquiera (+1 por carga de Decidida)', effect:'Causa 3 de daño normal (+1 por carga de Decidida).' },
      { type:'elemental', icon:'🔮', name:"Relincho al coro del infierno entero", cost:'x4 dados de Redención', effect:'Desequipa un objeto al rival y lo cambia al siguiente. Si el rival estaba desequipado, lo marca con Transformación.' },
      { type:'ultimate', icon:'💥', name:"Mis caenas', prendidas fuego, sobre to' sus muertos", cost:'x2 dados de Redención, x3 puntos de energía', effect:'Requiere 3 cargas de Decidida. Todos los enemigos reciben 2 de daño normal (4 si Sage entró al campo este turno). Pierde todos sus efectos (no las marcas) y recibe 1 de daño por cada efecto perdido.' },
      { type:'passive', icon:'🛡️', name:"La gracia del caballo con cuernos de toro", effect:'Cambiar a Sage cuesta 1 dado adicional, le quita 1 HP y la marca con Decidida. Cambiar de Sage a un aliado es gratis.' },
      { type:'ex', icon:'🌟', name:"EX · Brava caída desde la torre de Babel", effect:'La definitiva reduce en 3 el daño que Sage recibe por la pérdida de efectos. Cambiar de Sage a un aliado es acción rápida y quita 1 HP a Sage.' }
    ]
  },
  david:   { name:'David',    element:'redencion',      set:'Erik', category:'HNN', hp:11, emoji:'🏹', img:'img/david.png',    comingSoon:true, abilities:[] },
  ah:      { name:'A/H',      element:'ilusion',        set:'Erik', category:'HNN', hp:11, emoji:'🎩', img:'img/ah.png',       comingSoon:true, abilities:[] },
  felicia: { name:'Felicia',  element:'expresion',      set:'Erik', category:'HNN', hp:11, emoji:'🎀', img:'img/felicia.png',  comingSoon:true, abilities:[] },
  erikxd:  { name:'ErikXD',   element:'proteccion',     set:'Erik', category:'HNN', hp:11, emoji:'😎', img:'img/erikxd.png',   comingSoon:true, abilities:[] },
  bella:   { name:'Bella',    element:'transformacion', set:'Erik', category:'HNN', hp:11, emoji:'🦢', img:'img/bella.png',    comingSoon:true, abilities:[] },
  esmeralda:{ name:'Esmeralda', element:'aceptacion',   set:'Erik', category:'HNN', hp:11, emoji:'💎', img:'img/esmeralda.png', comingSoon:true, abilities:[] },
  iris: { name:'Iris', element:'proteccion', set:'Erik', category:'HNN', hp:11, emoji:'🌈', img:'img/iris.png', concept:'', abilities:[
    { type:'normal', icon:'⚔️', name:'Suela a la Cara', cost:'1 dado de protección, 3 dados cualesquiera', effect:'Causa 2 puntos de daño al enemigo activo. En caso de tener equipación, causa 1 punto de daño adicional por cada equipación y rompe dicha equipación.' },
    { type:'elemental', icon:'🔮', name:'Advertencia', cost:'4 dados de protección', effect:'Recibe un escudo de 3 puntos de vida que se destruye al final de la ronda si no ha sido destruido. Cambia al siguiente aliado activo. Por el resto de la ronda, los ataques a sus aliados otorgan al enemigo atacante 1 carga adicional de "Advertido" y dichos ataques son dirigidos hacia Iris con 1 punto adicional de daño.' },
    { type:'ultimate', icon:'💥', name:'Líder de Puño de Hierro', cost:'4 dados de protección, 2 puntos de energía', effect:'Si el enemigo tiene cargas de "Advertido", golpea a dicho enemigo con su ataque normal, aumentando el daño de dicho ataque en 2 puntos. Si el enemigo no tiene cargas de "Advertido", los aliados reciben el efecto "Buen Recaudo" y recibe ella misma 2 puntos de escudo.' },
    { type:'passive', icon:'🛡️', name:'Lealtad Imbatible', effect:'Si un aliado es atacado bajo efecto "Buen Recaudo", el daño final lo recibe ella y el enemigo atacante obtiene una carga de "Advertido". Si un enemigo no puede recibir más cargas de "Advertido" y obtiene una carga de "Advertido", es marcado con "Protección" alternativamente.' },
    { type:'ex', icon:'🌟', name:'EX · Lealtad Insaciable', effect:'El efecto de "Advertido" es acumulable hasta 1 carga. Si ataca a un enemigo con cargas de "Advertido", aumenta su daño en 2 puntos por dicha carga y le quita la carga de "Advertido" al enemigo.' }
  ]},
  amaya:   { name:'Amaya',    element:'comprension',    set:'Erik', category:'HNN', hp:11, emoji:'🦉', img:'img/amaya.png',    comingSoon:true, abilities:[] },
  eve:     { name:'Eve',      element:'comprension',    set:'Erik', category:'HNN', hp:11, emoji:'🍎', img:'img/eve.png',      comingSoon:true, abilities:[] },
  opal:    { name:'Opal',     element:'expresion',      set:'Erik', category:'HNN', hp:11, emoji:'💠', img:'img/opal.png',     comingSoon:true, abilities:[] },
};
