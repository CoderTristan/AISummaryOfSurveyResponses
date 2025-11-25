import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/Sidebar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const {userId} = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset className="mt-14">
          
          <header className="flex items-center justify-start h-7 px-4 w-full border-b">
            <SidebarTrigger />
          </header>

          <main className="flex-1 px-10">
            {children}
          </main>

        </SidebarInset>
    </SidebarProvider>
  );
}
