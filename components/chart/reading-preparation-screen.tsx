"use client";

type ReadingPreparationScreenProps = {
  title: string;
  body?: string;
  detail?: string;
};

export function ReadingPreparationScreen({ title, body, detail }: ReadingPreparationScreenProps) {
  return (
    <section className="mx-auto flex min-h-[58svh] max-w-3xl items-center justify-center px-4 py-12 text-center">
      <div className="relative z-10 flex w-full max-w-md flex-col items-center border border-[#d7e7ff]/16 bg-[#061331]/68 px-6 py-9 shadow-[0_24px_80px_rgba(0,0,0,0.32),0_0_48px_rgba(0,102,255,0.16)] backdrop-blur-md">
        <div className="relative h-24 w-24 rounded-full border border-[#f5d782]/32 bg-[#061331]/72 shadow-[0_0_46px_rgba(0,102,255,0.24),inset_0_0_28px_rgba(245,215,130,0.08)]">
          <div className="absolute inset-3 animate-spin rounded-full border border-transparent border-t-[#f5d782] border-r-[#d7e7ff]/40" />
          <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5d782] shadow-[0_0_34px_rgba(245,215,130,0.64)]" />
        </div>
        <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f5d782]">
          SARITA
        </p>
        <h2 className="mt-3 break-words font-serif text-[28px] font-normal leading-tight text-[#fffaf0]">
          {title}
        </h2>
        {body ? (
          <p className="mt-4 text-sm leading-7 text-[#d7e7ff]/76">
            {body}
          </p>
        ) : null}
        {detail ? (
          <p className="notranslate mt-4 max-w-full truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fffaf0]/58" translate="no">
            {detail}
          </p>
        ) : null}
      </div>
    </section>
  );
}
