// Revisa que todo esté listo para usar la app: variables, Supabase, fotos y notificaciones.
// Uso: npm run verificar   (lee .env.local; nunca imprime las llaves)

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const TABLAS = ["ajustes", "pensamientos", "suscripciones", "respuestas", "ubicaciones", "pendientes", "fotos", "momentos", "perfiles", "deseos"];

let fallas = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const mal = (m, arreglo) => {
  fallas++;
  console.log(`  ✗ ${m}`);
  if (arreglo) console.log(`    → ${arreglo}`);
};
const aviso = (m) => console.log(`  ! ${m}`);
const titulo = (m) => console.log(`\n${m}`);

const env = process.env;

// ---------- Variables ----------
titulo("Variables en .env.local");

for (const n of ["NEXT_PUBLIC_NOMBRE_A", "NEXT_PUBLIC_NOMBRE_B", "NEXT_PUBLIC_FECHA_INICIO", "NEXT_PUBLIC_ZONA_HORARIA"]) {
  if (env[n]) ok(`${n} = ${env[n]}`);
  else mal(`Falta ${n}`, "Cópiala de .env.example");
}

if (!env.CODIGO_SECRETO) mal("Falta CODIGO_SECRETO", "Pon un código que solo ustedes conozcan");
else if (env.CODIGO_SECRETO.length < 6 || env.CODIGO_SECRETO === "cambia-esto") mal("CODIGO_SECRETO es muy corto o es el de ejemplo");
else ok("CODIGO_SECRETO configurado");

const url = env.SUPABASE_URL?.trim();
const llave = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url) mal("Falta SUPABASE_URL", "Supabase → Project Settings → Data API → Project URL");
else if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\/?$/.test(url)) aviso(`SUPABASE_URL tiene un formato raro: ${url} (debería ser https://xxxx.supabase.co)`);
else ok(`SUPABASE_URL = ${url}`);

// La app necesita la llave SECRETA (service_role o sb_secret_…), no la pública
function tipoDeLlave(k) {
  if (k.startsWith("sb_secret_")) return "secreta";
  if (k.startsWith("sb_publishable_")) return "publica";
  if (k.startsWith("eyJ")) {
    try {
      const datos = JSON.parse(Buffer.from(k.split(".")[1], "base64url").toString());
      return datos.role === "service_role" ? "secreta" : datos.role === "anon" ? "publica" : "desconocida";
    } catch {
      return "desconocida";
    }
  }
  return "desconocida";
}

let llaveOk = false;
if (!llave) mal("Falta SUPABASE_SERVICE_ROLE_KEY", "Supabase → Project Settings → API Keys → Secret key (o la legacy service_role)");
else {
  const tipo = tipoDeLlave(llave);
  if (tipo === "publica") mal("SUPABASE_SERVICE_ROLE_KEY es la llave PÚBLICA (anon / publishable)", "Usa la Secret key (sb_secret_…) o la legacy service_role");
  else if (tipo === "desconocida") aviso("No reconozco el formato de SUPABASE_SERVICE_ROLE_KEY; lo probaré de todos modos");
  else ok("SUPABASE_SERVICE_ROLE_KEY es una llave secreta");
  llaveOk = tipo !== "publica";
}

// ---------- Notificaciones ----------
titulo("Notificaciones (VAPID)");
try {
  webpush.setVapidDetails(env.VAPID_SUBJECT || "mailto:nosotros@example.com", env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "", env.VAPID_PRIVATE_KEY ?? "");
  ok("Llaves VAPID válidas");
  if (!env.VAPID_SUBJECT || env.VAPID_SUBJECT.includes("ejemplo.com") || env.VAPID_SUBJECT.includes("example.com")) {
    aviso("VAPID_SUBJECT sigue con el correo de ejemplo; pon mailto:tu-correo (recomendado, no obligatorio)");
  }
} catch (e) {
  mal(`Llaves VAPID inválidas: ${e.message}`, "Genera nuevas con: npx web-push generate-vapid-keys");
}

// ---------- Supabase ----------
if (url && llave && llaveOk) {
  const db = createClient(url, llave, { auth: { persistSession: false } });

  titulo("Tablas en Supabase");
  let faltantes = 0;
  let conectado = true;
  for (const t of TABLAS) {
    const { error, count } = await db.from(t).select("*", { count: "exact", head: true });
    if (!error) ok(`${t} (${count ?? 0} filas)`);
    else if (/does not exist|schema cache|PGRST205|42P01/i.test(`${error.code} ${error.message}`)) {
      faltantes++;
      mal(`No existe la tabla ${t}`);
    } else if (/Invalid API key|JWT|apikey/i.test(error.message)) {
      mal(`La llave no funciona: ${error.message}`, "Revisa que copiaste la llave completa y que es del mismo proyecto que la URL");
      conectado = false;
      break;
    } else if (/fetch failed|ENOTFOUND|ECONNREFUSED/i.test(error.message)) {
      mal(`No me pude conectar a ${url}`, "Revisa SUPABASE_URL y tu conexión a internet");
      conectado = false;
      break;
    } else mal(`${t}: ${error.message}`);
  }
  if (faltantes) console.log("    → Corre supabase/schema.sql en Supabase → SQL Editor");

  titulo("Carpeta de fotos");
  const { data: bucket, error: eBucket } = conectado ? await db.storage.getBucket("fotos") : { data: null, error: null };
  if (!conectado) aviso("Me la salto hasta que funcione la conexión");
  else if (eBucket || !bucket) mal("No existe la carpeta 'fotos'", "Corre supabase/schema.sql (al final la crea)");
  else {
    if (bucket.public) mal("La carpeta 'fotos' es pública; debería ser privada", "Corre de nuevo supabase/schema.sql");
    else ok("La carpeta 'fotos' existe y es privada");

    // Sube y borra un archivo diminuto para confirmar que se puede escribir
    const ruta = `verificacion/${Date.now()}.png`;
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const { error: eSubir } = await db.storage.from("fotos").upload(ruta, png, { contentType: "image/png" });
    if (eSubir) mal(`No se pudo subir una foto de prueba: ${eSubir.message}`);
    else {
      await db.storage.from("fotos").remove([ruta]);
      ok("Se pueden subir y borrar fotos");
    }
  }
}

// ---------- Resultado ----------
console.log(fallas ? `\n✗ Hay ${fallas} cosa(s) por arreglar.\n` : "\n✓ Todo listo. Corre: npm run dev\n");
process.exit(fallas ? 1 : 0);
