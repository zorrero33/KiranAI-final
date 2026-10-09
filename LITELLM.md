# Guía de Integración y Operación de LiteLLM Gateway

Esta guía documenta la integración de **LiteLLM** como proxy/gateway central de modelos de IA para **KiranIA OS**.

---

## 1. Arquitectura del Flujo de Datos

El flujo de peticiones está completamente aislado para garantizar que ninguna API key de proveedor se exponga en el navegador:

```
[USUARIO / NAVEGADOR]
        │
        ▼ (Petición HTTP / SSE Streaming)
[FRONTEND (React 19 + TypeScript + Vite)]
        │
        ▼ (Llamada interna a /api/chat o /api/generate-project)
[BACKEND (Node.js + Express en server.ts)]
        │
        ▼ (Bearer Token: LITELLM_MASTER_KEY a http://127.0.0.1:4000/v1)
[LITELLM PROXY GATEWAY (Python FastAPI en puerto 4000)]
        │
        ├─► [Google Gemini API (gemini-3.8-flash)]
        ├─► [OpenAI API (gpt-4o, gpt-4o-mini)]
        ├─► [Anthropic Claude API (claude-3-5-sonnet)]
        ├─► [DeepSeek API (deepseek-chat)]
        ├─► [OpenRouter Gateway (multi-provider)]
        ├─► [Groq API (llama-3.3-70b-versatile)]
        └─► [Mistral AI (mistral-large-latest)]
        │
        ▼ (Streaming SSE / Chunks de texto progresivos)
[BACKEND EXPRESS]
        │
        ▼ (SSE formateado al cliente web)
[USUARIO / NAVEGADOR (Visualización token por token en tiempo real)]
```

---

## 2. Instalación

### Entorno Local / Servidor Linux (Python venv):
LiteLLM ya está instalado en el entorno virtual dedicado `/opt/litellm-venv`.

Para instalarlo desde cero en cualquier máquina:
```bash
# 1. Crear entorno virtual de Python
python3 -m venv /opt/litellm-venv

# 2. Actualizar pip
/opt/litellm-venv/bin/pip install --upgrade pip

# 3. Instalar LiteLLM con soporte de Proxy
/opt/litellm-venv/bin/pip install "litellm[proxy]"

# 4. Verificar versión
/opt/litellm-venv/bin/litellm --version
```

---

## 3. Comandos de Arranque

### Opción A: Arranque Automatizado Integrado (Recomendado)
El backend en `server.ts` incluye un **supervisor inteligente** de LiteLLM. Al arrancar el backend, detecta automáticamente si el proxy está corriendo; si no lo está, lo levanta en segundo plano:

```bash
# Arranca Backend + LiteLLM + Frontend Vite:
npm run dev
```

### Opción B: Arranque Manual en Terminales Separadas

**Terminal 1 — Proxy LiteLLM:**
```bash
# Exportar la clave maestra y arrancar el proxy en puerto 4000
LITELLM_MASTER_KEY="sk-litellm-master-secret-key" /opt/litellm-venv/bin/litellm --config ./litellm_config.yaml --port 4000 --host 0.0.0.0
```

**Terminal 2 — Servidor Web & Backend:**
```bash
npm run dev
```

### Opción C: Despliegue con Docker Compose
```bash
# Levantar tanto el contenedor de la aplicación como el de LiteLLM:
docker-compose up --build -d

# Ver logs en tiempo real:
docker-compose logs -f
```

---

## 4. Tabla de Variables de Entorno

Configura estas variables en tu archivo `.env` en la raíz del proyecto (nunca las subas a Git):

| Variable | Proveedor | Para qué sirve | Obligatoria |
|---|---|---|---|
| `LITELLM_URL` | LiteLLM | URL base del proxy (ej. `http://127.0.0.1:4000/v1` o `http://litellm:4000/v1`) | Sí (por defecto `http://127.0.0.1:4000/v1`) |
| `LITELLM_MASTER_KEY` | LiteLLM | Clave secreta para autenticar peticiones de backend a LiteLLM | Sí |
| `GEMINI_API_KEY` | Google Gemini | API key para modelos `gemini-main`, `gemini-pro`, `gemini-3.8-flash` | Recomendada (modelo por defecto) |
| `OPENAI_API_KEY` | OpenAI | API key para modelos `openai-main` (GPT-4o) y `openai-mini` | Solo si usas OpenAI |
| `ANTHROPIC_API_KEY` | Anthropic | API key para `claude-main` (Claude 3.5 Sonnet) y `claude-haiku` | Solo si usas Claude |
| `DEEPSEEK_API_KEY` | DeepSeek | API key para `deepseek-main` (DeepSeek V3) y `deepseek-reasoner` | Solo si usas DeepSeek |
| `OPENROUTER_API_KEY`| OpenRouter | API key unificada para cientos de modelos a través de OpenRouter | Solo si usas OpenRouter |
| `GROQ_API_KEY` | Groq | API key para inferencia de ultra-alta velocidad en `groq-main` | Solo si usas Groq |
| `MISTRAL_API_KEY` | Mistral AI | API key para `mistral-main` (Mistral Large) | Solo si usas Mistral |
| `XAI_API_KEY` | xAI (Grok) | API key para modelos `xai-main` (Grok 2) | Solo si usas xAI |
| `NVIDIA_NIM_API_KEY`| NVIDIA NIM | API key para modelos de microservicios acelerados `nvidia-main` | Solo si usas NVIDIA |
| `HF_TOKEN` | Hugging Face | Token de Hugging Face para descargas de pesos y modelos | Solo si usas Hugging Face |
| `AZURE_API_KEY` | Azure OpenAI | Clave de acceso a la instancia Azure OpenAI | Solo si usas Azure |
| `AZURE_API_BASE` | Azure OpenAI | Endpoint base de Azure (ej. `https://mi-instancia.openai.azure.com/`) | Solo si usas Azure |

