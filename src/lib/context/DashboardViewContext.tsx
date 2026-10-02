"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type ViewId =
  | "home" | "stats" | "pets" | "owners" | "wideSearch"
  | "shop" | "prices" | "staff" | "appointments" | "promo" | "account";

interface DashboardViewContextValue {
  view: ViewId;
  setView: (v: ViewId) => void;
}

const DashboardViewContext = createContext<DashboardViewContextValue>({
  view: "home",
  setView: () => {},
});

export function DashboardViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setViewState] = useState<ViewId>("home");
  const current = useRef<ViewId>("home");

  // A view opened from home is a history entry, so the browser / phone
  // Back button returns home instead of leaving the dashboard. Switching
  // between views replaces the entry; going home pops it.
  const setView = useCallback((v: ViewId) => {
    const cur = current.current;
    if (cur === v) return;
    if (v === "home") {
      window.history.back(); // popstate below sets the view
      return;
    }
    const state = { ...window.history.state, vetappView: v };
    if (cur === "home") window.history.pushState(state, "");
    else window.history.replaceState(state, "");
    current.current = v;
    setViewState(v);
  }, []);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const v = (e.state?.vetappView as ViewId | undefined) ?? "home";
      current.current = v;
      setViewState(v);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <DashboardViewContext.Provider value={{ view, setView }}>
      {children}
    </DashboardViewContext.Provider>
  );
}

export function useDashboardView() {
  return useContext(DashboardViewContext);
}
