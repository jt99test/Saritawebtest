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
        type: string;
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
      imagePath: asanaImages["tiryaka-tadasana"] ?? null,
    },
    {
      slug: "kati-chakrasana",
      element: "fuego",
      nameSanskrit: "Kati Chakrasana",
      nameSpanish: "Giro de cintura",
      description: "",
      duration: "8 repeticiones",
      warning: "Gira desde la cintura sin forzar cuello ni rodillas. Evita torsiones fuertes en embarazo o hernia discal.",
      imagePath: asanaImages["kati-chakrasana"] ?? null,
    },
    {
      slug: "tiryaka-bhujangasana",
      element: "fuego",
      nameSanskrit: "Tiryaka Bhujangasana",
      nameSpanish: "Cobra con giro",
      description: "",
      duration: "8 repeticiones",
      warning: "Evita si hay dolor lumbar agudo, embarazo avanzado o lesión cervical. Mantén codos suaves.",
      imagePath: asanaImages["tiryaka-bhujangasana"] ?? null,
    },
    {
      slug: "udarakarshanasana",
      element: "agua",
      nameSanskrit: "Udarakarshanasana",
      nameSpanish: "Compresión abdominal",
      description: "",
      duration: "8 repeticiones",
      warning: "No comprimas el abdomen con dolor digestivo intenso, embarazo, cirugía reciente o molestias de rodilla.",
      imagePath: asanaImages.udarakarshanasana ?? null,
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

const lavadoIntestinalEn: LavadoIntestinalProtocol = {
  ...lavadoIntestinal,
  title: "Short intestinal cleanse",
  subtitle: "Laghoo Shankhaprakshala · Companion guide for the video tutorial",
  preparation:
    "Prepare 2 liters of warm water with 20 ml of salt, about 4 teaspoons. The water should be close to body temperature and the salt fully dissolved. This solution acts as a natural conductor that stimulates intestinal movement.",
  protocol: [
    "Drink two glasses of warm salted water quickly.",
    "Practice the 5 Shankhaprakshala asanas 8 times each.",
    "Drink two more glasses and repeat the asanas, 8 times each.",
    "Repeat the process a third and final time.",
    "Go to the bathroom without forcing. Bowel movement may happen immediately or later.",
  ],
  asanas: lavadoIntestinal.asanas.map((asana) => {
    const copy: Record<string, Partial<typeof asana>> = {
      tadasana: {
        nameSpanish: "Mountain pose",
        duration: "8 repetitions",
        warning: "Avoid locking the knees and slow down if the salted water makes you dizzy.",
      },
      "tiryaka-tadasana": {
        nameSpanish: "Side bend",
        duration: "8 repetitions",
        warning: "Keep the abdomen soft. Avoid deep bending if you have low-back, rib, or vertigo symptoms.",
      },
      "kati-chakrasana": {
        nameSpanish: "Waist twist",
        duration: "8 repetitions",
        warning: "Twist from the waist without forcing the neck or knees. Avoid strong twists during pregnancy or with a disc hernia.",
      },
      "tiryaka-bhujangasana": {
        nameSpanish: "Twisting cobra",
        duration: "8 repetitions",
        warning: "Avoid with acute low-back pain, advanced pregnancy, or neck injury. Keep the elbows soft.",
      },
      udarakarshanasana: {
        nameSpanish: "Abdominal compression",
        duration: "8 repetitions",
        warning: "Do not compress the abdomen with intense digestive pain, pregnancy, recent surgery, or knee discomfort.",
      },
    };
    return { ...asana, ...copy[asana.slug] };
  }),
  timing: {
    momento: "In the morning on a completely empty stomach, before any food or drink.",
    duracion: "Set aside about 1 hour for the full practice.",
    descanso: "After finishing, rest for 30 minutes before taking any food or drink.",
    alimentacion: "No special dietary restrictions are required before or after this short practice.",
  },
  precautions:
    "This practice belongs to digestive cleansing, not to a regular asana sequence. It can affect hydration and salt balance if forced or repeated without care. Do not practice during pregnancy, menstruation, hernias, ulcers, inflammatory bowel disease, heart or kidney disease, uncontrolled hypertension, post-surgical recovery, acute abdominal pain, or any digestive medical condition. Stop if dizziness, weakness, intense nausea, palpitations, or pain appear. Never force bowel movement and consult a health professional if you have any doubt.",
  benefits:
    "Unlike the complete method, which empties the whole digestive system, this short cleanse stimulates normal bowel function. It is a simple, gentle method that can be incorporated as a digestive hygiene practice.\n\nOptional additional practices: Kunjal Kriya and Jala Neti may be done immediately after completing the technique.",
  threeDayDiet: {
    description:
      "Drink at least 1.5-2 liters of water per day to support the action of fiber. These suggestions are orientative: use them as inspiration and adapt the foods to your taste and needs.",
    days: [
      {
        day: 1,
        meals: [
          { type: "breakfast", primary: "Oat porridge with fresh apple or pear and chia seeds.", alternative: "Natural yogurt with whole-grain muesli and berries." },
          { type: "lunch", primary: "Quinoa salad with chickpeas, cherry tomatoes, cucumber, and spinach.", alternative: "Brown rice with black beans and grilled vegetables." },
          { type: "dinner", primary: "Lentil salad with avocado, tomatoes, and onion.", alternative: "Beet salad with eggplant hummus." },
        ],
      },
      {
        day: 2,
        meals: [
          { type: "breakfast", primary: "Whole-grain toast with avocado and sesame seeds.", alternative: "Fruit smoothie with oats and flax seeds." },
          { type: "lunch", primary: "Farro with zucchini, peppers, and kale.", alternative: "Whole-grain couscous with steamed vegetables and chickpeas." },
          { type: "dinner", primary: "Grilled eggplant and zucchini with hummus.", alternative: "Sauteed vegetables with white beans." },
        ],
      },
      {
        day: 3,
        meals: [
          { type: "breakfast", primary: "Whole-grain pancakes with banana and cinnamon.", alternative: "Plant-based yogurt with oat flakes and nuts." },
          { type: "lunch", primary: "Spinach salad with lentils, carrots, and pumpkin seeds.", alternative: "Whole-grain pasta with broccoli and chickpeas." },
          { type: "dinner", primary: "Seasonal vegetable soup with legumes.", alternative: "Pumpkin cream with seeds and rye bread." },
        ],
      },
    ],
  },
};

const lavadoIntestinalIt: LavadoIntestinalProtocol = {
  ...lavadoIntestinalEn,
  title: "Lavaggio intestinale breve",
  subtitle: "Laghoo Shankhaprakshala · Guida di accompagnamento al video tutorial",
  preparation:
    "Prepara 2 litri di acqua tiepida con 20 ml di sale, circa 4 cucchiaini. L'acqua dovrebbe essere vicina alla temperatura corporea e il sale ben sciolto. Questa soluzione agisce come conduttore naturale che stimola il movimento intestinale.",
  protocol: [
    "Bevi rapidamente due bicchieri di acqua tiepida salata.",
    "Esegui le 5 asana di Shankhaprakshala 8 volte ciascuna.",
    "Bevi altri due bicchieri e ripeti le asana, 8 volte ciascuna.",
    "Ripeti il processo una terza e ultima volta.",
    "Vai in bagno senza forzare. Il movimento intestinale puo arrivare subito o piu tardi.",
  ],
  asanas: lavadoIntestinal.asanas.map((asana) => {
    const copy: Record<string, Partial<typeof asana>> = {
      tadasana: { nameSpanish: "Posizione della montagna", duration: "8 ripetizioni", warning: "Evita di bloccare le ginocchia e rallenta se l'acqua salata provoca capogiro." },
      "tiryaka-tadasana": { nameSpanish: "Flessione laterale", duration: "8 ripetizioni", warning: "Mantieni l'addome morbido. Evita inclinazioni profonde con dolore lombare, costale o vertigini." },
      "kati-chakrasana": { nameSpanish: "Torsione della vita", duration: "8 ripetizioni", warning: "Ruota dalla vita senza forzare collo o ginocchia. Evita torsioni forti in gravidanza o con ernia discale." },
      "tiryaka-bhujangasana": { nameSpanish: "Cobra con torsione", duration: "8 ripetizioni", warning: "Evita con dolore lombare acuto, gravidanza avanzata o lesione cervicale. Mantieni i gomiti morbidi." },
      udarakarshanasana: { nameSpanish: "Compressione addominale", duration: "8 ripetizioni", warning: "Non comprimere l'addome con dolore digestivo intenso, gravidanza, chirurgia recente o fastidio alle ginocchia." },
    };
    return { ...asana, ...copy[asana.slug] };
  }),
  timing: {
    momento: "Al mattino a stomaco completamente vuoto, prima di qualsiasi cibo o bevanda.",
    duracion: "Riserva circa 1 ora per tutta la pratica.",
    descanso: "Alla fine, riposa 30 minuti prima di assumere cibo o bevande.",
    alimentacion: "Non sono richieste restrizioni alimentari speciali prima o dopo questa pratica breve.",
  },
  precautions:
    "Questa pratica appartiene alla pulizia digestiva, non a una normale sequenza di asana. Puo alterare idratazione ed equilibrio dei sali se forzata o ripetuta senza criterio. Non praticare in gravidanza, durante le mestruazioni, con ernie, ulcere, malattia intestinale infiammatoria, malattia cardiaca o renale, ipertensione non controllata, recupero postchirurgico, dolore addominale acuto o qualsiasi condizione medica digestiva. Fermati se compaiono capogiro, debolezza, nausea intensa, palpitazioni o dolore. Non forzare mai il movimento intestinale e consulta un professionista sanitario in caso di dubbi.",
  benefits:
    "A differenza del metodo completo, che svuota tutto il sistema digestivo, il lavaggio breve stimola il normale funzionamento intestinale. E un metodo semplice e delicato che puo essere integrato come pratica di igiene digestiva.\n\nPratiche opzionali aggiuntive: Kunjal Kriya e Jala Neti possono essere eseguite subito dopo la tecnica.",
  threeDayDiet: {
    description:
      "Bevi almeno 1,5-2 litri di acqua al giorno per sostenere l'azione delle fibre. Queste proposte sono orientative: usale come ispirazione e adatta gli alimenti ai tuoi gusti e bisogni.",
    days: [
      {
        day: 1,
        meals: [
          { type: "colazione", primary: "Porridge d'avena con mela o pera fresca e semi di chia.", alternative: "Yogurt naturale con muesli integrale e frutti di bosco." },
          { type: "pranzo", primary: "Insalata di quinoa con ceci, pomodorini, cetriolo e spinaci.", alternative: "Riso integrale con fagioli neri e verdure grigliate." },
          { type: "cena", primary: "Insalata di lenticchie con avocado, pomodori e cipolla.", alternative: "Insalata di barbabietola con hummus di melanzane." },
        ],
      },
      {
        day: 2,
        meals: [
          { type: "colazione", primary: "Toast integrale con avocado e semi di sesamo.", alternative: "Frullato di frutta con avena e semi di lino." },
          { type: "pranzo", primary: "Farro con zucchine, peperoni e cavolo riccio.", alternative: "Couscous integrale con verdure al vapore e ceci." },
          { type: "cena", primary: "Melanzana e zucchina alla piastra con hummus.", alternative: "Verdure saltate con fagioli bianchi." },
        ],
      },
      {
        day: 3,
        meals: [
          { type: "colazione", primary: "Pancake integrali con banana e cannella.", alternative: "Yogurt vegetale con fiocchi d'avena e frutta secca." },
          { type: "pranzo", primary: "Insalata di spinaci, lenticchie, carote e semi di zucca.", alternative: "Pasta integrale con broccoli e ceci." },
          { type: "cena", primary: "Zuppa di verdure di stagione con legumi.", alternative: "Crema di zucca con semi e pane di segale." },
        ],
      },
    ],
  },
};

export function getLavadoIntestinal(locale?: string): LavadoIntestinalProtocol {
  if (locale === "en") return lavadoIntestinalEn;
  if (locale === "it") return lavadoIntestinalIt;
  return lavadoIntestinal;
}
