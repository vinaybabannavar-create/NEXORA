"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import WorkspaceLayout from "@/components/WorkspaceLayout";

type Customer = {
  id: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone_number: string;
  region: string;
  plan_tier: "BASIC" | "STANDARD" | "PREMIUM" | "ENTERPRISE";
  plan_tier_display: string;
  contract_start_date: string | null;
  contract_end_date: string | null;
  nps_score: number | null;
  monthly_usage: string;
  device_count: number;
  support_ticket_count: number;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
};

type CustomerForm = {
  company_name: string;
  contact_name: string;
  email: string;
  phone_number: string;
  region: string;
  plan_tier: "BASIC" | "STANDARD" | "PREMIUM" | "ENTERPRISE";
  contract_start_date: string;
  contract_end_date: string;
  nps_score: string;
  monthly_usage: string;
  device_count: string;
  support_ticket_count: string;
  is_active: boolean;
  notes: string;
};

const emptyForm: CustomerForm = {
  company_name: "",
  contact_name: "",
  email: "",
  phone_number: "",
  region: "",
  plan_tier: "BASIC",
  contract_start_date: "",
  contract_end_date: "",
  nps_score: "",
  monthly_usage: "0",
  device_count: "0",
  support_ticket_count: "0",
  is_active: true,
  notes: "",
};

const planOptions = [
  { value: "BASIC", label: "Basic" },
  { value: "STANDARD", label: "Standard" },
  { value: "PREMIUM", label: "Premium" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400";

const selectClass =
  "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400";

function formatDate(date: string | null) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value: string | number) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0";
  }

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(number);
}

function getPlanClasses(plan: string) {
  switch (plan) {
    case "ENTERPRISE":
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";
    case "PREMIUM":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
    case "STANDARD":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    default:
      return "border-slate-600 bg-slate-800 text-slate-300";
  }
}

function getNpsClasses(score: number | null) {
  if (score === null) {
    return "text-slate-500";
  }

  if (score >= 9) {
    return "text-emerald-400";
  }

  if (score >= 7) {
    return "text-cyan-400";
  }

  if (score >= 5) {
    return "text-amber-400";
  }

  return "text-red-400";
}

