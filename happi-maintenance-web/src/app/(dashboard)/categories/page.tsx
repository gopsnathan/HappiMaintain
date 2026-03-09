"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import api from "@/lib/api";
import { Category } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { isAdmin } from "@/lib/auth";

export default function CategoriesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isAdmin(user?.role)) router.push("/dashboard");
  }, [user, router]);

  const fetchCategories = useCallback(() => {
    setLoading(true);
    api.get("/api/v1/categories").then(({ data }) => setCategories(data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    await api.post("/api/v1/categories", { name: newName, color: newColor });
    setNewName("");
    setCreating(false);
    fetchCategories();
  }

  async function handleDelete(id: string) {
    await api.delete(`/api/v1/categories/${id}`);
    fetchCategories();
  }

  return (
    <div>
      <Topbar title="Categories" />
      <div className="p-6 space-y-6">
        {/* Create form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Category</h3>
          <form onSubmit={handleCreate} className="flex gap-3 items-end">
            <div className="flex-1">
              <input
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Color</label>
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-9 w-14 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Add
            </button>
          </form>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <p className="p-6 text-gray-400 text-sm">Loading…</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Color</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No categories yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
