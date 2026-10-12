"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

type Department = {
  id: number;
  name: string;
  code: string;
  description: string;
  department_head: string;
  is_active: boolean;
  employee_count: number;
  created_at?: string;
  updated_at?: string;
};

type DepartmentForm = {
  name: string;
  code: string;
  description: string;
  department_head: string;
  is_active: boolean;
};

const emptyForm: DepartmentForm = {
  name: "",
  code: "",
  description: "",
  department_head: "",
  is_active: true,
};

export default function DepartmentsPage() {
  const router = useRouter();

  const accessToken = useAuthStore((state) => state.accessToken);

  const [hydrated, setHydrated] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );

  const [viewingDepartment, setViewingDepartment] = useState<Department | null>(
    null,
  );

  const [deleteDepartment, setDeleteDepartment] = useState<Department | null>(
    null,
  );

  const [form, setForm] = useState<DepartmentForm>(emptyForm);

  const [search, setSearch] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Zustand hydration
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    return unsubscribe;
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Load Departments
  |--------------------------------------------------------------------------
  */

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/departments/");

      setDepartments(response.data);
    } catch (error: any) {
      console.error("Failed to load departments:", error);

      if (error?.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(
          error?.response?.data?.detail || "Failed to load departments.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    loadDepartments();
  }, [hydrated, accessToken, router]);

  /*
  |--------------------------------------------------------------------------
  | Form Helpers
  |--------------------------------------------------------------------------
  */

  const updateForm = (field: keyof DepartmentForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Open Create Form
  |--------------------------------------------------------------------------
  */

  const openCreateForm = () => {
    setEditingDepartment(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Open Edit Form
  |--------------------------------------------------------------------------
  */

  const openEditForm = (department: Department) => {
    setEditingDepartment(department);

    setForm({
      name: department.name,
      code: department.code,
      description: department.description || "",
      department_head: department.department_head || "",
      is_active: department.is_active,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Close Form
  |--------------------------------------------------------------------------
  */

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingDepartment(null);
    setForm(emptyForm);
    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Create / Update Department
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        department_head: form.department_head.trim(),
        is_active: form.is_active,
      };

      if (!payload.name || !payload.code) {
        setError("Department name and code are required.");
        setSaving(false);
        return;
      }

      if (editingDepartment) {
        const response = await api.patch(
          `/departments/${editingDepartment.id}/`,
          payload,
        );

        setDepartments((current) =>
          current.map((department) =>
            department.id === editingDepartment.id ? response.data : department,
          ),
        );

        setSuccess("Department updated successfully.");
      } else {
        const response = await api.post("/departments/", payload);

        setDepartments((current) => [...current, response.data]);

        setSuccess("Department created successfully.");
      }

      setForm(emptyForm);
      setEditingDepartment(null);
      setShowForm(false);
    } catch (error: any) {
      console.error("Failed to save department:", error);

      if (error?.response?.status === 400) {
        const data = error.response.data;

        const messages = Object.entries(data)
          .map(([field, message]) => {
            const value = Array.isArray(message)
              ? message.join(", ")
              : String(message);

            return `${field}: ${value}`;
          })
          .join(" | ");

        setError(messages || "Invalid department information.");
      } else if (error?.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(error?.response?.data?.detail || "Failed to save department.");
      }
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Department
  |--------------------------------------------------------------------------
  */

  const handleDelete = async () => {
    if (!deleteDepartment) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      await api.delete(`/departments/${deleteDepartment.id}/`);

      setDepartments((current) =>
        current.filter((department) => department.id !== deleteDepartment.id),
      );

      setSuccess(`${deleteDepartment.name} deleted successfully.`);

      setDeleteDepartment(null);
    } catch (error: any) {
      console.error("Failed to delete department:", error);

      if (error?.response?.status === 400) {
        setError(
          error?.response?.data?.detail || "This department cannot be deleted.",
        );
      } else if (error?.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(
          error?.response?.data?.detail || "Failed to delete department.",
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return departments;
    }

    return departments.filter(
      (department) =>
        department.name.toLowerCase().includes(query) ||
        department.code.toLowerCase().includes(query) ||
        department.department_head?.toLowerCase().includes(query),
    );
  }, [departments, search]);

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const totalDepartments = departments.length;

  const activeDepartments = departments.filter(
    (department) => department.is_active,
  ).length;

  const inactiveDepartments = totalDepartments - activeDepartments;

  const totalEmployees = departments.reduce(
    (total, department) => total + Number(department.employee_count || 0),
    0,
  );

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (!hydrated || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-[0.3em] text-cyan-400">
            NEXORA
          </p>

          <p className="mt-3 text-slate-400">
            {hydrated ? "Loading departments..." : "Checking authentication..."}
          </p>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Page
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-cyan-400">
              NEXORA
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Departments
            </h1>

            <p className="mt-2 text-slate-400">
              Manage departments and organizational information.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            + Add Department
          </button>
        </div>

        {/* Alerts */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* Statistics */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total Departments</p>

            <p className="mt-2 text-3xl font-bold">{totalDepartments}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Active Departments</p>

            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {activeDepartments}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Inactive Departments</p>

            <p className="mt-2 text-3xl font-bold text-red-400">
              {inactiveDepartments}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total Employees</p>

            <p className="mt-2 text-3xl font-bold text-cyan-400">
              {totalEmployees}
            </p>
          </div>
        </div>

        {/* Search */}

        <div className="mb-6 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            placeholder="Search departments, codes or heads..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300 transition hover:bg-slate-800"
            >
              Clear
            </button>
          )}
        </div>

        {/* Department Cards */}

        {filteredDepartments.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredDepartments.map((department) => (
              <div
                key={department.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl transition hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{department.name}</h2>

                    <p className="mt-1 text-sm font-medium text-cyan-400">
                      {department.code}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      department.is_active
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {department.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-5">
                  <p className="min-h-[48px] text-sm leading-6 text-slate-400">
                    {department.description || "No description available."}
                  </p>
                </div>

                <div className="mt-5 space-y-3 border-t border-slate-800 pt-5">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-400">Department Head</span>

                    <span className="text-right text-white">
                      {department.department_head || "-"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Employees</span>

                    <span className="font-semibold text-cyan-400">
                      {department.employee_count}
                    </span>
                  </div>
                </div>

                {/* Actions */}

                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingDepartment(department)}
                    className="flex-1 rounded-xl border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                  >
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditForm(department)}
                    className="flex-1 rounded-xl border border-cyan-500/30 px-3 py-2 text-sm font-medium text-cyan-400 transition hover:bg-cyan-500/10"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteDepartment(department)}
                    className="flex-1 rounded-xl border border-red-500/30 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <p className="text-lg font-semibold">No departments found</p>

            <p className="mt-2 text-sm text-slate-400">
              Try another search or create a new department.
            </p>
          </div>
        )}

        {/* Create / Edit Modal */}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
                <div>
                  <h2 className="text-xl font-semibold">
                    {editingDepartment ? "Edit Department" : "Add Department"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {editingDepartment
                      ? "Update department information."
                      : "Create a new organizational department."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-6">
                {/* Name */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Department Name
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="e.g. Computer Science"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  />
                </div>

                {/* Code */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Department Code
                  </label>

                  <input
                    type="text"
                    value={form.code}
                    onChange={(event) =>
                      updateForm("code", event.target.value.toUpperCase())
                    }
                    placeholder="e.g. CSE"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 uppercase text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  />
                </div>

                {/* Department Head */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Department Head
                  </label>

                  <input
                    type="text"
                    value={form.department_head}
                    onChange={(event) =>
                      updateForm("department_head", event.target.value)
                    }
                    placeholder="e.g. Dr. John Smith"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  />
                </div>

                {/* Description */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="Enter department description..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  />
                </div>

                {/* Active */}

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      updateForm("is_active", event.target.checked)
                    }
                    className="h-4 w-4 accent-cyan-400"
                  />

                  <div>
                    <p className="text-sm font-medium text-white">
                      Active Department
                    </p>

                    <p className="text-xs text-slate-500">
                      Allow this department to remain active.
                    </p>
                  </div>
                </label>

                {/* Form Error */}

                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {/* Buttons */}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingDepartment
                        ? "Update Department"
                        : "Create Department"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}

        {viewingDepartment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
                <div>
                  <p className="text-sm font-medium text-cyan-400">
                    Department Details
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    {viewingDepartment.name}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingDepartment(null)}
                  className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">Department Name</p>

                    <p className="mt-1 font-medium">{viewingDepartment.name}</p>
                  </div>

                  <div className="rounded-xl bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">Code</p>

                    <p className="mt-1 font-medium text-cyan-400">
                      {viewingDepartment.code}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">Department Head</p>

                    <p className="mt-1 font-medium">
                      {viewingDepartment.department_head || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">Employees</p>

                    <p className="mt-1 font-medium text-cyan-400">
                      {viewingDepartment.employee_count}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs text-slate-500">Status</p>

                  <p
                    className={`mt-1 font-medium ${
                      viewingDepartment.is_active
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {viewingDepartment.is_active ? "Active" : "Inactive"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs text-slate-500">Description</p>

                  <p className="mt-2 leading-6 text-slate-300">
                    {viewingDepartment.description ||
                      "No description available."}
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setViewingDepartment(null)}
                    className="rounded-xl bg-slate-800 px-5 py-3 font-medium text-white transition hover:bg-slate-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}

        {deleteDepartment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-xl text-red-400">
                  !
                </div>

                <h2 className="text-xl font-semibold">Delete Department?</h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-white">
                    {deleteDepartment.name}
                  </span>
                  ?
                </p>

                {deleteDepartment.employee_count > 0 && (
                  <p className="mt-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
                    This department currently has{" "}
                    {deleteDepartment.employee_count} employee
                    {deleteDepartment.employee_count === 1 ? "" : "s"}.
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteDepartment(null)}
                  disabled={deleting}
                  className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete Department"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
