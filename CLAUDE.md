# Guía del proyecto — web-claudia

Documento para agentes y desarrolladores: qué es este repo, cómo está armado y qué falta configurar fuera del código.

## Qué es

Sitio web estático (**un solo `index.html`**) para clientes que pagaron acceso a un **generador de documentos/PDF** (contratos comerciales o alquiler). El flujo es:

1. **Registro** → Supabase Auth crea usuario con `user_metadata.estado = "pendiente"`.
2. **Pantalla de espera** hasta que un administrador cambia el estado a **`aprobado`** en el panel de Supabase.
3. **Login** → si `estado === "aprobado"`, acceso al formulario y vista previa del texto.
4. **Descargar PDF** → hoy usa `window.print()` (impresión del navegador).

No hay framework (React/Vue). Auth contra Supabase vía `fetch` a la API REST de Auth (sin SDK externo en el HTML).

## URLs y repos

| Recurso | Valor |
|--------|--------|
| Producción (Netlify) | https://effulgent-alfajores-5d2f1b.netlify.app/ |
| GitHub | https://github.com/buscadoenweb/web-claudia.git |
| Supabase (proyecto) | `https://ojcabywacdwismsyvgpl.supabase.co` (referencia; la URL real va en `.env`) |

Rama principal: **`main`**.

## Estructura de archivos

```
web-claudia/
├── index.html          # UI + lógica de pantallas y llamadas a Supabase
├── config.js           # GENERADO — credenciales para el navegador (no commitear)
├── .env                # LOCAL — credenciales para generar config.js (no commitear)
├── .env.example        # Plantilla sin secretos (sí commitear)
├── scripts/
│   └── build-config.js # Lee .env o variables de Netlify → escribe config.js
├── netlify.toml        # Build: npm run build; publish: .
├── package.json        # Script "build" únicamente
├── .gitignore
└── CLAUDE.md           # Este archivo
```

## Credenciales (importante)

### Qué va dónde

