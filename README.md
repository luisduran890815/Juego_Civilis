# Civilis

**Civilis** es un juego web pacífico de construcción y expansión libre. Gestiona aldeanos, cultiva, cría animales, transforma materias primas, construye un pueblo y comercia con comunidades controladas por bots. No hay guerras, niveles ni una condición de derrota. Las maravillas son hitos opcionales: al terminarlas, la partida continúa.

El estilo usa gráficos isométricos procedurales en Canvas con una paleta de pixel art rural acogedora. No incluye ni reutiliza recursos gráficos de terceros.

## Contenido del proyecto

- Frontend estático en HTML, CSS y JavaScript ES modules.
- Renderizado isométrico con Canvas HTML5, zoom, desplazamiento y selección.
- 14 construcciones: vivienda, huerta, establo, recolección, cadenas productivas, mercado, servicios y 2 maravillas.
- Aldeanos visibles con asignación de trabajadores, construcción y migración.
- Cosechas, cría automática, alimentos, bienestar, estaciones y ciclos de día/noche.
- Cadenas `grano → harina → pan` y `madera + piedra → herramientas`.
- Comercio con tres pueblos bot y precios diarios variables.
- Guardado local automático, importación/exportación JSON y guardado anónimo en Supabase.
- Función serverless y configuración listas para Netlify.

## Inicio rápido local

Necesitas Node.js 20 o superior.

```bash
npm install
npm run dev
```

Netlify Dev abrirá el sitio y emulará la función serverless. Para probar solo la interfaz, sin nube:

```bash
npm run serve
# abre http://localhost:8888
```

La partida local funciona sin Supabase. El botón de nube mostrará un error explícito hasta configurar las variables del servidor.

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. Abre **SQL Editor**, copia y ejecuta `supabase/schema.sql`.
3. En **Project Settings → API**, copia:
   - Project URL → `SUPABASE_URL`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`
4. No coloques la service role en el navegador ni en un archivo publicado. La clave solo debe existir como variable de entorno de Netlify.

La tabla tiene RLS activado y no concede acceso a `anon` ni `authenticated`. Las operaciones pasan por `netlify/functions/save.mjs`. Cada partida recibe una clave aleatoria; en Supabase solo se almacena su hash SHA-256.

## Desplegar en Netlify

### Desde Git

1. Sube la carpeta a un repositorio.
2. En Netlify, elige **Add new site → Import an existing project**.
3. Deja vacío el comando de compilación. El directorio de publicación es `.` y el de funciones es `netlify/functions`; ambos ya están definidos en `netlify.toml`.
4. En **Site configuration → Environment variables**, añade `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
5. Despliega.

### Con Netlify CLI

```bash
npm install
npx netlify login
npx netlify init
npx netlify env:set SUPABASE_URL "https://TU-PROYECTO.supabase.co"
npx netlify env:set SUPABASE_SERVICE_ROLE_KEY "TU_CLAVE_SERVICE_ROLE"
npx netlify deploy --prod
```

## Guardados sin inicio de sesión

- **Local:** `localStorage`, con autoguardado cada 18 segundos y al cerrar.
- **Archivo:** exportación e importación de JSON desde el menú de ayuda.
- **Nube:** ID UUID + clave privada generada en el servidor. Ambos deben conservarse para restaurar una partida en otro dispositivo.
- No hay usuarios, contraseñas ni roles de aplicación.

## Controles

| Acción | Control |
|---|---|
| Mover mapa | Arrastrar, WASD o flechas |
| Zoom | Rueda del ratón o gesto equivalente |
| Seleccionar / construir | Clic sobre el mapa |
| Cancelar construcción | `Esc` |
| Pausar | `Espacio` |
| Velocidad | `1`, `2`, `3` |

## Pruebas

```bash
npm test
```

La prueba comprueba el estado inicial, catálogo de edificios, pueblos bot, selectores críticos y contrato básico de la función serverless.

## Estructura

```text
civilis/
├── index.html
├── css/styles.css
├── js/
│   ├── app.js
│   ├── config.js
│   ├── renderer.js
│   ├── state.js
│   └── storage.js
├── netlify/functions/save.mjs
├── supabase/schema.sql
├── tests/smoke.mjs
├── netlify.toml
├── package.json
├── .env.example
└── LICENSE
```

## Seguridad y operación

- La clave `SUPABASE_SERVICE_ROLE_KEY` nunca debe incluirse en JavaScript del navegador.
- La función limita el cuerpo a 2 MB y valida ID y clave antes de consultar.
- Para producción con mucho tráfico, añade rate limiting en Netlify y una tarea de retención para eliminar partidas abandonadas.
- Si una clave privada de partida se pierde, esa partida en la nube no puede recuperarse; no existe una cuenta asociada.

## Licencia

MIT. Consulta `LICENSE`.
