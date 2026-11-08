# Gestión de Palcos

Aplicación interna para gestionar la venta de los 120 palcos del evento.

## Desarrollo local

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env.local` y completa las variables de entorno.

Si pruebas mediante el proxy de code-server, configura
`NEXT_PUBLIC_BASE_PATH=/proxy/3000`. Esto solo prefija los assets; las rutas
siguen siendo `/` y `/login`. En acceso directo por `localhost` o en
producción, déjala vacía.

3. Inicia el servidor:

   ```bash
   npm run dev
   ```

Abre [http://localhost:3000](http://localhost:3000).

## Comandos

- `npm run lint`: ejecuta ESLint.
- `npm run format:check`: verifica el formato con Prettier.
- `npm run build`: genera la compilación de producción.
