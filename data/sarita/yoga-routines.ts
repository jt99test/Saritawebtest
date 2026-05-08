import { asanaImages } from "./asana-image-mapping";
import { elementRoutines as legacyElementRoutines } from "./element-routines";

export type Asana = {
  slug: string;
  element: ElementRoutine["element"];
  nameSanskrit: string;
  nameSpanish: string;
  description: string;
  duration: string;
  warning: string;
  imagePath: string | null;
};

export type Pranayama = {
  name: string;
  description: string;
  contraindications?: string;
};

export type SignAndCase = {
  sign: string;
  houseNumber: number;
  description: string;
};

export type ElementRoutine = {
  element: "fuego" | "tierra" | "agua" | "aire";
  title: string;
  bodyZone: string;
  planets: string[];
  signs: string[];
  houses: number[];
  chakra: { name: string; mantra: string };
  intention: string;
  signsAndHouses: SignAndCase[];
  asanas: Asana[];
  pranayama: Pranayama[];
  savasana: { duration: string; visualization: string };
  totalDuration: string;
};

const mojibakePattern = /[\u00C3\u00C2\u00E2]/;

const decodeMojibake = (value: string): string => {
  if (!mojibakePattern.test(value)) {
    return value;
  }

  try {
    return new TextDecoder("utf-8").decode(
      Uint8Array.from(value, (character) => character.charCodeAt(0)),
    );
  } catch {
    return value;
  }
};

const normalizeText = (value: string): string =>
  decodeMojibake(value).replace(/\s+\u00B7\s+/g, " · ").trim();

const slugify = (value: string): string =>
  normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const titleByElement: Record<ElementRoutine["element"], string> = {
  fuego: "Elemento Fuego",
  tierra: "Elemento Tierra",
  agua: "Elemento Agua",
  aire: "Elemento Aire",
};

const imageSlugOverrides: Record<string, string> = {
  "Anjaneyasana Profundo": "anjaneyasana",
  "Baddha Konasana con Oscilación": "baddha-konasana",
  "Setu Bandhasana con Respiración Expansiva": "setu-bandhasana",
  "Upavista Konasana con Movimiento": "upavista-konasana",
};

