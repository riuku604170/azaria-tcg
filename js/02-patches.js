/* ═══ SISTEMA DE AVISOS (Anuncios + Novedades) ═══ */

// ═══════════ NOVEDADES (parches) ═══════════
var PATCHES = [
{
  version: 'BETA 1.8',
  date: '2026-11-13',
  type: 'minor',
  title: 'Arreglos varios',
  changes: [
    'Arreglados algunos personajes de la categoría HNN.',
    'Óliver nerfeado.'
  ]  
},
{
  version: 'BETA 1.7',
  date: '2026-11-12',
  type: 'minor',
  title: 'Mejoras del bot, ajustes y nuevos personajes, temas y plantillas de guardado',
  changes: [
    'El bot ahora cambia cartas.',
    'El equipo y mazo del bot se elige con lógia',
    '4 dificultades de combate contra la IA.',
    'Ahora pueden compartirse las plantillas de guardado.',
    'Añadidas Felicia, David, Opal, Eve y ErikXD (HNN).',
    'Óliver arreglado y nerfeado.',
    'Añadidos temas y ajustes del menú.'
  ]  
},
{
  version: 'BETA 1.6',
  date: '2026-11-11',
  type: 'mayor',
  title: 'Mejoras de combate, opciones, arreglos y guía para el jugador',
  changes: [
    'Guía, tutorial y botón orientativo disponibles.',
    'Mejorado el bot (Ahora sí).',
    'Añadidas estadísticas y tiempo por turno.',
    'Mejorado visualmente el combate (Cartas y redistribución).',
    'Desafíos próximamente.',
    'Ex visibles antes de seleccionar.',
    'Confirmación que permite guardado al salir del combate y no antes.',
    'Arreglos en algunos personajes.'
  ]  
},
{
  version: 'BETA 1.5',
  date: '2026-11-09',
  type: 'mayor',
  title: 'Nuevos personajes, arreglos visuales y de menú',
  changes: [
    'Cartas de personaje ahora mejor diseñadas.',
    'Añadidos X, YouTube0 y Traductor (BTC).',
    'Añadida Sage (Eriks).',
    'Añadidos a próximos personajes: Whatsapp e Instagram (BTC).',
    'Añadido apartado de Ayuda, pendiente.', 
    'Cambio de respuestas de Erik y Amaya a Ilusión.',
    'Nota: Código de la tienda - AZARIATCG.'
  ]  
},
{
  version: 'BETA 1.4',
  date: '2026-11-08',
  type: 'mayor',
  title: 'Arreglos visuales y de funcionamiento, nuevos próximos personajes/categorías, tienda y ajustes del menú',
  changes: [
    'Arreglados los botones para comenzar partida.',
    'Ahora visibles los cambios de los usuarios en el menú.',
    'Añadidos a próximos usuarios: Amsa, Gabo, Vicky y Víctor.',
    'Añadida la tienda (no funcional ahora mismo, solo referencia).',
    'Reajustes en menú y cartas.',
    'Nuevas categorías: Lusior y Azaria.'
  ]  
},
{
  version: 'BETA 1.4',
  date: '2026-11-07',
  type: 'minor',
  title: 'Rebalanceo, bot, arreglos y mejoras visuales',
  changes: [
    'Rebalanceo y arreglos en Alaya.',
    'Arreglo de las plantillas de combate.',
    'Mejorado el bot.',
    'Arreglo en las habilidades de VIttoria.'
  ]  
},
{
  version: 'BETA 1.3',
  date: '2026-11-06',
  type: 'minor',
  title: 'Nuevo personaje, ajustes en combate y mejoras visuales',
  changes: [
    'Añadida Vittoria (Eriks).',
    'Añadidos números flotantes y pop-ups de las habilidades en combate.',
    'Facilitado el acceso a la información de las habilidades durante el combate.',
    'Mejorado el aspecto de selección de personaje y EX durante el combate.',
    'Solucionados problemas con el uso de habilidades',
    'Establecido límite de escudos y origen de cada uno.'
  ]  
},
{
  version: 'BETA 1.2',
  date: '2026-11-05',
  type: 'mayor',
  title: 'Nuevo personaje y novedades en los usuarios',
  changes: [
    'Añadida Iris (Eriks).',
    'Reescritura y rebalanceo de los sets de los 12 usuarios actuales.',
    'Display de información de los usuarios más cómodo.',
    'Arreglos en las habilidades de algunos usuarios.',
    'Añadidas EX de todos los personajes jugables restantes.'
  ]  
},
{
  version: 'BETA 1.1',
  date: '2026-11-04',
  type: 'minor',
  title: 'Arreglos de flujo, navegación, personajes, Sandbox y mejoras visuales',
  changes: [
    'Añadidos NC (Eriks), Google (BTC) y Facebook (BTC).',
    'Rebalanceo y arreglos de Neón, María y NC.',
    'Arreglados todos los personajes de la categoría BTC (Internet, Google, Facebook).',
    'Flujo de combate más cómodo y sencillo de entender.',
    'Añadidos visuales a los efectos de algunas acciones pasivas.',
    'Mejorada la comodidad de navegación en el menú.',
    'EX ahora posibles en el modo Sandbox.'
  ]
},
];

