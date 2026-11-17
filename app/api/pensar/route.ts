import { db, error, invalido, noAutorizado, notificar, revisar } from "@/lib/servidor";
import { MAX_MENSAJE, NOMBRES, esPersona, otra } from "@/lib/config";

export async function POST(req: Request) {
  const no = noAutorizado(req);
  if (no) return no;

  const { de, mensaje } = await req.json().catch(() => ({}));
  if (!esPersona(de)) return invalido("Persona inválida");
  const texto = typeof mensaje === "string" && mensaje.trim() ? mensaje.trim().slice(0, MAX_MENSAJE) : "Pensé en ti";

  try {
    revisar(await db().from("pensamientos").insert({ de, mensaje: texto }));
    const enviadas = await notificar(otra(de), NOMBRES[de], texto);
    return Response.json({ ok: true, enviadas });
  } catch (e) {
    return error(e);
  }
}
