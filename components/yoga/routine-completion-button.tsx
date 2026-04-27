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
      className="inline-flex items-center justify-center rounded-full border border-[#e8c547]/24 bg-[#e8c547]/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#e8c547] transition hover:border-[#e8c547]/44 hover:bg-[#e8c547]/14"
    >
      {completed ? "Completada" : "Marcar como completada"}
    </button>
  );
}
