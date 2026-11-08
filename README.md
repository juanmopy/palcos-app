# Gestión de Palcos

Aplicación interna para gestionar la venta de los 120 palcos del evento.

## Requisitos

- Node.js 22 LTS
- npm 10 o superior
- Una instancia de Supabase
- Supabase CLI para aplicar migraciones y generar tipos

La versión de Node está fijada en `package.json` mediante `engines`.

## Configuración local

1. Instala las dependencias:

   ```bash
   npm ci
   ```

2. Copia `.env.example` a `.env.local` y completa:

   ```bash
   cp .env.example .env.local
   ```

   `SUPABASE_SERVICE_ROLE_KEY` solo debe usarse en scripts administrativos
   locales. Nunca la expongas al cliente ni la publiques.

3. Inicia el servidor:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

Si pruebas mediante el proxy de code-server, configura
`NEXT_PUBLIC_BASE_PATH=/proxy/3000`. Esto solo prefija los assets; las rutas
siguen siendo `/` y `/login`. En acceso directo por `localhost` o en
producción, déjala vacía.

### Comandos útiles

```bash
npm run lint
npm run format:check
npm run test
npm run test:a11y
npm run build
npm run start
```

`npm run start` usa `process.env.PORT` cuando está definido y utiliza el puerto
3000 como valor local predeterminado.

## Configuración de Supabase

### Aplicar migraciones y seed

Para desarrollo local:

```bash
supabase start
supabase db reset
```

`supabase db reset` aplica las migraciones y ejecuta `supabase/seed.sql`.

Para un proyecto remoto:

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

El seed contiene las categorías y los 120 palcos. Ejecútalo solo cuando
corresponda inicializar un entorno; no lo repitas sobre datos de producción sin
revisar su contenido.

### Crear las 3 personas autorizadas

1. En Supabase abre **Authentication → Users → Add user**.
2. Crea cada usuario con su email interno, por ejemplo
   `ana@palcos.app`, y un PIN de exactamente 6 dígitos como contraseña.
3. Copia el UUID generado.
4. Inserta la persona correspondiente en la tabla `public.usuarios`, usando el
   mismo UUID:

   ```sql
   insert into public.usuarios
     (id, nombre, iniciales, color_avatar, email_login, orden)
   values
     ('UUID_DEL_USUARIO', 'Ana', 'AN', '#1D4ED8', 'ana@palcos.app', 1);
   ```

   Repite el proceso para las otras dos personas, con `orden` 2 y 3.

5. En **Authentication → Settings → User Signups**, desactiva los registros
   públicos (**Disable signups**). La aplicación no tiene registro público.

### Storage y Realtime

Las migraciones crean el bucket privado `comprobantes`, sus políticas de
acceso, las funciones RPC monetarias y la publicación Realtime necesaria. Los
comprobantes se consultan mediante signed URLs, no mediante URLs públicas.

## Despliegue en Render

El archivo `render.yaml` define un Web Service Node con:

- Build: `npm ci && npm run build`
- Start: `npm run start`
- Health check: `/login`
- Node 22 LTS

En Render, las variables marcadas con `sync: false` deben cargarse
manualmente. Usa los valores del proyecto de Supabase:

| Variable                        | Valor                           |
| ------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL del proyecto                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave anon/publishable          |
| `SUPABASE_SERVICE_ROLE_KEY`     | service role key, solo servidor |
| `NEXT_PUBLIC_EVENT_NAME`        | nombre del evento               |
| `NEXT_PUBLIC_BASE_PATH`         | vacío en Render                 |

Después del primer despliegue, en Supabase abre **Authentication → URL
Configuration** y configura:

- **Site URL:** `https://TU-SERVICIO.onrender.com`
- **Redirect URLs:** `https://TU-SERVICIO.onrender.com/**`

## Cambiar un PIN

El PIN es la contraseña del usuario interno de Supabase:

1. Abre **Authentication → Users**.
2. Selecciona la persona.
3. Usa **Reset password** o **Update password**.
4. Define un PIN nuevo de exactamente 6 dígitos.
5. Prueba el acceso desde `/login`.

No cambies `email_login` sin actualizar también el email del usuario de
Supabase y la fila correspondiente en `public.usuarios`.
