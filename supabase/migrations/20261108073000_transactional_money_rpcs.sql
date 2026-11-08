create or replace function public.assert_authenticated_user()
returns uuid
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null
     or not exists (select 1 from public.usuarios where id = v_user_id) then
    raise exception 'Debes iniciar sesión con un usuario autorizado.';
  end if;

  return v_user_id;
end;
$$;

create or replace function public.separar_palco(
  p_palco smallint,
  p_comprador_id uuid,
  p_abono jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid := public.assert_authenticated_user();
  v_venta_id uuid := gen_random_uuid();
  v_precio bigint;
  v_categoria_id text;
  v_venta_existente uuid;
  v_pago_id uuid;
  v_monto bigint;
  v_fecha date;
  v_referencia text;
  v_comprobante_path text;
  v_nota text;
begin
  if p_comprador_id is null
     or not exists (select 1 from public.compradores where id = p_comprador_id) then
    raise exception 'El comprador indicado no existe.';
  end if;

  perform 1
  from public.compradores
  where id = p_comprador_id
  for update;

  select p.categoria_id
    into v_categoria_id
  from public.palcos p
  where p.numero = p_palco
  for update;

  if not found then
    raise exception 'El palco % no existe.', p_palco;
  end if;

  select c.precio
    into v_precio
  from public.categorias c
  where c.id = v_categoria_id;

  select v.id
    into v_venta_existente
  from public.ventas v
  where v.palco_numero = p_palco
    and v.estado = 'activa'
  for update;

  if found then
    raise exception 'El palco % ya fue separado por otra persona.', p_palco;
  end if;

  insert into public.ventas (
    id,
    palco_numero,
    comprador_id,
    estado,
    separado_por
  )
  values (
    v_venta_id,
    p_palco,
    p_comprador_id,
    'activa',
    v_usuario_id
  );

  if p_abono is not null then
    if jsonb_typeof(p_abono) <> 'object'
       or not (p_abono ? 'pago_id')
       or not (p_abono ? 'monto')
       or not (p_abono ? 'fecha_pago') then
      raise exception 'El abono debe incluir pago_id, monto y fecha_pago.';
    end if;

    if p_abono->>'pago_id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'El identificador del pago no es válido.';
    end if;
    if p_abono->>'monto' is null
       or p_abono->>'monto' !~ '^[0-9]+$' then
      raise exception 'El monto del abono no es válido.';
    end if;
    if p_abono->>'fecha_pago' is null
       or p_abono->>'fecha_pago' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      raise exception 'La fecha del pago no es válida.';
    end if;

    v_pago_id := (p_abono->>'pago_id')::uuid;
    v_monto := (p_abono->>'monto')::bigint;
    begin
      v_fecha := (p_abono->>'fecha_pago')::date;
    exception when others then
      raise exception 'La fecha del pago no es válida.';
    end;
    v_referencia := nullif(trim(p_abono->>'referencia'), '');
    v_comprobante_path := nullif(trim(p_abono->>'comprobante_path'), '');
    v_nota := nullif(trim(p_abono->>'nota'), '');

    if v_monto <= 0 then
      raise exception 'El monto del abono debe ser mayor que cero.';
    end if;
    if v_monto > v_precio then
      raise exception 'El abono no puede superar el precio del palco.';
    end if;
    if v_fecha > current_date then
      raise exception 'La fecha del pago no puede ser futura.';
    end if;
    if exists (select 1 from public.pagos where id = v_pago_id) then
      raise exception 'Ya existe un pago con ese identificador.';
    end if;

    insert into public.pagos (
      id,
      comprador_id,
      monto,
      fecha_pago,
      referencia,
      comprobante_path,
      nota,
      registrado_por
    )
    values (
      v_pago_id,
      p_comprador_id,
      v_monto,
      v_fecha,
      v_referencia,
      v_comprobante_path,
      v_nota,
      v_usuario_id
    );

    insert into public.pago_aplicaciones (pago_id, venta_id, monto)
    values (v_pago_id, v_venta_id, v_monto);

    insert into public.bitacora (
      usuario_id,
      accion,
      entidad,
      entidad_id,
      detalle
    )
    values (
      v_usuario_id,
      'registrar_pago',
      'pago',
      v_pago_id::text,
      jsonb_build_object(
        'comprador_id', p_comprador_id,
        'venta_id', v_venta_id,
        'monto', v_monto
      )
    );
  end if;

  insert into public.bitacora (
    usuario_id,
    accion,
    entidad,
    entidad_id,
    detalle
  )
  values (
    v_usuario_id,
    'separar',
    'venta',
    v_venta_id::text,
    jsonb_build_object(
      'palco', p_palco,
      'comprador_id', p_comprador_id,
      'abono_inicial', p_abono is not null
    )
  );

  return v_venta_id;
end;
$$;

create or replace function public.registrar_pago(
  p_pago_id uuid,
  p_comprador_id uuid,
  p_monto bigint,
  p_fecha date,
  p_referencia text,
  p_comprobante_path text,
  p_nota text,
  p_aplicaciones jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid := public.assert_authenticated_user();
  v_item jsonb;
  v_venta_id uuid;
  v_aplicacion_monto bigint;
  v_suma bigint := 0;
  v_venta_comprador uuid;
  v_venta_estado text;
  v_saldo bigint;
  v_precio bigint;
begin
  if p_pago_id is null then
    raise exception 'Debes indicar el identificador del pago.';
  end if;
  if exists (select 1 from public.pagos where id = p_pago_id) then
    raise exception 'Ya existe un pago con ese identificador.';
  end if;
  if p_comprador_id is null
     or not exists (select 1 from public.compradores where id = p_comprador_id) then
    raise exception 'El comprador indicado no existe.';
  end if;
  if p_monto is null or p_monto <= 0 then
    raise exception 'El monto del pago debe ser mayor que cero.';
  end if;
  if p_fecha is null then
    raise exception 'Debes indicar la fecha del pago.';
  end if;
  if p_fecha > current_date then
    raise exception 'La fecha del pago no puede ser futura.';
  end if;
  if p_aplicaciones is null
     or jsonb_typeof(p_aplicaciones) <> 'array'
     or jsonb_array_length(p_aplicaciones) = 0 then
    raise exception 'Debes indicar al menos una aplicación del pago.';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_aplicaciones) item
    group by item->>'venta_id'
    having count(*) > 1
  ) then
    raise exception 'Una venta no puede repetirse en las aplicaciones.';
  end if;

  perform 1
  from public.compradores
  where id = p_comprador_id
  for update;

  for v_item in select value from jsonb_array_elements(p_aplicaciones)
  loop
    if not (v_item ? 'venta_id') or not (v_item ? 'monto')
       or v_item->>'venta_id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'Cada aplicación debe incluir una venta_id válida y un monto.';
    end if;

    v_venta_id := (v_item->>'venta_id')::uuid;
    if v_item->>'monto' is null
       or v_item->>'monto' !~ '^[0-9]+$' then
      raise exception 'El monto de cada aplicación no es válido.';
    end if;
    v_aplicacion_monto := (v_item->>'monto')::bigint;
    if v_aplicacion_monto <= 0 then
      raise exception 'El monto de cada aplicación debe ser mayor que cero.';
    end if;

    select v.comprador_id, v.estado
      into v_venta_comprador, v_venta_estado
    from public.ventas v
    where v.id = v_venta_id
    for update;

    if not found then
      raise exception 'La venta indicada no existe.';
    end if;
    if v_venta_estado <> 'activa' then
      raise exception 'No se puede aplicar un pago a una venta que no está activa.';
    end if;
    if v_venta_comprador <> p_comprador_id then
      raise exception 'Todas las ventas del pago deben pertenecer al comprador.';
    end if;

    select c.precio
      into v_precio
    from public.ventas v
    join public.palcos p on p.numero = v.palco_numero
    join public.categorias c on c.id = p.categoria_id
    where v.id = v_venta_id;

    select v_precio - coalesce(sum(pa.monto) filter (where pg.anulado = false), 0)
      into v_saldo
    from public.pago_aplicaciones pa
    join public.pagos pg on pg.id = pa.pago_id
    where pa.venta_id = v_venta_id;

    if v_aplicacion_monto > v_saldo then
      raise exception 'El monto aplicado supera el saldo pendiente de la venta.';
    end if;

    v_suma := v_suma + v_aplicacion_monto;
  end loop;

  if v_suma <> p_monto then
    raise exception 'La suma de las aplicaciones debe ser igual al monto del pago.';
  end if;

  insert into public.pagos (
    id,
    comprador_id,
    monto,
    fecha_pago,
    referencia,
    comprobante_path,
    nota,
    registrado_por
  )
  values (
    p_pago_id,
    p_comprador_id,
    p_monto,
    p_fecha,
    nullif(trim(p_referencia), ''),
    nullif(trim(p_comprobante_path), ''),
    nullif(trim(p_nota), ''),
    v_usuario_id
  );

  insert into public.pago_aplicaciones (pago_id, venta_id, monto)
  select
    p_pago_id,
    (item->>'venta_id')::uuid,
    (item->>'monto')::bigint
  from jsonb_array_elements(p_aplicaciones) item;

  insert into public.bitacora (
    usuario_id,
    accion,
    entidad,
    entidad_id,
    detalle
  )
  values (
    v_usuario_id,
    'registrar_pago',
    'pago',
    p_pago_id::text,
    jsonb_build_object(
      'comprador_id', p_comprador_id,
      'monto', p_monto,
      'aplicaciones', p_aplicaciones
    )
  );

  return p_pago_id;
