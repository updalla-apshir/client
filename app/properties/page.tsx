"use client";

import { CrudPage } from "@/components/crud/crud-page";
import { PageLayout } from "@/components/page-layout";
import { apiClient } from "@/lib/api-client";
import { Column } from "@/components/crud/data-table";
import { FormFieldConfig } from "@/components/crud/form-modal";

interface Property {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  landArea: number;
  createdAt: string;
}

const columns: Column<Property>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
  },
  {
    key: "address",
    header: "Address",
    sortable: true,
  },
  {
    key: "city",
    header: "City",
    sortable: true,
  },
  {
    key: "country",
    header: "Country",
    sortable: true,
  },
  {
    key: "landArea",
    header: "Land Area (sqm)",
    sortable: true,
    render: (value) => `${value} sqm`,
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
    label: "Property Name",
    type: "text",
    required: true,
    placeholder: "Enter property name",
  },
  {
    name: "address",
    label: "Address",
    type: "text",
    required: true,
    placeholder: "Enter property address",
  },
  {
    name: "city",
    label: "City",
    type: "text",
    required: true,
    placeholder: "Enter city",
  },
  {
    name: "country",
    label: "Country",
    type: "text",
    required: true,
    placeholder: "Enter country",
  },
  {
    name: "landArea",
    label: "Land Area (sqm)",
    type: "number",
    required: true,
    placeholder: "Enter land area in square meters",
  },
];

export default function PropertiesPage() {
  return (
    <PageLayout title="Properties" breadcrumbs={["Dashboard", "Properties"]}>
      <CrudPage
        title="Properties"
        columns={columns}
        formFields={formFields}
        api={{
          getAll: apiClient.getProperties,
          create: (data) => apiClient.post("/properties", data),
          update: (id, data) => apiClient.patch(`/properties/${id}`, data),
          delete: (id) => apiClient.delete(`/properties/${id}`),
        }}
        searchPlaceholder="Search properties..."
        enablePolling={true}
        pollingInterval={15000} // Poll every 15 seconds
      />
    </PageLayout>
  );
}