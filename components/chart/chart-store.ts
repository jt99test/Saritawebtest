"use client";

import { create } from "zustand";

import type { Aspect, ChartPointId } from "@/lib/chart";

type ChartStore = {
  selectedPointId: ChartPointId | null;
  selectedAspect: Aspect | null;
  hoveredAspectId: string | null;
  activePanel: "details" | "settings";
  detailTab: "essence" | "data" | "aspects" | "reading";
  showAspects: boolean;
  showMinorAspects: boolean;
  showMinorPoints: boolean;
  showDegrees: boolean;
  panelOpen: boolean;
  selectPoint: (pointId: ChartPointId | null) => void;
  selectAspect: (aspect: Aspect | null) => void;
  hoverAspect: (aspectId: string | null) => void;
  setActivePanel: (panel: "details" | "settings") => void;
  setDetailTab: (tab: "essence" | "data" | "aspects" | "reading") => void;
  toggleAspects: () => void;
  toggleMinorAspects: () => void;
  toggleMinorPoints: () => void;
  toggleDegrees: () => void;
  isAspectHighlighted: (aspect: Aspect) => boolean;
  openPanel: () => void;
  closePanel: () => void;
};

export const useChartStore = create<ChartStore>((set, get) => ({
  selectedPointId: null,
  selectedAspect: null,
  hoveredAspectId: null,
  activePanel: "details",
  detailTab: "essence",
  showAspects: true,
  showMinorAspects: false,
  showMinorPoints: true,
  showDegrees: true,
  panelOpen: false,
  selectPoint: (selectedPointId) =>
    set({
      selectedPointId,
      activePanel: "details",
      detailTab: "essence",
      hoveredAspectId: null,
      selectedAspect: null,
    }),
  selectAspect: (selectedAspect) =>
    set({
      selectedAspect,
      selectedPointId: null,
      panelOpen: false,
      hoveredAspectId: null,
    }),
  hoverAspect: (hoveredAspectId) => set({ hoveredAspectId }),
  setActivePanel: (activePanel) => set({ activePanel }),
  setDetailTab: (detailTab) => set({ detailTab }),
  toggleAspects: () => set((state) => ({ showAspects: !state.showAspects })),
  toggleMinorAspects: () => set((state) => ({ showMinorAspects: !state.showMinorAspects })),
  toggleMinorPoints: () => set((state) => ({ showMinorPoints: !state.showMinorPoints })),
  toggleDegrees: () => set((state) => ({ showDegrees: !state.showDegrees })),
  openPanel: () => set({ panelOpen: true }),
  closePanel: () =>
    set({
      panelOpen: false,
      selectedPointId: null,
      hoveredAspectId: null,
      detailTab: "essence",
      selectedAspect: null,
    }),
  isAspectHighlighted: (aspect) => {
    const { selectedPointId, hoveredAspectId } = get();

    if (hoveredAspectId) {
      return aspect.id === hoveredAspectId;
    }

    if (!selectedPointId) {
      return false;
    }

    return aspect.from === selectedPointId || aspect.to === selectedPointId;
  },
}));
