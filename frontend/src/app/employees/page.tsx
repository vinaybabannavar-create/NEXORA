"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

type Employee = {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: number;
  department_name: string;
  job_title: string;
  phone_number: string;
  is_active: boolean;
};

type EmployeeForm = {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  job_title: string;
  phone_number: string;
  is_active: boolean;
};

const emptyForm: EmployeeForm = {
  employee_id: "",
  first_name: "",
  last_name: "",
  email: "",
  department: "",
  job_title: "",
  phone_number: "",
  is_active: true,
};

export default function EmployeesPage() {
  const router = useRouter();

  const accessToken = useAuthStore((state) => state.accessToken);

  const [hydrated, setHydrated] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);

  const [form, setForm] = useState<EmployeeForm>(emptyForm);

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
  | Load Employees
  |--------------------------------------------------------------------------
  */

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/employees/");

      setEmployees(response.data);
    } catch (error: any) {
      console.error("Failed to load employees:", error);

      if (error?.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(error?.response?.data?.detail || "Failed to load employees.");
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

    loadEmployees();
  }, [hydrated, accessToken, router]);

  /*
  |--------------------------------------------------------------------------
  | Form Helpers
  |--------------------------------------------------------------------------
  */

  const updateForm = (field: keyof EmployeeForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEmployee(null);
    setForm(emptyForm);
    setError("");
  };

  const openCreateForm = () => {
    setEditingEmployee(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (employee: Employee) => {
    setEditingEmployee(employee);

    setForm({
      employee_id: employee.employee_id || "",
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      email: employee.email || "",
      department: employee.department ? String(employee.department) : "",
      job_title: employee.job_title || "",
      phone_number: employee.phone_number || "",
      is_active: employee.is_active,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Error Formatter
  |--------------------------------------------------------------------------
  */

  const getErrorMessage = (error: any) => {
    const data = error?.response?.data;

    if (!data) {
      return "Something went wrong. Please try again.";
    }

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (typeof data === "string") {
      return data;
    }

    if (typeof data === "object") {
      const messages = Object.entries(data)
        .map(([field, message]) => {
          const formattedMessage = Array.isArray(message)
            ? message.join(", ")
            : String(message);

          return `${field}: ${formattedMessage}`;
        })
        .join(" | ");

      if (messages) {
        return messages;
      }
    }

    return "Something went wrong. Please try again.";
  };

  /*
  |--------------------------------------------------------------------------
  | Create / Update Employee
  |--------------------------------------------------------------------------
  */

  const handleSubmitEmployee = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingEmployee) {
        const response = await api.patch(
          `/employees/${editingEmployee.id}/`,
          form,
        );

        setEmployees((current) =>
          current.map((employee) =>
            employee.id === editingEmployee.id ? response.data : employee,
          ),
        );

        setSuccess("Employee updated successfully.");
      } else {
        const response = await api.post("/employees/", form);

        setEmployees((current) => [...current, response.data]);

        setSuccess("Employee created successfully.");
      }

      setForm(emptyForm);
      setEditingEmployee(null);
      setShowForm(false);
    } catch (error: any) {
      console.error("Failed to save employee:", error);

      setError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Employee
  |--------------------------------------------------------------------------
  */

  const handleDeleteEmployee = async () => {
    if (!deleteEmployee) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      await api.delete(`/employees/${deleteEmployee.id}/`);

      setEmployees((current) =>
        current.filter((employee) => employee.id !== deleteEmployee.id),
      );

      setSuccess(
        `${deleteEmployee.first_name} ${deleteEmployee.last_name} was deleted successfully.`,
      );

      setDeleteEmployee(null);
    } catch (error: any) {
      console.error("Failed to delete employee:", error);

      setError(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return employees;
    }

    return employees.filter((employee) => {
      const fullName =
        `${employee.first_name} ${employee.last_name}`.toLowerCase();

      return (
        employee.employee_id?.toLowerCase().includes(query) ||
        fullName.includes(query) ||
        employee.email?.toLowerCase().includes(query) ||
        employee.department_name?.toLowerCase().includes(query) ||
        employee.job_title?.toLowerCase().includes(query) ||
        employee.phone_number?.toLowerCase().includes(query)
      );
    });
  }, [employees, search]);

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const activeEmployees = employees.filter(
    (employee) => employee.is_active,
  ).length;

  const inactiveEmployees = employees.filter(
    (employee) => !employee.is_active,
  ).length;

  /*
  |--------------------------------------------------------------------------
  | Loading Screen
  |--------------------------------------------------------------------------
  */

  if (!hydrated || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-[0.25em] text-cyan-400">
            NEXORA
          </p>

          <p className="mt-3 text-slate-400">
            {hydrated ? "Loading employees..." : "Checking authentication..."}
          </p>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Employee Page
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* ================================================================ */}
        {/* HEADER */}
        {/* ================================================================ */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-cyan-400">
              NEXORA
            </p>

            <h1 className="mt-2 text-3xl font-bold">Employees</h1>

            <p className="mt-2 text-slate-400">
              Manage enterprise employee records.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={openCreateForm}
              className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              + Add Employee
            </button>

            <button
              onClick={() => router.push("/")}
              className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-900 hover:text-cyan-400"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* ALERTS */}
        {/* ================================================================ */}

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-900 bg-red-950/40 px-5 py-4 text-sm text-red-400">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="font-bold text-red-300 hover:text-white"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-emerald-900 bg-emerald-950/40 px-5 py-4 text-sm text-emerald-400">
            <span>{success}</span>

            <button
              onClick={() => setSuccess("")}
              className="font-bold text-emerald-300 hover:text-white"
            >
              ×
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* STATISTICS */}
        {/* ================================================================ */}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-500">Total Employees</p>

            <p className="mt-2 text-3xl font-bold text-cyan-400">
              {employees.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-500">Active Employees</p>

            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {activeEmployees}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-500">Inactive Employees</p>

            <p className="mt-2 text-3xl font-bold text-red-400">
              {inactiveEmployees}
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* CREATE / EDIT FORM */}
        {/* ================================================================ */}

        {showForm && (
          <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingEmployee ? "Edit Employee" : "Create Employee"}
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  {editingEmployee
                    ? "Update employee information."
                    : "Add a new employee to the NEXORA directory."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="text-sm font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={handleSubmitEmployee}
              className="mt-6 grid gap-5 md:grid-cols-2"
            >
              {/* Employee ID */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Employee ID
                </label>

                <input
                  value={form.employee_id}
                  onChange={(event) =>
                    updateForm("employee_id", event.target.value)
                  }
                  placeholder="EMP001"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              {/* Email */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email
                </label>

                <input
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  type="email"
                  placeholder="employee@company.com"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              {/* First Name */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  First Name
                </label>

                <input
                  value={form.first_name}
                  onChange={(event) =>
                    updateForm("first_name", event.target.value)
                  }
                  placeholder="First Name"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              {/* Last Name */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Last Name
                </label>

                <input
                  value={form.last_name}
                  onChange={(event) =>
                    updateForm("last_name", event.target.value)
                  }
                  placeholder="Last Name"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              {/* Department */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Department
                </label>

                <select
                  value={form.department}
                  onChange={(event) =>
                    updateForm("department", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                >
                  <option value="">Select Department</option>
                  <option value="1">CSE</option>
                  <option value="2">Engineering</option>
                </select>
              </div>

              {/* Job Title */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Job Title
                </label>

                <input
                  value={form.job_title}
                  onChange={(event) =>
                    updateForm("job_title", event.target.value)
                  }
                  placeholder="Software Developer"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              {/* Phone */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Phone Number
                </label>

                <input
                  value={form.phone_number}
                  onChange={(event) =>
                    updateForm("phone_number", event.target.value)
                  }
                  placeholder="+91 9876543210"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              {/* Status */}

              <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    updateForm("is_active", event.target.checked)
                  }
                  className="h-4 w-4 accent-cyan-500"
                />
                Active Employee
              </label>

              {/* Submit */}

              <div className="flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? editingEmployee
                      ? "Updating..."
                      : "Creating..."
                    : editingEmployee
                      ? "Update Employee"
                      : "Create Employee"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================================================================ */}
        {/* EMPLOYEE DIRECTORY */}
        {/* ================================================================ */}

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Employee Directory</h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredEmployees.length} employee
                {filteredEmployees.length !== 1 ? "s" : ""} shown
              </p>
            </div>

            {/* Search */}

            <div className="w-full md:w-96">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employees..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-2xl">
                👥
              </div>

              <p className="mt-4 font-semibold text-slate-300">
                {search
                  ? "No employees match your search."
                  : "No employees found."}
              </p>

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="mt-3 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-left">
                <thead className="border-b border-slate-800 bg-slate-950">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Employee ID
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Name
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Department
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Job Title
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b border-slate-800 transition hover:bg-slate-800/40"
                    >
                      {/* Employee ID */}

                      <td className="px-6 py-5 font-semibold text-cyan-400">
                        {employee.employee_id}
                      </td>

                      {/* Name */}

                      <td className="px-6 py-5">
                        <div className="font-medium text-white">
                          {employee.first_name} {employee.last_name}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {employee.phone_number || "No phone"}
                        </div>
                      </td>

                      {/* Email */}

                      <td className="px-6 py-5 text-sm text-slate-400">
                        {employee.email}
                      </td>

                      {/* Department */}

                      <td className="px-6 py-5 text-sm text-slate-300">
                        {employee.department_name || "—"}{" "}
                      </td>

                      {/* Job */}

                      <td className="px-6 py-5 text-sm text-slate-300">
                        {employee.job_title || "—"}
                      </td>

                      {/* Status */}

                      <td className="px-6 py-5">
                        {employee.is_active ? (
                          <span className="rounded-full border border-emerald-900 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-400">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full border border-red-900 bg-red-950/40 px-3 py-1 text-xs font-semibold text-red-400">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingEmployee(employee)}
                            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-800 hover:text-cyan-400"
                          >
                            View
                          </button>

                          <button
                            onClick={() => openEditForm(employee)}
                            className="rounded-lg border border-cyan-900 bg-cyan-950/30 px-3 py-2 text-xs font-semibold text-cyan-400 transition hover:bg-cyan-900/40"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => setDeleteEmployee(employee)}
                            className="rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-900/40"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* VIEW EMPLOYEE MODAL */}
      {/* ================================================================== */}

      {viewingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-cyan-400">
                  EMPLOYEE PROFILE
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white">
                  {viewingEmployee.first_name} {viewingEmployee.last_name}
                </h2>
              </div>

              <button
                onClick={() => setViewingEmployee(null)}
                className="text-2xl text-slate-500 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Employee ID
                </p>

                <p className="mt-2 font-semibold text-cyan-400">
                  {viewingEmployee.employee_id}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Status
                </p>

                <p
                  className={`mt-2 font-semibold ${
                    viewingEmployee.is_active
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {viewingEmployee.is_active ? "Active" : "Inactive"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Email
                </p>

                <p className="mt-2 text-slate-200">{viewingEmployee.email}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Department
                </p>

                <p className="mt-2 text-slate-200">
                  {viewingEmployee.department_name || "Not assigned"}{" "}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Job Title
                </p>

                <p className="mt-2 text-slate-200">
                  {viewingEmployee.job_title || "Not assigned"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Phone
                </p>

                <p className="mt-2 text-slate-200">
                  {viewingEmployee.phone_number || "Not provided"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingEmployee(null)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ================================================================== */}

      {deleteEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-900 bg-slate-900 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-900 bg-red-950/50 text-xl">
              ⚠
            </div>

            <h2 className="mt-5 text-xl font-bold text-white">
              Delete Employee?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                {deleteEmployee.first_name} {deleteEmployee.last_name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteEmployee(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteEmployee}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Employee"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
