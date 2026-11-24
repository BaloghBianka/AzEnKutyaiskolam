import { useEffect } from 'react';

function countUp(el: HTMLElement) {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  const end = Number(el.dataset.count), t0 = performance.now(), d = 1600, suf = el.dataset.suffix || '';
  const step = (t: number) => {
    const p = Math.min(1, (t - t0) / d);
    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function useReveal(dep: unknown) {
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target as HTMLElement;
      el.classList.add('in'); io.unobserve(el);
      el.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    const scan = () => document.querySelectorAll<HTMLElement>('[data-a]:not([data-watched])').forEach(el => {
      el.dataset.watched = '1';
      const sib = [...(el.parentElement?.children || [])].filter(c => c.hasAttribute('data-a'));
      el.style.transitionDelay = (sib.indexOf(el) % 3) * 120 + 'ms';
      io.observe(el);
    });
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [dep]);
}

export function useScrollEffects() {
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      const y = window.scrollY;
      document.getElementById('hdr')?.classList.toggle('solid', y > 140);
      document.getElementById('totop')?.classList.toggle('show', y > 800);
      document.querySelectorAll<HTMLElement>('[data-parallax]').forEach(b => {
        const r = b.parentElement!.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight) b.style.transform = `translateY(${r.top * -0.25}px)`;
      });
      ticking = false;
    };
    const handler = () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } };
    addEventListener('scroll', handler, { passive: true });
    onScroll();
    return () => removeEventListener('scroll', handler);
  }, []);
}

export function useTitle(title?: string, siteName = 'Az Én Kutyaiskolám', tagline = 'Kutyaiskola Miskolc') {
  useEffect(() => { document.title = title ? `${title} | ${siteName}` : `${siteName} | ${tagline}`; }, [title, siteName, tagline]);
}
