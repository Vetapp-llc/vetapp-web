"use client";

import { useEffect, useRef } from "react";

/**
 * Makes the browser / phone Back button close an open dialog instead of
 * leaving the page. Dialogs stack, so Back closes them one at a time,
 * innermost first.
 *
 * One history entry (the "sentinel") stands for "a dialog is open", however
 * many are stacked. Back pops it and closes the top dialog; if others are
 * still open the sentinel is pushed again. When the last dialog is closed
 * some other way (✕, backdrop, save) the sentinel is removed — after a
 * short delay, so that one dialog replacing another (owner → pet) reuses
 * it. history.back() is asynchronous; pairing it with an immediate
 * pushState races and can walk off the page.
 */
const stack: { close: () => void }[] = [];
let sentinel = false; // our entry is the current history entry
let removal: ReturnType<typeof setTimeout> | null = null;
let ignorePop = false;
let listening = false;

function pushSentinel() {
  // Keep what is already in history.state (Next.js router data, the
  // dashboard view) so popping back lands on the same screen.
  window.history.pushState({ ...window.history.state, vetappDialog: true }, "");
  sentinel = true;
}

function onPopState() {
  if (ignorePop) {
    ignorePop = false;
    return;
  }
  if (!sentinel) return; // some other navigation, e.g. a dashboard view
  sentinel = false;
  stack.pop()?.close();
  if (stack.length > 0) pushSentinel();
}

export function useBackClose(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    if (!listening) {
      window.addEventListener("popstate", onPopState);
      listening = true;
    }
    if (removal) {
      clearTimeout(removal);
      removal = null;
    }
    const entry = { close: () => closeRef.current() };
    stack.push(entry);
    if (!sentinel) pushSentinel();
    return () => {
      const i = stack.indexOf(entry);
      if (i < 0) return; // closed by Back
      stack.splice(i, 1);
      if (stack.length > 0 || !sentinel || removal) return;
      removal = setTimeout(() => {
        removal = null;
        if (stack.length > 0 || !sentinel) return;
        sentinel = false;
        ignorePop = true;
        window.history.back();
      }, 80);
    };
  }, [open]);
}
