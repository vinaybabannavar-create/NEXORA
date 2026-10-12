"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

type Customer = {
  id: number;
  company_name: string;
};

type Employee = {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type CurrentUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
};

type Project = {
  id: number;
  project_code: string;
  name: string;
  customer: number | null;
  customer_name: string | null;
  project_manager: string | null;
  project_manager_name: string | null;
  description: string;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  start_date: string | null;
  end_date: string | null;
  budget: string | number;
  progress: number;
  task_count: number;
  completed_task_count: number;
  created_at: string;
  updated_at: string;
};

type Task = {
  id: number;
  task_code: string;
  project: number;
  project_name: string;
  project_code: string;
  title: string;
  description: string;
  assigned_to: number | null;
  assigned_employee_name: string | null;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  due_date: string | null;
  estimated_hours: string | number;
  actual_hours: string | number;
  created_at: string;
  updated_at: string;
};

type ProjectForm = {
  project_code: string;
  name: string;
  customer: string;
  description: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  budget: string;
  progress: string;
  assign_self: boolean;
};

type TaskForm = {
  task_code: string;
  project: string;
  title: string;
  description: string;
  assigned_to: string;
  status: string;
  priority: string;
  due_date: string;
  estimated_hours: string;
  actual_hours: string;
};

const emptyProjectForm: ProjectForm = {
  project_code: "",
  name: "",
  customer: "",
  description: "",
  status: "PLANNING",
  priority: "MEDIUM",
  start_date: "",
  end_date: "",
  budget: "0",
  progress: "0",
  assign_self: true,
};

const emptyTaskForm: TaskForm = {
  task_code: "",
  project: "",
  title: "",
  description: "",
  assigned_to: "",
  status: "TODO",
  priority: "MEDIUM",
  due_date: "",
  estimated_hours: "0",
  actual_hours: "0",
};

const projectStatuses = [
  ["PLANNING", "Planning"],
  ["ACTIVE", "Active"],
  ["ON_HOLD", "On Hold"],
  ["COMPLETED", "Completed"],
  ["CANCELLED", "Cancelled"],
];

const priorities = [
  ["LOW", "Low"],
  ["MEDIUM", "Medium"],
  ["HIGH", "High"],
  ["CRITICAL", "Critical"],
];

const taskStatuses = [
  ["TODO", "To Do"],
  ["IN_PROGRESS", "In Progress"],
  ["REVIEW", "Review"],
  ["COMPLETED", "Completed"],
  ["BLOCKED", "Blocked"],
];

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value: string | number) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusClass(status: string) {
  switch (status) {
    case "ACTIVE":
    case "IN_PROGRESS":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";

    case "COMPLETED":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";

    case "ON_HOLD":
    case "REVIEW":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

    case "BLOCKED":
    case "CANCELLED":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    default:
      return "border-slate-600 bg-slate-800 text-slate-300";
  }
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    case "HIGH":
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";

    case "MEDIUM":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

    default:
      return "border-slate-600 bg-slate-800 text-slate-300";
  }
}

