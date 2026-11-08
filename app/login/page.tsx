import { LoginForm, type LoginUser } from "@/components/auth/login-form";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function LoginPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("obtener_usuarios_login");

  const users: LoginUser[] = data ?? [];
  const initialErrorMessage = error
    ? "No se pudieron cargar las personas. Verifica la configuración de Supabase."
    : null;

  return <LoginForm users={users} initialErrorMessage={initialErrorMessage} />;
}
