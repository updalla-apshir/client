"use client";

import { CrudPage } from "@/components/crud/crud-page";
import { PageLayout } from "@/components/page-layout";
import { apiClient } from "@/lib/api-client";
import { Column } from "@/components/crud/data-table";
import { FormFieldConfig } from "@/components/crud/form-modal";
import { Badge } from "@/components/ui/badge";

interface Account {
  id: number;
  name: string;
  type: "cash" | "bank" | "mobile";
  accountNumber: string;
  currency: string;
  balance: number;
  status: "active" | "inactive";
  createdAt: string;
}

const columns: Column<Account>[] = [
  {
    key: "name",
    header: "Account Name",
    sortable: true,
    filterable: true,
    filterType: "text",
  },
  {
    key: "type",
    header: "Type",
    sortable: true,
    filterable: true,
    filterType: "select",
    render: (value) => (
      <Badge variant="outline">
        {value ? (value.charAt(0).toUpperCase() + value.slice(1)) : "N/A"}
      </Badge>
    ),
  },
  {
    key: "accountNumber",
    header: "Account #",
    sortable: true,
  },
  {
    key: "currency",
    header: "Currency",
    sortable: true,
    filterable: true,
    filterType: "text",
  },
  {
    key: "balance",
    header: "Balance",
    sortable: true,
    render: (value, row) => `${row.currency} ${value}`,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    filterable: true,
    filterType: "select",
    render: (value) => (
      <Badge variant={value === "active" ? "default" : "destructive"}>
        {value ? (value.charAt(0).toUpperCase() + value.slice(1)) : "N/A"}
      </Badge>
    ),
  },
];

const formFields: FormFieldConfig[] = [
  {
    name: "name",
    label: "Account Name",
    type: "text",
    required: true,
    placeholder: "e.g. Main Bank Account",
  },
  {
    name: "type",
    label: "Account Type",
    type: "select",
    required: true,
    options: [
      { label: "Cash", value: "cash" },
      { label: "Bank", value: "bank" },
      { label: "Mobile Money", value: "mobile" },
    ],
  },
  {
    name: "accountNumber",
    label: "Account Number",
    type: "text",
    required: true,
    placeholder: "Enter account number or ID",
  },
  {
    name: "currency",
    label: "Currency",
    type: "text",
    required: true,
  },
  {
    name: "balance",
    label: "Initial Balance",
    type: "number",
    required: true,
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
  },
];

export default function AccountsPage() {
  return (
    <PageLayout title="Accounts" breadcrumbs={["Dashboard", "Accounts"]}>
      <CrudPage
        title="Accounts"
        columns={columns}
        formFields={formFields}
        api={{
          getAll: apiClient.getAccounts,
          create: (data) => apiClient.post("/accounts", data),
          update: (id, data) => apiClient.patch(`/accounts/${id}`, data),
          delete: (id) => apiClient.delete(`/accounts/${id}`),
        }}
        searchPlaceholder="Search accounts..."
      />
    </PageLayout>
  );
}
