"use client"

import * as React from "react"
import { useEffect, useState } from "react"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { BuildingIcon, HomeIcon, Grid3x3Icon, UsersIcon, FileTextIcon, ReceiptIcon, CreditCardIcon, CarIcon, FileCheckIcon, LayoutDashboardIcon } from "lucide-react"
import { hasMenuAccess, type UserRole } from "@/lib/permissions"

// This is sample data.
const data = {
  navGroups: [
    {
      title: "Dashboard",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: <LayoutDashboardIcon />,
          isActive: true,
        },
      ],
    },
    {
      title: "Property Management",
      items: [
        {
          title: "Properties",
          url: "/properties",
          icon: <HomeIcon />,
        },
        {
          title: "Buildings",
          url: "/buildings",
          icon: <BuildingIcon />,
        },
        {
          title: "Units",
          url: "/units",
          icon: <Grid3x3Icon />,
        },
      ],
    },
    {
      title: "Tenants",
      items: [
        {
          title: "Tenants",
          url: "/tenants",
          icon: <UsersIcon />,
        },
      ],
    },
    {
      title: "Leasing",
      items: [
        {
          title: "Leases",
          url: "/leases",
          icon: <FileTextIcon />,
        },
        {
          title: "Lease History",
          url: "/lease-history",
          icon: <FileCheckIcon />,
        },
      ],
    },
    {
      title: "Finance",
      items: [
        {
          title: "Invoices",
          url: "/invoices",
          icon: <ReceiptIcon />,
        },
        {
          title: "Payments",
          url: "/payments",
          icon: <CreditCardIcon />,
        },
        {
          title: "Accounts",
          url: "/accounts",
          icon: <FileTextIcon />, // Need icon for accounts
        },
        {
          title: "Receipts",
          url: "/receipts",
          icon: <ReceiptIcon />, // Same as invoices?
        },
      ],
    },
    {
      title: "Parking",
      items: [
        {
          title: "Parking Spaces",
          url: "/parking-spaces",
          icon: <CarIcon />,
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          title: "Service Charges",
          url: "/service-charges",
          icon: <FileTextIcon />, // Need icon
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          title: "Users",
          url: "/users",
          icon: <UsersIcon />,
        },
        {
          title: "Audit Logs",
          url: "/audit-logs",
          icon: <FileCheckIcon />,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setRole(user.role);
    }
  }, []);

  const filteredGroups = data.navGroups.filter((group) =>
    hasMenuAccess(role, group.title)
  );

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="group-data-[collapsible=icon]:!p-2!">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <BuildingIcon className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Commercial
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={filteredGroups} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
