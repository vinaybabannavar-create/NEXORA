"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

const navigation = [
  { label: "Dashboard", href: "/", icon: "▦" },
  { label: "Customers", href: "/customers", icon: "♙" },
  { label: "Employees", href: "/employees", icon: "♧" },
  { label: "Departments", href: "/departments", icon: "▤" },
  { label: "Projects", href: "/projects", icon: "◈" },
  { label: "Documents & AI", href: "/documents", icon: "✧" },
  { label: "Support", href: "/support", icon: "◉" },
];

type WorkspaceLayoutProps = {
  children: ReactNode;
};

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const clear = useAuthStore((state) => state.clear);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const { api } = await import("@/lib/api");

      try {
        await api.post("/auth/logout/");
      } catch {
        // Always clear local authentication, even if the server is unavailable.
      }
    } finally {
      clear();
      router.replace("/login");
    }
  };

  const currentPage =
    navigation.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    )?.label ?? "Workspace";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-900 transition-transform duration-200 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-3 border-b border-slate-800 px-6 py-6"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-xl font-black text-slate-950">
            N
          </span>
          <span>
            <span className="block text-xl font-bold tracking-wide text-white">
              NEXORA
            </span>
            <span className="text-xs text-slate-400">Enterprise Workspace</span>
          </span>
        </Link>

        <div className="px-5 pb-2 pt-7 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Workspace
        </div>

        <nav
          aria-label="Main navigation"
          className="flex-1 space-y-1 overflow-y-auto px-3"
        >
          {navigation.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center text-lg">
                  {item.icon}
                </span>
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-300" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 rounded-xl bg-slate-800/70 p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-slate-300">
                Workspace navigation
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Access your enterprise modules from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="w-full rounded-xl border border-slate-700 px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
          >
            {loggingOut ? "Signing out..." : "↪  Sign out"}
          </button>
        </div>
      </aside>

      <div className="min-h-screen md:pl-72">
        <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg border border-slate-700 px-3 py-2 text-slate-200 hover:bg-slate-800 md:hidden"
            >
              ☰
            </button>

            <div className="min-w-0">
              <p className="truncate text-xs text-slate-500">
                NEXORA / Workspace
              </p>
              <h1 className="truncate text-lg font-semibold text-white sm:text-xl">
                {currentPage}
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-2 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-300">Enterprise workspace</span>
          </div>
        </header>

        <main className="min-w-0 w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="mx-auto w-full max-w-[1600px] min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
