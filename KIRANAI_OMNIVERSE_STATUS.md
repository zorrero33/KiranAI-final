# KiranAI Omniverse — Estado real

Rama: `openhands/kiranai-complete-upgrade` · Base: `main`
Última actualización: fase final de seguridad, publicación y validación.

## 1. Estado de la rama y publicación

- Rama local `openhands/kiranai-complete-upgrade`, árbol de trabajo limpio.
- **9 commits** por delante de `main`.
- **Publicación bloqueada:** el token disponible es de solo lectura de contenidos.
  `git push` y la API de creación de PR devuelven **403** (`Permission to
  zorrero33/KiranAI-final.git denied`). No se ha eludido el permiso, no se ha
  reescrito el historial ni se ha hecho push forzado.
- Commit a publicar: la punta de la rama `openhands/kiranai-complete-upgrade`
  (el propietario puede obtener el hash con `git rev-parse HEAD`).

## 2. Cambios de esta fase

| Archivo | Cambio |
|---|---|
| `src/server/db/firestore.ts` | Persistencia servidor reescrita sobre **firebase-admin**. |
| `server.ts` | `/api/status` informa `persistence.mode`; `/api/models/discover` limpia la caché. |
| `src/server/litellmManager.ts` | Distingue cuota agotada de clave rechazada en logs y motivos de failover. |
| `.env.example` | Documenta `FIREBASE_SERVICE_ACCOUNT_JSON` / `GOOGLE_APPLICATION_CREDENTIALS`. |
| `.gitignore` | Ignora `.agent_tmp/`. |
| `tests/production.test.mjs` | Suites 7–10 (autorización, persistencia, Stripe, independencia de proveedores). |
| `package.json` | Añade `firebase-admin@^14.5.0`. |

## 3. Seguridad de datos privilegiados (resuelto)

**Problema encontrado:** el backend escribía usuarios, créditos, suscripciones y
transacciones con el **SDK cliente** de Firebase y la clave web pública. Las reglas de
Firestore rechazan esas escrituras, así que cada sincronización fallaba de forma
silenciosa y el estado privilegiado solo vivía en `data/`. Un despliegue sin disco
persistente habría perdido los saldos de créditos y las suscripciones.

**Corrección:** `src/server/db/firestore.ts` usa ahora exclusivamente **firebase-admin**,
autenticado con cuenta de servicio. Es la vía legítima por la que un backend puede
saltar las reglas, sin abrir las reglas al público. El SDK se carga de forma diferida:
si no hay credenciales, la app arranca igual y `/api/status` lo declara como `local`.

Autorización verificada en el servidor (con token de sesión real):

| Intento | Resultado |
|---|---|
| Usuario concede créditos a sí mismo | **403** |
| Sin sesión concede créditos | **401** |
| Usuario cambia su propio plan (`/api/admin/users/:id/plan`) | **403** |
| Usuario lee `/api/admin/users` o `/api/admin/metrics` | **403** |
| `?userId=otro` estando autenticado | Se ignora; devuelve el usuario del token |
| Registro de un usuario normal | `role: "user"`, sin `passwordHash` en la respuesta |

Las reglas de Firestore **no** se han relajado. `firestore.rules` sigue denegando toda
escritura de cliente a `credits`, `subscriptions` y `creditTransactions` (`allow write:
if isAdmin()`) y bloquea cambios de `plan`/`role`/`subscriptionStatus` en `users`.

Nota de arquitectura: el frontend **no** habla con Firestore directamente (se verificó
que no hay llamadas `firebase/firestore` en el código de cliente). Toda la persistencia
pasa por el backend, que ahora escribe con privilegios de servidor vía Admin SDK. La
identidad de la app se basa en token de sesión propio del backend, y el `userId` siempre
se deriva de ese token, nunca del cuerpo de la petición.


## 3.b Autenticación — bypass crítico encontrado y corregido

**Hallazgo (crítico).** Dos fallos combinados permitían tomar la cuenta de
administrador sin credenciales:

1. `loginWithPassword` solo comparaba el hash **si había contraseña**
   (`if (user.passwordHash && password)`). Enviar solo el correo **sin** contraseña
   emitía un token válido.
