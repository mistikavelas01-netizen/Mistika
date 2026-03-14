"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ProductCarouselSlide = {
  id: string;
  imageUrl: string;
  name?: string | null;
};

type ProductCarouselProps = {
  slides: ProductCarouselSlide[];
};

export default function ProductCarousel({ slides }: ProductCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <section className="relative w-screen overflow-hidden">
        <div className="relative h-screen w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.22),_transparent_42%),linear-gradient(135deg,_#111111_0%,_#2e2a26_48%,_#7a644d_100%)] sm:h-[80vh] sm:min-h-[600px]">
          <div className="absolute inset-0 bg-black/35" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-screen overflow-hidden">
      <div className="relative h-screen w-full sm:h-[80vh] sm:min-h-[600px]">
        {slides.map((slide, i) => (
          <div
            key={`${slide.id}-${i}`}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index % slides.length ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.imageUrl}
              alt={slide.name ?? "Fotografía del carrusel"}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/35" />
          </div>
        ))}

        <div className="absolute inset-0 flex items-end justify-center pb-6">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir a la diapositiva ${i + 1}`}
                aria-current={i === index % slides.length}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === index % slides.length ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
