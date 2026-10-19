"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import WorkspaceLayout from "@/components/WorkspaceLayout";

type Customer = {
  id: number;
  company_name: string;
};

type Employee = {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
};

type Ticket = {
  id: number;
  ticket_number: string;
  customer: number;
  customer_name: string;
  subject: string;
  description: string;
  category: string;
  category_display: string;
  priority: string;
  priority_display: string;
  status: string;
  status_display: string;
  assigned_employee: number | null;
  assigned_employee_name: string | null;
  due_date: string | null;
  resolved_at: string | null;
  customer_satisfaction: number | null;
  internal_notes: string;
  created_at: string;
  updated_at: string;
};

type TicketForm = {
  customer: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_employee: string;
  due_date: string;
  customer_satisfaction: string;
  internal_notes: string;
};

const emptyForm: TicketForm = {
  customer: "",
  subject: "",
  description: "",
  category: "TECHNICAL",
  priority: "MEDIUM",
  status: "OPEN",
  assigned_employee: "",
  due_date: "",
  customer_satisfaction: "",
  internal_notes: "",
};

const categories = [
  ["TECHNICAL", "Technical"],
  ["BILLING", "Billing"],
  ["ACCOUNT", "Account"],
  ["FEATURE_REQUEST", "Feature Request"],
  ["BUG", "Bug Report"],
  ["OTHER", "Other"],
];

const priorities = [
  ["LOW", "Low"],
  ["MEDIUM", "Medium"],
  ["HIGH", "High"],
  ["CRITICAL", "Critical"],
];

