import type { Asana, ElementRoutine, Pranayama } from "./yoga-routines";
import type { Locale } from "@/lib/i18n";

type RoutineElement = ElementRoutine["element"];

type LocalizedAsana = Pick<Asana, "nameSpanish" | "description" | "duration" | "warning">;
type LocalizedPranayama = Pick<Pranayama, "name" | "description" | "contraindications">;

type LocalizedRoutineCopy = {
  bodyZone: string;
  emotional: string;
  planets: string[];
  signs: string[];
  intention: string;
  signsAndHouses: string[];
  asanas: Record<string, LocalizedAsana>;
  pranayama: LocalizedPranayama[];
  savasana: ElementRoutine["savasana"];
};

const yogaCopy: Record<Exclude<Locale, "es">, Record<RoutineElement, LocalizedRoutineCopy>> = {
  en: {
    fuego: {
      bodyZone: "Core, diaphragm, ribs",
      emotional: "Will",
      planets: ["Mars", "Sun", "Jupiter"],
      signs: ["Aries", "Leo", "Sagittarius"],
      intention: "Build clean heat: willpower, courage, and action without tipping into strain.",
      signsAndHouses: [
        "Aries brings the first spark: identity, drive, and the courage to begin. This practice channels that directness through the centre of the body.",
        "Leo brings creative fire. The heart opens after the core wakes up, so confidence feels warm rather than forced.",
        "Sagittarius brings vision. Twists help you look further ahead while keeping your centre steady.",
      ],
      asanas: {
        tadasana: {
          nameSpanish: "Active Mountain",
          duration: "10 deep breaths",
          description: "Stand with your feet together or hip-width apart. Spread the weight evenly through the soles, soften the knees, and gently draw the lower belly in without holding your breath. Let the shoulders drop and keep the chin level. Breathe until you can feel quiet heat gathering at the centre.",
          warning: "Avoid locking the knees. If you feel light-headed, reduce the effort and practise near a wall.",
        },
        navasana: {
          nameSpanish: "Boat pose",
          duration: "3 rounds of 5 breaths, with 3 resting breaths between rounds",
          description: "Sit with the knees bent and the feet on the floor. Lean back until you balance on the sitting bones, then lift the feet. Keep the shins parallel to the floor or extend the legs if your back stays long. Reach the arms forward and let the belly work without collapsing the chest.",
          warning: "Do not force this with low-back pain, abdominal hernia, or pregnancy. Keep the knees bent if the belly shakes too much.",
        },
        "ardha-navasana": {
          nameSpanish: "Half Boat",
          duration: "3 rounds of 4 breaths",
          description: "From Boat, lower the legs and torso only as far as you can keep the lower back supported. The hands can reach forward or cradle the back of the head. Stay with the heat, but keep the breath honest and steady.",
          warning: "Avoid this variation with acute low-back pain, diastasis, or advanced pregnancy. Come out before the breath becomes strained.",
        },
        salabhasana: {
          nameSpanish: "Locust pose",
          duration: "3 rounds of 5 breaths",
          description: "Lie on your belly with the arms alongside the body. As you inhale, lift the head, chest, arms, and legs a little from the floor. Keep the back of the neck long and let the lift come from the back body rather than squeezing hard through the glutes.",
          warning: "Skip this with acute low-back pain, neck injury, or pregnancy. Lift less and keep the neck spacious.",
        },
        dhanurasana: {
          nameSpanish: "Bow pose",
          duration: "3 rounds of 4 breaths",
          description: "Lie on your belly, bend the knees, and hold the outer ankles. Press the feet back into the hands so the chest and thighs lift naturally. Keep the breath moving; the pose should feel bright and elastic, not jammed into the lower back.",
          warning: "Avoid with pregnancy, low-back pain, hernia, uncontrolled high blood pressure, or strong knee discomfort.",
        },
        "parivrtta-janu-sirsasana": {
          nameSpanish: "Revolved side stretch",
          duration: "5 breaths each side",
          description: "Sit with the legs wide and fold one foot toward the inner thigh. Turn slightly toward the extended leg, then side-bend over it. Reach the top arm past the ear and breathe into the side ribs, letting the twist massage the waist without pulling.",
          warning: "Keep it gentle with hamstring, sacroiliac, or low-back injury. Do not collapse the side waist.",
        },
        "parivrtta-trikonasana": {
          nameSpanish: "Revolved Triangle",
          duration: "5 breaths each side",
          description: "Step the feet wide, turn the front foot forward, and angle the back foot in. Bring the opposite hand to a block, shin, or floor, then rotate the chest open. Let the belly support the twist so the spine feels long.",
          warning: "Use a block if the hamstrings or low back pull. Avoid deep twists during pregnancy.",
        },
        ustrasana: {
          nameSpanish: "Camel pose",
          duration: "5 breaths",
          description: "Kneel with the knees hip-width apart and place the hands on the low back. Lift the chest before moving back. Stay there, or take the hands to the heels if the breath remains easy. Let the front body open from strength, not from dropping into the spine.",
          warning: "Protect the low back and neck. Avoid with vertigo, active migraine, neck injury, or acute low-back pain.",
        },
      },
      pranayama: [
        {
          name: "Kapalabhati, fire breath",
          description: "Sit tall. Inhale naturally, then pulse the exhale through the nose by drawing the navel in sharply. Let each inhale return on its own. Start slowly, rest between rounds, and finish with a smooth full breath.",
          contraindications: "Avoid during pregnancy, with uncontrolled high blood pressure, or with heart conditions. Practise 3 rounds of 30 pulses only if it feels appropriate.",
        },
        {
          name: "Nadi Shodhana, alternate nostril breathing",
          description: "Use the right hand to alternate the nostrils: inhale left, pause, exhale right; inhale right, pause, exhale left. Keep the count comfortable. This steadies the nervous system after the fire work.",
        },
      ],
      savasana: {
        duration: "5-7 minutes",
        visualization: "Lie down fully. Imagine a steady golden flame at the navel: not too large, not fading. Your power is present, warm, and balanced.",
      },
    },
    tierra: {
      bodyZone: "Feet, legs, pelvic floor, tailbone",
      emotional: "Structure",
      planets: ["Saturn", "Venus", "Mercury"],
      signs: ["Taurus", "Virgo", "Capricorn"],
      intention: "Return to the body, make steadiness tangible, and build support from the ground up.",
      signsAndHouses: [
        "Taurus teaches safety through the senses. The practice slows down enough for the body to feel like a place you can inhabit.",
        "Virgo brings care, rhythm, and attention. Each shape becomes a small act of maintenance rather than performance.",
        "Capricorn gives the invisible structure. Root work supports the whole sequence from the inside.",
      ],
      asanas: {
        "mula-bandha": {
          nameSpanish: "Root lock activation",
          duration: "5 rounds: hold for 5 breaths, release for 2",
          description: "Sit comfortably. Gently draw up through the pelvic floor, as if lifting the space between the sit bones, without gripping the glutes or belly. Keep it subtle. This is a quiet inner support, not a hard contraction.",
          warning: "Keep the engagement soft. Avoid sustained tension with pelvic pain, recent postpartum recovery, or surgical recovery.",
        },
        malasana: {
          nameSpanish: "Garland squat",
          duration: "2 minutes",
          description: "Stand with the feet wider than the hips and turn the toes out. Bend the knees into a deep squat, resting the elbows inside the thighs and the palms together at the chest. Support the heels if they lift. Let the pelvis settle and the breath widen the back.",
          warning: "Support the heels if ankles or knees complain. Avoid going deep with hip or knee injury.",
        },
        balasana: {
          nameSpanish: "Child's pose",
          duration: "10 deep breaths",
          description: "Kneel, sit the hips toward the heels, and fold the torso down. Arms can rest forward or alongside the body. Let each exhale make you heavier. There is nowhere to get to here.",
          warning: "Widen the knees or use support with knee, hip, or pregnancy discomfort. Do not compress the belly.",
        },
        "marjaryasana-bitilasana": {
          nameSpanish: "Cat-Cow",
          duration: "10 slow cycles",
          description: "Come to hands and knees. Inhale as the belly softens and the chest moves forward; exhale as the spine rounds and the navel draws back. Let the wave begin at the tailbone and travel slowly through the whole spine.",
          warning: "Move gently with wrist, shoulder, or neck injury. Come to forearms if needed.",
        },
        "setu-bandhasana": {
          nameSpanish: "Bridge pose",
          duration: "3 rounds of 6 breaths",
          description: "Lie on your back with the knees bent and feet grounded. Press through the feet and roll the hips up one vertebra at a time. Interlace the hands under the back if that feels good, and sense the support of the legs and back body.",
          warning: "Do not push from the neck. Keep the lift low with low-back, neck, or uncontrolled blood pressure concerns.",
        },
        "supta-baddha-konasana": {
          nameSpanish: "Reclined Butterfly",
          duration: "3 minutes",
          description: "Lie down, bring the soles of the feet together, and let the knees open. Rest the hands on the belly or beside you. Do not press the knees down; let gravity do the work while the sacrum softens toward the earth.",
          warning: "Support the knees with cushions if the groins, hips, or knees feel strained.",
        },
        paschimottanasana: {
          nameSpanish: "Seated forward fold",
          duration: "2 minutes",
          description: "Sit with the legs extended and bend the knees as much as needed. Inhale to lengthen the spine; exhale and fold forward from the hips. Let the hands land wherever they reach without tugging.",
          warning: "Bend the knees with hamstring or low-back pull. Avoid aggressively rounding the spine.",
        },
        "prasarita-padottanasana": {
          nameSpanish: "Wide-legged forward fold",
          duration: "10 breaths",
          description: "Stand with the legs wide and the feet parallel. Lengthen through the spine, fold forward, and place the hands on the floor or blocks. Let the head release only as far as it feels safe and grounding.",
          warning: "Avoid lowering the head with glaucoma, vertigo, or uncontrolled high blood pressure. Use hand support.",
        },
        "virabhadrasana-i": {
          nameSpanish: "Warrior I",
          duration: "6 breaths each side",
          description: "Step one foot back and angle it in. Bend the front knee and lift the arms. Root both feet strongly, as if the legs were the base of a tree. Keep the stance steady rather than dramatic.",
          warning: "Adjust the stance with knee, hip, or sacroiliac discomfort. Keep the front knee stable.",
        },
      },
      pranayama: [
        {
          name: "Bhramari, humming bee breath",
          description: "Sit tall, close the eyes, and gently cover the ears if comfortable. Inhale through the nose. Exhale with a low humming sound and feel the vibration settle through the head, spine, and base of the body.",
        },
      ],
      savasana: {
        duration: "8 minutes",
        visualization: "Lie down completely. Imagine roots growing from the tailbone and the soles of the feet into the earth. You are held. You are safe. You do not have to go anywhere.",
      },
    },
    agua: {
      bodyZone: "Pelvis, sacrum, hips, inner thighs",
      emotional: "Emotional world",
      planets: ["Moon", "Neptune", "Pluto"],
      signs: ["Cancer", "Scorpio", "Pisces"],
      intention: "Soften emotional rigidity, restore flow, and let the body move with feeling rather than control.",
      signsAndHouses: [
        "Cancer opens the private inner world. The hips soften when the body feels safe enough to be vulnerable.",
        "Scorpio brings depth and release. Twists and hip work make space for what has been held too tightly.",
        "Pisces invites surrender. The final movements ask less of the mind and more of trust.",
      ],
      asanas: {
        "flujo-pelvico-libre": {
          nameSpanish: "Free pelvic flow",
          duration: "2 minutes",
          description: "Stand with the feet hip-width apart and the knees soft. Close the eyes and circle the hips slowly in one direction, then the other. Let the pelvis find its own rhythm, adding forward-back and side-to-side movement as the breath deepens.",
          warning: "Move slowly with pelvic pain, advanced pregnancy, or dizziness. Avoid any range that pinches the low back.",
        },
        anjaneyasana: {
          nameSpanish: "Low lunge",
          duration: "2 minutes each side",
          description: "Step one foot back and lower the back knee. Keep the front knee stacked over the ankle. Let the pelvis descend with gravity rather than force. Breathe into the front of the hip and give the psoas time to soften.",
          warning: "Pad the back knee. Avoid sinking the pelvis with low-back pain, pubic pain, or hip injury.",
        },
        "baddha-konasana": {
          nameSpanish: "Butterfly with gentle rocking",
          duration: "2 minutes",
          description: "Sit with the soles of the feet together and the knees open. Hold the feet and let the knees make small, easy movements, like slow wings. Add a subtle wave through the torso if it feels natural.",
          warning: "Do not press the knees down. Use support with groin, hip, or knee discomfort.",
        },
        "upavista-konasana": {
          nameSpanish: "Wide angle with movement",
          duration: "2 minutes",
          description: "Sit with the legs wide and the hands on the floor in front of you. Rock the torso gently from side to side, then explore slow circles. Let the inner thighs open gradually, without chasing depth.",
          warning: "Keep the knees slightly bent if the hamstrings pull. Avoid with active sacroiliac pain.",
        },
        "ardha-matsyendrasana": {
          nameSpanish: "Seated twist",
          duration: "5 breaths each side",
          description: "Sit tall, cross one foot outside the opposite knee, and turn toward the bent leg. Use the back hand for support and the opposite elbow or arm against the thigh. Twist from length, not from force.",
          warning: "Avoid deep twists during pregnancy or with disc hernia. Turn from a long spine, not from the neck.",
        },
        "supta-kapotasana": {
          nameSpanish: "Reclined pigeon",
          duration: "3 minutes each side",
          description: "Lie on your back, cross one ankle over the opposite thigh, and flex the foot. Draw the legs toward the chest only as far as the hip can stay calm. Breathe into the sensation instead of fighting it.",
          warning: "Keep the foot flexed and skip it with knee pain. Move the legs away if the hip gets irritated.",
        },
        "viparita-karani": {
          nameSpanish: "Legs up the wall",
          duration: "5 minutes",
          description: "Bring the hips near a wall, lie back, and rest the legs upward. Let the arms fall open. This gentle inversion drains the legs, softens the low belly, and gives the nervous system a quieter rhythm.",
          warning: "Avoid with glaucoma, uncontrolled high blood pressure, or discomfort in inversion. Come out slowly.",
        },
        "movimiento-libre-final": {
          nameSpanish: "Final free movement",
          duration: "3 minutes",
          description: "Stand or sit with the eyes closed. Move only from breath and sensation. There is no correct shape. Let the water of the body find today's form.",
          warning: "Keep movements small with dizziness, joint pain, or fatigue. Freedom does not require intensity.",
        },
      },
      pranayama: [
        {
          name: "Wave breath",
          description: "Sit or lie comfortably. Inhale into the low belly, then the ribs, then the upper chest. Exhale from the top down: collarbones, chest, belly. Let each cycle feel like a wave arriving and receding.",
        },
        {
          name: "Sitali, cooling breath",
          description: "Curl the tongue into a tube, or rest the tongue lightly between the teeth. Inhale through the tongue, close the mouth, and exhale through the nose. Use it to cool strong emotion and settle the body after the hip work.",
        },
      ],
      savasana: {
        duration: "8 minutes",
        visualization: "Lie down. Imagine the body as water. Each feeling is a wave: it arrives, moves through, and passes. You do not have to hold it or push it away.",
      },
    },
    aire: {
      bodyZone: "Chest, lungs, shoulders, collarbones, arms",
      emotional: "Connection",
      planets: ["Mercury", "Venus", "Uranus"],
      signs: ["Gemini", "Libra", "Aquarius"],
      intention: "Open the heart without losing your centre, and let the breath create lightness, space, and connection.",
      signsAndHouses: [
        "Gemini begins with breath and exchange. The chest opens so communication can feel embodied, not rushed.",
        "Libra teaches meeting without disappearing. Heart-openers become a practice of balance and availability.",
        "Aquarius brings freedom. The sequence gives the body permission to move beyond old patterns with curiosity.",
      ],
      asanas: {
        "apertura-toracica-en-cuatro-apoyos": {
          nameSpanish: "Tabletop chest opener",
          duration: "8 each side",
          description: "Come to hands and knees. Place one hand behind the head. Inhale and open the elbow toward the ceiling; exhale and thread it under the chest. Move through the upper back, as if the heart were opening and closing with the breath.",
          warning: "Use a forearm or blanket with wrist pain. Do not force the rotation with shoulder injury.",
        },
        anahatasana: {
          nameSpanish: "Melting heart pose",
          duration: "2 minutes",
          description: "From hands and knees, walk the hands forward while the hips stay above the knees. Let the chest descend toward the floor, resting the forehead or chin. Feel the space between the shoulder blades widen.",
          warning: "Protect shoulders and neck. Use support under the chest with impingement, neck pain, or advanced pregnancy.",
        },
        "bhujangasana-bajo": {
          nameSpanish: "Low Cobra",
          duration: "3 rounds of 5 breaths",
          description: "Lie on your belly with the hands under the shoulders and elbows close to the ribs. Inhale and lift the chest using the back muscles more than the hands. Keep the neck long and lower slowly on the exhale.",
          warning: "Do not lock the elbows or compress the low back. Avoid with advanced pregnancy or acute low-back pain.",
        },
        "gomukhasana-brazos": {
          nameSpanish: "Cow Face arms",
          duration: "2 minutes each side",
          description: "Sit or stand tall. Reach one arm up, bend the elbow, and let the hand move behind the upper back. Bring the other hand behind from below. Hold a strap if the fingers do not meet. Breathe into the shoulders and side chest.",
          warning: "Use a strap if the hands do not meet. Avoid pulling with rotator cuff or neck injury.",
        },
        garudasana: {
          nameSpanish: "Eagle arms",
          duration: "8 breaths each side",
          description: "Bend the knees slightly and wrap one arm under the other, bringing the forearms toward each other. Lift the elbows to shoulder height and breathe into the space between the shoulder blades.",
          warning: "Practise near a wall if balance is difficult. Avoid closing too tightly if knees or shoulders hurt.",
        },
        camatkarasana: {
          nameSpanish: "Wild Thing",
          duration: "3 breaths each side",
          description: "From Downward Dog, shift weight into one hand, roll the body open, and step the lifted foot behind you. Reach the top arm up and let the chest open. Keep the transition slow and playful.",
          warning: "Avoid with wrist, shoulder, or low-back injury. Move slowly and come out if stability disappears.",
        },
        matsyasana: {
          nameSpanish: "Fish pose",
          duration: "2 minutes",
          description: "Lie on your back with the legs extended and the hands under the hips. Press the forearms down and lift the chest. Let the head release only if the neck feels spacious; the weight stays in the forearms, not the skull.",
          warning: "Do not put weight into the head. Avoid with neck injury, active migraine, or vertigo.",
        },
        "setu-bandhasana": {
          nameSpanish: "Bridge with expansive breath",
          duration: "Hold for 5 breaths",
          description: "Lie on your back with the knees bent. Lift the hips and focus on the side ribs widening with each inhale, like wings. Interlace the hands under the back if it helps the chest open without strain.",
          warning: "Keep the neck neutral and avoid forcing the chest with low-back, neck, or blood pressure concerns.",
        },
        "balasana-con-brazos-abiertos": {
          nameSpanish: "Child's pose with open arms",
          duration: "10 breaths",
          description: "Sit the hips toward the heels and fold down. Open the arms out to the sides like resting wings. Let the heart stay soft after the work of opening.",
          warning: "Adjust arms and knees with shoulder, knee, or hip discomfort. Use support under the torso.",
        },
      },
      pranayama: [
        {
          name: "Ujjayi, ocean breath",
          description: "Sit tall. Fog an imaginary mirror with the mouth open, then close the mouth and keep that soft sound in the throat as you breathe through the nose. Let the ribs expand sideways on the inhale and settle on the exhale.",
        },
        {
          name: "Anuloma Viloma, alternate nostril breathing",
          description: "Alternate the nostrils with an easy count: inhale left, pause, exhale right; inhale right, pause, exhale left. Keep the breath smooth. This clears the mind after the heart-opening sequence.",
        },
      ],
      savasana: {
        duration: "7 minutes",
        visualization: "Lie down completely. The chest opens like sky. The heart is available, but you remain yourself. You can be connected without losing your centre.",
      },
    },
  },
  it: {
    fuego: {
      bodyZone: "Centro, diaframma, costole",
      emotional: "Volontà",
      planets: ["Marte", "Sole", "Giove"],
      signs: ["Ariete", "Leone", "Sagittario"],
      intention: "Accendere forza, coraggio e iniziativa senza trasformare il fuoco in tensione.",
      signsAndHouses: [
        "L'Ariete porta la scintilla iniziale: identità, impulso e decisione. La pratica porta quella direzione nel centro del corpo.",
        "Il Leone porta il fuoco creativo. Il cuore si apre dopo il lavoro sul centro, così la fiducia resta calda e non forzata.",
        "Il Sagittario porta visione. Le torsioni aiutano a guardare lontano senza perdere il proprio asse.",
      ],
      asanas: {
        tadasana: {
          nameSpanish: "Montagna attiva",
          duration: "10 respiri profondi",
          description: "Stai in piedi con i piedi uniti o alla larghezza del bacino. Distribuisci il peso su tutta la pianta, lascia morbide le ginocchia e richiama leggermente il basso ventre senza trattenere il respiro. Spalle giù, mento parallelo al pavimento. Respira finché senti un calore tranquillo al centro.",
          warning: "Evita di bloccare le ginocchia. Se compare capogiro, riduci l'intensità e pratica vicino a una parete.",
        },
        navasana: {
          nameSpanish: "La Barca",
          duration: "3 serie da 5 respiri, con 3 respiri di pausa",
          description: "Siediti con le ginocchia piegate e i piedi a terra. Inclina il busto finché trovi l'equilibrio sugli ischi, poi solleva i piedi. Tieni le tibie parallele al pavimento, o stendi le gambe se la schiena resta lunga. Le braccia vanno avanti, il ventre sostiene senza chiudere il petto.",
          warning: "Non forzare con dolore lombare, ernia addominale o gravidanza. Tieni le ginocchia piegate se l'addome trema troppo.",
        },
        "ardha-navasana": {
          nameSpanish: "Mezza Barca",
          duration: "3 serie da 4 respiri",
          description: "Da Navasana abbassa gambe e busto solo fin dove la zona lombare resta sostenuta. Le mani possono andare avanti o dietro la nuca. Resta nel calore, ma lascia il respiro libero.",
          warning: "Evita con dolore lombare acuto, diastasi o gravidanza avanzata. Esci prima che il respiro si blocchi.",
        },
        salabhasana: {
          nameSpanish: "La Locusta",
          duration: "3 serie da 5 respiri",
          description: "Sdraiati a pancia in giù con le braccia lungo il corpo. Inspirando, solleva un poco testa, petto, braccia e gambe. Mantieni la nuca lunga e lascia che il sollevamento parta dalla schiena, non da una contrazione dura dei glutei.",
          warning: "Evita con dolore lombare acuto, lesione cervicale o gravidanza. Solleva poco e mantieni il collo lungo.",
        },
        dhanurasana: {
          nameSpanish: "L'Arco",
          duration: "3 serie da 4 respiri",
          description: "Sdraiati a pancia in giù, piega le ginocchia e afferra le caviglie dall'esterno. Spingi i piedi nelle mani: il petto e le cosce salgono come risposta naturale. Il respiro resta fluido; la posa deve aprire, non comprimere la zona lombare.",
          warning: "Evita con gravidanza, dolore lombare, ernia, pressione alta non controllata o forte fastidio alle ginocchia.",
        },
        "parivrtta-janu-sirsasana": {
          nameSpanish: "Allungamento laterale in torsione",
          duration: "5 respiri per lato",
          description: "Siediti con le gambe aperte e porta un piede verso l'interno della coscia opposta. Ruota leggermente verso la gamba distesa e inclina il busto di lato. Allunga il braccio superiore oltre l'orecchio e respira nelle costole.",
          warning: "Pratica dolcemente con lesioni a ischiocrurali, sacroiliaca o zona lombare. Non collassare nel fianco.",
        },
        "parivrtta-trikonasana": {
          nameSpanish: "Triangolo ruotato",
          duration: "5 respiri per lato",
          description: "Apri le gambe, orienta il piede davanti e inclina quello dietro. Porta la mano opposta su blocco, tibia o pavimento, poi ruota il petto verso l'alto. Il ventre sostiene la torsione e la colonna resta lunga.",
          warning: "Usa un blocco se tirano lombari o posteriori delle gambe. Evita torsioni profonde in gravidanza.",
        },
        ustrasana: {
          nameSpanish: "Il Cammello",
          duration: "5 respiri",
          description: "Inginocchiati con le ginocchia alla larghezza del bacino e le mani sulla zona lombare. Prima solleva il petto, poi arretra. Resta lì oppure porta le mani ai talloni se il respiro rimane comodo. L'apertura nasce dalla forza, non dal cedere nella schiena.",
          warning: "Proteggi zona lombare e collo. Evita con vertigini, emicrania attiva, lesione cervicale o dolore lombare acuto.",
        },
      },
      pranayama: [
        {
          name: "Kapalabhati, respiro del fuoco",
          description: "Siediti con la schiena lunga. Inspira naturalmente, poi espira dal naso con piccoli impulsi decisi richiamando l'ombelico verso la colonna. L'inspiro torna da solo. Parti lentamente, riposa tra le serie e chiudi con un respiro pieno e morbido.",
          contraindications: "Evita in gravidanza, con pressione alta non controllata o problemi cardiaci. Solo se adatto a te: 3 serie da 30 impulsi.",
        },
        {
          name: "Nadi Shodhana, respiro a narici alternate",
          description: "Alterna le narici con la mano destra: inspira a sinistra, pausa, espira a destra; inspira a destra, pausa, espira a sinistra. Mantieni un conteggio comodo. Stabilizza il sistema nervoso dopo il lavoro di fuoco.",
        },
      ],
      savasana: {
        duration: "5-7 minuti",
        visualization: "Sdraiati completamente. Immagina una fiamma dorata e stabile all'ombelico: non troppo grande, non spenta. Il tuo potere è presente, caldo, in equilibrio.",
      },
    },
    tierra: {
      bodyZone: "Piedi, gambe, pavimento pelvico, coccige",
      emotional: "Struttura",
      planets: ["Saturno", "Venere", "Mercurio"],
      signs: ["Toro", "Vergine", "Capricorno"],
      intention: "Tornare al corpo, rendere concreta la stabilità e costruire sostegno dal basso.",
      signsAndHouses: [
        "Il Toro insegna sicurezza attraverso i sensi. La pratica rallenta finché il corpo diventa un luogo abitabile.",
        "La Vergine porta cura, ritmo e precisione. Ogni forma diventa manutenzione amorevole, non performance.",
        "Il Capricorno dà struttura invisibile. Il lavoro sulla radice sostiene tutta la sequenza dall'interno.",
      ],
      asanas: {
        "mula-bandha": {
          nameSpanish: "Attivazione della radice",
          duration: "5 volte: 5 respiri di tenuta, 2 di rilascio",
          description: "Siediti comoda. Solleva dolcemente il pavimento pelvico, come se lo spazio tra gli ischi salisse verso l'interno, senza stringere glutei o addome. È un sostegno sottile, non una contrazione dura.",
          warning: "Mantieni l'attivazione delicata. Evita tensioni prolungate con dolore pelvico, post-parto recente o recupero chirurgico.",
        },
        malasana: {
          nameSpanish: "La Ghirlanda",
          duration: "2 minuti",
          description: "Apri i piedi più del bacino e ruota le punte verso l'esterno. Scendi in accovacciata, porta i gomiti all'interno delle cosce e unisci le mani davanti al petto. Sostieni i talloni se si sollevano. Lascia che il bacino si depositi.",
          warning: "Sostieni i talloni se caviglie o ginocchia danno fastidio. Evita la profondità con lesioni ad anche o ginocchia.",
        },
        balasana: {
          nameSpanish: "Posizione del Bambino",
          duration: "10 respiri profondi",
          description: "Dalle ginocchia, porta il bacino verso i talloni e lascia scendere il busto. Le braccia possono andare avanti o lungo il corpo. Ogni espiro ti rende più pesante. Non c'è nulla da raggiungere.",
          warning: "Apri le ginocchia o usa supporti con fastidi a ginocchia, anche o in gravidanza. Non comprimere l'addome.",
        },
        "marjaryasana-bitilasana": {
          nameSpanish: "Gatto-Mucca",
          duration: "10 cicli lenti",
          description: "In quadrupedia, inspira lasciando scendere il ventre e avanzare il petto; espira arrotondando la schiena e portando l'ombelico indietro. Lascia partire l'onda dal coccige e attraversare tutta la colonna.",
          warning: "Muoviti piano con lesioni a polsi, spalle o collo. Appoggia gli avambracci se serve.",
        },
        "setu-bandhasana": {
          nameSpanish: "Il Ponte",
          duration: "3 serie da 6 respiri",
          description: "Sdraiati sulla schiena con le ginocchia piegate e i piedi radicati. Premi i piedi e solleva il bacino vertebra dopo vertebra. Intreccia le dita sotto la schiena se aiuta, sentendo il sostegno delle gambe e della catena posteriore.",
          warning: "Non spingere dal collo. Tieni il ponte basso con dolore lombare, cervicale o pressione alta non controllata.",
        },
        "supta-baddha-konasana": {
          nameSpanish: "Farfalla supina",
          duration: "3 minuti",
          description: "Sdraiati, unisci le piante dei piedi e lascia aprire le ginocchia. Le mani possono riposare sul ventre o ai lati. Non spingere le ginocchia: lascia lavorare la gravità mentre il sacro si ammorbidisce.",
          warning: "Sostieni le ginocchia con cuscini se senti tensione a inguini, anche o ginocchia.",
        },
        paschimottanasana: {
          nameSpanish: "Piegamento in avanti seduto",
          duration: "2 minuti",
          description: "Siediti con le gambe distese e piega le ginocchia quanto serve. Inspira allungando la colonna; espira e inclina il busto dalle anche. Le mani arrivano dove arrivano, senza tirare.",
          warning: "Piega le ginocchia se tirano lombari o posteriori delle gambe. Evita di arrotondare la schiena con aggressività.",
        },
        "prasarita-padottanasana": {
          nameSpanish: "Piegamento a gambe aperte",
          duration: "10 respiri",
          description: "In piedi, apri molto le gambe e tieni i piedi paralleli. Allunga la colonna e piegati in avanti, appoggiando le mani a terra o sui blocchi. Lascia scendere la testa solo quanto è sicuro.",
          warning: "Evita di abbassare la testa con glaucoma, vertigini o pressione alta non controllata. Usa supporto sotto le mani.",
        },
        "virabhadrasana-i": {
          nameSpanish: "Guerriero I",
          duration: "6 respiri per lato",
          description: "Porta un piede indietro e ruotalo leggermente. Piega il ginocchio davanti e solleva le braccia. Radica entrambi i piedi come radici. Cerca stabilità, non spettacolo.",
          warning: "Adatta la distanza con dolore a ginocchia, anche o sacroiliaca. Mantieni stabile il ginocchio davanti.",
        },
      },
      pranayama: [
        {
          name: "Bhramari, respiro dell'ape",
          description: "Siediti con la schiena lunga, chiudi gli occhi e copri dolcemente le orecchie se è comodo. Inspira dal naso. Espira emettendo un suono basso, come un ronzio, e senti la vibrazione scendere dalla testa alla base del corpo.",
        },
      ],
      savasana: {
        duration: "8 minuti",
        visualization: "Sdraiati completamente. Immagina radici che dal coccige e dalle piante dei piedi scendono nella terra. Sei sostenuta. Sei al sicuro. Non devi andare da nessuna parte.",
      },
    },
    agua: {
      bodyZone: "Bacino, sacro, anche, interno coscia",
      emotional: "Mondo emotivo",
      planets: ["Luna", "Nettuno", "Plutone"],
      signs: ["Cancro", "Scorpione", "Pesci"],
      intention: "Ammorbidire le rigidità emotive, ritrovare flusso e lasciare che il corpo si muova sentendo, non controllando.",
      signsAndHouses: [
        "Il Cancro apre il mondo interiore. Le anche si ammorbidiscono quando il corpo si sente abbastanza al sicuro da essere vulnerabile.",
        "Lo Scorpione porta profondità e rilascio. Torsioni e lavoro sulle anche creano spazio per ciò che è stato trattenuto.",
        "I Pesci invitano alla resa. I movimenti finali chiedono meno mente e più fiducia.",
      ],
      asanas: {
        "flujo-pelvico-libre": {
          nameSpanish: "Flusso libero del bacino",
          duration: "2 minuti",
          description: "Stai in piedi con i piedi alla larghezza del bacino e le ginocchia morbide. Chiudi gli occhi e fai cerchi lenti con le anche, prima in un senso e poi nell'altro. Lascia che il bacino trovi il suo ritmo.",
          warning: "Muoviti lentamente con dolore pelvico, gravidanza avanzata o capogiro. Evita movimenti che pizzicano la zona lombare.",
        },
        anjaneyasana: {
          nameSpanish: "Affondo basso",
          duration: "2 minuti per lato",
          description: "Porta un piede indietro e appoggia il ginocchio a terra. Il ginocchio davanti resta sopra la caviglia. Lascia scendere il bacino con la gravità, senza spingere. Respira nella parte anteriore dell'anca.",
          warning: "Metti un supporto sotto il ginocchio dietro. Evita di affondare con dolore lombare, pubalgia o lesione all'anca.",
        },
        "baddha-konasana": {
          nameSpanish: "Farfalla con oscillazione",
          duration: "2 minuti",
          description: "Siediti con le piante dei piedi unite e le ginocchia aperte. Tieni i piedi e lascia che le ginocchia facciano piccoli movimenti, come ali lente. Se nasce spontaneo, aggiungi una piccola onda del busto.",
          warning: "Non spingere le ginocchia verso il basso. Usa supporti con fastidi a inguini, anche o ginocchia.",
        },
        "upavista-konasana": {
          nameSpanish: "Angolo ampio in movimento",
          duration: "2 minuti",
          description: "Siediti con le gambe aperte e le mani a terra davanti a te. Oscilla lentamente il busto da un lato all'altro, poi esplora piccoli cerchi. L'interno coscia si apre senza cercare la profondità.",
          warning: "Tieni le ginocchia leggermente piegate se tirano i posteriori delle gambe. Evita con dolore sacroiliaco attivo.",
        },
        "ardha-matsyendrasana": {
          nameSpanish: "Torsione seduta",
          duration: "5 respiri per lato",
          description: "Siediti alta, porta un piede fuori dal ginocchio opposto e ruota verso la gamba piegata. Usa la mano dietro come sostegno. La torsione nasce dalla lunghezza, non dalla forza.",
          warning: "Evita torsioni profonde in gravidanza o con ernia discale. Gira dalla colonna lunga, non dal collo.",
        },
        "supta-kapotasana": {
          nameSpanish: "Piccione supino",
          duration: "3 minuti per lato",
          description: "Sdraiati, appoggia una caviglia sulla coscia opposta e tieni il piede flesso. Avvicina le gambe al petto solo fin dove l'anca resta calma. Respira nella sensazione senza combatterla.",
          warning: "Tieni il piede flesso ed evita se fa male il ginocchio. Allontana le gambe se l'anca si irrita.",
        },
        "viparita-karani": {
          nameSpanish: "Gambe al muro",
          duration: "5 minuti",
          description: "Porta il bacino vicino a una parete, sdraiati e lascia salire le gambe. Le braccia riposano aperte. Questa inversione dolce scarica le gambe, ammorbidisce il basso ventre e calma il sistema nervoso.",
          warning: "Evita con glaucoma, pressione alta non controllata o fastidio nelle inversioni. Esci lentamente.",
        },
        "movimiento-libre-final": {
          nameSpanish: "Movimento libero finale",
          duration: "3 minuti",
          description: "In piedi o seduta, chiudi gli occhi. Muoviti solo seguendo respiro e sensazioni. Non esiste una forma corretta. Lascia che l'acqua del corpo trovi la forma di oggi.",
          warning: "Mantieni movimenti piccoli con capogiro, dolore articolare o stanchezza. La libertà non richiede intensità.",
        },
      },
      pranayama: [
        {
          name: "Respiro a onda",
          description: "Siediti o sdraiati comoda. Inspira nel basso ventre, poi nelle costole, poi nel petto alto. Espira dall'alto verso il basso. Ogni ciclo assomiglia a un'onda che arriva e si ritira.",
        },
        {
          name: "Sitali, respiro rinfrescante",
          description: "Arrotola la lingua a tubo, oppure appoggiala tra i denti socchiusi. Inspira dalla lingua, chiudi la bocca ed espira dal naso. Aiuta a raffreddare emozioni intense e a stabilizzare la pratica.",
        },
      ],
      savasana: {
        duration: "8 minuti",
        visualization: "Sdraiati. Immagina il corpo come acqua. Ogni emozione è un'onda: arriva, attraversa e passa. Non devi trattenerla né respingerla.",
      },
    },
    aire: {
      bodyZone: "Petto, polmoni, spalle, clavicole, braccia",
      emotional: "Connessione",
      planets: ["Mercurio", "Venere", "Urano"],
      signs: ["Gemelli", "Bilancia", "Acquario"],
      intention: "Aprire il cuore senza perdere il centro, lasciando che il respiro crei spazio, leggerezza e relazione.",
      signsAndHouses: [
        "I Gemelli iniziano dal respiro e dallo scambio. Il petto si apre perché la comunicazione diventi corporea, non frettolosa.",
        "La Bilancia insegna l'incontro senza sparire. Le aperture del cuore diventano pratica di equilibrio.",
        "L'Acquario porta libertà. La sequenza permette al corpo di uscire dagli schemi con curiosità.",
      ],
      asanas: {
        "apertura-toracica-en-cuatro-apoyos": {
          nameSpanish: "Apertura toracica in quadrupedia",
          duration: "8 per lato",
          description: "In quadrupedia, porta una mano dietro la nuca. Inspirando apri il gomito verso il soffitto; espirando fallo passare sotto il petto. Muovi la parte alta della schiena, come se il cuore si aprisse e chiudesse con il respiro.",
          warning: "Usa avambraccio o coperta con dolore al polso. Non forzare la rotazione con lesioni alla spalla.",
        },
        anahatasana: {
          nameSpanish: "Cuore che si scioglie",
          duration: "2 minuti",
          description: "Dalla quadrupedia, cammina con le mani in avanti lasciando le anche sopra le ginocchia. Il petto scende verso terra, fronte o mento appoggiati. Senti lo spazio tra le scapole allargarsi.",
          warning: "Proteggi spalle e collo. Usa un supporto sotto il petto con impingement, dolore cervicale o gravidanza avanzata.",
        },
        "bhujangasana-bajo": {
          nameSpanish: "Cobra bassa",
          duration: "3 serie da 5 respiri",
          description: "Sdraiati a pancia in giù con le mani sotto le spalle e i gomiti vicini alle costole. Inspirando solleva il petto usando più la schiena che le mani. Il collo resta lungo; espirando scendi lentamente.",
          warning: "Non bloccare i gomiti né comprimere la zona lombare. Evita con gravidanza avanzata o dolore lombare acuto.",
        },
        "gomukhasana-brazos": {
          nameSpanish: "Braccia di Gomukhasana",
          duration: "2 minuti per lato",
          description: "Seduta o in piedi, porta un braccio in alto, piega il gomito e lascia scendere la mano dietro la schiena. L'altra mano sale dal basso. Usa una cinghia se le dita non si incontrano. Respira nelle spalle e nel costato.",
          warning: "Usa una cinghia se le mani non arrivano. Evita di tirare con lesioni alla cuffia dei rotatori o al collo.",
        },
        garudasana: {
          nameSpanish: "Braccia dell'Aquila",
          duration: "8 respiri per lato",
          description: "Piega leggermente le ginocchia e avvolgi un braccio sotto l'altro, avvicinando gli avambracci. Porta i gomiti all'altezza delle spalle e respira nello spazio tra le scapole.",
          warning: "Pratica vicino a una parete se l'equilibrio è instabile. Evita di chiudere troppo se fanno male ginocchia o spalle.",
        },
        camatkarasana: {
          nameSpanish: "Cosa selvaggia",
          duration: "3 respiri per lato",
          description: "Dal cane a testa in giù, sposta il peso su una mano, apri il corpo e appoggia il piede sollevato dietro di te. Il braccio superiore sale. Mantieni la transizione lenta e giocosa.",
          warning: "Evita con lesioni a polso, spalla o zona lombare. Muoviti lentamente ed esci se perdi stabilità.",
        },
        matsyasana: {
          nameSpanish: "Il Pesce",
          duration: "2 minuti",
          description: "Sdraiati sulla schiena con le gambe distese e le mani sotto i fianchi. Premi gli avambracci e solleva il petto. La testa scende solo se il collo resta ampio; il peso è sugli avambracci, non sul cranio.",
          warning: "Il peso non va sulla testa. Evita con lesione cervicale, emicrania attiva o vertigini.",
        },
        "setu-bandhasana": {
          nameSpanish: "Ponte con respiro espansivo",
          duration: "Tenuta di 5 respiri",
          description: "Sdraiati con le ginocchia piegate. Solleva il bacino e porta l'attenzione alle costole laterali che si aprono a ogni inspiro, come ali. Intreccia le dita sotto la schiena solo se il petto si apre senza sforzo.",
          warning: "Mantieni il collo neutro ed evita di forzare il petto con dolore lombare, cervicale o pressione alta.",
        },
        "balasana-con-brazos-abiertos": {
          nameSpanish: "Balasana con braccia aperte",
          duration: "10 respiri",
          description: "Porta il bacino verso i talloni e scendi con il busto. Apri le braccia ai lati come ali a riposo. Dopo l'apertura, il cuore resta morbido.",
          warning: "Adatta braccia e ginocchia con fastidi a spalle, ginocchia o anche. Usa supporto sotto il busto.",
        },
      },
      pranayama: [
        {
          name: "Ujjayi, respiro dell'oceano",
          description: "Siediti alta. Appanna uno specchio immaginario con la bocca aperta, poi chiudi la bocca e mantieni quel suono morbido in gola respirando dal naso. Le costole si aprono lateralmente all'inspiro e si raccolgono all'espiro.",
        },
        {
          name: "Anuloma Viloma, respiro a narici alternate",
          description: "Alterna le narici con un conteggio comodo: inspira a sinistra, pausa, espira a destra; inspira a destra, pausa, espira a sinistra. Porta chiarezza mentale dopo l'apertura del cuore.",
        },
      ],
      savasana: {
        duration: "7 minuti",
        visualization: "Sdraiati completamente. Il petto si apre come cielo. Il cuore è disponibile, ma tu resti te stessa. Puoi essere connessa senza perderti.",
      },
    },
  },
};

