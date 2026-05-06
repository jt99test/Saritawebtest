export type HouseMessage = {
  houseNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  areaOfLife: string;
  lunaNueva: {
    subtitle: string;
    baseMessage: string;
  };
  lunaLlena: {
    subtitle: string;
    baseMessage: string;
  };
};

export const houseMessages: HouseMessage[] = [
  {
    houseNumber: 1,
    areaOfLife: "Identidad · Cuerpo · Imagen personal",
    lunaNueva: {
      subtitle: "Sembrar",
      baseMessage:
        "Nueva versión de ti misma. Cambio de imagen, actitud o forma de presentarte al mundo.",
    },
    lunaLlena: {
      subtitle: "Cerrar",
      baseMessage:
        "Soltar una vieja identidad, creencia o hábito que ya no te representa.",
    },
  },
  {
    houseNumber: 2,
    areaOfLife: "Recursos · Dinero · Valores personales",
    lunaNueva: {
      subtitle: "Sembrar",
      baseMessage:
        "Nueva fuente de ingresos, relación con el dinero o valor propio.",
    },
    lunaLlena: {
      subtitle: "Cerrar",
      baseMessage:
        "Dejar ir el apego material, una deuda emocional o un valor que ya no es tuyo.",
    },
  },
  {
    houseNumber: 3,
    areaOfLife: "Comunicación · Aprendizaje · Entorno cercano",
    lunaNueva: {
      subtitle: "Sembrar",
      baseMessage:
        "Nuevo proyecto de escritura, curso, conversación importante o relación con hermanos.",
    },
    lunaLlena: {
      subtitle: "Cerrar",
      baseMessage:
        "Cerrar una conversación pendiente, terminar un ciclo de estudio o soltar un patrón de comunicación.",
    },
  },
  {
    houseNumber: 4,
    areaOfLife: "Hogar · Familia · Raíces emocionales",
    lunaNueva: {
      subtitle: "Sembrar",
      baseMessage:
        "Cambio en el hogar, reconciliación familiar o conexión con tus raíces.",
    },
    lunaLlena: {
      subtitle: "Cerrar",
      baseMessage:
        "Dejar ir un patrón familiar heredado, una vieja herida del hogar o una dinámica familiar limitante.",
    },
  },
  {
    houseNumber: 5,
    areaOfLife: "Creatividad · Amor · Hijos · Juego",
    lunaNueva: {
      subtitle: "Sembrar",
      baseMessage:
        "Nuevo proyecto creativo, romance o relación con tus hijos. Más espacio para el juego.",
    },
    lunaLlena: {
      subtitle: "Cerrar",
      baseMessage:
        "Cerrar una relación amorosa, terminar un proyecto creativo o soltar el miedo a brillar.",
    },
  },
  {
    houseNumber: 6,
    areaOfLife: "Salud · Rutinas · Trabajo cotidiano",
    lunaNueva: {
      subtitle: "Sembrar",
      baseMessage:
        "Nueva rutina de salud, cambio de hábitos o nuevo servicio profesional.",
    },
    lunaLlena: {
      subtitle: "Cerrar",
      baseMessage:
        "Dejar ir un hábito dañino, una dinámica laboral tóxica o el perfeccionismo excesivo.",
    },
  },
  {
    houseNumber: 7,
    areaOfLife: "Relaciones · Pareja · Socios",
    lunaNueva: {
      subtitle: "Sembrar",
      baseMessage:
        "Nueva relación o etapa en una relación existente. Nuevo socio o colaboración.",
    },
    lunaLlena: {
      subtitle: "Cerrar",
      baseMessage:
        "Cerrar una relación, soltar la dependencia del otro o terminar una sociedad.",
    },
  },
  {
    houseNumber: 8,
    areaOfLife: "Transformación · Sexualidad · Herencias · Crisis",
    lunaNueva: {
      subtitle: "Sembrar",
      baseMessage:
        "Proceso de transformación profunda. Nuevo ciclo después de una crisis. Tema de herencias.",
    },
    lunaLlena: {
      subtitle: "Cerrar",
      baseMessage:
        "Soltar el control, el miedo a la muerte o al cambio, una obsesión o un poder mal utilizado.",
    },
  },
  {
    houseNumber: 9,
    areaOfLife: "Filosofía · Viajes · Estudios superiores · Expansión",
    lunaNueva: {
      subtitle: "Sembrar",
      baseMessage:
        "Nuevo viaje, estudio superior, creencia o visión del mundo.",
    },
    lunaLlena: {
      subtitle: "Cerrar",
      baseMessage:
        "Dejar ir una creencia limitante, un dogma o la necesidad de tener siempre la razón.",
    },
  },
  {
    houseNumber: 10,
    areaOfLife: "Carrera · Vocación · Reputación pública",
    lunaNueva: {
      subtitle: "Sembrar",
      baseMessage:
        "Nuevo objetivo profesional, cambio de rol público o paso en la carrera.",
    },
    lunaLlena: {
      subtitle: "Cerrar",
      baseMessage:
        "Cerrar una etapa profesional, soltar la necesidad de aprobación externa o cambiar de vocación.",
    },
  },
  {
    houseNumber: 11,
    areaOfLife: "Amistades · Grupos · Proyectos colectivos · Sueños",
    lunaNueva: {
      subtitle: "Sembrar",
      baseMessage:
        "Nuevo círculo social, proyecto colectivo o sueño de futuro.",
    },
    lunaLlena: {
      subtitle: "Cerrar",
      baseMessage:
        "Dejar ir amistades que no te nutren, un grupo que ya no te corresponde o un sueño que no era tuyo.",
    },
  },
  {
    houseNumber: 12,
    areaOfLife: "Inconsciente · Retiro · Espiritualidad · Sanación",
    lunaNueva: {
      subtitle: "Sembrar",
      baseMessage:
        "Proceso de retiro interior, sanación, meditación o conexión espiritual.",
    },
    lunaLlena: {
      subtitle: "Cerrar",
      baseMessage:
        "Soltar miedos inconscientes, patrones de autosabotaje o cargas emocionales acumuladas.",
    },
  },
];

