"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface Img {
  url: string;
  alt: string | null;
}

export function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const ref = useRef<HTMLDivElement>(null);

  const list = images.length ? images : [{ url: "", alt: name }];
  const current = list[active];

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  }

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {list.length > 1 && (
        <div className="flex gap-2 sm:flex-col">
          {list.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "relative size-16 overflow-hidden rounded-lg border bg-muted",
                i === active && "ring-2 ring-brand",
              )}
            >
              {img.url && (
                <Image src={img.url} alt={img.alt ?? name} fill sizes="64px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      <div
        ref={ref}
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={onMove}
        className="relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-xl border bg-muted"
      >
        {current.url && (
          <Image
            src={current.url}
            alt={current.alt ?? name}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 45vw"
            className={cn(
              "object-cover transition-transform duration-200",
              zoom && "scale-[1.8]",
            )}
            style={
              zoom
                ? { transformOrigin: `${pos.x}% ${pos.y}%` }
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
