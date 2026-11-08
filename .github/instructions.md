# Instrucciones para GitHub Copilot: App de Gestión de Palcos

---

## 1. Contexto del proyecto

Web app interna (responsive + PWA instalable) para que **3 personas** gestionen la venta de **120 palcos** de **un único evento**: separar palcos, registrar abonos con comprobante, ver saldos, marcar pagados, liberar palcos y registrar la devolución del dinero.

- No hay roles: las 3 personas tienen los mismos permisos.
- Todo el dinero entra a **una sola cuenta bancaria**, así que **no existe "método de pago"**.
- **Precios fijos** por categoría (color).
- No hay abono mínimo para separar: un palco puede estar separado con $0 abonado.
- Un comprador puede tener **varios palcos**.
- **No** se requiere exportar ni importar Excel.

### Objetivo de UX
Que cualquiera de los 3 usuarios pueda, desde el celular y en menos de 30 segundos, ver el estado de un palco y registrar un abono con su comprobante, sin errores en los montos.

---

## 2. Stack técnico (obligatorio)

| Capa | Tecnología |
|---|---|
| Framework | **Next.js** (App Router, última versión estable) + **TypeScript** en modo `strict` |
| Estilos y UI | **Tailwind CSS** + **shadcn/ui** (basado en Radix, accesible por defecto) + `lucide-react` (iconos) |
| Formularios | `react-hook-form` + `zod` (los mismos esquemas sirven en cliente y servidor) |
| Base de datos | **Supabase Postgres** con Row Level Security |
| Autenticación | **Supabase Auth** (email + contraseña por debajo, mostrada como selector de persona + PIN) |
| Archivos | **Supabase Storage** (bucket privado `comprobantes`) |
| Tiempo real | **Supabase Realtime** (los 3 usuarios ven los cambios al instante) |
| Cliente Supabase | `@supabase/ssr` (clientes para servidor y navegador) |
| PWA | `app/manifest.ts` nativo de Next.js + service worker con **Serwist** (`@serwist/next`) |
| Hosting | **Render** (Web Service Node), con autodeploy desde la rama `main` de GitHub |
| Control de versiones | **Git + GitHub** |
| Migraciones | **Supabase CLI** (`supabase/migrations/*.sql`, `supabase/seed.sql`) |

### Reglas de código para Copilot
- TypeScript estricto: sin `any`. Generar los tipos con `supabase gen types typescript` en `lib/database.types.ts`.
- Nombres: las tablas y columnas de la BD van en **español** (como se definen abajo). El código TS (variables, funciones, componentes) va en **inglés**. Todos los textos visibles van en **español de Colombia**.
- Usar Server Components por defecto. Usar `"use client"` solo donde haya interactividad.
- Las mutaciones se hacen con **Server Actions** que llaman a **funciones RPC de Postgres** (ver sección 5). Nunca calcular saldos ni estados de dinero solo en el cliente.
- **El dinero se guarda como `bigint` en pesos enteros** (sin decimales y nunca como `float`).
- Formatear el dinero con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`, por ejemplo `$ 15.000.000`.
- Formatear las fechas con `Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota' })`.
- La `SUPABASE_SERVICE_ROLE_KEY` **nunca** debe llegar al cliente. Solo se usa en scripts de seed o administración.
- Hacer commits pequeños con **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).

---

## 3. Plano y datos semilla

### 3.1 Disposición física
- **Tarima** arriba, al centro. De la tarima sale una **pasarela** vertical que divide el salón en **lado izquierdo** y **lado derecho**.
- Cada lado tiene **3 bloques** apilados verticalmente (nivel 1 = el más cercano a la tarima, nivel 3 = el más lejano).
- Cada bloque tiene **2 filas x 10 columnas** (20 palcos).
- La columna 1 es la de más a la izquierda **tal como se ve el plano**. Los palcos **azules quedan junto a la pasarela** y los **verdes en los extremos exteriores**.

### 3.2 Categorías

| id | Nombre | Precio (COP) | Cantidad |
|---|---|---|---|
| `azul` | Azul | 15000000 | 24 |
| `amarillo` | Amarillo | 12000000 | 36 |
| `rojo` | Rojo | 10000000 | 36 |
| `verde` | Verde | 8000000 | 24 |
| **Total** | | **1344000000** | **120** |

### 3.3 Numeración por bloque (columna 1 → 10)