const ASANA_WARNINGS: Record<string, string> = {
  tadasana: "Evita bloquear las rodillas. Si hay mareo, baja la intensidad y practica cerca de una pared.",
  "tadasana-fire-variant": "Evita bloquear las rodillas. Si hay mareo, baja la intensidad y practica cerca de una pared.",
  navasana: "No fuerces si hay dolor lumbar, hernia abdominal o embarazo. Mantén rodillas flexionadas si el abdomen tiembla demasiado.",
  "navasana-fire-variant": "No fuerces si hay dolor lumbar, hernia abdominal o embarazo. Mantén rodillas flexionadas si el abdomen tiembla demasiado.",
  "ardha-navasana": "Evita esta variante con dolor lumbar agudo, diástasis abdominal o embarazo avanzado. Sal antes de perder la respiración.",
  "ardha-navasana-fire-variant": "Evita esta variante con dolor lumbar agudo, diástasis abdominal o embarazo avanzado. Sal antes de perder la respiración.",
  salabhasana: "No practiques si hay dolor lumbar agudo, lesión cervical o embarazo. Eleva poco y mantén el cuello largo.",
  "salabhasana-fire-variant": "No practiques si hay dolor lumbar agudo, lesión cervical o embarazo. Eleva poco y mantén el cuello largo.",
  "ardha-salabhasana": "No fuerces la pierna elevada si hay dolor lumbar, embarazo o molestias de cadera. Mantén pelvis pesada y cuello largo.",
  dhanurasana: "Evita con embarazo, dolor lumbar, hernia, hipertensión no controlada o molestias fuertes en rodillas.",
  "dhanurasana-fire-variant": "Evita con embarazo, dolor lumbar, hernia, hipertensión no controlada o molestias fuertes en rodillas.",
  "ardha-dhanurasana": "Evita si hay dolor lumbar agudo, lesión de hombro o rodilla sensible. Toma el pie sin tirar de la articulación.",
  "ardha-ustrasana": "Mantén la pelvis estable y evita colapsar lumbares. No practiques con vértigo, dolor cervical o lumbar activo.",
  phalakasana: "Baja rodillas si hay dolor lumbar, muñecas sensibles o fatiga. Empuja el suelo y no hundas el pecho.",
  "vasisthasana-sobre-rodilla": "Apoya la rodilla con manta si molesta. Evita si hay lesión de muñeca, hombro o dolor lateral de cadera.",
  "chaturanga-sobre-rodillas": "Mantén codos cerca del cuerpo y hombros lejos de las orejas. Evita si hay dolor de muñeca, hombro o cuello.",
  "setu-bandhasana-dinamico": "Sube y baja lento, sin empujar desde el cuello. Reduce rango si aparece dolor lumbar o presión en cervicales.",
  utkatasana: "Cuida rodillas y zona lumbar. Lleva peso hacia talones y sal si hay dolor de rodilla o mareo.",
  "virabhadrasana-iii-sobre-silla": "Usa una silla firme y mantén la pierna de apoyo desbloqueada. Evita si hay mareo o inestabilidad fuerte.",
  "parivrtta-utkatasana": "Evita torsiones profundas en embarazo, hernia discal o dolor lumbar. Mantén rodillas alineadas y respiración fluida.",
  "parivrtta-sukhasana": "Gira suave desde una columna larga. Evita forzar cuello o espalda baja, especialmente con hernia discal o embarazo.",
  "jathara-parivartanasana": "Mantén hombros pesados y rodillas apoyadas si hace falta. Evita torsiones profundas con embarazo o dolor lumbar agudo.",
  "bharmanasana-opuestos": "Apoya sobre puños o antebrazos si duelen las muñecas. Mantén abdomen activo para no hundir lumbares.",
  vyaghrasana: "Muévete lento y evita redondear con fuerza si hay dolor lumbar, cervical o molestia de rodilla.",
  "anjaneyasana-con-torsion-simple": "Acolcha la rodilla posterior y evita girar profundo si hay dolor lumbar, pubalgia, embarazo o lesión de cadera.",
  "abdominales-con-piernas-en-mesa-supina": "No tires del cuello y mantén la espalda baja estable. Evita si hay dolor lumbar, diástasis abdominal o embarazo avanzado.",
  "parsva-balasana": "No cargues peso en cuello u hombro. Usa soporte bajo la cabeza si hay molestia cervical o sensibilidad de hombro.",
  "plancha-sobre-antebrazos": "Baja rodillas si la espalda baja se arquea. Evita con dolor de hombro, codo o lumbar activo.",
  "elevacion-de-piernas-supina": "Mantén la espalda baja estable. Dobla rodillas o reduce rango si hay dolor lumbar, diástasis o embarazo.",
  "bicicleta-lenta-supina": "No tires del cuello. Mantén el movimiento lento y evita si hay dolor lumbar, diástasis abdominal o embarazo avanzado.",
  "parivrtta-janu-sirsasana": "Practica suave si hay lesión de isquiotibiales, sacroilíaca o espalda baja. No colapses el costado.",
  "parivrtta-trikonasana": "Usa bloque si hay tensión lumbar o isquiotibiales. Evita torsiones profundas en embarazo.",
  ustrasana: "Protege lumbares y cuello. Evita si hay vértigo, migraña activa, lesión cervical o dolor lumbar agudo.",
  "ustrasana-fire-variant": "Protege lumbares y cuello. Evita si hay vértigo, migraña activa, lesión cervical o dolor lumbar agudo.",
  "mula-bandha": "Contrae de forma sutil. Evita sostener tensión si hay dolor pélvico, posparto reciente o recuperación de cirugía.",
  malasana: "Eleva talones con soporte si molestan tobillos o rodillas. Evita la profundidad si hay lesión de cadera o rodilla.",
  balasana: "Separa rodillas o usa soporte si hay molestias en rodillas, caderas o embarazo. No comprimas el abdomen.",
  "marjaryasana-bitilasana": "Mantén el movimiento suave si hay lesión de muñecas, hombros o cuello. Apoya antebrazos si hace falta.",
  "setu-bandhasana": "Evita empujar desde el cuello. Practica bajo si hay dolor lumbar, cervical o presión alta no controlada.",
  "supta-baddha-konasana": "Sostén las rodillas con cojines si hay tensión de ingles, rodillas o caderas. No fuerces la apertura.",
  paschimottanasana: "Dobla rodillas si hay tirón lumbar o de isquiotibiales. Evita redondear agresivamente la espalda.",
  "prasarita-padottanasana": "Evita bajar la cabeza si hay glaucoma, vértigo o hipertensión no controlada. Usa soporte bajo las manos.",
  "virabhadrasana-i": "Ajusta la distancia si hay dolor de rodilla, cadera o sacroilíaca. Mantén la rodilla frontal estable.",
  "flujo-pelvico-libre": "Muévete lento si hay dolor pélvico, embarazo avanzado o mareo. Evita rangos que pinchen la zona lumbar.",
  "circulos-de-cadera-de-pie": "Muévete lento si hay dolor pélvico, embarazo avanzado o mareo. Evita rangos que pinchen la zona lumbar.",
  anjaneyasana: "Acolcha la rodilla de atrás. Evita hundir la pelvis si hay dolor lumbar, pubalgia o lesión de cadera.",
  "anjaneyasana-con-manos-en-la-rodilla": "Acolcha la rodilla posterior. Evita hundir la pelvis si hay dolor lumbar, pubalgia o lesión de cadera.",
  "baddha-konasana": "No empujes las rodillas hacia abajo. Usa soporte si hay molestias en ingles, caderas o rodillas.",
  "baddha-konasana-con-balanceo": "Mantén el balanceo pequeño y sin rebotes fuertes. Usa soporte si hay molestias en ingles, caderas o rodillas.",
  "tadasana-con-peso": "Usa poco peso y evita bloquear rodillas o hombros. Practica cerca de una pared si hay mareo o inestabilidad.",
  "malasana-tierra-variant": "Eleva talones con soporte si molestan tobillos o rodillas. Evita la profundidad si hay lesion de cadera o rodilla.",
  "malasana-tierra-variant-2": "Eleva talones con soporte si molestan tobillos o rodillas. Evita la profundidad si hay lesion de cadera o rodilla.",
  "balasana-extendida": "Usa soporte bajo torso o frente si hay molestias en rodillas, caderas, hombros o embarazo.",
  "balasana-tierra-variant": "Separa rodillas o usa soporte si hay molestias en rodillas, caderas o embarazo. No comprimas el abdomen.",
  "marjaryasana-bitilasana-tierra-variant": "Manten el movimiento suave si hay lesion de munecas, hombros o cuello. Apoya antebrazos si hace falta.",
  "setu-bandhasana-tierra-variant": "Evita empujar desde el cuello. Practica bajo si hay dolor lumbar, cervical o presion alta no controlada.",
  "supta-baddha-konasana-tierra-variant": "Sosten las rodillas con cojines si hay tension de ingles, rodillas o caderas. No fuerces la apertura.",
  "paschimottanasana-tierra-variant": "Dobla rodillas si hay tiron lumbar o de isquiotibiales. Evita redondear agresivamente la espalda.",
  "prasarita-padottanasana-tierra-variant": "Evita bajar la cabeza si hay glaucoma, vertigo o hipertension no controlada. Usa soporte bajo las manos.",
  "virabhadrasana-i-tierra-variant": "Ajusta la distancia si hay dolor de rodilla, cadera o sacroiliaca. Manten la rodilla frontal estable.",
  "virabhadrasana-ii": "Manten la rodilla frontal alineada con el tobillo. Acorta la postura si hay dolor de rodilla, cadera o tobillo.",
  uttanasana: "Dobla rodillas si tiran los isquiotibiales o la espalda baja. Sube despacio si hay mareo o presion baja.",
  "ardha-uttanasana": "Manten rodillas suaves y espalda larga. Apoya manos en muslos o bloques si hay dolor lumbar.",
  padangusthasana: "No tires de los dedos si hay dolor lumbar o isquiotibiales tensos. Dobla rodillas y sal despacio.",
  "vrksasana-tierra-variant": "Practica cerca de una pared si hay inestabilidad. Evita presionar el pie contra la rodilla.",
  "vrksasana-baja": "Manten el pie en el tobillo o el suelo si el equilibrio fluctua. Evita presionar contra la rodilla.",
  "sukhasana-tierra-variant": "Eleva la pelvis con una manta si se redondea la espalda o molestan caderas y rodillas.",
  dandasana: "Sientate sobre soporte si la espalda se redondea. Dobla un poco rodillas si tiran isquiotibiales o lumbares.",
  "janu-sirsasana": "Dobla la rodilla de la pierna extendida si tiran isquiotibiales. Evita forzar rodilla o sacroiliaca.",
  "upavista-konasana-simple": "Manten rodillas ligeramente flexionadas si tiran los isquiotibiales. Evita con dolor sacroiliaco activo.",
  "adho-mukha-svanasana": "Dobla rodillas si la espalda baja se redondea. Evita sostener si hay dolor de munecas, hombros o vertigo.",
  "adho-mukha-svanasana-sobre-rodillas": "Apoya rodillas con manta y reduce rango si hay molestia en hombros, munecas o cervicales.",
  "tadasana-en-puntillas": "Practica cerca de una pared si hay inestabilidad, dolor de tobillo o mareo. Baja talones con control.",
  apanasana: "Acerca rodillas sin comprimir el abdomen. Evita presionar fuerte si hay embarazo, dolor lumbar agudo o cirugia reciente.",
  "savasana-con-piernas-dobladas": "Ajusta los pies y rodillas para que la espalda baja descanse. Sal de lado si hay mareo o embarazo.",
  "baddha-konasana-tierra-variant": "No empujes las rodillas hacia abajo. Usa soporte si hay molestias en ingles, caderas o rodillas.",
  "upavista-konasana": "Mantén rodillas ligeramente flexionadas si tiran los isquiotibiales. Evita con dolor sacroilíaco activo.",
  "upavista-konasana-con-torsion-torso": "Gira suave desde una columna larga. Evita forzar si hay dolor lumbar, sacroilíaco o embarazo avanzado.",
  "ardha-matsyendrasana": "Evita torsiones profundas en embarazo o hernia discal. Gira desde la columna larga, no desde el cuello.",
  bharadvajasana: "Mantén la torsión suave y la pelvis apoyada. Evita forzar cuello o espalda baja, especialmente con hernia discal o embarazo.",
  "supta-kapotasana": "Mantén el pie flexionado y evita si hay dolor de rodilla. Aleja las piernas si la cadera se irrita.",
  "eka-pada-rajakapotasana-preparatoria": "Usa soporte bajo la cadera y evita si hay dolor de rodilla o pinzamiento de cadera. No fuerces la pelvis al suelo.",
  "viparita-karani": "Evita si hay glaucoma, hipertensión no controlada o molestias al estar invertida. Sal despacio.",
  "supta-padangusthasana": "Mantén rodillas suaves y usa correa si hace falta. Evita tirar fuerte si hay dolor lumbar o isquiotibiales tensos.",
  "supta-padangusthasana-lateral": "Abre la pierna solo hasta donde la pelvis siga estable. Evita si hay dolor de ingle, cadera o sacroilíaco.",
  "ananda-balasana": "Toma muslos o tobillos si no llegas a los pies. Evita comprimir el abdomen en embarazo o si hay dolor lumbar agudo.",
  "movimiento-ondulante-de-pelvis-supina": "Mantén el movimiento pequeño y lento. Evita rangos que pinchen la espalda baja o la pelvis.",
  "circulos-de-rodillas-supina": "Dibuja círculos pequeños y sin tirones. Evita comprimir el abdomen o forzar la espalda baja.",
  "limpiaparabrisas-supino": "Mantén el rango cómodo y los hombros pesados. Reduce el movimiento si hay dolor lumbar o sacroilíaco.",
  mandukasana: "Usa soporte bajo rodillas o pelvis. Evita aperturas profundas si hay dolor de rodilla, cadera, pubalgia o embarazo avanzado.",
  "gomukhasana-piernas": "Eleva la pelvis si una cadera queda flotando. Evita forzar rodillas o tobillos si hay dolor articular.",
  "sukhasana-con-torsion": "Gira suave desde una columna larga. Evita forzar cuello o espalda baja, especialmente con hernia discal o embarazo.",
  parighasana: "Acolcha la rodilla apoyada y evita colapsar el costado. Reduce rango si hay dolor de rodilla, cadera o lumbar.",
  skandasana: "Mantén el talón apoyado o usa manos en el suelo. Evita profundidad si hay dolor de rodilla, tobillo o cadera.",
  "posicion-fetal-lateral": "Ajusta soporte bajo cabeza o rodillas si hay tensión. Sal despacio si hay mareo o embarazo avanzado.",
  "movimiento-libre-final": "Mantén movimientos pequeños si hay mareo, dolor articular o fatiga. La libertad no necesita intensidad.",
  "apertura-toracica-en-cuatro-apoyos": "Apoya antebrazo o manta si hay dolor de muñeca. No fuerces la rotación si hay lesión de hombro.",
  "apertura-toracica-en-cuatro-apoyos-variation": "Apoya antebrazo o manta si hay dolor de muñeca. No fuerces la rotación si hay lesión de hombro.",
  "brazos-al-cielo-en-tadasana": "Evita bloquear rodillas o elevar hombros hacia las orejas. Baja brazos si hay mareo o molestia cervical.",
  "apertura-de-brazos-en-cruz-de-pie": "Mantén hombros bajos y cuello largo. Baja los brazos si aparece hormigueo, dolor de hombro o mareo.",
  anahatasana: "Protege hombros y cuello. Usa soporte bajo el pecho si hay pinzamiento, dolor cervical o embarazo avanzado.",
  bhujangasana: "No bloquees codos ni comprimas lumbares. Evita con embarazo avanzado o dolor lumbar agudo.",
  "bhujangasana-baja": "Mantén codos cómodos y pecho amplio. Evita si hay dolor lumbar agudo, pinzamiento de hombro o molestia cervical.",
  "bhujangasana-bajo": "No bloquees codos ni comprimas lumbares. Evita con embarazo avanzado o dolor lumbar agudo.",
  "gomukhasana-brazos": "Usa correa si los hombros no llegan. Evita tirar si hay lesión de manguito rotador o cuello.",
  "garudasana-brazos": "Evita cerrar demasiado si duelen hombros, codos o cuello. Mantén la respiración amplia entre las escápulas.",
  garudasana: "Practica cerca de una pared si hay problemas de equilibrio. Evita cerrar demasiado si duelen rodillas u hombros.",
  camatkarasana: "Evita si hay lesión de muñeca, hombro o lumbar. Mantén la transición lenta y sal si pierdes estabilidad.",
  matsyasana: "El peso no va en la cabeza. Evita con lesión cervical, migraña activa o vértigo.",
  "matsyasana-apoyado": "Ajusta el soporte para que el cuello no cuelgue. Evita si hay lesión cervical, migraña activa o vértigo.",
  "setu-bandhasana-con-apertura-costal": "Mantén el cuello neutro y baja brazos si los hombros molestan. Evita forzar si hay dolor lumbar o cervical.",
  "setu-bandhasana-con-respiracion-expansiva": "Mantén el cuello neutro y evita forzar el pecho si hay dolor lumbar, cervical o presión alta.",
  "balasana-con-brazos-abiertos": "Ajusta brazos y rodillas si hay molestias en hombros, rodillas o caderas. Usa soporte bajo el torso.",
  "balasana-con-brazos-extendidos-al-frente": "Usa soporte bajo frente o torso si hay molestias en hombros, rodillas, caderas o embarazo.",
  "parsva-balasana-invertida": "No cargues peso en cuello u hombro. Mantén el brazo superior apoyado si abrirlo genera tensión.",
  "circulos-de-hombros-sentada": "Haz círculos pequeños si hay lesión de hombro o cuello. Evita rangos dolorosos o bruscos.",
  "circulos-de-brazos-amplios": "Reduce el tamaño del círculo si hay dolor de hombro, cuello o mareo. Mantén costillas suaves.",
  "postura-de-la-mariposa-con-brazos-abiertos": "No empujes rodillas ni hombros. Usa soporte si hay molestias en ingles, caderas, rodillas u hombros.",
  "sukhasana-con-manos-en-el-corazon": "Eleva la pelvis si se redondea la espalda. Relaja hombros y mandíbula si aparece tensión.",
  "sukhasana-con-brazos-al-cielo": "Baja brazos si hay dolor de hombro, cuello o mareo. Mantén la pelvis estable y la respiración fluida.",
  "apertura-de-pecho-con-manos-entrelazadas-atras": "Usa correa o separa manos si hay tensión. Evita tirar fuerte con lesión de hombro o cuello.",
  "apertura-de-pecho-con-manos-en-lumbares": "Mantén abdomen suave y no colapses lumbares. Evita si hay dolor lumbar o cervical activo.",
  "estiramiento-lateral-de-pie": "Evita bloquear rodillas o colapsar el costado. Reduce rango si hay mareo, dolor lumbar o de hombro.",
  "cobra-con-manos-elevadas": "Eleva poco y mantén cuello largo. Evita si hay dolor lumbar agudo, embarazo avanzado o molestia cervical.",
  "apertura-de-brazos-tumbada-boca-arriba": "Sostén los brazos con mantas si los hombros quedan en el aire. Evita si hay pinzamiento de hombro.",
  "savasana-con-brazos-abiertos-en-cruz": "Ajusta la apertura de brazos si hormiguean manos u hombros. Sal de lado si hay mareo o embarazo.",
};

