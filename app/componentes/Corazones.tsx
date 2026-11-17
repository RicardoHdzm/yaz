"use client";

import Corazon from "./Corazon";

export type Particula = { id: number; x: number; dx: number; rot: number; tam: number };

export function crearCorazones(cantidad = 8): Particula[] {
  return Array.from({ length: cantidad }, () => ({
    id: Math.random(),
    x: 30 + Math.random() * 40,
    dx: (Math.random() - 0.5) * 140,
    rot: (Math.random() - 0.5) * 60,
    tam: 14 + Math.random() * 14,
  }));
}

export default function Corazones({ lista }: { lista: Particula[] }) {
  return (
    <>
      {lista.map((c, i) => (
        <span
          key={c.id}
          className="corazon-flotante"
          style={
            {
              left: `${c.x}vw`,
              animationDelay: `${(i % 5) * 0.08}s`,
              "--dx": `${c.dx}px`,
              "--rot": `${c.rot}deg`,
            } as React.CSSProperties
          }
        >
          <Corazon size={c.tam} />
        </span>
      ))}
    </>
  );
}
