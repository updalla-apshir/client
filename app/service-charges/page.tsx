"use client";

import { useEffect, useState } from "react";
import { CrudPage } from "@/components/crud/crud-page";
import { PageLayout } from "@/components/page-layout";
import { apiClient } from "@/lib/api-client";
import { Column } from "@/components/crud/data-table";
import { FormFieldConfig } from "@/components/crud/form-modal";

interface ServiceCharge {
  id: number;
  buildingId: number;
  name: "security" | "cleaning" | "elevator";
  monthlyFee: number;
  createdAt: string;
  building?: { id: number; name: string };
}

const columns: Column<ServiceCharge>[] = [
  {
    key: "building",
    header: "Building",
    render: (value) => value?.name || "N/A",
  },
  {
    key: "name",
    header: "Charge Name",
    sortable: true,
    filterable: true,
    filterType: "select",
    render: (value) => value ? (value.charAt(0).toUpperCase() + value.slice(1)) : "N/A",
  },
  {
    key: "monthlyFee",
    header: "Monthly Fee",
    sortable: true,
    render: (value) => `$${value}`,
  },
  {
    key: "createdAt",
    header: "Created",
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString(),
  },
];

export default function ServiceChargesPage() {
  const [buildings, setBuildings] = useState<{ id: number; name: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const buildingsData = await apiClient.getBuildings();
        setBuildings(buildingsData);
        setLoaded(true);
      } catch (error) {
        console.error("Failed to fetch buildings:", error);
        setLoaded(true);
      }
    };

    fetchData();
  }, []);

  const getChargesWithRelations = async () => {
    const charges = await apiClient.getServiceCharges();
    const buildingMap = new Map(buildings.map((b) => [b.id, b]));

    return charges.map((charge) => ({
      ...charge,
      building: charge.buildingId ? buildingMap.get(charge.buildingId) : undefined,
    }));
  };

  const formFields: FormFieldConfig[] = [
    {
      name: "buildingId",
      label: "Building",
      type: "select",
      required: true,
      options: buildings.map((b) => ({ label: b.name, value: b.id })),
    },
    {
      name: "name",
      label: "Service Charge Name",
      type: "select",
      required: true,
      options: [
        { label: "Security", value: "security" },
        { label: "Cleaning", value: "cleaning" },
        { label: "Elevator", value: "elevator" },
      ],
    },
    {
      name: "monthlyFee",
      label: "Monthly Fee",
      type: "number",
      required: true,
    },
  ];

  if (!loaded) {
    return (
      <PageLayout title="Service Charges" breadcrumbs={["Dashboard", "Service Charges"]}>
        <div className="flex justify-center items-center h-64">Loading...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Service Charges" breadcrumbs={["Dashboard", "Service Charges"]}>
      <CrudPage
        title="Service Charges"
        columns={columns}
        formFields={formFields}
        api={{
          getAll: getChargesWithRelations,
          create: (data) => apiClient.post("/service-charges", data),
          update: (id, data) => apiClient.patch(`/service-charges/${id}`, data),
          delete: (id) => apiClient.delete(`/service-charges/${id}`),
        }}
        searchPlaceholder="Search service charges..."
      />
    </PageLayout>
  );
}
