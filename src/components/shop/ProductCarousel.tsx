"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useFetchCarouselItemsQuery } from "@/store/features/carousel/carouselApi";

const fallbackSlides = [
  {
    id: "fallback-1",
    imageUrl:
      "https://res.cloudinary.com/dpb4rfzui/image/upload/v1769289637/Palos_yoao2d_q0dv7y.jpg",
    name: "Mistika",
  },
  {
    id: "fallback-2",
    imageUrl:
      "https://res.cloudinary.com/dpb4rfzui/image/upload/v1769289635/Materiales_ah5rex_l9b80i.jpg",
    name: "Mistika",
  },
  {
    id: "fallback-3",
    imageUrl:
      "https://res.cloudinary.com/dpb4rfzui/image/upload/v1769289634/Home_q5q6go_mfggdj.jpg",
    name: "Mistika",
  },
  {
    id: "fallback-4",
    imageUrl:
      "https://res.cloudinary.com/dpb4rfzui/image/upload/v1769289633/Vela_qoeuqi_xokgqp.jpg",
    name: "Mistika",
  },
];

export default function ProductCarousel() {
  const { data } = useFetchCarouselItemsQuery(true, { refetchOnMountOrArgChange: true });
  const items = data?.data ?? [];

  const slides = useMemo(() => {
    if (items.length === 0) return fallbackSlides;
    return items.map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      name: item.name,
    }));
  }, [items]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <section className="relative w-screen overflow-hidden">
      <div className="relative h-screen sm:h-[80vh] sm:min-h-[600px] w-full">
        {slides.map((slide, i) => (
          <div
            key={`${slide.id}-${i}`}
            className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0"
              }`}
          >
            <Image
              src={slide.imageUrl}
              alt={slide.name ?? "Fotografía del carrusel"}
              fill
              priority={i === 0}
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
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/40"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
