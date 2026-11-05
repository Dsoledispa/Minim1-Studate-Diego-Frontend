# AI_LOG

Herramienta: Claude Code (Anthropic). Modelo: Claude Opus 5.5.

## 1. Limpieza del código del Seminario 7

- **Pregunta:** cómo quitar las pantallas de autores, libros y chat.
- **Prompt:** «Lo mismo que en el backend: esto es el frontend del seminario 7 copiado tal cual. Hay que limpiarlo para Studate: quitar las pantallas de autores, libros y chat y dejar la estructura simple para luego meter lo nuestro. Solo quitar y limpiar. Dime el plan de acción de cómo lo harías.»
- **Incoherencias:** algunos tests usaban `/books` como URL de ejemplo.
- **Solución:** cambiados a `/users`. Mantuvimos paginación, modal de confirmar, selector de vista y utils para reutilizarlos.

## 2. Lista de usuarios

- **Pregunta:** lista paginada con búsqueda y filtros.
- **Prompt:** «Empezamos por la lista de usuarios paginada con búsqueda y filtros. Primero quiero ver cómo está montada la paginación en el backend antes de decidir cómo hacer esto, explícamela. ...Vale, ahora que lo entiendo: quiero 10 usuarios por página y algunos filtros, los más típicos. ¿Qué filtros me sugieres? Dame el plan de acción.»
- **Incoherencias:** propuso filtrar por titulación y la API no tenía ese filtro. En el móvil, el select de titulaciones se salía de la pantalla.
- **Solución:** añadimos el filtro en el backend y limitamos el ancho del select.

## 3. Formulario de usuario

- **Pregunta:** crear y editar usuarios con rol y activo.
- **Prompt:** «Ahora el formulario de usuario: crear, editar, rol y activo. Es básicamente el register que ya tenemos, pero hecho bien y adaptado a los roles. Lo de activo es importante, porque todo lo que venga después tiene que saber si un usuario está activo o no: si no lo está, no puede usar la API. Dame el plan de acción.»
- **Incoherencias:** un usuario desactivado seguía usando la API con su token. El test del formulario navegaba a `/users` sin esa ruta y Vitest daba errores.
- **Solución:** arreglo en `VerifyToken` del backend (el interceptor ya cerraba la sesión con el 401) y una ruta vacía `users` en el test.

## 4. Archivar, restaurar y eliminar

- **Pregunta:** acciones de soft delete y hard delete en la lista.
- **Prompt:** «Ahora archivar, restaurar y eliminar desde el backoffice. Aquí ya hay un poco más de chicha. Como hacemos soft delete, primero se archiva y se puede restaurar; eliminar ya es el hard delete. Cuando quiera eliminar para siempre, que me salga un modal de "¿Estás seguro de que quieres eliminar esto?" y, si le doy, se elimina. ¿Cómo lo harías? Plan de acción.»
- **Incoherencias:** ninguna importante.
- **Solución:** un solo `confirm-modal` para archivar y eliminar, y sin botones en la fila del propio admin.

## 5. Backoffice solo para admin

- **Pregunta:** que el backoffice solo lo use el admin.
- **Prompt:** «Ahora que ya tenemos la zona de usuarios, esto lo tienen que administrar los administradores. Hay que rehacer el backoffice bien hecho: login y guards solo para admin, y adaptarlo a los modelos nuevos. Plan de acción.»
- **Incoherencias:** los tests seguían usando la contraseña del seminario.
- **Solución:** `adminGuard` en todas las rutas del backoffice, la etiqueta "Backoffice" en la barra y los tests con la contraseña nueva.

## 6. Pantallas de La Orla

- **Pregunta:** mockup y pantallas de los votos.
- **Prompt:** «Ahora las pantallas de La Orla (Grade). Antes de programar, hazme un mockup para ver cómo quedaría esta pantalla.» y «Y si luego hay que usarlo desde el teléfono, que esta pantalla sea responsive, que se vea bien en el móvil.»
- **Incoherencias:** puso la ayuda "si los dos se han dado A+, se abre un Date" cuando los Dates todavía no existían.
- **Solución:** la quitamos y la volvimos a poner al hacer los Dates.

## 7. Pantallas de Dates

- **Pregunta:** pantallas de Dates para el admin y para cada usuario.
- **Prompt:** «Las pantallas de Dates, igual que las de La Orla: primero el mockup para verlo, y responsive desde el principio para que se vea en el móvil.»
- **Incoherencias:** una interfaz llamada `Date` tapa el `Date` de JavaScript. Para elegir "con quién", un usuario normal no puede llamar a `GET /users`.
- **Solución:** la interfaz se llama `StudateDate` y se usa `GET /users/directory`, que añadimos en el backend.

# Mínimo 1

### 1. Requisitos del examen

