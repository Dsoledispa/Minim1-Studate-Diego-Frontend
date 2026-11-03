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
  Si ya tenían sesión, cualquier petición con su token responde 401 `{ message: 'Tu cuenta no está activa' }` y el frontend cierra la sesión.
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
- [x] Formulario de usuario: crear, editar, rol y activo · Miguel Ángel
- [x] Archivar, restaurar y eliminar desde el backoffice · Miguel Ángel
- [x] Acceso solo para admin (login y guards) · Miguel Ángel
- [x] Tests del frontend (dentro de cada rama) · Miguel Ángel
- [x] README del frontend (al cerrar cada rama) · Miguel Ángel

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

### 2026-11-03 · Formulario de usuario: crear, editar, rol y activo

- Pantallas `/users/new` y `/users/:id/edit` (`components/user-form`), solo para admin, con la forma del formulario de autores del
  seminario: formulario reactivo con validadores, `removeEmpty` antes de enviar, modo crear o editar según haya `:id` y los errores de la
  API con `apiErrorMessage`.
- Es como el registro, pero el admin elige el rol, si el usuario está activo y el perfil (titulación de la lista `DEGREES`, qué busco, bio
  con contador de 500, fecha de nacimiento y foto). La contraseña y su repetición (validador `passwordMatch`) solo se piden al crear;
  desde el backoffice no se cambia la contraseña de nadie.
- Foto de perfil: se elige un PNG o JPG y `utils/image-to-data-url.ts` lo recorta en un cuadrado de 256 x 256 en un `<canvas>` y lo pasa a
  JPG en base64. Una foto del móvil de varios MB se queda en pocos KB (la de la prueba, 3747 caracteres). Se enseña ya recortada en el
  círculo de `app-avatar` antes de guardar, y "Quitar foto" envía `photo: ''`.
- Si el admin se edita a sí mismo, el rol y el activo salen deshabilitados con un aviso; además no se envían (la API respondería 403).
- La lista tiene ahora "Nuevo usuario" y un botón "Editar" en cada fila (no en los archivados: hay que restaurarlos antes).
- Problema encontrado: un usuario desactivado seguía pudiendo usar la API con su token hasta que caducaba. Se arregla en el backend
  (`VerifyToken` comprueba que la cuenta sigue activa y responde 401); aquí no hay que tocar nada, porque el interceptor ya cierra la
  sesión con ese 401.
- Tests nuevos en `user-form.spec.ts`: al crear pide contraseña y que coincida, al crear envía el rol y el activo, al editar no pide
  contraseña y hace un PUT sin ella, con el propio usuario el rol y el activo están bloqueados, y quitar la foto envía `photo: ''`.
- Validación ejecutada: `npm run build`, `npm run lint` y `npm test -- --watch=false` en verde (10 ficheros, 39 tests). En el navegador: se crea
  "Paula Ruiz" con titulación, qué busco y una foto PNG; la foto se ve recortada antes de guardar, el usuario sale en la lista y en MongoDB
  la foto está guardada como JPG en base64.
- Prompt de IA usado: «Ahora el formulario de usuario: crear, editar, rol y activo. Es básicamente el register que ya tenemos, pero hecho
  bien y adaptado a los roles. Lo de activo es importante [...] Dame el plan de acción.»

### 2026-11-03 · Archivar, restaurar y eliminar desde el backoffice

