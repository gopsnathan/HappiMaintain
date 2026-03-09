"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/layout/Topbar";
import ExpenseBarChart from "@/components/charts/ExpenseBarChart";
import ExpensePieChart from "@/components/charts/ExpensePieChart";
import ExpenseLineChart from "@/components/charts/ExpenseLineChart";
import api from "@/lib/api";
import { exportExpensesToExcel, exportChartAsPng } from "@/lib/export";
import { Expense, ChartData } from "@/types";

export default function ReportsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/expenses?limit=200"),
      api.get("/api/v1/dashboard/charts"),
    ]).then(([e, c]) => {
      setExpenses(e.data);
      setCharts(c.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-gray-400">Loading…</div>;

  return (
    <div>
      <Topbar title="Reports & Export" />
      <div className="p-6 space-y-6">
        {/* Export actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Export Data</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => exportExpensesToExcel(expenses)}
              className="flex items-center gap-2 bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              📊 Export to Excel
            </button>
            <button
              onClick={() => exportChartAsPng("report-bar", "expenses-by-category.png")}
              className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              📷 Export Bar Chart PNG
            </button>
            <button
              onClick={() => exportChartAsPng("report-pie", "expenses-pie.png")}
              className="flex items-center gap-2 bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              📷 Export Pie Chart PNG
            </button>
            <button
              onClick={() => exportChartAsPng("report-trend", "monthly-trend.png")}
              className="flex items-center gap-2 bg-cyan-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-cyan-700"
            >
              📷 Export Trend PNG
            </button>
          </div>
        </div>

        {/* Charts for export */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div id="report-bar" className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Spend by Category</h3>
            <ExpenseBarChart data={charts?.by_category ?? []} />
          </div>
          <div id="report-pie" className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Category Distribution</h3>
            <ExpensePieChart data={charts?.by_category ?? []} />
          </div>
        </div>

        <div id="report-trend" className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Spend Trend</h3>
          <ExpenseLineChart data={charts?.monthly_trend ?? []} />
        </div>

        {/* Summary table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">All Expenses ({expenses.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">By</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-800">{e.title}</td>
                  <td className="px-4 py-2 text-gray-600">{e.category_name}</td>
                  <td className="px-4 py-2 text-gray-600">{e.created_by_name}</td>
                  <td className="px-4 py-2 text-right font-semibold text-indigo-700">${e.amount.toFixed(2)}</td>
                  <td className="px-4 py-2 text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
