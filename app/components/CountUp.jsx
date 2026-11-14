"use client";

import { useEffect, useRef, useState } from "react";

// Counts a number up from 0 the first time it scrolls into view.
export default function CountUp({ value, prefix = "$", duration = 1300 }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(Math.round(value * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {n.toLocaleString()}
    </span>
  );
}
