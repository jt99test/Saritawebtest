"use client";

import { useMemo, useState, useTransition } from "react";

import { BiWheelChart } from "@/components/chart/bi-wheel-chart";
import { LocationAutocomplete } from "@/components/form/location-autocomplete";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { PrimaryButton } from "@/components/ui/primary-button";
import { calculateSolarReturnAction } from "@/lib/actions";
import type { NatalChartData } from "@/lib/chart";
import { formatSignPosition } from "@/lib/chart";
import type { FormValues } from "@/lib/chart-session";
import type { PlaceSuggestion } from "@/lib/geocoding";
import type { Dictionary } from "@/lib/i18n";

type SolarReturnPageProps = {
  natalChart: NatalChartData;
  request: FormValues | null;
  dictionary: Dictionary;
};

type SolarData = {
  cards?: Array<{ key: string; title: string; body: string }>;
  priorities?: Array<{ title: string; body: string }>;
};

const SARITA_DATA_MARKER = "__SARITA_DATA__";

const HOUSE_AREAS: Record<number, string> = {
  1: "identidad y cuerpo",
  2: "recursos y valor propio",
  3: "voz, mente y entorno",
  4: "hogar y raíz emocional",
  5: "creatividad y deseo",
  6: "rutina, salud y oficio",
  7: "vínculos y acuerdos",
  8: "intimidad y transformación",
  9: "sentido, viajes y expansión",
  10: "dirección pública",
  11: "redes y futuro",
  12: "cierre, descanso e inconsciente",
};

const ASCENDANT_YEAR_COPY = {
  aries: "Este año pide que empieces antes de estar listo. Las ganas van a aparecer cuando des el primer paso, no antes.",
  taurus: "Las cosas van a funcionar si las haces despacio y con el cuerpo presente. No es año de atajos: es año de construir algo que dure.",
  gemini: "Vas a tener muchas ideas y conversaciones. El reto es quedarte con una y llevarla a fondo.",
  cancer: "Este año pide más cuidado hacia adentro. Lo que construyas en casa o en tu mundo privado va a marcar el resto.",
  leo: "Hay algo que quieres mostrar y este año es el momento. No esperes permiso.",
  virgo: "El foco va a estar en los hábitos y en lo que no funciona del día a día. Si lo ajustas ahora, el año que viene lo notarás.",
  libra: "Las relaciones son el centro. Algo que estaba desequilibrado va a pedir acuerdo.",
  scorpio: "Es un año de ir al fondo de algo. No de superficie. Lo que descubras sobre ti va a ser incómodo y necesario.",
  sagittarius: "Más movimiento, más horizontes, más ganas de salir del guión habitual. El año pide que te arriesgues en algo.",
  capricorn: "Año de trabajo y de demostrar que puedes. Hay algo concreto que construir, y el esfuerzo se nota.",
  aquarius: "Te va a importar más hacer lo que tú crees correcto que lo que otros esperan. Puede que alguna relación o estructura no sobreviva eso.",
  pisces: "Año permeable: mucha intuición, mucha sensación de que las cosas están conectadas. El reto es no perderte en eso.",
} as const;

const SUN_HOUSE_COPY: Record<number, string> = {
  1: "El año es sobre ti: tu cuerpo, tu identidad y tu forma de presentarte. Lo que cambies hacia afuera va a tener consecuencias reales.",
  2: "El foco cae en dinero, seguridad y valor propio. Este año pide mirar qué cobras, qué aceptas y qué haces para sentirte estable.",
  3: "El año se mueve por conversaciones, estudios, papeles y decisiones cercanas. Lo importante no será pensarlo todo, sino decirlo claro.",
  4: "El foco cae en casa, familia y raíz emocional. Algo en tu vida privada pide orden antes de poder sostener lo demás.",
  5: "Este año pide placer, deseo y algo que nazca de ti. Si llevas tiempo dejando lo creativo para después, va a pedir sitio.",
  6: "El foco está en rutina, trabajo diario y salud. Lo que repites cada día va a pesar más que cualquier gran decisión aislada.",
  7: "Las relaciones se vuelven el centro del año. Pareja, socios o acuerdos van a mostrar qué está equilibrado y qué ya no.",
  8: "El año toca intimidad, deudas, control y cosas que normalmente no se dicen. No es cómodo, pero puede quitar mucho peso.",
  9: "El foco está en estudiar, viajar, enseñar o cambiar tu forma de mirar la vida. Algo te pide salir del marco habitual.",
  10: "El año mira hacia trabajo, vocación y visibilidad. Lo que hagas públicamente va a tener más peso que otros años.",
  11: "El foco cae en amistades, redes y proyectos futuros. Vas a notar con quién sí quieres construir y con quién ya no.",
  12: "El foco solar cae en cierre, descanso e inconsciente. Antes de construir algo nuevo, el año pide que termines y sueltes lo que ya no cabe.",
};

