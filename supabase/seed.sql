insert into public.categorias (id, nombre, precio, color_hex, orden)
values
  ('azul', 'Azul', 15000000, '#1D4ED8', 1),
  ('amarillo', 'Amarillo', 12000000, '#FACC15', 2),
  ('rojo', 'Rojo', 10000000, '#DC2626', 3),
  ('verde', 'Verde', 8000000, '#16A34A', 4)
on conflict (id) do update
set
  nombre = excluded.nombre,
  precio = excluded.precio,
  color_hex = excluded.color_hex,
  orden = excluded.orden;

with ubicaciones as (
  select
    lado,
    nivel,
    fila,
    columna,
    case
      when lado = 'derecho' and nivel = 1 and fila = 1 then columna
      when lado = 'derecho' and nivel = 1 and fila = 2 then 21 - columna
      when lado = 'derecho' and nivel = 2 and fila = 1 then 20 + columna
      when lado = 'derecho' and nivel = 2 and fila = 2 then 41 - columna
      when lado = 'derecho' and nivel = 3 and fila = 1 then 40 + columna
      when lado = 'derecho' and nivel = 3 and fila = 2 then 61 - columna
      when lado = 'izquierdo' and nivel = 1 and fila = 1 then 110 + columna
      when lado = 'izquierdo' and nivel = 1 and fila = 2 then 111 - columna
      when lado = 'izquierdo' and nivel = 2 and fila = 1 then 90 + columna
      when lado = 'izquierdo' and nivel = 2 and fila = 2 then 91 - columna
      when lado = 'izquierdo' and nivel = 3 and fila = 1 then 70 + columna
      when lado = 'izquierdo' and nivel = 3 and fila = 2 then 71 - columna
    end::smallint as numero
  from
    unnest(array['izquierdo', 'derecho']) as lados(lado)
    cross join generate_series(1, 3) as niveles(nivel)
    cross join generate_series(1, 2) as filas(fila)
    cross join generate_series(1, 10) as columnas(columna)
),
palcos_semilla as (
  select
    numero,
    lado,
    nivel,
    fila,
    columna,
    case
      when lado = 'izquierdo' and nivel in (1, 2) and columna between 1 and 2 then 'verde'
      when lado = 'izquierdo' and nivel in (1, 2) and columna between 3 and 5 then 'rojo'
      when lado = 'izquierdo' and nivel in (1, 2) and columna between 6 and 7 then 'amarillo'
      when lado = 'izquierdo' and nivel in (1, 2) and columna between 8 and 10 then 'azul'
      when lado = 'izquierdo' and nivel = 3 and columna between 1 and 2 then 'verde'
      when lado = 'izquierdo' and nivel = 3 and columna between 3 and 5 then 'rojo'
      when lado = 'izquierdo' and nivel = 3 and columna between 6 and 10 then 'amarillo'
      when lado = 'derecho' and nivel in (1, 2) and columna between 1 and 3 then 'azul'
      when lado = 'derecho' and nivel in (1, 2) and columna between 4 and 5 then 'amarillo'
      when lado = 'derecho' and nivel in (1, 2) and columna between 6 and 8 then 'rojo'
      when lado = 'derecho' and nivel in (1, 2) and columna between 9 and 10 then 'verde'
      when lado = 'derecho' and nivel = 3 and columna between 1 and 5 then 'amarillo'
      when lado = 'derecho' and nivel = 3 and columna between 6 and 8 then 'rojo'
      when lado = 'derecho' and nivel = 3 and columna between 9 and 10 then 'verde'
    end as categoria_id
  from ubicaciones
)
insert into public.palcos (numero, categoria_id, lado, nivel, fila, columna)
select numero, categoria_id, lado, nivel, fila, columna
from palcos_semilla
on conflict (numero) do update
set
  categoria_id = excluded.categoria_id,
  lado = excluded.lado,
  nivel = excluded.nivel,
  fila = excluded.fila,
  columna = excluded.columna;

do $$
declare
  total_palcos integer;
  total_azules integer;
  total_amarillos integer;
  total_rojos integer;
  total_verdes integer;
begin
  select
    count(*)::integer,
    count(*) filter (where categoria_id = 'azul')::integer,
    count(*) filter (where categoria_id = 'amarillo')::integer,
    count(*) filter (where categoria_id = 'rojo')::integer,
    count(*) filter (where categoria_id = 'verde')::integer
  into
    total_palcos,
    total_azules,
    total_amarillos,
    total_rojos,
    total_verdes
  from public.palcos;

  if total_palcos <> 120
    or total_azules <> 24
    or total_amarillos <> 36
    or total_rojos <> 36
    or total_verdes <> 24 then
    raise exception
      'Seed inválido: se esperaban 120 palcos (24 azules, 36 amarillos, 36 rojos, 24 verdes), pero se encontraron % (% azules, % amarillos, % rojos, % verdes)',
      total_palcos,
      total_azules,
      total_amarillos,
      total_rojos,
      total_verdes;
  end if;
end
$$;