const statuses = [
  ["OPEN", "Open"],
  ["IN_PROGRESS", "In Progress"],
  ["WAITING", "Waiting"],
  ["RESOLVED", "Resolved"],
  ["CLOSED", "Closed"],
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null);

  const [form, setForm] = useState<TicketForm>(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);

      const [ticketsResponse, customersResponse, employeesResponse] =
        await Promise.all([
          api.get("/support-tickets/"),
          api.get("/customers/"),
          api.get("/employees/"),
        ]);

      const ticketsData = Array.isArray(ticketsResponse.data)
        ? ticketsResponse.data
        : ticketsResponse.data.results || [];

      const customersData = Array.isArray(customersResponse.data)
        ? customersResponse.data
        : customersResponse.data.results || [];

      const employeesData = Array.isArray(employeesResponse.data)
        ? employeesResponse.data
        : employeesResponse.data.results || [];

      setTickets(ticketsData);
      setCustomers(customersData);
      setEmployees(employeesData);
    } catch (error) {
      console.error("Failed to load support data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTickets = useMemo(() => {
    const query = search.toLowerCase().trim();

    return tickets.filter((ticket) => {
      const matchesSearch =
        !query ||
        ticket.ticket_number.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.customer_name.toLowerCase().includes(query) ||
        ticket.category_display.toLowerCase().includes(query);

      const matchesPriority =
        priorityFilter === "ALL" || ticket.priority === priorityFilter;

      const matchesStatus =
        statusFilter === "ALL" || ticket.status === statusFilter;

      const matchesCategory =
        categoryFilter === "ALL" || ticket.category === categoryFilter;

      return (
        matchesSearch && matchesPriority && matchesStatus && matchesCategory
      );
    });
  }, [tickets, search, priorityFilter, statusFilter, categoryFilter]);

  const totalTickets = tickets.length;

  const openTickets = tickets.filter(
    (ticket) => ticket.status === "OPEN" || ticket.status === "IN_PROGRESS",
  ).length;

  const criticalTickets = tickets.filter(
    (ticket) => ticket.priority === "CRITICAL",
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED",
  ).length;

  const satisfactionScores = tickets
    .map((ticket) => ticket.customer_satisfaction)
    .filter((score): score is number => score !== null && score !== undefined);

  const averageSatisfaction =
    satisfactionScores.length > 0
      ? (
          satisfactionScores.reduce((sum, score) => sum + score, 0) /
          satisfactionScores.length
        ).toFixed(1)
      : "—";

  const updateForm = (field: keyof TicketForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openCreateForm = () => {
    setEditingTicket(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (ticket: Ticket) => {
    setEditingTicket(ticket);

    setForm({
      customer: String(ticket.customer),
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      assigned_employee: ticket.assigned_employee
        ? String(ticket.assigned_employee)
        : "",
      due_date: ticket.due_date || "",
      customer_satisfaction:
        ticket.customer_satisfaction !== null
          ? String(ticket.customer_satisfaction)
          : "",
      internal_notes: ticket.internal_notes || "",
    });

    setShowForm(true);
  };

  const saveTicket = async () => {
    if (!form.customer || !form.subject.trim() || !form.description.trim()) {
      alert("Please select a customer and enter subject and description.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        customer: Number(form.customer),
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
        status: form.status,
        assigned_employee: form.assigned_employee
          ? Number(form.assigned_employee)
          : null,
        due_date: form.due_date || null,
        customer_satisfaction: form.customer_satisfaction
          ? Number(form.customer_satisfaction)
          : null,
        internal_notes: form.internal_notes.trim(),
      };

      if (editingTicket) {
        await api.patch(`/support-tickets/${editingTicket.id}/`, payload);
      } else {
        await api.post("/support-tickets/", payload);
      }

      setShowForm(false);
      setEditingTicket(null);
      setForm(emptyForm);

      await loadData();
    } catch (error: any) {
      console.error("Failed to save ticket:", error);

      const message = error?.response?.data?.detail || "Unable to save ticket.";

      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteTicket = async () => {
    if (!deletingTicket) {
      return;
    }

    try {
      await api.delete(`/support-tickets/${deletingTicket.id}/`);

      setDeletingTicket(null);
      await loadData();
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      alert("Unable to delete ticket.");
    }
  };

  const getPriorityClass = (priority: string) => {
    if (priority === "CRITICAL") {
      return "bg-red-500/15 text-red-300 border-red-500/30";
    }

    if (priority === "HIGH") {
      return "bg-orange-500/15 text-orange-300 border-orange-500/30";
    }

    if (priority === "MEDIUM") {
      return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
    }

    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  };

  const getStatusClass = (status: string) => {
    if (status === "OPEN") {
      return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    }

    if (status === "IN_PROGRESS") {
      return "bg-purple-500/15 text-purple-300 border-purple-500/30";
    }

    if (status === "WAITING") {
      return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
    }

    if (status === "RESOLVED") {
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    }

    return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  };

  return (
    <WorkspaceLayout>
      <div className="min-w-0 space-y-6 pb-10">
        <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-2 text-sm font-medium text-cyan-400">
                  CUSTOMER OPERATIONS
                </p>

                <h1 className="text-3xl font-bold tracking-tight">
                  Support & Tickets
                </h1>

                <p className="mt-2 text-sm text-slate-400">
                  Manage customer support requests, assignments and resolutions.
                </p>
              </div>

              <button
                onClick={openCreateForm}
                className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                + Create Ticket
              </button>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard title="Total Tickets" value={totalTickets} icon="🎫" />

              <StatCard title="Open / Active" value={openTickets} icon="🔵" />

              <StatCard title="Critical" value={criticalTickets} icon="🚨" />

              <StatCard title="Resolved" value={resolvedTickets} icon="✅" />

              <StatCard
                title="Avg. Satisfaction"
                value={
                  averageSatisfaction === "—" ? "—" : `${averageSatisfaction}/5`
                }
                icon="⭐"
              />
            </div>

            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="grid gap-3 lg:grid-cols-4">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tickets..."
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                />

                <select
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                >
                  <option value="ALL">All Priorities</option>
                  {priorities.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                >
                  <option value="ALL">All Statuses</option>
                  {statuses.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
              <div className="border-b border-slate-800 px-6 py-5">
                <h2 className="text-lg font-semibold">Ticket Directory</h2>

                <p className="mt-1 text-sm text-slate-400">
                  {filteredTickets.length} ticket
                  {filteredTickets.length === 1 ? "" : "s"} found
                </p>
              </div>

              {loading ? (
                <div className="px-6 py-16 text-center text-slate-400">
                  Loading support tickets...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="text-4xl">🎫</div>

                  <h3 className="mt-4 text-lg font-semibold">
                    No tickets found
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    Create a support ticket to get started.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-950/70">
                      <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-4">Ticket</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Subject</th>
                        <th className="px-6 py-4">Priority</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Assigned To</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">
                      {filteredTickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="transition hover:bg-slate-800/40"
                        >
                          <td className="px-6 py-4">
                            <span className="font-semibold text-cyan-400">
                              {ticket.ticket_number}
                            </span>

                            <div className="mt-1 text-xs text-slate-500">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="font-medium text-white">
                              {ticket.customer_name}
                            </div>
                          </td>

                          <td className="max-w-xs px-6 py-4">
                            <div className="truncate font-medium text-white">
                              {ticket.subject}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {ticket.category_display}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-medium ${getPriorityClass(
                                ticket.priority,
                              )}`}
                            >
                              {ticket.priority_display}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(
                                ticket.status,
                              )}`}
                            >
                              {ticket.status_display}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-300">
                            {ticket.assigned_employee_name || "Unassigned"}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setViewingTicket(ticket)}
                                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400"
                              >
                                View
                              </button>

                              <button
                                onClick={() => openEditForm(ticket)}
                                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-yellow-400 hover:text-yellow-400"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => setDeletingTicket(ticket)}
                                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-red-400 hover:text-red-400"
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

          {showForm && (
            <Modal
              title={
                editingTicket
                  ? `Edit ${editingTicket.ticket_number}`
                  : "Create Support Ticket"
              }
              onClose={() => {
                setShowForm(false);
                setEditingTicket(null);
              }}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Customer *">
                  <select
                    value={form.customer}
                    onChange={(event) =>
                      updateForm("customer", event.target.value)
                    }
                    className="input"
                  >
                    <option value="">Select Customer</option>

                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.company_name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Subject *">
                  <input
                    value={form.subject}
                    onChange={(event) =>
                      updateForm("subject", event.target.value)
                    }
                    placeholder="Enter ticket subject"
                    className="input"
                  />
                </Field>

                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={(event) =>
                      updateForm("category", event.target.value)
                    }
                    className="input"
                  >
                    {categories.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Priority">
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      updateForm("priority", event.target.value)
                    }
                    className="input"
                  >
                    {priorities.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm("status", event.target.value)
                    }
                    className="input"
                  >
                    {statuses.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Assign Employee">
                  <select
                    value={form.assigned_employee}
                    onChange={(event) =>
                      updateForm("assigned_employee", event.target.value)
                    }
                    className="input"
                  >
                    <option value="">Unassigned</option>

                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Due Date">
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(event) =>
                      updateForm("due_date", event.target.value)
                    }
                    className="input"
                  />
                </Field>

                <Field label="Customer Satisfaction">
                  <select
                    value={form.customer_satisfaction}
                    onChange={(event) =>
                      updateForm("customer_satisfaction", event.target.value)
                    }
                    className="input"
                  >
                    <option value="">Not Rated</option>
                    <option value="1">1 - Very Poor</option>
                    <option value="2">2 - Poor</option>
                    <option value="3">3 - Average</option>
                    <option value="4">4 - Good</option>
                    <option value="5">5 - Excellent</option>
                  </select>
                </Field>

                <div className="md:col-span-2">
                  <Field label="Description *">
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        updateForm("description", event.target.value)
                      }
                      rows={5}
                      placeholder="Describe the customer issue..."
                      className="input resize-none"
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Internal Notes">
                    <textarea
                      value={form.internal_notes}
                      onChange={(event) =>
                        updateForm("internal_notes", event.target.value)
                      }
                      rows={4}
                      placeholder="Internal notes for support staff..."
                      className="input resize-none"
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingTicket(null);
                  }}
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  onClick={saveTicket}
                  disabled={saving}
                  className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingTicket
                      ? "Update Ticket"
                      : "Create Ticket"}
                </button>
              </div>
            </Modal>
          )}

          {viewingTicket && (
            <Modal
              title={viewingTicket.ticket_number}
              onClose={() => setViewingTicket(null)}
            >
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Subject
                  </p>

                  <p className="mt-2 text-xl font-semibold">
                    {viewingTicket.subject}
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Info label="Customer" value={viewingTicket.customer_name} />

                  <Info
                    label="Category"
                    value={viewingTicket.category_display}
                  />

                  <Info
                    label="Priority"
                    value={viewingTicket.priority_display}
                  />

                  <Info label="Status" value={viewingTicket.status_display} />

                  <Info
                    label="Assigned To"
                    value={viewingTicket.assigned_employee_name || "Unassigned"}
                  />

                  <Info
                    label="Due Date"
                    value={viewingTicket.due_date || "Not specified"}
                  />

                  <Info
                    label="Customer Satisfaction"
                    value={
                      viewingTicket.customer_satisfaction
                        ? `${viewingTicket.customer_satisfaction}/5`
                        : "Not rated"
                    }
                  />

                  <Info
                    label="Created"
                    value={new Date(viewingTicket.created_at).toLocaleString()}
                  />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Description
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                    {viewingTicket.description}
                  </p>
                </div>

                {viewingTicket.internal_notes && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Internal Notes
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                      {viewingTicket.internal_notes}
                    </p>
                  </div>
                )}
              </div>
            </Modal>
          )}

          {deletingTicket && (
            <Modal
              title="Delete Ticket"
              onClose={() => setDeletingTicket(null)}
            >
              <p className="text-sm leading-6 text-slate-300">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-white">
                  {deletingTicket.ticket_number}
                </span>
                ?
              </p>

              <p className="mt-2 text-sm text-slate-500">
                This action cannot be undone.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeletingTicket(null)}
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  onClick={deleteTicket}
                  className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-400"
                >
                  Delete Ticket
                </button>
              </div>
            </Modal>
          )}
        </main>
      </div>
    </WorkspaceLayout>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{title}</span>

        <span className="text-xl">{icon}</span>
      </div>

      <div className="mt-3 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>

      <p className="mt-1 text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-5">
          <h2 className="text-xl font-bold">{title}</h2>

          <button
            onClick={onClose}
            className="text-2xl text-slate-500 transition hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
