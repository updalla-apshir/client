"use client";

import { CrudPage } from "@/components/crud/crud-page";
import { PageLayout } from "@/components/page-layout";
import { apiClient } from "@/lib/api-client";
import { Column } from "@/components/crud/data-table";
import { FormFieldConfig } from "@/components/crud/form-modal";

interface Tenant {
  id: number;
  name: string;
  type: "company" | "individual";
  phone: string;
  createdAt: string;
}

const columns: Column<Tenant>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
  },
  {
    key: "type",
    header: "Type",
    sortable: true,
    render: (value) => value ? (value.charAt(0).toUpperCase() + value.slice(1)) : "N/A",
  },
  {
    key: "phone",
    header: "Phone",
    sortable: true,
  },
  {
    key: "createdAt",
    header: "Created",
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString(),
  },
];

const formFields: FormFieldConfig[] = [
  {
    name: "name",
    label: "Tenant Name",
    type: "text",
    required: true,
    placeholder: "Enter tenant name",
  },
  {
    name: "type",
    label: "Tenant Type",
    type: "select",
    required: true,
    options: [
      { label: "Company", value: "company" },
      { label: "Individual", value: "individual" },
    ],
  },
  {
    name: "phone",
    label: "Phone Number",
    type: "text",
    required: true,
    placeholder: "Enter phone number",
  },
];

export default function TenantsPage() {
  return (
    <PageLayout title="Tenants" breadcrumbs={["Dashboard", "Tenants"]}>
      <CrudPage
        title="Tenants"
        columns={columns}
        formFields={formFields}
        api={{
          getAll: apiClient.getTenants,
          create: (data) => apiClient.post("/tenants", data),
          update: (id, data) => apiClient.patch(`/tenants/${id}`, data),
          delete: (id) => apiClient.delete(`/tenants/${id}`),
        }}
        searchPlaceholder="Search tenants..."
      />
    </PageLayout>
  );
}