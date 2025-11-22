import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>

        <DashboardSidebar />

        {/* Inset content fills remaining space */}
        <SidebarInset className="mt-14">

          {/* Topbar */}
          <header className="flex items-center justify-start h-7 px-4 w-full border-b">
            <SidebarTrigger />
          </header>

          {/* Main content */}
          <main className="flex-1 px-10">
            {children}
          </main>

        </SidebarInset>
    </SidebarProvider>
  );
}
