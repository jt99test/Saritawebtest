export function clampIsoDateYear(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || year.length <= 4) return value;
  return [year.slice(0, 4), month, day].filter(Boolean).join("-");
}