const MOON_SIGN_COPY = {
  aries: "Emocionalmente vas a reaccionar rápido. Conviene no convertir cada enfado en una decisión irreversible.",
  taurus: "Tu cuerpo va a pedir calma, comida, descanso y estabilidad. Si te aceleras demasiado, lo notarás enseguida.",
  gemini: "El cuerpo emocional va a ir rápido este año: muchas ideas, muchos cambios de ánimo. Conviene no tomar decisiones desde el primer impulso.",
  cancer: "La sensibilidad estará alta. Vas a necesitar más hogar, más cuidado y menos exposición de la que quizá quieras admitir.",
  leo: "Vas a necesitar sentirte visto/a. Si te tragas demasiado lo que quieres expresar, acabará saliendo en forma de drama.",
  virgo: "Tu tranquilidad va a depender mucho del orden diario. Si el cuerpo se queja, mira primero descanso, agenda y hábitos.",
  libra: "Tu estado emocional va a estar muy ligado a cómo estén tus relaciones. No confundas paz con evitar una conversación necesaria.",
  scorpio: "Las emociones van a ir al fondo. Si algo duele, probablemente no sea nuevo: solo está pidiendo que lo mires de frente.",
  sagittarius: "Vas a necesitar aire, movimiento y perspectiva. Si te sientes encerrado/a, busca una decisión que agrande el mapa.",
  capricorn: "Emocionalmente puedes ponerte serio/a o exigente. Cuidado con tratar el descanso como si fuera una pérdida de tiempo.",
  aquarius: "Vas a necesitar más espacio del habitual. Si algo te aprieta demasiado, lo vas a notar en forma de distancia repentina.",
  pisces: "La emoción estará porosa. Necesitas descanso real y límites claros para no absorber problemas que no son tuyos.",
} as const;

function currentSolarReturnYear(request: FormValues | null) {
  const now = new Date();
  const birthDate = request?.birthDate ? new Date(`${request.birthDate}T00:00:00`) : null;
  if (!birthDate) return now.getFullYear();

  const birthdayThisYear = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  return now >= birthdayThisYear ? now.getFullYear() : now.getFullYear() - 1;
}

function solarPriorityAreas(sunHouse: number, moonHouse: number) {
  return [
    {
      title: `Prioriza ${HOUSE_AREAS[sunHouse]}`,
      body: "Ahí está el foco solar del año: pon energía, decisiones y presencia concreta en esa área antes de dispersarte.",
    },
    {
      title: `Cuida ${HOUSE_AREAS[moonHouse]}`,
      body: "La Luna muestra donde tu cuerpo emocional va a pedir escucha. No lo trates como algo secundario.",
    },
    {
      title: "Reduce ruido innecesario",
      body: "El mapa anual funciona mejor cuando eliges pocas prioridades y las sostienes con ritmo, no con intensidad de un solo día.",
    },
  ];
}

