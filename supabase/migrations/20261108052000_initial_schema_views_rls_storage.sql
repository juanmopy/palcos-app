create extension if not exists pgcrypto;

create table public.categorias (
  id text primary key check (id in ('azul', 'amarillo', 'rojo', 'verde')),
  nombre text not null,
  precio bigint not null check (precio > 0),
  color_hex text not null,
  orden smallint not null
);

create table public.palcos (
  numero smallint primary key check (numero between 1 and 120),
  categoria_id text not null references public.categorias(id),
  lado text not null check (lado in ('izquierdo', 'derecho')),
  nivel smallint not null check (nivel between 1 and 3),
  fila smallint not null check (fila in (1, 2)),
  columna smallint not null check (columna between 1 and 10),
  unique (lado, nivel, fila, columna)
);

create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  iniciales text not null,
  color_avatar text not null default '#334155',
  orden smallint not null default 0
);

create table public.compradores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) > 0),
  apellido text not null check (length(trim(apellido)) > 0),
  documento text not null unique,
  telefono text not null,
  recomendado_por text,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.usuarios(id),
  updated_at timestamptz not null default now()
);

create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  palco_numero smallint not null references public.palcos(numero),
  comprador_id uuid not null references public.compradores(id),
  estado text not null default 'activa' check (estado in ('activa', 'liberada')),
  separado_en timestamptz not null default now(),
  separado_por uuid not null references public.usuarios(id),
  liberado_en timestamptz,
  liberado_por uuid references public.usuarios(id),
  motivo_liberacion text
);

create unique index ventas_un_activo_por_palco
  on public.ventas(palco_numero)
  where estado = 'activa';

create table public.pagos (
  id uuid primary key,
  comprador_id uuid not null references public.compradores(id),
  monto bigint not null check (monto > 0),
  fecha_pago date not null,
  referencia text,
  comprobante_path text,
  nota text,
  anulado boolean not null default false,
  anulado_motivo text,
  anulado_por uuid references public.usuarios(id),
  anulado_en timestamptz,
  registrado_por uuid not null references public.usuarios(id),
  created_at timestamptz not null default now()
);

create table public.pago_aplicaciones (
  id uuid primary key default gen_random_uuid(),
  pago_id uuid not null references public.pagos(id) on delete cascade,
  venta_id uuid not null references public.ventas(id),
  monto bigint not null check (monto > 0),
  unique (pago_id, venta_id)
);

create table public.devoluciones (
  id uuid primary key,
  venta_id uuid not null unique references public.ventas(id),
  monto bigint not null check (monto >= 0),
  fecha_devolucion date not null,
  referencia text,
  comprobante_path text,
  registrado_por uuid not null references public.usuarios(id),
  created_at timestamptz not null default now()
);