2. `register`/`login` otorgaban `role: admin` a un correo **codificado en el código**
   (`muhammaddris.dd@gmail.com`), y el arranque creaba esa cuenta con la contraseña por
   defecto `admin123` (`hashPassword('admin123')`).

**Prueba real antes de corregir:** `POST /api/auth/login {"email":"muhammaddris.dd@gmail.com"}`
(sin campo `password`) respondía **200 con un token de rol admin**.

**Correcciones:**
- `loginWithPassword` exige que la cuenta tenga hash y que la contraseña coincida. Una
  cuenta creada con Google (sin hash) **no** puede entrar por esta vía.
- `register` exige contraseña (≥6 caracteres) y **nunca** otorga admin por el correo.
- Admin se concede **solo** a los correos listados en `ADMIN_EMAILS` (nueva variable).
  Se eliminó el correo codificado y la contraseña por defecto: ya no se crea ninguna
  cuenta admin con contraseña conocida.
- Los datos de ejecución `data/` (usuarios, hashes, saldos, transacciones) **se dejaron
  de rastrear** y se añadieron a `.gitignore`. Estaban versionados en un repositorio
  público; entre ellos, el hash de `admin123`. Están en el historial de Git, así que se
  debe **considerar esa credencial comprometida y rotarla**.

**Verificado después de corregir:**

| Prueba | Antes | Ahora |
|---|---|---|
| `login` solo con correo admin (sin contraseña) | 200 + token admin | **401, sin token** |
| `login` admin con `admin123` | 200 | **401** |
| `register` sin contraseña | creaba cuenta | **400** |
| `register` + `login` normales | OK | **OK, `role: user`** |
| `ADMIN_EMAILS="x"` en arranque | — | **promociona a admin** |

Nota: no se ha desplegado ninguna versión pública nueva en esta fase, así que el bypass
no llegó a producción desde aquí, pero **el código antiguo sí está en `main`** y debe
tratarse como vulnerable hasta que esta rama se integre.

## 4. Claves expuestas (investigación, sin valores)

- Se rastreó **todo** el historial de Git buscando formas de clave real
  (`sk-proj-`, `sk-ant-`, `sk-or-v1-`, `nvapi-`, `xai-`, `AIza`, `r8_` con ≥20 caracteres).
  **No aparece ninguna clave de proveedor real** en ningún archivo, en ningún commit.
- `/api/providers/audit` expone solo el **nombre** de la variable, un booleano y la URL
  de documentación. Nunca el valor.