- Soft delete primero: en la lista normal cada usuario tiene "Archivar", que abre el `confirm-modal` del seminario ("no podrá
  iniciar sesión; podrás restaurarlo desde Ver archivados"). En "Ver archivados" salen "Restaurar" (sin modal: no se pierde nada) y
  "Eliminar para siempre" (hard delete), con el modal "¿Estás seguro de que quieres eliminar este usuario?" que avisa de que no se puede
  deshacer.
- Un solo modal para las dos acciones: la signal `pending` guarda el usuario y la acción, y los textos del modal son `computed` que
  cambian según la acción.
- En la fila del admin con sesión no sale "Archivar" (la API respondería 403). Si la API responde 409 o 403, se enseña su mensaje.
- Después de cada acción se recarga la página actual; si el usuario era el último de su página, se pasa a la anterior, como hacía la
  lista de libros del seminario.
- `UserService`: `archiveUser` y `restoreUser` (POST) y `deleteUser` (DELETE).
- Arreglo: el test del formulario navegaba a `/users` sin que el router de prueba tuviera esa ruta y Vitest avisaba de 3 errores no
  controlados (aunque los tests pasaban). Se le da una ruta vacía `users` y desaparecen.
- Tests nuevos: los tres métodos del service; en la lista, archivar después de confirmar recarga la página, en archivados salen
  "Restaurar" y "Eliminar para siempre" y el modal de eliminar avisa, y en la fila propia solo sale "Editar".
- Validación ejecutada: `npm run build`, `npm run lint` y `npm test -- --watch=false` en verde y sin avisos (10 ficheros, 43 tests). En el
  navegador con el seed recién hecho: archivar a Clara con el modal, verla en archivados, eliminarla para siempre con el modal de "¿Estás
  seguro?" (en MongoDB ya no está) y restaurar a Sara (en MongoDB vuelve a `deleted: false`).
- Prompt de IA usado: «Ahora archivar, restaurar y eliminar desde el backoffice [...] Cuando quiera eliminar para siempre, que me salga un
  modal de "¿Estás seguro de que quieres eliminar esto?" y, si le doy, se elimina. ¿Cómo lo harías? Plan de acción.»

### 2026-11-03 · Backoffice solo para admin y adaptado a Studate

- Con la zona de usuarios hecha, se repasa el backoffice entero para que solo lo use un admin: todas sus rutas (`/users`, `/users/new`,
  `/users/:id/edit`) llevan `authGuard` y `adminGuard`, y en la barra de arriba sus enlaces van detrás de la etiqueta "Backoffice", que un
  `user` no ve. El registro se queda: es por donde entra la gente normal; el backoffice es una zona aparte dentro de la misma app.
- Después del login, un admin va directo a `/users` y un `user` a la página de inicio, que le explica que el backoffice es solo para
  administradores. Con `returnUrl` se respeta a dónde iba.
- Aspecto de Studate (el del mockup), sin cambiar la estructura del seminario: la paleta en variables de `styles.css` (el índigo un poco más
  vivo, el coral de la marca y grises con un toque de azul), barra oscura con "Stu**date**" y la página actual subrayada en coral, radios de 8
  px y un contorno visible al moverse con el teclado.
- Móvil: la barra hace salto de línea y la sesión baja a su propia fila; en la lista de usuarios cada filtro ocupa toda la fila. Problema
  encontrado al probarlo con el ancho de un móvil: el select de titulaciones era más ancho que la pantalla y salía scroll horizontal; se
  limita su ancho.
- Tests: el de login comprueba que un admin va a `/users` y uno nuevo que un `user` va al inicio. Los specs dejan de usar la contraseña del
  seminario (`seminari7`) y usan la del seed nuevo.
- README: usuarios de ejemplo, pantallas del backoffice, estructura del proyecto (componentes, service y utilidad nuevos), qué protege cada
  guard y las reglas de la API que hay que saber (archivado, eliminar y foto).
- Pruebas del bloque `backoffice`: `npm run build`, `npm run lint` y `npm test -- --watch=false` en verde (10 ficheros, 44 tests). En el
  navegador, con el seed recién hecho: login de admin (va a Usuarios), lista con filtros y archivados, crear un usuario con foto, archivar,
  eliminar para siempre con el modal, restaurar, y la misma lista con 390 px de ancho (tarjetas, sin scroll horizontal).
- Prompt de IA usado: «Ahora que ya tenemos la zona de usuarios, esto lo tienen que administrar los administradores. Hay que rehacer el
  backoffice bien hecho: login y guards solo para admin, y adaptarlo a los modelos nuevos. Plan de acción.»