| Lado | Nivel | Fila 1 (arriba) | Fila 2 (abajo) |
|---|---|---|---|
| izquierdo | 1 | 111, 112, 113, 114, 115, 116, 117, 118, 119, 120 | 110, 109, 108, 107, 106, 105, 104, 103, 102, 101 |
| izquierdo | 2 | 91, 92, 93, 94, 95, 96, 97, 98, 99, 100 | 90, 89, 88, 87, 86, 85, 84, 83, 82, 81 |
| izquierdo | 3 | 71, 72, 73, 74, 75, 76, 77, 78, 79, 80 | 70, 69, 68, 67, 66, 65, 64, 63, 62, 61 |
| derecho | 1 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | 20, 19, 18, 17, 16, 15, 14, 13, 12, 11 |
| derecho | 2 | 21, 22, 23, 24, 25, 26, 27, 28, 29, 30 | 40, 39, 38, 37, 36, 35, 34, 33, 32, 31 |
| derecho | 3 | 41, 42, 43, 44, 45, 46, 47, 48, 49, 50 | 60, 59, 58, 57, 56, 55, 54, 53, 52, 51 |

### 3.4 Color por columna (igual en ambas filas del bloque)

| Bloques | Col 1-2 | Col 3-5 | Col 6-7 | Col 8-10 |
|---|---|---|---|---|
| izquierdo nivel 1 y 2 | verde | rojo | amarillo | azul |
| izquierdo nivel 3 | verde | rojo | amarillo | **amarillo** |

| Bloques | Col 1-3 | Col 4-5 | Col 6-8 | Col 9-10 |
|---|---|---|---|---|
| derecho nivel 1 y 2 | azul | amarillo | rojo | verde |
| derecho nivel 3 | **amarillo** | amarillo | rojo | verde |

> El seed debe generar los 120 palcos a partir de estas tablas. Además, debe **validar con un assert** que existan exactamente 24 azules, 36 amarillos, 36 rojos y 24 verdes.
> Los palcos que hoy están separados (marcados con X en el plano en papel) se cargan **manualmente desde la app** con los datos del comprador. El seed **no** los marca.

---

## 4. Modelo de datos (Supabase / Postgres)

### 4.1 Conceptos clave
- **Venta (asignación):** relación entre un palco y un comprador. Puede estar `activa` o `liberada`. Un palco solo puede tener **una venta activa**. Las ventas liberadas se conservan como historial.
- **Pago:** una transferencia real (monto, fecha, referencia y comprobante). Pertenece a un comprador.
- **Aplicación de pago:** cómo se **reparte** un pago entre las ventas activas del comprador. Esto resuelve el caso "una sola transferencia para 2 palcos": el pago se registra una vez, con un solo comprobante, y se distribuye por palco. Si después el comprador desiste de uno, se sabe exactamente cuánto se abonó a ese palco.
- **Devolución:** cuando se libera un palco, se registra la devolución de **todo lo abonado** a ese palco.
- **Anulación:** los pagos **no se borran**, se anulan con un motivo (para corregir errores de digitación).

### 4.2 Estado del palco (derivado, nunca guardado a mano)
- `disponible`: sin venta activa.
- `separado`: con venta activa y `abonado < precio` (incluye $0).
- `pagado`: con venta activa y `abonado = precio`.

### 4.3 Esquema SQL (migración inicial)