// ═══════════ ANUNCIOS ═══════════
// Cada anuncio necesita un `id` único. El más reciente debe ir PRIMERO.
// Al añadir uno nuevo arriba, el badge ! aparecerá automáticamente.
var ANNOUNCEMENTS = [
{
  id: 'ann_2026_11_09_1',
  date: '2026-11-09',
  icon: '💎',
  title: 'La tienda de artículos',
  body: [
    '-¡Venga Manolo, que vamos tarde!',
    '-Vámonos que nos vamos, Antonio...',
    '-Manolo, ¿tienes idea de cuánto se han perdido por aquí?',
    '-Perdona, Antonio, es que el cercanías estaba hoy un poco cansado.',
    '-Manolo... Que han pasado días, Manolo.',
    '-Ni que nosotros fuéramos los del parte del día, de eso ya se encarga el colega.',
    '-Venga, hombre, venga...',
    '-Bueno pues vams a comentar, ¿no Antonio?',
    '-Pues claro que sí, Manolo. Tenemos rediseños, algunos ajustes, cambios, mejoras...',
    '-Yo creo que lo más importante tira para lo de la tienda, Antonio.',
    '-Casi que sí, Manolo. Me dicen que ahora el bot además es mejor.',
    '-¿Para qué te voy a mentir, Antonio? Yo creo que el bot está apollardado.',
    '-Será que yo no sé jugar, ¿verdad, Manolo?',
    '-Evidentemente, Antonio. Y bueno, bueno... ¿Qué le han hecho a los usuarios? Madre mía...',
    '-Van a meter nuevos usuarios, además de todos los demás personajes que han estado metiendo hasta ahora.',
    '-No, gilipollas. Todo el mundo se ha llevado un disgusto encima, les han bajado la vida y subido el coste de las habilidades a la mayoría, Antonio.',
    '-Si es que estaban demasiado duros todos, yo ya lo decía. A mí me da igual, porque ya no juego con usuarios desde la última vez que lo mencionamos.',
    '-Pues vaya disgusto que te vas a comer, Antonio... ¡Los van a quitar a todos!',
    '-Me cachis en la mar, Manolo...',
    '-Todos van a ir a la tienda cuando el juego deje de ser una beta. Además, los personajes de la categoría Azaria no van a ser jugables hasta que llegue la primera versión oficial, Antonio.',
    '-¿Y cómo va a probar el esclavo del desarrollador los personajes?',
    '-La verdad es que no lo sé, habrá que consultarlo al pinganillo.',
    '-Mientras tanto, comunico para los espectadores que no lo sepan. Usad el código AZARIATCG en la tienda para obtener a todos los personajes nuevos que saquen durante la beta.',
    '-Exceptuando a los de Azaria, e incluyendo a los de la nueva categoría, actualmente vacía. Los personajes de Lusior.',
    '-¿Y esos están bien, Antonio?',
    '-Que no ha salido ninguno, hombre. Que parece que no escuchas, tontopolla.',
    '-Hombre, pero algún chivatazo habrá, ¿no?',
    'Pues fíjate que sí, Manolo. Personajes como Pepe el Siluro, Pete, Hector, y algunos más.',
    '-De mientras, créete que me han dado otro chivatazo por el pinganillo, Antononio... Sobre los personajes de Azaria. Que hay un código para esos, dicen.',
    '-¿Y sabemos el código, Manolo?',
    '-De eso no tengo ni idea, Antonio.',
    '-Pues para eso no dices nada, adefesio. Que encima eres más feo que pegarle a un padre, Manolo.',
    '-Sin lugar a duda, Antonio.',
    '-¿Tenemos más novedades para próximas actualizaciones, Manolo?',
    '-Pues si no me equivoco, para la próxima vez que aparezcamos por aquí, Antonio, tendremos nuevos modos de juego y personajes en todas las categorías.',
    '-Eso son muy buenas noticias, Manolo.',
    '-Dicho esto, aquí nos despedimos, espectadores espectantes. Nos vemos en la siguiente actualización...',
    '-Con Paco y Manolo.',
    '-Picha, a ver si nos aprendemos el nombrecito de los cojones.',
    '-Perdón, perdón...'
  ]
},
{
  id: 'ann_2026_11_05_1',
  date: '2026-11-05',
  icon: '🎂',
  title: '¡Japi Berdei Vicky!',
  body: [
    '-Bueno bueno Manolo, ¿pero qué está pasando aquí? Madre mía...',
    '-Bueno Antonio, lo veo y no lo creo, que le han metido esteroides al menú, no me lo puedo creer.',
    '-A ver Manolo, yo creo que estás exagerango un poco, ¿eh? Pero vamos, que ahora los personajes son más cómodos de ver.',
    '-¡Sin lugar a duda, Antonio! Además, me han dicho que por ahí ha habido un rebalanceo curioso...',
    '-Pues yo creo que Manuel se tendría que haber quedado como estaba, Manolo, ¿para qué te voy a mentir? Las cosas como son...',
    '-Yo era main Abla, Antonio.',
    '-Joder, pobrecito... Imagínate yo que dependía de Noah y parece que le han descuartizado la elemental, Manolo.',
    '-A ver si el impresentable este es más benevolente con nosotros en la próxima actualización...',
    '-Claro que sí... ¿Ya viste las EX funcionando y sus nombres? Farmean aura, no me digas que no.',
    '-La verdad es que ni me va ni me viene, yo voy a probar al nuevo personaje...',
    '-¿¡CÓMO!?',
    '-Que sí, que sí, que han metido a la buenorra de Iris al juego, Antonio, te lo juro.',
    '-Es cierto... ¿Y por qué Iris?',
    '-¡Pues me están diciendo por el pinganillo que es el cumpleaños de una fan!',
    '-¡Aguaa! Pues desde aquí le deseamos muchas felicidades a la cumpleañera, ¿verdad Manolo?',
    '-Como siempre, Antonio, y que cumpla muchos más... Nos vemos en la siguiente actualización...',
    '-Con Paco y Manolo.',
    '-Que tú te llamas Antonio, gilipollas...',
    '-Lleva razón.'
  ]
},
{
  id: 'ann_2026_11_04_3',
  date: '2026-11-04',
  icon: '🔥',
  title: 'Fuck DeepSeek',
  body: 'Agárrense el culito mis pequeños, se viene cambio gordo en el menú de personajes y rebalanceo de los mismos. Voy primero con los Usuarios (mis 12 peones, ¡¡OUH YEAH!!).'
},
{
  id: 'ann_2026_11_04_2',
  date: '2026-11-04',
  icon: '🎭',
  title: 'Próximamente: nuevo personaje',
  body: 'Estamos preparando un nuevo personaje que se unirá al roster en la próxima actualización. Mantente atento a las Novedades para más detalles.'
},
{
  id: 'ann_2026_11_04_1',
  date: '2026-11-04',
  icon: '📢',
  title: 'Bienvenido a la sección Avisos',
  body: 'Esta sección reúne los anuncios generales del juego (pestaña Anuncios) y el historial completo de cambios (pestaña Novedades).'
}
];