const asanaLocalizationAliases: Record<string, string> = {
  "adho-mukha-svanasana-sobre-rodillas": "balasana",
  "anjaneyasana-con-manos-en-la-rodilla": "anjaneyasana",
  "anjaneyasana-con-torsion-simple": "anjaneyasana",
  "apertura-de-brazos-tumbada-boca-arriba": "balasana-con-brazos-abiertos",
  "apertura-de-pecho-con-manos-en-lumbares": "ustrasana",
  "apertura-de-pecho-con-manos-entrelazadas-atras": "gomukhasana-brazos",
  "ardha-navasana-fire-variant": "ardha-navasana",
  "baddha-konasana-con-balanceo": "baddha-konasana",
  "baddha-konasana-tierra-variant": "baddha-konasana",
  "balasana-con-brazos-extendidos-al-frente": "balasana",
  "balasana-extendida": "balasana",
  "balasana-tierra-variant": "balasana",
  "bhujangasana": "bhujangasana-bajo",
  "bhujangasana-baja": "bhujangasana-bajo",
  "brazos-al-cielo-en-tadasana": "tadasana",
  "circulos-de-cadera-de-pie": "flujo-pelvico-libre",
  "dhanurasana-fire-variant": "dhanurasana",
  "garudasana-brazos": "garudasana",
  "malasana-tierra-variant": "malasana",
  "malasana-tierra-variant-2": "malasana",
  "marjaryasana-bitilasana-tierra-variant": "marjaryasana-bitilasana",
  "matsyasana-apoyado": "matsyasana",
  "movimiento-ondulante-de-pelvis-supina": "flujo-pelvico-libre",
  "navasana-fire-variant": "navasana",
  "paschimottanasana-tierra-variant": "paschimottanasana",
  "prasarita-padottanasana-tierra-variant": "prasarita-padottanasana",
  "salabhasana-fire-variant": "salabhasana",
  "setu-bandhasana-con-apertura-costal": "setu-bandhasana",
  "setu-bandhasana-dinamico": "setu-bandhasana",
  "setu-bandhasana-tierra-variant": "setu-bandhasana",
  "sukhasana-tierra-variant": "mula-bandha",
  "supta-baddha-konasana-tierra-variant": "supta-baddha-konasana",
  "tadasana-con-peso": "tadasana",
  "tadasana-en-puntillas": "tadasana",
  "tadasana-fire-variant": "tadasana",
  "upavista-konasana-con-torsion-torso": "upavista-konasana",
  "upavista-konasana-simple": "upavista-konasana",
  "ustrasana-fire-variant": "ustrasana",
  "virabhadrasana-i-tierra-variant": "virabhadrasana-i",
  "vrksasana-tierra-variant": "virabhadrasana-i",
};

