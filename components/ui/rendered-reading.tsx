type RenderedReadingProps = {
  text?: string;
  paragraphs?: string[];
  className?: string;
  paragraphClassName?: string;
};

export function splitReadingParagraphs(text: string) {
  return text
    .split(/\r?\n\s*\r?\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function RenderedReading({
  text = "",
  paragraphs,
  className = "",
  paragraphClassName = "",
}: RenderedReadingProps) {
  const renderedParagraphs = paragraphs ?? splitReadingParagraphs(text);

  return (
    <div className={`max-w-prose space-y-4 leading-[1.7] ${className}`.trim()}>
      {renderedParagraphs.map((paragraph, index) => (
        <p
          key={`${paragraph.slice(0, 24)}-${index}`}
          className={`mb-4 last:mb-0 ${paragraphClassName}`.trim()}
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
