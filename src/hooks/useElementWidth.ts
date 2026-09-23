import { useEffect, useRef, useState, type RefObject } from "react";

/** Measured content width of an element. Returns 0 until the first non-zero layout. */
export function useElementWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    function measure() {
      const next = Math.floor(element!.getBoundingClientRect().width);
      if (next > 0) {
        setWidth((current) => (current === next ? current : next));
      }
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return [ref, width];
}