const localizedAsanaNames: Record<Exclude<Locale, "es">, Record<string, string>> = {
  en: {
    "abdominales-con-piernas-en-mesa-supina": "Supine tabletop core curls",
    "adho-mukha-svanasana": "Downward-Facing Dog",
    "adho-mukha-svanasana-sobre-rodillas": "Kneeling Downward Dog",
    "ananda-balasana": "Happy Baby",
    "anjaneyasana-con-manos-en-la-rodilla": "Low lunge with hands on knee",
    "anjaneyasana-con-torsion-simple": "Low lunge with simple twist",
    "apanasana": "Knees to chest",
    "apertura-de-brazos-en-cruz-de-pie": "Standing T-arm chest opening",
    "apertura-de-brazos-tumbada-boca-arriba": "Reclined cactus arms",
    "apertura-de-pecho-con-manos-en-lumbares": "Chest opening with hands on low back",
    "apertura-de-pecho-con-manos-entrelazadas-atras": "Chest opening with hands clasped behind",
    "ardha-dhanurasana": "Half Bow",
    "ardha-navasana-fire-variant": "Half Boat",
    "ardha-salabhasana": "Half Locust",
    "ardha-ustrasana": "Half Camel",
    "ardha-uttanasana": "Half standing forward fold",
    "baddha-konasana-con-balanceo": "Butterfly with rocking",
    "baddha-konasana-tierra-variant": "Seated Butterfly",
    "balasana-con-brazos-extendidos-al-frente": "Extended Child's pose",
    "balasana-extendida": "Extended Child's pose",
    "balasana-tierra-variant": "Child's pose",
    "bharadvajasana": "Bharadvaja's twist",
    "bharmanasana-opuestos": "Tabletop opposite arm and leg",
    "bhujangasana": "Cobra",
    "bhujangasana-baja": "Sphinx",
    "bicicleta-lenta-supina": "Slow supine bicycle",
    "brazos-al-cielo-en-tadasana": "Mountain with arms overhead",
    "chaturanga-sobre-rodillas": "Kneeling Chaturanga",
    "circulos-de-brazos-amplios": "Wide arm circles",
    "circulos-de-cadera-de-pie": "Standing hip circles",
    "circulos-de-hombros-sentada": "Seated shoulder circles",
    "circulos-de-rodillas-supina": "Supine knee circles",
    "cobra-con-manos-elevadas": "Cobra with hands lifted",
    "dandasana": "Staff pose",
    "dhanurasana-fire-variant": "Bow pose",
    "eka-pada-rajakapotasana-preparatoria": "Preparatory Pigeon",
    "elevacion-de-piernas-supina": "Supine single-leg lifts",
    "estiramiento-lateral-de-pie": "Standing side stretch",
    "garudasana-brazos": "Eagle arms",
    "gomukhasana-piernas": "Cow Face legs",
    "janu-sirsasana": "Head-to-knee pose",
    "jathara-parivartanasana": "Supine twist with bent knees",
    "limpiaparabrisas-supino": "Supine windshield wipers",
    "malasana-tierra-variant": "Garland squat",
    "malasana-tierra-variant-2": "Garland squat variation",
    "mandukasana": "Gentle Frog",
    "marjaryasana-bitilasana-tierra-variant": "Cat-Cow",
    "matsyasana-apoyado": "Supported Fish",
    "movimiento-ondulante-de-pelvis-supina": "Supine pelvic wave",
    "navasana-fire-variant": "Boat pose",
    "padangusthasana": "Big toe forward fold",
    "parighasana": "Gate pose",
    "parivrtta-sukhasana": "Simple seated twist",
    "parivrtta-utkatasana": "Revolved Chair",
    "parsva-balasana": "Thread the Needle",
    "parsva-balasana-invertida": "Thread the Needle with lifted arm",
    "phalakasana": "Plank pose",
    "plancha-sobre-antebrazos": "Forearm plank",
    "posicion-fetal-lateral": "Side fetal rest",
    "postura-de-la-mariposa-con-brazos-abiertos": "Butterfly with open arms",
    "savasana-con-brazos-abiertos-en-cruz": "Savasana with arms open",
    "savasana-con-piernas-dobladas": "Savasana with bent knees",
    "setu-bandhasana-con-apertura-costal": "Bridge with rib opening",
    "setu-bandhasana-dinamico": "Dynamic Bridge",
    "skandasana": "Side lunge",
    "sukhasana-con-brazos-al-cielo": "Easy pose with arms overhead",
    "sukhasana-con-manos-en-el-corazon": "Easy pose with hands at heart",
    "sukhasana-con-torsion": "Easy pose with twist",
    "supta-padangusthasana": "Reclined hand-to-big-toe pose",
    "supta-padangusthasana-lateral": "Reclined hand-to-big-toe, side variation",
    "utkatasana": "Chair pose",
    "uttanasana": "Standing forward fold",
    "vasisthasana-sobre-rodilla": "Kneeling side plank",
    "virabhadrasana-ii": "Warrior II",
    "virabhadrasana-iii-sobre-silla": "Warrior III with chair support",
    "vrksasana-baja": "Low Tree pose",
    "vyaghrasana": "Tiger pose",
  },
  it: {
    "abdominales-con-piernas-en-mesa-supina": "Addominali supini con gambe a tavolino",
    "adho-mukha-svanasana": "Cane a testa in giù",
    "adho-mukha-svanasana-sobre-rodillas": "Cane a testa in giù sulle ginocchia",
    "ananda-balasana": "Bambino felice",
    "anjaneyasana-con-manos-en-la-rodilla": "Affondo basso con mani sul ginocchio",
    "anjaneyasana-con-torsion-simple": "Affondo basso con torsione semplice",
    "apanasana": "Ginocchia al petto",
    "apertura-de-brazos-en-cruz-de-pie": "Apertura in piedi con braccia a croce",
    "apertura-de-brazos-tumbada-boca-arriba": "Braccia a cactus supine",
    "apertura-de-pecho-con-manos-en-lumbares": "Apertura del petto con mani sui lombari",
    "apertura-de-pecho-con-manos-entrelazadas-atras": "Apertura del petto con mani intrecciate dietro",
    "ardha-dhanurasana": "Mezzo Arco",
    "ardha-navasana-fire-variant": "Mezza Barca",
    "ardha-salabhasana": "Mezza Locusta",
    "ardha-ustrasana": "Mezzo Cammello",
    "ardha-uttanasana": "Mezzo piegamento in avanti in piedi",
    "baddha-konasana-con-balanceo": "Farfalla con oscillazione",
    "baddha-konasana-tierra-variant": "Farfalla seduta",
    "balasana-con-brazos-extendidos-al-frente": "Posizione del Bambino estesa",
    "balasana-extendida": "Posizione del Bambino estesa",
    "balasana-tierra-variant": "Posizione del Bambino",
    "bharadvajasana": "Torsione di Bharadvaja",
    "bharmanasana-opuestos": "Quadrupedia con braccio e gamba opposti",
    "bhujangasana": "Cobra",
    "bhujangasana-baja": "Sfinge",
    "bicicleta-lenta-supina": "Bicicletta lenta supina",
    "brazos-al-cielo-en-tadasana": "Montagna con braccia al cielo",
    "chaturanga-sobre-rodillas": "Chaturanga sulle ginocchia",
    "circulos-de-brazos-amplios": "Cerchi ampi con le braccia",
    "circulos-de-cadera-de-pie": "Cerchi delle anche in piedi",
    "circulos-de-hombros-sentada": "Cerchi delle spalle seduta",
    "circulos-de-rodillas-supina": "Cerchi delle ginocchia supine",
    "cobra-con-manos-elevadas": "Cobra con mani sollevate",
    "dandasana": "Bastone",
    "dhanurasana-fire-variant": "Arco",
    "eka-pada-rajakapotasana-preparatoria": "Piccione preparatorio",
    "elevacion-de-piernas-supina": "Sollevamenti supini di una gamba",
    "estiramiento-lateral-de-pie": "Allungamento laterale in piedi",
    "garudasana-brazos": "Braccia dell'Aquila",
    "gomukhasana-piernas": "Gambe di Gomukhasana",
    "janu-sirsasana": "Testa al ginocchio",
    "jathara-parivartanasana": "Torsione supina con ginocchia piegate",
    "limpiaparabrisas-supino": "Tergicristalli supini",
    "malasana-tierra-variant": "La Ghirlanda",
    "malasana-tierra-variant-2": "Variante della Ghirlanda",
    "mandukasana": "Rana dolce",
    "marjaryasana-bitilasana-tierra-variant": "Gatto-Mucca",
    "matsyasana-apoyado": "Pesce supportato",
    "movimiento-ondulante-de-pelvis-supina": "Onda del bacino supina",
    "navasana-fire-variant": "Barca",
    "padangusthasana": "Piegamento prendendo l'alluce",
    "parighasana": "Posizione del Cancello",
    "parivrtta-sukhasana": "Torsione semplice seduta",
    "parivrtta-utkatasana": "Sedia ruotata",
    "parsva-balasana": "Infilare l'ago",
    "parsva-balasana-invertida": "Infilare l'ago con braccio sollevato",
    "phalakasana": "Plank",
    "plancha-sobre-antebrazos": "Plank sugli avambracci",
    "posicion-fetal-lateral": "Riposo fetale laterale",
    "postura-de-la-mariposa-con-brazos-abiertos": "Farfalla con braccia aperte",
    "savasana-con-brazos-abiertos-en-cruz": "Savasana con braccia aperte",
    "savasana-con-piernas-dobladas": "Savasana con ginocchia piegate",
    "setu-bandhasana-con-apertura-costal": "Ponte con apertura delle costole",
    "setu-bandhasana-dinamico": "Ponte dinamico",
    "skandasana": "Affondo laterale",
    "sukhasana-con-brazos-al-cielo": "Posizione facile con braccia al cielo",
    "sukhasana-con-manos-en-el-corazon": "Posizione facile con mani al cuore",
    "sukhasana-con-torsion": "Posizione facile con torsione",
    "supta-padangusthasana": "Mano-all'alluce supina",
    "supta-padangusthasana-lateral": "Mano-all'alluce supina laterale",
    "utkatasana": "Sedia",
    "uttanasana": "Piegamento in avanti in piedi",
    "vasisthasana-sobre-rodilla": "Plank laterale sul ginocchio",
    "virabhadrasana-ii": "Guerriero II",
    "virabhadrasana-iii-sobre-silla": "Guerriero III con sedia",
    "vrksasana-baja": "Albero basso",
    "vyaghrasana": "Tigre",
  },
};

