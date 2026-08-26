"use client";

import { useState } from "react";
import { getSafePublicImageUrl } from "@/lib/media/public";

type PersonPortraitProps = {
  src: string | null;
  alt: string;
  initials: string;
  tone: "teal" | "sand" | "ink";
  className?: string;
};

export function PersonPortrait({ src, alt, initials, tone, className = "" }: PersonPortraitProps) {
  const [failed, setFailed] = useState(false);
  const safeSrc = getSafePublicImageUrl(src);
  const showImage = Boolean(safeSrc) && !failed;

  if (showImage) {
    return (
      <span className={`person-portrait person-portrait-image ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={safeSrc ?? ""} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      </span>
    );
  }

  return (
    <span className={`person-portrait avatar-${tone} ${className}`} role="img" aria-label={alt}>
      {initials}
    </span>
  );
}
