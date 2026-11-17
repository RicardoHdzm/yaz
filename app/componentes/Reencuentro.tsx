"use client";

import { useState } from "react";

function aInputLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const boton = "rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-30";
const enlace = "text-sm text-suave underline underline-offset-4 hover:text-texto";

export default function Reencuentro({
  fecha,
  ahora,
  alGuardar,
}: {
  fecha: string | null;
  ahora: Date;
  alGuardar: (fecha: string | null) => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState("");
  const [guardando, setGuardando] = useState(false);

  function abrir() {
    setValor(fecha ? aInputLocal(fecha) : "");
    setEditando(true);
  }

  async function guardar(nueva: string | null) {
    setGuardando(true);
    try {
      await alGuardar(nueva);
      setEditando(false);
    } finally {
      setGuardando(false);
    }
  }

  const restante = fecha ? new Date(fecha).getTime() - ahora.getTime() : null;

  let contenido: React.ReactNode;
  if (editando) {
    contenido = (
      <div className="mt-3 space-y-3">
        <input
          type="datetime-local"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-full rounded-xl border border-borde bg-transparent px-4 py-2.5 outline-none focus:border-suave"
        />
        <div className="flex items-center gap-2">
          <button onClick={() => setEditando(false)} className={`${boton} border border-borde hover:bg-relleno`}>
            Cancelar
          </button>
          <button disabled={!valor || guardando} onClick={() => guardar(new Date(valor).toISOString())} className={`${boton} bg-acento text-sobre-acento`}>
            {guardando ? "Guardando…" : "Guardar"}
          </button>
          {fecha && (
            <button onClick={() => guardar(null)} className={`${enlace} ml-auto`}>
              Quitar
            </button>
          )}
        </div>
      </div>
    );
  } else if (restante === null) {
    contenido = (
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-suave">Sin fecha todavía.</p>
        <button onClick={abrir} className={`${boton} bg-acento text-sobre-acento`}>
          Poner fecha
        </button>
      </div>
    );
  } else if (restante <= 0) {
    contenido = (
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-lg font-semibold">Hoy nos vemos.</p>
        <button onClick={abrir} className={enlace}>
          Siguiente fecha
        </button>
      </div>
    );
  } else {
    const s = Math.floor(restante / 1000);
    const bloques = [
      [Math.floor(s / 86400), "días"],
      [Math.floor((s % 86400) / 3600), "horas"],
      [Math.floor((s % 3600) / 60), "min"],
      [s % 60, "seg"],
    ] as const;
    contenido = (
      <>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {bloques.map(([n, etiqueta]) => (
            <div key={etiqueta} className="rounded-xl bg-relleno py-2.5 text-center">
              <p className="font-mono text-2xl font-semibold tabular-nums">{n}</p>
              <p className="text-xs text-suave">{etiqueta}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-suave first-letter:uppercase">
            {new Date(fecha!).toLocaleString("es-MX", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}
          </p>
          <button onClick={abrir} className={enlace}>
            Cambiar
          </button>
        </div>
      </>
    );
  }

  return (
    <section className="rounded-2xl border border-borde bg-tarjeta p-5">
      <p className="text-sm text-suave">Próximo reencuentro</p>
      {contenido}
    </section>
  );
}
