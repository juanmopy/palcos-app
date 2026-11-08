drop policy if exists "Usuarios pueden leer su propio usuario" on public.usuarios;

create or replace function public.usuario_autorizado()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.usuarios
    where id = auth.uid()
  );
$$;

revoke all on function public.usuario_autorizado() from public;
grant execute on function public.usuario_autorizado() to authenticated;

create policy "Usuarios autenticados pueden leer usuarios"
  on public.usuarios for select to authenticated
  using (public.usuario_autorizado());
