# KiranIA OS — Enterprise AI Operating System & Multi-Model Platform

KiranIA OS es una plataforma de Inteligencia Artificial de nivel empresarial y diseño de vanguardia construida sobre Node.js, Express, Vite, React 19, TypeScript, Tailwind CSS y **LiteLLM Universal Proxy Gateway**.

---

## 🌟 Características Principales

### 1. Enrutador Universal LiteLLM & Resiliencia Multi-Proveedor
- **Arquitectura de Routing Central**: Todo el tráfico de inferencia pasa por un gateway server-side centralizado (`LiteLLM`), evitando la exposición de claves privadas al cliente.
- **Auto-Failover Inteligente**: Si un proveedor devuelve error de cuota `429` o saturación `503`, el sistema redirige automáticamente al siguiente proveedor disponible sin interrumpir la sesión del usuario.
- **Fallback Nativo a Google GenAI**: Si el proxy de LiteLLM está apagado o en mantenimiento, el servidor conmuta transparentemente al SDK oficial `@google/genai` con `GEMINI_API_KEY`.

### 2. Model Discovery Engine
- Detección y sincronización automática de modelos a través del endpoint `GET /api/models` y `POST /api/models/discover`.
- Consulta dinámica a LiteLLM y proveedores configurados (Google Gemini, OpenAI, Anthropic, DeepSeek, Groq, Mistral, xAI, OpenRouter, Cohere, NVIDIA NIM).
- Detección de capacidades reales: Visión & OCR, Razonamiento Profundo, Especialista en Código, Function Calling, Salida JSON Estructurada y Búsqueda Web.

### 3. Model Arena (Comparativa Concurrente)
- Envío simultáneo de un mismo prompt a 2 o 3 modelos en paralelo.
- Telemetría de rendimiento lado a lado: latencia en milisegundos, conteo de tokens generados, estimación de costes ($) y evaluación de calidad.

### 4. Chat & Asistente Avanzado
- Streaming fluido mediante Server-Sent Events (SSE).
- Formateo de código con bloques ejecutables y copiado en 1 clic.
- Detección de archivos generados con `<<<FILE: ruta>>>` e inyección instantánea en el workspace.
- Reconocimiento de voz (Speech-to-Text) y síntesis de voz (Text-to-Speech) integrada.
- Google Web Search Grounding con citas verificadas.

### 5. Control de Cuotas & Smart Paywall
- **Planes Freemium**:
  - **FREE**: 25 mensajes diarios, 100k tokens, modelos Flash, sandbox de navegador y descarga ZIP.
  - **PRO ($20/mes)**: 500 mensajes diarios, 3M tokens, Model Arena, modelos de razonamiento (GPT-4o, Claude 3.5 Sonnet, Gemini 3.1 Pro), prioridad de inferencia.
  - **ENTERPRISE ($59/mes)**: Mensajes ilimitados, DeepSeek R1, BYOK (claves propias), soporte 24/7.
- **Avisos inteligentes de límite**: Avisos al 80% de consumo sin desconexiones bruscas.

### 6. Facturación y Preparación para Stripe
- Arquitectura lista para suscripciones recurrentes con Stripe (`/api/billing/plans`, `/api/billing/checkout`).
- Cero almacenamiento de tarjetas en los servidores de la aplicación.

### 7. Panel de Administración & Telemetría Root
- Métricas globales de uso: Peticiones totales, volumen de tokens, coste estimado acumulado, tasa de éxito (99.8%) y latencia media.
- Matriz de salud de proveedores en tiempo real con ping y uptime.
- Feature flags configurables y emisor de anuncios para toda la plataforma.

### 8. Biblioteca de Prompts & IDE con Sandbox en Vivo
- Más de 20 plantillas de prompts clasificadas (Arquitectura, Seguridad OWASP, Código, Diagnóstico SOLVE, Producto).
- Editor de código multi-archivo con árbol de exploración, guardado automático y sandbox interactivo en iframe.
- Exportación del proyecto activo en un paquete **ZIP real** con un solo clic.

### 9. Paleta de Comandos (`Ctrl+K` / `Cmd+K`)
- Búsqueda global instantánea para cambiar de vista, activar modelos de IA o ejecutar acciones rápidas.

---

## 🚀 Puesta en Marcha Local

### Prerrequisitos
- Node.js versión 20.12+ o Node 22 (recomendado).
- Clave de API de Gemini (`GEMINI_API_KEY`) y opcionalmente claves de OpenAI, Anthropic, Groq, etc.

### Instalación
```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd <carpeta-del-proyecto>

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Añade tu GEMINI_API_KEY u otras claves de proveedores en .env

# 4. Iniciar en desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000`.

---

## 🐳 Despliegue con Docker y Docker Compose

### Levantar con Docker Compose (Node.js + LiteLLM Daemon)
```bash
docker compose up --build
```
- App Frontend/Backend: `http://localhost:3000`
- LiteLLM Universal Proxy: `http://localhost:4000`

### Producción (Cloud Run / Contenedor Standalone)
```bash
npm run build
npm start
```
El script `"start": "node server.ts"` inicia inmediatamente Express en el puerto 3000 y sirve los assets compilados de `dist/`.

---

## 🛡️ Seguridad y Buenas Prácticas
1. **Nunca exponer API Keys al navegador**: Todas las peticiones a modelos de lenguaje se canalizan por los endpoints `/api/chat`, `/api/generate-project` y `/api/chat/compare`.
2. **Sanitización de Datos**: El sandbox del navegador se ejecuta en un iframe aislado con atributos `sandbox="allow-scripts allow-modals"`.
3. **Control de Presupuesto**: Cada solicitud calcula y registra los tokens consumidos para evitar abusos o denegación de servicio económica.
