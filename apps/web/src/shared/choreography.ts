import { useEffect, useState } from 'react';

// Reveals discrete "acts" of a turn (plan → step₁ → step₂ → … → answer)
// at a fixed cadence. Returns the count of acts currently visible.
//
// `totalActs` includes the plan card (act 0) and the answer card (act N+1);
// callers compute it from `1 + traceSteps.length + 1` minus any implicit steps
// (the resolve_address step is rendered in the property panel, not the run column).
//
// Callers re-trigger the choreography by giving the surrounding component
// a fresh React `key` (turn.id) so it remounts — the hook resets naturally.
export function useChoreography(totalActs: number, intervalMs: number): number {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    setVisible(0);
    if (totalActs <= 0) return;
    const handles: number[] = [];
    for (let i = 1; i <= totalActs; i++) {
      const h = window.setTimeout(() => setVisible(i), i * intervalMs);
      handles.push(h);
    }
    return () => {
      for (const h of handles) window.clearTimeout(h);
    };
  }, [totalActs, intervalMs]);

  return visible;
}
