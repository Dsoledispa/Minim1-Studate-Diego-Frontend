# LOGS

Bitácora del frontend del Seminario 7. Tiene dos partes:

- **Tareas**: lo que hay que hacer en este repositorio, por bloques. Quien coge una tarea la marca al
  cerrarla.
- **Bitácora**: lo que se ha hecho, las decisiones tomadas y qué prompts de IA se han usado.

Las tareas del backend están en el LOGS.md de
[EA-Seminari7-JWT-WebSockets-Backend](https://github.com/Dsoledispa/EA-Seminari7-JWT-WebSockets-Backend).

## Contrato

Lo que backend y frontend tienen que cumplir igual. Si algo de aquí cambia, se cambia en los dos
LOGS.md.

- **Rutas públicas**: `POST /auth/register` y `POST /auth/login`. `POST /auth/refresh` y
  `POST /auth/logout` se autentican con la cookie del refresh token. `GET /ping` y la documentación
  (`/api-docs`) también son públicas. Todo lo demás exige token.
- **Registro**: el cuerpo es `{ name, email, password }` (contraseña de 8 caracteres como mínimo;
  `role` no se acepta, todo usuario nuevo es `user`). Responde 201 con `{ user }` y **sin token**, 409
  si el email ya existe o 422 si el cuerpo no es válido. El frontend redirige entonces a la página de
  login.
- **Login**: el cuerpo es `{ email, password }`. Responde `{ token, user }` o 401. `user` es
  `{ _id, name, email, role, createdAt, updatedAt }`, sin contraseña. El refresh token **no va en el
  JSON**: se deja en la cookie `refreshToken` (HttpOnly, SameSite=Strict, Path=/auth, Max-Age de 7
  días; Secure en producción).
- **Refresh**: sin cuerpo. Lee el refresh token de la cookie y responde `{ token }` (un access token
  nuevo), o 401 si no hay cookie, ha caducado o no es válida. El refresh token no cambia.
- **Logout**: sin cuerpo. Borra la cookie y responde 204. Después, `/auth/refresh` responde 401.
- **Cookies y CORS**: el frontend llama a `/auth/*` con `withCredentials: true`; el backend responde
  con `Access-Control-Allow-Credentials: true` y el origen exacto de `CORS_ORIGIN` (no vale `*`).
- **Token**: se envía en la cabecera `Authorization: Bearer <token>`. Su payload lleva los claims `sub`
  (id del usuario), `role` y `exp`. El access token dura 15 minutos y el refresh token 7 días. El
  frontend guarda el access token solo en memoria (una signal), nunca en `localStorage` ni
  `sessionStorage`; al recargar la página lo recupera llamando a `/auth/refresh` y después a
  `/users/me`.
- **Errores de autenticación**: 401 si falta el token, ha caducado (`{ message: 'El token ha caducado' }`)
  o no es válido (`{ message: 'Token no válido' }`); 403 si hay sesión pero no el rol necesario.
- **Roles**: el CRUD del backoffice (autores y libros) es solo para `admin`. El chat es para todos los
  usuarios con sesión iniciada.
- **Modelos**: `users`, `authors` y `books`. La autenticación vive solo en `User` (`name`, `email`,
  `password`, `role`): los campos `password` y `role` que `Author` traía del Seminario 5 se eliminan,
  y enviarlos al crear o editar un autor da 422.
- **Paginación y búsqueda**: `GET /authors?page=&limit=&search=` y
  `GET /books?page=&limit=&search=`, por defecto `page=1` y `limit=5` (máximo 100). `search` es
  opcional y busca parcialmente, sin distinguir mayúsculas: autores por nombre/email y libros por
  título/ISBN/descripción. Los metadatos de la respuesta se calculan sobre los resultados filtrados.
- **Autores borrados**: un autor borrado (borrado lógico) sigue apareciendo dentro de sus libros.
- **Chat** (extra):
  - Conexión: `io(url, { auth: { token } })` con el access token. Si falta, es falso o ha caducado,
    el servidor rechaza la conexión y el cliente recibe `connect_error` con el mensaje
    `Authentication error`.
  - Salas: `general`, `group:<nombre>` y `direct:<idA>:<idB>` (los dos ids ordenados; solo entran
    esos dos usuarios). Cualquier otro nombre se rechaza con `chat:error`.
  - Del cliente al servidor: `chat:join` con `{ room }` y `chat:message` con `{ room, text }` (de 1
    a 2000 caracteres; hay que haber entrado antes en la sala).
  - Del servidor al cliente: `chat:history` (solo a quien entra: los 50 últimos mensajes de la sala,
    del más antiguo al más nuevo), `chat:message` (a toda la sala, también a quien lo escribió) y
    `chat:error` con `{ message }` y `users:online` (a todos, cada vez que alguien abre o cierra el
    chat: la lista de ids de los usuarios conectados).
  - Un mensaje es `{ _id, room, user: { _id, name }, text, timestamp }`.
  - `GET /users` (con sesión, cualquier rol) responde `{ users: [{ _id, name }] }`, ordenados por
    nombre, para elegir con quién hablar en el chat directo.
- **Avisos del backoffice** (socket.io, no son chat): cuando un admin crea, edita o borra un libro o
  un autor, el servidor emite a todos los conectados `books:changed` o `authors:changed` con
  `{ action: 'created' | 'updated' | 'deleted', id, name, userId }` (`name` es el título del libro o el
  nombre del autor; `userId`, quién lo ha hecho). El cliente no envía nada: solo escucha.
- **Usuario con sesión**: `GET /users/me` (con sesión, cualquier rol) responde
  `{ user: { _id, name, email, role } }`, a partir del token (`req.user`).

## Tareas

### Estructura

- [x] `structure`: ramas `develop` y de objetivo, identidad del repositorio (nombre, README con el
  stack tecnológico), CONTRIBUTING.md, este LOGS.md y angular-eslint
- [x] Resolver los 5 errores que angular-eslint encuentra en el código heredado del S6 (ver la
  bitácora)

### Bloque D: autenticación en Angular

- [x] Pantallas de registro y de login con formularios reactivos y validación; al registrarse se
  redirige a la página de login
- [x] Quitar de los formularios y modelos de autor los campos `password` y `role` cuando el backend
  los elimine (contrato)
- [x] `AuthService`: register, login, logout, guardar el token (y documentar por qué localStorage o
  cookie HttpOnly, con los riesgos de cada una) y el usuario con sesión en una signal
- [x] Interceptor HTTP: añade `Authorization: Bearer` a cada petición; si llega un 401, limpia la sesión
  y lleva al login (o renueva el token con el refresh, si da tiempo)
- [x] Guard `CanActivate` en las rutas protegidas; enseñar u ocultar acciones según el rol

### Bloque E: chat (extra)

Extra: el profesor lo marcó como no prioritario y seguramente no entra en la demo. Es la pareja del
bloque B del backend. Se mantiene simple: lo importante es poder explicar el flujo de un mensaje.

- [x] Servicio que encapsula `socket.io-client` y se conecta enviando el token
- [x] Los eventos del socket expuestos como Observables
- [x] Componente de chat con los tres niveles: general, salas de grupo y directo (eligiendo el
  usuario); historial al entrar, lista de mensajes, envío y estado de la conexión
- [x] Limpieza en `OnDestroy` (unsubscribe y desconexión) para no dejar conexiones duplicadas
- [x] URL del servidor de sockets en `environments`

### Bloque F: usar la paginación del servidor

- [x] Adaptar los services a la nueva forma de la respuesta de los listados
- [x] Las listas piden cada página a la API en lugar de trocear la lista en memoria; el componente
  `app-pagination` se reutiliza tal cual
- [x] Hacer que el buscador funcione junto con la paginación

### Ejercicio del seminario 7: tokens seguros y más eventos de socket

- [x] Access token solo en una signal de `AuthService`, nunca en `localStorage` ni `sessionStorage`
- [x] Llamadas a `/auth` con `withCredentials`; el refresh token vive en la cookie HttpOnly
- [x] Al recargar la página, llamar a `/auth/refresh` al arrancar para recuperar la sesión; si la
  cookie no vale, al login
- [x] Logout contra `POST /auth/logout`
- [x] Escuchar los eventos `books:changed` y `authors:changed` y enseñarlos en el chat

### Extra opcional

- [ ] Que el rol `user` pueda ver la lista de libros (solo lectura), para que tenga algo más que el chat. Va después del bloque D y necesita su pareja en el backend

## Bitácora

### 2026-10-03 · Punto de partida y `structure`

- El repositorio nace como copia del frontend del Seminario 6, que ya cubría CRUD contra la API,
  formularios reactivos, validación y routing (explicado en GUIA.md).
- Se crea `develop` como rama de integración; `main` queda para presentar.
- Identidad: el paquete pasa a llamarse `ea-seminari7-jwt-websockets-frontend` y el README se reescribe
  con el stack tecnológico. El nombre interno del proyecto en `angular.json` sigue siendo `backoffice`:
  es un identificador del CLI ligado a la carpeta de salida (`dist/backoffice`) y cambiarlo no aporta
  nada.
- El `.gitignore` heredado ignoraba todos los `.md` salvo README, GUIA y EJERCICIO (reglas de notas
  personales). Se quita esa regla para que CONTRIBUTING.md y LOGS.md entren en el repositorio. Se borra
  `src/.gitigonore`, un fichero vacío con el nombre mal escrito.
- Textos que describían el borrado antiguo (el modal de borrar autor y el README decían que los libros
  se quedaban sin el autor): ahora dicen que el autor sigue apareciendo en sus libros, que es lo que
  hace el backend con el borrado lógico.
- Linter: se añade angular-eslint 21 (la versión 22 es para Angular 22; `ng add` instala la última por
  defecto y hay que fijar la 21). Comparado con Oxlint en el backend: Oxlint es mucho más rápido y no
  pide configuración, pero solo mira TypeScript; angular-eslint también revisa las plantillas HTML con
  reglas de Angular y de accesibilidad. En el código heredado encuentra 5 errores que Oxlint no habría
  visto:
  - `author-form.ts`: la variable `confirmPassword` se saca del formulario para no enviarla, pero no se
    usa, y la regla `no-unused-vars` lo marca.
  - `confirm-modal.html` (4 errores): el fondo y la ventana del modal escuchan `(click)` sin ser
    elementos con foco ni tener evento de teclado, así que con el teclado no se puede cerrar el modal
    pulsando fuera.
- Tests: 7 ficheros y 20 tests, todos en verde.


### 2026-10-04 · Corrección de errores de angular-eslint

- En `author-form.ts`, el payload ahora incluye explícitamente los campos del autor y omite `confirmPassword`.
- En `confirm-modal.html`, el fondo y la ventana responden a Escape; la ventana se identifica como diálogo modal accesible y el clic interior no se propaga al fondo.
- Verificación: `npx ng lint` sin errores y `npx ng test` con 20 tests en verde.

### 2026-10-04 · Adaptación de los services a la paginación

- Los services de autores y libros aceptan `page` y `limit` y tipan la respuesta paginada con `AuthorsPage` y `BooksPage`. El selector de autores del formulario de libros pide hasta 100.
- Verificación: `npx ng lint` sin errores y `npx ng test` con 22 tests en verde.

### 2026-10-04 · Listados paginados desde el servidor

- Autores y libros solicitan cada página al servidor y muestran los metadatos de paginación usando `app-pagination`.
- Verificación: `npx ng lint` sin errores y `npx ng test` con 25 tests en verde.

### 2026-10-04 · Búsqueda con paginación del servidor

- Los listados envían `search` a la API; al cambiar el término vuelven a la primera página y el
  servidor filtra antes de paginar. Las peticiones anteriores se cancelan para evitar resultados
  desactualizados.
- La API admite búsqueda parcial sin distinguir mayúsculas en autores (nombre/email) y libros
  (título/ISBN/descripción), aplicándola antes de contar y paginar.
- Verificación: `npx ng lint` sin errores, `npx ng test` con 27 tests en verde; el backend pasa
  `npm run lint` y `npm run build`.
- Prompt: «Hacer que el buscador funcione junto con la paginación del servidor en autores y libros;
  agregar búsqueda al backend y al frontend para que los metadatos de paginación correspondan a los
  resultados filtrados».

### 2026-10-05 · Autenticación en Angular (Bloque D)

- `AuthService` con `register`, `login`, `refresh`, `logout` y `getToken`. El usuario con sesión está en
  una signal privada que se expone de solo lectura, con `isLoggedIn` e `isAdmin` como `computed`. Los
  tokens y el usuario se guardan en `localStorage` y se recuperan al recargar la página.
- `authInterceptor` (funcional, registrado con `withInterceptors`): añade `Authorization: Bearer` a todas
  las peticiones salvo las de `/auth/*`. Si llega un 401 con "El token ha caducado", renueva el token con
  `POST /auth/refresh` y repite la petición una vez; si el refresh falla, o el 401 es por otro motivo,
  cierra la sesión y lleva al login. El resto de errores (403, 422...) llegan al componente sin tocar la
  sesión.
- Guards funcionales: `authGuard` (sin sesión, al login con `returnUrl`), `adminGuard` (un `user` vuelve
  al inicio) y `guestGuard` (con sesión no se ve el login ni el registro). Van ruta a ruta en
  `app.routes.ts`: el backoffice entero es `[authGuard, adminGuard]`.
- Pantallas nuevas: login (vuelve a `returnUrl` si es una ruta de la app), registro (nombre, email,
  contraseña y repetirla; al terminar lleva al login con el aviso "Cuenta creada") e inicio (saludo, rol
  y accesos al backoffice si es admin). La barra de navegación enseña Autores y Libros solo a un admin,
  y el usuario con su rol y "Cerrar sesión" a quien tiene sesión.
- El autor pierde `password` y `role` en el modelo y en el formulario. El validador de contraseñas
  repetidas pasa a `utils/password-match.ts` y lo usa el registro. La etiqueta de rol de la lista y de la
  tarjeta pasa a ser una etiqueta de estado (ACTIVO o INACTIVO) con el mismo `ngStyle` y el pipe
  `uppercase`, para que los ejemplos de la GUIA sigan teniendo código real; la columna "Activo" de la
  tabla queda dentro de esa etiqueta.
- Decisiones:
  - localStorage y no cookie HttpOnly: encaja con el contrato (los tokens llegan en el JSON) y no pide
    cambios en el backend. Riesgos de las dos opciones explicados en el README.
  - Si dos peticiones caducan a la vez, cada una renueva por su cuenta. Es correcto porque el refresh es
    sin estado y el refresh token no cambia; una cola de peticiones complicaría el código sin ganar nada
    aquí.
  - La pantalla de inicio existe porque un `user` no tiene nada que hacer en el backoffice; ahí colgará
    el chat.
- Documentación: README (cómo entrar, pantallas con quién puede entrar, estructura y el apartado
  Autenticación con localStorage frente a cookie) y GUIA (apartado 13, "Autenticación: interceptor y
  guards"; los ejemplos de `ngStyle`, `uppercase` y del formulario reactivo ya no usan el rol ni la
  contraseña del autor).
- Verificación: `npx ng lint` sin errores, `npx ng test` con 51 tests en verde (12 ficheros; nuevos los de
  `AuthService`, el interceptor, los guards y el login) y `npx ng build` correcto. Prueba de punta a punta
  en un navegador (Playwright y Chromium) contra el backend real con tokens de 20 segundos: 27
  comprobaciones correctas, entre ellas el registro con aviso de contraseñas distintas y de email
  repetido, el login fallido, que un `user` no ve ni puede abrir el backoffice, el cierre de sesión, que
  el admin vuelve a la URL que pedía, crear un autor sin contraseña, la renovación automática (`401`,
  `refresh 200` y la misma petición `200`, sin pasar por el login) y que con el refresh token roto se
  cierra la sesión.

### 2026-10-05 · Chat (Bloque E)

- `ChatService` encapsula `socket.io-client`: un solo socket para toda la app, conectado con el token
  en el handshake. Los eventos (`chat:history`, `chat:message`, `chat:error`, conexión y errores de
  conexión) se exponen como Observables a partir de `Subject`; el estado de la conexión es un
  `BehaviorSubject`. También pide `GET /users` para el chat directo.
- Componente `Chat` en `/chat` (con `authGuard`, para cualquier rol) con pestañas General, Grupo (se
  escribe el nombre del grupo) y Directo (se elige el usuario; la sala se forma con los dos ids
  ordenados). Muestra el historial al entrar, los mensajes de la sala activa, el envío y si está
  conectado. En `ngOnDestroy` cancela todas las suscripciones y cierra el socket.
- `socketUrl` en `environment.ts`. Enlace "Chat" en la barra para cualquier usuario con sesión.
- Revisión antes de presentar:
  - **Fallo corregido**: el socket se conectaba con el token guardado, que no pasa por el
    interceptor. Si había caducado (por ejemplo, tras 15 minutos sin hacer peticiones), el chat se
    quedaba en "No se pudo conectar al chat: Authentication error". Ahora `auth` es una función que
    lee siempre el token más reciente y, ante `Authentication error`, el servicio renueva el token
    con `refresh()` y reconecta una vez; si no puede renovarlo, cierra la sesión.
  - Se quita el método `listen()` de `ChatService`, que no se usaba.
  - La página de inicio enlaza al chat (todos los roles tienen algo que hacer ahí).
  - Tests nuevos: `ChatService` (`getUsers`, no conecta sin token, no emite sin conexión) y el
    componente con un `ChatService` falso (entra en `general` al conectar, nombre del chat directo
    con los ids ordenados, sin chat consigo mismo, solo los mensajes de la sala activa, errores del
    servidor, desconexión al salir).
  - Prettier en los ficheros del chat. README (stack, configuración, pantallas, estructura y un
    apartado Chat), GUIA (apartado 14, "Chat con WebSockets") y el Contrato del chat concretado en
    los dos LOGS.md.
- Verificación: `npx ng lint` sin errores, `npx ng test` con 60 tests en verde (14 ficheros) y
  `npx ng build` correcto. En el navegador (Playwright y Chromium), con el backend real y tokens de 20
  segundos: chat con dos usuarios a la vez (mensajes en tiempo real en la sala general y en la
  directa, historial al entrar), entrar en el chat con el token caducado conecta renovándolo, y con el
  refresh token roto lleva al login; 11 comprobaciones correctas. La prueba completa de autenticación
  del bloque D se repite sin fallos (27 comprobaciones).

### 2026-10-05 · Usuarios conectados en el chat

- Recomendación de los profesores: ver quién está activo. `ChatService` escucha `users:online` y lo
  expone como `onlineUsers$` (un `BehaviorSubject`, que se vacía al desconectarse). El chat muestra una
  franja "Usuarios" con un punto verde o gris, el mismo que el indicador "Conectado": uno mismo primero
  como "(tú)", después los conectados y luego el resto por nombre, y cuántos hay en el chat. Pulsar un
  usuario abre el chat directo con él, y el desplegable del directo marca "en el chat".
- Conectado quiere decir "con la página del chat abierta", porque el socket solo vive ahí.
- Verificación: `npx ng lint` sin errores, `npx ng test` con 63 tests en verde (nuevos: orden y
  contador de la lista, abrir el directo desde la lista, `onlineUsers$` empieza vacío) y `npx ng
  build` correcto. En el navegador con dos usuarios, 13 comprobaciones correctas: aparece y
  desaparece al entrar y salir del chat, cerrar una de dos pestañas no lo desconecta, el contador
  coincide con los puntos verdes, los conectados van primero y el clic abre el directo.

### 2026-10-19 · Ejercicio del seminario 7: access token en memoria y refresh token en cookie HttpOnly

- Problema de partida: `AuthService` guardaba `token`, `refreshToken` y `user` en `localStorage`.
  Cualquier script que se ejecute en la página (XSS) puede leerlo, y con el refresh token conseguir
  access tokens nuevos durante 7 días.
- `AuthService`: el access token pasa a una signal privada `accessToken` (solo en memoria), igual que
  el usuario. `getToken()` la lee, así el interceptor y el chat no cambian. Las tres llamadas a `/auth`
  (login, refresh y logout) llevan `{ withCredentials: true }`, que es lo que hace que el navegador
  envíe y acepte la cookie entre `localhost:4200` y `localhost:1337`. Desaparece todo uso de
  `localStorage` para la sesión.
- Al recargar la página el access token se ha perdido. Nuevo `restoreSession()`: llama a
  `/auth/refresh` (la cookie va sola) y después a `GET /users/me` para recuperar el usuario; si algo
  falla se queda sin sesión y no lanza error. Se ejecuta antes de pintar nada con
  `provideAppInitializer` en `app.config.ts`, así los guards ya saben si hay sesión cuando se abre la
  primera ruta y, si la cookie no vale, `authGuard` lleva al login sin código extra.
- `logout()` llama a `POST /auth/logout` (el backend borra la cookie) y, sin esperar la respuesta,
  vacía las signals y va al login.
- `LoginResponse` pierde `refreshToken`; nuevo `MeResponse` para `/users/me`.
- Eventos de socket que no son chat: `ChatService` escucha `books:changed` y `authors:changed` y los
  expone como `backofficeChanges$`. El chat los enseña en una franja "Avisos del backoffice" con los 5
  últimos ("Libro creado: Dune", "Autor borrado: Borges"...). El socket sigue viviendo solo en la
  página del chat, como hasta ahora.
- Tests: los specs que preparaban la sesión escribiendo en `localStorage` (`AuthService`, interceptor,
  guards, `App` y `Chat`) ahora la preparan con un login simulado con `HttpTestingController`. Nuevos
  tests de `restoreSession()` (con cookie válida y con 401) y de los avisos en el chat.
- Documentación: README (apartado Autenticación reescrito con la decisión nueva y la tabla
  localStorage frente a cookie), GUIA (apartado 13 y "Probarlo" con las comprobaciones en DevTools,
  apartado 14 con los avisos) y el Contrato en los dos LOGS.md.
- Verificación: `npm run lint` sin errores, `npm test -- --watch=false` con 65 tests en verde (14
  ficheros) y `npm run build` correcto. En Chromium (Playwright) contra el backend real, 17
  comprobaciones correctas: el JSON del login solo trae `token` y `user`; `localStorage` y
  `sessionStorage` vacíos; `document.cookie` vacío; la cookie `refreshToken` existe con `HttpOnly`,
  `SameSite=Strict`, `Path=/auth`, 7 días y sin `Secure`; al recargar se llama a `/auth/refresh` (200) y
  `/users/me` (200) y la sesión sigue; un `user` con el chat abierto ve "Libro creado: ..." cuando el
  admin crea un libro en otra ventana; al cerrar sesión se llama a `/auth/logout` (204), la cookie
  desaparece y al volver a entrar `/auth/refresh` da 401 y la app va al login.
- Prompt de IA usado: «Resolver el ejercicio del seminario 7 (PDF): refresh token en cookie HttpOnly y
  SameSite=Strict solo para /auth, access token solo en memoria, CORS con credenciales, y añadir
  eventos de socket.io que no sean de chat. Hacerlo sencillo, al estilo del resto del proyecto».