```sql
create extension if not exists pgcrypto;

create table categorias (
  id text primary key check (id in ('azul','amarillo','rojo','verde')),
  nombre text not null,
  precio bigint not null check (precio > 0),
  color_hex text not null,
  orden smallint not null
);

create table palcos (
  numero smallint primary key check (numero between 1 and 120),
  categoria_id text not null references categorias(id),
  lado text not null check (lado in ('izquierdo','derecho')),
  nivel smallint not null check (nivel between 1 and 3),
  fila smallint not null check (fila in (1,2)),
  columna smallint not null check (columna between 1 and 10),
  unique (lado, nivel, fila, columna)
);

create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  iniciales text not null,
  color_avatar text not null default '#334155',
  orden smallint not null default 0
);

create table compradores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) > 0),
  apellido text not null check (length(trim(apellido)) > 0),
  documento text not null unique,          -- normalizado: solo dígitos/letras, sin puntos ni espacios
  telefono text not null,                  -- normalizado E.164, ej. +573001234567
  recomendado_por text,                    -- texto libre, opcional
  created_at timestamptz not null default now(),
  created_by uuid not null references usuarios(id),
  updated_at timestamptz not null default now()
);

create table ventas (
  id uuid primary key default gen_random_uuid(),
  palco_numero smallint not null references palcos(numero),
  comprador_id uuid not null references compradores(id),
  estado text not null default 'activa' check (estado in ('activa','liberada')),
  separado_en timestamptz not null default now(),
  separado_por uuid not null references usuarios(id),
  liberado_en timestamptz,
  liberado_por uuid references usuarios(id),
  motivo_liberacion text
);
create unique index ventas_un_activo_por_palco on ventas(palco_numero) where estado = 'activa';

create table pagos (
  id uuid primary key,                      -- generado en el cliente (crypto.randomUUID) para nombrar el comprobante
  comprador_id uuid not null references compradores(id),
  monto bigint not null check (monto > 0),
  fecha_pago date not null,
  referencia text,                          -- n.º de transferencia/comprobante bancario (opcional)
  comprobante_path text,                    -- ruta en Storage (opcional pero recomendado)
  nota text,
  anulado boolean not null default false,
  anulado_motivo text,
  anulado_por uuid references usuarios(id),
  anulado_en timestamptz,
  registrado_por uuid not null references usuarios(id),
  created_at timestamptz not null default now()
);

create table pago_aplicaciones (
  id uuid primary key default gen_random_uuid(),
  pago_id uuid not null references pagos(id) on delete cascade,
  venta_id uuid not null references ventas(id),
  monto bigint not null check (monto > 0),
  unique (pago_id, venta_id)
);

create table devoluciones (
  id uuid primary key,
  venta_id uuid not null unique references ventas(id),
  monto bigint not null check (monto >= 0),
  fecha_devolucion date not null,
  referencia text,
  comprobante_path text,
  registrado_por uuid not null references usuarios(id),
  created_at timestamptz not null default now()
);

create table bitacora (
  id bigint generated always as identity primary key,
  usuario_id uuid references usuarios(id),
  accion text not null,        -- 'separar','registrar_pago','anular_pago','liberar','crear_comprador','editar_comprador'
  entidad text not null,
  entidad_id text not null,
  detalle jsonb not null default '{}',
  created_at timestamptz not null default now()
);
```

### 4.4 Vistas
- `v_palcos`: una fila por palco con `numero, lado, nivel, fila, columna, categoria_id, precio, color_hex, venta_id, comprador_id, comprador_nombre_completo, recomendado_por, abonado, saldo, porcentaje (0-100, entero), estado`.
  - `abonado` = suma de `pago_aplicaciones.monto` de la venta activa **cuyo pago no esté anulado**.
- `v_compradores`: comprador más el conteo de palcos activos, el total de precio, el total abonado y el saldo.
- `v_resumen`: totales por categoría y estado, el recaudado neto (pagos no anulados de ventas activas), lo que falta por cobrar (saldo de ventas activas) y el potencial disponible (precio de palcos disponibles).
- Crear las vistas con `security_invoker = true` para que respeten el RLS.

### 4.5 Seguridad (RLS)
- Activar RLS en **todas** las tablas.
- Política: solo los usuarios `authenticated` cuyo `auth.uid()` exista en `usuarios` pueden hacer `select`. Las tablas de dinero (`pagos`, `pago_aplicaciones`, `devoluciones`, `ventas`) **solo se modifican mediante RPC**. No dar `insert/update/delete` directo desde el cliente, salvo `compradores` (crear o editar).
- `anon` no tiene acceso a nada.
- En Supabase Auth, **desactivar los registros públicos** (sign-ups). Los 3 usuarios se crean a mano desde el dashboard.

### 4.6 Storage
- Bucket **privado** `comprobantes`.
- Rutas: `pagos/{pago_id}/{uuid}.{ext}` y `devoluciones/{devolucion_id}/{uuid}.{ext}`.
- Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `application/pdf`. Tamaño máximo: 10 MB.
- Políticas: los usuarios `authenticated` pueden subir (`insert`) y leer (`select`). No se permite `update/delete`.
- Para ver los archivos se usan **signed URLs** de corta duración (p. ej. 5 minutos). Nunca URLs públicas.
- Antes de subir, en el cliente: comprimir las imágenes (lado máximo de 1600 px, JPEG o WebP de calidad aprox. 0,8) y convertir HEIC a JPEG para que se vean en cualquier navegador.

---

## 5. Funciones RPC (transaccionales)

Todas las funciones deben: ejecutarse en una sola transacción; bloquear las filas involucradas con `SELECT ... FOR UPDATE` (evita conflictos si 2 usuarios actúan a la vez); validar que `auth.uid()` esté en `usuarios`; escribir en `bitacora`; y lanzar errores con **mensajes claros en español** que la UI pueda mostrar tal cual. Declararlas con `set search_path = public`.

