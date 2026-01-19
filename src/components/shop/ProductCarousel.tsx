"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  { src: "/images/carousel/Home.jpg", alt: "Mistika" },
  { src: "/images/carousel/Vela.jpg", alt: "Velas artesanales" },
  { src: "/images/carousel/Materiales.jpg", alt: "Materiales naturales" },
  { src: "/images/carousel/Palos.jpg", alt: "Rituales y aromas" },
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
      <div className="relative h-[45vh] min-h-[360px] w-full">
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/35" />
          </div>
        ))}

        <div className="absolute inset-0 flex items-end">
          <div className="px-6 pb-8 sm:px-10">
            <p className="text-xs uppercase tracking-[0.35em] text-white/80">
              MISTIKA
            </p>
            <p className="mt-2 text-2xl font-light text-white">
              Velas, aromas y calma
            </p>

            <div className="mt-4 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-2 w-2 rounded-full ${
                    i === index ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
