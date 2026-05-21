"use client";

import { CrudPage } from "@/components/crud/crud-page";
import { PageLayout } from "@/components/page-layout";
import { apiClient } from "@/lib/api-client";
import { Column } from "@/components/crud/data-table";

interface AuditLog {
  id: number;
  userId: number;
  action: string;
  tableName: string;
  recordId: number;
  beforeData: any;
  afterData: any;
  createdAt: string;
  user?: { id: number; name: string; email: string; role: string };
}

const columns: Column<AuditLog>[] = [
  {
    key: "userName",
    header: "User",
    render: (_, item) => item.user?.name || "System",
  },
  {
    key: "userRole",
    header: "Role",
    render: (_, item) => item.user?.role || "-",
  },
  {
    key: "userEmail",
    header: "Email",
    render: (_, item) => item.user?.email || "-",
  },
  {
    key: "action",
    header: "Action",
    sortable: true,
  },
  {
    key: "tableName",
    header: "Table",
    sortable: true,
    render: (value) => value ? (value.charAt(0).toUpperCase() + value.slice(1)) : "N/A",
  },
  {
    key: "recordId",
    header: "Record ID",
    sortable: true,
  },
  {
    key: "createdAt",
    header: "Date & Time",
    sortable: true,
    render: (value) => new Date(value).toLocaleString(),
  },
];

export default function AuditLogsPage() {
  return (
    <PageLayout title="Audit Logs" breadcrumbs={["Dashboard", "Audit Logs"]}>
      <CrudPage
        title="Audit Logs"
        columns={columns}
        formFields={[]} // Read-only
        api={{
          getAll: apiClient.getAuditLogs,
        }}
        searchPlaceholder="Search audit logs..."
      />
    </PageLayout>
  );
}
