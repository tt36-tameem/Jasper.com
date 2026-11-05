"use client";

import dynamic from "next/dynamic";

const AppSidebar = dynamic(
  () => import("@/components/layout/app-sidebar").then(m => ({ default: m.AppSidebar })),
  { ssr: false }
);

export function SidebarShell() {
  return <AppSidebar />;
}