---

## 5. Cómo Añadir y Configurar Cada Proveedor

### 5.1 Google Gemini (Actualmente Activo)
1. **Conseguir API Key**: Entra en [Google AI Studio](https://aistudio.google.com/app/apikey) y pulsa "Create API Key".
2. **Variable en `.env`**:
   ```bash
   GEMINI_API_KEY="AIzaSy..."
   ```
3. **Nombre de modelo interno**: `gemini-main` (apunta a `gemini/gemini-3.8-flash`).
4. **Cómo probarlo**:
   ```bash
   curl -X POST http://127.0.0.1:4000/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer sk-litellm-master-secret-key" \
     -d '{"model": "gemini-main", "messages": [{"role": "user", "content": "Hola"}]}'
   ```

### 5.2 OpenAI
1. **Conseguir API Key**: Entra en [OpenAI Platform](https://platform.openai.com/api-keys) y genera una secret key.
2. **Variable en `.env`**:
   ```bash
   OPENAI_API_KEY="sk-proj-..."
   ```
3. **Modelos configurados**: `openai-main` (GPT-4o) y `openai-mini` (GPT-4o mini).
4. **Cómo probarlo**:
   ```bash
   curl -X POST http://127.0.0.1:4000/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer sk-litellm-master-secret-key" \
     -d '{"model": "openai-main", "messages": [{"role": "user", "content": "Hola desde OpenAI"}]}'
   ```

### 5.3 Anthropic (Claude)
1. **Conseguir API Key**: Entra en [Anthropic Console](https://console.anthropic.com/settings/keys) y crea tu API key.
2. **Variable en `.env`**:
   ```bash
   ANTHROPIC_API_KEY="sk-ant-..."
   ```
3. **Modelos configurados**: `claude-main` (Claude 3.5 Sonnet) y `claude-haiku`.
4. **Cómo probarlo**:
   ```bash
   curl -X POST http://127.0.0.1:4000/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer sk-litellm-master-secret-key" \
     -d '{"model": "claude-main", "messages": [{"role": "user", "content": "Hola Claude"}]}'
   ```

### 5.4 DeepSeek
1. **Conseguir API Key**: Entra en [DeepSeek Platform](https://platform.deepseek.com/api_keys) y crea una clave.
2. **Variable en `.env`**:
   ```bash
   DEEPSEEK_API_KEY="sk-..."
   ```
3. **Modelos configurados**: `deepseek-main` (DeepSeek Chat V3).

### 5.5 OpenRouter
1. **Conseguir API Key**: Regístrate en [OpenRouter Keys](https://openrouter.ai/keys).
2. **Variable en `.env`**:
   ```bash
   OPENROUTER_API_KEY="sk-or-v1-..."
   ```
3. **Modelos configurados**: `openrouter-main`.

### 5.6 Groq
1. **Conseguir API Key**: Obtén una clave gratuita en [Groq Console](https://console.groq.com/keys).
2. **Variable en `.env`**:
   ```bash
   GROQ_API_KEY="gsk_..."
   ```
3. **Modelos configurados**: `groq-main` (Qwen 3.8 27B / GPT-OSS).

### 5.7 xAI (Grok)
1. **Conseguir API Key**: Entra en [xAI Console](https://console.x.ai/) y genera tu API key.
2. **Variable en `.env`**:
   ```bash
   XAI_API_KEY="xai-..."
   ```
3. **Modelos configurados**: `xai-main` (Grok 2).

### 5.8 NVIDIA NIM
1. **Conseguir API Key**: Entra en [NVIDIA Build](https://build.nvidia.com/) y genera un token `nvapi-...`.
2. **Variable en `.env`**:
   ```bash
   NVIDIA_NIM_API_KEY="nvapi-..."
   ```
3. **Modelos configurados**: `nvidia-main` (DeepSeek V4.1 Flash / Llama sobre GPUs NVIDIA).

### 5.9 Hugging Face
1. **Conseguir Token**: Entra en [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens).
2. **Variable en `.env`**:
   ```bash
   HF_TOKEN="hf_..."
   ```
3. **Uso**: Descarga optimizada de pesos y autenticación para endpoints de inferencia.

---

## 6. Cómo Añadir un Proveedor Nuevo o Cambiar de Modelo

El archivo central es `litellm_config.yaml`.

### Añadir un nuevo modelo (Ejemplo: Cohere Command R+):
1. Abre `litellm_config.yaml`.
2. Añade bajo la sección `model_list`:
```yaml
  - model_name: cohere-main
    litellm_params:
      model: cohere/command-r-plus
      api_key: os.environ/COHERE_API_KEY
```
3. Agrega la variable en tu `.env`:
```bash
COHERE_API_KEY="tu_clave_cohere"
```
4. Reinicia LiteLLM (o el servidor Express). Listo.

---

## 7. Configuración de Fallbacks y Resiliencia

En `litellm_config.yaml` se encuentra la sección `router_settings`:

```yaml
router_settings:
  routing_strategy: "latency-based-routing"
  num_retries: 2
  timeout: 60
  fallbacks:
    - openai-main: ["gemini-main", "claude-main", "groq-main"]
    - claude-main: ["gemini-main", "openai-main", "groq-main"]
    - gemini-main: ["openai-main", "claude-main", "groq-main"]
    - deepseek-main: ["gemini-main", "openai-main"]
    - groq-main: ["gemini-main", "openai-main"]
```

**Comportamiento**:
Si `openai-main` devuelve un error 429 (Rate Limit Exceeded), 500 (Outage) o 401 (Error de clave), LiteLLM reintenta inmediatamente y de forma transparente con `gemini-main`, y si este falla, con `claude-main`. El usuario en la web recibe la respuesta sin interrupción.

---

## 8. Verificación de Tráfico Real por LiteLLM

Para comprobar que una petición está pasando realmente por LiteLLM:
1. Abre la consola o logs de la aplicación:
   ```bash
   # Ver logs del proxy LiteLLM
   ps aux | grep litellm
   ```
2. Realiza una petición desde el chat web de KiranIA.
3. Observarás en el servidor:
   ```
   [LiteLLM Core] INFO: 127.0.0.1 - "POST /v1/chat/completions HTTP/1.1" 200 OK
   ```
4. En el frontend, el selector de modelos en la barra superior muestra el estado activo `Gateway: LiteLLM Universal Proxy`.

---

## 9. Troubleshooting (Resolución de Problemas)

| Problema | Causa probable | Solución |
|---|---|---|
| **401 Unauthorized en el backend** | `LITELLM_MASTER_KEY` no coincide entre `.env` y la cabecera `Authorization`. | Verifica que `LITELLM_MASTER_KEY` en `.env` sea igual al configurado en `litellm_config.yaml` (por defecto `sk-litellm-master-secret-key`). |
| **401 / AuthenticationError del Proveedor** | Falta la API key del proveedor (OpenAI, Anthropic, etc.) en las variables de entorno. | Añade la API key correspondiente en `.env` (ej. `OPENAI_API_KEY="..."`) y reinicia LiteLLM. |
| **404 Model Not Found** | El nombre de modelo especificado no existe o fue descontinuado. | Actualiza el mapeo en `litellm_config.yaml`. Por ejemplo, para Gemini usa `gemini/gemini-3.8-flash`. |
| **429 Rate Limit Exceeded** | Se ha alcanzado la cuota máxima por minuto del proveedor. | El sistema de fallbacks cambiará automáticamente al modelo secundario en la lista de fallbacks. |
| **Timeout en la conexión** | LiteLLM no está corriendo en el puerto 4000. | Ejecuta `curl http://127.0.0.1:4000/health/liveliness`. Si no responde, inicia LiteLLM con `/opt/litellm-venv/bin/litellm --config ./litellm_config.yaml --port 4000`. |
| **Docker: connection refused** | El backend intenta conectarse a `localhost:4000` dentro de un contenedor. | En Docker, la URL debe ser `http://litellm:4000/v1` (usando el nombre del servicio en `docker-compose.yml`), nunca `localhost`. |
| **Streaming roto / bloqueado** | Los headers de respuesta no desactivan el buffering. | El backend ya incluye `res.setHeader('X-Accel-Buffering', 'no')` y `res.flushHeaders()` para asegurar flujo continuo por SSE. |
