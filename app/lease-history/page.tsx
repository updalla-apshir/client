"use client";

import { CrudPage } from "@/components/crud/crud-page";
import { PageLayout } from "@/components/page-layout";
import { apiClient } from "@/lib/api-client";
import { Column } from "@/components/crud/data-table";
import { Badge } from "@/components/ui/badge";

interface LeaseStatusHistory {
  id: number;
  leaseId: number;
  oldStatus: string | null;
  newStatus: string;
  changedBy: number;
  changedAt: string;
  note: string | null;
}

const columns: Column<LeaseStatusHistory>[] = [
  {
    key: "leaseId",
    header: "Lease ID",
    sortable: true,
  },
  {
    key: "oldStatus",
    header: "Old Status",
    render: (value) => value ? (
      <Badge variant="secondary">
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Badge>
    ) : "Initial",
  },
  {
    key: "newStatus",
    header: "New Status",
    render: (value) => (
      <Badge variant="default">
        {value ? (value.charAt(0).toUpperCase() + value.slice(1)) : "N/A"}
      </Badge>
    ),
  },
  {
    key: "changedAt",
    header: "Changed At",
    sortable: true,
    render: (value) => new Date(value).toLocaleString(),
  },
  {
    key: "note",
    header: "Note",
  },
];

export default function LeaseHistoryPage() {
  return (
    <PageLayout title="Lease History" breadcrumbs={["Dashboard", "Lease History"]}>
      <CrudPage
        title="Lease History"
        columns={columns}
        formFields={[]} // Read-only
        api={{
          getAll: apiClient.getLeaseHistory,
        }}
        searchPlaceholder="Search history..."
      />
    </PageLayout>
  );
}
