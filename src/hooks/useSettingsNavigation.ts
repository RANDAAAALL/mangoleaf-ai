"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SettingsScreen = "backup" | "diagnostics" | "updates";
let instanceSequence = 0;
let retiringEntry: Promise<void> | null = null;

function retireEntry() {
  if (retiringEntry) return retiringEntry;
  // History traversal settles after unmount. A new Settings instance must wait before pushing.
  let complete: (() => void) | undefined;
  const traversal = new Promise<void>((resolve) => {
    complete = resolve;
  });
  // Publish before calling Back: a synchronous failure must also clear this exact promise.
  retiringEntry = traversal;
  const settled = () => {
    window.removeEventListener("popstate", settled);
    if (retiringEntry === traversal) retiringEntry = null;
    complete?.();
  };
  window.addEventListener("popstate", settled, { once: true });
  try {
    window.history.back();
  } catch {
    settled();
  }
  return traversal;
}

function pageFromState(
  state: unknown,
  production: boolean,
): SettingsScreen | null {
  if (
    !state ||
    typeof state !== "object" ||
    !("mangoleafSettingsPage" in state)
  )
    return null;
  const page = state.mangoleafSettingsPage;
  if (
    page === "backup" ||
    page === "diagnostics" ||
    (page === "updates" && production)
  )
    return page;
  return null;
}

/** Own only Settings entries; preserve Next's history state and never parse external launch URLs. */
export function useSettingsNavigation(enabled: boolean, production: boolean) {
  const [screen, setScreen] = useState<SettingsScreen | null>(null);
  const currentScreen = useRef<SettingsScreen | null>(null);
  const instanceId = useRef(0);
  const ownsEntry = useRef(false);
  const mounted = useRef(false);
  const request = useRef(0);
  const lastScreen = useRef<SettingsScreen>("backup");
  const focusFrame = useRef<number | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const entries = useRef<
    Partial<Record<SettingsScreen, HTMLButtonElement | null>>
  >({});
  const registerEntry = useCallback(
    (page: SettingsScreen, element: HTMLButtonElement | null) => {
      entries.current[page] = element;
    },
    [],
  );
  const invalidateOpen = useCallback(() => {
    request.current++;
  }, []);

  function cancelFocus() {
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = null;
  }

  useEffect(() => {
    if (!enabled) return;
    mounted.current = true;
    instanceId.current = ++instanceSequence;
    if (pageFromState(window.history.state, production)) void retireEntry();
    const pop = () => {
      const state = window.history.state;
      const page = pageFromState(state, production);
      if (page && state.mangoleafSettingsInstance === instanceId.current) {
        invalidateOpen();
        cancelFocus();
        ownsEntry.current = true;
        currentScreen.current = page;
        lastScreen.current = page;
        setScreen(page);
        window.scrollTo({ top: 0 });
        return;
      }
      if (!ownsEntry.current && !currentScreen.current) return;
      invalidateOpen();
      ownsEntry.current = false;
      currentScreen.current = null;
      setScreen(null);
      cancelFocus();
      focusFrame.current = requestAnimationFrame(() => {
        focusFrame.current = null;
        if (mounted.current && !currentScreen.current)
          entries.current[lastScreen.current]?.focus({ preventScroll: true });
      });
    };
    window.addEventListener("popstate", pop);
    return () => {
      mounted.current = false;
      invalidateOpen();
      cancelFocus();
      window.removeEventListener("popstate", pop);
      if (
        ownsEntry.current &&
        window.history.state?.mangoleafSettingsInstance === instanceId.current
      )
        void retireEntry();
    };
  }, [enabled, production, invalidateOpen]);

  useEffect(() => {
    if (screen) titleRef.current?.focus({ preventScroll: true });
  }, [screen]);

  function open(next: SettingsScreen) {
    if (
      !enabled ||
      currentScreen.current ||
      (next === "updates" && !production)
    )
      return;
    const revision = ++request.current;
    const activate = () => {
      if (
        !mounted.current ||
        request.current !== revision ||
        currentScreen.current
      )
        return;
      cancelFocus();
      // Set the ref synchronously so two clicks in the same frame create only one entry.
      currentScreen.current = next;
      lastScreen.current = next;
      ownsEntry.current = true;
      window.history.pushState(
        {
          ...window.history.state,
          mangoleafSettingsPage: next,
          mangoleafSettingsInstance: instanceId.current,
        },
        "",
        "#settings-" + next,
      );
      setScreen(next);
      window.scrollTo({ top: 0 });
    };
    if (retiringEntry) void retiringEntry.then(activate);
    else activate();
  }

  return {
    screen,
    open,
    registerEntry,
    titleRef,
    back: () => {
      if (ownsEntry.current) void retireEntry();
    },
  };
}
