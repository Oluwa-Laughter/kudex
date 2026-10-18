'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/** One entrance on the landing page; content remains visible without JavaScript. */
export function HeroReveal({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.fromTo(
          '[data-hero-part]',
          { y: 12, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.07,
            ease: 'power2.out',
            clearProps: 'all',
          },
        );
      }, root);
      return () => context.revert();
    });
    return () => media.revert();
  }, []);
  return <div ref={root}>{children}</div>;
}