- **`.env`** (solo en tu PC): `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
- **`config.js`**: lo genera `npm run build`; el HTML lo carga con `<script src="config.js">`.
- **Netlify → Environment variables**: mismas dos claves para el deploy en la nube (sin subir `.env` a Git).

### Qué NUNCA commitear

- `.env`
- `config.js`
- Cualquier **service_role** key de Supabase (solo backend/admin; este proyecto no la usa en el front).

### Qué SÍ puede ir en GitHub

- `.env.example` (placeholders)
- `index.html` **sin** claves hardcodeadas
- Scripts de build y `netlify.toml`

La **anon key** es pública por diseño en apps frontend; la seguridad real está en **RLS**, políticas de Auth y el flujo manual de aprobación (`estado` en metadata).

### Historial de Git

En commits antiguos la anon key pudo estar dentro de `index.html`. Si el repo es público, valorar rotar la anon key en Supabase y actualizar `.env` / Netlify. No repetir claves en este markdown.

## Desarrollo local

**Requisito:** [Node.js](https://nodejs.org/) instalado (para `npm run build`). Netlify ya incluye Node en el deploy; en tu PC hace falta si querés regenerar `config.js` después de cambiar `.env`.

1. Copiar plantilla (si no existe `.env`):
   ```powershell
   cd C:\Users\Usuario\Desktop\web-claudia
   copy .env.example .env
   ```
2. Editar `.env` con URL y anon key del dashboard de Supabase.
3. Generar `config.js`:
   ```powershell
   npm run build
   ```
4. Abrir `index.html` en el navegador (o servir la carpeta con Live Server).

Si falta `config.js`, registro/login fallarán; la consola muestra el aviso de ejecutar `npm run build`.

**Git en Windows:** si `git` no se reconoce en Cursor, usar:
`& "C:\Program Files\Git\bin\git.exe" ...`

## Deploy (Netlify)

1. Sitio enlazado al repo `buscadoenweb/web-claudia`, rama `main`.
2. **Build command:** `npm run build` (definido en `netlify.toml`).
3. **Publish directory:** `.` (raíz).
4. **Variables de entorno** en Netlify (Site configuration → Environment variables):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

Cada push a `main` debe disparar un deploy; el build genera `config.js` en el servidor antes de publicar.

## Supabase (Auth y administración)

1. **Authentication → Providers:** Email habilitado según necesidad del proyecto.
2. **Authentication → URL Configuration:** incluir la URL de Netlify en Site URL / Redirect URLs.
3. **Aprobar usuarios:** Authentication → Users → usuario → **User Metadata** → `"estado": "aprobado"` (string). Con `"pendiente"` o sin clave, solo ven la pantalla de verificación.

Registro envía en signup: `data: { estado: "pendiente" }`.

Login usa `grant_type=password` y luego `evaluarSesion()` lee `user.user_metadata.estado`.

## Pantallas en `index.html`

| ID DOM | Rol |
|--------|-----|
| `pantalla-registro` | Alta de cuenta |
| `pantalla-login` | Login |
| `pantalla-pendiente` | Cuenta no aprobada |
| `pantalla-privada` | Formulario + preview + imprimir PDF |

## Limitaciones conocidas (mejoras futuras)

- `cerrarSesion()` solo vuelve a la pantalla de login; no invalida token en Supabase.
- No hay persistencia de sesión al recargar la página (no se lee sesión guardada al cargar).
- PDF = impresión del navegador, no generación de archivo binario.

## Comandos habituales

```powershell
npm run build
git status
git add .
git commit -m "Descripción del cambio"
git push origin main
```

---

# Paso a paso — lo que falta o conviene verificar (checklist)

Marcá mentalmente cada ítem cuando esté hecho.

## A. Repositorio y código

- [ ] Últimos cambios (sin claves en `index.html`, `.env.example`, `CLAUDE.md`) commiteados y pusheados a `main`.
- [ ] Confirmar en GitHub que **no** aparecen `.env` ni `config.js` en el repo.

## B. Netlify ↔ GitHub

- [ ] En Netlify, el sitio **no** depende solo de “arrastrar carpeta”; está **conectado al repo** GitHub.
- [ ] Rama de deploy: `main`.
- [ ] Variables `SUPABASE_URL` y `SUPABASE_ANON_KEY` creadas en Netlify (mismos valores que en tu `.env` local).
- [ ] Último deploy en **verde**; en el log de build aparece “config.js generado correctamente”.
- [ ] Probar la URL de producción: registro → login (usuario aprobado) → formulario.

## C. Supabase

- [ ] URL de Netlify en configuración de Auth (redirects / site URL).
- [ ] Probar registro desde producción (no solo `file://` local).
- [ ] Flujo admin: cambiar `estado` a `aprobado` y confirmar acceso al generador.

## D. Seguridad y buenas prácticas

- [ ] No guardar **service_role** en `.env` de este proyecto front.
- [ ] Si el repo fue público con claves en el HTML antiguo, considerar rotar anon key en Supabase y actualizar `.env` + Netlify.
- [ ] Revisar en Supabase que no haya tablas expuestas sin RLS si más adelante se agrega base de datos además de Auth.

## E. Trabajo diario en Cursor

1. Editar código.
2. Si cambiás credenciales en `.env` local: `npm run build`.
3. `git add` / `commit` / `push`.
4. Esperar deploy de Netlify y probar en la URL pública.

## F. Nueva máquina o nueva sesión con un agente

1. Clonar repo desde GitHub.
2. `copy .env.example .env` y completar credenciales.
3. `npm run build`.
4. Leer este `CLAUDE.md` antes de tocar Auth o deploy.

---

*Última actualización de arquitectura: credenciales fuera del HTML; build genera `config.js`; Netlify usa variables de entorno en el build.*
