"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { isAdmin } from "@/lib/auth";
import api from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/expenses", label: "Expenses", icon: "💳" },
  { href: "/reports", label: "Reports", icon: "📈" },
  { href: "/categories", label: "Categories", icon: "🏷️", adminOnly: true },
  { href: "/users", label: "Users", icon: "👥", adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    await api.post("/api/v1/auth/logout").catch(() => {});
    logout();
    router.push("/login");
  }

  const role = user?.role;

  return (
    <aside className="w-64 bg-indigo-700 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="px-6 py-5 border-b border-indigo-600">
        <h1 className="font-bold text-lg">HappiMaintenance</h1>
        <p className="text-indigo-300 text-xs mt-0.5">{user?.name}</p>
        <span className="text-xs bg-indigo-500 rounded-full px-2 py-0.5 capitalize">{role}</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin(role))
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname.startsWith(item.href)
                  ? "bg-indigo-600 text-white"
                  : "text-indigo-200 hover:bg-indigo-600 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
      </nav>

      <div className="px-4 py-4 border-t border-indigo-600">
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-indigo-200 hover:text-white px-3 py-2 rounded-lg hover:bg-indigo-600 transition"
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}
