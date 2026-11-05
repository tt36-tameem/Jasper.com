"use client";

import { useSidebar } from "@/components/providers/SidebarProvider";

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      data-brand-page
      className="flex-1 min-h-screen overflow-y-auto transition-all duration-300"
      style={{ marginLeft: collapsed ? "3.5rem" : "11rem" }}
    >
      {children}
    </div>
  );
}
