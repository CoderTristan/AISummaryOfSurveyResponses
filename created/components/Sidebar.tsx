'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

interface DashboardSidebarProps {
  projectId?: string | null;
}

export function DashboardSidebar({ projectId }: DashboardSidebarProps) {
  const pathname = usePathname();

  const isProjectsPage = pathname === "/dashboard/projects";
  const isSubscriptionsPage = pathname === "/dashboard/subscriptions";
  const hasProjectId = !!projectId;

  return (
    <Sidebar className="top-[60px] h-[calc(100vh-60px)]">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarMenu>

            {/* Projects & Subscriptions Links */}
            {isProjectsPage && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/projects">Projects</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/subscriptions">Manage Subscriptions</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}

            {isSubscriptionsPage && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/projects">Back to Projects</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {/* Project-specific Links */}
            {hasProjectId && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={`/dashboard/${projectId}/overview`}>Overview</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={`/dashboard/${projectId}/create`}>Create Survey</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}

          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
