import { iconoCorazon } from "@/lib/icono";

const TAMANOS = [96, 192, 512];

export async function GET(_req: Request, ctx: RouteContext<"/icons/[size]">) {
  const { size } = await ctx.params;
  const tam = Number(size);
  if (!TAMANOS.includes(tam)) return new Response("No encontrado", { status: 404 });
  return iconoCorazon(tam);
}
