alter table public.usuarios
add column email_login text unique;

comment on column public.usuarios.email_login is
  'Correo interno de Supabase Auth usado para iniciar sesión; nunca se muestra en la UI.';

create or replace function public.obtener_usuarios_login()
returns table (
  id uuid,
  nombre text,
  iniciales text,
  color_avatar text,
  orden smallint,
  email_login text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    u.id,
    u.nombre,
    u.iniciales,
    u.color_avatar,
    u.orden,
    u.email_login
  from public.usuarios u
  where u.email_login is not null
  order by u.orden, u.nombre;
$$;

revoke all on function public.obtener_usuarios_login() from public;
grant execute on function public.obtener_usuarios_login() to anon, authenticated;