var PATCH_TYPE_LABEL = { major: 'Major', minor: 'Minor', fix: 'Fix', balance: 'Balance' };
var PATCHES_SEEN_KEY = 'azaria_patches_seen_version';
var ANNOUNCEMENTS_SEEN_KEY = 'azaria_announcements_seen_version';

// ── Estado de las pestañas ──
var activeAvisosTab = 'novedades'; // 'anuncios' | 'novedades'

// ═══════════ NOVEDADES (parches) ═══════════
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
function hasUnseenPatches() {
  var latest = getLatestPatchVersion();
  if (!latest) return false;
  return latest !== getSeenPatchVersion();
}
function markPatchesAsSeen() {
  var latest = getLatestPatchVersion();
  if (latest) setSeenPatchVersion(latest);
  refreshAvisosBadges();
}

// ═══════════ ANUNCIOS ═══════════
function getLatestAnnouncementId() {
  if (!Array.isArray(ANNOUNCEMENTS) || !ANNOUNCEMENTS.length) return null;
  return ANNOUNCEMENTS[0].id || null;
}
function getSeenAnnouncementId() {
  try { return localStorage.getItem(ANNOUNCEMENTS_SEEN_KEY); } catch (e) { return null; }
}
function setSeenAnnouncementId(v) {
  try { localStorage.setItem(ANNOUNCEMENTS_SEEN_KEY, v); } catch (e) {}
}
function hasUnseenAnnouncements() {
  var latest = getLatestAnnouncementId();
  if (!latest) return false;
  return latest !== getSeenAnnouncementId();
}
function markAnnouncementsAsSeen() {
  var latest = getLatestAnnouncementId();
  if (latest) setSeenAnnouncementId(latest);
  refreshAvisosBadges();
}

