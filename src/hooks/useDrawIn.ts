import { useEffect, type RefObject } from "react";

/**
 * Anima secciones y tarjetas: primero se dibuja su contorno y luego aparecen como objeto.
 * Si la persona baja rápido, la animación se acelera; si el elemento ya quedó atrás, se muestra sin animar.
 */
export function useDrawIn(root: RefObject<HTMLElement | null>, key: string) {
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const html = document.documentElement;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let timer: number | undefined;

    const onScroll = () => {
      const now = performance.now();
      const v = Math.abs(window.scrollY - lastY) / Math.max(now - lastT, 1);
      lastY = window.scrollY;
      lastT = now;
      if (v > 2) {
        html.classList.add("draw-fast");
        window.clearTimeout(timer);
        timer = window.setTimeout(() => html.classList.remove("draw-fast"), 400);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const t = e.target as HTMLElement;
          if (e.isIntersecting) {
            t.classList.add("drawn");
            io.unobserve(t);
          } else if (e.boundingClientRect.bottom < 0) {
            t.classList.add("drawn-now");
            io.unobserve(t);
          }
        }
      },
      { threshold: 0.12 },
    );

    const scan = () => {
      el.querySelectorAll<HTMLElement>("section, article, header, form").forEach((n, i) => {
        if (n.classList.contains("draw")) return;
        n.classList.add("draw");
        n.style.setProperty("--draw-delay", `${(i % 4) * 120}ms`);
        io.observe(n);
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(el, { childList: true, subtree: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, [root, key]);
}