export default function CustomersPage() {
  const { accessToken } = useAuthStore();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [regionFilter, setRegionFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(
    null,
  );

  const [form, setForm] = useState<CustomerForm>(emptyForm);

  const updateForm = <K extends keyof CustomerForm>(
    field: K,
    value: CustomerForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customers/");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setCustomers(data);
    } catch (err: any) {
      console.error("Failed to load customers:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load customers. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    fetchCustomers();
  }, [accessToken]);

  const regions = useMemo(() => {
    const uniqueRegions = Array.from(
      new Set(customers.map((customer) => customer.region).filter(Boolean)),
    );

    return uniqueRegions.sort();
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        customer.company_name?.toLowerCase().includes(query) ||
        customer.contact_name?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone_number?.toLowerCase().includes(query) ||
        customer.region?.toLowerCase().includes(query);

      const matchesPlan =
        planFilter === "ALL" || customer.plan_tier === planFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && customer.is_active) ||
        (statusFilter === "INACTIVE" && !customer.is_active);

      const matchesRegion =
        regionFilter === "ALL" || customer.region === regionFilter;

      return matchesSearch && matchesPlan && matchesStatus && matchesRegion;
    });
  }, [customers, search, planFilter, statusFilter, regionFilter]);

  const stats = useMemo(() => {
    const total = customers.length;

    const active = customers.filter((customer) => customer.is_active).length;

    const inactive = total - active;

    const enterprise = customers.filter(
      (customer) => customer.plan_tier === "ENTERPRISE",
    ).length;

    const premium = customers.filter(
      (customer) => customer.plan_tier === "PREMIUM",
    ).length;

    const totalUsage = customers.reduce(
      (sum, customer) => sum + Number(customer.monthly_usage || 0),
      0,
    );

    const totalDevices = customers.reduce(
      (sum, customer) => sum + Number(customer.device_count || 0),
      0,
    );

    const totalTickets = customers.reduce(
      (sum, customer) => sum + Number(customer.support_ticket_count || 0),
      0,
    );

    const customersWithNps = customers.filter(
      (customer) => customer.nps_score !== null,
    );

    const averageNps =
      customersWithNps.length > 0
        ? customersWithNps.reduce(
            (sum, customer) => sum + Number(customer.nps_score || 0),
            0,
          ) / customersWithNps.length
        : null;

    return {
      total,
      active,
      inactive,
      enterprise,
      premium,
      totalUsage,
      totalDevices,
      totalTickets,
      averageNps,
    };
  }, [customers]);

  const openCreateForm = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer);

    setForm({
      company_name: customer.company_name || "",
      contact_name: customer.contact_name || "",
      email: customer.email || "",
      phone_number: customer.phone_number || "",
      region: customer.region || "",
      plan_tier: customer.plan_tier || "BASIC",
      contract_start_date: customer.contract_start_date || "",
      contract_end_date: customer.contract_end_date || "",
      nps_score: customer.nps_score === null ? "" : String(customer.nps_score),
      monthly_usage: String(customer.monthly_usage || "0"),
      device_count: String(customer.device_count || "0"),
      support_ticket_count: String(customer.support_ticket_count || "0"),
      is_active: customer.is_active,
      notes: customer.notes || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openViewModal = (customer: Customer) => {
    setViewingCustomer(customer);
    setShowView(true);
  };

  const openDeleteModal = (customer: Customer) => {
    setDeletingCustomer(customer);
    setShowDelete(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingCustomer(null);
    setForm(emptyForm);
  };

  const buildPayload = () => {
    const payload = {
      company_name: form.company_name.trim(),
      contact_name: form.contact_name.trim(),
      email: form.email.trim(),
      phone_number: form.phone_number.trim(),
      region: form.region.trim(),
      plan_tier: form.plan_tier,
      contract_start_date: form.contract_start_date || null,
      contract_end_date: form.contract_end_date || null,
      nps_score: form.nps_score === "" ? null : Number(form.nps_score),
      monthly_usage: form.monthly_usage === "" ? "0" : form.monthly_usage,
      device_count: form.device_count === "" ? 0 : Number(form.device_count),
      support_ticket_count:
        form.support_ticket_count === ""
          ? 0
          : Number(form.support_ticket_count),
      is_active: form.is_active,
      notes: form.notes.trim(),
    };

    return payload;
  };

  const validateForm = () => {
    if (!form.company_name.trim()) {
      return "Company name is required.";
    }

    if (!form.contact_name.trim()) {
      return "Contact name is required.";
    }

    if (!form.email.trim()) {
      return "Email is required.";
    }

    if (!form.region.trim()) {
      return "Region is required.";
    }

    if (
      form.nps_score !== "" &&
      (Number(form.nps_score) < 0 || Number(form.nps_score) > 10)
    ) {
      return "NPS score must be between 0 and 10.";
    }

    if (
      form.contract_start_date &&
      form.contract_end_date &&
      form.contract_end_date < form.contract_start_date
    ) {
      return "Contract end date cannot be before the start date.";
    }

    if (Number(form.device_count) < 0) {
      return "Device count cannot be negative.";
    }

    if (Number(form.support_ticket_count) < 0) {
      return "Support ticket count cannot be negative.";
    }

    if (Number(form.monthly_usage) < 0) {
      return "Monthly usage cannot be negative.";
    }

    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = buildPayload();

      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}/`, payload);

        setSuccess("Customer updated successfully.");
      } else {
        await api.post("/customers/", payload);

        setSuccess("Customer created successfully.");
      }

      setShowForm(false);
      setEditingCustomer(null);
      setForm(emptyForm);

      await fetchCustomers();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      console.error("Customer save failed:", err);

      const responseData = err?.response?.data;

      if (typeof responseData === "object") {
        const messages = Object.entries(responseData)
          .map(([field, value]) => {
            const message = Array.isArray(value)
              ? value.join(", ")
              : String(value);

            return `${field}: ${message}`;
          })
          .join(" | ");

        setError(messages || "Unable to save customer.");
      } else {
        setError("Unable to save customer. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCustomer) return;

    try {
      setSaving(true);
      setError("");

      await api.delete(`/customers/${deletingCustomer.id}/`);

      setShowDelete(false);
      setDeletingCustomer(null);

      setSuccess("Customer deleted successfully.");

      await fetchCustomers();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      console.error("Customer delete failed:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to delete customer. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!accessToken) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-xl">
          <h1 className="text-xl font-semibold text-white">
            Authentication Required
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Please log in to access Customer Management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-2xl">
                👥
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Customer Management
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Manage customers, subscriptions, usage and support data.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openCreateForm}
            className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            + Add Customer
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="text-red-300 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <span>{success}</span>

            <button
              onClick={() => setSuccess("")}
              className="text-emerald-300 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total Customers</span>

              <span className="text-xl">👥</span>
            </div>

            <div className="mt-3 text-3xl font-bold text-white">
              {stats.total}
            </div>

            <p className="mt-1 text-xs text-slate-500">
              All registered customers
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Active Customers</span>

              <span className="text-xl">🟢</span>
            </div>

            <div className="mt-3 text-3xl font-bold text-emerald-400">
              {stats.active}
            </div>

            <p className="mt-1 text-xs text-slate-500">
              {stats.inactive} inactive
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Enterprise</span>

              <span className="text-xl">💎</span>
            </div>

            <div className="mt-3 text-3xl font-bold text-purple-400">
              {stats.enterprise}
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Premium: {stats.premium}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Average NPS</span>

              <span className="text-xl">⭐</span>
            </div>

            <div
              className={`mt-3 text-3xl font-bold ${
                stats.averageNps === null
                  ? "text-slate-500"
                  : getNpsClasses(stats.averageNps)
              }`}
            >
              {stats.averageNps === null ? "—" : stats.averageNps.toFixed(1)}
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Based on available scores
            </p>
          </div>
        </div>

        {/* Operational Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Monthly Usage
            </p>

            <p className="mt-2 text-xl font-semibold text-cyan-300">
              {formatNumber(stats.totalUsage)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Devices
            </p>

            <p className="mt-2 text-xl font-semibold text-blue-300">
              {formatNumber(stats.totalDevices)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Support Tickets
            </p>

            <p className="mt-2 text-xl font-semibold text-amber-300">
              {formatNumber(stats.totalTickets)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                🔍
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customers..."
                className={`${inputClass} pl-11`}
              />
            </div>

            <select
              value={planFilter}
              onChange={(event) => setPlanFilter(event.target.value)}
              className={selectClass}
            >
              <option value="ALL">All Plans</option>

              {planOptions.map((plan) => (
                <option key={plan.value} value={plan.value}>
                  {plan.label}
                </option>
              ))}
            </select>

            <select
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
              className={selectClass}
            >
              <option value="ALL">All Regions</option>

              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={selectClass}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {filteredCustomers.length} of {customers.length} customers
            </span>

            <button
              onClick={() => {
                setSearch("");
                setPlanFilter("ALL");
                setStatusFilter("ALL");
                setRegionFilter("ALL");
              }}
              className="text-cyan-400 transition hover:text-cyan-300"
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Customer Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="font-semibold text-white">Customer Directory</h2>

            <p className="mt-1 text-xs text-slate-500">
              Customer accounts and subscription information
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading customers...
                </p>
              </div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="text-5xl">👥</div>

              <h3 className="mt-4 text-lg font-semibold text-white">
                No customers found
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                Try changing your filters or add a new customer.
              </p>

              <button
                onClick={openCreateForm}
                className="mt-5 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                + Add Customer
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-left">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Contact
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Region
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Plan
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      NPS
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Devices
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tickets
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-slate-800/80 transition hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 font-semibold text-cyan-300">
                            {customer.company_name?.charAt(0).toUpperCase() ||
                              "C"}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">
                              {customer.company_name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {customer.contact_name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-300">
                          {customer.email}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {customer.phone_number || "No phone"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-300">
                          {customer.region || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getPlanClasses(
                            customer.plan_tier,
                          )}`}
                        >
                          {customer.plan_tier_display || customer.plan_tier}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`text-sm font-semibold ${getNpsClasses(
                            customer.nps_score,
                          )}`}
                        >
                          {customer.nps_score === null
                            ? "—"
                            : customer.nps_score}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-300">
                          {formatNumber(customer.device_count)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-300">
                          {formatNumber(customer.support_ticket_count)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {customer.is_active ? (
                          <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                            <span className="h-2 w-2 rounded-full bg-slate-600" />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openViewModal(customer)}
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300"
                          >
                            View
                          </button>

                          <button
                            onClick={() => openEditForm(customer)}
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500/40 hover:text-blue-300"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => openDeleteModal(customer)}
                            className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
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

        {/* Create/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingCustomer ? "Edit Customer" : "Add Customer"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {editingCustomer
                      ? "Update customer information."
                      : "Create a new customer account."}
                  </p>
                </div>

                <button
                  onClick={closeForm}
                  className="rounded-lg px-3 py-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 p-6">
                {/* Customer Information */}
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cyan-400">
                    Customer Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Company Name *
                      </label>

                      <input
                        type="text"
                        value={form.company_name}
                        onChange={(event) =>
                          updateForm("company_name", event.target.value)
                        }
                        placeholder="Acme Corporation"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Contact Name *
                      </label>

                      <input
                        type="text"
                        value={form.contact_name}
                        onChange={(event) =>
                          updateForm("contact_name", event.target.value)
                        }
                        placeholder="John Doe"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Email *
                      </label>

                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          updateForm("email", event.target.value)
                        }
                        placeholder="john@company.com"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Phone Number
                      </label>

                      <input
                        type="text"
                        value={form.phone_number}
                        onChange={(event) =>
                          updateForm("phone_number", event.target.value)
                        }
                        placeholder="+91 9876543210"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Region *
                      </label>

                      <input
                        type="text"
                        value={form.region}
                        onChange={(event) =>
                          updateForm("region", event.target.value)
                        }
                        placeholder="India"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Plan Tier
                      </label>

                      <select
                        value={form.plan_tier}
                        onChange={(event) =>
                          updateForm(
                            "plan_tier",
                            event.target.value as CustomerForm["plan_tier"],
                          )
                        }
                        className={selectClass}
                      >
                        {planOptions.map((plan) => (
                          <option key={plan.value} value={plan.value}>
                            {plan.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contract */}
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cyan-400">
                    Contract
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Contract Start Date
                      </label>

                      <input
                        type="date"
                        value={form.contract_start_date}
                        onChange={(event) =>
                          updateForm("contract_start_date", event.target.value)
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Contract End Date
                      </label>

                      <input
                        type="date"
                        value={form.contract_end_date}
                        onChange={(event) =>
                          updateForm("contract_end_date", event.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Analytics */}
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-cyan-400">
                    Customer Analytics
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        NPS Score
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="1"
                        value={form.nps_score}
                        onChange={(event) =>
                          updateForm("nps_score", event.target.value)
                        }
                        placeholder="0 - 10"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Monthly Usage
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.monthly_usage}
                        onChange={(event) =>
                          updateForm("monthly_usage", event.target.value)
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Device Count
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={form.device_count}
                        onChange={(event) =>
                          updateForm("device_count", event.target.value)
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-300">
                        Support Tickets
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={form.support_ticket_count}
                        onChange={(event) =>
                          updateForm("support_ticket_count", event.target.value)
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Notes
                  </label>

                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateForm("notes", event.target.value)
                    }
                    rows={4}
                    placeholder="Additional customer notes..."
                    className={inputClass}
                  />
                </div>

                {/* Status */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(event) =>
                        updateForm("is_active", event.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                    />

                    <div>
                      <p className="text-sm font-medium text-white">
                        Active Customer
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Enable this customer account.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingCustomer
                        ? "Update Customer"
                        : "Create Customer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showView && viewingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Customer Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Complete customer information
                  </p>
                </div>

                <button
                  onClick={() => setShowView(false)}
                  className="rounded-lg px-3 py-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6 p-6">
                {/* Customer Header */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-5 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-2xl font-bold text-cyan-300">
                    {viewingCustomer.company_name?.charAt(0).toUpperCase() ||
                      "C"}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold text-white">
                        {viewingCustomer.company_name}
                      </h3>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${getPlanClasses(
                          viewingCustomer.plan_tier,
                        )}`}
                      >
                        {viewingCustomer.plan_tier_display ||
                          viewingCustomer.plan_tier}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-400">
                      {viewingCustomer.contact_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {viewingCustomer.email}
                    </p>
                  </div>

                  {viewingCustomer.is_active ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400">
                      <span className="h-2 w-2 rounded-full bg-slate-500" />
                      Inactive
                    </span>
                  )}
                </div>

                {/* Contact */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-cyan-400">
                    Contact Information
                  </h3>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-xs text-slate-500">Email</p>

                      <p className="mt-1 text-sm text-white">
                        {viewingCustomer.email || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-xs text-slate-500">Phone</p>

                      <p className="mt-1 text-sm text-white">
                        {viewingCustomer.phone_number || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-xs text-slate-500">Region</p>

                      <p className="mt-1 text-sm text-white">
                        {viewingCustomer.region || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-xs text-slate-500">Contact Person</p>

                      <p className="mt-1 text-sm text-white">
                        {viewingCustomer.contact_name || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contract */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-cyan-400">
                    Contract
                  </h3>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-xs text-slate-500">Plan</p>

                      <p className="mt-1 text-sm font-medium text-white">
                        {viewingCustomer.plan_tier_display ||
                          viewingCustomer.plan_tier}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-xs text-slate-500">Start Date</p>

                      <p className="mt-1 text-sm text-white">
                        {formatDate(viewingCustomer.contract_start_date)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-xs text-slate-500">End Date</p>

                      <p className="mt-1 text-sm text-white">
                        {formatDate(viewingCustomer.contract_end_date)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Analytics */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-cyan-400">
                    Analytics
                  </h3>

                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-xs text-slate-500">NPS Score</p>

                      <p
                        className={`mt-1 text-xl font-bold ${getNpsClasses(
                          viewingCustomer.nps_score,
                        )}`}
                      >
                        {viewingCustomer.nps_score === null
                          ? "—"
                          : viewingCustomer.nps_score}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-xs text-slate-500">Monthly Usage</p>

                      <p className="mt-1 text-xl font-bold text-cyan-300">
                        {formatNumber(viewingCustomer.monthly_usage)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-xs text-slate-500">Devices</p>

                      <p className="mt-1 text-xl font-bold text-blue-300">
                        {formatNumber(viewingCustomer.device_count)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="text-xs text-slate-500">Support Tickets</p>

                      <p className="mt-1 text-xl font-bold text-amber-300">
                        {formatNumber(viewingCustomer.support_ticket_count)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-cyan-400">
                    Notes
                  </h3>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                      {viewingCustomer.notes || "No notes added."}
                    </p>
                  </div>
                </div>

                {/* System */}
                <div className="flex flex-col gap-2 border-t border-slate-800 pt-5 text-xs text-slate-500 sm:flex-row sm:justify-between">
                  <span>Created: {formatDate(viewingCustomer.created_at)}</span>

                  <span>Updated: {formatDate(viewingCustomer.updated_at)}</span>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowView(false)}
                    className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                  >
                    Close
                  </button>

                  <button
                    onClick={() => {
                      setShowView(false);
                      openEditForm(viewingCustomer);
                    }}
                    className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    Edit Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDelete && deletingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-xl">
                ⚠️
              </div>

              <h2 className="mt-4 text-xl font-bold text-white">
                Delete Customer?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-white">
                  {deletingCustomer.company_name}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => {
                    setShowDelete(false);
                    setDeletingCustomer(null);
                  }}
                  disabled={saving}
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Deleting..." : "Delete Customer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
}
