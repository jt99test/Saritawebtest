"use client";

import { useSyncExternalStore } from "react";

type RoutineCompletionButtonProps = {
  storageKey: string;
};

export function RoutineCompletionButton({
  storageKey,
}: RoutineCompletionButtonProps) {
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
    <button
      type="button"
      onClick={toggleCompletion}
      aria-pressed={completed}
      className="inline-flex items-center justify-center rounded-full border border-dusty-gold/35 bg-dusty-gold/12 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#5c4a24] transition hover:border-dusty-gold/55 hover:bg-dusty-gold/18"
    >
      {completed ? "Completada" : "Marcar como completada"}
    </button>
  );
}
