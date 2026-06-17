"use client";

import { useEffect } from "react";

/**
 * Client-only behaviors for the landing page:
 *  - reveal-on-scroll via IntersectionObserver (adds .is-visible)
 *  - nav background on scroll
 *  - pointer-tracked electric edge highlight on .card elements
 *
 * Rendered once near the root; it wires up document-level listeners and
 * observes any element carrying the `.reveal` class.
 */
export default function Motion() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- Reveal on scroll -------------------------------------------------
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (reduce) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
      );
      revealEls.forEach((el) => io.observe(el));
    }

    // --- Nav scroll state -------------------------------------------------
    const nav = document.querySelector<HTMLElement>(".nav");
    const onScroll = () => {
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // --- Pointer-tracked card glow ---------------------------------------
    const onPointer = (e: PointerEvent) => {
      const card = (e.target as HTMLElement)?.closest<HTMLElement>(".card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };
    if (!reduce) document.addEventListener("pointermove", onPointer);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return null;
}