end;
$$;

create or replace function public.anular_pago(
  p_pago_id uuid,
  p_motivo text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid := public.assert_authenticated_user();
  v_pago public.pagos%rowtype;
  v_venta_id uuid;
  v_venta_estado text;
begin
  if p_motivo is null or length(trim(p_motivo)) = 0 then
    raise exception 'Debes indicar el motivo de la anulación.';
  end if;

  select *
    into v_pago
  from public.pagos
  where id = p_pago_id
  for update;

  if not found then
    raise exception 'El pago indicado no existe.';
  end if;
  if v_pago.anulado then
    raise exception 'El pago ya está anulado.';
  end if;

  for v_venta_id, v_venta_estado in
    select v.id, v.estado
    from public.pago_aplicaciones pa
    join public.ventas v on v.id = pa.venta_id
    where pa.pago_id = p_pago_id
    for update of v
  loop
    if v_venta_estado <> 'activa' then
      raise exception 'No se puede anular el pago porque una de sus ventas ya fue liberada.';
    end if;
  end loop;

  update public.pagos
  set
    anulado = true,
    anulado_motivo = trim(p_motivo),
    anulado_por = v_usuario_id,
    anulado_en = now()
  where id = p_pago_id;

  insert into public.bitacora (
    usuario_id,
    accion,
    entidad,
    entidad_id,
    detalle
  )
  values (
    v_usuario_id,
    'anular_pago',
    'pago',
    p_pago_id::text,
    jsonb_build_object('motivo', trim(p_motivo))
  );
end;
$$;

create or replace function public.liberar_palco(
  p_venta_id uuid,
  p_motivo text,
  p_devolucion_id uuid,
  p_fecha_devolucion date,
  p_referencia text,
  p_comprobante_path text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid := public.assert_authenticated_user();
  v_venta public.ventas%rowtype;
  v_abonado bigint;
begin
  if p_motivo is null or length(trim(p_motivo)) = 0 then
    raise exception 'Debes indicar el motivo de la liberación.';
  end if;
  if p_devolucion_id is null then
    raise exception 'Debes indicar el identificador de la devolución.';
  end if;
  if p_fecha_devolucion > current_date then
    raise exception 'La fecha de devolución no puede ser futura.';
  end if;

  select *
    into v_venta
  from public.ventas
  where id = p_venta_id
  for update;

  if not found then
    raise exception 'La venta indicada no existe.';
  end if;
  if v_venta.estado <> 'activa' then
    raise exception 'El palco ya fue liberado.';
  end if;
  if exists (select 1 from public.devoluciones where id = p_devolucion_id) then
    raise exception 'Ya existe una devolución con ese identificador.';
  end if;

  select coalesce(sum(pa.monto) filter (where pg.anulado = false), 0)
    into v_abonado
  from public.pago_aplicaciones pa
  join public.pagos pg on pg.id = pa.pago_id
  where pa.venta_id = p_venta_id;

  insert into public.devoluciones (
    id,
    venta_id,
    monto,
    fecha_devolucion,
    referencia,
    comprobante_path,
    registrado_por
  )
  values (
    p_devolucion_id,
    p_venta_id,
    v_abonado,
    p_fecha_devolucion,
    nullif(trim(p_referencia), ''),
    nullif(trim(p_comprobante_path), ''),
    v_usuario_id
  );

  update public.ventas
  set
    estado = 'liberada',
    liberado_en = now(),
    liberado_por = v_usuario_id,
    motivo_liberacion = trim(p_motivo)
  where id = p_venta_id;

  insert into public.bitacora (
    usuario_id,
    accion,
    entidad,
    entidad_id,
    detalle
  )
  values (
    v_usuario_id,
    'liberar',
    'venta',
    p_venta_id::text,
    jsonb_build_object(
      'devolucion_id', p_devolucion_id,
      'monto_devolucion', v_abonado,
      'motivo', trim(p_motivo)
    )
  );
end;
$$;

create or replace function public.registrar_bitacora_comprador()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.bitacora (
    usuario_id,
    accion,
    entidad,
    entidad_id,
    detalle
  )
  values (
    auth.uid(),
    case when tg_op = 'INSERT' then 'crear_comprador' else 'editar_comprador' end,
    'comprador',
    coalesce(new.id, old.id)::text,
    jsonb_build_object(
      'operacion', tg_op,
      'nombre', coalesce(new.nombre, old.nombre),
      'apellido', coalesce(new.apellido, old.apellido)
    )
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists compradores_bitacora on public.compradores;
create trigger compradores_bitacora
after insert or update on public.compradores
for each row execute function public.registrar_bitacora_comprador();

revoke all on function public.assert_authenticated_user() from public;
revoke all on function public.separar_palco(smallint, uuid, jsonb) from public;
revoke all on function public.registrar_pago(uuid, uuid, bigint, date, text, text, text, jsonb) from public;
revoke all on function public.anular_pago(uuid, text) from public;
revoke all on function public.liberar_palco(uuid, text, uuid, date, text, text) from public;
revoke all on function public.registrar_bitacora_comprador() from public;

grant execute on function public.separar_palco(smallint, uuid, jsonb) to authenticated;
grant execute on function public.registrar_pago(uuid, uuid, bigint, date, text, text, text, jsonb) to authenticated;
grant execute on function public.anular_pago(uuid, text) to authenticated;
grant execute on function public.liberar_palco(uuid, text, uuid, date, text, text) to authenticated;
