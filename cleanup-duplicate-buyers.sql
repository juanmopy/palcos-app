-- =========================================================
-- 1. REVISAR DUPLICADOS HUÉRFANOS
-- =========================================================

with compradores_resumen as (
  select
    c.id,
    c.nombre,
    c.apellido,
    c.documento,
    c.telefono,
    count(v.id) filter (where v.estado = 'activa') as palcos_activos,
    count(v.id) as ventas_historicas,
    count(distinct pg.id) as pagos
  from public.compradores c
  left join public.ventas v
    on v.comprador_id = c.id
  left join public.pagos pg
    on pg.comprador_id = c.id
  group by c.id
),
candidatos as (
  select
    hu.id as comprador_huerfano_id,
    hu.nombre as huerfano_nombre,
    hu.apellido as huerfano_apellido,
    hu.documento as huerfano_documento,
    hu.telefono as huerfano_telefono,
    canon.id as comprador_principal_id,
    canon.nombre as principal_nombre,
    canon.apellido as principal_apellido,
    canon.palcos_activos
  from compradores_resumen hu
  join compradores_resumen canon
    on canon.id <> hu.id
   and canon.palcos_activos > 0
   and (
     (
       nullif(trim(hu.documento), '') is not null
       and hu.documento = canon.documento
     )
     or (
       lower(trim(hu.nombre)) = lower(trim(canon.nombre))
       and lower(trim(hu.apellido)) = lower(trim(canon.apellido))
       and regexp_replace(hu.telefono, '\D', '', 'g')
           = regexp_replace(canon.telefono, '\D', '', 'g')
     )
   )
  where hu.palcos_activos = 0
    and hu.ventas_historicas = 0
    and hu.pagos = 0
)
select *
from candidatos
order by principal_nombre, huerfano_nombre;

-- =========================================================
-- 2. ELIMINAR ÚNICAMENTE DUPLICADOS HUÉRFANOS SEGUROS
-- =========================================================
-- Ejecuta esta sección solo después de revisar los resultados anteriores.

begin;

with compradores_resumen as (
  select
    c.id,
    c.nombre,
    c.apellido,
    c.documento,
    c.telefono,
    count(v.id) filter (where v.estado = 'activa') as palcos_activos,
    count(v.id) as ventas_historicas,
    count(distinct pg.id) as pagos
  from public.compradores c
  left join public.ventas v
    on v.comprador_id = c.id
  left join public.pagos pg
    on pg.comprador_id = c.id
  group by c.id
),
candidatos as (
  select distinct on (hu.id)
    hu.id as comprador_huerfano_id
  from compradores_resumen hu
  join compradores_resumen canon
    on canon.id <> hu.id
   and canon.palcos_activos > 0
   and (
     (
       nullif(trim(hu.documento), '') is not null
       and hu.documento = canon.documento
     )
     or (
       lower(trim(hu.nombre)) = lower(trim(canon.nombre))
       and lower(trim(hu.apellido)) = lower(trim(canon.apellido))
       and regexp_replace(hu.telefono, '\D', '', 'g')
           = regexp_replace(canon.telefono, '\D', '', 'g')
     )
   )
  where hu.palcos_activos = 0
    and hu.ventas_historicas = 0
    and hu.pagos = 0
  order by hu.id
)
delete from public.compradores c
using candidatos x
where c.id = x.comprador_huerfano_id
returning c.id, c.nombre, c.apellido, c.documento;

commit;
