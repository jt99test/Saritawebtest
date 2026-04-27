export type Asana = {
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
        nameSanskrit: "Tadasana",
        nameSpanish: "Tadasana Activa",
        description:
          "De pie con los pies juntos o ligeramente separados. Distribuye el peso uniformemente en toda la planta del pie. Contrae suavemente el core llevando el ombligo hacia la columna vertebral sin retener la respiración — solo una activación ligera. Hombros relajados lejos de las orejas, mentón paralelo al suelo. Respira lentamente y observa el calor que se genera en el centro del cuerpo.",
        duration: "10 respiraciones profundas",
      },
      {
        nameSanskrit: "Navasana",
        nameSpanish: "El Barco",
        description:
          "Siéntate en el suelo con las rodillas dobladas y los pies en el suelo. Inclina ligeramente el torso hacia atrás hasta encontrar el punto de equilibrio sobre los isquiones. Eleva los pies del suelo llevando las piernas paralelas al suelo — rodillas dobladas para principiantes, piernas extendidas para quien tiene más práctica. Lleva los brazos paralelos al suelo a los lados de las piernas. El core está completamente activado, la espalda recta sin hundirse. Entre series lleva las rodillas al pecho.",
        duration: "3 series de 5 respiraciones · 3 respiraciones de pausa entre series",
      },
      {
        nameSanskrit: "Ardha Navasana",
        nameSpanish: "Medio Barco",
        description:
          "Desde Navasana baja lentamente las piernas hacia el suelo sin llegar a tocarlo. Las piernas permanecen a unos 30 cm del suelo. Las manos pueden entrelazar los dedos detrás de la nuca o quedarse extendidas hacia adelante. El fuego en el core es intenso — respira dentro de la sensación sin huir.",
        duration: "3 series de 4 respiraciones",
      },
      {
        nameSanskrit: "Salabhasana",
        nameSpanish: "La Langosta",
        description:
          "Túmbate boca abajo con los brazos a lo largo del cuerpo, palmas hacia arriba y frente en el suelo. Con la inspiración eleva simultáneamente cabeza, pecho, brazos y piernas del suelo. El cuerpo forma una banana invertida. La fuerza viene del core posterior, no de los glúteos. Mantén el cuello largo, la mirada ligeramente hacia adelante.",
        duration: "3 series de 5 respiraciones",
      },
      {
        nameSanskrit: "Dhanurasana",
        nameSpanish: "El Arco",
        description:
          "Túmbate boca abajo. Dobla las rodillas y lleva los talones hacia los glúteos. Extiende los brazos hacia atrás y agarra los tobillos por fuera — no los pies. Con la inspiración empuja los pies hacia arriba y hacia el techo mientras tiras con las manos: esto crea la tensión que eleva pecho y muslos del suelo. El cuerpo oscila como un arco. Mantén la respiración fluida.",
        duration: "3 series de 4 respiraciones",
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
      {
        nameSanskrit: "Ustrasana",
        nameSpanish: "El Camello",
        description:
          "Arrodíllate con las rodillas separadas como los caderas. Lleva las manos a los lumbares con los dedos hacia abajo. Con la inspiración abre el pecho hacia el techo y empieza a inclinarte hacia atrás. Si estás lista lleva las manos a los talones — si no queda con las manos en los lumbares. El cuello es largo. Esta apertura del pecho después de trabajar el core crea confianza en el propio fuego interior.",
        duration: "5 respiraciones",
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
        nameSanskrit: "Flujo Pélvico Libre",
        nameSpanish: "Flujo Pélvico Libre",
        description:
          "De pie con los pies separados como los caderas, rodillas ligeramente dobladas. Cierra los ojos. Empieza a mover los caderas en círculos lentos — primero en una dirección, luego en la otra. No hay un esquema correcto. Deja que la pelvis se mueva como quiera, como el agua que encuentra su camino. Después prueba movimientos adelante y atrás, luego de un lado al otro. La respiración es libre y profunda.",
        duration: "2 minutos",
      },
      {
        nameSanskrit: "Anjaneyasana Profundo",
        nameSpanish: "Estocada Baja",
        description:
          "De pie, da un gran paso hacia atrás con el pie izquierdo y baja la rodilla al suelo. La rodilla anterior derecha forma un ángulo de 90 grados. Lleva ambas manos a la rodilla anterior. Deja la pelvis bajar hacia abajo — no empujes activamente, deja que la gravedad y la respiración hagan el trabajo. Con cada espiración los psoas se abren. Los psoas acumulan la memoria emocional — abrirlos es un acto de liberación.",
        duration: "2 minutos por lado",
      },
      {
        nameSanskrit: "Baddha Konasana con Oscilación",
        nameSpanish: "La Mariposa",
        description:
          "Siéntate con las plantas de los pies unidas y las rodillas abiertas a los lados. Sujeta los pies con las manos. Empieza pequeños movimientos ondulantes con las rodillas — arriba y abajo como alas de mariposa que baten lentamente. No estás intentando bajar las rodillas, estás permitiendo que la pelvis se mueva con ritmo. Añade un ligero movimiento ondulante del torso adelante y atrás.",
        duration: "2 minutos",
      },
      {
        nameSanskrit: "Upavista Konasana con Movimiento",
        nameSpanish: "Ángulo Amplio",
        description:
          "Siéntate con las piernas abiertas en un ángulo amplio. Manos en el suelo delante de ti. Empieza a oscilar el torso lentamente de derecha a izquierda como un péndulo. Luego prueba a hacer círculos lentos con el torso. El interior del muslo se abre gradualmente y la zona del segundo chakra respira.",
        duration: "2 minutos",
      },
      {
        nameSanskrit: "Ardha Matsyendrasana",
        nameSpanish: "Torsión Sentada",
        description:
          "Siéntate con las piernas extendidas. Dobla la rodilla derecha y lleva el pie derecho al suelo al exterior de la rodilla izquierda. Con la inspiración alarga la columna hacia arriba. Con la espiración rota el torso hacia la derecha llevando el codo izquierdo al exterior de la rodilla derecha. El brazo derecho está en el suelo detrás como apoyo. Esta espiral masajea los órganos reproductivos y el sacro.",
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
        nameSanskrit: "Viparita Karani",
        nameSpanish: "Piernas en la Pared",
        description:
          "Acerca los glúteos a la pared. Túmbate boca arriba y lleva las piernas extendidas hacia arriba apoyadas en la pared. Lleva los brazos a los lados con las palmas hacia arriba. Esta inversión suave favorece el retorno venoso y linfático en la zona pélvica, descarga la tensión del vientre bajo y estimula el sistema nervioso parasimpático.",
        duration: "5 minutos",
      },
      {
        nameSanskrit: "Movimiento Libre Final",
        nameSpanish: "Movimiento Libre Final",
        description:
          "Vuelve de pie o siéntate. Cierra los ojos. Muévete solo siguiendo la respiración y las sensaciones del cuerpo. No hay una postura correcta. Deja que el agua encuentre su forma natural por hoy.",
        duration: "3 minutos",
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
        nameSanskrit: "Apertura Torácica en Cuatro Apoyos",
        nameSpanish: "Apertura Torácica en Cuatro Apoyos",
        description:
          "En cuatro apoyos con muñecas bajo los hombros y rodillas bajo los caderas. Lleva la mano derecha detrás de la nuca con el codo abierto hacia el lado. Con la inspiración abre el codo hacia el techo rotando la columna torácica — solo la parte alta de la espalda se mueve. Con la espiración lleva el codo hacia abajo haciendo pasar el brazo bajo el pecho hacia el lado izquierdo. El pecho se abre y se cierra como un corazón que respira.",
        duration: "8 por lado",
      },
      {
        nameSanskrit: "Anahatasana",
        nameSpanish: "Corazón en Tierra",
        description:
          "En cuatro apoyos. Camina con las manos hacia adelante manteniendo los caderas sobre las rodillas. Deja que el pecho baje hacia el suelo con el mentón o la frente en tierra. Los brazos están extendidos hacia adelante. Siente la apertura profunda entre las escápulas y en el pecho. Aquí Anahata se abre hacia la tierra — una apertura humilde y profunda.",
        duration: "2 minutos",
      },
      {
        nameSanskrit: "Bhujangasana Bajo",
        nameSpanish: "La Cobra",
        description:
          "Túmbate boca abajo con las manos planas bajo los hombros. Lleva los codos cerca de las costillas. Con la inspiración eleva el pecho usando solo los músculos de la espalda — los brazos se enderezan solo parcialmente. Los hombros bajan lejos de las orejas. El cuello es largo. No eches la cabeza hacia atrás. Siente el pecho abrirse hacia el cielo. Con la espiración baja lentamente.",
        duration: "3 series de 5 respiraciones",
      },
      {
        nameSanskrit: "Gomukhasana Brazos",
        nameSpanish: "Cara de Vaca",
        description:
          "Puedes hacer esta postura sentada o de pie. Extiende el brazo derecho hacia el techo. Dobla el codo llevando la mano derecha hacia la nuca. Con el brazo izquierdo lleva la mano izquierda hacia la espalda desde abajo intentando enganchar los dedos. Si no se enganchan usa una toalla o una correa. Mantén el codo derecho apuntando hacia el techo. Siente la apertura profunda de los hombros y toda la zona lateral del pecho.",
        duration: "2 minutos por lado",
      },
      {
        nameSanskrit: "Garudasana",
        nameSpanish: "El Águila",
        description:
          "De pie, dobla ligeramente las rodillas. Lleva el brazo derecho bajo el brazo izquierdo y envuelve los antebrazos llevando las palmas en contacto si es posible. Eleva los codos a la altura de los hombros. Siente como las escápulas se abren — esto disuelve la zona entre las escápulas donde a menudo se acumula la tensión emocional.",
        duration: "8 respiraciones por lado",
      },
      {
        nameSanskrit: "Camatkarasana",
        nameSpanish: "La Estrella Fugaz",
        description:
          "Desde el perro boca abajo, lleva el peso al brazo izquierdo. Abre el cuerpo rotando hacia la derecha llevando el pie derecho al suelo. El brazo derecho sube hacia el techo. El pecho está abierto hacia el cielo. Esta postura pide confianza — deja que el corazón se abra sin miedo.",
        duration: "3 respiraciones por lado",
      },
      {
        nameSanskrit: "Matsyasana",
        nameSpanish: "El Pez",
        description:
          "Túmbate boca arriba con las piernas extendidas. Lleva las manos bajo los glúteos con las palmas hacia abajo. Presiona los codos en el suelo y eleva el pecho hacia el techo dejando que la cabeza caiga hacia atrás. El peso está en los antebrazos, no en el cuello. El pecho está completamente abierto hacia el cielo. Respira profundamente sintiendo los pulmones expandirse en todas las direcciones.",
        duration: "2 minutos",
      },
      {
        nameSanskrit: "Setu Bandhasana con Respiración Expansiva",
        nameSpanish: "Setu Bandhasana con Respiración Expansiva",
        description:
          "Túmbate boca arriba, rodillas dobladas, pies en el suelo. Con la inspiración eleva los caderas y concéntrate en la expansión lateral de las costillas — cada inspiración las costillas se abren como alas. Siente los pulmones expandirse en anchura. Entrelaza los dedos bajo la espalda y empuja los hombros hacia abajo abriendo aún más el pecho.",
        duration: "5 respiraciones mantenida",
      },
      {
        nameSanskrit: "Balasana con Brazos Abiertos",
        nameSpanish: "Balasana con Brazos Abiertos",
        description:
          "Lleva los glúteos hacia los talones y baja el torso. Los brazos están abiertos a los lados como alas de un pájaro posado. El corazón ha trabajado, ahora se descansa abierto y suave.",
        duration: "10 respiraciones",
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
