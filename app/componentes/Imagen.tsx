"use client";

import { useState } from "react";

// Las fotos vienen de links temporales de Supabase, así que usamos <img> normal
export default function Imagen({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <button onClick={() => setAbierta(true)} className={`block overflow-hidden ${className ?? ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      </button>
      {abierta && (
        <div
          onClick={() => setAbierta(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-label={alt}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </>
  );
}
