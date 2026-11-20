'use client';
// Slowly scrolls a long list up and down by itself, so the projector can show everything.
import { useEffect } from 'react';

export function useAutoScroll(ref, enabled = true, deps = []) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return undefined;
    let raf;
    let pos = 0;
    let dir = 1;
    let pause = 2500;
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last;
      last = now;
      const max = el.scrollHeight - el.clientHeight;
      if (max > 4) {
        if (pause > 0) {
          pause -= dt;
        } else {
          pos += dir * dt * 0.035;
          if (pos >= max) {
            pos = max;
            dir = -1;
            pause = 2500;
          } else if (pos <= 0) {
            pos = 0;
            dir = 1;
            pause = 2500;
          }
          el.scrollTop = pos;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);
}
