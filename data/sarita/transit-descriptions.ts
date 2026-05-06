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

const transitDescriptionsEn: Record<string, TransitDescription> = {
  Saturn: {
    planet: "Saturn",
    relevance: "Saturn does not punish; it asks for maturity in this area. If something depends on a serious conversation, boundary, or practical decision, it is better not to keep postponing it.",
    significantAngles: ["conjunction", "opposition", "square", "trine"],
    description: "It is time to bring order to something concrete: a commitment, debt, routine, or boundary that has not been set yet.",
  },
  Jupiter: {
    planet: "Jupiter",
    relevance: "Jupiter moves quickly; do not use it as an excuse to wait for everything to arrange itself. If a door opens, move.",
    significantAngles: ["conjunction", "trine", "sextile"],
    description: "There is more room than you think in this area. Something closed can open if you make a call, propose something, or leave the automatic answer.",
  },
  Uranus: {
    planet: "Uranus",
    relevance: "With Uranus there is not much to control. An open mind works better than a rigid agenda.",
    significantAngles: ["conjunction", "opposition", "square"],
    description: "Something may change without being planned. It can feel abrupt or relieving, but it pulls you out of an old way of operating.",
  },
  Neptune: {
    planet: "Neptune",
    relevance: "Neptune matters because it can reveal a true intuition and also justify what you do not want to see. Check the facts before promising or believing too much.",
    significantAngles: ["conjunction", "opposition", "square"],
    description: "There may be confusion, fatigue, or a sense of not knowing exactly what you want. There may also be a real need for rest, silence, or distance.",
  },
  Pluto: {
    planet: "Pluto",
    relevance: "Pluto moves slowly; this is not just about one month. It is part of the background of the year.",
    significantAngles: ["conjunction", "opposition", "square"],
    description: "Something you have ignored for a while becomes harder to ignore. It may be a relationship, habit, or truth you have not said aloud.",
  },
  Mars: {
    planet: "Mars",
    relevance: "Mars does not last long, but it is noticeable. Use it to act, not to explode at the first person in front of you.",
    significantAngles: ["conjunction", "opposition"],
    description: "Urgency rises: you want to solve, answer, decide, or cut something quickly. If you have been swallowing irritation, it can come out suddenly.",
  },
  Venus: {
    planet: "Venus",
    relevance: "Venus marks small choices that reveal a lot: who you see, what you accept, what you buy, and what you stop negotiating with yourself.",
    significantAngles: ["conjunction", "opposition"],
    description: "Something in bonds, money, or pleasure asks for a simple choice: come closer, ask for better treatment, or stop paying an emotional price you already know.",
  },
};

const transitDescriptionsIt: Record<string, TransitDescription> = {
  Saturno: {
    planet: "Saturno",
    relevance: "Saturno non punisce; chiede maturita in quell'area. Se qualcosa dipende da una conversazione seria, un limite o una decisione pratica, non conviene rimandare.",
    significantAngles: ["conjunction", "opposition", "square", "trine"],
    description: "E il momento di mettere ordine in qualcosa di concreto: un impegno, un debito, una routine o un limite non ancora posto.",
  },
  Giove: {
    planet: "Giove",
    relevance: "Giove passa in fretta: non usarlo come scusa per aspettare che tutto si sistemi da solo. Se si apre una porta, muoviti.",
    significantAngles: ["conjunction", "trine", "sextile"],
    description: "C'e piu margine di quanto pensi in questa area. Qualcosa che sembrava chiuso puo aprirsi se fai una proposta o esci dalla risposta automatica.",
  },
  Urano: {
    planet: "Urano",
    relevance: "Con Urano c'e poco da controllare. Meglio una mente aperta che un'agenda rigida.",
    significantAngles: ["conjunction", "opposition", "square"],
    description: "Qualcosa puo cambiare senza che tu lo abbia pianificato. Puo sembrare brusco o liberatorio, ma ti porta fuori da un vecchio funzionamento.",
  },
  Nettuno: {
    planet: "Nettuno",
    relevance: "Nettuno puo farti intuire qualcosa di vero e, allo stesso tempo, giustificare cio che non vuoi guardare. Controlla i fatti.",
    significantAngles: ["conjunction", "opposition", "square"],
    description: "Puo esserci confusione, stanchezza o la sensazione di non sapere esattamente cosa vuoi. Puo anche emergere un bisogno reale di riposo o distanza.",
  },
  Plutone: {
    planet: "Plutone",
    relevance: "Plutone si muove lentamente: non e solo un tema del mese. Fa parte dello sfondo dell'anno.",
    significantAngles: ["conjunction", "opposition", "square"],
    description: "Qualcosa che hai ignorato a lungo diventa difficile da ignorare: una relazione, un'abitudine o una verita non detta.",
  },
  Marte: {
    planet: "Marte",
    relevance: "Marte dura poco, ma si sente. Usalo per agire, non per esplodere contro la prima persona davanti a te.",
    significantAngles: ["conjunction", "opposition"],
    description: "Sale l'urgenza: vuoi risolvere, rispondere, decidere o tagliare qualcosa rapidamente.",
  },
  Venere: {
    planet: "Venere",
    relevance: "Venere segna piccole decisioni che rivelano molto: chi incontri, cosa accetti, cosa compri e cosa smetti di negoziare con te.",
    significantAngles: ["conjunction", "opposition"],
    description: "Qualcosa nei legami, nel denaro o nel piacere chiede una scelta semplice: avvicinarti, chiedere un trattamento migliore o non pagare piu un prezzo emotivo noto.",
  },
};

export function getTransitDescriptions(locale?: string) {
  if (locale === "en") return transitDescriptionsEn;
  if (locale === "it") return transitDescriptionsIt;
  return transitDescriptions;
}
