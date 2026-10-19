"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import WorkspaceLayout from "@/components/WorkspaceLayout";

type DocumentItem = {
  id: number;
  document_code: string;
  title: string;
  description: string;
  file: string | null;
  file_url: string | null;

  document_type: string;
  document_type_display: string;

  category: string;
  category_display: string;

  project: number | null;
  project_name: string | null;

  customer: number | null;
  customer_name: string | null;

  uploaded_by: string | null;
  uploaded_by_name: string | null;

  file_size: number;
  file_extension: string;
  version: number;

  is_public: boolean;
  is_active: boolean;

  created_at: string;
  updated_at: string;
};

type Customer = {
  id: number;
  company_name: string;
};

type Project = {
  id: number;
  project_code: string;
  name: string;
};

const DOCUMENT_TYPES = [
  ["POLICY", "Policy"],
  ["CONTRACT", "Contract"],
  ["REPORT", "Report"],
  ["INVOICE", "Invoice"],
  ["PROPOSAL", "Proposal"],
  ["MANUAL", "Manual"],
  ["TECHNICAL", "Technical"],
  ["OTHER", "Other"],
];

const CATEGORIES = [
  ["BUSINESS", "Business"],
  ["FINANCE", "Finance"],
  ["HR", "HR"],
  ["LEGAL", "Legal"],
  ["TECHNOLOGY", "Technology"],
  ["OPERATIONS", "Operations"],
  ["PROJECT", "Project"],
  ["OTHER", "Other"],
];

const emptyForm = {
  document_code: "",
  title: "",
  description: "",
  document_type: "OTHER",
  category: "OTHER",
  project: "",
  customer: "",
  version: "1",
  is_public: false,
  is_active: true,
};

