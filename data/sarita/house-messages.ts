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