1. **`separar_palco(p_palco smallint, p_comprador_id uuid, p_abono jsonb default null) returns uuid`**
   - Falla si el palco ya tiene una venta activa: "El palco 23 ya fue separado por otra persona."
   - Si `p_abono` viene (`{pago_id, monto, fecha_pago, referencia, comprobante_path, nota}`), registra el pago y lo aplica completo a la nueva venta (validando que monto ≤ precio).

2. **`registrar_pago(p_pago_id uuid, p_comprador_id uuid, p_monto bigint, p_fecha date, p_referencia text, p_comprobante_path text, p_nota text, p_aplicaciones jsonb) returns uuid`**
   - `p_aplicaciones` = `[{ "venta_id": uuid, "monto": bigint }, ...]`.
   - Validaciones: la suma de aplicaciones debe ser igual a `p_monto`; cada venta debe estar activa y pertenecer al comprador; cada monto debe ser > 0 y **≤ saldo actual** de esa venta (no se permiten sobrepagos); la fecha no puede ser futura.

3. **`anular_pago(p_pago_id uuid, p_motivo text) returns void`**
   - El motivo es obligatorio. Marca el pago como anulado; el estado del palco se recalcula solo.
   - Falla si alguna venta del pago ya está liberada (porque ese dinero ya se devolvió).

4. **`liberar_palco(p_venta_id uuid, p_motivo text, p_devolucion_id uuid, p_fecha_devolucion date, p_referencia text, p_comprobante_path text) returns void`**
   - Calcula el abonado de la venta y crea la `devolucion` con ese monto exacto (puede ser $0). Marca la venta como `liberada` con fecha, usuario y motivo. El palco vuelve a `disponible`.

5. **Triggers de bitácora** en `compradores` (insert/update) y `updated_at` automático.

---

## 6. Autenticación: selector de persona + PIN

- Pantalla `/login`: **3 tarjetas grandes** con avatar (iniciales con color) y el nombre de cada persona. Al tocar una, aparece el ingreso del PIN.
- Por debajo, cada persona es un usuario de Supabase con email interno (p. ej. `nombre@palcos.app`, que no se muestra) y **el PIN es la contraseña**: **6 dígitos** (mínimo de Supabase).
- Campo PIN: `type="password"`, `inputMode="numeric"`, `autoComplete="current-password"`, `maxLength={6}`. Se envía automáticamente al completar los 6 dígitos y tiene un botón para mostrar u ocultar.
- Errores: "PIN incorrecto. Te quedan N intentos." Tras 5 fallos seguidos, bloquear 5 minutos en ese dispositivo (además de los límites de Supabase Auth).
- La sesión persiste en el dispositivo (cookies httpOnly vía `@supabase/ssr`). En el header hay un botón "Cambiar de persona / Salir".
- Proteger todas las rutas excepto `/login` con el middleware/proxy de Next.js (según la versión), refrescando la sesión.
- Cada acción guarda `auth.uid()` (quién la hizo) y en la UI se muestra "Registrado por Ana · 12 nov 2026, 3:40 p. m.".

---

## 7. Pantallas y flujos

### 7.1 Navegación
- **Móvil:** barra inferior fija con 4 pestañas (icono + texto): **Mapa · Compradores · Resumen · Actividad**.
- **Escritorio (≥1024 px):** barra lateral izquierda con las mismas secciones.
- Header: nombre del evento, persona activa y un indicador de conexión.

### 7.2 Mapa (`/`), pantalla principal
- Recrea el plano: tarima arriba, pasarela al centro y los 6 bloques con la disposición de la sección 3.
- **Leyenda fija** con los colores y precios, y los estados.
- **Filtros** (chips): Todos · Disponibles · Separados · Pagados, y por color. Además, un **buscador** por número de palco, nombre o documento del comprador. Los palcos que no coinciden se atenúan (opacidad 25%) sin desaparecer, para no perder la orientación.
- **Contadores** sobre el mapa: Disponibles N · Separados N · Pagados N.
- **Representación del estado** (el color de categoría siempre se mantiene para no perder el precio; el estado **nunca depende solo del color**):

| Estado | Visual del palco |
|---|---|
| Disponible | Fondo del color de categoría en **tono claro** (tint), número en texto oscuro, borde sólido fino |
| Separado | Fondo del color de categoría **pleno**, **borde punteado** grueso, **mini barra de progreso** en la parte inferior con el % abonado e icono de reloj pequeño |
| Pagado | Fondo del color de categoría **oscurecido**, icono **✓** visible |

  - La mini barra usa un color **neutro** (blanco sobre fondo oscuro o gris oscuro sobre fondo claro), nunca verde, rojo o amarillo, para no confundirse con las categorías.
  - El número del palco debe tener un contraste **≥ 4,5:1** sobre su fondo (texto blanco en azul o rojo pleno, texto oscuro en amarillo o verde). Verificarlo en los 12 casos (4 colores × 3 estados).
  - Cada palco es un `<button>` con `aria-label` completo, p. ej. "Palco 23, azul, 15 millones, separado por Juan Pérez, 40% abonado".
