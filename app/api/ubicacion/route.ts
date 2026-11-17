import { db, error, invalido, noAutorizado, revisar } from "@/lib/servidor";
import { esPersona } from "@/lib/config";

function zonaValida(zona: unknown): zona is string {
  if (typeof zona !== "string") return false;
  try {
    new Intl.DateTimeFormat("es", { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const no = noAutorizado(req);
  if (no) return no;

  const { persona, ciudad, lat, lon, zona } = await req.json().catch(() => ({}));
  if (
    !esPersona(persona) ||
    typeof ciudad !== "string" ||
    !ciudad.trim() ||
    typeof lat !== "number" ||
    typeof lon !== "number" ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180 ||
    !zonaValida(zona)
  ) {
    return invalido();
  }

  try {
    revisar(
      await db()
        .from("ubicaciones")
        .upsert({ persona, ciudad: ciudad.trim().slice(0, 120), lat, lon, zona, updated_at: new Date().toISOString() }),
    );
    return Response.json({ ok: true });
  } catch (e) {
    return error(e);
  }
}