- `/tmp` de logs del servidor: sin material de clave.
- Único hallazgo: en el chat de trabajo se compartieron valores de claves. **Se deben
  rotar** (yo no puedo hacerlo ni verificarlo):
  - Google AI Studio → `GEMINI_API_KEY`
  - OpenAI → `OPENAI_API_KEY`
  - Groq → `GROQ_API_KEY` (ya rechazada, 401)
  - OpenRouter → `OPENROUTER_API_KEY`
  - Mistral → `MISTRAL_API_KEY`
  - xAI → `XAI_API_KEY`
  - NVIDIA → `NVIDIA_NIM_API_KEY`
  - Stripe (modo test) → `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - LiteLLM → `LITELLM_MASTER_KEY`
- Verificación tras rotar: la clave nueva debe devolver 200 en una llamada real y la
  antigua debe fallar; hasta comprobarlo no se considera ninguna rotación hecha.

## 5. Proveedores y modelos (probados de verdad)

| Proveedor | Configurado | Autenticado | Prueba real | Estado |
|---|---|---|---|---|
| Google Gemini | Sí | Sí | chat streaming | **Operativo** |
| Mistral | Sí | Sí | chat streaming | **Operativo** |
| OpenRouter | Sí | Sí | chat streaming | **Operativo** |
| NVIDIA NIM | Sí | Sí | chat streaming | **Operativo** |
| OpenAI | Sí | Sí | 429 real | **Sin créditos** (`unavailable`) |
| xAI | Sí | Sí | /v1/models | **Sin créditos** (`unavailable`) |
| Groq | Sí | No | 401 real | **Clave rechazada** (`unavailable`) |
| Hugging Face | Sí | Sí | whoami | Cuenta válida |
| Anthropic / DeepSeek / Cohere | No | — | — | Sin clave (`key_required`) |

Comportamiento por código de error (verificado en código y con Groq/OpenAI reales):
- **401/403 / invalid_api_key** → interruptor de circuito 10 min + failover a Gemini.
- **429 / quota** → interruptor de circuito 10 min + failover.
- **Timeout / 5xx** → failover puntual, **sin** abrir el circuito (no se castiga un fallo
  transitorio).
- Un fallo de un proveedor **no** desactiva los demás: verificado en vivo (Groq
  `unavailable` y el resto `active`).
- Los mensajes de error no incluyen claves ni cabeceras de autorización.

## 6. Stripe (modo test)

- El webhook verifica la firma con `constructEvent` **antes** del control de
  idempotencia (`recordAndCheckWebhookEvent`).
- Un payload forjado sin firma o con firma inválida es rechazado (400).
- Una suscripción **no** se activa por una respuesta del navegador: solo por un webhook
  firmado de Stripe.
- Sin configurar, el checkout responde **503 honesto**, nunca simula una suscripción.
- No se ha cambiado a modo real ni se han hecho cobros reales.
- Limitación: no hay verificación end-to-end con un evento real de Stripe CLI en este
  entorno (requiere `stripe listen` y el secreto de firma reales).

## 7. Validación visual móvil (Chromium real)

Ejecutado con Chromium headless sobre la app servida. Anchos probados realmente:
**320, 360, 390, 412, 430 y 1280 px**.

| Ancho | Desbordamiento horizontal | Campo de entrada | Botón |
|---|---|---|---|
| 320 | 0 px | visible (262 px, y=641) | visible |
| 360 | 0 px | visible | visible |
| 390 | 0 px | visible | visible |
| 412 | 0 px | visible | visible |
| 430 | 0 px | visible | visible |
| 1280 | 0 px | visible | visible |

- **Sin scroll horizontal** en ningún ancho (`docOverflow`/`bodyOverflow` = 0).
- El único error de consola es un **401 en `/api/auth/me`** para un visitante anónimo,
  que es el comportamiento esperado (no hay sesión), no un fallo.
- El diseño galáctico se conserva (captura headless verificada).

## 8. Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | **OK** |
| `npm run build` | **OK** (index ~487 kB / gzip ~124 kB) |
| `npm test` | **48/48 pasan** |

Suites: 1–4 (plataforma/health), 5 (auth y control de acceso), 6 (honestidad del
catálogo), 7 (autorización de datos privilegiados), 8 (modo de persistencia), 9
(seguridad de webhooks Stripe), 10 (independencia de proveedores y refresco de caché).

Pruebas funcionales reales: chat streaming extremo a extremo (Gemini, Mistral,
OpenRouter, NVIDIA); `/api/models/discover` (~39 modelos); failover real 401 (Groq) y
429 (OpenAI); `POST /api/billing/checkout` (sesión real o 503 honesto).

No ejecutadas: pruebas del proyecto Android nativo (`./gradlew`, Capacitor). La app se
empaqueta con Capacitor; construir el APK requiere el SDK de Android, no instalado aquí.

**Fase actual (endurecimiento de autenticación):** 54/54 pruebas en verde
(`npm test`), incluida la nueva suite 11 (sin admin por defecto, sin bypass por
contraseña ausente, `data/` no rastreado).

## 9. Configuración pendiente (nombres, nunca valores)

**Local (`.env`, gitignored):**
`LITELLM_URL`, `LITELLM_MASTER_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`,
`MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_NIM_API_KEY`, `COHERE_API_KEY`,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_*`,
`GOOGLE_OAUTH_CLIENT_ID`, `ALLOWED_ORIGINS`, **`ADMIN_EMAILS`**, `PORT`.

**Preview (Vercel/CI):** las de backend en el servicio que sirve la API, más
`VITE_API_BASE_URL`, `VITE_GOOGLE_OAUTH_CLIENT_ID`.

**Producción (imprescindible para persistir):**
`FIREBASE_SERVICE_ACCOUNT_JSON` **o** `GOOGLE_APPLICATION_CREDENTIALS` (cuenta de
servicio con rol *Cloud Datastore User*). Sin esto, `persistence.mode = "local"` y los
créditos/suscripciones no sobreviven a un reinicio del contenedor.

