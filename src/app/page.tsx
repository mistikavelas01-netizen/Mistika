import Link from "next/link";

export default function HomePage() {
  return (
    <div
      className="relative min-h-screen bg-cover bg-center flex flex-col"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url(/images/products/HomeImage.jpg)",
      }}
    >
      <main className="flex flex-col justify-center items-center flex-1 text-center text-white px-6">
        <h1
          className="font-light tracking-[0.35em] mb-10"
          style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)", lineHeight: 1.1 }}
        >
          MISTIKA
        </h1>

        <Link
          href="/shop"
          aria-label="Ir a compras"
          className="relative inline-flex items-center justify-center px-10 sm:px-16 py-3 sm:py-4 text-sm sm:text-base uppercase tracking-[0.25em] rounded-full transition-transform hover:scale-105"
        >
          <span
            className="absolute inset-[-14px] sm:inset-[-18px] rounded-full border border-white/90 pointer-events-none"
            style={{
              boxShadow:
                "0 8px 30px rgba(0,0,0,0.6), 0 0 15px rgba(255,255,255,0.25)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
            }}
          />
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          />
          <span className="relative z-10 text-white font-medium">Comprar</span>
        </Link>
      </main>
    </div>
  );
}
