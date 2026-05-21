"use client";

import { useEffect, useState } from "react";
import { CrudPage } from "@/components/crud/crud-page";
import { PageLayout } from "@/components/page-layout";
import { apiClient } from "@/lib/api-client";
import { Column } from "@/components/crud/data-table";
import { FormFieldConfig } from "@/components/crud/form-modal";
import { Badge } from "@/components/ui/badge";

interface Unit {
  id: number;
  buildingId: number;
  unitNumber: string;
  floor: number;
  area: number;
  usageType: "office" | "shop" | "storage" | "apartment";
  baseRent: number;
  status: "vacant" | "occupied" | "maintenance";
  createdAt: string;
  building?: {
    id: number;
    name: string;
  };
}

const columns: Column<Unit>[] = [
  {
    key: "unitNumber",
    header: "Unit Number",
    sortable: true,
    filterable: true,
    filterType: "text",
  },
  {
    key: "building",
    header: "Building",
    render: (value) => value?.name || "N/A",
  },
  {
    key: "floor",
    header: "Floor",
    sortable: true,
  },
  {
    key: "usageType",
    header: "Usage Type",
    sortable: true,
    filterable: true,
    filterType: "select",
    render: (value) => value ? (value.charAt(0).toUpperCase() + value.slice(1)) : "N/A",
  },
  {
    key: "area",
    header: "Area (sqm)",
    sortable: true,
    render: (value) => `${value} sqm`,
  },
  {
    key: "baseRent",
    header: "Base Rent",
    sortable: true,
    render: (value) => `$${value.toLocaleString()}`,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    filterable: true,
    filterType: "select",
    render: (value) => {
      const variants = {
        vacant: "secondary",
        occupied: "default",
        maintenance: "destructive",
      } as const;
      return (
        <Badge variant={variants[value as keyof typeof variants]}>
          {value ? (value.charAt(0).toUpperCase() + value.slice(1)) : "N/A"}
        </Badge>
      );
    },
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
    name: "buildingId",
    label: "Building",
    type: "select",
    required: true,
    options: [], // This would be populated with actual buildings
    placeholder: "Select a building",
  },
  {
    name: "unitNumber",
    label: "Unit Number",
    type: "text",
    required: true,
    placeholder: "Enter unit number",
  },
  {
    name: "floor",
    label: "Floor",
    type: "number",
    required: true,
    placeholder: "Enter floor number",
  },
  {
    name: "usageType",
    label: "Usage Type",
    type: "select",
    required: true,
    options: [
      { label: "Office", value: "office" },
      { label: "Shop", value: "shop" },
      { label: "Storage", value: "storage" },
      { label: "Apartment", value: "apartment" },
    ],
  },
  {
    name: "area",
    label: "Area (sqm)",
    type: "number",
    required: true,
    placeholder: "Enter area in square meters",
  },
  {
    name: "baseRent",
    label: "Base Rent",
    type: "number",
    required: true,
    placeholder: "Enter base rent amount",
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: [
      { label: "Vacant", value: "vacant" },
      { label: "Occupied", value: "occupied" },
      { label: "Maintenance", value: "maintenance" },
    ],
  },
];

export default function UnitsPage() {
  const [buildings, setBuildings] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const data = await apiClient.getBuildings();
        setBuildings(data);
      } catch (error) {
        console.error("Failed to fetch buildings:", error);
      }
    };

    fetchBuildings();
  }, []);

  const dynamicFormFields: FormFieldConfig[] = [
    {
      name: "buildingId",
      label: "Building",
      type: "select",
      required: true,
      options: buildings.map(building => ({
        label: building.name,
        value: building.id,
      })),
      placeholder: "Select a building",
    },
    ...formFields.slice(1), // Include the rest of the form fields
  ];

  return (
    <PageLayout title="Units" breadcrumbs={["Dashboard", "Units"]}>
      <CrudPage
        title="Units"
        columns={columns}
        formFields={dynamicFormFields}
        api={{
          getAll: apiClient.getUnits,
          create: (data) => apiClient.post("/units", data),
          update: (id, data) => apiClient.patch(`/units/${id}`, data),
          delete: (id) => apiClient.delete(`/units/${id}`),
        }}
        searchPlaceholder="Search units..."
      />
    </PageLayout>
  );
}