"use client";

import { useAuthStore } from "@/store/authStore";

interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  const user = useAuthStore((s) => s.user);
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      <span className="text-sm text-gray-500">{user?.email}</span>
    </header>
  );
}
