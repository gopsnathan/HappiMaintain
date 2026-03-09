"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import ExpenseBarChart from "@/components/charts/ExpenseBarChart";
import ExpensePieChart from "@/components/charts/ExpensePieChart";
import ExpenseLineChart from "@/components/charts/ExpenseLineChart";
import api from "@/lib/api";
import { DashboardSummary, ChartData } from "@/types";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/dashboard/summary"),
      api.get("/api/v1/dashboard/charts"),
    ]).then(([s, c]) => {
      setSummary(s.data);
      setCharts(c.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-gray-400">Loading…</div>;

  return (
    <div>
      <Topbar title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Spend" value={`$${summary?.total_amount.toLocaleString() ?? 0}`} />
          <StatCard label="Expenses" value={summary?.total_expenses ?? 0} />
          <StatCard label="Active Users" value={summary?.active_users ?? 0} />
          <StatCard
            label="Pending"
            value={summary?.pending_approvals ?? 0}
            sub={`${summary?.pending_delete_requests ?? 0} delete requests`}
          />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5" id="bar-chart">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Spend by Category</h3>
            <ExpenseBarChart data={charts?.by_category ?? []} />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5" id="pie-chart">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Category Distribution</h3>
            <ExpensePieChart data={charts?.by_category ?? []} />
          </div>
        </div>

        {/* Monthly trend */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5" id="line-chart">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Trend</h3>
          <ExpenseLineChart data={charts?.monthly_trend ?? []} />
        </div>
      </div>
    </div>
  );
}
