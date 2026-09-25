"use client";

import { useState } from "react";

export function HeroMedia({ src }: { src: string | null }) {
  const [visible, setVisible] = useState(Boolean(src));
  if (!src || !visible) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={1600}
      height={900}
      className="absolute inset-0 h-full w-full object-cover"
      fetchPriority="high"
      decoding="async"
      onError={() => setVisible(false)}
    />
  );
}
