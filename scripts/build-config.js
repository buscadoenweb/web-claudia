const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

// Función para leer variables de entorno desde archivo .env
function getEnvVar(name) {
  // Primero intentar leer de process.env (Vercel/Netlify)
  if (process.env[name]) {
    return process.env[name];
  }
  
  // Si no está en process.env, leer del archivo .env local
  const envPath = path.join(root, ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const lines = envContent.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key === name) {
          return valueParts.join("=").trim();
        }
      }
    }
  }
  
  return undefined;
}

// Obtener variables de entorno de Vercel (process.env) o archivo .env local
const SUPABASE_URL = getEnvVar("SUPABASE_URL");
const SUPABASE_ANON_KEY = getEnvVar("SUPABASE_ANON_KEY");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Faltan SUPABASE_URL y/o SUPABASE_ANON_KEY.\n" +
      "  En Vercel: Configura variables de entorno en Site Settings → Environment Variables.\n" +
      "  En local: Crea un archivo .env con SUPABASE_URL y SUPABASE_ANON_KEY."
  );
  process.exit(1);
}

const out =
  "// Generado por scripts/build-config.js — no editar a mano\n" +
  "window.SUPABASE_CONFIG = {\n" +
  `  url: ${JSON.stringify(SUPABASE_URL)},\n` +
  `  anonKey: ${JSON.stringify(SUPABASE_ANON_KEY)}\n` +
  "};\n";

fs.writeFileSync(path.join(root, "config.js"), out, "utf8");
console.log("config.js generado correctamente.");