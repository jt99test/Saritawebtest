export type Asana = {
  slug?: string;
  nameSanskrit: string;
  nameSpanish: string;
  description: string;
  duration: string;
};

export type Pranayama = {
  name: string;
  description: string;
  contraindications?: string;
};

export type ElementRoutine = {
  element: "fuego" | "tierra" | "agua" | "aire";
  bodyZone: string;
  planets: string[];
  signs: string[];
  houses: number[];
  chakra: { name: string; mantra: string };
  intention: string;
  signsAndCases: { sign: string; house: number; description: string }[];
  asanas: Asana[];
  pranayama: Pranayama[];
  savasana: { duration: string; visualization: string };
  totalDuration: string;
};

export const elementRoutines: Record<"fuego" | "tierra" | "agua" | "aire", ElementRoutine> = {
  fuego: {
    element: "fuego",
    bodyZone: "Core · Diafragma · Costillas",
    planets: ["Marte", "Sol", "Júpiter"],
    signs: ["Aries", "Leo", "Sagitario"],
    houses: [1, 5, 9],
    chakra: { name: "Manipura — 3er Chakra", mantra: "RAM" },
    intention:
      "Despertar el poder personal, la voluntad y la capacidad de actuar. Encender el fuego interior sin quemarse.",
    signsAndCases: [
      {
        sign: "Aries",
        house: 1,
        description:
          "El fuego del comienzo. Marte gobierna la identidad, el impulso vital y la capacidad de actuar sin dudar. En esta rutina activamos esa misma energía: iniciar, moverse, afirmarse. Navasana y Salabhasana son la expresión de Marte: fuerza central, dirección clara.",
      },
      {
        sign: "Leo",
        house: 5,
        description:
          "El fuego creativo. El Sol gobierna la expresión de uno mismo, el corazón, la creatividad. Dhanurasana y Ustrasana reflejan la fuerza y la generosidad del Leo: el cuerpo se abre hacia el mundo con confianza y brillo.",
      },
      {
        sign: "Sagitario",
        house: 9,
        description:
          "El fuego de la visión. Júpiter expande y orienta hacia un ideal superior. Las torsiones representan la capacidad de mirar lejos sin perder el centro. La práctica completa es una búsqueda del fuego que nos mueve desde dentro.",
      },
    ],
    asanas: [
      {
        slug: "tadasana-fire-variant",
        nameSanskrit: "Tadasana",
        nameSpanish: "Montaña",
        description:
          "De pie con los pies juntos o separados al ancho de las caderas. Lleva la coronilla hacia arriba y deja que los brazos descansen a los lados del cuerpo. Reparte el peso entre talones y metatarsos, suaviza las rodillas y siente el abdomen bajo despierto. Esta versión es simple y estable: una llama quieta antes de moverse.",
        duration: "8 respiraciones profundas",
      },
      {
        nameSanskrit: "Tadasana",
        nameSpanish: "Tadasana Activa",
        description:
          "De pie con los pies juntos o ligeramente separados. Distribuye el peso uniformemente en toda la planta del pie. Contrae suavemente el core llevando el ombligo hacia la columna vertebral sin retener la respiración — solo una activación ligera. Hombros relajados lejos de las orejas, mentón paralelo al suelo. Respira lentamente y observa el calor que se genera en el centro del cuerpo.",
        duration: "10 respiraciones profundas",
      },
      {
        slug: "navasana-fire-variant",
        nameSanskrit: "Navasana",
        nameSpanish: "Barco completo",
        description:
          "Siéntate sobre los isquiones, eleva ambas piernas y extiéndelas si la espalda puede mantenerse larga. Los brazos se proyectan hacia adelante, paralelos al suelo. El pecho queda abierto y el abdomen sostiene el equilibrio. Mantén la mirada serena aunque el centro trabaje con intensidad.",
        duration: "3 series de 4 respiraciones",
      },
      {
        nameSanskrit: "Navasana",
        nameSpanish: "El Barco",
        description:
          "Siéntate en el suelo con las rodillas dobladas y los pies en el suelo. Inclina ligeramente el torso hacia atrás hasta encontrar el punto de equilibrio sobre los isquiones. Eleva los pies del suelo llevando las piernas paralelas al suelo — rodillas dobladas para principiantes, piernas extendidas para quien tiene más práctica. Lleva los brazos paralelos al suelo a los lados de las piernas. El core está completamente activado, la espalda recta sin hundirse. Entre series lleva las rodillas al pecho.",
        duration: "3 series de 5 respiraciones · 3 respiraciones de pausa entre series",
      },
      {
        slug: "ardha-navasana-fire-variant",
        nameSanskrit: "Ardha Navasana",
        nameSpanish: "Medio barco",
        description:
          "Desde una posición sentada, inclina el torso hacia atrás y extiende las piernas más bajas que en el barco completo, sin dejar que la espalda se hunda. Los brazos miran hacia adelante y el abdomen mantiene la forma. Quédate solo donde la respiración siga siendo estable.",
        duration: "3 series de 4 respiraciones",
      },
      {
        nameSanskrit: "Ardha Navasana",
        nameSpanish: "Medio Barco",
        description:
          "Desde Navasana baja lentamente las piernas hacia el suelo sin llegar a tocarlo. Las piernas permanecen a unos 30 cm del suelo. Las manos pueden entrelazar los dedos detrás de la nuca o quedarse extendidas hacia adelante. El fuego en el core es intenso — respira dentro de la sensación sin huir.",
        duration: "3 series de 4 respiraciones",
      },
      {
        slug: "salabhasana-fire-variant",
        nameSanskrit: "Salabhasana",
        nameSpanish: "Langosta",
        description:
          "Boca abajo, extiende las piernas y lleva los brazos atrás junto al cuerpo. Con la inspiración eleva pecho, brazos y piernas en una línea larga. Mantén el cuello amplio y el pubis pesado hacia el suelo. La fuerza nace en toda la cadena posterior.",
        duration: "3 series de 5 respiraciones",
      },
      {
        nameSanskrit: "Salabhasana",
        nameSpanish: "La Langosta",
        description:
          "Túmbate boca abajo con los brazos a lo largo del cuerpo, palmas hacia arriba y frente en el suelo. Con la inspiración eleva simultáneamente cabeza, pecho, brazos y piernas del suelo. El cuerpo forma una banana invertida. La fuerza viene del core posterior, no de los glúteos. Mantén el cuello largo, la mirada ligeramente hacia adelante.",
        duration: "3 series de 5 respiraciones",
      },
      {
        slug: "dhanurasana-fire-variant",
        nameSanskrit: "Dhanurasana",
        nameSpanish: "Arco",
        description:
          "Boca abajo, flexiona las rodillas y toma los tobillos. Empuja los pies hacia atrás y arriba para que el pecho se abra y los muslos se despeguen del suelo. La postura se sostiene por la acción de las piernas tanto como por los brazos, como un arco bien tensado.",
        duration: "3 series de 4 respiraciones",
      },
      {
        nameSanskrit: "Dhanurasana",
        nameSpanish: "El Arco",
        description:
          "Túmbate boca abajo. Dobla las rodillas y lleva los talones hacia los glúteos. Extiende los brazos hacia atrás y agarra los tobillos por fuera — no los pies. Con la inspiración empuja los pies hacia arriba y hacia el techo mientras tiras con las manos: esto crea la tensión que eleva pecho y muslos del suelo. El cuerpo oscila como un arco. Mantén la respiración fluida.",
        duration: "3 series de 4 respiraciones",
      },
      {
        nameSanskrit: "Ustrasana",
        nameSpanish: "El Camello",
        description:
          "Arrodíllate con las rodillas separadas como los caderas. Lleva las manos a los lumbares con los dedos hacia abajo. Con la inspiración abre el pecho hacia el techo y empieza a inclinarte hacia atrás. Si estás lista lleva las manos a los talones — si no queda con las manos en los lumbares. El cuello es largo. Esta apertura del pecho después de trabajar el core crea confianza en el propio fuego interior.",
        duration: "5 respiraciones",
      },
      {
        slug: "ustrasana-fire-variant",
        nameSanskrit: "Ustrasana",
        nameSpanish: "Camello",
        description:
          "Arrodíllate con la pelvis sobre las rodillas y abre el pecho hacia arriba antes de ir hacia atrás. Lleva las manos a los talones solo si el abdomen puede sostener la zona lumbar. La cabeza acompaña con suavidad. Siente el fuego del corazón expandirse sin perder raíz.",
        duration: "5 respiraciones",
      },
      {
        nameSanskrit: "Ardha Salabhasana",
        nameSpanish: "Media langosta",
        description:
          "Túmbate boca abajo con los brazos junto al cuerpo y la frente o el mentón suave hacia el suelo. Activa el abdomen bajo y, con la inspiración, eleva una pierna larga sin girar la pelvis. Mantén la cadera pesada y la pierna extendida desde el talón. Baja con control y cambia de lado. Es una activación precisa del fuego posterior sin exigir toda la espalda a la vez.",
        duration: "5 respiraciones por lado",
      },
      {
        nameSanskrit: "Ardha Dhanurasana",
        nameSpanish: "Medio arco",
        description:
          "Boca abajo, dobla una rodilla y toma el tobillo del mismo lado. El otro antebrazo puede quedar apoyado delante del pecho para estabilizar. Empuja el pie hacia la mano y deja que el pecho se abra sin retorcer la pelvis. Respira hacia el abdomen y cambia de lado con calma.",
        duration: "4 respiraciones por lado",
      },
      {
        nameSanskrit: "Ardha Ustrasana",
        nameSpanish: "Medio camello",
        description:
          "Arrodíllate con las rodillas al ancho de las caderas. Lleva una mano al talón del mismo lado o a la zona lumbar si no llega. El otro brazo puede subir hacia el cielo mientras el pecho se abre. Mantén la pelvis avanzando suave y el abdomen activo para que la apertura no caiga en las lumbares.",
        duration: "4 respiraciones por lado",
      },
      {
        nameSanskrit: "Phalakasana",
        nameSpanish: "Plancha",
        description:
          "Desde cuatro apoyos, lleva un pie atrás y luego el otro hasta formar una línea larga desde talones hasta coronilla. Empuja el suelo con las manos, separa los omóplatos y lleva el ombligo hacia dentro. La postura enciende el centro sin rigidez: respira corto si hace falta, pero mantén presencia.",
        duration: "3 series de 5 respiraciones",
      },
      {
        nameSanskrit: "Vasisthasana sobre rodilla",
        nameSpanish: "Plancha lateral apoyada",
        description:
          "Desde cuatro apoyos, apoya una mano bajo el hombro y gira el pecho hacia un lado. La rodilla inferior queda en el suelo como base y la pierna superior se extiende larga. Eleva el brazo libre hacia el cielo y mantén el costado activo. Cambia de lado sin prisa.",
        duration: "4 respiraciones por lado",
      },
      {
        nameSanskrit: "Chaturanga sobre rodillas",
        nameSpanish: "Chaturanga con rodillas apoyadas",
        description:
          "Desde plancha con rodillas al suelo, adelanta un poco el pecho y flexiona los codos pegados a las costillas. Baja solo hasta donde los hombros se mantengan amplios. Empuja el suelo para volver. Esta variante trabaja brazos, pecho y core sin sacrificar alineación.",
        duration: "5 repeticiones lentas",
      },
      {
        nameSanskrit: "Setu Bandhasana Dinámico",
        nameSpanish: "Puente dinámico",
        description:
          "Túmbate boca arriba con rodillas flexionadas y pies apoyados. Con la inspiración sube la pelvis vértebra a vértebra; con la espiración baja igual de lento. Mantén los pies firmes, el cuello largo y el abdomen acompañando el movimiento. El calor nace de la repetición consciente.",
        duration: "8 ciclos lentos",
      },
      {
        nameSanskrit: "Utkatasana",
        nameSpanish: "Silla",
        description:
          "De pie, flexiona las rodillas como si fueras a sentarte atrás. Lleva el peso hacia los talones, alarga la columna y eleva los brazos si los hombros lo permiten. Mantén el abdomen activo y el pecho amplio. La intensidad está en sostener sin endurecerte.",
        duration: "5 respiraciones",
      },
      {
        nameSanskrit: "Virabhadrasana III sobre silla",
        nameSpanish: "Guerrero 3 con apoyo",
        description:
          "Coloca las manos sobre el respaldo o asiento de una silla firme. Camina hacia atrás hasta alargar el torso y eleva una pierna hacia atrás, paralela al suelo o más baja. Mantén las caderas niveladas y la pierna de apoyo despierta. Cambia de lado.",
        duration: "5 respiraciones por lado",
      },
      {
        nameSanskrit: "Parivrtta Utkatasana",
        nameSpanish: "Silla girada",
        description:
          "Desde Utkatasana, une las palmas delante del pecho. Alarga la columna al inhalar y gira el torso al exhalar, llevando un codo hacia el exterior del muslo contrario. Las rodillas se mantienen juntas y alineadas. La torsión estimula el fuego digestivo sin perder la base.",
        duration: "4 respiraciones por lado",
      },
      {
        nameSanskrit: "Parivrtta Sukhasana",
        nameSpanish: "Torsión sentada simple",
        description:
          "Siéntate en Sukhasana con la columna alta. Lleva una mano a la rodilla contraria y la otra al suelo detrás de ti. Inhala creciendo desde la pelvis; exhala girando suavemente el pecho y la mirada. Vuelve al centro y cambia de lado.",
        duration: "5 respiraciones por lado",
      },
      {
        nameSanskrit: "Jathara Parivartanasana",
        nameSpanish: "Torsión supina con rodillas",
        description:
          "Túmbate boca arriba, flexiona las rodillas y abre los brazos en cruz. Deja caer las rodillas hacia un lado manteniendo ambos hombros pesados. Respira en el abdomen y vuelve al centro con control antes de cambiar de lado.",
        duration: "6 respiraciones por lado",
      },
      {
        nameSanskrit: "Bharmanasana opuestos",
        nameSpanish: "Cuatro apoyos con brazo y pierna opuestos",
        description:
          "En cuatro apoyos, extiende un brazo hacia adelante y la pierna contraria hacia atrás. Mira al suelo para mantener el cuello largo. Abraza el abdomen hacia dentro y estabiliza la pelvis. Cambia de lado, buscando firmeza más que altura.",
        duration: "5 respiraciones por lado",
      },
      {
        nameSanskrit: "Vyaghrasana",
        nameSpanish: "Tigre",
        description:
          "Desde cuatro apoyos, extiende una pierna hacia atrás al inhalar. Al exhalar, redondea la espalda y lleva la rodilla hacia el codo o hacia el pecho. Repite con ritmo lento, sintiendo cómo el abdomen inicia el movimiento.",
        duration: "6 repeticiones por lado",
      },
      {
        nameSanskrit: "Anjaneyasana con torsión simple",
        nameSpanish: "Estocada baja girada",
        description:
          "Desde Anjaneyasana, apoya la mano contraria al pie delantero en el suelo o sobre un bloque. Gira el pecho hacia la pierna delantera y extiende el brazo libre hacia arriba o en diagonal. La rodilla posterior queda acolchada y la respiración guía la torsión.",
        duration: "5 respiraciones por lado",
      },
      {
        nameSanskrit: "Plancha sobre antebrazos",
        nameSpanish: "Plancha sobre antebrazos",
        description:
          "Apoya los antebrazos paralelos en el suelo, codos bajo hombros. Extiende las piernas atrás y empuja talones y coronilla en direcciones opuestas. Activa abdomen y glúteos suavemente para que la pelvis no caiga. Baja rodillas si necesitas conservar la respiración.",
        duration: "3 series de 4 respiraciones",
      },
      {
        nameSanskrit: "Elevación de piernas supina",
        nameSpanish: "Elevación de piernas una a la vez",
        description:
          "Túmbate boca arriba con una pierna extendida en el suelo y la otra elevándose hacia el techo. Mantén la espalda baja estable y los brazos relajados. Baja la pierna con control y cambia. El trabajo es lento, profundo y muy centrado.",
        duration: "6 repeticiones por lado",
      },
      {
        nameSanskrit: "Bicicleta lenta supina",
        nameSpanish: "Bicicleta lenta",
        description:
          "Boca arriba, lleva las manos detrás de la cabeza sin tirar del cuello. Eleva una rodilla mientras extiendes la otra pierna y rota el pecho apenas hacia la rodilla flexionada. Cambia de lado muy despacio, priorizando control sobre velocidad.",
        duration: "8 ciclos lentos",
      },
      {
        nameSanskrit: "Parivrtta Janu Sirsasana",
        nameSpanish: "Torsión Lateral Sentada",
        description:
          "Siéntate con las piernas abiertas. Dobla la rodilla izquierda llevando el pie hacia el interior del muslo derecho. Rota ligeramente el torso hacia la pierna extendida. Lleva el brazo izquierdo a lo largo del costado y dobla el torso lateralmente hacia la pierna extendida. El brazo derecho se extiende más allá de la cabeza hacia el pie derecho. Siente la apertura lateral del costado y la torsión que masajea hígado y bazo — órganos asociados a Manipura.",
        duration: "5 respiraciones por lado",
      },
      {
        nameSanskrit: "Parivrtta Trikonasana",
        nameSpanish: "Triángulo Girado",
        description:
          "De pie con los pies separados aproximadamente un metro. Pie derecho hacia adelante, pie izquierdo girado 60 grados. Lleva el brazo izquierdo hacia el exterior del pie derecho o a la tibia. El brazo derecho sube hacia el techo. Gira el pecho hacia arriba abriendo completamente. Esta torsión profunda comprime y luego libera los órganos digestivos, estimulando directamente Manipura. Mantén el core activado.",
        duration: "5 respiraciones por lado",
      },
    ],
    pranayama: [
      {
        name: "Kapalabhati — Respiración del Fuego",
        description:
          "Siéntate cómodamente con la espalda recta. Inspira normalmente llenando los pulmones. Luego empieza: la espiración es una bombeada rápida y decidida del ombligo hacia la columna — como si quisieras soplar algo por la nariz. La inspiración es pasiva y automática. Empieza lento, luego aumenta. Al final espira completamente, inspira profundamente y retiene el aire cómodamente. Luego espira lentamente. 3 respiraciones de pausa entre series.",
        contraindications:
          "No practicar en embarazo, hipertensión o problemas cardíacos. 3 series de 30 bombeadas.",
      },
      {
        name: "Nadi Shodhana — Respiración Alterna",
        description:
          "Lleva la mano derecha al rostro: índice y medio doblados hacia la palma, pulgar en la fosa derecha, anular y meñique en la izquierda. Cierra la fosa derecha e inspira por la izquierda contando 4. Cierra ambas reteniendo 4. Abre la derecha y espira 8 tiempos. Inspira por la derecha 4. Cierra ambas 4. Espira por la izquierda 8. 10 ciclos. Equilibra el sistema nervioso después de la intensidad del fuego.",
      },
    ],
    savasana: {
      duration: "5-7 minutos",
      visualization:
        "Túmbate completamente. Visualiza una llama dorada estable en el ombligo. Ni demasiado grande ni apagada. Tu poder personal en equilibrio.",
    },
    totalDuration: "45 minutos",
  },
  tierra: {
    element: "tierra",
    bodyZone: "Pies · Piernas · Perineo · Cóccix",
    planets: ["Saturno", "Venus", "Mercurio"],
    signs: ["Tauro", "Virgo", "Capricornio"],
    houses: [2, 6, 10],
    chakra: { name: "Muladhara — 1er Chakra", mantra: "LAM" },
    intention:
      "Arraigarse en el cuerpo, sentirse segura en la propia existencia, construir bases sólidas dentro y fuera.",
    signsAndCases: [
      {
        sign: "Tauro",
        house: 2,
        description:
          "La tierra de la estabilidad material y los valores. Venus en tierra gobierna el cuerpo físico, el placer sensorial y la seguridad. Malasana y Supta Baddha Konasana reflejan la capacidad de Tauro de arraigarse en el presente a través de los sentidos. El cuerpo es templo.",
      },
      {
        sign: "Virgo",
        house: 6,
        description:
          "La tierra del servicio y del cuerpo. Mercurio en tierra gobierna el cuidado cotidiano, la salud y la rutina. Paschimottanasana y Setu Bandhasana reflejan la precisión y la dedicación de Virgo en el trabajo sobre sí misma. Cada postura se hace con atención plena.",
      },
      {
        sign: "Capricornio",
        house: 10,
        description:
          "La tierra de la ambición y la estructura. Saturno gobierna la disciplina, la paciencia y la construcción en el tiempo. El Mula Bandha es el bandha de Saturno: estructura invisible que sostiene toda la práctica desde dentro. La raíz que permite crecer hacia arriba.",
      },
    ],
    asanas: [
      {
        nameSanskrit: "Mula Bandha",
        nameSpanish: "Activación de raíz",
        description:
          "Antes de empezar la secuencia: siéntate en Sukhasana. Contrae suavemente el perineo — el espacio entre el ano y los genitales — sin apretar los glúteos ni contraer el abdomen. La contracción es sutil e interna. Mantén el Mula Bandha ligero y presente durante toda la secuencia.",
        duration: "5 veces · 5 respiraciones y 2 de suelta",
      },
      {
        nameSanskrit: "Malasana",
        nameSpanish: "La Guirnalda",
        description:
          "De pie con los pies abiertos ligeramente más que los hombros, puntas hacia afuera unos 45 grados. Dobla las rodillas y baja en una sentadilla profunda llevando el pelvis lo más abajo posible. Lleva los codos al interior de las rodillas y une las palmas en Anjali Mudra en el centro del pecho. Usa los codos para empujar suavemente las rodillas hacia afuera. Si los talones se levantan pon una manta doblada debajo. Mula Bandha ligero y presente.",
        duration: "2 minutos",
      },
      {
        nameSanskrit: "Balasana",
        nameSpanish: "El Niño",
        description:
          "Desde arrodillado lleva los glúteos hacia los talones y baja el torso hacia el suelo con los brazos a lo largo del cuerpo o extendidos hacia adelante. La frente toca la esterilla. Cierra los ojos. Cada espiración deja el cuerpo volverse más pesado. No hay nada que hacer, ningún lugar al que ir.",
        duration: "10 respiraciones profundas",
      },
      {
        nameSanskrit: "Marjaryasana-Bitilasana",
        nameSpanish: "Gato-Vaca",
        description:
          "En cuatro apoyos con muñecas bajo los hombros y rodillas bajo los caderas. Con la inspiración deja que el vientre baje hacia el suelo, el cóccix y la cabeza suben (Vaca). Con la espiración arquea la espalda hacia el techo, ombligo hacia la columna, cabeza y cóccix bajan (Gato). El movimiento parte siempre del cóccix y se propaga vértebra a vértebra hasta la cabeza. Muévete lentamente.",
        duration: "10 ciclos lentos",
      },
      {
        nameSanskrit: "Setu Bandhasana",
        nameSpanish: "El Puente",
        description:
          "Túmbate boca arriba con las rodillas dobladas y los pies en el suelo separados como los caderas. Los talones cerca de los glúteos. Con la inspiración activa el Mula Bandha y empuja los pies en el suelo elevando los caderas hacia el techo vértebra a vértebra. Arriba entrelaza los dedos bajo la espalda y empuja los hombros hacia abajo. Mantén sintiendo el arraigo de los pies y la activación de la cadena posterior.",
        duration: "3 series de 6 respiraciones",
      },
      {
        nameSanskrit: "Supta Baddha Konasana",
        nameSpanish: "Mariposa Supina",
        description:
          "Túmbate boca arriba. Une las plantas de los pies y deja abrir las rodillas hacia los lados como alas de mariposa. Las manos reposan en el abdomen o a los lados. No fuerces las rodillas hacia abajo — deja que la gravedad haga el trabajo. Cada espiración la zona sacra se ablanda y baja hacia la tierra.",
        duration: "3 minutos",
      },
      {
        nameSanskrit: "Paschimottanasana",
        nameSpanish: "Flexión Sentada",
        description:
          "Siéntate con las piernas extendidas hacia adelante. Dobla ligeramente las rodillas si es necesario. Con la inspiración alarga la columna hacia arriba. Con la espiración inclina el torso hacia adelante manteniendo la espalda lo más larga posible. Lleva las manos a las piernas donde lleguen. Deja que la gravedad te lleve hacia abajo sin forzar. Mula Bandha ligero.",
        duration: "2 minutos",
      },
      {
        nameSanskrit: "Prasarita Padottanasana",
        nameSpanish: "Flexión con Piernas Abiertas",
        description:
          "De pie con las piernas muy abiertas, pies paralelos. Con la inspiración alarga la columna. Con la espiración dobla hacia adelante llevando las manos al suelo bajo los hombros. Deja que la cabeza baje hacia el suelo — si llega perfecto, si no usa un bloque. El peso del cráneo que baja aumenta el arraigo.",
        duration: "10 respiraciones",
      },
      {
        nameSanskrit: "Virabhadrasana I",
        nameSpanish: "Guerrero 1",
        description:
          "De pie, da un gran paso hacia atrás con el pie izquierdo. El pie posterior gira unos 45 grados. Dobla la rodilla anterior hasta formar un ángulo de 90 grados. Las manos suben sobre la cabeza. Arraiga con fuerza ambos pies en el suelo sintiendo la solidez de las piernas como raíces de un árbol. En esta secuencia es el único guerrero — porque la tierra necesita fuerza arraigada.",
        duration: "6 respiraciones por lado",
      },
      {
        slug: "tadasana-con-peso",
        nameSanskrit: "Tadasana con peso",
        nameSpanish: "Montana con peso",
        description:
          "De pie, separa los pies al ancho de caderas y sosten un peso ligero en cada mano. Siente el peso bajar hacia las plantas de los pies sin colapsar la postura. Crece desde la coronilla, suaviza rodillas y hombros, y deja que el cuerpo registre la gravedad como una base estable.",
        duration: "8 respiraciones",
      },
      {
        slug: "malasana-tierra-variant",
        nameSanskrit: "Malasana",
        nameSpanish: "Guirnalda",
        description:
          "Baja a una sentadilla profunda con pies abiertos y rodillas siguiendo la direccion de los dedos. Une las palmas delante del pecho y usa los codos para crear espacio sin empujar de mas. Siente el suelo sosteniendo pelvis, pies y respiracion.",
        duration: "8 respiraciones",
      },
      {
        slug: "malasana-tierra-variant-2",
        nameSanskrit: "Malasana",
        nameSpanish: "Guirnalda, variante",
        description:
          "Desde la sentadilla, manten el pecho amplio y las manos en oracion. Si los talones se elevan, coloca una manta debajo. Esta segunda version ofrece variedad visual para trabajar el mismo patron de raiz: caderas bajas, columna presente y pies despiertos.",
        duration: "8 respiraciones",
      },
      {
        slug: "balasana-tierra-variant",
        nameSanskrit: "Balasana",
        nameSpanish: "Nino",
        description:
          "Arrodillate, lleva la pelvis hacia los talones y deja que el torso se entregue al suelo. La frente descansa y la espalda se ensancha con cada exhalacion. Usa esta version como pausa de enraizamiento cuando el cuerpo pide bajar el ritmo.",
        duration: "10 respiraciones",
      },
      {
        slug: "balasana-extendida",
        nameSanskrit: "Balasana extendida",
        nameSpanish: "Nino con brazos al frente",
        description:
          "Desde Balasana, camina las manos hacia adelante y alarga los costados sin despegar la pelvis de los talones mas de lo necesario. La frente baja y los hombros se suavizan. La postura une descanso con una linea larga desde caderas hasta manos.",
        duration: "10 respiraciones",
      },
      {
        slug: "marjaryasana-bitilasana-tierra-variant",
        nameSanskrit: "Marjaryasana-Bitilasana",
        nameSpanish: "Gato-Vaca",
        description:
          "En cuatro apoyos, alterna entre redondear la espalda al exhalar y abrir el pecho al inhalar. El movimiento nace en la pelvis y viaja por toda la columna. Manten manos y rodillas firmes para que la movilidad se sienta contenida por la tierra.",
        duration: "10 ciclos lentos",
      },
      {
        slug: "setu-bandhasana-tierra-variant",
        nameSanskrit: "Setu Bandhasana",
        nameSpanish: "Puente",
        description:
          "Boca arriba, flexiona rodillas y apoya los pies. Presiona el suelo con ambos pies y eleva la pelvis lentamente, vertebra a vertebra. Sosten arriba sintiendo gluteos e isquiotibiales activos sin cargar el cuello.",
        duration: "3 series de 5 respiraciones",
      },
      {
        slug: "supta-baddha-konasana-tierra-variant",
        nameSanskrit: "Supta Baddha Konasana",
        nameSpanish: "Mariposa supina",
        description:
          "Tumbate boca arriba, junta las plantas de los pies y deja que las rodillas caigan hacia los lados. Descansa las manos donde el cuerpo se sienta seguro. La gravedad abre la pelvis sin esfuerzo y el sacro se vuelve pesado.",
        duration: "2 minutos",
      },
      {
        slug: "paschimottanasana-tierra-variant",
        nameSanskrit: "Paschimottanasana",
        nameSpanish: "Flexion sentada",
        description:
          "Sientate con piernas extendidas. Inhala alargando la columna y exhala inclinandote desde la pelvis hacia las piernas. Toma pies, tobillos o piernas sin tirar. La intencion es ceder peso hacia adelante con paciencia.",
        duration: "8 respiraciones",
      },
      {
        slug: "prasarita-padottanasana-tierra-variant",
        nameSanskrit: "Prasarita Padottanasana",
        nameSpanish: "Flexion con piernas abiertas",
        description:
          "Abre las piernas en una base amplia, pies firmes y paralelos. Inclina el torso hacia adelante y apoya las manos en el suelo o bloques. Siente el peso repartido en los cuatro puntos de cada pie mientras la cabeza desciende.",
        duration: "8 respiraciones",
      },
      {
        slug: "virabhadrasana-i-tierra-variant",
        nameSanskrit: "Virabhadrasana I",
        nameSpanish: "Guerrero 1",
        description:
          "Desde una zancada larga, gira el pie posterior y flexiona la rodilla delantera. Eleva los brazos y arraiga ambas piernas como si empujaras la esterilla en direcciones opuestas. La fuerza nace de sostener la base.",
        duration: "5 respiraciones por lado",
      },
      {
        nameSanskrit: "Virabhadrasana II",
        nameSpanish: "Guerrero 2",
        description:
          "Abre las piernas, gira el pie delantero hacia afuera y flexiona esa rodilla. Extiende los brazos en linea con los hombros y mira sobre la mano delantera. Manten ambos pies activos para que la postura sea amplia, firme y estable.",
        duration: "5 respiraciones por lado",
      },
      {
        nameSanskrit: "Uttanasana",
        nameSpanish: "Flexion de pie",
        description:
          "Desde Tadasana, inclinate hacia adelante dejando que el torso caiga sobre las piernas. Dobla rodillas si hace falta y permite que cabeza, cuello y brazos pesen. La postura invita a soltar hacia abajo sin perder contacto con los pies.",
        duration: "8 respiraciones",
      },
      {
        nameSanskrit: "Ardha Uttanasana",
        nameSpanish: "Media flexion",
        description:
          "Desde Uttanasana, lleva las manos a tibias, muslos o bloques y alarga la columna hacia adelante. El pecho se abre, el cuello queda largo y la pelvis se mantiene estable. Es una pausa de claridad entre flexion y verticalidad.",
        duration: "5 respiraciones",
      },
      {
        nameSanskrit: "Padangusthasana",
        nameSpanish: "Tomar el dedo gordo",
        description:
          "De pie, inclinate hacia adelante y toma los dedos gordos con indice y medio si llegas sin forzar. Alarga la espalda al inhalar y profundiza suavemente al exhalar. La base sigue en los pies, no en el tiron de las manos.",
        duration: "6 respiraciones",
      },
      {
        slug: "vrksasana-tierra-variant",
        nameSanskrit: "Vrksasana",
        nameSpanish: "Arbol",
        description:
          "De pie, lleva un pie al muslo interno o pantorrilla de la pierna opuesta, evitando la rodilla. Une las palmas o eleva los brazos. Mira un punto fijo y siente como el equilibrio crece desde la planta del pie apoyado.",
        duration: "5 respiraciones por lado",
      },
      {
        nameSanskrit: "Vrksasana baja",
        nameSpanish: "Arbol bajo",
        description:
          "Apoya un talon en el tobillo contrario o deja los dedos del pie tocando el suelo. Manten la pelvis nivelada y las manos en el pecho. Es una version accesible para cultivar raiz antes de buscar altura.",
        duration: "5 respiraciones por lado",
      },
      {
        slug: "sukhasana-tierra-variant",
        nameSanskrit: "Sukhasana",
        nameSpanish: "Postura facil",
        description:
          "Sientate con piernas cruzadas y pelvis elevada si lo necesitas. Apoya las manos sobre las rodillas y deja que la columna se organice desde la base. La quietud tambien es una postura de tierra.",
        duration: "10 respiraciones",
      },
      {
        nameSanskrit: "Dandasana",
        nameSpanish: "Baston",
        description:
          "Sientate con piernas extendidas y pies activos. Apoya las manos junto a las caderas y crece desde la pelvis hasta la coronilla. La sencillez de la forma revela donde hace falta soporte, fuerza o suavidad.",
        duration: "8 respiraciones",
      },
      {
        nameSanskrit: "Janu Sirsasana",
        nameSpanish: "Cabeza a la rodilla",
        description:
          "Desde sentado, flexiona una rodilla y lleva la planta del pie al muslo interno contrario. Gira el torso hacia la pierna extendida e inclinate desde la pelvis. Respira hacia la parte posterior del cuerpo y cambia de lado.",
        duration: "6 respiraciones por lado",
      },
      {
        slug: "upavista-konasana-simple",
        nameSanskrit: "Upavista Konasana simple",
        nameSpanish: "Sentada con piernas abiertas",
        description:
          "Sientate con las piernas abiertas en un angulo comodo. Apoya las manos delante o junto a la pelvis y alarga la columna. Permite que el interior de las piernas se abra sin empujar, sosteniendo una base amplia y tranquila.",
        duration: "8 respiraciones",
      },
      {
        nameSanskrit: "Adho Mukha Svanasana",
        nameSpanish: "Perro boca abajo",
        description:
          "Desde cuatro apoyos, eleva la pelvis hacia arriba y atras. Dobla rodillas si ayuda a alargar la espalda. Empuja el suelo con las manos y lleva peso hacia los pies, creando una montana estable con el cuerpo.",
        duration: "6 respiraciones",
      },
      {
        nameSanskrit: "Adho Mukha Svanasana sobre rodillas",
        nameSpanish: "Perro boca abajo apoyado",
        description:
          "Desde rodillas, camina las manos al frente y lleva la pelvis hacia atras y arriba, manteniendo las rodillas apoyadas. Alarga axilas y columna sin exigir los isquiotibiales. Es una version mas suave para hombros y espalda.",
        duration: "6 respiraciones",
      },
      {
        nameSanskrit: "Tadasana en puntillas",
        nameSpanish: "Montana en puntillas",
        description:
          "De pie, activa la base y eleva lentamente los talones. Manten el abdomen suave pero despierto y la mirada estable. Baja con control, como si cada descenso volviera a sellar la conexion con la tierra.",
        duration: "6 repeticiones lentas",
      },
      {
        nameSanskrit: "Apanasana",
        nameSpanish: "Rodillas al pecho",
        description:
          "Tumbate boca arriba y abraza las rodillas hacia el pecho. Deja que la espalda baja se ensanche sobre el suelo y respira hacia el abdomen. La postura recoge la energia y devuelve sensacion de contencion.",
        duration: "10 respiraciones",
      },
      {
        slug: "baddha-konasana-tierra-variant",
        nameSanskrit: "Baddha Konasana",
        nameSpanish: "Mariposa sentada",
        description:
          "Sientate, une las plantas de los pies y deja las rodillas abiertas hacia los lados. Manten la columna alta y las manos suaves. Esta imagen extra de la tanda Tierra queda como variante de apertura estable de caderas.",
        duration: "8 respiraciones",
      },
    ],
    pranayama: [
      {
        name: "Bhramari — Respiración de la Abeja",
        description:
          "Siéntate cómodamente con la espalda recta. Lleva los índices a las orejas cerrando suavemente los pabellones auriculares. Cierra los ojos. Inspira profundamente por la nariz. Con la espiración emite un sonido zumbante como una abeja — mmmmm — con la boca cerrada. Siente la vibración que se propaga en la cabeza, la columna vertebral y baja hacia la base del cuerpo. Cuanto más profundo el sonido, más alcanza Muladhara.",
      },
    ],
    savasana: {
      duration: "8 minutos",
      visualization:
        "Túmbate completamente. Visualiza raíces que salen del cóccix y de la planta de los pies hundiéndose en la tierra. Estás sostenida. Estás a salvo. No tienes que ir a ningún lugar.",
    },
    totalDuration: "45 minutos",
  },
  agua: {
    element: "agua",
    bodyZone: "Pelvis · Sacro · Caderas · Interior del Muslo",
    planets: ["Luna", "Neptuno", "Plutón"],
    signs: ["Cáncer", "Escorpio", "Piscis"],
    houses: [4, 8, 12],
    chakra: { name: "Svadhisthana — 2do Chakra", mantra: "VAM" },
    intention:
      "Disolver la rigidez emocional, permitir el flujo, despertar la creatividad y la sensualidad del cuerpo.",
    signsAndCases: [
      {
        sign: "Cáncer",
        house: 4,
        description:
          "El agua de las raíces emocionales y la familia. La Luna gobierna el mundo interior, los recuerdos y la necesidad de protección. Anjaneyasana y la mariposa reflejan la capacidad de Cáncer de abrirse a la vulnerabilidad en un espacio seguro. El cuerpo se convierte en hogar.",
      },
      {
        sign: "Escorpio",
        house: 8,
        description:
          "El agua de la transformación profunda. Plutón gobierna la muerte, el renacimiento y los procesos ocultos. Supta Kapotasana y las torsiones sentadas reflejan la capacidad de Escorpio de bajar a lo profundo y disolver lo que ya no sirve. La cadera guarda los secretos del alma.",
      },
      {
        sign: "Piscis",
        house: 12,
        description:
          "El agua de la disolución y la trascendencia. Neptuno gobierna el sueño, la intuición y la conexión con el todo. El movimiento libre final y Viparita Karani reflejan la cualidad de Piscis: soltar los límites y confiar en el flujo. No hay que saber adonde ir.",
      },
    ],
    asanas: [
      {
        nameSanskrit: "Círculos de cadera de pie",
        nameSpanish: "Círculos de cadera de pie",
        description:
          "De pie con los pies separados como los caderas, rodillas ligeramente dobladas. Cierra los ojos. Empieza a mover los caderas en círculos lentos — primero en una dirección, luego en la otra. No hay un esquema correcto. Deja que la pelvis se mueva como quiera, como el agua que encuentra su camino. Después prueba movimientos adelante y atrás, luego de un lado al otro. La respiración es libre y profunda.",
        duration: "2 minutos",
      },
      {
        nameSanskrit: "Anjaneyasana",
        nameSpanish: "Estocada Baja",
        description:
          "Da un paso largo hacia atrás y baja la rodilla posterior al suelo, acolchándola si hace falta. Eleva el pecho y deja que los brazos suban con suavidad, sin colapsar la zona lumbar. La pelvis desciende como una marea lenta, abriendo el psoas y la parte frontal de la cadera sin empujar.",
        duration: "8 respiraciones por lado",
      },
      {
        nameSanskrit: "Anjaneyasana con manos en la rodilla",
        nameSpanish: "Estocada baja con apoyo",
        description:
          "Desde la estocada baja, lleva ambas manos a la rodilla anterior y deja que el torso se mantenga vertical. Con cada espiración permite que la pelvis se suavice hacia abajo. Esta variante sostiene la apertura desde un lugar más contenido, ideal para escuchar la cadera sin exigir equilibrio.",
        duration: "2 minutos por lado",
      },
      {
        nameSanskrit: "Baddha Konasana",
        nameSpanish: "Mariposa sentada",
        description:
          "Siéntate con las plantas de los pies unidas y las rodillas abiertas hacia los lados. Eleva la pelvis con una manta si la espalda se redondea. Toma los pies con suavidad, alarga la columna y deja que el interior de las piernas se abra sin empujar.",
        duration: "8 respiraciones",
      },
      {
        nameSanskrit: "Baddha Konasana con balanceo",
        nameSpanish: "Mariposa con balanceo",
        description:
          "Siéntate con las plantas de los pies unidas y las rodillas abiertas a los lados. Sujeta los pies con las manos. Empieza pequeños movimientos ondulantes con las rodillas — arriba y abajo como alas de mariposa que baten lentamente. No estás intentando bajar las rodillas, estás permitiendo que la pelvis se mueva con ritmo. Añade un ligero movimiento ondulante del torso adelante y atrás.",
        duration: "2 minutos",
      },
      {
        nameSanskrit: "Upavista Konasana",
        nameSpanish: "Ángulo amplio",
        description:
          "Siéntate con las piernas abiertas en un ángulo cómodo. Mantén las rodillas ligeramente flexionadas si los isquiotibiales tiran y apoya las manos delante o junto a la pelvis. Respira hacia el suelo pélvico y permite que la base se vuelva amplia, líquida y estable.",
        duration: "8 respiraciones",
      },
      {
        nameSanskrit: "Upavista Konasana con torsión torso",
        nameSpanish: "Ángulo amplio con torsión",
        description:
          "Desde Upavista Konasana, apoya una mano detrás de la pelvis y la otra sobre la pierna contraria o el suelo. Inhala para crecer y exhala girando el torso sin tirar del cuello. La torsión nace desde el abdomen bajo y masajea suavemente la zona sacra.",
        duration: "5 respiraciones por lado",
      },
      {
        nameSanskrit: "Ardha Matsyendrasana",
        nameSpanish: "Torsión Sentada",
        description:
          "Siéntate con las piernas extendidas. Dobla la rodilla derecha y lleva el pie derecho al suelo al exterior de la rodilla izquierda. Con la inspiración alarga la columna hacia arriba. Con la espiración rota el torso hacia la derecha llevando el codo izquierdo al exterior de la rodilla derecha. El brazo derecho está en el suelo detrás como apoyo. Esta espiral masajea los órganos reproductivos y el sacro.",
        duration: "5 respiraciones por lado",
      },
      {
        nameSanskrit: "Bharadvajasana",
        nameSpanish: "Torsión simple sentada de lado",
        description:
          "Siéntate con las piernas dobladas hacia un lado. Alarga la columna al inhalar y gira el torso hacia el lado contrario al exhalar, apoyando las manos donde sostengan sin forzar. La pelvis permanece pesada mientras la espalda se mueve como una espiral suave.",
        duration: "5 respiraciones por lado",
      },
      {
        nameSanskrit: "Supta Kapotasana",
        nameSpanish: "Paloma Supina",
        description:
          "Túmbate boca arriba con las rodillas dobladas. Lleva el tobillo derecho sobre la rodilla izquierda con el pie flexionado. Lleva las manos detrás del muslo izquierdo y acerca ambas piernas al pecho. Si sientes tensión intensa aleja las piernas del pecho. Respira directamente en el área de tensión — no la combatas, no huyas de ella. El agua siempre encuentra un paso.",
        duration: "3 minutos por lado",
      },
      {
        nameSanskrit: "Eka Pada Rajakapotasana preparatoria",
        nameSpanish: "Paloma simple",
        description:
          "Desde cuatro apoyos, trae una rodilla hacia la muñeca del mismo lado y extiende la pierna contraria atrás. Mantén la pelvis apoyada sobre un soporte si queda en el aire. El torso puede quedarse erguido o inclinarse apenas, respirando hacia la cadera externa sin perseguir profundidad.",
        duration: "8 respiraciones por lado",
      },
      {
        nameSanskrit: "Viparita Karani",
        nameSpanish: "Piernas en la Pared",
        description:
          "Acerca los glúteos a la pared. Túmbate boca arriba y lleva las piernas extendidas hacia arriba apoyadas en la pared. Lleva los brazos a los lados con las palmas hacia arriba. Esta inversión suave favorece el retorno venoso y linfático en la zona pélvica, descarga la tensión del vientre bajo y estimula el sistema nervioso parasimpático.",
        duration: "5 minutos",
      },
      {
        nameSanskrit: "Supta Padangusthasana",
        nameSpanish: "Pierna estirada supina",
        description:
          "Túmbate boca arriba y eleva una pierna hacia el techo, manteniendo la otra larga o flexionada si la espalda lo pide. Toma detrás del muslo o usa una correa. Respira hacia la parte posterior de la pierna, dejando que el sacro pese sobre el suelo.",
        duration: "6 respiraciones por lado",
      },
      {
        nameSanskrit: "Supta Padangusthasana lateral",
        nameSpanish: "Pierna estirada supina lateral",
        description:
          "Desde Supta Padangusthasana, abre la pierna elevada hacia el lado solo hasta donde la pelvis pueda seguir pesada. La mano contraria puede descansar sobre la cadera opuesta para recordarle al cuerpo que no necesita girar. Respira en la ingle y vuelve lento al centro.",
        duration: "6 respiraciones por lado",
      },
      {
        nameSanskrit: "Círculos de rodillas supina",
        nameSpanish: "Círculos de rodillas boca arriba",
        description:
          "Boca arriba, lleva las rodillas hacia el pecho sin comprimir el abdomen. Dibuja círculos pequeños con ambas rodillas, primero hacia un lado y luego hacia el otro. El movimiento lubrica caderas y sacro, y ayuda a que la respiración vuelva al vientre bajo.",
        duration: "8 círculos por dirección",
      },
      {
        nameSanskrit: "Limpiaparabrisas supino",
        nameSpanish: "Rodillas lado a lado",
        description:
          "Boca arriba con rodillas flexionadas y pies más anchos que las caderas. Deja caer las rodillas hacia un lado y luego hacia el otro, como limpiaparabrisas lentos. Mantén hombros pesados y permite que la pelvis cambie de peso sin brusquedad.",
        duration: "10 ciclos lentos",
      },
      {
        nameSanskrit: "Mandukasana",
        nameSpanish: "Rana suave",
        description:
          "Desde cuatro apoyos, separa las rodillas hasta un rango cómodo y apoya antebrazos o manos. Mantén tobillos en línea con rodillas si es posible y coloca soporte bajo la pelvis si la apertura se siente intensa. Respira amplio hacia el interior de los muslos.",
        duration: "8 respiraciones",
      },
      {
        nameSanskrit: "Gomukhasana piernas",
        nameSpanish: "Piernas de cara de vaca",
        description:
          "Siéntate cruzando una rodilla sobre la otra y acerca los pies hacia los lados de las caderas. Eleva la pelvis con soporte si una cadera queda flotando. Alarga la columna y respira hacia la cadera externa, sin añadir trabajo de brazos.",
        duration: "6 respiraciones por lado",
      },
      {
        nameSanskrit: "Sukhasana con torsión",
        nameSpanish: "Torsión en postura fácil",
        description:
          "Siéntate en Sukhasana sobre una manta si lo necesitas. Lleva una mano a la rodilla contraria y la otra detrás de la pelvis. Inhala para crecer y exhala girando suave, como si la columna fuera agua en espiral. Cambia de lado sin prisa.",
        duration: "5 respiraciones por lado",
      },
      {
        nameSanskrit: "Parighasana",
        nameSpanish: "Postura del cerrojo",
        description:
          "Desde rodillas, extiende una pierna hacia el lado con el pie apoyado. Lleva una mano a la pierna extendida y el otro brazo por encima de la cabeza, creando una apertura lateral desde la cintura. Respira hacia las costillas bajas y cambia de lado.",
        duration: "5 respiraciones por lado",
      },
      {
        nameSanskrit: "Skandasana",
        nameSpanish: "Estocada lateral",
        description:
          "Separa los pies en una base amplia y flexiona una rodilla mientras la otra pierna se alarga hacia el lado. Mantén manos en el suelo o juntas delante del pecho, según el equilibrio. La pelvis se desplaza de forma lateral, explorando profundidad sin perder suavidad.",
        duration: "5 respiraciones por lado",
      },
      {
        nameSanskrit: "Parsva Balasana",
        nameSpanish: "Hilo en aguja",
        description:
          "En cuatro apoyos, desliza un brazo por debajo del pecho hacia el lado contrario hasta apoyar hombro y sien. La otra mano puede quedarse delante del rostro o caminar un poco hacia adelante. Respira en la parte alta de la espalda y cambia de lado.",
        duration: "6 respiraciones por lado",
      },
      {
        nameSanskrit: "Posición fetal lateral",
        nameSpanish: "Descanso fetal de lado",
        description:
          "Recuéstate de lado con las rodillas flexionadas hacia el pecho y una mano sosteniendo la cabeza o el abdomen. Deja que la espalda se redondee con naturalidad y que la respiración se vuelva íntima. Esta forma cierra la práctica como un regreso al agua interna.",
        duration: "2 minutos por lado",
      },
    ],
    pranayama: [
      {
        name: "Respiración en Ola",
        description:
          "Siéntate o túmbate cómodamente. Con la inspiración deja entrar el aire primero en el vientre bajo — siéntelo expandirse como un globo. Luego el aire sube hacia el pecho, las costillas se ensanchan. Luego las clavículas se elevan ligeramente. Con la espiración vacía de arriba abajo: clavículas, pecho, abdomen. El movimiento recuerda una ola que entra y sale. Cada ciclo dura unos 8-10 segundos. 10 ciclos.",
      },
      {
        name: "Sitali — Respiración Refrescante",
        description:
          "Enrolla la lengua formando un tubo — si no puedes mantén la punta de la lengua entre los dientes ligeramente abiertos (Sitkari). Inspira lentamente a través de la lengua enrollada sintiendo el aire fresco entrar. Cierra la boca y espira lentamente por la nariz. Enfría el sistema, calma las emociones intensas, fluidifica todo lo activado durante la práctica. 10 ciclos.",
      },
    ],
    savasana: {
      duration: "8 minutos",
      visualization:
        "Túmbate. Visualiza el cuerpo líquido. Cada emoción es una ola que llega, atraviesa y pasa. No tienes que retenerla ni rechazarla.",
    },
    totalDuration: "45 minutos",
  },
  aire: {
    element: "aire",
    bodyZone: "Pecho · Pulmones · Hombros · Clavícula · Brazos",
    planets: ["Mercurio", "Venus", "Urano"],
    signs: ["Géminis", "Libra", "Acuario"],
    houses: [3, 7, 11],
    chakra: { name: "Anahata — 4to Chakra", mantra: "YAM" },
    intention:
      "Abrir el corazón hacia el mundo, expandirse, cultivar la ligereza, la conexión y la disponibilidad.",
    signsAndCases: [
      {
        sign: "Géminis",
        house: 3,
        description:
          "El aire de la comunicación y el intercambio. Mercurio gobierna la mente, las palabras y la conexión con el entorno. Las aperturas torácicas y Garudasana reflejan la agilidad de Géminis de conectar mundos diferentes. La respiración es el primer lenguaje.",
      },
      {
        sign: "Libra",
        house: 7,
        description:
          "El aire de las relaciones y el equilibrio. Venus gobierna la armonía, la belleza y la capacidad de encontrarse con el otro. Camatkarasana y Matsyasana reflejan la cualidad de Libra: abrirse al otro manteniendo el propio centro. El corazón se ofrece sin perderse.",
      },
      {
        sign: "Acuario",
        house: 11,
        description:
          "El aire de la visión colectiva y la innovación. Urano gobierna el cambio repentino y la libertad. El movimiento libre y las inversiones juguetonas reflejan la cualidad de Acuario: salir de los esquemas con alegría. La práctica es un acto de libertad.",
      },
    ],
    asanas: [
      {
        nameSanskrit: "Brazos al cielo en Tadasana",
        nameSpanish: "Montaña con brazos al cielo",
        description:
          "De pie en Tadasana, enraíza los pies y eleva ambos brazos hacia el cielo. Mantén las costillas bajas suaves, la nuca larga y los hombros lejos de las orejas. Cada inhalación abre espacio en los pulmones; cada exhalación ordena la columna sin rigidez.",
        duration: "8 respiraciones",
      },
      {
        nameSanskrit: "Anahatasana",
        nameSpanish: "Corazón en Tierra",
        description:
          "En cuatro apoyos. Camina con las manos hacia adelante manteniendo los caderas sobre las rodillas. Deja que el pecho baje hacia el suelo con el mentón o la frente en tierra. Los brazos están extendidos hacia adelante. Siente la apertura profunda entre las escápulas y en el pecho. Aquí Anahata se abre hacia la tierra — una apertura humilde y profunda.",
        duration: "2 minutos",
      },
      {
        nameSanskrit: "Bhujangasana",
        nameSpanish: "Cobra",
        description:
          "Túmbate boca abajo con las manos bajo los hombros y los codos cerca del cuerpo. Con la inhalación, eleva el pecho usando primero la espalda y luego el apoyo de las manos. No levantes la pelvis ni los huesos de la cadera del suelo. Ajusta la flexión de los codos según la movilidad de tu espalda, sin forzar la zona lumbar. Mantén el pubis pesado, hombros amplios y mirada al frente.",
        duration: "5 respiraciones",
      },
      {
        slug: "bhujangasana-baja",
        nameSanskrit: "Bhujangasana baja",
        nameSpanish: "Esfinge",
        description:
          "Boca abajo, apoya antebrazos en el suelo con codos debajo o ligeramente delante de los hombros. Alarga las piernas y deja que el pecho avance entre los brazos. La apertura es baja, respirable y sostenida, como una ventana suave para los pulmones.",
        duration: "8 respiraciones",
      },
      {
        nameSanskrit: "Gomukhasana Brazos",
        nameSpanish: "Cara de Vaca",
        description:
          "Puedes hacer esta postura sentada o de pie. Extiende el brazo derecho hacia el techo. Dobla el codo llevando la mano derecha hacia la nuca. Con el brazo izquierdo lleva la mano izquierda hacia la espalda desde abajo intentando enganchar los dedos. Si no se enganchan usa una toalla o una correa. Mantén el codo derecho apuntando hacia el techo. Siente la apertura profunda de los hombros y toda la zona lateral del pecho.",
        duration: "2 minutos por lado",
      },
      {
        nameSanskrit: "Garudasana brazos",
        nameSpanish: "Águila solo brazos",
        description:
          "De pie, dobla ligeramente las rodillas. Lleva el brazo derecho bajo el brazo izquierdo y envuelve los antebrazos llevando las palmas en contacto si es posible. Eleva los codos a la altura de los hombros. Siente como las escápulas se abren — esto disuelve la zona entre las escápulas donde a menudo se acumula la tensión emocional.",
        duration: "8 respiraciones por lado",
      },
      {
        nameSanskrit: "Matsyasana",
        nameSpanish: "El Pez",
        description:
          "Túmbate boca arriba con las piernas extendidas. Lleva las manos bajo los glúteos con las palmas hacia abajo. Presiona los codos en el suelo y eleva el pecho hacia el techo dejando que la cabeza caiga hacia atrás. El peso está en los antebrazos, no en el cuello. El pecho está completamente abierto hacia el cielo. Respira profundamente sintiendo los pulmones expandirse en todas las direcciones.",
        duration: "2 minutos",
      },
      {
        nameSanskrit: "Matsyasana apoyado",
        nameSpanish: "Pez con cojín bajo escápulas",
        description:
          "Coloca un cojín, bolster o manta enrollada bajo las escápulas y recuéstate sobre el soporte. Deja que la cabeza descanse donde el cuello se sienta cómodo y permite que los brazos caigan a los lados. La postura abre el pecho sin esfuerzo, como si el aire hiciera espacio desde dentro.",
        duration: "2 minutos",
      },
      {
        nameSanskrit: "Setu Bandhasana con apertura costal",
        nameSpanish: "Puente con apertura costal",
        description:
          "Túmbate boca arriba con rodillas flexionadas y pies apoyados. Eleva la pelvis en Setu Bandhasana y lleva los brazos por encima de la cabeza si los hombros lo permiten. Respira hacia las costillas laterales, dejando que el puente sea amplio y liviano, no tenso.",
        duration: "5 respiraciones",
      },
      {
        nameSanskrit: "Balasana con Brazos Abiertos",
        nameSpanish: "Balasana con Brazos Abiertos",
        description:
          "Lleva los glúteos hacia los talones y baja el torso. Abre los brazos hacia los lados, o apóyalos donde el pecho pueda descansar sin tensión. El corazón ha trabajado; ahora se recoge abierto y suave.",
        duration: "10 respiraciones",
      },
      {
        nameSanskrit: "Balasana con brazos extendidos al frente",
        nameSpanish: "Balasana extendida",
        description:
          "Desde Balasana, camina las manos hacia adelante y deja que la frente baje al suelo o a un soporte. Alarga axilas, costillas y espalda alta mientras la pelvis descansa hacia los talones. La respiración se abre por la parte posterior del corazón.",
        duration: "10 respiraciones",
      },
      {
        nameSanskrit: "Apertura torácica en cuatro apoyos",
        nameSpanish: "Brazo al cielo",
        description:
          "En cuatro apoyos, lleva una mano detrás de la nuca o extiende el brazo hacia el cielo. Inhala abriendo el pecho hacia el lado y exhala volviendo al centro con control. La rotación nace en la parte alta de la espalda, como una ventana que se abre para ventilar el pecho.",
        duration: "8 repeticiones por lado",
      },
      {
        nameSanskrit: "Parsva Balasana invertida",
        nameSpanish: "Brazo enhebrado al cielo",
        description:
          "Desde cuatro apoyos, enhebra un brazo por debajo del pecho y apoya hombro y sien. El brazo libre puede quedarse como apoyo o abrirse hacia arriba si el equilibrio y el cuello están cómodos. Respira entre las escápulas y cambia de lado sin prisa.",
        duration: "6 respiraciones por lado",
      },
      {
        nameSanskrit: "Círculos de hombros sentada",
        nameSpanish: "Círculos de hombros sentada",
        description:
          "Siéntate con la columna alta y los brazos relajados. Dibuja círculos lentos con los hombros, primero hacia atrás y luego hacia adelante. Permite que el movimiento libere cuello, clavículas y parte alta de la espalda sin levantar la respiración.",
        duration: "8 círculos por dirección",
      },
      {
        nameSanskrit: "Postura de la mariposa con brazos abiertos",
        nameSpanish: "Mariposa con brazos abiertos",
        description:
          "Siéntate en Baddha Konasana y abre los brazos a los lados con las palmas hacia arriba o hacia adelante. Eleva la pelvis con soporte si lo necesitas. La base se suaviza mientras el pecho se ofrece al aire con amplitud y calma.",
        duration: "8 respiraciones",
      },
      {
        nameSanskrit: "Sukhasana con manos en el corazón",
        nameSpanish: "Postura fácil con manos al corazón",
        description:
          "Siéntate en Sukhasana sobre una manta si ayuda a alargar la espalda. Junta las manos delante del corazón y deja que los pulgares toquen el esternón. Siente el ritmo de la respiración en las palmas y permite que el pecho se vuelva receptivo.",
        duration: "8 respiraciones",
      },
      {
        nameSanskrit: "Sukhasana con brazos al cielo",
        nameSpanish: "Postura fácil con brazos al cielo",
        description:
          "Desde Sukhasana, eleva los brazos hacia arriba con hombros relajados. Mantén la pelvis pesada y la coronilla larga. La respiración sube por los costados como una corriente clara, ampliando pulmones y clavículas.",
        duration: "8 respiraciones",
      },
      {
        nameSanskrit: "Apertura de pecho con manos entrelazadas atrás",
        nameSpanish: "Manos entrelazadas atrás",
        description:
          "De pie o sentada, entrelaza las manos detrás de la espalda y alarga los nudillos hacia atrás y abajo. Abre clavículas sin empujar las costillas hacia adelante. Si los hombros se tensan, toma una correa o separa más las manos.",
        duration: "6 respiraciones",
      },
      {
        nameSanskrit: "Apertura de pecho con manos en lumbares",
        nameSpanish: "Manos en lumbares",
        description:
          "Coloca las manos en la zona lumbar con dedos hacia abajo o hacia los lados. Lleva codos ligeramente hacia atrás y eleva el esternón sin colapsar el cuello. Es una apertura pequeña y directa para recordar al pecho que puede respirar.",
        duration: "6 respiraciones",
      },
      {
        nameSanskrit: "Estiramiento lateral de pie",
        nameSpanish: "Medialuna simple",
        description:
          "Desde Tadasana, eleva un brazo y deja que el torso se incline suavemente hacia el lado contrario. Mantén ambos pies enraizados y respira hacia las costillas abiertas. Vuelve al centro y cambia de lado, buscando espacio más que profundidad.",
        duration: "5 respiraciones por lado",
      },
      {
        nameSanskrit: "Cobra con manos elevadas",
        nameSpanish: "Cobra sin apoyo de manos",
        description:
          "Boca abajo, lleva las manos apenas elevadas del suelo o flotando junto al pecho. Inhala y levanta el pecho desde la fuerza de la espalda alta, manteniendo el cuello largo. La postura refina la apertura torácica sin depender del empuje de los brazos.",
        duration: "3 series de 4 respiraciones",
      },
    ],
    pranayama: [
      {
        name: "Ujjayi — Respiración Victoriosa",
        description:
          "Siéntate cómodamente con la espalda recta. Lleva la mano delante de la boca abierta e intenta empañarla — siente el calor del aliento en la mano. Ahora cierra la boca y reproduce ese mismo sonido con la respiración por la nariz, creando una ligera constricción en la parte posterior de la garganta. El sonido se parece a las olas del mar. Cada inspiración expande lateralmente las costillas como un acordeón. Cada espiración las costillas se acercan lentamente. 10 ciclos.",
      },
      {
        name: "Anuloma Viloma — Respiración Alterna",
        description:
          "Con la mano derecha dobla índice y medio hacia la palma. Pulgar en la fosa derecha, anular y meñique en la izquierda. Cierra la fosa derecha e inspira por la izquierda contando 4. Cierra ambas reteniendo 4. Abre la derecha y espira 8 tiempos. Inspira por la derecha 4. Cierra ambas 4. Espira por la izquierda 8. 10 ciclos. Equilibra los dos hemisferios cerebrales y aporta claridad mental después de la apertura del corazón.",
      },
    ],
    savasana: {
      duration: "7 minutos",
      visualization:
        "Túmbate completamente. El pecho se expande como el cielo. El corazón está abierto y disponible. Estás conectada a todo lo que te rodea sin perderte.",
    },
    totalDuration: "45 minutos",
  },
};
