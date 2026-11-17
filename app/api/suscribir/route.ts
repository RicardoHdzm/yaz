import { db, error, noAutorizado } from "@/lib/servidor";
import { esPersona } from "@/lib/config";

export async function POST(req: Request) {
  const no = noAutorizado(req);
  if (no) return no;

  const { persona, subscription } = await req.json().catch(() => ({}));
  if (!esPersona(persona) || typeof subscription?.endpoint !== "string") {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    const { error: e } = await db()
      .from("suscripciones")
      .upsert({ endpoint: subscription.endpoint, persona, data: subscription }, { onConflict: "endpoint" });
    if (e) throw new Error(e.message);
    return Response.json({ ok: true });
  } catch (e) {
    return error(e);
  }
}
