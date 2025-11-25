'use client'

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function DashboardSidebar() {
  const params = useParams();
  const projectId = params.projectId; // undefined if no projectId in route

  return (
    <Sidebar className="top-[60px] h-[calc(100vh-60px)]">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarMenu>

            {!projectId && (
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

            {/* Only show project-specific links if projectId exists */}
            {projectId && (
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