- **Responsive:**
  - Escritorio: se ve el plano completo.
  - Tablet: plano completo con zoom ajustado.
  - Móvil: control segmentado **Izquierda | Derecha** que muestra un lado a la vez (10 columnas), con la pasarela indicada en el borde correspondiente. Permite pellizcar para hacer zoom. Las celdas miden **mínimo 32 px** (WCAG 2.2 exige al menos 24 px) y queda un espacio entre celdas.
  - Alternativa en móvil: botón **"Ver como lista"**, con filas de 48 px de alto, ordenable por número y filtrable.
- **Teclado:** el mapa es navegable con flechas (roving tabindex). `Enter` abre el palco.

### 7.3 Detalle del palco
- Se abre como **bottom sheet** en móvil (componente Drawer) y como **panel lateral** en escritorio, sin salir del mapa. La URL se sincroniza (`/?palco=23`) para poder compartirla y para que el botón atrás lo cierre.
- **Palco disponible:** número, color y precio, y el botón principal **"Separar palco"**.
- **Palco separado o pagado:**
  - Encabezado: "Palco 23 · Azul · $ 15.000.000" y un badge de estado (con texto e icono).
  - **Barra de progreso grande** con texto: "$ 6.000.000 de $ 15.000.000 (40%)" y debajo "Saldo pendiente: $ 9.000.000". Usar `role="progressbar"` con `aria-valuenow`, `aria-valuemin` y `aria-valuemax`.
  - Comprador: nombre completo, documento, teléfono (como enlace `tel:`), recomendado por y enlace a su ficha. Si tiene otros palcos: "También tiene: 24, 25".
  - **Historial de abonos** (del más reciente al más antiguo): fecha, monto aplicado a este palco (y "de una transferencia de $X" si se repartió), referencia, miniatura del comprobante y quién lo registró. Los anulados se muestran tachados con el motivo.
  - Acciones: **"Registrar abono"** (principal, deshabilitado con explicación si ya está pagado), "Editar comprador" y **"Liberar palco"** (destructiva, en rojo y separada de las demás).

### 7.4 Separar palco (formulario en 2 pasos)
1. **Comprador:** buscador con autocompletado por nombre o documento ("¿Ya existe? Búscalo"). Si no existe, se crea uno nuevo con:
   - Nombre* y Apellido* (`autoComplete="given-name"` / `"family-name"`).
   - Documento* (`inputMode="numeric"`). Se valida que sea único. Si ya existe, ofrecer "Usar este comprador".
   - Teléfono* (`type="tel"`, prefijo +57 por defecto y validación de 10 dígitos para Colombia).
   - Recomendado por (opcional): texto libre con **sugerencias de valores ya usados** para evitar variantes ("Carlos", "carlos ", "Carlos R."). Al guardar, limpiar los espacios sobrantes.
2. **Abono inicial (opcional):** interruptor "Registrar un abono ahora". Si se activa, se muestra el formulario de abono (7.5) sin la sección de reparto.
- Confirmación: resumen ("Palco 23 · Azul · $ 15.000.000 para Juan Pérez") y el botón "Confirmar separación".

### 7.5 Registrar abono
- Campos:
  - **Monto*:** se formatea mientras se escribe (`$ 1.500.000`), con `inputMode="numeric"`. Botón rápido **"Pagar saldo completo"**. Debajo, en vivo: "Nuevo saldo: $ X" y la barra de progreso como vista previa.
  - **Fecha del pago*:** por defecto hoy; no se permiten fechas futuras.
  - **Referencia** (opcional) y **Nota** (opcional).
  - **Comprobante:** botón "Adjuntar comprobante" que acepta `image/*,application/pdf` y permite elegir cámara, galería o archivos en el celular. Muestra la vista previa, el progreso de subida y la opción de quitar el archivo. Si no se adjunta, mostrar un aviso suave (no bloqueante): "Recomendado adjuntar el comprobante."
