import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";
import type { Persona } from "./config";

let cliente: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (cliente) return cliente;
  const url = process.env.SUPABASE_URL;
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !llave) throw new Error("Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
  cliente = createClient(url, llave, { auth: { persistSession: false } });
  return cliente;
}

// Solo nosotros dos conocemos el código secreto
export function noAutorizado(req: Request): Response | null {
  const codigo = process.env.CODIGO_SECRETO;
  if (!codigo) return Response.json({ error: "Falta configurar CODIGO_SECRETO" }, { status: 500 });
  if (req.headers.get("x-codigo") !== codigo) {
    return Response.json({ error: "Código incorrecto" }, { status: 401 });
  }
  return null;
}

export function error(e: unknown): Response {
  const mensaje = e instanceof Error ? e.message : "Algo salió mal";
  const status = (e as { status?: number }).status ?? 500;
  if (status >= 500) console.error(e);
  return Response.json({ error: mensaje }, { status });
}

export function invalido(mensaje = "Datos inválidos"): Response {
  return Response.json({ error: mensaje }, { status: 400 });
}

// Lanza si la consulta de Supabase falló; si no, devuelve los datos
export function revisar<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

let vapidListo = false;

function push(): typeof webpush {
  if (!vapidListo) {
    const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privada = process.env.VAPID_PRIVATE_KEY;
    if (!publica || !privada) throw new Error("Faltan las llaves VAPID");
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:nosotros@example.com", publica, privada);
    vapidListo = true;
  }
  return webpush;
}

// Manda una notificación push a todos los dispositivos de una persona
export async function notificar(para: Persona, title: string, body: string, url = "/"): Promise<number> {
  const subs = revisar(await db().from("suscripciones").select("endpoint, data").eq("persona", para)) ?? [];
  const aviso = JSON.stringify({ title, body, url });
  let enviadas = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await push().sendNotification(s.data, aviso);
        enviadas++;
      } catch (err) {
        const codigo = (err as { statusCode?: number }).statusCode;
        // La suscripción ya no existe (desinstaló la app o revocó el permiso)
        if (codigo === 404 || codigo === 410) await db().from("suscripciones").delete().eq("endpoint", s.endpoint);
        else console.error(err);
      }
    }),
  );
  return enviadas;
}

const BUCKET = "fotos";
const TIPOS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 4 * 1024 * 1024;

export async function subirImagen(archivo: FormDataEntryValue | null, carpeta: string): Promise<string> {
  if (!(archivo instanceof File) || !TIPOS[archivo.type]) throw Object.assign(new Error("La imagen no es válida"), { status: 400 });
  if (archivo.size > MAX_BYTES) throw Object.assign(new Error("La imagen es muy pesada"), { status: 400 });
  const path = `${carpeta}/${crypto.randomUUID()}.${TIPOS[archivo.type]}`;
  revisar(await db().storage.from(BUCKET).upload(path, archivo, { contentType: archivo.type }));
  return path;
}

export async function borrarImagenes(paths: string[]) {
  if (paths.length) await db().storage.from(BUCKET).remove(paths);
}

// Las fotos son privadas: generamos links temporales para verlas
export async function firmar(paths: (string | null | undefined)[]): Promise<Record<string, string>> {
  const unicos = [...new Set(paths.filter((p): p is string => !!p))];
  if (!unicos.length) return {};
  const firmados = revisar(await db().storage.from(BUCKET).createSignedUrls(unicos, 60 * 60 * 6)) ?? [];
  return Object.fromEntries(firmados.filter((f) => f.signedUrl).map((f) => [f.path, f.signedUrl]));
}
