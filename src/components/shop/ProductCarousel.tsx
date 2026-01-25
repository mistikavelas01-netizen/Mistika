"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  "https://res.cloudinary.com/dpb4rfzui/image/upload/v1769289637/Palos_yoao2d_q0dv7y.jpg",
  "https://res.cloudinary.com/dpb4rfzui/image/upload/v1769289635/Materiales_ah5rex_l9b80i.jpg",
  "https://res.cloudinary.com/dpb4rfzui/image/upload/v1769289634/Home_q5q6go_mfggdj.jpg",
  "https://res.cloudinary.com/dpb4rfzui/image/upload/v1769289633/Vela_qoeuqi_xokgqp.jpg",
];

export default function ProductCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative w-screen overflow-hidden">
      <div className="relative h-screen sm:h-[80vh] sm:min-h-[600px] w-full">
        {slides.map((slide, i) => (
          <div
            key={slide + i}
            className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0"
              }`}
          >
            <Image
              src={slide}
              alt={slide}
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
