# Studate: frontend

Frontend en Angular de [Studate](https://studateapp.blogspot.com/), la app para conocer a gente de tu
propia universidad. Es el proyecto del Grupo 3 de EA (María Cazorla, Diego Soledispa y Miguel Ángel
Quiroga).

En el Sprint 1 (el mínimo 1) el objetivo es el **backoffice**: la zona de administración, en la que solo
entra un `admin`, para gestionar los usuarios y sus roles, los votos de La Orla y los Dates.

El proyecto parte del ejercicio del Seminario 7 (login con JWT, refresh token en cookie HttpOnly,
interceptor, guards y paginación del servidor), que se guarda tal cual en el tag `seminari7-base`.

Consume la API de [STUDUDATE---BACKEND](https://github.com/mariacazorla/STUDUDATE---BACKEND).

Cómo funciona Angular por dentro (componentes, servicios, signals, routing, formularios...):
[GUIA.md](GUIA.md). Las tareas del sprint y la bitácora: [LOGS.md](LOGS.md). Cómo trabajamos (ramas,
commits, pull requests): [CONTRIBUTING.md](CONTRIBUTING.md). El tablero del sprint es el
[GitHub Project de Studate](https://github.com/users/mariacazorla/projects/2).

## Stack tecnológico

Lo que ya está instalado y funcionando:

| Tecnología | Versión | Para qué se usa |
|---|---|---|
| [Angular](https://angular.dev/) | 21.2 | Framework del frontend: componentes, router, formularios y cliente HTTP, todo oficial |
| [TypeScript](https://www.typescriptlang.org/) | 5.9 | JavaScript con tipos. Angular fija qué versiones admite, por eso no va en la 6.0 como el backend |
| [RxJS](https://rxjs.dev/) | 7.8 | Observables: lo que devuelve `HttpClient` y a lo que se hace `subscribe` |
| [Angular CLI](https://angular.dev/tools/cli) | 21.2 | El comando `ng`: servidor de desarrollo, build, tests, lint y generar componentes |
| [Vitest](https://vitest.dev/) | 4.1 | Ejecuta los tests (`*.spec.ts`). Es el runner por defecto de Angular desde que Karma quedó obsoleto |
| [jsdom](https://github.com/jsdom/jsdom) | 28.1 | Simula el navegador dentro de Node para que los tests puedan pintar componentes |
| [ESLint](https://eslint.org/) + [angular-eslint](https://github.com/angular-eslint/angular-eslint) | 10.12 / 21.4 | Linter: analiza el TypeScript y también las plantillas HTML, con reglas propias de Angular y de accesibilidad |
| [Prettier](https://prettier.io/) | 3.9 | Da formato al código (reglas en `.prettierrc`, con el parser de Angular para los `.html`) |

El token JWT no necesita librería: el interceptor y el guard se hacen con lo que ya trae Angular.

## Requisitos previos

- [Node.js](https://nodejs.org/) 24 LTS (mínimo 22.12, que es lo que exige Angular 21). Incluye
  [npm](https://www.npmjs.com/).
- El backend de Studate arrancado, con su MongoDB (ver abajo).
- [VS Code](https://code.visualstudio.com/) con la extensión *Angular Language Service* (recomendado) y
  [Angular DevTools](https://angular.dev/tools/devtools) en el navegador.

Angular CLI no hace falta instalarlo aparte: viene con las dependencias del proyecto (`npx ng ...`).

## Cómo arrancarlo

Hacen falta dos terminales: una para la API y otra para Angular.

**1. Backend**

Con MongoDB ya arrancado (o con la URL de Atlas puesta en el `.env`):

```
git clone https://github.com/mariacazorla/STUDUDATE---BACKEND.git
cd STUDUDATE---BACKEND
npm install
cp .env.example .env
npm run seed
npm run dev
```

La API queda en http://localhost:1337 y su documentación (Swagger) en http://localhost:1337/api-docs.
`npm run seed` mete los usuarios de ejemplo; con `npm run seed -- --reset` se vuelven a poner desde
cero.
Si ya tenías un `.env`, copia en él las variables `JWT_...` de `.env.example`.

**2. Frontend (este repo)**

```
git clone https://github.com/mariacazorla/STUDATE---FRONTEND.git
cd STUDATE---FRONTEND
npm install
npm start
```

Y se abre http://localhost:4200. La página se recarga sola cada vez que guardas un archivo.

**3. Iniciar sesión** con uno de los usuarios del seed (las contraseñas son públicas a propósito):

| Email | Contraseña | Qué ve |
|---|---|---|
| `admin@example.com` | `seminari7` | La página de inicio (las pantallas de Studate llegan en sus ramas) |
| `user@example.com` | `seminari7` | Solo la página de inicio: el backoffice es para administradores |

También se puede crear una cuenta en "Registrarse". Las cuentas nuevas son siempre de rol `user`.

## Configuración: un solo fichero

El frontend no usa `.env`: lo que llega al navegador lo puede leer cualquiera, así que aquí no hay
secretos. Toda la configuración está en **un** fichero, y para cambiar la dirección de la API se toca
aquí y en ningún sitio más:

```typescript
// src/environments/environment.ts
export const environment = {
  // URL usada por las llamadas HTTP.
  apiUrl: 'http://localhost:1337',
};
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo en http://localhost:4200. Se recarga solo al guardar |
| `npm test` | Pasa los tests con Vitest y se queda esperando cambios (`npm test -- --watch=false` para pasarlos una vez) |
| `npm run lint` | Pasa angular-eslint sobre los `.ts` y los `.html` de `src/` |
| `npm run build` | Compila la versión de producción en `dist/backoffice/browser` |
| `npx ng generate component components/<nombre>` | Crea un componente nuevo con el CLI del proyecto |

## Pantallas

| Ruta | Pantalla | Quién entra |
|---|---|---|
| `/login` | Iniciar sesión | Solo sin sesión |
| `/register` | Crear una cuenta | Solo sin sesión |
| `/` | Inicio: saludo y rol | Con sesión |

Si se entra en una ruta sin permiso, el guard lleva al login (sin sesión) o al inicio (un `user` que
intenta entrar en el backoffice).

## Estructura del proyecto

```
src/
  main.ts                  Punto de entrada: arranca Angular sobre <app-root> de index.html
  environments/
    environment.ts         La única configuración: la URL de la API
  app/
    app.config.ts          Providers de toda la app: router y HttpClient (con el interceptor)
    app.routes.ts          El mapa de rutas: qué URL pinta qué componente
    app.ts, app.html       Componente raíz: la barra de navegación y el <router-outlet>
    components/
      navbar/              Menú de arriba: enlaces según el rol, usuario con sesión y cerrar sesión
      login/               Iniciar sesión
      register/            Crear una cuenta
      home/                Página de inicio para cualquier usuario con sesión
      pagination/          Paginación, componente hijo de las listas
      confirm-modal/       Ventana para confirmar antes de borrar
      view-toggle/         Botones para ver las listas en tabla o en tarjetas
    models/                Interfaces TypeScript con la forma de los datos de la API
      user.model.ts          User, UserRole y las peticiones y respuestas de /auth
    services/              Las únicas piezas que hablan con la API (HttpClient)
      auth.service.ts        register, login, refresh, restoreSession, logout; token y usuario en signals
    pipes/                 Formatean datos en la plantilla
      truncate-pipe.ts       Corta textos largos con "..."
    interceptors/
      auth.interceptor.ts  Añade el token a cada petición y lo renueva si ha caducado
    guards/
      auth.guard.ts        authGuard, adminGuard y guestGuard: quién puede entrar en cada ruta
    utils/
      api-error.ts         Pasa un error de HttpClient a un texto para la pantalla
      remove-empty.ts      Quita los campos vacíos antes de enviar un formulario
      password-match.ts    Validador: la contraseña y su repetición coinciden
```

Un dato viaja siempre por el mismo camino, igual que en el backend cada capa hace una sola cosa:

```
componente -> service (HttpClient) -> API -> respuesta -> subscribe -> signal -> la plantilla se repinta
```

Los componentes no saben de URLs ni de HTTP: piden los datos al service y guardan el resultado en una
signal. Tampoco saben del token: lo añade el interceptor a todas las peticiones.

## Autenticación

Cómo funciona por dentro (interceptor, guards, renovación del token) está en el
[apartado 13 de la GUIA](GUIA.md#13-autenticación-interceptor-y-guards). En resumen:

1. En el login, la API devuelve `{ token, user }` y `AuthService` lo guarda en dos signals, **solo en
   memoria**. El refresh token no llega al JSON: la API lo deja en una cookie HttpOnly que el navegador
   guarda él solo.
2. `authInterceptor` añade `Authorization: Bearer <token>` a cada petición.
3. El access token caduca a los 15 minutos. Cuando la API responde 401 con "El token ha caducado", el
   interceptor pide uno nuevo a `POST /auth/refresh` (sin body: la cookie va sola) y repite la
   petición, sin que el usuario lo note. Si la cookie también ha caducado (a los 7 días), cierra la
   sesión y lleva al login.
4. Al recargar la página el access token se ha perdido. Antes de pintar nada (`provideAppInitializer`),
   `restoreSession()` llama a `/auth/refresh` y a `GET /users/me` para recuperar la sesión; si la cookie
   no vale, la app arranca sin sesión y `authGuard` lleva al login.
5. "Cerrar sesión" llama a `POST /auth/logout`, que borra la cookie, y olvida el token de memoria.
6. Los guards deciden qué pantallas se pueden abrir según haya sesión y según el rol.

### Dónde se guardan los tokens: localStorage o cookie HttpOnly

Las dos opciones que se suelen comparar:

| | localStorage | Cookie HttpOnly |
|---|---|---|
| Quién la guarda | El frontend, con JavaScript | El backend, con la cabecera `Set-Cookie` |
| Se puede leer desde JavaScript | Sí | No |
| Riesgo principal | **XSS**: si alguien consigue ejecutar un script en la página, puede leer el token y usarlo desde otro sitio | **CSRF**: el navegador envía la cookie solo, también en peticiones que provoca otra web; hay que protegerse (`SameSite`, token anti-CSRF) |
| Qué pide | Nada especial: encaja con una API que devuelve el token en el JSON | Cambiar el backend (enviar y leer cookies) y configurar CORS con `credentials` |

Al principio los tokens iban en localStorage. El problema es que un script inyectado en la página se
lleva los dos, y con el refresh token puede pedir access tokens nuevos durante 7 días. Ahora se aplica
el patrón recomendado:

- El **access token** vive solo en una signal de `AuthService`. Nunca en `localStorage` ni en
  `sessionStorage`. Dura 15 minutos y se pierde al recargar, pero se recupera con la cookie.
- El **refresh token** va en la cookie `refreshToken`, con `HttpOnly` (JavaScript no puede leerla:
  `document.cookie` no la muestra), `SameSite=Strict` (el navegador no la envía en peticiones que
  provoca otra web, que es la protección contra CSRF), `Path=/auth` (solo viaja a `/auth/refresh` y
  `/auth/logout`), la misma duración que el token y `Secure` en producción.
- Para que la cookie cruce de `localhost:4200` a `localhost:1337`, las llamadas a `/auth` llevan
  `withCredentials: true` y el backend acepta credenciales con el origen exacto del frontend.

Se puede comprobar en DevTools (F12): en Application, Local Storage no tiene ningún token; en
Application, Cookies, `refreshToken` aparece con la casilla HttpOnly marcada; y en la consola,
`document.cookie` devuelve una cadena vacía.

Los guards y el ocultar botones son solo comodidad: quien protege los datos es el backend, que
comprueba el token y el rol en cada petición. Desde las herramientas del navegador se puede saltar un
guard, pero la API seguiría respondiendo 401 o 403.

## Cosas de la API que hay que saber

- Editar es un PUT y la API pide siempre los campos obligatorios.
- Un campo opcional que se deja vacío al editar no se borra. La API rechaza los valores vacíos, así
  que el formulario no los envía (`utils/remove-empty.ts`) y la API deja el valor que tenía.
- Los mensajes de error de validación que devuelve la API (422) vienen en inglés, de Joi.

## Cómo contribuir

Ramas, commits y pull requests en [CONTRIBUTING.md](CONTRIBUTING.md). Tareas pendientes y bitácora en
[LOGS.md](LOGS.md).