- **Reparto entre palcos** (solo si el comprador tiene más de una venta activa con saldo):
  - Lista de sus palcos con el saldo de cada uno y un campo de monto por palco.
  - Por defecto se asigna todo al palco desde el cual se abrió el formulario.
  - Botón **"Repartir automáticamente"**: llena en orden ascendente de número de palco hasta agotar el monto.
  - Indicador en vivo: "Asignado $ X de $ Y · Falta asignar $ Z". El botón de guardar se habilita solo cuando falta asignar = 0, y el texto explica por qué si está deshabilitado.
  - Ningún palco puede recibir más que su saldo (validación inline: "Máximo $ 9.000.000").
- Flujo de guardado: subir el comprobante → llamar al RPC → toast "Abono de $ 1.500.000 registrado en palco 23" → actualizar el mapa. Si el RPC falla, conservar todo lo digitado y mostrar el error. Botón con estado de carga y protección contra doble envío.
- **No usar actualizaciones optimistas en operaciones de dinero:** esperar la confirmación del servidor.

### 7.6 Liberar palco (acción destructiva)
- Diálogo de confirmación (`AlertDialog`) que explica la consecuencia: "Se liberará el palco 23 y se registrará una **devolución de $ 6.000.000** a Juan Pérez. Esta acción no se puede deshacer."
- Campos: Motivo* (obligatorio), Fecha de devolución* (hoy por defecto), Referencia de la transferencia de devolución (opcional) y Comprobante de devolución (opcional).
- El botón de confirmar tiene un texto explícito ("Liberar palco 23 y devolver $ 6.000.000"), nunca "Aceptar". El foco inicial va en "Cancelar".
- Si el comprador tiene otros palcos, se mantienen intactos.

### 7.7 Anular abono
- Desde el historial: menú "⋯" → "Anular abono" → diálogo con motivo obligatorio. Se usa para corregir errores de digitación. El registro anulado sigue visible, tachado.

### 7.8 Compradores (`/compradores`)
- Lista con búsqueda (nombre, apellido, documento o teléfono) y ordenamiento (nombre, saldo pendiente).
- Cada fila: nombre, chips con los números de sus palcos, total, abonado, saldo y una mini barra.
- Ficha del comprador: datos editables, sus palcos (activos y liberados), todos sus pagos y devoluciones, y el botón "Registrar abono" (abre el reparto).

### 7.9 Resumen (`/resumen`)
- Tarjetas KPI: **Recaudado**, **Por cobrar** (saldo de los separados), **Potencial disponible**, **Total del evento ($ 1.344.000.000)** y **% de avance de ventas**.
- Tabla por color: cantidad total, disponibles, separados, pagados, recaudado y por cobrar.
- Gráfico de barras apiladas por color (disponible / separado / pagado) con etiquetas de texto y no solo color.
- **Ventas por "Recomendado por":** agrupar sin distinguir mayúsculas ni espacios, con número de palcos, valor y recaudado.
- **Devoluciones:** total devuelto y número de palcos liberados.

### 7.10 Actividad (`/actividad`)
- Bitácora cronológica: "Ana registró un abono de $ 2.000.000 en el palco 23 · hace 5 min". Se puede filtrar por persona y por tipo de acción.

---

## 8. Principios de UX/UI (obligatorios)

### 8.1 Heurísticas de Nielsen aplicadas
1. **Visibilidad del estado:** estados de carga (skeletons, no spinners de pantalla completa), progreso de subida, indicador de conexión y toasts de confirmación.
2. **Lenguaje del usuario:** usar "Separar", "Abono", "Saldo", "Liberar" y "Devolución". Evitar términos técnicos ("venta activa", "RPC", "UUID").
3. **Control y libertad:** se puede cancelar cualquier formulario. El botón atrás cierra los sheets y diálogos. Los errores se corrigen anulando, no borrando.
4. **Consistencia:** el mismo componente de estado y la misma barra de progreso en mapa, lista y ficha. La acción principal siempre está en la misma posición (abajo en móvil, al final del formulario en escritorio).
5. **Prevención de errores:** validación de montos contra el saldo, documento único, fechas futuras bloqueadas, confirmación en acciones destructivas y protección contra doble envío.
6. **Reconocer antes que recordar:** autocompletado de compradores y de "Recomendado por", y resumen visible antes de confirmar.
7. **Flexibilidad:** buscador global con atajo `/` en escritorio y navegación por teclado en el mapa.
8. **Diseño minimalista:** una acción principal por pantalla; la información secundaria va en secciones colapsables.
9. **Ayudar a resolver errores:** los mensajes dicen qué pasó y cómo solucionarlo ("El monto supera el saldo del palco 23 ($ 9.000.000). Ajusta el monto o repártelo con otro palco.").
10. **Ayuda contextual:** textos de ayuda breves bajo los campos que lo necesiten y una leyenda del mapa siempre visible.