// ═══════════ BADGES ═══════════
function refreshAvisosBadges() {
  // Badge principal del nav (visible si hay novedades en CUALQUIER pestaña)
  var mainBadge = document.getElementById('patchesNewBadge');
  if (mainBadge) mainBadge.hidden = !(hasUnseenPatches() || hasUnseenAnnouncements());

  // Badge de cada pestaña
  var tabAnn = document.getElementById('tabAnnouncementsBadge');
  if (tabAnn) tabAnn.hidden = !hasUnseenAnnouncements();
  var tabNov = document.getElementById('tabNovedadesBadge');
  if (tabNov) tabNov.hidden = !hasUnseenPatches();
}
// Alias por compatibilidad (por si algo externo llama a refreshPatchesBadge)
function refreshPatchesBadge() { refreshAvisosBadges(); }

// ═══════════ RENDER ═══════════
function buildPatchesHTML() {
  if (!PATCHES.length) {
    return '<div style="text-align:center; color: var(--muted); font-style: italic; padding: 2rem;">Aún no hay parches registrados.</div>';
  }
  return PATCHES.map(function(p, i) {
    var isLatest = i === 0;
    var typeCls = isLatest ? 'latest' : (p.type || 'minor');
    var typeLabel = isLatest ? 'Última' : (PATCH_TYPE_LABEL[p.type] || 'Cambios');
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

function buildAnnouncementsHTML() {
  if (!ANNOUNCEMENTS.length) {
    return '<div style="text-align:center; color: var(--muted); font-style: italic; padding: 2rem;">No hay anuncios por ahora.</div>';
  }
  return ANNOUNCEMENTS.map(function(a, i) {
    var isLatest = i === 0;
    // body puede ser string (una línea) o array (varias líneas)
    var bodyHtml = '';
    if (Array.isArray(a.body)) {
      bodyHtml = a.body.map(function(line){
        return '<div class="announcement-line">' + line + '</div>';
      }).join('');
    } else {
      bodyHtml = '<div class="announcement-line">' + (a.body || '') + '</div>';
    }
    return '<div class="announcement-entry' + (isLatest ? ' latest' : '') + '">' +
      '<div class="announcement-entry-head">' +
        (a.icon ? '<span class="announcement-icon">' + a.icon + '</span>' : '') +
        '<span class="announcement-title">' + (a.title || '') + '</span>' +
        '<span class="announcement-date">' + (a.date || '') + '</span>' +
      '</div>' +
      '<div class="announcement-body">' + bodyHtml + '</div>' +
    '</div>';
  }).join('');
}

function renderAvisosContent() {
  var body = document.getElementById('patchesBody');
  if (!body) return;
  if (activeAvisosTab === 'anuncios') body.innerHTML = buildAnnouncementsHTML();
  else body.innerHTML = buildPatchesHTML();
}
// Alias por compatibilidad
function renderPatches() { renderAvisosContent(); }

// ═══════════ TABS ═══════════
function switchAvisosTab(tab) {
  if (tab !== 'anuncios' && tab !== 'novedades') return;
  if (activeAvisosTab === tab) return;

  // Marcar la pestaña que dejamos como vista
  if (activeAvisosTab === 'anuncios') markAnnouncementsAsSeen();
  else if (activeAvisosTab === 'novedades') markPatchesAsSeen();

  activeAvisosTab = tab;

  document.querySelectorAll('.avisos-tab').forEach(function(btn){
    btn.classList.toggle('active', btn.dataset.avisosTab === tab);
  });

  renderAvisosContent();
  refreshAvisosBadges();
}

// ═══════════ ABRIR / CERRAR ═══════════
function openPatchesModal() {
  var m = document.getElementById('patchesModal');
  if (!m) return;

  // Auto-switch: si la pestaña actual está al día pero la otra tiene novedades, abre la que tiene novedades.
  var hasUnseenCurrent = (activeAvisosTab === 'anuncios') ? hasUnseenAnnouncements() : hasUnseenPatches();
  if (!hasUnseenCurrent) {
    if (activeAvisosTab === 'novedades' && hasUnseenAnnouncements()) activeAvisosTab = 'anuncios';
    else if (activeAvisosTab === 'anuncios' && hasUnseenPatches()) activeAvisosTab = 'novedades';
  }

  renderAvisosContent();
  document.querySelectorAll('.avisos-tab').forEach(function(btn){
    btn.classList.toggle('active', btn.dataset.avisosTab === activeAvisosTab);
  });

  m.classList.add('open');
  document.body.style.overflow = 'hidden';
  refreshAvisosBadges();
}

function closePatchesModal() {
  // Marcar la pestaña activa como vista al cerrar
  if (activeAvisosTab === 'anuncios') markAnnouncementsAsSeen();
  else if (activeAvisosTab === 'novedades') markPatchesAsSeen();

  var m = document.getElementById('patchesModal');
  if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
}

// ═══════════ INIT ═══════════
function initPatches() {
  var link = document.getElementById('patchesNavLink');
  if (link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      openPatchesModal();
    });
  }

  var m = document.getElementById('patchesModal');
  if (m) {
    var closeBtn = document.getElementById('patchesCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closePatchesModal);
    var backdrop = m.querySelector('.patches-backdrop');
    if (backdrop) backdrop.addEventListener('click', closePatchesModal);
  }

  document.querySelectorAll('.avisos-tab').forEach(function(btn){
    btn.addEventListener('click', function(){
      switchAvisosTab(btn.dataset.avisosTab);
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var modal = document.getElementById('patchesModal');
      if (modal && modal.classList.contains('open')) closePatchesModal();
    }
  });

  refreshAvisosBadges();
}