const houseMessagesEn: HouseMessage[] = [
  { houseNumber: 1, areaOfLife: "Identity · Body · Personal image", lunaNueva: { subtitle: "Begin", baseMessage: "A new version of yourself. A shift in image, attitude, or how you present yourself to the world." }, lunaLlena: { subtitle: "Release", baseMessage: "Let go of an old identity, belief, or habit that no longer represents you." } },
  { houseNumber: 2, areaOfLife: "Resources · Money · Personal values", lunaNueva: { subtitle: "Begin", baseMessage: "A new source of income, relationship with money, or sense of self-worth." }, lunaLlena: { subtitle: "Release", baseMessage: "Let go of material attachment, emotional debt, or a value that is no longer yours." } },
  { houseNumber: 3, areaOfLife: "Communication · Learning · Close environment", lunaNueva: { subtitle: "Begin", baseMessage: "A new writing project, course, important conversation, or sibling dynamic." }, lunaLlena: { subtitle: "Release", baseMessage: "Close a pending conversation, finish a learning cycle, or release a communication pattern." } },
  { houseNumber: 4, areaOfLife: "Home · Family · Emotional roots", lunaNueva: { subtitle: "Begin", baseMessage: "A change at home, family reconciliation, or a deeper connection with your roots." }, lunaLlena: { subtitle: "Release", baseMessage: "Let go of an inherited family pattern, an old home wound, or a limiting family dynamic." } },
  { houseNumber: 5, areaOfLife: "Creativity · Love · Children · Play", lunaNueva: { subtitle: "Begin", baseMessage: "A new creative project, romance, or relationship with children. More room for play." }, lunaLlena: { subtitle: "Release", baseMessage: "Close a love story, finish a creative project, or release the fear of being seen." } },
  { houseNumber: 6, areaOfLife: "Health · Routines · Daily work", lunaNueva: { subtitle: "Begin", baseMessage: "A new health routine, habit change, or professional service rhythm." }, lunaLlena: { subtitle: "Release", baseMessage: "Let go of a harmful habit, toxic work dynamic, or excessive perfectionism." } },
  { houseNumber: 7, areaOfLife: "Relationships · Partner · Agreements", lunaNueva: { subtitle: "Begin", baseMessage: "A new relationship or stage in an existing one. A new partner, client, or collaboration." }, lunaLlena: { subtitle: "Release", baseMessage: "Close a relationship, release dependency on the other, or end an agreement." } },
  { houseNumber: 8, areaOfLife: "Transformation · Sexuality · Shared resources · Crisis", lunaNueva: { subtitle: "Begin", baseMessage: "A deep transformation process. A new cycle after crisis, or a theme around shared resources." }, lunaLlena: { subtitle: "Release", baseMessage: "Let go of control, fear of change, an obsession, or power used in an unhealthy way." } },
  { houseNumber: 9, areaOfLife: "Philosophy · Travel · Higher studies · Expansion", lunaNueva: { subtitle: "Begin", baseMessage: "A new trip, higher study, belief, or worldview." }, lunaLlena: { subtitle: "Release", baseMessage: "Let go of a limiting belief, dogma, or the need to always be right." } },
  { houseNumber: 10, areaOfLife: "Career · Vocation · Public reputation", lunaNueva: { subtitle: "Begin", baseMessage: "A new professional goal, public role change, or career step." }, lunaLlena: { subtitle: "Release", baseMessage: "Close a professional stage, release the need for external approval, or change vocation." } },
  { houseNumber: 11, areaOfLife: "Friendships · Groups · Collective projects · Dreams", lunaNueva: { subtitle: "Begin", baseMessage: "A new social circle, collective project, or future dream." }, lunaLlena: { subtitle: "Release", baseMessage: "Let go of friendships that do not nourish you, a group that no longer fits, or a dream that was not yours." } },
  { houseNumber: 12, areaOfLife: "Unconscious · Retreat · Spirituality · Healing", lunaNueva: { subtitle: "Begin", baseMessage: "A process of inner retreat, healing, meditation, or spiritual connection." }, lunaLlena: { subtitle: "Release", baseMessage: "Let go of unconscious fears, self-sabotage patterns, or accumulated emotional weight." } },
];

