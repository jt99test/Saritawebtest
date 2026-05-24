"use client";

import { useEffect, useMemo, useState } from "react";

import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { safeGetStorageItem, safeSetStorageItem } from "@/lib/browser-storage";

const INSTALL_PROMPT_DISMISSED_KEY = "sarita_install_prompt_dismissed_at";
const INSTALL_PROMPT_INSTALLED_KEY = "sarita_install_prompt_installed";
const DISMISS_DAYS = 14;
const SHOW_DELAY_MS = 1800;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const copy = {
  es: {
    eyebrow: "acceso rápido",
    title: "Instala SARITA en tu pantalla de inicio",
    body: "Abre tus lecturas como una app, sin buscar la página cada vez.",
    install: "Instalar",
    later: "Ahora no",
    close: "Cerrar",
    iosBody: "En iPhone, toca el botón de compartir de Safari y elige “Añadir a pantalla de inicio”.",
    installed: "Instalado",
  },
  en: {
    eyebrow: "quick access",
    title: "Install SARITA on your home screen",
    body: "Open your readings like an app, without looking for the page each time.",
    install: "Install",
    later: "Not now",
    close: "Close",
    iosBody: "On iPhone, tap Safari’s share button and choose “Add to Home Screen”.",
    installed: "Installed",
  },
  it: {
    eyebrow: "accesso rapido",
    title: "Installa SARITA sulla schermata Home",
    body: "Apri le tue letture come un'app, senza cercare la pagina ogni volta.",
    install: "Installa",
    later: "Non ora",
    close: "Chiudi",
    iosBody: "Su iPhone, tocca il pulsante di condivisione di Safari e scegli “Aggiungi alla schermata Home”.",
    installed: "Installata",
  },
};

function isRecentlyDismissed() {
  const raw = safeGetStorageItem("local", INSTALL_PROMPT_DISMISSED_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt)) return false;
  return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOSDevice() {
  const navigatorWithData = window.navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = navigatorWithData.userAgentData?.platform ?? window.navigator.platform;
  return /iPad|iPhone|iPod/.test(platform) || (
    platform === "MacIntel" && window.navigator.maxTouchPoints > 1
  );
}

export function InstallAppPrompt() {
  const locale = useStoredLocale();
  const text = copy[locale];
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  const canUseNativePrompt = Boolean(installEvent);
  const body = useMemo(() => (ios && !canUseNativePrompt ? text.iosBody : text.body), [canUseNativePrompt, ios, text]);

  useEffect(() => {
    if (safeGetStorageItem("local", INSTALL_PROMPT_INSTALLED_KEY) || isStandaloneMode() || isRecentlyDismissed()) {
      return;
    }

    let showTimeout: number | undefined;

    function showPrompt(nextIos: boolean) {
      showTimeout = window.setTimeout(() => {
        setIos(nextIos);
        setVisible(true);
      }, SHOW_DELAY_MS);
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      showPrompt(false);
    }

    function handleInstalled() {
      safeSetStorageItem("local", INSTALL_PROMPT_INSTALLED_KEY, "true");
      setInstalled(true);
      setVisible(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if (isIOSDevice()) {
      showPrompt(true);
    }

    return () => {
      if (showTimeout) window.clearTimeout(showTimeout);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    function handleManualPrompt() {
      if (safeGetStorageItem("local", INSTALL_PROMPT_INSTALLED_KEY) || isStandaloneMode()) {
        return;
      }

      setIos(isIOSDevice());
      setVisible(true);
    }

    window.addEventListener("sarita:show-install-prompt", handleManualPrompt);
    return () => window.removeEventListener("sarita:show-install-prompt", handleManualPrompt);
  }, []);

  async function installApp() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice.outcome === "accepted") {
      safeSetStorageItem("local", INSTALL_PROMPT_INSTALLED_KEY, "true");
      setInstalled(true);
    } else {
      safeSetStorageItem("local", INSTALL_PROMPT_DISMISSED_KEY, String(Date.now()));
    }
    setVisible(false);
  }

  function dismiss() {
    safeSetStorageItem("local", INSTALL_PROMPT_DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible || installed || (!ios && !canUseNativePrompt)) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1100] mx-0 max-w-none border border-x-0 border-b-0 border-[#f5d782]/38 bg-[#071437]/96 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 text-[#d7e7ff] shadow-[0_-18px_70px_rgba(0,0,0,0.42),0_0_34px_rgba(0,102,255,0.14)] backdrop-blur-md sm:bottom-6 sm:left-auto sm:right-6 sm:mx-0 sm:max-w-md sm:border sm:p-4 sm:shadow-[0_22px_70px_rgba(0,0,0,0.34),0_0_34px_rgba(0,102,255,0.14)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#f5d782]/45 bg-[#f5d782]/14 font-serif text-lg text-[#f5d782]">
          S
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f5d782]">
            {text.eyebrow}
          </p>
          <h2 className="mt-1 font-serif text-xl leading-snug text-[#fffaf0]">
            {text.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#d7e7ff]/72">
            {body}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 px-2 py-1 text-sm text-[#f5d782] transition hover:text-[#ffe7a3]"
          aria-label={text.close}
        >
          ×
        </button>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="border border-[#d7e7ff]/18 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d7e7ff] transition hover:border-[#f5d782]/45 hover:text-[#f5d782]"
        >
          {text.later}
        </button>
        {canUseNativePrompt ? (
          <button
            type="button"
            onClick={installApp}
            className="border border-[#f5d782]/50 bg-[#f5d782]/14 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5d782] transition hover:bg-[#f5d782]/20"
          >
            {text.install}
          </button>
        ) : null}
      </div>
    </div>
  );
}
