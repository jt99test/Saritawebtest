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
    birthTimeUnknown: false,
    gender: "",
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
    "w-full rounded-2xl border border-black/15 bg-cosmic-900 px-4 py-4 text-sm text-ivory outline-none transition placeholder:text-muted-ivory hover:border-black/25 focus:border-dusty-gold/55 focus:ring-2 focus:ring-dusty-gold/20 disabled:opacity-50";
  const labelClass = "mb-2 block text-xs uppercase tracking-[0.28em] text-[#3a3048]";

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative min-h-[100svh] py-5 sm:py-10">
        <Container className="relative flex min-h-[100svh] items-start py-4 sm:min-h-screen lg:items-center lg:py-0">
          <Reveal mode="immediate" className="mx-auto grid w-full max-w-5xl gap-7 lg:grid-cols-[0.8fr_1fr] lg:items-center lg:gap-10">
            <div className="pb-2">
              <Link
                href="/"
                className="text-xs font-medium uppercase tracking-[0.26em] text-[#3a3048] transition hover:text-ivory"
              >
                {dictionary.form.back}
              </Link>

              <SectionTitle className="mt-5">{dictionary.form.title}</SectionTitle>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#3a3048] sm:text-base sm:leading-8">
                {dictionary.form.subtitle}
              </p>
            </div>

              <form
                onSubmit={handleSubmit}
                className="grid gap-4 border-t border-dusty-gold/16 pt-6 sm:grid-cols-2 sm:pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0"
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

                <div className="block">
                  <span className={labelClass}>{dictionary.form.fields.birthtime}</span>
                  <input
                    type="time"
                    value={values.birthTimeUnknown ? "" : values.birthTime}
                    onChange={(event) => setValue("birthTime", event.target.value)}
                    disabled={submitting || values.birthTimeUnknown}
                    className={inputClass}
                  />
                  <label className="mt-3 flex items-center gap-3 text-sm leading-6 text-[#3a3048]">
                    <input
                      type="checkbox"
                      checked={Boolean(values.birthTimeUnknown)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setValues((current) => ({
                          ...current,
                          birthTimeUnknown: checked,
                          birthTime: checked ? "" : current.birthTime,
                        }));
                      }}
                      disabled={submitting}
                      className="mt-1 h-4 w-4 rounded border-black/20 text-dusty-gold"
                    />
                    <span className="font-medium text-ivory">{dictionary.form.birthTimeUnknown.label}</span>
                    <span className="group relative inline-flex">
                      <button
                        type="button"
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-black/15 bg-white/60 text-[11px] font-semibold text-[#5c4a24] outline-none transition hover:border-dusty-gold/55 focus:border-dusty-gold/55"
                        aria-label={dictionary.form.birthTimeUnknown.body}
                      >
                        ?
                      </button>
                      <span className="pointer-events-none absolute left-1/2 top-7 z-30 w-64 -translate-x-1/2 border border-black/10 bg-white px-4 py-3 text-xs leading-5 text-[#3a3048] opacity-0 shadow-[0_18px_45px_rgba(0,0,0,0.14)] transition group-hover:opacity-100 group-focus-within:opacity-100">
                        {dictionary.form.birthTimeUnknown.body}
                      </span>
                    </span>
                  </label>
                </div>

                <div className="block">
                  <span className={labelClass}>{dictionary.form.fields.gender}</span>
                  <select
                    value={values.gender}
                    onChange={(event) => setValue("gender", event.target.value as FormValues["gender"])}
                    disabled={submitting}
                    className={inputClass}
                  >
                    <option value="">{dictionary.form.genderOptions.unspecified}</option>
                    <option value="female">{dictionary.form.genderOptions.female}</option>
                    <option value="male">{dictionary.form.genderOptions.male}</option>
                    <option value="neutral">{dictionary.form.genderOptions.neutral}</option>
                  </select>
                </div>

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
