"use client";

import { useEffect, useRef, useState } from "react";

import { PrimaryButton } from "@/components/ui/primary-button";
import { formatSignPosition, type NatalChartData } from "@/lib/chart";
import type { Dictionary } from "@/lib/i18n";

type ChartShareActionsProps = {
  chart: NatalChartData;
  dictionary: Dictionary;
  plan: string;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function filenameSafe(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "carta";
}

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
    clone.setAttribute("viewBox", "0 0 860 860");
    clone.setAttribute("x", "330");
    clone.setAttribute("y", "480");
    clone.setAttribute("width", "940");
    clone.setAttribute("height", "940");
    clone.setAttribute("overflow", "visible");
    clone.querySelectorAll("[role], [tabindex]").forEach((node) => {
      node.removeAttribute("role");
      node.removeAttribute("tabindex");
    });

    const sun = chart.points.find((point) => point.id === "sun");
    const moon = chart.points.find((point) => point.id === "moon");
    const ascendant = formatSignPosition(chart.meta.ascendant);
    const summary = [
      sun ? `${dictionary.result.points.sun}: ${dictionary.result.signs[sun.sign]}` : null,
      moon ? `${dictionary.result.points.moon}: ${dictionary.result.signs[moon.sign]}` : null,
      `${dictionary.chart.ascendantLabel}: ${dictionary.result.signs[ascendant.sign]}`,
    ].filter(Boolean).join("   ·   ");
    const subtitle = [chart.event.dateLabel, chart.event.locationLabel].filter(Boolean).join("   ·   ");
    const wheelMarkup = new XMLSerializer().serializeToString(clone);
    const source = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2000" viewBox="0 0 1600 2000" preserveAspectRatio="xMidYMin meet" style="display:block;width:100%;height:auto;background:#f5f0e6;" role="img" aria-label="${escapeXml(dictionary.chart.shareTitle)} - ${escapeXml(chart.event.name)}">
  <defs>
    <radialGradient id="sarita-export-bg" cx="50%" cy="34%" r="68%">
      <stop offset="0%" stop-color="#fffaf0"/>
      <stop offset="58%" stop-color="#f5f0e6"/>
      <stop offset="100%" stop-color="#ddd6c6"/>
    </radialGradient>
    <filter id="sarita-export-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="28" stdDeviation="34" flood-color="#1e1a2e" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="1600" height="2000" fill="url(#sarita-export-bg)"/>
  <g opacity="0.15">
    <circle cx="210" cy="230" r="2.4" fill="#ffffff"/>
    <circle cx="410" cy="160" r="2" fill="#ffffff"/>
    <circle cx="1180" cy="220" r="2.5" fill="#ffffff"/>
    <circle cx="1370" cy="420" r="1.8" fill="#ffffff"/>
    <circle cx="230" cy="930" r="2.2" fill="#ffffff"/>
    <circle cx="1320" cy="1050" r="2" fill="#ffffff"/>
    <circle cx="520" cy="1600" r="1.8" fill="#ffffff"/>
    <circle cx="1090" cy="1690" r="2.4" fill="#ffffff"/>
  </g>
  <text x="800" y="190" text-anchor="middle" fill="#5c4a24" font-family="Georgia, 'Times New Roman', serif" font-size="24" font-style="italic" letter-spacing="8">${escapeXml(dictionary.chart.shareTitle.toLowerCase())}</text>
  <text x="800" y="285" text-anchor="middle" fill="#1e1a2e" font-family="Georgia, 'Times New Roman', serif" font-size="86">${escapeXml(chart.event.name)}</text>
  <text x="800" y="360" text-anchor="middle" fill="#3a3048" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="6">${escapeXml(summary.toUpperCase())}</text>
  <text x="800" y="410" text-anchor="middle" fill="#3a3048" font-family="Arial, sans-serif" font-size="20" letter-spacing="2">${escapeXml(subtitle)}</text>
  <g filter="url(#sarita-export-shadow)">
    ${wheelMarkup}
  </g>
  <line x1="540" y1="1546" x2="1060" y2="1546" stroke="#6f5a2a" stroke-opacity="0.22"/>
  <text x="800" y="1615" text-anchor="middle" fill="#5c4a24" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="7">${escapeXml(dictionary.chart.createCta.toUpperCase())}</text>
  <text x="800" y="1665" text-anchor="middle" fill="#3a3048" font-family="Arial, sans-serif" font-size="17" letter-spacing="2">saritaastrology.com</text>
</svg>`;
    const blob = new Blob([source], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `carta-${filenameSafe(chart.event.name)}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto mt-4 max-w-3xl">
      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:justify-center">
        <button
          type="button"
          onClick={() => void shareChart()}
          disabled={pending}
          className="w-full border border-[#fffaf0]/22 bg-[#fffaf0]/[0.02] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#fffaf0] transition hover:border-[#7cbfff]/40 hover:bg-[#7cbfff]/10 disabled:opacity-50 sm:w-auto sm:text-[12px] sm:tracking-[0.18em]"
        >
          {pending ? dictionary.chart.creatingLink : dictionary.chart.share}
        </button>
        <button
          type="button"
          onClick={downloadChart}
          disabled={!canDownload}
          title={!canDownload ? dictionary.chart.downloadLockedTooltip : undefined}
          className="w-full border border-[#fffaf0]/22 bg-[#fffaf0]/[0.02] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#fffaf0] transition hover:border-[#7cbfff]/40 hover:bg-[#7cbfff]/10 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto sm:text-[12px] sm:tracking-[0.18em]"
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
            <PrimaryButton
              onClick={() => void copyLink()}
              variant="ghostGold"
              className="mt-5 px-5 py-3 text-[12px] uppercase tracking-[0.2em]"
            >
              {copied ? dictionary.chart.linkCopied : dictionary.chart.copyLink}
            </PrimaryButton>
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
