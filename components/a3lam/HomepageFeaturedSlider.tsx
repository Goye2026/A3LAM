"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { DisplayPerson } from "@/lib/a3lam/catalog";
import type { PublicMessages } from "@/lib/i18n/messages";
import { PersonPortrait } from "./PersonPortrait";

type Props = { people: DisplayPerson[]; copy: PublicMessages };

export function HomepageFeaturedSlider({ people, copy }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const count = people.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % count), 5500);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") setActive((current) => (current + 1) % count);
      if (event.key === "ArrowRight") setActive((current) => (current - 1 + count) % count);
    };
    if (count > 1) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  if (count === 0) return null;
  const person = people[active];
  const previous = () => setActive((current) => (current - 1 + count) % count);
  const next = () => setActive((current) => (current + 1) % count);

  return <div className="homepage-featured-slider" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX ?? null; }} onTouchEnd={(event) => { const start = touchStart.current; const end = event.changedTouches[0]?.clientX; touchStart.current = null; if (start === null || end === undefined || Math.abs(start - end) < 36) return; if (start > end) next(); else previous(); }}>
    <div className="homepage-featured-slide" aria-live="polite">
      <div className="homepage-featured-slide-portrait"><PersonPortrait className="homepage-featured-portrait" src={person.image} alt={person.name} initials={person.initials} tone={person.tone} /></div>
      <div className="homepage-featured-slide-content"><span className="eyebrow">{copy.publishedProfileStatus}</span><h3>{person.name}</h3><p>{person.role}</p><span className="homepage-featured-meta">{person.meta}</span><Link className="button button-primary" href={`/person/${person.slug}`}>{copy.profileView}<span aria-hidden="true">↗</span></Link></div>
      <div className="homepage-featured-slide-index" aria-hidden="true">{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</div>
    </div>
    {count > 1 ? <div className="homepage-featured-controls"><button type="button" className="homepage-slider-control" onClick={previous} aria-label="السابق">←</button><div className="homepage-slider-dots" role="tablist" aria-label="التنقل بين الشخصيات">{people.map((item, index) => <button key={item.id} type="button" role="tab" aria-selected={index === active} aria-label={`الشخصية ${index + 1}`} className={`homepage-slider-dot${index === active ? " is-active" : ""}`} onClick={() => setActive(index)} />)}</div><button type="button" className="homepage-slider-control" onClick={next} aria-label="التالي">→</button></div> : null}
  </div>;
}
