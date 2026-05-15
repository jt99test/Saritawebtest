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
            ? "border-[#7cbfff]/45 bg-[#0066ff]/16 text-[#d7e7ff] shadow-[0_10px_28px_rgba(0,102,255,0.16)]"
            : "border-[#f5d782]/35 bg-[#f5d782]/12 text-[#f5d782] hover:border-[#f5d782]/55 hover:bg-[#f5d782]/18",
        ].join(" ")}
      >
        {completed ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f5d782] text-[#030814]">
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3.5 8.2 6.6 11 12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : null}
        {completed ? copy.completed : copy.markComplete}
      </button>
      {completed ? (
        <p className="text-xs leading-5 text-[#d7e7ff]/68">{copy.completedNote}</p>
      ) : null}
    </div>
  );
}
