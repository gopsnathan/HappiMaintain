export type Role = "pending" | "contributor" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  is_approved: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_by: string;
  created_at: string;
}

export interface DeleteRequest {
  requested_by: string;
  requested_at: string;
  status: "pending" | "approved" | "rejected";
  reviewed_at: string | null;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category_id: string;
  category_name: string;
  created_by: string;
  created_by_name: string;
  date: string;
  notes: string;
  delete_request: DeleteRequest | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  total_amount: number;
  total_expenses: number;
  active_users: number;
  pending_approvals: number;
  pending_delete_requests: number;
  by_category: { name: string; total: number; count: number }[];
}

export interface ChartData {
  monthly_trend: { month: string; total: number; count: number }[];
  by_category: { name: string; total: number }[];
  by_user: { name: string; total: number; count: number }[];
}