const getImageSlug = (nameSanskrit: string, slug?: string): string => {
  if (slug) {
    return slug;
  }

  const normalized = normalizeText(nameSanskrit);
  return imageSlugOverrides[normalized] ?? slugify(normalized);
};

export const yogaRoutines: Record<
  "fuego" | "tierra" | "agua" | "aire",
  ElementRoutine
> = {
  fuego: {
    element: "fuego",
    title: titleByElement.fuego,
    bodyZone: normalizeText(legacyElementRoutines.fuego.bodyZone),
    planets: legacyElementRoutines.fuego.planets.map(normalizeText),
    signs: legacyElementRoutines.fuego.signs.map(normalizeText),
    houses: [...legacyElementRoutines.fuego.houses],
    chakra: {
      name: normalizeText(legacyElementRoutines.fuego.chakra.name),
      mantra: normalizeText(legacyElementRoutines.fuego.chakra.mantra),
    },
    intention: normalizeText(legacyElementRoutines.fuego.intention),
    signsAndHouses: legacyElementRoutines.fuego.signsAndCases.map((entry) => ({
      sign: normalizeText(entry.sign),
      houseNumber: entry.house,
      description: normalizeText(entry.description),
    })),
    asanas: legacyElementRoutines.fuego.asanas.map((asana) => {
      const nameSanskrit = normalizeText(asana.nameSanskrit);
      const slug = getImageSlug(nameSanskrit, asana.slug);

      return {
        slug,
        element: "fuego",
        nameSanskrit,
        nameSpanish: normalizeText(asana.nameSpanish),
        description: normalizeText(asana.description),
        duration: normalizeText(asana.duration),
        warning: ASANA_WARNINGS[slug] ?? "Practica con suavidad y detente ante dolor, mareo o falta de aire.",
        imagePath: asanaImages[slug] ?? null,
      };
    }),
    pranayama: legacyElementRoutines.fuego.pranayama.map((item) => ({
      name: normalizeText(item.name),
      description: normalizeText(item.description),
      ...(item.contraindications
        ? { contraindications: normalizeText(item.contraindications) }
        : {}),
    })),
    savasana: {
      duration: normalizeText(legacyElementRoutines.fuego.savasana.duration),
      visualization: normalizeText(
        legacyElementRoutines.fuego.savasana.visualization,
      ),
    },
    totalDuration: normalizeText(legacyElementRoutines.fuego.totalDuration),
  },
  tierra: {
    element: "tierra",
    title: titleByElement.tierra,
    bodyZone: normalizeText(legacyElementRoutines.tierra.bodyZone),
    planets: legacyElementRoutines.tierra.planets.map(normalizeText),
    signs: legacyElementRoutines.tierra.signs.map(normalizeText),
    houses: [...legacyElementRoutines.tierra.houses],
    chakra: {
      name: normalizeText(legacyElementRoutines.tierra.chakra.name),
      mantra: normalizeText(legacyElementRoutines.tierra.chakra.mantra),
    },
    intention: normalizeText(legacyElementRoutines.tierra.intention),
    signsAndHouses: legacyElementRoutines.tierra.signsAndCases.map((entry) => ({
      sign: normalizeText(entry.sign),
      houseNumber: entry.house,
      description: normalizeText(entry.description),
    })),
    asanas: legacyElementRoutines.tierra.asanas.map((asana) => {
      const nameSanskrit = normalizeText(asana.nameSanskrit);
      const slug = getImageSlug(nameSanskrit, asana.slug);

      return {
        slug,
        element: "tierra",
        nameSanskrit,
        nameSpanish: normalizeText(asana.nameSpanish),
        description: normalizeText(asana.description),
        duration: normalizeText(asana.duration),
        warning: ASANA_WARNINGS[slug] ?? "Practica con suavidad y detente ante dolor, mareo o falta de aire.",
        imagePath: asanaImages[slug] ?? null,
      };
    }),
    pranayama: legacyElementRoutines.tierra.pranayama.map((item) => ({
      name: normalizeText(item.name),
      description: normalizeText(item.description),
      ...(item.contraindications
        ? { contraindications: normalizeText(item.contraindications) }
        : {}),
    })),
    savasana: {
      duration: normalizeText(legacyElementRoutines.tierra.savasana.duration),
      visualization: normalizeText(
        legacyElementRoutines.tierra.savasana.visualization,
      ),
    },
    totalDuration: normalizeText(legacyElementRoutines.tierra.totalDuration),
  },
  agua: {
    element: "agua",
    title: titleByElement.agua,
    bodyZone: normalizeText(legacyElementRoutines.agua.bodyZone),
    planets: legacyElementRoutines.agua.planets.map(normalizeText),
    signs: legacyElementRoutines.agua.signs.map(normalizeText),
    houses: [...legacyElementRoutines.agua.houses],
    chakra: {
      name: normalizeText(legacyElementRoutines.agua.chakra.name),
      mantra: normalizeText(legacyElementRoutines.agua.chakra.mantra),
    },
    intention: normalizeText(legacyElementRoutines.agua.intention),
    signsAndHouses: legacyElementRoutines.agua.signsAndCases.map((entry) => ({
      sign: normalizeText(entry.sign),
      houseNumber: entry.house,
      description: normalizeText(entry.description),
    })),
    asanas: legacyElementRoutines.agua.asanas.map((asana) => {
      const nameSanskrit = normalizeText(asana.nameSanskrit);
      const slug = getImageSlug(nameSanskrit, asana.slug);

      return {
        slug,
        element: "agua",
        nameSanskrit,
        nameSpanish: normalizeText(asana.nameSpanish),
        description: normalizeText(asana.description),
        duration: normalizeText(asana.duration),
        warning: ASANA_WARNINGS[slug] ?? "Practica con suavidad y detente ante dolor, mareo o falta de aire.",
        imagePath: asanaImages[slug] ?? null,
      };
    }),
    pranayama: legacyElementRoutines.agua.pranayama.map((item) => ({
      name: normalizeText(item.name),
      description: normalizeText(item.description),
      ...(item.contraindications
        ? { contraindications: normalizeText(item.contraindications) }
        : {}),
    })),
    savasana: {
      duration: normalizeText(legacyElementRoutines.agua.savasana.duration),
      visualization: normalizeText(
        legacyElementRoutines.agua.savasana.visualization,
      ),
    },
    totalDuration: normalizeText(legacyElementRoutines.agua.totalDuration),
  },
  aire: {
    element: "aire",
    title: titleByElement.aire,
    bodyZone: normalizeText(legacyElementRoutines.aire.bodyZone),
    planets: legacyElementRoutines.aire.planets.map(normalizeText),
    signs: legacyElementRoutines.aire.signs.map(normalizeText),
    houses: [...legacyElementRoutines.aire.houses],
    chakra: {
      name: normalizeText(legacyElementRoutines.aire.chakra.name),
      mantra: normalizeText(legacyElementRoutines.aire.chakra.mantra),
    },
    intention: normalizeText(legacyElementRoutines.aire.intention),
    signsAndHouses: legacyElementRoutines.aire.signsAndCases.map((entry) => ({
      sign: normalizeText(entry.sign),
      houseNumber: entry.house,
      description: normalizeText(entry.description),
    })),
    asanas: legacyElementRoutines.aire.asanas.map((asana) => {
      const nameSanskrit = normalizeText(asana.nameSanskrit);
      const slug = getImageSlug(nameSanskrit, asana.slug);

      return {
        slug,
        element: "aire",
        nameSanskrit,
        nameSpanish: normalizeText(asana.nameSpanish),
        description: normalizeText(asana.description),
        duration: normalizeText(asana.duration),
        warning: ASANA_WARNINGS[slug] ?? "Practica con suavidad y detente ante dolor, mareo o falta de aire.",
        imagePath: asanaImages[slug] ?? null,
      };
    }),
    pranayama: legacyElementRoutines.aire.pranayama.map((item) => ({
      name: normalizeText(item.name),
      description: normalizeText(item.description),
      ...(item.contraindications
        ? { contraindications: normalizeText(item.contraindications) }
        : {}),
    })),
    savasana: {
      duration: normalizeText(legacyElementRoutines.aire.savasana.duration),
      visualization: normalizeText(
        legacyElementRoutines.aire.savasana.visualization,
      ),
    },
    totalDuration: normalizeText(legacyElementRoutines.aire.totalDuration),
  },
};
