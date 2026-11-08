"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems } from "@/components/layout/nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_12px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg px-1 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none ${
                isActive
                  ? "text-blue-800"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <Icon aria-hidden="true" size={21} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
