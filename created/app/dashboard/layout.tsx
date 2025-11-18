import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/Sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>

      {/* Whole dashboard layout */}
      <div className="flex min-h-screen">

        <DashboardSidebar />

        {/* Main content area */}
        <SidebarInset className="flex-1 pt-14">

          {/* Optional topbar with toggle */}
          <header className="flex items-center h-14 px-4 border-b">
            <SidebarTrigger />
          </header>

          <main  className="p-6">
            {children}
          </main>
        </SidebarInset>

      </div>

    </SidebarProvider>
  )
}

