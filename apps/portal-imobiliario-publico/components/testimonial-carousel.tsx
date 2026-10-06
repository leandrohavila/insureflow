"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { PortalTestimonial } from "@/lib/social-proof";

export function TestimonialCarousel({ items }: { items: PortalTestimonial[] }) {
  const [index, setIndex] = useState(0);
  const total = items.length;
  const current = items[index] ?? items[0];
  if (!current || total === 0) return null;

  function step(direction: number) {
    setIndex((value) => (value + direction + total) % total);
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#10294B]">
          Depoimento {index + 1} de {total}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            className="inline-flex size-11 items-center justify-center rounded-full border border-[#E6E8EC] bg-white text-[#000C24] shadow-sm hover:border-[#C09048]"
            aria-label="Depoimento anterior"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            className="inline-flex size-11 items-center justify-center rounded-full border border-[#E6E8EC] bg-white text-[#000C24] shadow-sm hover:border-[#C09048]"
            aria-label="Próximo depoimento"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>
      <figure className="mt-4 rounded-[28px] bg-white p-6 shadow-[0_18px_40px_-24px_rgba(0,12,36,.4)] md:p-10">
        <blockquote className="text-xl font-medium leading-relaxed text-[#000C24] md:text-2xl" aria-live="polite">
          “{current.quote}”
        </blockquote>
        <figcaption className="mt-6">
          <p className="text-sm font-semibold text-[#000C24]">{current.name}</p>
          <p className="text-sm text-[#8a6a2f]">{current.context}</p>
        </figcaption>
      </figure>
      <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Escolher depoimento">
        {items.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={itemIndex === index}
            aria-label={`Depoimento ${itemIndex + 1}: ${item.context}`}
            onClick={() => setIndex(itemIndex)}
            className={`h-2.5 rounded-full transition-all ${itemIndex === index ? "w-8 bg-[#C09048]" : "w-2.5 bg-[#C09048]/35"}`}
          />
        ))}
      </div>
    </div>
  );
}
