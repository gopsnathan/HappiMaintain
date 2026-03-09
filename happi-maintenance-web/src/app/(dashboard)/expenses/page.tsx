"use client";

import { useEffect, useState, useCallback } from "react";
import Topbar from "@/components/layout/Topbar";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import DeleteRequestBadge from "@/components/expenses/DeleteRequestBadge";
import api from "@/lib/api";
import { Expense } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { isAdmin, isContributor } from "@/lib/auth";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const user = useAuthStore((s) => s.user);

  const fetchExpenses = useCallback(() => {
    setLoading(true);
    api.get("/api/v1/expenses").then(({ data }) => setExpenses(data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  async function handleDelete(id: string) {
    await api.delete(`/api/v1/expenses/${id}`);
    fetchExpenses();
  }

  async function handleApproveDelete(id: string, approve: boolean) {
    await api.patch(`/api/v1/expenses/${id}/approve-delete?approve=${approve}`);
    fetchExpenses();
  }

  const role = user?.role;
  const admin = isAdmin(role);
  const contributor = isContributor(role);

  return (
    <div>
      <Topbar title="Expenses" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">{expenses.length} expenses</p>
          {contributor && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              + New Expense
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Created By</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((e) => {
                  const isOwner = e.created_by === user?.id;
                  const hasPendingDelete = e.delete_request?.status === "pending";
                  return (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{e.title}</td>
                      <td className="px-4 py-3 text-gray-600">{e.category_name}</td>
                      <td className="px-4 py-3 text-gray-600">{e.created_by_name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-indigo-700">
                        ${e.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(e.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {e.delete_request && <DeleteRequestBadge req={e.delete_request} />}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        {/* Admin approve/reject pending delete */}
                        {admin && hasPendingDelete && (
                          <>
                            <button
                              onClick={() => handleApproveDelete(e.id, true)}
                              className="text-xs text-green-600 hover:underline"
                            >
                              Approve Delete
                            </button>
                            <button
                              onClick={() => handleApproveDelete(e.id, false)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {/* Admin hard delete */}
                        {admin && !hasPendingDelete && (
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                        {/* Contributor request delete for own expenses */}
                        {!admin && isOwner && !e.delete_request && (
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="text-xs text-orange-500 hover:underline"
                          >
                            Request Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No expenses yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <ExpenseForm
          onCreated={() => { setShowForm(false); fetchExpenses(); }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
