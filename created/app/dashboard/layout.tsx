import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      {/* Full screen flex container */}
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <DashboardSidebar />

        {/* Inset content fills remaining space */}
        <SidebarInset className="flex flex-col flex-1 mt-15">

          {/* Topbar */}
          <header className="flex items-center justify-start h-14 px-4 w-full border-b">
            <SidebarTrigger />
          </header>

          {/* Main content */}
          <main className="flex-1 px-26">
            {children}
          </main>

        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