function translatedFallbackAsana(asana: Asana, locale: Exclude<Locale, "es">): LocalizedAsana {
  const nameSpanish = localizedAsanaNames[locale][asana.slug] ?? (locale === "en" ? "Guided pose" : "Posizione guidata");
  const description = locale === "en"
    ? "Practise this shape slowly, using the breath as the guide. Keep the movement within a comfortable range and let the body find steadiness before adding intensity."
    : "Pratica questa forma lentamente, usando il respiro come guida. Mantieni il movimento in un range comodo e lascia che il corpo trovi stabilità prima di aggiungere intensità.";
  const warning = locale === "en"
    ? "Move gently and stop with pain, dizziness, numbness, or shortness of breath. Use support whenever the body asks for it."
    : "Muoviti con dolcezza e fermati con dolore, capogiro, formicolio o fiato corto. Usa supporti ogni volta che il corpo lo chiede.";
  const duration = locale === "en" ? "Follow the guided count" : "Segui il conteggio guidato";

  return { nameSpanish, description, duration, warning };
}

function findLocalizedAsana(
  slug: string,
  element: RoutineElement,
  locale: Exclude<Locale, "es">,
): LocalizedAsana | undefined {
  const direct = yogaCopy[locale][element].asanas[slug];
  if (direct) {
    return direct;
  }

  for (const routine of Object.values(yogaCopy[locale])) {
    const localized = routine.asanas[slug];
    if (localized) {
      return localized;
    }
  }

  return undefined;
}