## 10. Riesgos que impiden publicar / completar

1. **Sin permiso de escritura en GitHub** → la rama y el PR no se pueden publicar (403).
2. **Contraseña de administrador `admin123` comprometida** (estaba en el historial de
   Git, sección 3.b). Ya no existe en el código ni en los datos; **rotar** cualquier
   credencial que hubiera usado y fijar `ADMIN_EMAILS` con el correo real.
3. **Sin cuenta de servicio de Firebase** en el despliegue → no hay persistencia real;
   es configurable sin cambiar código.
4. **Claves por rotar** (sección 4) — el propietario debe rotarlas y verificar las nuevas.
5. **Reglas de Firestore**: no se han podido desplegar ni verificar contra el proyecto
   real desde este entorno (`firebase deploy` requiere credenciales del proyecto).

## 11. Fase final (publicación / despliegue) — 2026-10-09

### Estado real del repositorio
- Ruta local: `/workspace/kiranai` (única copia real; `/workspace/project` está vacío).
- Rama: `openhands/kiranai-complete-upgrade`. Árbol de trabajo limpio.
- **Más de 15 commits por delante de `main`** (el SHA exacto está en la rama;
  cada commit de documentación incrementa el contador).
- Referencia de seguridad creada: `backup/pre-omniverse-publish` (mismo commit).

### Publicación en GitHub — BLOQUEADA (403)
Diagnóstico exacto de la API de GitHub:
`POST /repos/zorrero33/KiranAI-final/git/refs` → **403 "Resource not accessible by
integration"**. `git push` → **403 Permission denied**. La credencial disponible
es un token de GitHub App (`ghu_`) **sin `contents: write` ni
`pull_requests: write`**; no es posible otorgarse permisos a uno mismo.
`origin/main` sigue en `dce5e99` sin cambios, así que no hubo divergencia ni
riesgo de sobrescritura. **No se hizo force-push ni se reescribió historia.**

### Correcciones reales de esta fase (verificadas)
- **`/api/status.online` mentía**: devolvía `isHealthy || hasGeminiKey`, es decir,
  el gateway aparecía *online* solo porque existía una clave de Gemini. Ahora
  `online`/`proxyReachable` reflejan únicamente la sonda HTTP real (con el proxy
  caído: `false`). Prueba de regresión añadida.
- **`dotenv.config({ override: true })`**: un `PORT` antiguo en `.env` pisaba el
  `PORT` inyectado por la plataforma (Cloud Run / Firebase Hosting), dejando el
  servicio inalcanzable. Ahora no se sobrescribe el entorno.
- **`docker-compose.yml` referenciaba un `Dockerfile` inexistente** → `docker
  compose up --build` fallaba. Añadido `Dockerfile` multi-etapa + `.dockerignore`.
- **`firebase.json` no tenía bloque `firestore`** → `firebase deploy` nunca
  publicaba `firestore.rules`. Añadido; eliminada la colección pública
  `test/connection` y `aiRequests` pasa a escritura solo-admin.
- **Clave maestra LiteLLM débil por defecto** (`sk-litellm-master-secret-key`,
  pública en el repo). Ahora se genera una clave fuerte en tiempo de ejecución;
  `docker-compose` la exige y deja de publicar el puerto administrativo 4000.
- **Accesibilidad**: se eliminó `user-scalable=no`/`maximum-scale=1.0` (permitía
  impedir el zoom); `lang="es"`.

### Pruebas reales ejecutadas
- `npx tsc --noEmit` → limpio.
- `npm run build` (Vite) → OK.
- `npm test` → **59/59**.
- `POST /api/chat` con `gemini-main` → **streaming real** ("PONG"), vía Google
  GenAI directo (proxy LiteLLM no desplegado en este entorno).
- Proveedor no configurado (`claude-main`) y modelo desconocido → **fallback
  honesto** a Gemini con evento `fallback_switch`, sin respuesta inventada.
- Activos: `index.html`, `/assets/*`, favicons, `manifest.webmanifest` → **200**.
  El logo se sirve en `/kiran-logo.png` con reserva SVG.

