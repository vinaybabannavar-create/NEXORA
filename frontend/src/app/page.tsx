"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

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
      router.push("/login");
      return;
    }

    api
      .get("/auth/me/")
      .then((response) => {
        setUser(response.data);
      })
      .catch((error) => {
        console.error("Failed to load user:", error);

        clearAuth();
        router.push("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [accessToken, clearAuth, router]);

  const handleLogout = async () => {
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
      router.push("/login");
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

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.3em] text-cyan-400">
              NEXORA
            </p>

            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Enterprise Operations & Intelligence
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">
              A modular enterprise platform for workflows, realtime
              collaboration, analytics, automation and AI-powered intelligence.
            </p>
          </div>

          {/* User Card */}
          <div className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl lg:w-auto lg:min-w-[300px]">
            {user && (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {user.first_name} {user.last_name}
                    </p>

                    <p className="mt-1 break-all text-sm text-slate-400">
                      {user.email}
                    </p>
                  </div>

                  <div className="rounded-full border border-cyan-900 bg-cyan-950/40 px-3 py-1">
                    <span className="text-xs font-semibold text-cyan-400">
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
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

        {/* Main Modules */}
        <section className="grid gap-5 md:grid-cols-3">
          {/* Identity */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-200 hover:border-cyan-900 hover:bg-slate-900/80">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-950/50 text-cyan-400">
              🔐
            </div>

            <h2 className="text-xl font-semibold">Identity</h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Email authentication, JWT security, user accounts, roles and
              authorization.
            </p>
          </div>

          {/* Operations */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-200 hover:border-cyan-900 hover:bg-slate-900/80">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-950/50 text-cyan-400">
              ⚙️
            </div>

            <h2 className="text-xl font-semibold">Operations</h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Projects, tasks, customers, employees and enterprise support
              workflows.
            </p>
          </div>

          {/* Intelligence */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-200 hover:border-cyan-900 hover:bg-slate-900/80">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-950/50 text-cyan-400">
              🤖
            </div>

            <h2 className="text-xl font-semibold">Intelligence</h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              AI, RAG, document intelligence, analytics and intelligent
              automation.
            </p>
          </div>
        </section>

        {/* Account Information */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="flex flex-col gap-2 border-b border-slate-800 pb-5">
            <h2 className="text-xl font-semibold">Account Information</h2>

            <p className="text-sm text-slate-500">
              Your NEXORA employee profile information.
            </p>
          </div>

          {user && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Employee ID */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Employee ID
                </p>

                <p className="mt-2 text-sm font-medium text-slate-200">
                  {user.employee_id || "Not assigned"}
                </p>
              </div>

              {/* Department */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Department
                </p>

                <p className="mt-2 text-sm font-medium text-slate-200">
                  {user.department || "Not assigned"}
                </p>
              </div>

              {/* Job Title */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Job Title
                </p>

                <p className="mt-2 text-sm font-medium text-slate-200">
                  {user.job_title || "Not assigned"}
                </p>
              </div>

              {/* Role */}
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

        {/* System Status */}
        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Authentication</h2>

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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Enterprise Platform</h2>

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

        {/* Footer */}
        <footer className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
          NEXORA Enterprise Operations & Intelligence Platform
        </footer>
      </div>
    </main>
  );
}
