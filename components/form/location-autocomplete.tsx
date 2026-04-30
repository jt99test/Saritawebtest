"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { PlaceSuggestion } from "@/lib/geocoding";
import type { Dictionary } from "@/lib/i18n";

type LocationAutocompleteProps = {
  value: string;
  selectedLocation: PlaceSuggestion | null;
  onInputChange: (value: string) => void;
  onSelect: (place: PlaceSuggestion) => void;
  disabled?: boolean;
  dictionary: Dictionary;
};

type PlacesResponse = {
  suggestions: PlaceSuggestion[];
};

export function LocationAutocomplete({
  value,
  selectedLocation,
  onInputChange,
  onSelect,
  disabled = false,
  dictionary,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const blurTimeoutRef = useRef<number | null>(null);
  const listId = useId();
  const hasSearchTerm = value.trim().length >= 2;
  const showDropdown = open && hasSearchTerm;

  useEffect(() => {
    if (selectedLocation && value === selectedLocation.displayName) {
      return;
    }

    const trimmedValue = value.trim();
    if (trimmedValue.length < 2) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/places?q=${encodeURIComponent(trimmedValue)}`);
        const data = (await response.json()) as PlacesResponse;

        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        setSuggestions(data.suggestions);
        setOpen(true);
        setHighlightedIndex(0);
      } catch {
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        setSuggestions([]);
        setOpen(true);
        setError(dictionary.form.locationStatus.error);
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setLoading(false);
        }
      }
    }, 240);

    return () => {
      window.clearTimeout(timer);
    };
  }, [dictionary.form.locationStatus.error, selectedLocation, value]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  function handleSelect(place: PlaceSuggestion) {
    onSelect(place);
    setSuggestions([]);
    setOpen(false);
    setError(null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % suggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
    }

    if (event.key === "Enter") {
      event.preventDefault();
      handleSelect(suggestions[highlightedIndex]!);
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        required
        value={value}
        onChange={(event) => onInputChange(event.target.value)}
        onFocus={() => {
          if (suggestions.length > 0 && hasSearchTerm) {
            setOpen(true);
          }
        }}
        onBlur={() => {
          blurTimeoutRef.current = window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={handleKeyDown}
        placeholder={dictionary.form.placeholders.location}
        disabled={disabled}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
        className="w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3.5 text-sm text-ivory outline-none transition placeholder:text-ivory/28 focus:border-dusty-gold/55 focus:ring-2 focus:ring-dusty-gold/20 disabled:opacity-50"
      />

      {selectedLocation ? (
        <p className="mt-2 text-xs leading-5 text-dusty-gold/78">
          {dictionary.form.locationStatus.selected}: {selectedLocation.displayName}
        </p>
      ) : (
        <p className="mt-2 text-xs leading-5 text-ivory/42">{dictionary.form.locationStatus.hint}</p>
      )}

      {showDropdown ? (
        <div
          id={listId}
          className="absolute left-0 right-0 z-20 mt-3 overflow-hidden rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,13,22,0.96),rgba(8,10,18,0.98))] shadow-[0_30px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl"
        >
          {loading ? (
            <div className="px-4 py-4 text-sm text-ivory/58">{dictionary.form.locationStatus.searching}</div>
          ) : error ? (
            <div className="px-4 py-4 text-sm text-ivory/58">{error}</div>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-72 overflow-y-auto py-2">
              {suggestions.map((suggestion, index) => {
                const active = index === highlightedIndex;

                return (
                  <li key={suggestion.id}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(suggestion)}
                      className={[
                        "flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition",
                        active ? "bg-white/[0.06]" : "hover:bg-white/[0.04]",
                      ].join(" ")}
                    >
                      <div>
                        <p className="text-sm text-ivory">{suggestion.displayName}</p>
                        <p className="mt-1 text-xs text-ivory/46">
                          {suggestion.city}
                          {suggestion.region ? ` · ${suggestion.region}` : ""}
                          {suggestion.country ? ` · ${suggestion.country}` : ""}
                        </p>
                      </div>
                      <span className="mt-0.5 text-[0.65rem] uppercase tracking-[0.22em] text-dusty-gold/82">
                        {suggestion.timezone}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-4 text-sm text-ivory/58">{dictionary.form.locationStatus.empty}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
