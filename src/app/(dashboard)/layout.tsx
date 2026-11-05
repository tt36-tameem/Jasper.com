import { AIModeProvider } from "@/components/providers/AIModeProvider";
import { SidebarProvider } from "@/components/providers/SidebarProvider";
import { DashboardContent } from "@/components/layout/dashboard-content";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { VoiceGreeting } from "@/components/ai-mode/VoiceGreeting";
import { AutomationTicker } from "@/components/automation/automation-live";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AIModeProvider>
      <SidebarProvider>
        <div className="flex h-full bg-zinc-50 dark:bg-zinc-950">
          <SidebarShell />
          <DashboardContent>{children}</DashboardContent>
        </div>
        <VoiceGreeting />
        <AutomationTicker />
      </SidebarProvider>
    </AIModeProvider>
  );
}
