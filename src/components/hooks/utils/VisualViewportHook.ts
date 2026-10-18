import { useEffect } from "react";

export function useVisualViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      document.documentElement.style.setProperty(
        "--vv-height",
        `${viewport.height}px`
      );
      document.documentElement.style.setProperty(
        "--vv-top",
        `${viewport.offsetTop}px`
      );

      // страховка от уплывания
      if (viewport.offsetTop !== 0) {
        window.scrollTo(0, 0);
      }
    };

    update();

    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);

    // дополнительная страховка
    window.addEventListener("scroll", () => window.scrollTo(0, 0), { passive: false });

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);
}