"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { LocationAutocomplete } from "@/components/form/location-autocomplete";
import { Container } from "@/components/ui/container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Reveal } from "@/components/ui/reveal";
import { SectionTitle } from "@/components/ui/section-title";
import { CHART_DRAFT_KEY, CHART_RESULT_KEY, type FormValues } from "@/lib/chart-session";
import { clampIsoDateYear } from "@/lib/date-input";
import { dictionaries } from "@/lib/i18n";

export default function FormPage() {
  const router = useRouter();
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState<FormValues>({
    name: "",
    birthDate: "",
    birthTime: "",
    location: "",
    selectedLocation: null,
  });

  function setValue<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    sessionStorage.setItem(CHART_DRAFT_KEY, JSON.stringify(values));
    sessionStorage.removeItem(CHART_RESULT_KEY);
    router.push("/loading");
  }

  const inputClass =
    "w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3.5 text-sm text-ivory outline-none transition placeholder:text-ivory/28 focus:border-dusty-gold/55 focus:ring-2 focus:ring-dusty-gold/20 disabled:opacity-50";
  const labelClass = "mb-2 block text-xs uppercase tracking-[0.28em] text-ivory/48";

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative min-h-screen py-8 sm:py-10">
        <Container className="relative flex min-h-screen items-center">
          <Reveal mode="immediate" className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[0.8fr_1fr] lg:items-end">
            <div className="pb-2">
              <Link
                href="/"
                className="text-xs font-medium uppercase tracking-[0.26em] text-ivory/52 transition hover:text-ivory"
              >
                {dictionary.form.back}
              </Link>

              <SectionTitle className="mt-6">{dictionary.form.title}</SectionTitle>
              <p className="mt-4 max-w-xl text-base leading-8 text-ivory/68">
                {dictionary.form.subtitle}
              </p>
            </div>

              <form
                onSubmit={handleSubmit}
                className="grid gap-4 border-t border-dusty-gold/16 pt-8 sm:grid-cols-2 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0"
              >
                <label className="block">
                  <span className={labelClass}>{dictionary.form.fields.name}</span>
                  <input
                    type="text"
                    required
                    value={values.name}
                    onChange={(event) => setValue("name", event.target.value)}
                    placeholder={dictionary.form.placeholders.name}
                    disabled={submitting}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>{dictionary.form.fields.birthdate}</span>
                  <input
                    type="date"
                    required
                    value={values.birthDate}
                    onChange={(event) => setValue("birthDate", clampIsoDateYear(event.target.value))}
                    disabled={submitting}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>{dictionary.form.fields.birthtime}</span>
                  <input
                    type="time"
                    value={values.birthTime}
                    onChange={(event) => setValue("birthTime", event.target.value)}
                    disabled={submitting}
                    className={inputClass}
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className={labelClass}>{dictionary.form.fields.location}</span>
                  <LocationAutocomplete
                    value={values.location}
                    selectedLocation={values.selectedLocation}
                    onInputChange={(nextValue) =>
                      setValues((current) => ({
                        ...current,
                        location: nextValue,
                        selectedLocation:
                          current.selectedLocation?.displayName === nextValue
                            ? current.selectedLocation
                            : null,
                      }))
                    }
                    onSelect={(place) =>
                      setValues((current) => ({
                        ...current,
                        location: place.displayName,
                        selectedLocation: place,
                      }))
                    }
                    disabled={submitting}
                    dictionary={dictionary}
                  />
                </label>

                <div className="pt-2 sm:col-span-2">
                  <PrimaryButton type="submit" disabled={submitting || !values.selectedLocation}>
                    {dictionary.form.submit}
                  </PrimaryButton>
                </div>
              </form>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