export default function ProjectsPage() {
  const router = useRouter();

  const accessToken = useAuthStore((state) => state.accessToken);

  const [hydrated, setHydrated] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [activeTab, setActiveTab] = useState<"projects" | "tasks">("projects");

  const [showProjectForm, setShowProjectForm] = useState(false);

  const [showTaskForm, setShowTaskForm] = useState(false);

  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const [deleteProject, setDeleteProject] = useState<Project | null>(null);

  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const [projectForm, setProjectForm] = useState<ProjectForm>(emptyProjectForm);

  const [taskForm, setTaskForm] = useState<TaskForm>(emptyTaskForm);

  const [projectSearch, setProjectSearch] = useState("");

  const [taskSearch, setTaskSearch] = useState("");

  const [projectStatusFilter, setProjectStatusFilter] = useState("ALL");

  const [projectPriorityFilter, setProjectPriorityFilter] = useState("ALL");

  const [taskStatusFilter, setTaskStatusFilter] = useState("ALL");

  const [taskPriorityFilter, setTaskPriorityFilter] = useState("ALL");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ============================================================
     ZUSTAND HYDRATION
  ============================================================ */

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

  /* ============================================================
     LOAD DATA
  ============================================================ */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        projectsResponse,
        tasksResponse,
        customersResponse,
        employeesResponse,
        userResponse,
      ] = await Promise.all([
        api.get("/projects/"),
        api.get("/tasks/"),
        api.get("/customers/"),
        api.get("/employees/"),
        api.get("/auth/me/"),
      ]);

      setProjects(projectsResponse.data);
      setTasks(tasksResponse.data);
      setCustomers(customersResponse.data);
      setEmployees(employeesResponse.data);
      setCurrentUser(userResponse.data);
    } catch (error: any) {
      console.error("Failed to load project management data:", error);

      if (error?.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(
          error?.response?.data?.detail ||
            "Failed to load project management data.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hydrated) return;

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    loadData();
  }, [hydrated, accessToken, router]);

  /* ============================================================
     PROJECT STATISTICS
  ============================================================ */

  const activeProjects = projects.filter(
    (project) => project.status === "ACTIVE",
  ).length;

  const completedProjects = projects.filter(
    (project) => project.status === "COMPLETED",
  ).length;

  const onHoldProjects = projects.filter(
    (project) => project.status === "ON_HOLD",
  ).length;

  const totalBudget = projects.reduce(
    (sum, project) => sum + Number(project.budget || 0),
    0,
  );

  /* ============================================================
     TASK STATISTICS
  ============================================================ */

  const todoTasks = tasks.filter((task) => task.status === "TODO").length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS",
  ).length;

  const reviewTasks = tasks.filter((task) => task.status === "REVIEW").length;

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const blockedTasks = tasks.filter((task) => task.status === "BLOCKED").length;

  /* ============================================================
     FILTER PROJECTS
  ============================================================ */

  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        project.project_code.toLowerCase().includes(query) ||
        project.name.toLowerCase().includes(query) ||
        (project.customer_name || "").toLowerCase().includes(query);

      const matchesStatus =
        projectStatusFilter === "ALL" || project.status === projectStatusFilter;

      const matchesPriority =
        projectPriorityFilter === "ALL" ||
        project.priority === projectPriorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [projects, projectSearch, projectStatusFilter, projectPriorityFilter]);

  /* ============================================================
     FILTER TASKS
  ============================================================ */

  const filteredTasks = useMemo(() => {
    const query = taskSearch.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.task_code.toLowerCase().includes(query) ||
        task.title.toLowerCase().includes(query) ||
        task.project_name.toLowerCase().includes(query) ||
        (task.assigned_employee_name || "").toLowerCase().includes(query);

      const matchesStatus =
        taskStatusFilter === "ALL" || task.status === taskStatusFilter;

      const matchesPriority =
        taskPriorityFilter === "ALL" || task.priority === taskPriorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, taskSearch, taskStatusFilter, taskPriorityFilter]);

  /* ============================================================
     PROJECT CREATE
  ============================================================ */

  const openCreateProject = () => {
    setEditingProject(null);

    setProjectForm({
      ...emptyProjectForm,
      assign_self: Boolean(currentUser?.id),
    });

    setShowProjectForm(true);
    setError("");
    setSuccess("");
  };

  /* ============================================================
     PROJECT EDIT
  ============================================================ */

  const openEditProject = (project: Project) => {
    setEditingProject(project);

    setProjectForm({
      project_code: project.project_code,
      name: project.name,
      customer: project.customer ? String(project.customer) : "",
      description: project.description || "",
      status: project.status,
      priority: project.priority,
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      budget: String(project.budget ?? "0"),
      progress: String(project.progress ?? "0"),
      assign_self: project.project_manager === currentUser?.id,
    });

    setShowProjectForm(true);
    setError("");
    setSuccess("");
  };

  /* ============================================================
     PROJECT SAVE
  ============================================================ */

  const handleProjectSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload: any = {
        project_code: projectForm.project_code.trim().toUpperCase(),

        name: projectForm.name.trim(),

        customer: projectForm.customer ? Number(projectForm.customer) : null,

        description: projectForm.description.trim(),

        status: projectForm.status,

        priority: projectForm.priority,

        start_date: projectForm.start_date || null,

        end_date: projectForm.end_date || null,

        budget: Number(projectForm.budget || 0),

        progress: Number(projectForm.progress || 0),
      };

      if (projectForm.assign_self && currentUser?.id) {
        payload.project_manager = currentUser.id;
      } else {
        payload.project_manager = null;
      }

      if (editingProject) {
        const response = await api.patch(
          `/projects/${editingProject.id}/`,
          payload,
        );

        setProjects((current) =>
          current.map((project) =>
            project.id === editingProject.id ? response.data : project,
          ),
        );

        setSuccess("Project updated successfully.");
      } else {
        const response = await api.post("/projects/", payload);

        setProjects((current) => [response.data, ...current]);

        setSuccess("Project created successfully.");
      }

      setProjectForm(emptyProjectForm);
      setEditingProject(null);
      setShowProjectForm(false);
    } catch (error: any) {
      console.error("Failed to save project:", error);

      const data = error?.response?.data;

      if (data && typeof data === "object") {
        const messages = Object.entries(data)
          .map(([field, message]) => {
            const text = Array.isArray(message)
              ? message.join(", ")
              : String(message);

            return `${field}: ${text}`;
          })
          .join(" | ");

        setError(messages || "Failed to save project.");
      } else {
        setError("Failed to save project. Please check the form.");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     TASK CREATE
  ============================================================ */

  const openCreateTask = () => {
    setEditingTask(null);

    setTaskForm({
      ...emptyTaskForm,
      project: projects.length > 0 ? String(projects[0].id) : "",
    });

    setShowTaskForm(true);
    setError("");
    setSuccess("");
  };

  /* ============================================================
     TASK EDIT
  ============================================================ */

  const openEditTask = (task: Task) => {
    setEditingTask(task);

    setTaskForm({
      task_code: task.task_code,
      project: String(task.project),
      title: task.title,
      description: task.description || "",
      assigned_to: task.assigned_to ? String(task.assigned_to) : "",
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || "",
      estimated_hours: String(task.estimated_hours ?? "0"),
      actual_hours: String(task.actual_hours ?? "0"),
    });

    setShowTaskForm(true);
    setError("");
    setSuccess("");
  };

  /* ============================================================
     TASK SAVE
  ============================================================ */

  const handleTaskSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        task_code: taskForm.task_code.trim().toUpperCase(),

        project: Number(taskForm.project),

        title: taskForm.title.trim(),

        description: taskForm.description.trim(),

        assigned_to: taskForm.assigned_to ? Number(taskForm.assigned_to) : null,

        status: taskForm.status,

        priority: taskForm.priority,

        due_date: taskForm.due_date || null,

        estimated_hours: Number(taskForm.estimated_hours || 0),

        actual_hours: Number(taskForm.actual_hours || 0),
      };

      if (editingTask) {
        const response = await api.patch(`/tasks/${editingTask.id}/`, payload);

        setTasks((current) =>
          current.map((task) =>
            task.id === editingTask.id ? response.data : task,
          ),
        );

        setSuccess("Task updated successfully.");
      } else {
        const response = await api.post("/tasks/", payload);

        setTasks((current) => [response.data, ...current]);

        setSuccess("Task created successfully.");
      }

      setTaskForm(emptyTaskForm);
      setEditingTask(null);
      setShowTaskForm(false);
    } catch (error: any) {
      console.error("Failed to save task:", error);

      const data = error?.response?.data;

      if (data && typeof data === "object") {
        const messages = Object.entries(data)
          .map(([field, message]) => {
            const text = Array.isArray(message)
              ? message.join(", ")
              : String(message);

            return `${field}: ${text}`;
          })
          .join(" | ");

        setError(messages || "Failed to save task.");
      } else {
        setError("Failed to save task. Please check the form.");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     DELETE PROJECT
  ============================================================ */

  const handleDeleteProject = async () => {
    if (!deleteProject) return;

    try {
      setDeleting(true);
      setError("");

      await api.delete(`/projects/${deleteProject.id}/`);

      setProjects((current) =>
        current.filter((project) => project.id !== deleteProject.id),
      );

      setDeleteProject(null);

      setSuccess("Project deleted successfully.");
    } catch (error: any) {
      console.error("Failed to delete project:", error);

      setError(error?.response?.data?.detail || "Failed to delete project.");
    } finally {
      setDeleting(false);
    }
  };

  /* ============================================================
     DELETE TASK
  ============================================================ */

  const handleDeleteTask = async () => {
    if (!deleteTask) return;

    try {
      setDeleting(true);
      setError("");

      await api.delete(`/tasks/${deleteTask.id}/`);

      setTasks((current) =>
        current.filter((task) => task.id !== deleteTask.id),
      );

      setDeleteTask(null);

      setSuccess("Task deleted successfully.");
    } catch (error: any) {
      console.error("Failed to delete task:", error);

      setError(error?.response?.data?.detail || "Failed to delete task.");
    } finally {
      setDeleting(false);
    }
  };

  /* ============================================================
     LOADING
  ============================================================ */

  if (!hydrated || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-[0.25em] text-cyan-400">
            NEXORA
          </p>

          <p className="mt-3 text-slate-400">
            {hydrated
              ? "Loading projects & tasks..."
              : "Checking authentication..."}
          </p>
        </div>
      </main>
    );
  }

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-cyan-400">
              NEXORA
            </p>

            <h1 className="mt-2 text-3xl font-bold">Projects & Tasks</h1>

            <p className="mt-2 text-slate-400">
              Manage enterprise projects, tasks, assignments and delivery
              progress.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {activeTab === "projects" ? (
              <button
                onClick={openCreateProject}
                className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                + Add Project
              </button>
            ) : (
              <button
                onClick={openCreateTask}
                disabled={projects.length === 0}
                className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Add Task
              </button>
            )}

            <button
              onClick={() => router.push("/")}
              className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-900 hover:text-cyan-400"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* MESSAGES */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* TABS */}

        <div className="mb-8 flex gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2">
          <button
            onClick={() => setActiveTab("projects")}
            className={`flex-1 rounded-lg px-5 py-3 text-sm font-semibold transition ${
              activeTab === "projects"
                ? "bg-cyan-500 text-slate-950"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Projects ({projects.length})
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex-1 rounded-lg px-5 py-3 text-sm font-semibold transition ${
              activeTab === "tasks"
                ? "bg-cyan-500 text-slate-950"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Tasks ({tasks.length})
          </button>
        </div>

        {/* ======================================================
            PROJECTS
        ====================================================== */}

        {activeTab === "projects" && (
          <>
            {/* PROJECT STATS */}

            <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                <p className="text-sm text-slate-400">Total Projects</p>

                <p className="mt-3 text-3xl font-bold text-cyan-400">
                  {projects.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                <p className="text-sm text-slate-400">Active</p>

                <p className="mt-3 text-3xl font-bold text-emerald-400">
                  {activeProjects}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                <p className="text-sm text-slate-400">Completed</p>

                <p className="mt-3 text-3xl font-bold text-cyan-400">
                  {completedProjects}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                <p className="text-sm text-slate-400">On Hold</p>

                <p className="mt-3 text-3xl font-bold text-yellow-400">
                  {onHoldProjects}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                <p className="text-sm text-slate-400">Total Budget</p>

                <p className="mt-3 text-2xl font-bold text-white">
                  ₹{formatCurrency(totalBudget)}
                </p>
              </div>
            </div>

            {/* PROJECT FORM */}

            {showProjectForm && (
              <form
                onSubmit={handleProjectSubmit}
                className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      {editingProject ? "Edit Project" : "Create Project"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Configure project details and delivery information.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProjectForm(false);
                      setEditingProject(null);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Project Code *
                    </label>

                    <input
                      required
                      value={projectForm.project_code}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          project_code: event.target.value,
                        })
                      }
                      placeholder="PRJ-001"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Project Name *
                    </label>

                    <input
                      required
                      value={projectForm.name}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          name: event.target.value,
                        })
                      }
                      placeholder="Enterprise CRM Platform"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Customer
                    </label>

                    <select
                      value={projectForm.customer}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          customer: event.target.value,
                        })
                      }
                      className="input"
                    >
                      <option value="">No Customer</option>

                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.company_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Status
                    </label>

                    <select
                      value={projectForm.status}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          status: event.target.value,
                        })
                      }
                      className="input"
                    >
                      {projectStatuses.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Priority
                    </label>

                    <select
                      value={projectForm.priority}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          priority: event.target.value,
                        })
                      }
                      className="input"
                    >
                      {priorities.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Budget
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={projectForm.budget}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          budget: event.target.value,
                        })
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Start Date
                    </label>

                    <input
                      type="date"
                      value={projectForm.start_date}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          start_date: event.target.value,
                        })
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      End Date
                    </label>

                    <input
                      type="date"
                      value={projectForm.end_date}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          end_date: event.target.value,
                        })
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Progress: {projectForm.progress}%
                    </label>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={projectForm.progress}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          progress: event.target.value,
                        })
                      }
                      className="mt-3 w-full accent-cyan-500"
                    />
                  </div>

                  <div className="flex items-center gap-3 md:pt-7">
                    <input
                      id="assign-self"
                      type="checkbox"
                      checked={projectForm.assign_self}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          assign_self: event.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-cyan-500"
                    />

                    <label
                      htmlFor="assign-self"
                      className="text-sm text-slate-300"
                    >
                      Assign me as Project Manager
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-slate-300">
                      Description
                    </label>

                    <textarea
                      rows={4}
                      value={projectForm.description}
                      onChange={(event) =>
                        setProjectForm({
                          ...projectForm,
                          description: event.target.value,
                        })
                      }
                      placeholder="Describe the project..."
                      className="input resize-none"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProjectForm(false);
                      setEditingProject(null);
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingProject
                        ? "Update Project"
                        : "Create Project"}
                  </button>
                </div>
              </form>
            )}

            {/* PROJECT FILTERS */}

            <div className="mb-6 grid gap-3 md:grid-cols-3">
              <input
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
                placeholder="Search projects..."
                className="input"
              />

              <select
                value={projectStatusFilter}
                onChange={(event) => setProjectStatusFilter(event.target.value)}
                className="input"
              >
                <option value="ALL">All Statuses</option>

                {projectStatuses.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={projectPriorityFilter}
                onChange={(event) =>
                  setProjectPriorityFilter(event.target.value)
                }
                className="input"
              >
                <option value="ALL">All Priorities</option>

                {priorities.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* PROJECT DIRECTORY */}

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
              <div className="border-b border-slate-800 px-6 py-5">
                <h2 className="text-xl font-bold">Project Directory</h2>

                <p className="mt-1 text-sm text-slate-400">
                  {filteredProjects.length} project
                  {filteredProjects.length !== 1 ? "s" : ""} shown
                </p>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-lg font-semibold text-slate-300">
                    No projects found
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Create a project to get started.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/70 text-left text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-4">Project</th>

                        <th className="px-6 py-4">Customer</th>

                        <th className="px-6 py-4">Status</th>

                        <th className="px-6 py-4">Priority</th>

                        <th className="px-6 py-4">Progress</th>

                        <th className="px-6 py-4">Tasks</th>

                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredProjects.map((project) => (
                        <tr
                          key={project.id}
                          className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30"
                        >
                          <td className="px-6 py-5">
                            <p className="font-semibold text-white">
                              {project.name}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-cyan-400">
                              {project.project_code}
                            </p>
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-300">
                            {project.customer_name || "—"}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                                project.status,
                              )}`}
                            >
                              {project.status_display}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityClass(
                                project.priority,
                              )}`}
                            >
                              {project.priority_display}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="w-32">
                              <div className="mb-2 flex justify-between text-xs">
                                <span className="text-slate-500">Progress</span>

                                <span className="font-semibold text-cyan-400">
                                  {project.progress}%
                                </span>
                              </div>

                              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                                <div
                                  className="h-full rounded-full bg-cyan-500"
                                  style={{
                                    width: `${project.progress}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-300">
                            {project.completed_task_count}/{project.task_count}
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setViewingProject(project)}
                                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                              >
                                View
                              </button>

                              <button
                                onClick={() => openEditProject(project)}
                                className="rounded-lg border border-cyan-500/30 px-3 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => setDeleteProject(project)}
                                className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"
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
          </>
        )}

        {/* ======================================================
            TASKS
        ====================================================== */}

        {activeTab === "tasks" && (
          <>
            {/* TASK STATS */}

            <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Total</p>

                <p className="mt-2 text-3xl font-bold text-cyan-400">
                  {tasks.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">To Do</p>

                <p className="mt-2 text-3xl font-bold text-slate-300">
                  {todoTasks}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">In Progress</p>

                <p className="mt-2 text-3xl font-bold text-emerald-400">
                  {inProgressTasks}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Review</p>

                <p className="mt-2 text-3xl font-bold text-yellow-400">
                  {reviewTasks}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Completed</p>

                <p className="mt-2 text-3xl font-bold text-cyan-400">
                  {completedTasks}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Blocked</p>

                <p className="mt-2 text-3xl font-bold text-red-400">
                  {blockedTasks}
                </p>
              </div>
            </div>

            {/* TASK FORM */}

            {showTaskForm && (
              <form
                onSubmit={handleTaskSubmit}
                className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      {editingTask ? "Edit Task" : "Create Task"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Assign and track project work.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowTaskForm(false);
                      setEditingTask(null);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Task Code *
                    </label>

                    <input
                      required
                      value={taskForm.task_code}
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          task_code: event.target.value,
                        })
                      }
                      placeholder="TASK-001"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Project *
                    </label>

                    <select
                      required
                      value={taskForm.project}
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          project: event.target.value,
                        })
                      }
                      className="input"
                    >
                      <option value="">Select project</option>

                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.project_code} — {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-slate-300">
                      Task Title *
                    </label>

                    <input
                      required
                      value={taskForm.title}
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          title: event.target.value,
                        })
                      }
                      placeholder="Implement authentication module"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Assigned Employee
                    </label>

                    <select
                      value={taskForm.assigned_to}
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          assigned_to: event.target.value,
                        })
                      }
                      className="input"
                    >
                      <option value="">Unassigned</option>

                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.last_name} (
                          {employee.employee_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Status
                    </label>

                    <select
                      value={taskForm.status}
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          status: event.target.value,
                        })
                      }
                      className="input"
                    >
                      {taskStatuses.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Priority
                    </label>

                    <select
                      value={taskForm.priority}
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          priority: event.target.value,
                        })
                      }
                      className="input"
                    >
                      {priorities.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Due Date
                    </label>

                    <input
                      type="date"
                      value={taskForm.due_date}
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          due_date: event.target.value,
                        })
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Estimated Hours
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={taskForm.estimated_hours}
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          estimated_hours: event.target.value,
                        })
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Actual Hours
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={taskForm.actual_hours}
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          actual_hours: event.target.value,
                        })
                      }
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-slate-300">
                      Description
                    </label>

                    <textarea
                      rows={4}
                      value={taskForm.description}
                      onChange={(event) =>
                        setTaskForm({
                          ...taskForm,
                          description: event.target.value,
                        })
                      }
                      placeholder="Describe the task..."
                      className="input resize-none"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTaskForm(false);
                      setEditingTask(null);
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || projects.length === 0}
                    className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingTask
                        ? "Update Task"
                        : "Create Task"}
                  </button>
                </div>
              </form>
            )}

            {/* TASK FILTERS */}

            <div className="mb-6 grid gap-3 md:grid-cols-3">
              <input
                value={taskSearch}
                onChange={(event) => setTaskSearch(event.target.value)}
                placeholder="Search tasks..."
                className="input"
              />

              <select
                value={taskStatusFilter}
                onChange={(event) => setTaskStatusFilter(event.target.value)}
                className="input"
              >
                <option value="ALL">All Statuses</option>

                {taskStatuses.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={taskPriorityFilter}
                onChange={(event) => setTaskPriorityFilter(event.target.value)}
                className="input"
              >
                <option value="ALL">All Priorities</option>

                {priorities.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* TASK DIRECTORY */}

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
              <div className="border-b border-slate-800 px-6 py-5">
                <h2 className="text-xl font-bold">Task Directory</h2>

                <p className="mt-1 text-sm text-slate-400">
                  {filteredTasks.length} task
                  {filteredTasks.length !== 1 ? "s" : ""} shown
                </p>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-lg font-semibold text-slate-300">
                    No tasks found
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Create a task to get started.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1150px]">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/70 text-left text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-4">Task</th>

                        <th className="px-6 py-4">Project</th>

                        <th className="px-6 py-4">Assigned To</th>

                        <th className="px-6 py-4">Status</th>

                        <th className="px-6 py-4">Priority</th>

                        <th className="px-6 py-4">Due Date</th>

                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredTasks.map((task) => (
                        <tr
                          key={task.id}
                          className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30"
                        >
                          <td className="px-6 py-5">
                            <p className="font-semibold text-white">
                              {task.title}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-cyan-400">
                              {task.task_code}
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            <p className="text-sm text-white">
                              {task.project_name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {task.project_code}
                            </p>
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-300">
                            {task.assigned_employee_name || "Unassigned"}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                                task.status,
                              )}`}
                            >
                              {task.status_display}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityClass(
                                task.priority,
                              )}`}
                            >
                              {task.priority_display}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-300">
                            {formatDate(task.due_date)}
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setViewingTask(task)}
                                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                              >
                                View
                              </button>

                              <button
                                onClick={() => openEditTask(task)}
                                className="rounded-lg border border-cyan-500/30 px-3 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => setDeleteTask(task)}
                                className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"
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
          </>
        )}

        {/* ======================================================
            PROJECT VIEW MODAL
        ====================================================== */}

        {viewingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-cyan-400">
                    {viewingProject.project_code}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    {viewingProject.name}
                  </h2>
                </div>

                <button
                  onClick={() => setViewingProject(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-500">Customer</p>

                  <p className="mt-2 text-sm text-white">
                    {viewingProject.customer_name || "No customer"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-500">
                    Project Manager
                  </p>

                  <p className="mt-2 text-sm text-white">
                    {viewingProject.project_manager_name || "Unassigned"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-500">Status</p>

                  <span
                    className={`mt-2 inline-block rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                      viewingProject.status,
                    )}`}
                  >
                    {viewingProject.status_display}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-500">Priority</p>

                  <span
                    className={`mt-2 inline-block rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityClass(
                      viewingProject.priority,
                    )}`}
                  >
                    {viewingProject.priority_display}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-500">Start Date</p>

                  <p className="mt-2 text-sm text-white">
                    {formatDate(viewingProject.start_date)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-500">End Date</p>

                  <p className="mt-2 text-sm text-white">
                    {formatDate(viewingProject.end_date)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-500">Budget</p>

                  <p className="mt-2 text-sm text-white">
                    ₹{formatCurrency(viewingProject.budget)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-500">Tasks</p>

                  <p className="mt-2 text-sm text-white">
                    {viewingProject.completed_task_count} /{" "}
                    {viewingProject.task_count} completed
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase text-slate-500">Progress</p>

                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-cyan-500"
                    style={{
                      width: `${viewingProject.progress}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-right text-sm font-semibold text-cyan-400">
                  {viewingProject.progress}%
                </p>
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase text-slate-500">Description</p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                  {viewingProject.description || "No description provided."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            TASK VIEW MODAL
        ====================================================== */}

        {viewingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-cyan-400">
                    {viewingTask.task_code}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    {viewingTask.title}
                  </h2>
                </div>

                <button
                  onClick={() => setViewingTask(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-500">Project</p>

                  <p className="mt-2 text-sm text-white">
                    {viewingTask.project_name}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-500">
                    Assigned To
                  </p>

                  <p className="mt-2 text-sm text-white">
                    {viewingTask.assigned_employee_name || "Unassigned"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-500">Status</p>

                  <span
                    className={`mt-2 inline-block rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                      viewingTask.status,
                    )}`}
                  >
                    {viewingTask.status_display}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-500">Priority</p>

                  <span
                    className={`mt-2 inline-block rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityClass(
                      viewingTask.priority,
                    )}`}
                  >
                    {viewingTask.priority_display}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-500">Due Date</p>

                  <p className="mt-2 text-sm text-white">
                    {formatDate(viewingTask.due_date)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-500">
                    Estimated Hours
                  </p>

                  <p className="mt-2 text-sm text-white">
                    {viewingTask.estimated_hours} hrs
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs uppercase text-slate-500">
                    Actual Hours
                  </p>

                  <p className="mt-2 text-sm text-white">
                    {viewingTask.actual_hours} hrs
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase text-slate-500">Description</p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                  {viewingTask.description || "No description provided."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            DELETE PROJECT MODAL
        ====================================================== */}

        {deleteProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">Delete Project?</h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                This will permanently delete{" "}
                <span className="font-semibold text-white">
                  {deleteProject.name}
                </span>{" "}
                and its associated tasks.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteProject(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-300"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDeleteProject}
                  disabled={deleting}
                  className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete Project"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            DELETE TASK MODAL
        ====================================================== */}

        {deleteTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">Delete Task?</h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                This will permanently delete{" "}
                <span className="font-semibold text-white">
                  {deleteTask.title}
                </span>
                .
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteTask(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-300"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDeleteTask}
                  disabled={deleting}
                  className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete Task"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