export function getYogaElementMeta(element: RoutineElement, locale: Locale) {
  if (locale === "es") {
    return null;
  }

  return {
    bodyZone: yogaCopy[locale][element].bodyZone,
    emotional: yogaCopy[locale][element].emotional,
    planets: yogaCopy[locale][element].planets,
    signs: yogaCopy[locale][element].signs,
    intention: yogaCopy[locale][element].intention,
    signsAndHouses: yogaCopy[locale][element].signsAndHouses,
  };
}

export function localizeAsana(asana: Asana, locale: Locale): Asana {
  if (locale === "es") {
    return asana;
  }

  const localized = findLocalizedAsana(asana.slug, asana.element, locale);
  if (localized) {
    return { ...asana, ...localized, nameSanskrit: localized.nameSpanish };
  }

  const aliasedSlug = asanaLocalizationAliases[asana.slug];
  const aliased = aliasedSlug ? findLocalizedAsana(aliasedSlug, asana.element, locale) : null;
  const translatedName = localizedAsanaNames[locale][asana.slug];
  if (aliased) {
    return {
      ...asana,
      ...aliased,
      nameSanskrit: translatedName ?? aliased.nameSpanish,
      ...(translatedName ? { nameSpanish: translatedName } : {}),
    };
  }

  const fallback = translatedFallbackAsana(asana, locale);
  return { ...asana, ...fallback, nameSanskrit: fallback.nameSpanish };
}

export function localizePranayama(
  item: Pranayama,
  element: RoutineElement,
  index: number,
  locale: Locale,
): Pranayama {
  if (locale === "es") {
    return item;
  }

  return { ...item, ...yogaCopy[locale][element].pranayama[index] };
}

export function localizeRoutine(routine: ElementRoutine, locale: Locale): ElementRoutine {
  if (locale === "es") {
    return routine;
  }

  const localized = yogaCopy[locale][routine.element];
  return {
    ...routine,
    bodyZone: localized.bodyZone,
    planets: localized.planets,
    signs: localized.signs,
    intention: localized.intention,
    signsAndHouses: routine.signsAndHouses.map((entry, index) => ({
      ...entry,
      sign: localized.signs[index] ?? entry.sign,
      description: localized.signsAndHouses[index] ?? entry.description,
    })),
    asanas: routine.asanas.map((asana) => localizeAsana(asana, locale)),
    pranayama: routine.pranayama.map((item, index) =>
      localizePranayama(item, routine.element, index, locale),
    ),
    savasana: localized.savasana,
  };
}
