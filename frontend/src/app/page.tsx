"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import WorkspaceLayout from "@/components/WorkspaceLayout";

type User = {
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  role: string;
  department: string | null;
  job_title: string | null;
};

export default function Home() {
  const router = useRouter();

  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearAuth = useAuthStore((state) => state.clear);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    let cancelled = false;

    api
      .get("/auth/me/")
      .then((response) => {
        if (!cancelled) {
          setUser(response.data);
        }
      })
      .catch((error) => {
        if (cancelled) return;

        console.error("Failed to load user:", error);
        clearAuth();
        router.replace("/login");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, clearAuth, router]);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      if (refreshToken) {
        await api.post("/auth/logout/", {
          refresh: refreshToken,
        });
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      clearAuth();
      router.replace("/login");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-[0.25em] text-cyan-400">
            NEXORA
          </p>
          <p className="mt-3 text-slate-400">Loading NEXORA...</p>
        </div>
      </main>
    );
  }

  if (!accessToken) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-sm text-slate-400">Redirecting to login...</p>
      </main>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.3em] text-cyan-400">
              NEXORA
            </p>

            <h2 className="mt-2 text-3xl font-bold md:text-4xl">
              Enterprise Operations & Intelligence
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">
              A modular enterprise platform for workflows, realtime
              collaboration, analytics, automation and AI-powered intelligence.
            </p>
          </div>

          <div className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl lg:w-auto lg:min-w-[300px]">
            {user && (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-white">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="mt-1 break-all text-sm text-slate-400">
                      {user.email}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-cyan-900 bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-400">
                    {user.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-5 w-full rounded-xl border border-red-900 bg-red-950/40 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </>
            )}
          </div>
        </header>

        <section
          aria-label="Main platform modules"
          className="grid gap-5 md:grid-cols-3"
        >
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-200 hover:border-cyan-900 hover:bg-slate-900/80">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-950/50 text-xl text-cyan-400">
              🔐
            </div>
            <h3 className="text-xl font-semibold">Identity</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Email authentication, JWT security, user accounts, roles and
              authorization.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-200 hover:border-cyan-900 hover:bg-slate-900/80">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-950/50 text-xl text-cyan-400">
              ⚙️
            </div>
            <h3 className="text-xl font-semibold">Operations</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Projects, tasks, customers, employees and enterprise support
              workflows.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-200 hover:border-cyan-900 hover:bg-slate-900/80">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-950/50 text-xl text-cyan-400">
              🤖
            </div>
            <h3 className="text-xl font-semibold">Intelligence</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              AI, RAG, document intelligence, analytics and intelligent
              automation.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="flex flex-col gap-2 border-b border-slate-800 pb-5">
            <h3 className="text-xl font-semibold">Account Information</h3>
            <p className="text-sm text-slate-500">
              Your NEXORA employee profile information.
            </p>
          </div>

          {user && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Employee ID
                </p>
                <p className="mt-2 text-sm font-medium text-slate-200">
                  {user.employee_id || "Not assigned"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Department
                </p>
                <p className="mt-2 text-sm font-medium text-slate-200">
                  {user.department || "Not assigned"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Job Title
                </p>
                <p className="mt-2 text-sm font-medium text-slate-200">
                  {user.job_title || "Not assigned"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Role
                </p>
                <p className="mt-2 text-sm font-semibold text-cyan-400">
                  {user.role}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">Authentication</h3>
                <p className="mt-1 text-sm text-slate-500">
                  JWT authentication service
                </p>
              </div>
              <span className="rounded-full border border-emerald-900 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-400">
                Connected
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">Enterprise Platform</h3>
                <p className="mt-1 text-sm text-slate-500">
                  NEXORA core services
                </p>
              </div>
              <span className="rounded-full border border-cyan-900 bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-400">
                Online
              </span>
            </div>
          </div>
        </section>

        <footer className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
          NEXORA Enterprise Operations & Intelligence Platform
        </footer>
      </div>
    </WorkspaceLayout>
  );
}