function formatFileSize(bytes: number) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDate(value: string) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(
    null,
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiSources, setAiSources] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  async function askNexoraAI(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = aiQuestion.trim();
    if (!question || aiLoading) return;

    setAiLoading(true);
    setAiError("");
    setAiAnswer("");
    setAiSources([]);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_AI_URL || "http://127.0.0.1:8001";

      const response = await fetch(`${baseUrl}/api/v1/ai/rag/context`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: question,
          limit: 5,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "The AI service could not answer your question.",
        );
      }

      const answer =
        data.answer ??
        data.generated_answer ??
        data.response ??
        data.context ??
        "";

      if (typeof answer === "string" && answer.trim()) {
        setAiAnswer(answer);
      } else {
        setAiError(
          "The AI service returned no answer. Please check the response format.",
        );
      }

      const rawSources = data.sources ?? data.results ?? [];
      setAiSources(
        Array.isArray(rawSources)
          ? rawSources.map((source: unknown) =>
              typeof source === "string" ? source : JSON.stringify(source),
            )
          : [],
      );
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the NEXORA AI service.",
      );
    } finally {
      setAiLoading(false);
    }
  }

  async function loadData() {
    try {
      setLoading(true);

      const [documentsResponse, customersResponse, projectsResponse] =
        await Promise.all([
          api.get("/documents/"),
          api.get("/customers/"),
          api.get("/projects/"),
        ]);

      setDocuments(
        Array.isArray(documentsResponse.data)
          ? documentsResponse.data
          : documentsResponse.data.results || [],
      );

      setCustomers(
        Array.isArray(customersResponse.data)
          ? customersResponse.data
          : customersResponse.data.results || [],
      );

      setProjects(
        Array.isArray(projectsResponse.data)
          ? projectsResponse.data
          : projectsResponse.data.results || [],
      );
    } catch (error) {
      console.error("Failed to load documents:", error);
      alert("Failed to load document data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesSearch =
        !query ||
        document.document_code.toLowerCase().includes(query) ||
        document.title.toLowerCase().includes(query) ||
        document.description.toLowerCase().includes(query) ||
        (document.customer_name || "").toLowerCase().includes(query) ||
        (document.project_name || "").toLowerCase().includes(query);

      const matchesType = !typeFilter || document.document_type === typeFilter;

      const matchesCategory =
        !categoryFilter || document.category === categoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [documents, search, typeFilter, categoryFilter]);

  const stats = useMemo(() => {
    const totalSize = documents.reduce(
      (sum, document) => sum + Number(document.file_size || 0),
      0,
    );

    return {
      total: documents.length,
      active: documents.filter((document) => document.is_active).length,
      public: documents.filter((document) => document.is_public).length,
      projects: documents.filter((document) => document.project).length,
      totalSize,
    };
  }, [documents]);

  function openCreateModal() {
    setEditingDocument(null);
    setSelectedFile(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditModal(document: DocumentItem) {
    setEditingDocument(document);
    setSelectedFile(null);

    setForm({
      document_code: document.document_code,
      title: document.title,
      description: document.description || "",
      document_type: document.document_type,
      category: document.category,
      project: document.project ? String(document.project) : "",
      customer: document.customer ? String(document.customer) : "",
      version: String(document.version),
      is_public: document.is_public,
      is_active: document.is_active,
    });

    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingDocument(null);
    setSelectedFile(null);
  }

  function updateForm(field: keyof typeof emptyForm, value: string | boolean) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingDocument && !selectedFile) {
      alert("Please select a document file.");
      return;
    }

    if (!form.document_code.trim()) {
      alert("Document code is required.");
      return;
    }

    if (!form.title.trim()) {
      alert("Document title is required.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("document_code", form.document_code.trim());
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("document_type", form.document_type);
      formData.append("category", form.category);
      formData.append("version", form.version);
      formData.append("is_public", String(form.is_public));
      formData.append("is_active", String(form.is_active));

      if (form.project) {
        formData.append("project", form.project);
      }

      if (form.customer) {
        formData.append("customer", form.customer);
      }

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      if (editingDocument) {
        await api.patch(`/documents/${editingDocument.id}/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await api.post("/documents/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      closeModal();
      await loadData();

      alert(
        editingDocument
          ? "Document updated successfully."
          : "Document uploaded successfully.",
      );
    } catch (error: any) {
      console.error("Document save failed:", error);

      const responseData = error?.response?.data;

      if (responseData) {
        console.error("Backend validation:", responseData);
        alert(
          `Failed to save document.\n\n${JSON.stringify(
            responseData,
            null,
            2,
          )}`,
        );
      } else {
        alert("Failed to save document.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(document: DocumentItem) {
    const confirmed = window.confirm(
      `Delete "${document.title}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await api.delete(`/documents/${document.id}/`);

      setDocuments((previous) =>
        previous.filter((item) => item.id !== document.id),
      );

      alert("Document deleted successfully.");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete document.");
    }
  }

  function openDocument(document: DocumentItem) {
    if (!document.file_url) {
      alert("File URL is not available.");
      return;
    }

    window.open(document.file_url, "_blank", "noopener,noreferrer");
  }

  return (
    <WorkspaceLayout>
      <div className="min-w-0 space-y-6 pb-10">
        <main className="min-h-screen bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
            {/* Header */}
            <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  NEXORA
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Document Management
                </h1>

                <p className="mt-2 text-sm text-slate-400">
                  Manage enterprise documents, contracts, reports, policies and
                  technical files.
                </p>
              </div>

              <button
                onClick={openCreateModal}
                className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                + Upload Document
              </button>
            </section>

            {/* Ask NEXORA AI */}
            <section className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 p-5 shadow-xl sm:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    NEXORA Intelligence
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Ask NEXORA AI
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Ask questions about information in your indexed documents.
                  </p>
                </div>

                <span className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300">
                  AI Document Assistant
                </span>
              </div>

              <form onSubmit={askNexoraAI} className="space-y-3">
                <label
                  htmlFor="nexora-ai-question"
                  className="block text-sm font-medium text-slate-300"
                >
                  Your question
                </label>

                <textarea
                  id="nexora-ai-question"
                  value={aiQuestion}
                  onChange={(event) => setAiQuestion(event.target.value)}
                  placeholder="Example: What are the key points in our project documents?"
                  rows={3}
                  maxLength={2000}
                  required
                  className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Answers depend on documents indexed in the AI knowledge
                    base.
                  </p>

                  <button
                    type="submit"
                    disabled={aiLoading || !aiQuestion.trim()}
                    className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {aiLoading ? "Thinking..." : "Ask NEXORA AI →"}
                  </button>
                </div>
              </form>

              {aiLoading && (
                <div
                  role="status"
                  className="mt-5 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/50 p-4 text-sm text-cyan-300"
                >
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                  Searching indexed documents and preparing an answer...
                </div>
              )}

              {aiError && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
                >
                  {aiError}
                </div>
              )}

              {aiAnswer && (
                <div className="mt-5 rounded-xl border border-cyan-500/20 bg-slate-950/60 p-5">
                  <h3 className="mb-3 font-semibold text-cyan-300">
                    AI Answer
                  </h3>

                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">
                    {aiAnswer}
                  </p>

                  {aiSources.length > 0 && (
                    <div className="mt-5 border-t border-slate-800 pt-4">
                      <h4 className="mb-2 text-sm font-semibold text-white">
                        Retrieved Sources
                      </h4>

                      <ul className="space-y-2">
                        {aiSources.map((source, index) => (
                          <li
                            key={`${index}-${source}`}
                            className="break-words rounded-lg bg-slate-900 p-3 text-xs leading-5 text-slate-400"
                          >
                            {source}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Stats */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Total Documents" value={stats.total} />

              <StatCard label="Active" value={stats.active} />

              <StatCard label="Public" value={stats.public} />

              <StatCard label="Linked Projects" value={stats.projects} />

              <StatCard
                label="Storage Used"
                value={formatFileSize(stats.totalSize)}
              />
            </section>

            {/* Filters */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search documents..."
                  className="input"
                />

                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="input"
                >
                  <option value="">All document types</option>

                  {DOCUMENT_TYPES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="input"
                >
                  <option value="">All categories</option>

                  {CATEGORIES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Documents */}
            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
              <div className="border-b border-slate-800 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Document Directory</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Showing {filteredDocuments.length} of {documents.length}{" "}
                      documents
                    </p>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-10 text-center text-slate-400">
                  Loading documents...
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl">📄</div>

                  <h3 className="mt-4 text-lg font-semibold">
                    No documents found
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Upload your first document to get started.
                  </p>

                  <button
                    onClick={openCreateModal}
                    className="mt-5 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
                  >
                    Upload Document
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px]">
                    <thead className="border-b border-slate-800 bg-slate-950/50">
                      <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-4">Document</th>
                        <th className="px-5 py-4">Type</th>
                        <th className="px-5 py-4">Category</th>
                        <th className="px-5 py-4">Project</th>
                        <th className="px-5 py-4">Customer</th>
                        <th className="px-5 py-4">Version</th>
                        <th className="px-5 py-4">Size</th>
                        <th className="px-5 py-4">Created</th>
                        <th className="px-5 py-4">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredDocuments.map((document) => (
                        <tr
                          key={document.id}
                          className="border-b border-slate-800/70 transition hover:bg-slate-800/30"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-lg">
                                📄
                              </div>

                              <div>
                                <p className="font-medium text-white">
                                  {document.title}
                                </p>

                                <p className="text-xs text-slate-500">
                                  {document.document_code}
                                </p>

                                <div className="mt-1 flex gap-2">
                                  {document.is_active && (
                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                                      Active
                                    </span>
                                  )}

                                  {document.is_public && (
                                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                                      Public
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                              {document.document_type_display}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-300">
                            {document.category_display}
                          </td>

                          <td className="px-5 py-4">
                            {document.project_name ? (
                              <div>
                                <p className="text-sm text-white">
                                  {document.project_name}
                                </p>

                                <p className="text-xs text-slate-500">
                                  {document.project
                                    ? `Project #${document.project}`
                                    : ""}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">—</span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-300">
                            {document.customer_name || "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-300">
                            v{document.version}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-400">
                            {formatFileSize(document.file_size)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-400">
                            {formatDate(document.created_at)}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openDocument(document)}
                                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-cyan-500 hover:text-cyan-400"
                              >
                                View
                              </button>

                              <button
                                onClick={() => openEditModal(document)}
                                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-cyan-500 hover:text-cyan-400"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleDelete(document)}
                                className="rounded-lg border border-red-900/50 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10"
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
            </section>
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-5">
                  <div>
                    <h2 className="text-xl font-bold">
                      {editingDocument ? "Edit Document" : "Upload Document"}
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {editingDocument
                        ? "Update document metadata or replace the file."
                        : "Add a document to the NEXORA knowledge base."}
                    </p>
                  </div>

                  <button
                    onClick={closeModal}
                    className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 p-6">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Document Code *
                      </label>

                      <input
                        value={form.document_code}
                        onChange={(event) =>
                          updateForm("document_code", event.target.value)
                        }
                        placeholder="DOC-001"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Version
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={form.version}
                        onChange={(event) =>
                          updateForm("version", event.target.value)
                        }
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Title *
                    </label>

                    <input
                      value={form.title}
                      onChange={(event) =>
                        updateForm("title", event.target.value)
                      }
                      placeholder="Enterprise Security Policy"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Description
                    </label>

                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        updateForm("description", event.target.value)
                      }
                      placeholder="Describe this document..."
                      rows={4}
                      className="input resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Document Type
                      </label>

                      <select
                        value={form.document_type}
                        onChange={(event) =>
                          updateForm("document_type", event.target.value)
                        }
                        className="input"
                      >
                        {DOCUMENT_TYPES.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Category
                      </label>

                      <select
                        value={form.category}
                        onChange={(event) =>
                          updateForm("category", event.target.value)
                        }
                        className="input"
                      >
                        {CATEGORIES.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Project
                      </label>

                      <select
                        value={form.project}
                        onChange={(event) =>
                          updateForm("project", event.target.value)
                        }
                        className="input"
                      >
                        <option value="">No project</option>

                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.project_code} — {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Customer
                      </label>

                      <select
                        value={form.customer}
                        onChange={(event) =>
                          updateForm("customer", event.target.value)
                        }
                        className="input"
                      >
                        <option value="">No customer</option>

                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.company_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Document File {!editingDocument && "*"}
                    </label>

                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-5">
                      <input
                        type="file"
                        onChange={(event) =>
                          setSelectedFile(event.target.files?.[0] || null)
                        }
                        className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:font-semibold file:text-slate-950 hover:file:bg-cyan-400"
                      />

                      {selectedFile && (
                        <p className="mt-3 text-sm text-cyan-400">
                          Selected: {selectedFile.name} (
                          {formatFileSize(selectedFile.size)})
                        </p>
                      )}

                      {editingDocument && !selectedFile && (
                        <p className="mt-3 text-xs text-slate-500">
                          Leave empty to keep the existing file.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={form.is_public}
                        onChange={(event) =>
                          updateForm("is_public", event.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                      />

                      <span className="text-sm text-slate-300">
                        Public document
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(event) =>
                          updateForm("is_active", event.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                      />

                      <span className="text-sm text-slate-300">
                        Active document
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                      className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving
                        ? "Saving..."
                        : editingDocument
                          ? "Update Document"
                          : "Upload Document"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </WorkspaceLayout>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
