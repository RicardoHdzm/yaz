import { db, error, invalido, noAutorizado, revisar } from "@/lib/servidor";
import { esCategoria, esPersona } from "@/lib/config";

export async function GET(req: Request) {
  const no = noAutorizado(req);
  if (no) return no;

  try {
    const pendientes = revisar(
      await db()
        .from("pendientes")
        .select("id, texto, categoria, hecho, creado_por, created_at, hecho_at")
        .order("created_at", { ascending: false }),
    );
    return Response.json({ pendientes });
  } catch (e) {
    return error(e);
  }
}

export async function POST(req: Request) {
  const no = noAutorizado(req);
  if (no) return no;

  const { persona, texto, categoria } = await req.json().catch(() => ({}));
  if (!esPersona(persona) || typeof texto !== "string" || !texto.trim() || !esCategoria(categoria)) return invalido();

  try {
    revisar(await db().from("pendientes").insert({ texto: texto.trim().slice(0, 200), categoria, creado_por: persona }));
    return Response.json({ ok: true });
  } catch (e) {
    return error(e);
  }
}

export async function PATCH(req: Request) {
  const no = noAutorizado(req);
  if (no) return no;

  const { id, hecho } = await req.json().catch(() => ({}));
  if (!Number.isInteger(id) || typeof hecho !== "boolean") return invalido();

  try {
    revisar(
      await db()
        .from("pendientes")
        .update({ hecho, hecho_at: hecho ? new Date().toISOString() : null })
        .eq("id", id),
    );
    return Response.json({ ok: true });
  } catch (e) {
    return error(e);
  }
}

export async function DELETE(req: Request) {
  const no = noAutorizado(req);
  if (no) return no;

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return invalido();

  try {
    revisar(await db().from("pendientes").delete().eq("id", id));
    return Response.json({ ok: true });
  } catch (e) {
    return error(e);
  }
}
