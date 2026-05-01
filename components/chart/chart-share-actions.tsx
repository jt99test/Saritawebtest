"use client";

import { useEffect, useRef, useState } from "react";

import type { NatalChartData } from "@/lib/chart";
import type { Dictionary } from "@/lib/i18n";

type ChartShareActionsProps = {
  chart: NatalChartData;
  dictionary: Dictionary;
  plan: string;
};

export function ChartShareActions({ chart, dictionary, plan }: ChartShareActionsProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const timeoutRef = useRef<number | null>(null);
  const canDownload = plan === "pro" || plan === "avanzado";

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function shareChart() {
    setError("");
    setPending(true);
    const response = await fetch("/api/share-chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chart }),
    }).catch(() => null);

    if (!response) {
      setPending(false);
      setError(dictionary.chart.shareError);
      return;
    }

    if (response.status === 401) {
      setPending(false);
      window.dispatchEvent(new Event("sarita:open-auth"));
      return;
    }

    if (!response.ok) {
      setPending(false);
      const message = await response.text().catch(() => "");
      setError(message || dictionary.chart.shareError);
      return;
    }

    const { id } = (await response.json()) as { id?: string };
    if (!id) {
      setPending(false);
      setError(dictionary.chart.shareError);
      return;
    }
    setShareUrl(`${window.location.origin}/carta/${id}`);
    setPending(false);
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
  }

  function downloadChart() {
    if (!canDownload) return;
    const svg = document.querySelector(".sarita-natal-chart svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", "1600");
    clone.setAttribute("height", "1600");
    clone.setAttribute("viewBox", "0 0 860 860");
    const source = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
    const blob = new Blob([source], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `carta-${chart.event.name.replace(/\s+/g, "-").toLowerCase()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto mt-4 max-w-3xl">
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => void shareChart()}
          disabled={pending}
          className="border border-black/20 bg-transparent px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-ivory transition hover:bg-black/[0.05] disabled:opacity-50"
        >
          {pending ? dictionary.chart.creatingLink : dictionary.chart.share}
        </button>
        <button
          type="button"
          onClick={downloadChart}
          disabled={!canDownload}
          title={!canDownload ? dictionary.chart.downloadLockedTooltip : undefined}
          className="border border-black/20 bg-transparent px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-ivory transition hover:bg-black/[0.05] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {!canDownload ? "🔒 " : ""}
          {dictionary.chart.download}
        </button>
      </div>

      {error ? (
        <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-[#8f3129]">
          {error}
        </p>
      ) : null}

      {shareUrl ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/72 px-4 backdrop-blur-[10px]">
          <div className="w-full max-w-md border border-black/10 bg-cosmic-950 p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,0.58)]">
            <h2 className="font-serif text-3xl text-ivory">{dictionary.chart.shareTitle}</h2>
            <p className="mt-3 text-sm text-[#3a3048]">{dictionary.chart.shareSubtitle}</p>
            <p className="mt-5 break-all border border-black/10 bg-black/[0.04] p-3 text-sm text-[#3a3048]">
              {shareUrl}
            </p>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="mt-5 border border-dusty-gold/35 bg-dusty-gold/12 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-dusty-gold transition hover:bg-dusty-gold/18"
            >
              {copied ? dictionary.chart.linkCopied : dictionary.chart.copyLink}
            </button>
            <button
              type="button"
              onClick={() => setShareUrl("")}
              className="mt-3 block w-full text-[12px] uppercase tracking-[0.18em] text-[#3a3048] transition hover:text-ivory"
            >
              {dictionary.common.close}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
