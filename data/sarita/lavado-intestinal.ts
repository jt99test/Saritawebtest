import { asanaImages } from "./asana-image-mapping";
import type { Asana } from "./yoga-routines";

export type LavadoIntestinalProtocol = {
  title: string;
  subtitle: string;
  preparation: string;
  protocol: string[];
  asanas: Asana[];
  timing: {
    momento: string;
    duracion: string;
    descanso: string;
    alimentacion: string;
  };
  precautions: string;
  benefits: string;
  threeDayDiet: {
    description: string;
    days: {
      day: number;
      meals: {
        type: "desayuno" | "almuerzo" | "cena";
        primary: string;
        alternative: string;
      }[];
    }[];
  };
};

export const lavadoIntestinal: LavadoIntestinalProtocol = {
  title: "Lavado intestinal corto",
  subtitle: "Laghoo Shankhaprakshala · Guía de acompañamiento al vídeo tutorial",
  preparation:
    "Prepara 2 litros de agua tibia con 20 ml de sal (aproximadamente 4 cucharaditas). El agua debe estar a temperatura corporal y la sal bien disuelta. Esta solución actúa como conductor natural que activa el peristaltismo intestinal.",
  protocol: [
    "Beber rápidamente dos vasos de agua salada tibia.",
    "Realizar las 5 asanas de Shankhaprakshala 8 veces cada una (ver sección de asanas abajo).",
    "Beber dos vasos más y repetir las asanas (8 veces cada una).",
    "Repetir el proceso una tercera y última vez.",
    "Ir al baño sin forzar. El movimiento intestinal puede ser inmediato o llegar más tarde.",
  ],
  asanas: [
    {
      slug: "tadasana",
      element: "tierra",
      nameSanskrit: "Tadasana",
      nameSpanish: "Postura de la montaña",
      description: "",
      duration: "8 repeticiones",
      warning: "Evita bloquear las rodillas y reduce la velocidad si aparece mareo por el agua salada.",
      imagePath: asanaImages.tadasana ?? null,
    },
    {
      slug: "tiryaka-tadasana",
      element: "aire",
      nameSanskrit: "Tiryaka Tadasana",
      nameSpanish: "Flexión lateral",
      description: "",
      duration: "8 repeticiones",
      warning: "Mantén el abdomen suave. Evita inclinarte profundo si hay dolor lumbar, costal o vértigo.",
      imagePath: null,
    },
    {
      slug: "kati-chakrasana",
      element: "fuego",
      nameSanskrit: "Kati Chakrasana",
      nameSpanish: "Giro de cintura",
      description: "",
      duration: "8 repeticiones",
      warning: "Gira desde la cintura sin forzar cuello ni rodillas. Evita torsiones fuertes en embarazo o hernia discal.",
      imagePath: null,
    },
    {
      slug: "tiryaka-bhujangasana",
      element: "fuego",
      nameSanskrit: "Tiryaka Bhujangasana",
      nameSpanish: "Cobra con giro",
      description: "",
      duration: "8 repeticiones",
      warning: "Evita si hay dolor lumbar agudo, embarazo avanzado o lesión cervical. Mantén codos suaves.",
      imagePath: null,
    },
    {
      slug: "udarakarshanasana",
      element: "agua",
      nameSanskrit: "Udarakarshanasana",
      nameSpanish: "Compresión abdominal",
      description: "",
      duration: "8 repeticiones",
      warning: "No comprimas el abdomen con dolor digestivo intenso, embarazo, cirugía reciente o molestias de rodilla.",
      imagePath: null,
    },
  ],
  timing: {
    momento:
      "Por la mañana con el estómago completamente vacío, antes de cualquier alimento o bebida.",
    duracion: "Reservar aproximadamente 1 hora para toda la práctica.",
    descanso:
      "Al finalizar, reposar 30 minutos antes de tomar cualquier alimento o bebida.",
    alimentacion:
      "No se requieren restricciones alimentarias especiales antes ni después de esta práctica corta.",
  },
  precautions:
    "Esta practica pertenece a una categoria de limpieza digestiva, no a una secuencia regular de asanas. Puede alterar hidratacion y equilibrio de sales si se fuerza o se repite sin criterio. No practicar en embarazo, menstruacion, hernias, ulceras, enfermedad intestinal inflamatoria, enfermedad cardiaca o renal, hipertension no controlada, recuperacion postquirurgica, dolor abdominal agudo o cualquier condicion medica digestiva. Detenerse si aparece mareo, debilidad, nauseas intensas, palpitaciones o dolor. No forzar el movimiento intestinal en ningun momento y consultar con un profesional de salud si existe cualquier duda.",
  benefits:
    "A diferencia del método completo que vacía todo el sistema digestivo, el lavado corto estimula el funcionamiento normal de los intestinos. Es un método excelente, sencillo y suave que puede incorporarse como práctica habitual de higiene digestiva.\n\nPrácticas adicionales opcionales: Kunjal Kriya y Jala Neti pueden realizarse inmediatamente después de completar la técnica.",
  threeDayDiet: {
    description:
      "Beber al menos 1,5–2 litros de agua al día para potenciar la acción de las fibras. Estas propuestas son orientativas: tómalas como inspiración y adapta los alimentos a tu gusto y necesidades.",
    days: [
      {
        day: 1,
        meals: [
          {
            type: "desayuno",
            primary:
              "Porridge de avena con manzana o pera fresca y semillas de chía.",
            alternative:
              "Yogur natural con muesli integral y frutos del bosque.",
          },
          {
            type: "almuerzo",
            primary:
              "Ensalada de quinoa con garbanzos, tomates cherry, pepino y espinacas.",
            alternative:
              "Arroz integral con alubias negras y verduras a la plancha.",
          },
          {
            type: "cena",
            primary: "Ensalada de lentejas con aguacate, tomates y cebolla.",
            alternative: "Remolacha en ensalada con hummus de berenjenas.",
          },
        ],
      },
      {
        day: 2,
        meals: [
          {
            type: "desayuno",
            primary:
              "Tostadas de pan integral con aguacate y semillas de sésamo.",
            alternative: "Smoothie de fruta con avena y semillas de lino.",
          },
          {
            type: "almuerzo",
            primary: "Farro con calabacín, pimientos y col rizada.",
            alternative:
              "Cuscús integral con verduras al vapor y garbanzos.",
          },
          {
            type: "cena",
            primary: "Berenjena y calabacín a la plancha con hummus.",
            alternative: "Verduras salteadas con alubias blancas.",
          },
        ],
      },
      {
        day: 3,
        meals: [
          {
            type: "desayuno",
            primary: "Tortitas integrales con plátano y canela.",
            alternative: "Yogur vegetal con copos de avena y frutos secos.",
          },
          {
            type: "almuerzo",
            primary:
              "Ensalada de espinacas, lentejas, zanahorias y pepitas de calabaza.",
            alternative: "Pasta integral con brócoli y garbanzos.",
          },
          {
            type: "cena",
            primary: "Sopa de verduras de temporada con legumbres.",
            alternative: "Crema de calabaza con semillas y pan de centeno.",
          },
        ],
      },
    ],
  },
};
