# MontIA — Chatbot Académico

MontIA es un chatbot académico diseñado con **Bajo Acoplamiento**, **Alta Cohesión** y principios **SOLID**. Utiliza inteligencia artificial (Google Gemini) integrada con múltiples bases de datos científicas y literatura (CrossRef, OpenAlex, Google Books) para asistir en la investigación académica, generar resúmenes, buscar fuentes y construir mapas conceptuales.

## Características Principales
- **Autenticación con JWT**: Registro, inicio de sesión y recuperación de contraseña vía correo.
- **Roles de usuario**: Soporte para usuarios invitados y autenticados (con historial de chat guardado en BD).
- **Procesamiento de Documentos**: Análisis de archivos PDF subidos o mediante URLs externas para extraer contexto y chatear con los documentos.
- **Búsqueda Avanzada**: Obtención de artículos filtrando por año, idioma, tipo y acceso abierto.
- **Mapas Conceptuales**: Generación visual de relaciones entre los artículos encontrados.
- **IA Generativa**: Respuestas contextuales basadas en los resultados utilizando Google Gemini.

---

## Requisitos Previos

Para ejecutar este proyecto en tu entorno local necesitas:

1. **Node.js** (v18 o superior)
2. **MySQL** (v8.0 o superior) corriendo localmente en el puerto 3306.
3. **Google Gemini API Key**: [Consigue una clave gratuita aquí](https://aistudio.google.com/app/apikey).
4. Cuenta de **Gmail** (opcional, para enviar correos de recuperación de contraseña). Debe usarse una "Contraseña de aplicación", no la contraseña normal.

---

## 🛠 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/Santiagolopezgo/ChatbotMontIA.git
cd ChatbotMontIA
```

### 2. Configurar el Backend

1. Abre una terminal y ve a la carpeta del backend:
   ```bash
   cd backend
   npm install
   ```
   
2. Configura las variables de entorno. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```
   
3. **Edita el archivo `.env`** recién creado con tus credenciales reales:
   ```env
   # Configuración del servidor
   PORT=3000

   # Configuración de la Base de Datos (ajusta DB_PASSWORD)
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=tu_contraseña_mysql_aqui
   DB_NAME=proyecto_chatbot
   DB_PORT=3306

   # Seguridad JWT
   JWT_SECRET=escribe_aqui_un_texto_largo_y_secreto

   # Clave de API de Inteligencia Artificial
   GEMINI_API_KEY=tu_clave_de_gemini_aqui

   # Configuración de correo (para recuperar contraseñas)
   EMAIL_USER=tu_correo@gmail.com
   EMAIL_PASS=tu_contraseña_de_aplicacion_gmail
   ```

*Nota: La base de datos y todas sus tablas se crearán automáticamente al arrancar el servidor si las credenciales de MySQL son correctas.*

### 3. Iniciar el Backend
Arranca el servidor de la API:
```bash
npm start
# (O usa "npm run dev" si deseas autorecarga en desarrollo)
```
Deberías ver en la consola:
```
✅ MontIA escuchando en http://localhost:3000
✅ Base de datos inicializada (tablas verificadas)
```

---

## 💻 Uso de la Aplicación (Frontend)

El frontend está construido con HTML, CSS, y JavaScript puro y no requiere compilación. Simplemente necesitas servir los archivos estáticos.

### Iniciar el Frontend

**Opción A (Extensión de VS Code):**
Si usas VS Code, instala la extensión "Live Server". Haz clic derecho sobre `frontend/index.html` y selecciona **"Open with Live Server"**.

**Opción B (Servidor simple con Node.js):**
Abre una nueva terminal en la raíz del proyecto y ejecuta:
```bash
npx serve frontend
```

### ¿Cómo usar MontIA?

1. **Iniciar Sesión:**
   Al abrir la aplicación, serás redirigido a `auth.html`.
   * Si es tu primera vez, **Regístrate** en la pestaña correspondiente.
   * Tras iniciar sesión, tu JWT se guardará y serás redirigido al chat principal (`index.html`).
   * *(Opcional)* Puedes usar el botón **"Continuar sin cuenta"** para probar el bot de forma anónima (el historial no se guardará).

2. **Chatear con la IA:**
   * **Saludos:** "Hola", "¿Qué puedes hacer?"
   * **Búsquedas:** "Busca artículos sobre inteligencia artificial en español desde el 2020"
   * **Análisis de PDF:** Sube un archivo mediante el icono del clip y luego pregunta sobre su contenido.
   * **Resúmenes:** Pide explícitamente sobre el contexto aportado.

3. **Herramientas de Búsqueda:**
   Cuando la IA te devuelve resultados de investigación, puedes usar las opciones disponibles en cada tarjeta:
   * 🔗 Abrir el artículo original (DOI u origen web).
   * 🧠 **"Mapa de Conocimiento":** Se abrirá un diagrama interactivo relacionando conceptos del paper.
   * 📄 "Formato IEEE": Obtiene la cita formateada para tu bibliografía.

---

## 🏗 Arquitectura y Estructura

El proyecto sigue una arquitectura **Layered (por capas)** basada en Domain-Driven Design (DDD) y aplica estrictamente los principios SOLID.

*   **/routes:** Definición de endpoints separados por dominios (`auth`, `chat`, `history`).
*   **/controllers:** Empaquetan y validan peticiones HTTP delegándolas a los servicios.
*   **/services:** Lógica central. Emplean **Chain of Responsibility** para enrutar mensajes del usuario entre distintos `Handlers`.
*   **/domain**: Gestión del área de negocio y de los estados de interfaz (ej. `SessionManager.js`).
*   **/adapters:** Implementación del patrón **Strategy** para desacoplar las llamadas a APIs externas (Gemini, CrossRef, OpenAlex).

El servidor está refactorizado implementando Alta Cohesión (cada módulo hace una cosa específica) y Bajo Acoplamiento (los módulos no dependen de la implementación interna de otros, como en el sistema de búsquedas externalizado mediante inyección de dependencias).

---
*Desarrollado para asistencia en la docencia e investigación académica.*