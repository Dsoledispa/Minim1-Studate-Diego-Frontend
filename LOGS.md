# LOGS

Bitácora del frontend de Studate. Tiene dos partes:

- **Tareas**: lo que hay que hacer en este repositorio en el sprint, agrupado por ramas. Quien cierra
  una tarea la marca.
- **Bitácora**: lo que se ha hecho, las decisiones tomadas y qué prompts de IA se han usado.

Las tareas del backend, las de estructura y las de Scrum están en el LOGS.md de
[STUDUDATE---BACKEND](https://github.com/mariacazorla/STUDUDATE---BACKEND).

## Contrato

Lo que backend y frontend tienen que cumplir igual. Si algo de aquí cambia, se cambia en los dos LOGS.md.

- **Rutas públicas**: `POST /auth/register` y `POST /auth/login`. `POST /auth/refresh` y `POST /auth/logout` se autentican con la cookie del refresh token. `GET /ping` y la documentación
  (`/api-docs`) también son públicas. Todo lo demás exige token.
- **Registro**: el cuerpo es `{ name, email, password }` (contraseña de 8 caracteres como mínimo; `role` no se acepta, todo usuario nuevo es `user`). Responde 201 con `{ user }` y **sin token**, 409
  si el email ya existe o 422 si el cuerpo no es válido. El frontend redirige entonces a la página de login.
- **Login**: el cuerpo es `{ email, password }`. Responde `{ token, user }` o 401. `user` es `{ _id, name, email, role, createdAt, updatedAt }`, sin contraseña. El refresh token **no va en el
  JSON**: se deja en la cookie `refreshToken` (HttpOnly, SameSite=Strict, Path=/auth, Max-Age de 7 días; Secure en producción).
- **Refresh**: sin cuerpo. Lee el refresh token de la cookie y responde `{ token }` (un access token nuevo), o 401 si no hay cookie, ha caducado o no es válida. El refresh token no cambia.
- **Logout**: sin cuerpo. Borra la cookie y responde 204. Después, `/auth/refresh` responde 401.
- **Cookies y CORS**: el frontend llama a `/auth/*` con `withCredentials: true`; el backend responde con `Access-Control-Allow-Credentials: true` y el origen exacto de `CORS_ORIGIN` (no vale `*`).
- **Token**: se envía en la cabecera `Authorization: Bearer <token>`. Su payload lleva los claims `sub` (id del usuario), `role` y `exp`. El access token dura 15 minutos y el refresh token 7 días.
  El frontend guarda el access token solo en memoria (una signal), nunca en `localStorage` ni `sessionStorage`; al recargar la página lo recupera llamando a `/auth/refresh` y después a `/users/me`.
- **Errores de autenticación**: 401 si falta el token, ha caducado (`{ message: 'El token ha caducado' }`) o no es válido (`{ message: 'Token no válido' }`); 403 si hay sesión pero no el rol
  necesario.
- **Usuario con sesión**: `GET /users/me` (con sesión, cualquier rol) responde `{ user: { _id, name, email, role } }`, a partir del token (`req.user`).
- **Usuario**: `{ _id, name, email, role, birthDate?, degree?, lookingFor?, bio?, photo?, active, deleted, deletedAt?, createdAt, updatedAt }`, nunca con
  contraseña. `photo` es una imagen PNG o JPG en base64 (`data:image/...;base64,...`, 200 000 caracteres como mucho).
- **Usuarios inactivos y archivados**: no pueden iniciar sesión ni renovar el token (401 con el mensaje de siempre). Lo hace el prehook del modelo.
- **Gestión de usuarios** (solo `admin`):
  - `GET /users?page=&limit=&search=&role=&active=&degree=&archived=` responde `{ users, total, page, pages }`, ordenados por nombre. `search` busca en
    nombre y email; `role` es `user` o `admin`; `active` es `true` o `false`; `degree` es una titulación entera; `archived=true` lista solo los
    archivados (por defecto no salen). 400 si un filtro no es válido.
  - `GET /users/:userId` responde `{ user }`, también si está inactivo o archivado; 404 si no existe.
  - `POST /users` con `{ name, email, password, role?, active?, birthDate?, degree?, lookingFor?, bio?, photo? }` responde 201 `{ user }`; 409 si el
    email existe, 422 si el cuerpo no vale.
  - `PUT /users/:userId` con lo mismo salvo `password` (`name` y `email` obligatorios) responde 200 `{ user }`; 404 si no existe o está archivado.
    `photo: ''` quita la foto.
  - `POST /users/:userId/archive` (borrado lógico) responde 200 `{ user }` con `deleted: true`; 404 si no existe o ya estaba archivado.
  - `POST /users/:userId/restore` responde 200 `{ user }`; 404 si no existe o no estaba archivado.
  - `DELETE /users/:userId` (borrado físico) responde 204. Solo con usuarios archivados: si no, 409 `{ message: 'Archiva el usuario antes de eliminarlo' }`.
  - Un admin no puede cambiarse su propio rol, desactivarse, archivarse ni eliminarse: 403 `{ message: 'No puedes hacer esto con tu propio usuario' }`.

## Tareas

### Sprint 1 (mínimo 1)

#### Estructura (`structure`)

- [x] Crear los dos repositorios a partir del Seminari 7 (README y ramas) · Diego
- [x] Quitar autores, libros y chat del frontend · Miguel Ángel

#### Backoffice (`backoffice`)

- [x] Lista de usuarios paginada con búsqueda y filtros · Miguel Ángel
- [ ] Formulario de usuario: crear, editar, rol y activo · Miguel Ángel
- [ ] Archivar, restaurar y eliminar desde el backoffice · Miguel Ángel
- [ ] Acceso solo para admin (login y guards) · Miguel Ángel
- [ ] Tests del frontend (dentro de cada rama) · Miguel Ángel
- [ ] README del frontend (al cerrar cada rama) · Miguel Ángel

#### La Orla (`grades`)

- [ ] Pantallas de Grade · María

#### Dates (`dates`)

- [ ] Pantallas de Date · María

## Bitácora

La bitácora del Seminario 7, de donde viene este código, se conserva en el tag `seminari7-base`
(`git show seminari7-base:LOGS.md`).

### 2026-11-03 · Punto de partida y `structure`

- El repositorio nace como copia del frontend del ejercicio del Seminario 7. Antes de tocar nada se guarda
  ese código en el tag `seminari7-base`.
- Identidad: el paquete pasa a llamarse `studate-frontend`, la pestaña del navegador dice "Studate", el
  README cuenta qué es Studate y enlaza a los repos nuevos, y GUIA.md avisa de que sus ejemplos son del
  seminario (siguen en el tag).
- Este LOGS.md empieza de cero con las tareas del Sprint 1. Del contrato del seminario solo se queda la
  autenticación, que no cambia.
- Prompt de IA usado: «Lo mismo que en el backend: esto es el frontend del seminario 7 copiado tal cual. Hay
  que limpiarlo para Studate [...] Dime el plan de acción de cómo lo harías.» (conversación completa en
  `prompts/sprint-1.md`, fuera del repositorio).

### 2026-11-03 · Limpieza: fuera autores, libros y chat

- Se borran los componentes `authors-list`, `author-card`, `author-form`, `books-list`, `book-form` y `chat`,
  los services de autores, libros y chat (con sus tests), los modelos `author.model.ts` y `book.model.ts` y el
  pipe `languageName`. Se desinstala `socket.io-client` y desaparece `socketUrl` de `environment.ts`.
- Se quedan, porque los vamos a usar en las pantallas de usuarios: `pagination`, `confirm-modal`,
  `view-toggle`, el pipe `truncate` y las utilidades de `utils/`. Login, registro, interceptor y guards no cambian.
- Rutas: solo inicio, login y registro (las de Studate llegan en sus ramas). El navbar ya no tiene enlaces de
  backoffice ni de chat y la marca dice "Studate". La página de inicio saluda y explica lo que vendrá.
- Los tests que usaban `/books` o `/authors` como URL de ejemplo (login, guard e interceptor) pasan a usar
  `/users`; el test de `app` que comprobaba los enlaces del backoffice y del chat se cambia por uno que
  comprueba que con sesión ya no salen login y registro.
- README: fuera la sección del chat, las pantallas, ficheros y dependencias que ya no existen.
- Validación ejecutada: `npm run build`, `npm run lint` y `npm test -- --watch=false` en verde: 7 ficheros y 28
  tests (en el seminario eran 65; los que faltan eran de autores, libros y chat). Con la API y `ng serve`
  arrancados, en el navegador: el login de `admin@example.com` lleva a la página de inicio con el saludo; el único
  error de consola es el 401 de `/auth/refresh` al abrir la app sin sesión, que es lo esperado.
- Prompt de IA usado: el mismo de la limpieza del repositorio (ver la entrada anterior).

### 2026-11-03 · Lista de usuarios paginada con búsqueda y filtros

- Antes de empezar se revisa cómo pagina el backend (`skip` y `limit` con `countDocuments`, respuesta `{ users, total, page, pages }`)
  y se copia el contrato de la gestión de usuarios a este LOGS.md.
- Pantalla `/users` (`components/users-list`), solo para admin (`authGuard` + `adminGuard`), con el mismo patrón que la lista de libros
  del seminario: un `Subject` con `switchMap` pide cada página a la API y cancela la anterior si llega otra (por ejemplo, al escribir en
  el buscador), y el componente `app-pagination` se reutiliza tal cual.
- 10 usuarios por página. Filtros: buscador (nombre o email), rol, estado (activos o inactivos), titulación y "Ver archivados".
  Al cambiar un filtro se vuelve a la página 1. El de titulación no existía en la API: se añadió en la rama `users` del backend.
- `UserService.getUsers` solo envía los filtros que tienen valor (con `HttpParams`). El modelo `User` gana los campos del perfil y del
  estado, y hay una lista `DEGREES` con las titulaciones de la EETAC para el filtro (y luego el formulario).
- Componente nuevo `app-avatar`: la foto de perfil recortada en un círculo (`object-fit: cover`) o, si no hay foto, las iniciales sobre
  un color que sale del nombre. Se usará en todas las listas.
- `styles.css`: pastillas de estado (`.pill`) y tablas con la clase `stack`, que en el móvil se ven como tarjetas.
- Navbar: enlace "Usuarios" solo para admin; la página de inicio tiene un botón "Gestionar usuarios".
- Tests nuevos: `user.service.spec.ts` (que no se envían los filtros vacíos y sí los que tienen valor) y `users-list.spec.ts` (pinta una
  fila por usuario con su estado, pide la página elegida y vuelve a la 1 con los filtros). El de `app` comprueba que el admin ve
  "Usuarios" y un `user` no.
- Validación ejecutada: `npm run build`, `npm run lint` y `npm test -- --watch=false` en verde (9 ficheros, 34 tests). En el navegador con la
  API y el seed: como admin, 12 usuarios en 2 páginas, los inactivos en gris, y "Ver archivados" enseña a Sara y Dani.
- Prompt de IA usado: «Empezamos por la lista de usuarios paginada con búsqueda y filtros. Primero quiero ver cómo está montada la
  paginación en el backend [...] quiero 10 usuarios por página y algunos filtros, los más típicos. ¿Qué filtros me sugieres?»