### Limitaciones declaradas explícitamente
- **No desplegado**: no se ha ejecutado ningún `firebase deploy`/`gcloud run
  deploy` ni se ha obtenido URL de producción. Cualquier URL de vista previa no
  ha sido verificada desde aquí.
- **Navegador automatizado no funcional** en este entorno (no abandona
  `localhost:3000`): no se pudo validar visualmente en
  320/360/390/412/430/1280 px; la revisión de responsive fue a nivel de código
  (sin anchos fijos problemáticos, `overflow-x: hidden`, `prefers-reduced-motion`,
  `safe-area-inset`). Los botones de icono del `Header` usan `title` en lugar de
  `aria-label`; requiere una revisión visual antes de refactorizar.
- **Reglas de Firestore**: modificadas pero no desplegadas ni verificadas contra
  el proyecto real.
- **Firebase Admin**: no configurado aquí → `persistence.mode = "local"`.
- **Stripe**: con clave de **test** verificado: el checkout crea una sesión real
  (`https://checkout.stripe.com/c/pay/cs_test_...`) y el webhook rechaza con 400
  peticiones sin firma o con firma falsa. No se ha probado el ciclo de pago real
  de Stripe (no se completó ningún pago).

### Acciones manuales para desbloquear
1. **Publicar la rama** (propietario o token con permisos): bien ejecutar
   `git push -u origin openhands/kiranai-complete-upgrade` desde una máquina con
   un token que tenga `contents: write`, bien otorgar esos permisos al GitHub App
   asociado. Después abrir PR hacia `main` (no fusionar sin revisión).
2. `ADMIN_EMAILS` = correo real del administrador.
3. Credenciales de Firebase Admin (cuenta de servicio) para persistencia real.
4. `LITELLM_MASTER_KEY` fuerte y compartido con el proxy; desplegar LiteLLM.
5. `firebase deploy --only firestore:rules` para aplicar las reglas.
6. Rotar toda credencial que hubiera estado en `data/users.json` (historial).
7. Desplegar (autorización explícita requerida) y verificar la URL resultante.

## 12. Verificación en contenedor y proveedores — 2026-10-09

### Docker (verificado de verdad)
- `sudo dockerd` arranca en este entorno (había sudo con contraseña, ahora
  disponible). `docker build -t kirania:test .` **construye correctamente**.
- El contenedor arranca, sirve la SPA (200) y su `HEALTHCHECK` pasa a
  **healthy**. `docker logs` no expone secretos (solo avisos "no configurado").
- Sin claves, `/api/chat` responde con un error honesto
  ("Ningún proveedor configurado respondió"), sin respuestas inventadas.
- Con volumen nombrado, un usuario registrado **sobrevive a `docker restart`**.
- `docker compose config` valida (tras corregir un `ports:` vacío que lo
  invalidaba).

### Proveedores (validados contra las APIs reales, sin coste de generación)
| Proveedor | Estado real verificado |
|---|---|
| Google Gemini | **Operativo** (streaming real "PONG"; ids 3.5-flash / flash-lite / 3.1-pro-preview existen en la API) |
| Mistral | **Operativo** con `ministral-8b-latest` (respuesta real). `mistral-large-latest` **no existe** en la cuenta → corregido |
| OpenAI | Clave válida, `gpt-4o`/`gpt-4o-mini` existen, **sin créditos** (429) → failover honesto a Gemini |
| xAI Grok | Clave válida, **sin créditos** (403) |
| Groq | **403** en listado y chat (clave rechazada/sin permiso) |
| OpenRouter | Catálogo accesible; los slugs `:free` probados devuelven 404 → solo variantes de pago |
| NVIDIA NIM | Responde (cold start lento) con `meta/llama-3.2-90b-vision-instruct` |
| Anthropic / DeepSeek / Cohere | **No configurados** (sin clave) |
| Hugging Face | Clave presente, no probado con generación |

**Bug corregido:** las llamadas nativas a proveedores no tenían timeout, así que
NVIDIA (que tarda en el primer byte) bloqueaba la petición sin failover. Ahora
están acotadas a 45 s (solo el primer byte; los streams largos se mantienen).