const houseMessagesIt: HouseMessage[] = [
  { houseNumber: 1, areaOfLife: "Identita · Corpo · Immagine personale", lunaNueva: { subtitle: "Inizio", baseMessage: "Una nuova versione di te. Un cambio di immagine, atteggiamento o modo di presentarti al mondo." }, lunaLlena: { subtitle: "Rilascio", baseMessage: "Lascia andare una vecchia identita, credenza o abitudine che non ti rappresenta piu." } },
  { houseNumber: 2, areaOfLife: "Risorse · Denaro · Valori personali", lunaNueva: { subtitle: "Inizio", baseMessage: "Una nuova fonte di reddito, relazione con il denaro o senso del tuo valore." }, lunaLlena: { subtitle: "Rilascio", baseMessage: "Lascia andare un attaccamento materiale, un debito emotivo o un valore che non e piu tuo." } },
  { houseNumber: 3, areaOfLife: "Comunicazione · Apprendimento · Ambiente vicino", lunaNueva: { subtitle: "Inizio", baseMessage: "Un nuovo progetto di scrittura, corso, conversazione importante o dinamica con fratelli e sorelle." }, lunaLlena: { subtitle: "Rilascio", baseMessage: "Chiudi una conversazione in sospeso, termina un ciclo di studio o lascia un modello comunicativo." } },
  { houseNumber: 4, areaOfLife: "Casa · Famiglia · Radici emotive", lunaNueva: { subtitle: "Inizio", baseMessage: "Un cambiamento in casa, una riconciliazione familiare o una connessione piu profonda con le tue radici." }, lunaLlena: { subtitle: "Rilascio", baseMessage: "Lascia andare uno schema familiare ereditato, una vecchia ferita domestica o una dinamica limitante." } },
  { houseNumber: 5, areaOfLife: "Creativita · Amore · Figli · Gioco", lunaNueva: { subtitle: "Inizio", baseMessage: "Un nuovo progetto creativo, una storia d'amore o un rapporto con i figli. Piu spazio per il gioco." }, lunaLlena: { subtitle: "Rilascio", baseMessage: "Chiudi una relazione amorosa, termina un progetto creativo o lascia la paura di brillare." } },
  { houseNumber: 6, areaOfLife: "Salute · Routine · Lavoro quotidiano", lunaNueva: { subtitle: "Inizio", baseMessage: "Una nuova routine di salute, un cambio di abitudini o un nuovo ritmo professionale." }, lunaLlena: { subtitle: "Rilascio", baseMessage: "Lascia andare un'abitudine dannosa, una dinamica lavorativa tossica o il perfezionismo eccessivo." } },
  { houseNumber: 7, areaOfLife: "Relazioni · Partner · Accordi", lunaNueva: { subtitle: "Inizio", baseMessage: "Una nuova relazione o fase in un legame esistente. Un nuovo partner, cliente o collaborazione." }, lunaLlena: { subtitle: "Rilascio", baseMessage: "Chiudi una relazione, lascia la dipendenza dall'altro o termina un accordo." } },
  { houseNumber: 8, areaOfLife: "Trasformazione · Sessualita · Risorse condivise · Crisi", lunaNueva: { subtitle: "Inizio", baseMessage: "Un processo di trasformazione profonda. Un nuovo ciclo dopo una crisi o un tema di risorse condivise." }, lunaLlena: { subtitle: "Rilascio", baseMessage: "Lascia il controllo, la paura del cambiamento, un'ossessione o un potere usato male." } },
  { houseNumber: 9, areaOfLife: "Filosofia · Viaggi · Studi superiori · Espansione", lunaNueva: { subtitle: "Inizio", baseMessage: "Un nuovo viaggio, studio superiore, credenza o visione del mondo." }, lunaLlena: { subtitle: "Rilascio", baseMessage: "Lascia una credenza limitante, un dogma o il bisogno di avere sempre ragione." } },
  { houseNumber: 10, areaOfLife: "Carriera · Vocazione · Reputazione pubblica", lunaNueva: { subtitle: "Inizio", baseMessage: "Un nuovo obiettivo professionale, cambio di ruolo pubblico o passo di carriera." }, lunaLlena: { subtitle: "Rilascio", baseMessage: "Chiudi una fase professionale, lascia il bisogno di approvazione esterna o cambia vocazione." } },
  { houseNumber: 11, areaOfLife: "Amicizie · Gruppi · Progetti collettivi · Sogni", lunaNueva: { subtitle: "Inizio", baseMessage: "Un nuovo cerchio sociale, progetto collettivo o sogno futuro." }, lunaLlena: { subtitle: "Rilascio", baseMessage: "Lascia amicizie che non ti nutrono, un gruppo che non ti corrisponde piu o un sogno non tuo." } },
  { houseNumber: 12, areaOfLife: "Inconscio · Ritiro · Spiritualita · Guarigione", lunaNueva: { subtitle: "Inizio", baseMessage: "Un processo di ritiro interiore, guarigione, meditazione o connessione spirituale." }, lunaLlena: { subtitle: "Rilascio", baseMessage: "Lascia paure inconsce, schemi di autosabotaggio o pesi emotivi accumulati." } },
];

export function getHouseMessages(locale?: string): HouseMessage[] {
  if (locale === "en") return houseMessagesEn;
  if (locale === "it") return houseMessagesIt;
  return houseMessages;
}
