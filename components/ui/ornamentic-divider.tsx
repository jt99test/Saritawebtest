type OrnamenticDividerProps = {
  className?: string;
  glyph?: string;
};

export function OrnamenticDivider({
  className = "",
  glyph = "✦",
}: OrnamenticDividerProps) {
  return (
    <div
      className={`flex items-center justify-center gap-3 py-3 text-dusty-gold/40 ${className}`.trim()}
      aria-hidden="true"
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-current to-transparent" />
      <span className="text-[12px] leading-none">{glyph}</span>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-current to-transparent" />
    </div>
  );
}
