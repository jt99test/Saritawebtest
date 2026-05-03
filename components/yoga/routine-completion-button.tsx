"use client";

import { useSyncExternalStore } from "react";

import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { dictionaries } from "@/lib/i18n";

type RoutineCompletionButtonProps = {
  storageKey: string;
};

export function RoutineCompletionButton({
  storageKey,
}: RoutineCompletionButtonProps) {
  const locale = useStoredLocale();
  const copy = dictionaries[locale].yogaAstral;
  const completed = useSyncExternalStore(
    (onStoreChange) => {
      const handleStorage = (event: StorageEvent) => {
        if (event.storageArea === window.localStorage && event.key === storageKey) {
          onStoreChange();
        }
      };
      const handleLocalChange = () => onStoreChange();

      window.addEventListener("storage", handleStorage);
      window.addEventListener("sarita-routine-completion", handleLocalChange);

      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("sarita-routine-completion", handleLocalChange);
      };
    },
    () => window.localStorage.getItem(storageKey) === "completed",
    () => false,
  );

  const toggleCompletion = () => {
    const nextCompleted = !completed;

    if (nextCompleted) {
      window.localStorage.setItem(storageKey, "completed");
    } else {
      window.localStorage.removeItem(storageKey);
    }

    window.dispatchEvent(new Event("sarita-routine-completion"));
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={toggleCompletion}
        aria-pressed={completed}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] transition",
          completed
            ? "border-[#6f7f59]/45 bg-[#6f7f59]/16 text-[#435032] shadow-[0_10px_28px_rgba(67,80,50,0.12)]"
            : "border-dusty-gold/35 bg-dusty-gold/12 text-[#5c4a24] hover:border-dusty-gold/55 hover:bg-dusty-gold/18",
        ].join(" ")}
      >
        {completed ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6f7f59] text-white">
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3.5 8.2 6.6 11 12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : null}
        {completed ? copy.completed : copy.markComplete}
      </button>
      {completed ? (
        <p className="text-xs leading-5 text-[#3a3048]">{copy.completedNote}</p>
      ) : null}
    </div>
  );
}