### Stripe (clave de test)
- El checkout crea una sesión **real** en `checkout.stripe.com` (modo test).
- El webhook **rechaza** (400) peticiones sin firma o con firma falsa y es
  **idempotente** (`recordAndCheckWebhookEvent`). No se completó ningún pago.

### Seguridad (probado en el contenedor)
- Login admin sin contraseña → **401**; con contraseña por defecto → **401**.
- Registro intentando `role=admin`/`credits` → ignorado (sin privilegios).
- Token inválido / manipulado → **401**; escritura de perfil sin sesión → **401**.
- Las respuestas de error **no** filtran hashes, tokens ni claves.

No se declara KiranAI terminado ni desplegado mientras existan estos bloqueos.

---

## Fase final — recuperación, endurecimiento y producción (sesión actual)

### Recuperación (verificada)
- Bundle de recuperación completo en `/workspace/kiranai-complete-upgrade.bundle`
  (rama de trabajo + `backup/pre-omniverse-publish` + `main`). `git bundle verify`
  = OK y **restauración probada** en un directorio temporal: el clon reproduce el
  HEAD exacto `185c567` con 149 archivos versionados.

### Cambios de seguridad aplicados (con pruebas)
1. **Hash de contraseñas**: antes `sha256('kiran_salt_'+contraseña)` — misma sal
   fija para todas las cuentas. Ahora **scrypt con sal aleatoria por usuario**
   (`scrypt$<sal>$<hash>`) y comparación en tiempo constante. Las cuentas antiguas
   siguen funcionando y se migran de forma transparente al iniciar sesión
   (verificado manualmente: login 200 → hash pasa a `scrypt$`). `passwordSalt`
   nunca se devuelve por la API.
2. **Cabeceras de endurecimiento**: `X-Content-Type-Options`, `X-Frame-Options`,
   `Referrer-Policy`, `Permissions-Policy`, `X-DNS-Prefetch-Control`.
3. **`trust proxy`** activable solo con `TRUST_PROXY=true` (rate limit por IP real
   detrás de balanceador, sin permitir spoofing de `X-Forwarded-For`).
4. **Rate limiting** añadido a `/api/generate-project` (10/min),
   `/api/analyze-file` (20/min) y `/api/chat/compare` (15/min), que no lo tenían.
5. **Accesibilidad**: `aria-label` en los botones de solo icono de la cabecera,
   `aria-pressed`/`aria-expanded` en los toggles y `aria-current="page"` en la
   pestaña activa.

### Verificación final
- `npx tsc --noEmit` = OK; `npm run build` = OK; **70/70 tests** en verde.
- Imagen Docker reconstruida con los cambios; contenedor en estado **healthy**;
  cabeceras nuevas presentes; sin secretos en los logs.
- Logo y recursos PWA servidos con 200 (`kiran-logo.png`, iconos 192/512,
  `favicon.svg`, `manifest.webmanifest`, `sw.js`).
- Assets de marca verificados en `public/` (el logo oficial ya está integrado).

### Bloqueos pendientes (honestos)
- **Publicación en GitHub**: el token disponible es de GitHub App (`ghu_`) y la
  instalación **no tiene `contents:write`**, así que `git push` y la API de refs
  devuelven 403 ("Resource not accessible by integration"). No es resoluble desde
  el entorno; se requiere autorizar el permiso *Contents: Read and write* en la
  App o proveer un token con scope `repo`.
- **Despliegue** (`firebase deploy --only firestore:rules`, `gcloud run deploy`):
  no ejecutado; requiere autorización explícita del usuario.
- **Rotación de credenciales** que quedaron en el historial de `data/users.json`.
- **Revisión visual/responsive** con navegador real: la herramienta de navegador
  no funciona en este entorno; queda pendiente de inspección visual manual.

### Nota sobre `firebase-applet-config.json`
El archivo contiene una **API key web pública de Firebase** (identificador de
cliente, no un secreto protegido) y solo se lee para `projectId` y
`firestoreDatabaseId`. El servidor **nunca** la usa: la persistencia privilegiada
usa `firebase-admin` con `FIREBASE_SERVICE_ACCOUNT_JSON` /
`GOOGLE_APPLICATION_CREDENTIALS`. Las claves de proveedores de IA y de Stripe sí
son secretas y nunca se escriben en el repositorio (`.env` no versionado).
