-- Ejecutar en una transacción. Usa el primer usuario existente como actor y
-- revierte todos los datos al final. Requiere categorías y palcos sembrados.
begin;

do $$
declare
  v_usuario_id uuid;
  v_comprador_id uuid := gen_random_uuid();
  v_comprador_id_2 uuid := gen_random_uuid();
  v_venta_1 uuid;
  v_venta_2 uuid;
  v_pago_1 uuid := gen_random_uuid();
  v_pago_2 uuid := gen_random_uuid();
  v_pago_3 uuid := gen_random_uuid();
  v_devolucion_id uuid := gen_random_uuid();
  v_devolucion_id_2 uuid := gen_random_uuid();
  v_precio bigint;
  v_monto_mitad bigint;
  v_error text;
  v_devolucion_monto bigint;
begin
  select id into v_usuario_id from public.usuarios order by orden, nombre limit 1;
  if v_usuario_id is null then
    raise exception 'El test necesita al menos un usuario en public.usuarios.';
  end if;

  perform set_config('request.jwt.claim.sub', v_usuario_id::text, true);

  insert into public.compradores (
    id, nombre, apellido, documento, telefono, created_by
  )
  values
    (v_comprador_id, 'Prueba', 'RPC', 'TEST-RPC-1', '3000000001', v_usuario_id),
    (v_comprador_id_2, 'Prueba', 'RPC Dos', 'TEST-RPC-2', '3000000002', v_usuario_id);

  select c.precio, c.precio / 2
    into v_precio, v_monto_mitad
  from public.palcos p
  join public.categorias c on c.id = p.categoria_id
  where p.numero = 1;

  -- Separar dos veces el mismo palco debe fallar.
  v_venta_1 := public.separar_palco(1, v_comprador_id);
  begin
    perform public.separar_palco(1, v_comprador_id_2);
    raise exception 'El test de doble separación no falló.';
  exception when others then
    v_error := sqlerrm;
    if v_error not like 'El palco 1 ya fue separado%' then
      raise exception 'Mensaje inesperado para doble separación: %', v_error;
    end if;
  end;

  -- Registrar un pago con sobrepago debe fallar.
  begin
    perform public.registrar_pago(
      v_pago_1,
      v_comprador_id,
      v_precio + 1,
      current_date,
      null,
      null,
      null,
      jsonb_build_array(jsonb_build_object('venta_id', v_venta_1, 'monto', v_precio + 1))
    );
    raise exception 'El test de sobrepago no falló.';
  exception when others then
    v_error := sqlerrm;
    if v_error not like 'El monto aplicado supera el saldo%' then
      raise exception 'Mensaje inesperado para sobrepago: %', v_error;
    end if;
  end;

  -- Separar un segundo palco y repartir un pago entre ambos.
  v_venta_2 := public.separar_palco(2, v_comprador_id);
  perform public.registrar_pago(
    v_pago_1,
    v_comprador_id,
    v_monto_mitad * 2,
    current_date,
    'TEST-REPARTO',
    null,
    null,
    jsonb_build_array(
      jsonb_build_object('venta_id', v_venta_1, 'monto', v_monto_mitad),
      jsonb_build_object('venta_id', v_venta_2, 'monto', v_monto_mitad)
    )
  );

  if (select count(*) from public.pago_aplicaciones where pago_id = v_pago_1) <> 2 then
    raise exception 'El pago repartido no tiene dos aplicaciones.';
  end if;

  -- Completar el primer palco al 100%.
  perform public.registrar_pago(
    v_pago_2,
    v_comprador_id,
    v_precio - v_monto_mitad,
    current_date,
    'TEST-100',
    null,
    null,
    jsonb_build_array(
      jsonb_build_object('venta_id', v_venta_1, 'monto', v_precio - v_monto_mitad)
    )
  );

  if not exists (
    select 1
    from public.v_palcos
    where venta_id = v_venta_1 and porcentaje = 100 and estado = 'pagado'
  ) then
    raise exception 'El palco no llegó al 100%%.';
  end if;

  -- Anular el pago repartido mientras sus ventas siguen activas.
  perform public.anular_pago(v_pago_1, 'Prueba de anulación');
  if not (select anulado from public.pagos where id = v_pago_1) then
    raise exception 'El pago no quedó anulado.';
  end if;

  -- Liberar el segundo palco crea una devolución por el abonado vigente ($0 tras anular).
  perform public.liberar_palco(
    v_venta_2,
    'Prueba de liberación',
    v_devolucion_id,
    current_date,
    'TEST-DEVOLUCION',
    null
  );

  select monto into v_devolucion_monto
  from public.devoluciones
  where id = v_devolucion_id;
  if v_devolucion_monto <> 0 then
    raise exception 'La devolución esperada era $0 y fue $.', v_devolucion_monto;
  end if;

  -- Un pago asociado a una venta liberada no puede anularse después.
  v_venta_2 := public.separar_palco(3, v_comprador_id);
  perform public.registrar_pago(
    v_pago_3,
    v_comprador_id,
    v_monto_mitad,
    current_date,
    'TEST-LIBERADA',
    null,
    null,
    jsonb_build_array(
      jsonb_build_object('venta_id', v_venta_2, 'monto', v_monto_mitad)
    )
  );
  perform public.liberar_palco(
    v_venta_2,
    'Prueba de bloqueo de anulación',
    v_devolucion_id_2,
    current_date,
    null,
    null
  );
  begin
    perform public.anular_pago(v_pago_3, 'No debe permitirse');
    raise exception 'El test de anulación de una venta liberada no falló.';
  exception when others then
    v_error := sqlerrm;
    if v_error not like 'No se puede anular el pago%' then
      raise exception 'Mensaje inesperado para anulación de venta liberada: %', v_error;
    end if;
  end;
end;
$$;

rollback;
