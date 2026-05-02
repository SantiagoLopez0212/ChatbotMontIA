# MontIA — Chatbot Académico Inteligente

MontIA es un chatbot académico diseñado con **Bajo Acoplamiento**, **Alta Cohesión** y principios **SOLID**. Integra inteligencia artificial generativa (OpenAI GPT-4o mini / Google Gemini) con múltiples bases de datos científicas (CrossRef, OpenAlex, Google Books) para asistir en la investigación académica, generar citas, analizar documentos y construir mapas conceptuales interactivos.

## Características Principales

- **Autenticación con JWT**: Registro, inicio de sesión y recuperación de contraseña vía correo.
- **Google OAuth**: Inicio de sesión con cuenta de Google.
- **Onboarding personalizado**: Flujo de bienvenida que configura el perfil académico del usuario.
- **Búsqueda multi-proveedor**: Consulta simultánea a CrossRef, OpenAlex y Google Books con filtros por año, idioma, tipo de publicación y acceso abierto.
- **Citas bibliográficas**: Generación automática en formatos APA, IEEE, Chicago, Vancouver, MLA y Harvard.
- **Análisis de documentos PDF**: Sube un PDF o pega una URL para chatear con el contenido.
- **Mapas de conocimiento**: Visualización interactiva de relaciones semánticas entre artículos usando IA + Vis.js.
- **Modo de voz**: Entrada por micrófono mediante Web Speech API.
- **Historial persistente**: Conversaciones guardadas en MySQL con soporte para múltiples sesiones.
- **IA Generativa dual**: Soporta OpenAI GPT-4o mini (recomendado) y Google Gemini Flash como fallback.

---

## Patrones de Diseño Aplicados

- **Chain of Responsibility**: Cadena de 10 handlers que procesan cada mensaje en orden de prioridad.
- **Strategy**: 3 estrategias de búsqueda intercambiables (CrossRef, OpenAlex, GoogleBooks).
- **Factory Method**: `SearchStrategyFactory` instancia los proveedores de búsqueda.
- **Adapter**: `AIAdapter` desacopla los proveedores de IA (OpenAI, Gemini, Mock).
- **Singleton**: Pool de conexiones MySQL y adaptador de IA con instancia única.
- **Dependency Injection**: Los handlers reciben sus dependencias por constructor.

---

## Requisitos Previos

1. **Node.js** v18 o superior
2. **MySQL** v8.0 o superior corriendo en el puerto 3306
3. **API Key de IA** — elige una de las dos opciones:
   - **OpenAI** (recomendado): `platform.openai.com` → GPT-4o mini, ~$0.15/1M tokens
   - **Google Gemini** (gratuito con límites): `aistudio.google.com`
4. **Cuenta de Gmail** (opcional, para correos de recuperación de contraseña)

---

## Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/SantiagoLopez0212/ChatbotMontIA.git
cd ChatbotMontIA
```

### 2. Instalar dependencias del Backend
```bash
cd backend
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
PORT=3000

# Base de Datos
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=proyecto_chatbot
DB_PORT=3306

# JWT
JWT_SECRET=cadena_larga_y_secreta

# IA — el sistema usa OpenAI si está definida, si no usa Gemini
OPENAI_API_KEY=sk-proj-...        # Recomendado para producción
GEMINI_API_KEY=AIza...            # Alternativa gratuita

# Correo (opcional)
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=contraseña_de_aplicacion_gmail
```

> La base de datos y todas sus tablas se crean automáticamente al iniciar el servidor.

### 4. Iniciar el servidor
```bash
npm run dev    # Desarrollo (autorecarga)
npm start      # Producción
```

La consola debe mostrar:
```
Modo IA: Activado (OpenAI)         ← si configuraste OPENAI_API_KEY
✅ Base de datos inicializada (tablas verificadas)
✅ MontIA escuchando en http://localhost:3000
```

---

## Uso del Frontend

El frontend es HTML/CSS/JS puro — no requiere compilación.

**Opción A — Live Server (VS Code):**
Clic derecho sobre `frontend/index.html` → *Open with Live Server*

**Opción B — Servidor Node:**
```bash
npx serve frontend
```

### Funcionalidades principales

| Acción | Cómo usarla |
|---|---|
| Buscar artículos | `"Busca artículos sobre machine learning desde 2020"` |
| Filtrar resultados | Botón **Filtros** → año, idioma, tipo, acceso abierto |
| Generar cita | En cada tarjeta → selector de formato → **Copiar Referencia** |
| Ver mapa conceptual | Botón **🧠 Ver Mapa de Conocimiento** tras una búsqueda |
| Analizar PDF | Icono 📎 → sube el archivo → elige opción 1-4 |
| Salir del modo PDF | Escribe `salir` en el chat o clic en la **X** del indicador |
| Más resultados | Escribe `más` o `dame más` |

---

## Estructura del Proyecto

```
ChatbotMontIA/
├── backend/
│   ├── src/
│   │   ├── adapters/          # Adaptadores a APIs externas (IA, búsqueda)
│   │   │   └── providers/
│   │   │       ├── search/    # CrossrefStrategy, OpenAlexStrategy, GoogleBooksStrategy
│   │   │       ├── geminiProvider.js
│   │   │       └── openaiProvider.js
│   │   ├── config/            # Configuración de BD y variables de entorno
│   │   ├── controllers/       # Lógica de cada ruta HTTP
│   │   ├── domain/            # SessionManager, filterParser, textUtils
│   │   ├── factories/         # SearchStrategyFactory
│   │   ├── middleware/        # JWT, rate limiting, validación
│   │   ├── routes/            # auth, chat, history, profile
│   │   └── services/
│   │       ├── handlers/      # 10 handlers (Chain of Responsibility)
│   │       └── chatbotService.js  # Orquestador principal
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── index.html             # SPA principal
│   ├── chatbot.js             # Lógica de chat e historial
│   ├── mindMap.js             # Visualización del mapa (Vis.js)
│   ├── voiceMode.js           # Reconocimiento de voz
│   ├── auth.html              # Login / Registro
│   ├── profile.html           # Perfil de usuario
│   └── style.css
└── docs/
    └── sql/schema.sql         # Esquema de base de datos
```

---

## Seguridad

- Contraseñas hasheadas con **bcryptjs** (10 rounds)
- Sesiones con **JWT** (expiración 2 horas)
- **Rate limiting**: 100 solicitudes / 5 minutos por IP
- Validación de propiedad en operaciones DELETE/UPDATE
- Variables sensibles en `.env` (nunca en el repositorio)

---

*Desarrollado como proyecto académico para asistencia en investigación científica.*
