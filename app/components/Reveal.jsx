"use client";

import { useEffect, useRef, useState } from "react";

// Fades content up the first time it scrolls into view.
export default function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVis(true);
          io.disconnect();
        }
      },
      { threshold: 0.06 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal${vis ? " visible" : ""}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
