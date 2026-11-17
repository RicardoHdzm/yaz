"use client";

import { useState } from "react";
import { NOMBRES, type Persona } from "@/lib/config";
import { api, type Sesion } from "@/lib/cliente";
import Corazon from "./Corazon";

export default function Bienvenida({ alEntrar }: { alEntrar: (s: Sesion) => void }) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!persona || !codigo.trim()) return;
    setCargando(true);
    setError("");
    try {
      await api(codigo.trim(), "/api/estado");
      alEntrar({ persona, codigo: codigo.trim() });
    } catch (err) {
      setError((err as { status?: number }).status === 401 ? "Código incorrecto" : (err as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <form onSubmit={entrar} className="w-full max-w-sm rounded-2xl border border-borde bg-tarjeta p-6">
        <Corazon className="text-acento-texto" size={28} />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {NOMBRES.a} & {NOMBRES.b}
        </h1>
        <p className="mt-1 text-sm text-suave">Elige quién eres y escribe el código.</p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          {(["a", "b"] as Persona[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPersona(p)}
              className={`rounded-xl border px-3 py-2.5 font-medium transition ${
                persona === p ? "border-acento bg-acento text-sobre-acento" : "border-borde hover:bg-relleno"
              }`}
            >
              {NOMBRES[p]}
            </button>
          ))}
        </div>

        <input
          type="password"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Código"
          className="mt-3 w-full rounded-xl border border-borde bg-transparent px-4 py-2.5 outline-none placeholder:text-suave focus:border-suave"
        />

        {error && <p className="mt-3 text-sm text-acento-texto">{error}</p>}

        <button
          disabled={!persona || !codigo.trim() || cargando}
          className="mt-4 w-full rounded-xl bg-acento py-2.5 font-medium text-sobre-acento transition disabled:opacity-30"
        >
          {cargando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