- **Pregunta:** cómo vamos a trabajar durante el Mínimo 1.
- **Prompt:** «Estamos en el examen del mínimo 1 y ahora te paso los requisitos a cumplir. Hay que hacer commits constantes de cada cosa relevante que hagamos. Como lo hemos hecho en AI_LOG hay que registrar los prompts que hagamos en cada repositorio. Primero modificaremos el backend y luego el frontend, yo te dictaré el orden de las cosas. Una cosa que tiene que usarse bien es el JWT: lo que hagamos solo tiene que tener acceso el rol de admin, ya que modificaremos el backoffice, terreno del admin. En cada repositorio ya estamos en la rama develop; por cada feat relevante que hagamos tiene que estar en su propia rama con sus commits, que se acabarán pasando a develop y lo subiré yo a main.»
- **Incoherencias:** ninguna importante.
- **Solución:** una rama `feat/<modelo>` por funcionalidad que sale de `develop` y vuelve a ella con un merge `--no-ff`, sin push y sin tocar `main`. Las rutas nuevas llevan `VerifyToken` + `RequireRole('admin')` en el backend y `adminGuard` en el frontend. Los prompts se registran en `AI_LOG.md` y en `AI_LOG_M1.md`.

### 2. Elección del nuevo modelo

- **Pregunta:** qué modelo nuevo añadir que se relacione con una entidad existente que no sea User y que tenga un vector de subdocumentos con al menos 3 tipos de datos distintos.
- **Prompt:** «Empezaremos a crear un nuevo modelo tanto en el backend como en el frontend. Tienes nuestro blog que explica nuestra idea de proyecto (https://studateapp.blogspot.com/). Ahora me gustaría que me recomendaras un modelo que cumpla con los siguientes requisitos: nuevo modelo con relación a una entidad existente que no sea user. Ha de contener un vector de objetos (subdocumentos) con al menos 3 tipos de datos distintos. Primero decidimos este modelo y una vez lo tengamos claro procederemos a hacer el feat, que lo llamaremos por el nombre del modelo escogido. Y para que no haya dudas, solo trabajaremos dentro del backoffice.»
- **Incoherencias:** el blog no habla de un rol admin: el Plan lo cierran los dos usuarios desde la app. Aquí el que lo gestiona es el admin, desde el backoffice.
- **Solución:** elegimos el modelo `Plan`, que en el blog es el "Cambio de Aula". Va relacionado con `Date` (un Plan por Date) y tiene un vector `spins` con las tiradas de la ruleta: `place` (String), `walkingMinutes` (Number), `scheduledAt` (Date) y `accepted` (Boolean).

### 3. Requisitos totales y plan por feats

- **Pregunta:** qué hay que hacer en total con `Plan` y cómo dividirlo en feats, separando backend y frontend.
- **Prompt:** «Una vez tengamos el modelo Plan (usemos su nombre en inglés) hay que hacer su CRUD completo (hard delete y soft delete incluidos) más lo que sea necesario para realizar el mínimo 1. Hay que hacer la paginación desde el servidor, usando populate en MongoDB para las relaciones. Esto tiene que poder filtrarse con al menos 2 combinaciones a la misma ruta de la lista (uno de texto y otro que sea necesario, que no sea texto). Por supuesto esto tiene que estar correctamente validado con Joi, usando los 400, 422, 404, 409. Ya en el frontend tenemos que añadir un Service nuevo que concentre todas las peticiones. Necesitamos 2 nuevos componentes standalone (lista y formulario/detalles) integrados en una vista existente de la entidad relacionada. Usaremos 3 llamadas del nuevo endpoint, obligatoriamente el listado paginado (paginación de servidor + cerca). Cuando hagamos la parte visual quiero un mockup, un HTML que guardarás en el repo de frontend para ver cómo quedará la página modificada. Dime el plan de acción dividido en feats y qué pertenece al backend y qué al frontend.»
- **Incoherencias:** la vista de Dates la usan el admin y los usuarios normales (la ruta solo tiene `authGuard`), así que los componentes de Plan no pueden ir protegidos por la ruta. Además, borrar un Date para siempre dejaría su Plan huérfano.
- **Solución:** tres feats en el backend (`feat/plan-model`, `feat/plan-list`, `feat/plan-crud`) y cuatro en el frontend (`feat/plan-mockup`, `feat/plan-service`, `feat/plan-list`, `feat/plan-form`). Los componentes van dentro de la vista de Dates, solo con `isAdmin()`, y la API responde 403 a cualquier rol que no sea admin. Al borrar un Date se borra también su Plan.

### 4. B1: modelo Plan (`feat/plan-model`)

- **Pregunta:** cómo es el modelo `Plan`, su validación con Joi y sus datos de ejemplo.
- **Prompt:** «Me parece bien la división. Por cada feat quiero ver el código nuevo que vas a añadir, así validando tu plan de acción por cada feat con mi ok. Para el feat 3 te pediré el mockup HTML que te he mencionado previamente. Venga, empezamos con el B1, dime cuál es el plan de acción (recuerda que quiero ver el código que vamos a implementar).»
- **Incoherencias:** ninguna en el código. Antes de proponerla comprobamos que la regla custom de Joi ("una sola tirada aceptada") da un error con `details`, que el ErrorHandler responde como 422. El permiso de Claude Code bloqueó `npm run seed -- --reset` porque borra la BD, así que lo lancé yo a mano.
- **Solución:** `src/models/Plan.ts` con el subdocumento `Spin` (String, Number, Date, Boolean), los esquemas Joi `plan.create`, `plan.update` y `planList`, y Planes de ejemplo en el seed.

### 5. B2: listado paginado y detalle de Planes (`feat/plan-list`)

- **Pregunta:** cómo listar los Planes paginados desde el servidor, con populate y filtros combinables, solo para admin.
- **Prompt:** «Ya está hecho. Comprueba que está bien, haz los commits, cierras el feat y procedemos al siguiente feat donde me dirás el plan de acción.»
- **Incoherencias:** la búsqueda con regex no ignora los acentos: "cafeteria" no encuentra "Cafetería" (sí lo encuentra "cafe").
- **Solución:** `PlanService.getPlans` hace `find` + populate anidado (Plan, luego Date, luego los dos usuarios) + `skip`/`limit` + `countDocuments`. Los filtros `search`, `status`, `date` y `archived` se combinan en `GET /plans`, y `GET /plans/:planId` devuelve el detalle. Las dos rutas llevan `VerifyToken` + `RequireRole('admin')`.

### 6. B3: CRUD de Planes (`feat/plan-crud`)

- **Pregunta:** cómo crear, editar, archivar, restaurar y eliminar Planes con los códigos 404 y 409 correctos, solo para admin.
- **Prompt:** «Procede, tienes mi ok» (cierre de B2, junto al que Claude propuso el plan de B3) y «OK» (aprobación del plan de B3).
- **Incoherencias:** el borrado físico de un Date dejaba su Plan huérfano: el populate habría devuelto `date: null`. En las pruebas, un `POST /plans` sin body daba 500: Express 5 deja `req.body` en `undefined` y Joi lo da por bueno aunque haya campos `required`. El fallo venía de antes y también afectaba a `POST /grades` y `POST /dates`.
- **Solución:** `PlanService` devuelve `{ error }` y el controlador lo traduce a 404 o 409 con una tabla de mensajes. El Plan se edita con `save()` para que pasen los validadores del modelo. El hard delete solo se permite si el Plan está archivado, y `DateService.deleteDate` elimina también el Plan del Date. `ValidateJoi` valida `req.body ?? {}`, así que una petición sin body responde 422.

### 7. F1: mockup de la vista de Dates con los Planes (`feat/plan-mockup`)

- **Pregunta:** cómo quedará la vista de Dates del admin con los dos componentes nuevos de Plan.
- **Prompt:** «Seed reseteado. Vale, pues entonces móntame ya el mockup de la página que vamos a modificar, así te valido si me parece bien el resultado final.»
- **Incoherencias:** para enseñar en la tabla de Dates qué Date tiene Plan habría que pedir los Planes de cada fila, una petición por Date.
- **Solución:** `mockups/plan-dates.html`, un HTML estático con los estilos y los datos reales del seed. El botón "Plan" de cada Date filtra la lista de Planes por ese Date (`GET /plans?date=`), así que basta con una sola llamada. Los Planes salen en una sección nueva debajo de los Dates (`app-plans-list`), y el formulario y detalle (`app-plan-form`) se abre como panel en la misma vista. Todo solo para el admin.

### 8. F2: modelo y PlanService del frontend (`feat/plan-service`)

- **Pregunta:** cómo concentrar en un solo servicio todas las peticiones a `/plans`.
- **Prompt:** «Tienes mi visto bueno del resultado final, procede.» (validación del mockup; Claude cierra F1 y propone el plan de F2)
- **Incoherencias:** al editar, las tiradas llegan de la API con su `_id`, pero el esquema Joi de la tirada no lo acepta (422). Antes de enviarlas hay que quitarlo.
- **Solución:** `models/plan.model.ts` con los tipos del Plan tal como llega con el populate y el tipo `SpinInput` (la tirada sin `_id`). `services/plan.service.ts` con las 7 llamadas: listado con `search`, `status`, `date` y `archived`, detalle, crear, editar, archivar, restaurar y eliminar. Lleva su spec de Vitest.

### 9. F3: lista de Planes en la vista de Dates (`feat/plan-list`)

- **Pregunta:** cómo integrar un componente standalone con la lista paginada de Planes en la vista de Dates, solo para el admin.
- **Prompt:** «procede» (aprobación de F2; Claude cierra F2 y propone el plan de F3)
- **Incoherencias:** en el mockup, el botón "Plan" de un Date con el Plan archivado saltaba solo a "Archivados". Con datos reales, la API filtra siempre por `archived` y no se sabe de antemano si ese Date tiene el Plan archivado. Además, el spec de `DatesList` del admin fallaría con la petición nueva a `/plans` si no se actualiza.
- **Solución:** `components/plans-list` (standalone) con el buscador, el estado y Activos/Archivados combinados en `GET /plans`, paginación de servidor, populate de la pareja, y archivar, restaurar y eliminar con `confirm-modal`. `DatesList` lo muestra solo si `isAdmin()` y su botón "Plan" le pasa el Date con un `input()`. Si ese Date no tiene un Plan activo, la lista lo dice y avisa de que puede estar en "Archivados".