### 8.2 Accesibilidad (WCAG 2.2 nivel AA)
- Contraste de texto ≥ 4,5:1 (≥ 3:1 en texto grande y en componentes de interfaz como bordes e iconos).
- **El color nunca es el único indicador** (los estados usan borde, icono y texto).
- Tamaño de los objetivos táctiles: mínimo 24×24 px (criterio 2.5.8). Objetivo general de **44×44 px** en botones y controles. Los palcos del mapa móvil miden al menos 32 px con separación.
- Foco visible en todos los controles (`focus-visible:ring-2`). Nunca quitar el outline sin reemplazarlo.
- Etiquetas `<label>` visibles en todos los campos (el placeholder no reemplaza la etiqueta). Los errores se asocian con `aria-describedby` y se anuncian con `aria-live="polite"`.
- Toasts accesibles (los de shadcn/sonner con región `aria-live`).
- Respetar `prefers-reduced-motion`.
- `lang="es-CO"` en `<html>`.

### 8.3 Formularios en móvil
- Inputs con `font-size` de al menos **16 px** (evita el zoom automático en iOS).
- `inputMode` correcto (`numeric` para montos, documento y PIN; `tel` para el teléfono).
- Un campo por fila. Botón principal fijo abajo dentro del sheet y que no quede tapado por el teclado.
- Validar al salir del campo (`onBlur`) y al enviar, no en cada tecla, excepto los indicadores en vivo de monto y saldo.

### 8.4 Estados vacíos, de carga y de error
- **Vacío:** mensaje y acción ("Aún no hay abonos en este palco. Registrar abono").
- **Carga:** skeletons con la forma del contenido.
- **Error:** mensaje claro y botón "Reintentar". Nunca pantallas en blanco. Usar `error.tsx` y `not-found.tsx` por ruta.

### 8.5 Sistema visual
- Tokens de color (en `tailwind.config` o variables CSS):
  - `azul` `#1D4ED8` · `amarillo` `#FACC15` · `rojo` `#DC2626` · `verde` `#16A34A`, cada uno con variantes `tint` (disponible), `base` (separado) y `dark` (pagado). Ajustar los valores si no cumplen el contraste.
  - Estados semánticos de la UI (éxito, error, aviso) **diferenciados** de los colores de categoría: por ejemplo, los errores con icono y texto, no solo rojo.
- Tipografía: sans-serif del sistema o `Inter`; números con `font-variant-numeric: tabular-nums` para alinear montos.
- Espaciado en escala de 4 px y bordes redondeados consistentes (`rounded-lg`).
- Modo claro por defecto.

---

## 9. Tiempo real y concurrencia
- Suscribirse con Supabase Realtime a cambios en `ventas`, `pagos`, `pago_aplicaciones` y `devoluciones`, y refrescar `v_palcos` y `v_resumen` cuando cambien.
- Si otro usuario modifica el palco que tienes abierto, mostrar un aviso: "Ana acaba de registrar un abono en este palco. Datos actualizados."
- La integridad la garantizan las RPC con bloqueo de filas y el índice único parcial de ventas activas. La UI debe manejar el error de conflicto con un mensaje amable y refrescar los datos.

---

## 10. PWA
- `app/manifest.ts`: `name` "Gestión de Palcos", `short_name` "Palcos", `display: "standalone"`, `lang: "es-CO"`, `theme_color` y `background_color`, e iconos de 192, 512 y maskable 512.
- Service worker (Serwist): cachear el app shell y los assets estáticos. **No cachear respuestas de datos de dinero para escribir sin conexión.**
- Sin conexión: banner "Sin conexión. Los datos pueden no estar actualizados. No es posible registrar cambios." y botones de mutación deshabilitados con esa explicación.
- Meta tags para iOS (`apple-touch-icon`, `apple-mobile-web-app-capable`) y un aviso discreto de "Instalar app" (no intrusivo, se puede descartar).

---

## 11. Estructura del proyecto

