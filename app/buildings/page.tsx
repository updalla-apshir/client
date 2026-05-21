"use client";

import { useEffect, useState } from "react";
import { CrudPage } from "@/components/crud/crud-page";
import { PageLayout } from "@/components/page-layout";
import { apiClient } from "@/lib/api-client";
import { Column } from "@/components/crud/data-table";
import { FormFieldConfig } from "@/components/crud/form-modal";

interface Building {
  id: number;
  propertyId: number;
  name: string;
  type: "residential" | "commercial" | "industrial" | "mixed_use";
  floorsCount: number;
  totalArea: number;
  status: string;
  createdAt: string;
  property?: {
    id: number;
    name: string;
  };
}

const columns: Column<Building>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    filterable: true,
    filterType: "text",
  },
  {
    key: "property",
    header: "Property",
    render: (value) => value?.name || "N/A",
  },
  {
    key: "type",
    header: "Type",
    sortable: true,
    filterable: true,
    filterType: "select",
    render: (value) => value ? (value.charAt(0).toUpperCase() + value.slice(1).replace("_", " ")) : "N/A",
  },
  {
    key: "floorsCount",
    header: "Floors",
    sortable: true,
  },
  {
    key: "totalArea",
    header: "Total Area (sqm)",
    sortable: true,
    render: (value) => `${value} sqm`,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    filterable: true,
    filterType: "select",
  },
  {
    key: "createdAt",
    header: "Created",
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString(),
  },
];



export default function BuildingsPage() {
  const [properties, setProperties] = useState<{ id: number; name: string }[]>([]);
  const [propertiesLoaded, setPropertiesLoaded] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await apiClient.getProperties();
        setProperties(data);
        setPropertiesLoaded(true);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
        setPropertiesLoaded(true); // Even on error, mark as loaded to show the UI
      }
    };

    fetchProperties();
  }, []);

  const getBuildingsWithProperties = async () => {
    try {
      const buildings = await apiClient.getBuildings();
      // Properties should already be loaded via useEffect
      const propertyMap = new Map(properties.map(p => [p.id, p]));

      return buildings.map(building => ({
        ...building,
        property: building.propertyId ? propertyMap.get(building.propertyId) : undefined,
      }));
    } catch (error) {
      console.error("Failed to fetch buildings with properties:", error);
      throw error;
    }
  };

  const dynamicFormFields: FormFieldConfig[] = [
    {
      name: "propertyId",
      label: "Property",
      type: "select",
      required: true,
      options: properties.map(property => ({
        label: property.name,
        value: property.id,
      })),
      placeholder: "Select a property",
    },
    {
      name: "name",
      label: "Building Name",
      type: "text",
      required: true,
      placeholder: "Enter building name",
    },
    {
      name: "type",
      label: "Building Type",
      type: "select",
      required: true,
      options: [
        { label: "Residential", value: "residential" },
        { label: "Commercial", value: "commercial" },
        { label: "Industrial", value: "industrial" },
        { label: "Mixed Use", value: "mixed_use" },
      ],
    },
    {
      name: "floorsCount",
      label: "Number of Floors",
      type: "number",
      required: true,
      placeholder: "Enter number of floors",
    },
    {
      name: "totalArea",
      label: "Total Area (sqm)",
      type: "number",
      required: true,
      placeholder: "Enter total area in square meters",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Under Construction", value: "under_construction" },
        { label: "Maintenance", value: "maintenance" },
      ],
      placeholder: "Select building status",
    },
  ];

  if (!propertiesLoaded) {
    return (
      <PageLayout title="Buildings" breadcrumbs={["Dashboard", "Buildings"]}>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading properties...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Buildings" breadcrumbs={["Dashboard", "Buildings"]}>
      <CrudPage
        title="Buildings"
        columns={columns}
        formFields={dynamicFormFields}
        api={{
          getAll: getBuildingsWithProperties,
          create: (data) => apiClient.post("/buildings", data),
          update: (id, data) => apiClient.patch(`/buildings/${id}`, data),
          delete: (id) => apiClient.delete(`/buildings/${id}`),
        }}
        searchPlaceholder="Search buildings..."
      />
    </PageLayout>
  );
}