create table public.bitacora (
  id bigint generated always as identity primary key,
  usuario_id uuid references public.usuarios(id),
  accion text not null,
  entidad text not null,
  entidad_id text not null,
  detalle jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create or replace view public.v_palcos
with (security_invoker = true)
as
select
  p.numero,
  p.lado,
  p.nivel,
  p.fila,
  p.columna,
  c.id as categoria_id,
  c.nombre as categoria_nombre,
  c.precio,
  c.color_hex,
  v.id as venta_id,
  v.comprador_id,
  case
    when co.id is null then null
    else concat_ws(' ', co.nombre, co.apellido)
  end as comprador_nombre_completo,
  co.documento as comprador_documento,
  co.recomendado_por,
  coalesce(
    (
      select sum(pa.monto)
      from public.pago_aplicaciones pa
      join public.pagos pg on pg.id = pa.pago_id
      where pa.venta_id = v.id
        and pg.anulado = false
    ),
    0
  )::bigint as abonado,
  (
    c.precio - coalesce(
      (
        select sum(pa.monto)
        from public.pago_aplicaciones pa
        join public.pagos pg on pg.id = pa.pago_id
        where pa.venta_id = v.id
          and pg.anulado = false
      ),
      0
    )
  )::bigint as saldo,
  case
    when v.id is null then 0
    else least(
      100,
      floor(
        coalesce(
          (
            select sum(pa.monto)
            from public.pago_aplicaciones pa
            join public.pagos pg on pg.id = pa.pago_id
            where pa.venta_id = v.id
              and pg.anulado = false
          ),
          0
        )::numeric * 100 / c.precio
      )::int
    )
  end as porcentaje,
  case
    when v.id is null then 'disponible'
    when coalesce(
      (
        select sum(pa.monto)
        from public.pago_aplicaciones pa
        join public.pagos pg on pg.id = pa.pago_id
        where pa.venta_id = v.id
          and pg.anulado = false
      ),
      0
    ) >= c.precio then 'pagado'
    else 'separado'
  end as estado
from public.palcos p
join public.categorias c on c.id = p.categoria_id
left join public.ventas v
  on v.palco_numero = p.numero
  and v.estado = 'activa'
left join public.compradores co on co.id = v.comprador_id;

create or replace view public.v_compradores
with (security_invoker = true)
as
select
  co.id,
  co.nombre,
  co.apellido,
  concat_ws(' ', co.nombre, co.apellido) as nombre_completo,
  co.documento,
  co.telefono,
  co.recomendado_por,
  count(vp.venta_id)::int as palcos_activos,
  coalesce(sum(vp.precio) filter (where vp.venta_id is not null), 0)::bigint as total_precio,
  coalesce(sum(vp.abonado) filter (where vp.venta_id is not null), 0)::bigint as total_abonado,
  coalesce(sum(vp.saldo) filter (where vp.venta_id is not null), 0)::bigint as saldo,
  co.created_at,
  co.updated_at
from public.compradores co
left join public.v_palcos vp
  on vp.comprador_id = co.id
  and vp.venta_id is not null
group by co.id;

create or replace view public.v_resumen
with (security_invoker = true)
as
select
  c.id as categoria_id,
  c.nombre as categoria_nombre,
  c.precio,
  count(p.numero)::int as total,
  count(p.numero) filter (where vp.estado = 'disponible')::int as disponibles,
  count(p.numero) filter (where vp.estado = 'separado')::int as separados,
  count(p.numero) filter (where vp.estado = 'pagado')::int as pagados,
  coalesce(sum(vp.abonado) filter (where vp.venta_id is not null), 0)::bigint as recaudado_neto,
  coalesce(sum(vp.saldo) filter (where vp.estado = 'separado'), 0)::bigint as por_cobrar,
  coalesce(sum(vp.precio) filter (where vp.estado = 'disponible'), 0)::bigint as potencial_disponible
from public.categorias c
left join public.palcos p on p.categoria_id = c.id
left join public.v_palcos vp on vp.numero = p.numero
group by c.id, c.nombre, c.precio, c.orden
order by c.orden;

alter table public.categorias enable row level security;
alter table public.palcos enable row level security;
alter table public.usuarios enable row level security;
alter table public.compradores enable row level security;
alter table public.ventas enable row level security;
alter table public.pagos enable row level security;
alter table public.pago_aplicaciones enable row level security;
alter table public.devoluciones enable row level security;
alter table public.bitacora enable row level security;

create policy "Usuarios autenticados pueden leer categorias"
  on public.categorias for select to authenticated
  using (
    exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
    )
  );

create policy "Usuarios autenticados pueden leer palcos"
  on public.palcos for select to authenticated
  using (
    exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
    )
  );

create policy "Usuarios pueden leer su propio usuario"
  on public.usuarios for select to authenticated
  using ((select auth.uid()) = id);

create policy "Usuarios autenticados pueden leer compradores"
  on public.compradores for select to authenticated
  using (
    exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
    )
  );

create policy "Usuarios autenticados pueden crear compradores"
  on public.compradores for insert to authenticated
  with check (
    exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
    )
    and created_by = (select auth.uid())
  );

create policy "Usuarios autenticados pueden editar compradores"
  on public.compradores for update to authenticated
  using (
    exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
    )
  );

create policy "Usuarios autenticados pueden leer ventas"
  on public.ventas for select to authenticated
  using (
    exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
    )
  );

create policy "Usuarios autenticados pueden leer pagos"
  on public.pagos for select to authenticated
  using (
    exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
    )
  );

create policy "Usuarios autenticados pueden leer aplicaciones"
  on public.pago_aplicaciones for select to authenticated
  using (
    exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
    )
  );

create policy "Usuarios autenticados pueden leer devoluciones"
  on public.devoluciones for select to authenticated
  using (
    exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
    )
  );

create policy "Usuarios autenticados pueden leer bitacora"
  on public.bitacora for select to authenticated
  using (
    exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
    )
  );

create or replace function public.actualizar_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger compradores_actualizar_updated_at
before update on public.compradores
for each row
execute function public.actualizar_updated_at();

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'comprobantes',
  'comprobantes',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/pdf'
  ]::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Usuarios autenticados pueden leer comprobantes"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'comprobantes'
    and exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
    )
  );

create policy "Usuarios autenticados pueden subir comprobantes"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'comprobantes'
    and exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
    )
    and (
      name ~ '^pagos/[0-9a-f-]+/[0-9a-f-]+\.(jpg|jpeg|png|webp|heic|pdf)$'
      or name ~ '^devoluciones/[0-9a-f-]+/[0-9a-f-]+\.(jpg|jpeg|png|webp|heic|pdf)$'
    )
  );
