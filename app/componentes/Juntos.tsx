"use client";

import { FECHA_INICIO } from "@/lib/config";

function desglose(inicio: Date, hoy: Date) {
  let meses = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());
  if (hoy.getDate() < inicio.getDate()) meses--;
  const corte = new Date(inicio.getFullYear(), inicio.getMonth() + meses, inicio.getDate());
  const dias = Math.round((new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime() - corte.getTime()) / 864e5);
  return { anios: Math.floor(meses / 12), meses: meses % 12, dias };
}

function plural(n: number, uno: string, varios: string) {
  return `${n} ${n === 1 ? uno : varios}`;
}

export default function Juntos({ ahora }: { ahora: Date }) {
  const [a, m, d] = FECHA_INICIO.split("-").map(Number);
  const inicio = new Date(a, m - 1, d);
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const totalDias = Math.round((hoy.getTime() - inicio.getTime()) / 864e5);
  const { anios, meses, dias } = desglose(inicio, hoy);

  const partes = [anios && plural(anios, "año", "años"), meses && plural(meses, "mes", "meses"), dias && plural(dias, "día", "días")].filter(Boolean);
  const esMesiversario = hoy.getDate() === inicio.getDate() && totalDias > 0;
  const esAniversario = esMesiversario && hoy.getMonth() === inicio.getMonth();

  return (
    <section className="rounded-2xl border border-borde bg-tarjeta p-5">
      <p className="text-sm text-suave">Juntos desde el {inicio.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</p>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-5xl font-semibold tracking-tight tabular-nums">{totalDias}</span>
        <span className="text-suave">días</span>
      </p>
      {partes.length > 0 && <p className="mt-1 text-sm text-suave">{partes.join(" · ")}</p>}
      {esMesiversario && (
        <p className="mt-4 rounded-xl bg-acento-suave px-3 py-2 text-sm font-medium text-acento-texto">
          {esAniversario ? `Hoy cumplimos ${plural(anios, "año", "años")}` : `Hoy cumplimos ${plural(anios * 12 + meses, "mes", "meses")}`}
        </p>
      )}
    </section>
  );
}
