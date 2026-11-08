import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { RealtimeProvider } from "@/components/realtime/realtime-provider";
import { OfflineProvider } from "@/components/pwa/offline-banner";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: activeUser } = user
    ? await supabase
        .from("usuarios")
        .select("nombre, iniciales, color_avatar")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <OfflineProvider>
      <RealtimeProvider>
        <div className="min-h-screen bg-slate-50">
          <AppHeader activeUser={activeUser} />
          <AppSidebar />
          <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-screen-2xl px-4 py-6 pb-24 sm:px-6 lg:ml-64 lg:px-8 lg:pb-8">
            {children}
          </main>
          <BottomNav />
        </div>
      </RealtimeProvider>
    </OfflineProvider>
  );
}
