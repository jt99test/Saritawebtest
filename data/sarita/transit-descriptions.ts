export type TransitDescription = {
  planet: string;
  relevance: string;
  significantAngles: string[];
  description: string;
};

export const transitDescriptions: Record<string, TransitDescription> = {
  Saturno: {
    planet: "Saturno",
    relevance: "Saturno no castiga: pide que seas adulto/a en ese área. Si algo depende de una conversación seria, un límite o una decisión práctica, no conviene seguir aplazándolo.",
    significantAngles: ["conjunction", "opposition", "square", "trine"],
    description: "Toca poner orden en algo concreto: un compromiso, una deuda, una rutina o un límite que no has puesto todavía. Lo vas a notar porque lo que antes podías dejar para luego ahora empieza a pesar.",
  },
  Júpiter: {
    planet: "Júpiter",
    relevance: "Júpiter pasa rápido: no lo uses como excusa para esperar a que todo se coloque solo. Si aparece una puerta, hay que moverse.",
    significantAngles: ["conjunction", "trine", "sextile"],
    description: "Hay más margen de lo que crees en esta área. Algo que veías cerrado puede abrirse si haces una llamada, propones algo o sales de la respuesta automática.",
  },
  Urano: {
    planet: "Urano",
    relevance: "Con Urano no hay mucho que controlar. Mejor tener la mente abierta que una agenda rígida.",
    significantAngles: ["conjunction", "opposition", "square"],
    description: "Algo va a cambiar sin que lo hayas planeado. Puede sentirse brusco o puede sentirse como alivio, pero te saca de una forma vieja de funcionar.",
  },
  Neptuno: {
    planet: "Neptuno",
    relevance: "Neptuno importa porque puede hacerte intuir algo verdadero y, a la vez, justificar lo que no quieres mirar. Comprueba los hechos antes de prometer o creer demasiado.",
    significantAngles: ["conjunction", "opposition", "square"],
    description: "Puede haber confusión, cansancio o una sensación de no saber exactamente qué quieres. También puede aparecer una necesidad real de descanso, silencio o distancia.",
  },
  Plutón: {
    planet: "Plutón",
    relevance: "Plutón se mueve despacio: esto no es de un mes. Es el fondo del año.",
    significantAngles: ["conjunction", "opposition", "square"],
    description: "Algo que llevas tiempo ignorando va a ser difícil de ignorar. Puede ser una relación, un hábito o una verdad que no has dicho en voz alta.",
  },
  Marte: {
    planet: "Marte",
    relevance: "Marte no dura mucho, pero se nota. Úsalo para actuar, no para explotar contra la primera persona que tengas delante.",
    significantAngles: ["conjunction", "opposition"],
    description: "Sube la urgencia: quieres resolver, contestar, decidir o cortar algo rápido. Si llevas semanas tragando una molestia, puede salir de golpe.",
  },
  Venus: {
    planet: "Venus",
    relevance: "Venus marca pequeñas decisiones que revelan mucho: con quién quedas, qué aceptas, qué compras y qué dejas de negociar contigo. No parece enorme, pero enseña tu escala real de valor.",
    significantAngles: ["conjunction", "opposition"],
    description: "Algo en vínculos, dinero o placer pide una elección sencilla: acercarte, pedir mejor trato o dejar de pagar un precio emocional que ya conoces. Lo notarás en conversaciones pequeñas, planes sociales o ganas de estar con alguien concreto.",
  },
};
