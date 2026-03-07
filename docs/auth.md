Autenticación y CRUD de Usuarios (MySQL + Node/Express)

Resumen
- Backend: Node/Express (integrado en `backend/src`).
- BD: MySQL (gestionable con phpMyAdmin).
- Seguridad: password hashing (bcrypt), JWT en cookie httpOnly, CORS con credenciales.
- Endpoints: `/api/auth/*` y `/api/users/*`.

Preparación BD (phpMyAdmin)
- Abre phpMyAdmin > pestaña SQL y ejecuta `docs/sql/schema.sql`.

Variables de entorno
Crea un archivo `.env` en `backend/` con:

PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=proyecto_chatbot
DB_PORT=3306
JWT_SECRET=pon_un_secreto_largo_y_unico
ALLOWED_ORIGINS=http://127.0.0.1:5500,http://localhost:3000,http://localhost:5173

Instalación
1) Ir a `backend/` y ejecutar (en tu equipo):
   npm install
2) Levantar el servidor:
   npm start

Endpoints
- POST `/api/auth/register` { name, email, password }
  Crea usuario, responde `{ user, token }` y setea cookie `token`.
- POST `/api/auth/login` { email, password }
  Autentica, responde `{ user, token }` y setea cookie `token`.
- POST `/api/auth/logout`
  Limpia cookie de sesión.
- GET `/api/auth/me`
  Retorna el usuario autenticado.

- GET `/api/users` (admin)
  Lista usuarios.
- GET `/api/users/:id` (propietario o admin)
  Obtiene un usuario por id.
- PUT `/api/users/:id` (propietario o admin)
  Actualiza nombre/email/password y opcional `is_admin`.
- DELETE `/api/users/:id` (propietario o admin)
  Elimina usuario.

Front-end
- `frontend/index.html` puede llamar a estos endpoints con `fetch` usando `credentials: 'include'` para enviar/recibir la cookie.
- Orígenes permitidos configurables vía `ALLOWED_ORIGINS`.

Notas de seguridad
- Usar `.env` con `JWT_SECRET` fuerte.
- En producción, poner `secure: true` a la cookie y servir sobre HTTPS.
- Validación de entrada mediante `express-validator` y consultas preparadas con `mysql2`.

