import { db, error, noAutorizado } from "@/lib/servidor";

export async function POST(req: Request) {
  const no = noAutorizado(req);
  if (no) return no;

  const { fecha } = await req.json().catch(() => ({}));
  if (fecha !== null && (typeof fecha !== "string" || isNaN(Date.parse(fecha)))) {
    return Response.json({ error: "Fecha inválida" }, { status: 400 });
  }

  try {
    const { error: e } = await db()
      .from("ajustes")
      .upsert({ id: 1, proximo_encuentro: fecha ? new Date(fecha).toISOString() : null });
    if (e) throw new Error(e.message);
    return Response.json({ ok: true });
  } catch (e) {
    return error(e);
  }
}
