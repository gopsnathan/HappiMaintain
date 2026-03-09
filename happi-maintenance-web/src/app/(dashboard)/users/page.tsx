"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import api from "@/lib/api";
import { User, Role } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { isAdmin } from "@/lib/auth";

const ROLE_BADGE: Record<Role, string> = {
  admin: "bg-indigo-100 text-indigo-700",
  contributor: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
};

export default function UsersPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin(currentUser?.role)) router.push("/dashboard");
  }, [currentUser, router]);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    api.get("/api/v1/users").then(({ data }) => setUsers(data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleApprove(id: string) {
    await api.patch(`/api/v1/users/${id}/approve`);
    fetchUsers();
  }

  async function handleRoleChange(id: string, role: Role) {
    await api.patch(`/api/v1/users/${id}/role`, { role });
    fetchUsers();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this user?")) return;
    await api.delete(`/api/v1/users/${id}`);
    fetchUsers();
  }

  return (
    <div>
      <Topbar title="Users" />
      <div className="p-6">
        {loading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.id !== currentUser?.id ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                          className="border border-gray-300 rounded-md px-2 py-1 text-xs"
                          disabled={u.role === "pending"}
                        >
                          <option value="contributor">Contributor</option>
                          <option value="admin">Admin</option>
                          {u.role === "pending" && <option value="pending">Pending</option>}
                        </select>
                      ) : (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[u.role]}`}>
                          {u.role} (you)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_approved ? (
                        <span className="text-xs text-green-600 font-medium">Active</span>
                      ) : (
                        <span className="text-xs text-yellow-600 font-medium">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      {!u.is_approved && (
                        <button
                          onClick={() => handleApprove(u.id)}
                          className="text-xs text-indigo-600 hover:underline font-medium"
                        >
                          Approve
                        </button>
                      )}
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No users</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
