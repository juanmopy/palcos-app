create or replace function public.separar_palco_con_comprador(
  p_palco smallint,
  p_nombre text,
  p_apellido text,
  p_documento text,
  p_telefono text,
  p_recomendado_por text,
  p_abono jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid := public.assert_authenticated_user();
  v_comprador_id uuid;
begin
  insert into public.compradores (
    nombre,
    apellido,
    documento,
    telefono,
    recomendado_por,
    created_by
  )
  values (
    p_nombre,
    p_apellido,
    p_documento,
    '+57' || p_telefono,
    nullif(trim(p_recomendado_por), ''),
    v_usuario_id
  )
  returning id into v_comprador_id;

  return public.separar_palco(p_palco, v_comprador_id, p_abono);
end;
$$;

revoke all on function public.separar_palco_con_comprador(
  smallint, text, text, text, text, text, jsonb
) from public;

grant execute on function public.separar_palco_con_comprador(
  smallint, text, text, text, text, text, jsonb
) to authenticated;
