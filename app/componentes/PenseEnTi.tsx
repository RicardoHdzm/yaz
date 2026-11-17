"use client";

import { useState } from "react";
import { MAX_MENSAJE, MENSAJES, NOMBRES, otra, type Persona } from "@/lib/config";
import type { Estado } from "@/lib/cliente";
import Corazon from "./Corazon";

function hace(iso: string, ahora: Date) {
  const min = Math.floor((ahora.getTime() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export default function PenseEnTi({
  yo,
  estado,
  ahora,
  alEnviar,
}: {
  yo: Persona;
  estado: Estado | null;
  ahora: Date;
  alEnviar: (mensaje: string) => Promise<void>;
}) {
  const [mensaje, setMensaje] = useState(MENSAJES[0]);
  const [personalizado, setPersonalizado] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pulso, setPulso] = useState(0);
  const tu = otra(yo);
  const texto = personalizado.trim() || mensaje;

  async function enviar() {
    setPulso((p) => p + 1);
    setEnviando(true);
    try {
      await alEnviar(texto);
      setPersonalizado("");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="rounded-2xl border border-borde bg-tarjeta p-5">
      <p className="text-sm text-suave">Avisarle a {NOMBRES[tu]}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {MENSAJES.map((m) => (
          <button
            key={m}
            onClick={() => {
              setMensaje(m);
              setPersonalizado("");
            }}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              mensaje === m && !personalizado.trim() ? "border-acento bg-acento text-sobre-acento" : "border-borde hover:bg-relleno"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <input
        value={personalizado}
        onChange={(e) => setPersonalizado(e.target.value)}
        maxLength={MAX_MENSAJE}
        placeholder="O escribe tu propio mensaje"
        className="mt-2 w-full rounded-xl border border-borde bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-suave focus:border-suave"
      />

      <button
        onClick={enviar}
        disabled={enviando}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-acento py-3 font-medium text-sobre-acento transition active:scale-[0.98] disabled:opacity-60"
      >
        <Corazon key={pulso} size={18} className={pulso ? "pulso" : ""} />
        Enviar “{texto}”
      </button>

      {estado && (
        <>
          <div className="mt-5 grid grid-cols-2 divide-x divide-borde rounded-xl bg-relleno py-3 text-center">
            <div>
              <p className="font-mono text-2xl font-semibold tabular-nums">{estado.hoy[yo]}</p>
              <p className="text-xs text-suave">enviados hoy</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold tabular-nums">{estado.hoy[tu]}</p>
              <p className="text-xs text-suave">recibidos de {NOMBRES[tu]}</p>
            </div>
          </div>

          {estado.recientes.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {estado.recientes.map((p) => (
                <li key={p.id} className={`flex ${p.de === yo ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                      p.de === yo ? "rounded-br-md bg-acento text-sobre-acento" : "rounded-bl-md bg-relleno"
                    }`}
                  >
                    <p className="break-words">{p.mensaje}</p>
                    <p className="mt-0.5 text-[11px] opacity-60">
                      {p.de === yo ? "Tú" : NOMBRES[p.de]} · {hace(p.created_at, ahora)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-center text-xs text-suave">{estado.total.a + estado.total.b} mensajes en total</p>
        </>
      )}
    </section>
  );
}
