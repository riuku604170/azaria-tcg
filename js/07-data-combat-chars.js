var COMBAT_CHARS = {
  alaya: { name:'Alaya', element:'redencion', emoji:'🌹', hp:10, abilities: { 
    normal:{ name:'Autolesión', cost:{redencion:1, any:1}, target:'self', kind:'autolesion', selfDamage:1, energy:1 }, 
    elemental:{ name:'Penitencia', cost:{redencion:2}, target:'self', kind:'penitencia', energy:1 }, 
    ultimate:{ name:'El Fin del Comienzo', cost:{redencion:3}, energyCost:3, target:'enemy', kind:'finComienzo' },
    ex:{ name:'EX · Repetición del Fin', kind:'ex', target:'self', oncePerGame:true }
  }},
  oliver: { name:'Óliver', element:'comprension', emoji:'🧠', hp:11, abilities: {
    normal: { name:'Corrección', cost:{comprension:1, any:1}, target:'enemy', kind:'damage', damage:1, energy:1 },
    elemental: { name:'Optimización', cost:{comprension:3}, target:'self', kind:'optimizacion', energy:1 },
    ultimate: { name:'Obra Maestra', cost:{comprension:4}, energyCost:2, target:'self', kind:'obraMaestra' },
    ex: { name:'EX · Perfeccionamiento Absoluto', kind:'ex', target:'self' }
  }},
  erik: { name:'Erik', element:'expresion', emoji:'🎨', hp:10, abilities: { normal:{ name:'Trazo Vivo', cost:{expresion:2, any:1}, target:'enemy', kind:'trazoVivo', damage:1, energy:1 }, elemental:{ name:'Interpretación', cost:{expresion:3}, target:'self', kind:'interpretacion', selfDamage:1, energy:1 }, ultimate:{ name:'Lienzo de Sangre', cost:{expresion:3}, energyCost:2, target:'self', kind:'lienzoSangre' }, ex: { name:'EX · Paleta Inagotable', kind:'ex', target:'self' } }},
  tenshi: { name:'Tenshi', element:'proteccion', emoji:'⚔️', hp:11, abilities: { normal:{ name:'Intervención', cost:{proteccion:2, any:1}, target:'enemy', kind:'intervencion', damage:2, energy:1 }, elemental:{ name:'Bajo mis Alas', cost:{proteccion:3}, target:'self', kind:'bajoAlas', energy:1 }, ultimate:{ name:'Suficiente', cost:{proteccion:4}, energyCost:3, target:'enemy', kind:'suficiente' }, ex: { name:'EX · Resguardo Divino', kind:'ex', target:'self' } }},
  eloy: { name:'Eloy', element:'comprension', emoji:'📖', hp:12, abilities: { normal:{ name:'Análisis', cost:{comprension:1, any:2}, target:'enemy', kind:'damage', damage:2, energy:0 }, elemental:{ name:'Hipótesis Sólida', cost:{comprension:4}, target:'self', kind:'hipotesisSolida', energy:0 }, ultimate:{ name:'Conclusión', cost:{comprension:3}, energyCost:3, target:'self', kind:'conclusion' }, ex: { name:'EX · Dominio Intelectual', kind:'ex', target:'self' } }},
  eevee: { name:'Eevee', element:'proteccion', emoji:'🦊', hp:10, abilities: { normal:{ name:'Advertencia', cost:{proteccion:1, any:2}, target:'enemy', kind:'damage', damage:2, energy:1 }, elemental:{ name:'Defensa Activa', cost:{proteccion:4}, target:'self', kind:'defensaActiva', energy:1 }, ultimate:{ name:'Contraofensiva', cost:{proteccion:3}, energyCost:2, target:'enemy', kind:'contraofensiva' }, ex: { name:'EX · Territorial', kind:'ex', target:'self' } }},
  ren: { name:'Ren', element:'ilusion', emoji:'🌀', hp:10, abilities: { normal:{ name:'Error', cost:{ilusion:1, any:2}, target:'enemy', kind:'damage', damage:2, energy:1 }, elemental:{ name:'Inconsistencia', cost:{ilusion:5}, target:'enemy', kind:'inconsistencia', energy:1 }, ultimate:{ name:'Destrucción de Lógica', cost:{ilusion:4}, energyCost:3, target:'enemy', kind:'destruccionLogica' }, ex: { name:'EX · Espejismo', kind:'ex', target:'self' } }},
  noah: { name:'Noah', element:'proteccion', emoji:'⚓', hp:12, abilities: { normal:{ name:'Latido', cost:{proteccion:1, any:1}, target:'enemy', kind:'damage', damage:1, energy:1 }, elemental:{ name:'Eco Vital', cost:{proteccion:3}, target:'self', kind:'ecoVital', energy:1 }, ultimate:{ name:'Armonía', cost:{proteccion:3}, energyCost:3, target:'self', kind:'armonia' }, ex: { name:'EX · Vibración Compasiva', kind:'ex', target:'self' } }},
  abla: { name:'Abla', element:'redencion', emoji:'🗡️', hp:10, abilities: { normal:{ name:'Rencor', cost:{redencion:1, any:2}, target:'enemy', kind:'damage', damage:2, energy:1 }, elemental:{ name:'Deuda de Sangre', cost:{redencion:4}, target:'enemy', kind:'deudaSangre', energy:1 }, ultimate:{ name:'Retribución Final', cost:{redencion:3}, energyCost:3, target:'enemy', kind:'retribucionFinal' }, ex: { name:'EX · Sangría Persistente', kind:'ex', target:'self' } }},
  manuel: { name:'Manuel', element:'redencion', emoji:'⚡', hp:11, abilities: { normal:{ name:'Ruptura', cost:{redencion:2, any:2}, target:'enemy', kind:'damage', damage:3, energy:1 }, elemental:{ name:'Degradación', cost:{redencion:5}, target:'enemy', kind:'degradacion', energy:1 }, ultimate:{ name:'Decadencia', cost:{redencion:3}, energyCost:2, target:'self', kind:'decadencia' }, ex: { name:'EX · Caos Acelerado', kind:'ex', target:'self' } }},
  jose: { name:'Jose', element:'transformacion', emoji:'🦋', hp:10, abilities: { normal:{ name:'Acelerón', cost:{transformacion:2, any:1}, target:'enemy', kind:'aceleron', energy:1 }, elemental:{ name:'Impulso', cost:{transformacion:3}, target:'self', kind:'impulso', energy:1 }, ultimate:{ name:'Instinto', cost:{transformacion:4}, energyCost:2, target:'enemy', kind:'instinto' }, ex: { name:'EX · Inercia', kind:'ex', target:'self' } }},
  josemi: { name:'Josemi', element:'expresion', emoji:'🎤', hp:10, abilities: { normal:{ name:'Esbozo', cost:{expresion:1, any:2}, target:'enemy', kind:'damage', damage:2, energy:1 }, elemental:{ name:'Reescritura', cost:{expresion:3}, target:'enemy', kind:'reescritura', energy:1 }, ultimate:{ name:'Canon', cost:{expresion:5}, energyCost:2, target:'self', kind:'canon' }, ex: { name:'EX · Arquitectura Creativa', kind:'ex', target:'self' } }},
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
    normal: { name:'Scratch', cost:{ilusion:1, any:2}, target:'enemy', kind:'scratch', damage:1, energy:1 },
    elemental: { name:'Remix', cost:{ilusion:4}, target:'self', kind:'remix', energy:1 },
    ultimate: { name:'Killer Tunes', cost:{ilusion:4}, energyCost:3, target:'self', kind:'killerTunes' },
    ex: { name:'EX · Sobrecarga', kind:'ex', target:'self' }
  }},
  maria: { name:'María', element:'aceptacion', emoji:'🌺', hp:8, abilities: {
    normal: { name:'Cosecha', cost:{aceptacion:1, any:2}, target:'enemy', kind:'cosecha', damage:1, energy:1 },
    elemental: { name:'Caricia', cost:{aceptacion:4}, target:'self', kind:'caricia', energy:1 },
    ultimate: { name:'Amor', cost:{aceptacion:5}, energyCost:3, target:'self', kind:'amor' },
    ex: { name:'EX · Recuerdo', kind:'ex', target:'self' }
  }},
  exmaria: { name:'EX-María', element:'aceptacion', emoji:'🌺', hp:8, abilities: {
    normal: { name:'Es acaso el roce posible', cost:{aceptacion:1, any:1}, target:'enemy', kind:'rocePosible', damage:1, energy:1 },
    elemental: { name:'Es acaso tu amor verdadero', cost:{aceptacion:3}, target:'self', kind:'amorVerdadero', energy:1 },
    ultimate: { name:'Es acaso mi amor suficiente', cost:{aceptacion:4}, energyCost:2, target:'self', kind:'amorSuficiente' }
  }},
  nc: { name:'NC', element:'proteccion', emoji:'🎯', hp:12, abilities: {
    normal: { name:'Lectura', cost:{proteccion:1, any:2}, target:'enemy', kind:'lectura', damage:1, energy:0 },
    elemental: { name:'Interpretación', cost:{proteccion:3}, target:'self', kind:'interpretacionNC', energy:0 },
    ultimate: { name:'Sobre-exageración', cost:{proteccion:4}, energyCost:4, target:'enemy', kind:'sobreExageracion', energy:0 },
    ex: { name:'EX · Desquite artístico', kind:'ex', target:'self' }
  }},
  google: { name:'Google', element:'comprension', emoji:'🔍', hp:10, abilities: {
    normal: { name:'Consulta Rápida', cost:{comprension:1, any:1}, target:'enemy', kind:'damage', damage:1, energy:1 },
    elemental: { name:'Android', cost:{comprension:3}, target:'enemy', kind:'android', damage:1, piercing:true, energy:1 },
    ultimate: { name:'Descanso Mental', cost:{comprension:3}, energyCost:2, target:'self', kind:'descansoMental' },
    ex: { name:'EX · Infraestructura Conectada', kind:'ex', target:'self' }
  }},
  facebook: { name:'Facebook', element:'aceptacion', emoji:'📘', hp:11, abilities: {
    normal: { name:'Buscando un Equilibrio', cost:{aceptacion:1, any:1}, target:'enemy', kind:'damage', damage:1, energy:1 },
    elemental: { name:'Protocolo de Seguridad', cost:{aceptacion:4}, target:'self', kind:'protocoloSeguridad', energy:1, shieldSelf:2 },
    ultimate: { name:'Pilar Fundamental', cost:{aceptacion:3}, energyCost:3, target:'enemy', kind:'pilarFundamental', damage:3 },
    ex: { name:'EX · Informes de Rendimiento', kind:'ex', target:'self' }
  }},
  iris: { name:'Iris', element:'proteccion', emoji:'🌈', hp:11, abilities: {
    normal: { name:'Suela a la Cara', cost:{proteccion:1, any:3}, target:'enemy', kind:'suelaALaCara', damage:2, energy:1 },
    elemental: { name:'Advertencia', cost:{proteccion:4}, target:'self', kind:'irisAdvertencia', energy:1 },
    ultimate: { name:'Líder de Puño de Hierro', cost:{proteccion:4}, energyCost:2, target:'enemy', kind:'liderPunoHierro' },
    ex: { name:'EX · Lealtad Insaciable', kind:'ex', target:'self' }
  }},
  vittoria: { name:'Vittoria', element:'aceptacion', emoji:'👑', hp:10, abilities: {
    normal: { name:'Habilidad normal', cost:{aceptacion:3}, target:'enemy', kind:'vittoriaNormal', damage:1, energy:1 },
    elemental: { name:'Aceptación', cost:{aceptacion:3}, target:'enemy', kind:'vittoriaAceptacion', energy:1 },
    ultimate: { name:'DEJA DE MIRARME CON ESOS OJOS', cost:{aceptacion:4}, energyCost:3, target:'self', kind:'vistoUltimate' },
    ex: { name:'EX · GRACIAS', kind:'ex', target:'self' }
  }},
};
