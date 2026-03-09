"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Category } from "@/types";

interface Props {
  onCreated: () => void;
  onClose: () => void;
}

export default function ExpenseForm({ onCreated, onClose }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category_id: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/v1/categories").then(({ data }) => setCategories(data));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/v1/expenses", {
        ...form,
        amount: parseFloat(form.amount),
        date: new Date(form.date).toISOString(),
      });
      onCreated();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(message || "Failed to create expense");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">New Expense</h3>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="title" required placeholder="Title" value={form.title} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input name="amount" required type="number" min="0.01" step="0.01" placeholder="Amount" value={form.amount} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <select name="category_id" required value={form.category_id} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Select category…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input name="date" required type="date" value={form.date} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <textarea name="notes" placeholder="Notes (optional)" value={form.notes} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" rows={2} />
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
