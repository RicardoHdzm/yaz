import { CLAVE_SESION, type Persona } from "./config";

export type Sesion = { persona: Persona; codigo: string };

export type Pensamiento = { id: number; de: Persona; mensaje: string; created_at: string };

export type Ubicacion = { ciudad: string; lat: number; lon: number; zona: string };

export type Estado = {
  temas: Record<Persona, { fondo: string; acento: string } | null>;
  ubicaciones: Record<Persona, Ubicacion | null>;
  proximoEncuentro: string | null;
  recientes: Pensamiento[];
  hoy: Record<Persona, number>;
  total: Record<Persona, number>;
};

const CLAVE = CLAVE_SESION;

// Sesión guardada en el navegador, leída con useSyncExternalStore
let crudoCache: string | null | undefined;
let sesionCache: Sesion | null = null;
const oyentes = new Set<() => void>();

function leerCrudo(): string | null {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

export function leerSesion(): Sesion | null {
  const crudo = leerCrudo();
  if (crudo !== crudoCache) {
    crudoCache = crudo;
    try {
      const s = JSON.parse(crudo || "null");
      sesionCache = s?.persona && s?.codigo ? s : null;
    } catch {
      sesionCache = null;
    }
  }
  return sesionCache;
}

export function suscribirSesion(oyente: () => void) {
  oyentes.add(oyente);
  window.addEventListener("storage", oyente);
  return () => {
    oyentes.delete(oyente);
    window.removeEventListener("storage", oyente);
  };
}

export function guardarSesion(s: Sesion | null) {
  try {
    if (s) localStorage.setItem(CLAVE, JSON.stringify(s));
    else localStorage.removeItem(CLAVE);
  } catch {}
  oyentes.forEach((o) => o());
}

export async function api<T>(codigo: string, ruta: string, cuerpo?: unknown, metodo?: "PATCH" | "DELETE"): Promise<T> {
  const esForm = cuerpo instanceof FormData;
  const res = await fetch(ruta, {
    method: metodo ?? (cuerpo === undefined ? "GET" : "POST"),
    headers: esForm ? { "x-codigo": codigo } : { "x-codigo": codigo, "content-type": "application/json" },
    body: cuerpo === undefined ? undefined : esForm ? cuerpo : JSON.stringify(cuerpo),
    cache: "no-store",
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(datos.error || "Algo salió mal"), { status: res.status });
  return datos as T;
}

// Reduce la foto antes de subirla (las del celular pesan varios MB)
export async function comprimirImagen(archivo: File, maximo = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, maximo / Math.max(bitmap.width, bitmap.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(bitmap.width * escala);
  lienzo.height = Math.round(bitmap.height * escala);
  lienzo.getContext("2d")!.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
  bitmap.close();
  return new Promise((ok, falla) =>
    lienzo.toBlob((b) => (b ? ok(b) : falla(new Error("No se pudo procesar la imagen"))), "image/jpeg", 0.82),
  );
}

export function medianocheLocal(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