export function SolarReturnPage({ natalChart, request, dictionary }: SolarReturnPageProps) {
  const locale = useStoredLocale();
  const solarCopy = dictionary.result.solarReturnPage;
  const defaultYear = currentSolarReturnYear(request);
  const [targetYear, setTargetYear] = useState(defaultYear);
  const [city, setCity] = useState(request?.selectedLocation?.displayName ?? natalChart.event.locationLabel);
  const [selectedLocation, setSelectedLocation] = useState<PlaceSuggestion | null>(request?.selectedLocation ?? null);
  const [solarChart, setSolarChart] = useState<NatalChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiReading, setAiReading] = useState("");
  const [solarData, setSolarData] = useState<SolarData>({});
  const [isLoadingReading, setIsLoadingReading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const yearOptions = useMemo(
    () => Array.from({ length: 11 }, (_, index) => defaultYear - 5 + index),
    [defaultYear],
  );
  const rsAscendantPosition = solarChart ? formatSignPosition(solarChart.meta.ascendant) : null;
  const rsAscendantSign = rsAscendantPosition ? dictionary.result.signs[rsAscendantPosition.sign] : "";
  const rsMoon = solarChart?.points.find((point) => point.id === "moon");
  const rsSun = solarChart?.points.find((point) => point.id === "sun");
  const fallbackCards = [
    { key: "theme", title: solarCopy.themeCard, body: rsAscendantPosition ? `Ascendente ${rsAscendantSign}. ${ASCENDANT_YEAR_COPY[rsAscendantPosition.sign]}` : "Ascendente sin datos." },
    { key: "area", title: solarCopy.areaCard, body: `Sol en casa ${rsSun?.house ?? "—"}. ${SUN_HOUSE_COPY[rsSun?.house ?? 1]}` },
    { key: "tone", title: solarCopy.toneCard, body: rsMoon ? `Luna en ${dictionary.result.signs[rsMoon.sign]}. ${MOON_SIGN_COPY[rsMoon.sign]}` : "Luna sin datos." },
  ];
  const summaryCards = solarData.cards?.length === 3 ? solarData.cards : fallbackCards;
  const priorityAreas = solarData.priorities ?? (solarChart ? solarPriorityAreas(rsSun?.house ?? 1, rsMoon?.house ?? 4) : []);
  function calculate() {
    setError(null);
    startTransition(async () => {
      const result = await calculateSolarReturnAction({
        natalChart,
        request,
        targetYear,
        city,
        lat: selectedLocation?.lat,
        lng: selectedLocation?.lng,
      });

      if (result.ok) {
        setSolarChart(result.chart);
        setAiReading("");
        setSolarData({});
        setIsLoadingReading(true);
        void fetch("/api/solar-return-reading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ natalChartData: natalChart, solarReturnData: result.chart, locale }),
        }).then(async (res) => {
          if (!res.ok || !res.body) { setIsLoadingReading(false); return; }
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = "";
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value);
            setAiReading(accumulated.split(SARITA_DATA_MARKER)[0] ?? accumulated);
          }
          const jsonPayload = accumulated.split(SARITA_DATA_MARKER)[1]?.trim();
          if (jsonPayload) {
            try {
              setSolarData(JSON.parse(jsonPayload) as SolarData);
            } catch {}
          }
          setIsLoadingReading(false);
        }).catch(() => setIsLoadingReading(false));
      } else {
        setError(result.error ?? solarCopy.errorMessage);
      }
    });
  }

  if (solarChart) {
    return (
      <section className="py-10">
        <BiWheelChart
          innerChart={natalChart}
          outerChart={solarChart}
          innerLabel={natalChart.event.name}
          outerLabel={`RS ${targetYear}`}
          variant="solar-return"
        />

        <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <article key={card.key} className="border-t border-dusty-gold/16 bg-white/[0.02] p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-dusty-gold/72">{card.title}</p>
              <p className="mt-3 text-sm leading-7 text-ivory/68">{card.body}</p>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-3xl border-y border-dusty-gold/14 py-7">
          <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-dusty-gold/65">{solarCopy.readingEyebrow}</p>
          <h3 className="mt-2 font-serif text-3xl text-ivory">{solarCopy.readingTitle}</h3>
          <div className="mt-5 space-y-4">
            {isLoadingReading && !aiReading ? (
              <p className="animate-pulse text-base leading-8 text-ivory/35">{solarCopy.readingLoading}</p>
            ) : aiReading ? (
              aiReading.split("\n\n").filter(Boolean).map((paragraph, i) => (
                <p key={i} className="text-base leading-8 text-ivory/82">{paragraph}</p>
              ))
            ) : null}
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-4xl border-y border-white/10 py-7">
          <div>
            <p className="font-serif text-2xl text-ivory">{solarCopy.priorityTitle}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {priorityAreas.map((area) => (
                <article key={area.title} className="border-l border-dusty-gold/24 pl-4">
                  <h4 className="font-serif text-lg text-ivory">{area.title}</h4>
                  <p className="mt-1 text-sm leading-7 text-ivory/62">{area.body}</p>
                </article>
              ))}
            </div>
          </div>
          <PrimaryButton
            type="button"
            variant="ghostGold"
            className="mt-6 px-5 py-3 text-[12px] uppercase tracking-[0.2em]"
            onClick={() => setSolarChart(null)}
          >
            {solarCopy.changeYear}
          </PrimaryButton>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl py-16">
      <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-dusty-gold/65">
        {solarCopy.eyebrow}
      </p>
      <h2 className="mt-2 font-serif text-[34px] leading-tight text-ivory sm:text-[52px]">{solarCopy.title}</h2>
      <p className="mt-5 max-w-xl text-sm leading-7 text-ivory/60">
        {solarCopy.intro}
      </p>
      <div className="mt-8 grid gap-5">
        <label className="block">
          <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-ivory/58">Año</span>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {yearOptions.map((year) => (
              <button
                key={year}
                type="button"
                aria-pressed={targetYear === year}
                onClick={() => setTargetYear(year)}
                className={[
                  "rounded-full border px-3 py-2.5 text-sm font-semibold transition",
                  targetYear === year
                    ? "border-dusty-gold/70 bg-dusty-gold/18 text-dusty-gold"
                    : "border-white/12 bg-black/25 text-ivory/72 hover:border-white/24 hover:text-ivory",
                ].join(" ")}
              >
                {year}
              </button>
            ))}
          </div>
        </label>
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-ivory/58">
            {solarCopy.cityQuestion}
          </span>
          <div className="mt-2">
            <LocationAutocomplete
              value={city}
              selectedLocation={selectedLocation}
              onInputChange={(value) => {
                setCity(value);
                if (selectedLocation?.displayName !== value) setSelectedLocation(null);
              }}
              onSelect={(place) => {
                setCity(place.displayName);
                setSelectedLocation(place);
              }}
              dictionary={dictionary}
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-ivory/42">{solarCopy.cityHint}</p>
        </div>
        {error ? <p className="text-sm text-amber-100/80">{error}</p> : null}
        <PrimaryButton type="button" onClick={calculate} disabled={isPending}>
          {isPending ? solarCopy.calculating : solarCopy.viewYear.replace("{year}", String(targetYear))}
        </PrimaryButton>
      </div>
    </section>
  );
}
