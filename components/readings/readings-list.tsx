"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { deleteReadingAction } from "@/app/lecturas/actions";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { PrimaryButton } from "@/components/ui/primary-button";
import { illustrations } from "@/data/illustrations";
import { safeSetStorageItem } from "@/lib/browser-storage";
import { CHART_RESULT_KEY, type ChartCalculationResult } from "@/lib/chart-session";
import { dictionaries } from "@/lib/i18n";

type StoredReading = {
  id: string;
  user_id: string | null;
  type: string | null;
  chart_data: unknown;
  created_at: string;
  owner_email?: string | null;
};

function getStoredResult(reading: StoredReading): ChartCalculationResult | null {
  const data = reading.chart_data as Partial<ChartCalculationResult> | null;

  if (!data?.chart || !data.request || typeof data.isMock !== "boolean") {
    return null;
  }

  return {
    ...data,
    readingId: data.readingId ?? reading.id,
    saved: data.saved ?? true,
  } as ChartCalculationResult;
}

export function ReadingsList({
  readings,
  isAdmin = false,
}: {
  readings: StoredReading[];
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "az" | "za">("recent");
  const [isPending, startTransition] = useTransition();
  const adminCopy = {
    searchByName: locale === "en" ? "Search by name" : locale === "it" ? "Cerca per nome" : "Buscar por nombre",
    searchByEmail: locale === "en" ? "Search by account email" : locale === "it" ? "Cerca per email account" : "Buscar por email de cuenta",
    sortRecent: locale === "en" ? "Newest first" : locale === "it" ? "Più recenti" : "Más recientes",
    sortOldest: locale === "en" ? "Oldest first" : locale === "it" ? "Più vecchie" : "Más antiguas",
    sortAz: locale === "en" ? "Name A-Z" : locale === "it" ? "Nome A-Z" : "Nombre A-Z",
    sortZa: locale === "en" ? "Name Z-A" : locale === "it" ? "Nome Z-A" : "Nombre Z-A",
    allTypes: locale === "en" ? "All types" : locale === "it" ? "Tutti i tipi" : "Todos los tipos",
    noMatches: locale === "en" ? "No readings match those filters." : locale === "it" ? "Nessuna lettura coincide con i filtri." : "No hay lecturas con esos filtros.",
    client: locale === "en" ? "Client" : locale === "it" ? "Cliente" : "Cliente",
    account: locale === "en" ? "Account" : locale === "it" ? "Account" : "Cuenta",
  };
  const typeOptions = useMemo(
    () => Array.from(new Set(readings.map((reading) => reading.type).filter(Boolean))).sort() as string[],
    [readings],
  );
  const filteredReadings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedEmail = emailSearch.trim().toLowerCase();
    const labelOf = (reading: StoredReading) =>
      getStoredResult(reading)?.chart.event.name ?? dictionary.readings.fallbackTitle;

    const matches = readings.filter((reading) => {
      const label = labelOf(reading);
      const typeLabel =
        reading.type && reading.type in dictionary.readings.types
          ? dictionary.readings.types[reading.type as keyof typeof dictionary.readings.types]
          : reading.type ?? "";
      const matchesType = typeFilter === "all" || reading.type === typeFilter;
      const matchesSearch =
        !normalizedSearch ||
        label.toLowerCase().includes(normalizedSearch) ||
        typeLabel.toLowerCase().includes(normalizedSearch);
      const matchesEmail =
        !normalizedEmail ||
        (reading.owner_email ?? reading.user_id ?? "").toLowerCase().includes(normalizedEmail);

      return matchesType && matchesSearch && matchesEmail;
    });

    return matches.sort((a, b) => {
      if (sortOrder === "az") return labelOf(a).localeCompare(labelOf(b), locale);
      if (sortOrder === "za") return labelOf(b).localeCompare(labelOf(a), locale);
      if (sortOrder === "oldest") return Date.parse(a.created_at) - Date.parse(b.created_at);
      return Date.parse(b.created_at) - Date.parse(a.created_at);
    });
  }, [dictionary, emailSearch, locale, readings, search, sortOrder, typeFilter]);

  function openReading(reading: StoredReading) {
    const result = getStoredResult(reading);

    if (!result) {
      return;
    }

    if (safeSetStorageItem("session", CHART_RESULT_KEY, JSON.stringify(result))) {
      router.push("/resultado?from=lecturas");
    }
  }

  if (!readings.length) {
    return (
      <div className="mt-8 grid overflow-hidden rounded-[1.8rem] border border-dusty-gold/14 bg-[#f8f2e8]/82 p-5 shadow-[0_12px_34px_rgba(30,26,46,0.05),inset_0_1px_0_rgba(255,255,255,0.72)] sm:grid-cols-[0.9fr_1.1fr] sm:gap-8 sm:p-6">
        <div className="relative hidden min-h-52 overflow-hidden border border-black/10 sm:block">
          <Image
            src={illustrations.scenes.landing}
            alt=""
            fill
            className="object-cover opacity-58 saturate-[0.78]"
            sizes="320px"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.04),rgba(0,0,0,0.04))]" />
        </div>
        <div className="flex flex-col justify-center">
          <p className="font-serif text-[25px] leading-tight text-ivory">
            {dictionary.readings.emptyTitle}
          </p>
          <p className="mt-3 max-w-md text-sm leading-7 text-[#3a3048]">
            {dictionary.readings.emptyBody}
          </p>
          <PrimaryButton
            href="/form"
            className="mt-6 self-start px-5 py-3 text-[12px] uppercase tracking-[0.18em]"
          >
            {dictionary.readings.emptyCta}
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={[
          "mt-8 grid gap-3 border-y border-[#d7e7ff]/18 py-4",
          isAdmin ? "sm:grid-cols-2 lg:grid-cols-[1fr_1fr_12rem_12rem]" : "sm:grid-cols-[1fr_12rem_12rem]",
        ].join(" ")}
      >
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={adminCopy.searchByName}
          className="min-h-[3.25rem] border border-[#d7e7ff]/20 bg-[#071437]/84 px-4 text-base font-medium text-[#fffaf0] shadow-[0_0_22px_rgba(0,102,255,0.1)] outline-none transition placeholder:text-[#d7e7ff]/58 focus:border-[#f5d782]/55 sm:min-h-11 sm:text-[13px]"
        />
        {isAdmin ? (
          <input
            type="search"
            value={emailSearch}
            onChange={(event) => setEmailSearch(event.target.value)}
            placeholder={adminCopy.searchByEmail}
            className="min-h-[3.25rem] border border-[#d7e7ff]/20 bg-[#071437]/84 px-4 text-base font-medium text-[#fffaf0] shadow-[0_0_22px_rgba(0,102,255,0.1)] outline-none transition placeholder:text-[#d7e7ff]/58 focus:border-[#f5d782]/55 sm:min-h-11 sm:text-[13px]"
          />
        ) : null}
        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}
          className="min-h-[3.25rem] border border-[#d7e7ff]/20 bg-[#071437]/92 px-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#fffaf0] shadow-[0_0_22px_rgba(0,102,255,0.1)] outline-none transition focus:border-[#f5d782]/55 sm:min-h-11 sm:text-[12px]"
        >
          <option value="recent">{adminCopy.sortRecent}</option>
          <option value="oldest">{adminCopy.sortOldest}</option>
          <option value="az">{adminCopy.sortAz}</option>
          <option value="za">{adminCopy.sortZa}</option>
        </select>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="min-h-[3.25rem] border border-[#f5d782]/40 bg-[#071437]/92 px-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#fffaf0] shadow-[0_0_22px_rgba(245,215,130,0.1)] outline-none transition focus:border-[#f5d782]/70 sm:min-h-11 sm:text-[12px]"
        >
          <option value="all">{adminCopy.allTypes}</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type in dictionary.readings.types ? dictionary.readings.types[type as keyof typeof dictionary.readings.types] : type}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 rounded-[1.8rem] border border-[#d7e7ff]/18 bg-[#071437]/76 px-5 py-2 shadow-[0_20px_64px_rgba(0,0,0,0.32),0_0_36px_rgba(0,102,255,0.12),inset_0_1px_0_rgba(255,250,240,0.08)] backdrop-blur-md sm:px-6">
        {filteredReadings.length ? filteredReadings.map((reading) => {
          const result = getStoredResult(reading);
          const label = result?.chart.event.name ?? dictionary.readings.fallbackTitle;
          const typeLabel =
            reading.type && reading.type in dictionary.readings.types
              ? dictionary.readings.types[reading.type as keyof typeof dictionary.readings.types]
              : reading.type;
          const date = new Intl.DateTimeFormat(locale, {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(reading.created_at));

          return (
            <article
              key={reading.id}
              className="grid gap-4 border-b border-[#d7e7ff]/14 py-5 transition hover:border-[#f5d782]/32 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <button
                type="button"
                disabled={!result}
                onClick={() => openReading(reading)}
                className="min-w-0 text-left disabled:cursor-not-allowed disabled:opacity-50"
              >
                <p className="notranslate font-serif text-[21px] leading-tight text-ivory" translate="no">
                  {label}
                </p>
                <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#d7e7ff]/74">
                  {typeLabel} · {date}
                </p>
                {isAdmin ? (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f5d782]">
                    <span>{adminCopy.client}: <span className="notranslate" translate="no">{label}</span></span>
                    <span>{adminCopy.account}: {reading.owner_email ?? reading.user_id ?? "-"}</span>
                  </div>
                ) : null}
              </button>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {confirmingId === reading.id ? (
                  <>
                    <button
                      type="button"
                      disabled={isPending && pendingId === reading.id}
                      onClick={() => {
                        setPendingId(reading.id);
                        startTransition(async () => {
                          const result = await deleteReadingAction(reading.id);
                          setPendingId(null);

                          if (result.ok) {
                            setConfirmingId(null);
                            router.refresh();
                          }
                        });
                      }}
                      className="inline-flex min-w-20 items-center justify-center border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-amber-100/82 transition hover:border-amber-300/45"
                    >
                      {isPending && pendingId === reading.id ? "..." : dictionary.readings.delete}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="inline-flex min-w-20 items-center justify-center border border-black/10 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#3a3048] transition hover:text-ivory"
                    >
                      {dictionary.readings.cancel}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={!result}
                      onClick={() => openReading(reading)}
                      className="inline-flex min-w-24 items-center justify-center border border-[#f5d782]/34 bg-[#f5d782]/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#f5d782] transition hover:border-[#f5d782]/58 hover:bg-[#f5d782]/16 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {dictionary.readings.open}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(reading.id)}
                      className="inline-flex min-w-24 items-center justify-center border border-black/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048] transition hover:border-amber-300/28 hover:text-amber-100/78"
                    >
                      {dictionary.readings.delete}
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        }) : (
          <p className="py-8 text-center text-sm font-medium text-[#d7e7ff]/74">{adminCopy.noMatches}</p>
        )}
      </div>
    </>
  );
}
