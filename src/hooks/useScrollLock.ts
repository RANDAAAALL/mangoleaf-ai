import { useEffect } from "react";

let activeLocks = 0;
let previousBodyOverflow = "";
let previousHtmlOverflow = "";

/** Keep scrolling locked while overlapping modal transitions finish. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    if (activeLocks === 0) {
      previousBodyOverflow = document.body.style.overflow;
      previousHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }
    activeLocks += 1;

    return () => {
      activeLocks -= 1;
      if (activeLocks === 0) {
        document.body.style.overflow = previousBodyOverflow;
        document.documentElement.style.overflow = previousHtmlOverflow;
      }
    };
  }, [active]);
}