```
/
├─ app/
│  ├─ (auth)/login/page.tsx
│  ├─ (app)/layout.tsx            # header, nav inferior/lateral, provider realtime
│  ├─ (app)/page.tsx              # Mapa (+ ?palco=N abre el detalle)
│  ├─ (app)/compradores/page.tsx
│  ├─ (app)/compradores/[id]/page.tsx
│  ├─ (app)/resumen/page.tsx
│  ├─ (app)/actividad/page.tsx
│  ├─ manifest.ts
│  ├─ sw.ts                       # service worker (Serwist)
│  └─ layout.tsx
├─ components/
│  ├─ ui/                         # shadcn/ui
│  ├─ map/                        # VenueMap, Block, BoxCell, Legend, MapFilters
│  ├─ box/                        # BoxDetail, PaymentHistory, ProgressBar, StatusBadge
│  ├─ forms/                      # ReserveForm, PaymentForm, AllocationEditor, ReleaseDialog, BuyerForm, ReceiptUploader
│  └─ layout/                     # BottomNav, Sidebar, Header, OfflineBanner
├─ lib/
│  ├─ supabase/{client.ts,server.ts}
│  ├─ actions/                    # Server Actions (llaman a RPC)
│  ├─ validations/                # esquemas zod
│  ├─ format.ts                   # formatCOP, formatDate, parseCOP
│  ├─ image.ts                    # compresión y conversión HEIC
│  └─ database.types.ts
├─ supabase/
│  ├─ migrations/
│  └─ seed.sql                    # categorías + 120 palcos (sin usuarios)
├─ .env.example
└─ README.md
```

---

## 12. Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # o la "publishable key" según el panel de Supabase
SUPABASE_SERVICE_ROLE_KEY=          # solo scripts locales; NUNCA en el cliente
NEXT_PUBLIC_EVENT_NAME=
```

---

## 13. Despliegue en Render
- Tipo: **Web Service** (Node), conectado al repo de GitHub con autodeploy en `main`.
- Build: `npm ci && npm run build` · Start: `npm run start` (escuchando en `process.env.PORT`).
- Fijar la versión de Node (`engines` en `package.json` o la variable `NODE_VERSION`).
- Configurar las variables de entorno en el panel de Render.
- En Supabase Auth → URL Configuration, agregar el dominio de Render.
- Las migraciones se aplican con `supabase db push` antes del deploy (documentarlo en el README).

---

## 14. Plan de implementación (orden sugerido)

1. Inicializar Next.js + TS + Tailwind + shadcn/ui + ESLint/Prettier. Primer commit.
2. Configurar Supabase CLI, crear la migración del esquema, las vistas, el RLS, el bucket y las políticas de Storage.
3. Crear el seed de categorías y los 120 palcos con el assert de cantidades. Generar los tipos.
4. Crear los clientes de Supabase, el middleware/proxy de sesión y la pantalla de login con selector de persona + PIN.
5. Crear el layout de la app con la navegación responsive.
6. Construir el mapa: bloques, celdas, leyenda, filtros, buscador, vista por lado en móvil, vista de lista y navegación por teclado.
7. Crear el detalle del palco (sheet o panel) con la barra de progreso y el historial.
8. Implementar las RPC y las Server Actions, con tests SQL de los casos límite.
9. Crear los formularios: separar (con creación de comprador), registrar abono (con reparto y comprobante), anular y liberar.
10. Implementar Realtime y los avisos de cambios de otros usuarios.
11. Crear las pantallas de Compradores, Resumen y Actividad.
12. Configurar la PWA (manifest, service worker y banner sin conexión).
13. Revisar la accesibilidad (contraste, foco, lectores de pantalla, objetivos táctiles) y probar en móvil real (iOS Safari y Android Chrome).
14. Desplegar en Render y escribir el README con la configuración.

---

## 15. Criterios de aceptación (MVP)
- [ ] Solo las 3 personas pueden entrar (selector + PIN). Sin registro público.
- [ ] El mapa muestra los 120 palcos en la posición y el color correctos: 24 azules, 36 amarillos, 36 rojos y 24 verdes.
- [ ] Se distinguen los 3 estados sin depender del color (borde, icono y barra).
- [ ] Se puede separar un palco con $0 o con un abono inicial.
- [ ] Un pago se puede repartir entre varios palcos del mismo comprador, con un solo comprobante.
- [ ] No se puede abonar más que el saldo. Un palco pasa a "Pagado" automáticamente al llegar al 100%.
- [ ] Los comprobantes (foto, screenshot o PDF) se suben desde la cámara o la galería y se ven con enlace seguro.
- [ ] Al liberar un palco se registra la devolución de todo lo abonado y el palco queda disponible. El historial se conserva.
- [ ] Los abonos erróneos se anulan con motivo (no se borran).
- [ ] Cada acción registra quién la hizo y cuándo.
- [ ] Los cambios de un usuario se ven en tiempo real en los otros dispositivos.
- [ ] El Resumen muestra el recaudado, lo que falta por cobrar, el detalle por color y las ventas por "Recomendado por".
- [ ] La app es instalable como PWA, usable en celular y escritorio, y cumple WCAG 2.2 AA en los flujos principales.
- [ ] Está desplegada en Render con autodeploy desde GitHub.
