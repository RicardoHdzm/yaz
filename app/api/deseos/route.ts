import { db, error, invalido, noAutorizado, revisar } from "@/lib/servidor";
import { esPersona } from "@/lib/config";

function urlValida(v: unknown): v is string {
  if (typeof v !== "string") return false;
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

async function dueno(id: number): Promise<string | null> {
  const fila = revisar(await db().from("deseos").select("persona").eq("id", id).maybeSingle());
  return fila?.persona ?? null;
}

export async function POST(req: Request) {
  const no = noAutorizado(req);
  if (no) return no;

  const { persona, titulo, url, nota } = await req.json().catch(() => ({}));
  if (!esPersona(persona) || !urlValida(url)) return invalido("Revisa el link");
  const link = url.trim();

  try {
    revisar(
      await db()
        .from("deseos")
        .insert({
          persona,
          url: link,
          titulo: typeof titulo === "string" && titulo.trim() ? titulo.trim().slice(0, 120) : new URL(link).hostname.replace(/^www\./, ""),
          nota: typeof nota === "string" && nota.trim() ? nota.trim().slice(0, 300) : null,
        }),
    );
    return Response.json({ ok: true });
  } catch (e) {
    return error(e);
  }
}

// Marcar como comprado: solo lo puede hacer el otro
export async function PATCH(req: Request) {
  const no = noAutorizado(req);
  if (no) return no;

  const { id, persona, comprado } = await req.json().catch(() => ({}));
  if (!Number.isInteger(id) || !esPersona(persona) || typeof comprado !== "boolean") return invalido();

  try {
    const de = await dueno(id);
    if (!de) return invalido("No existe");
    if (de === persona) return invalido("No puedes marcar tus propios deseos");
    revisar(await db().from("deseos").update({ comprado }).eq("id", id));
    return Response.json({ ok: true });
  } catch (e) {
    return error(e);
  }
}

// Borrar: solo el dueño
export async function DELETE(req: Request) {
  const no = noAutorizado(req);
  if (no) return no;

  const params = new URL(req.url).searchParams;
  const id = Number(params.get("id"));
  const persona = params.get("persona");
  if (!Number.isInteger(id) || !esPersona(persona)) return invalido();

  try {
    if ((await dueno(id)) !== persona) return invalido("Solo puedes borrar tus propios deseos");
    revisar(await db().from("deseos").delete().eq("id", id));
    return Response.json({ ok: true });
  } catch (e) {
    return error(e);
  }
}
