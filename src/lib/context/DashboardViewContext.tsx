"use client";

import { createContext, useContext, useState } from "react";

export type ViewId = "home" | "stats" | "pets" | "owners" | "wideSearch";

interface DashboardViewContextValue {
  view: ViewId;
  setView: (v: ViewId) => void;
}

const DashboardViewContext = createContext<DashboardViewContextValue>({
  view: "home",
  setView: () => {},
});

export function DashboardViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<ViewId>("home");
  return (
    <DashboardViewContext.Provider value={{ view, setView }}>
      {children}
    </DashboardViewContext.Provider>
  );
}

export function useDashboardView() {
  return useContext(DashboardViewContext);
}
