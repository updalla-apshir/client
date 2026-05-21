"use client";

import { useEffect, useState } from "react";
import { CrudPage } from "@/components/crud/crud-page";
import { PageLayout } from "@/components/page-layout";
import { apiClient } from "@/lib/api-client";
import { Column } from "@/components/crud/data-table";
import { FormFieldConfig } from "@/components/crud/form-modal";
import { Badge } from "@/components/ui/badge";

interface ParkingSpace {
  id: number;
  buildingId: number;
  slotNumber: string;
  monthlyFee: number;
  status: "available" | "assigned" | "reserved";
  createdAt: string;
  leaseId?: number;
  building?: { id: number; name: string };
  lease?: { id: number; leaseNumber: string };
}

const columns: Column<ParkingSpace>[] = [
  {
    key: "building",
    header: "Building",
    render: (value) => value?.name || "N/A",
  },
  {
    key: "slotNumber",
    header: "Slot #",
    sortable: true,
  },
  {
    key: "monthlyFee",
    header: "Monthly Fee",
    sortable: true,
    render: (value) => `$${value}`,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (value) => (
      <Badge variant={value === "available" ? "default" : value === "assigned" ? "secondary" : "outline"}>
        {value ? (value.charAt(0).toUpperCase() + value.slice(1)) : "N/A"}
      </Badge>
    ),
  },
  {
    key: "lease",
    header: "Assigned to Lease",
    render: (value) => value?.leaseNumber || "Not assigned",
  },
];

export default function ParkingSpacesPage() {
  const [buildings, setBuildings] = useState<{ id: number; name: string }[]>([]);
  const [leases, setLeases] = useState<{ id: number; leaseNumber: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [buildingsData, leasesData] = await Promise.all([
          apiClient.getBuildings(),
          apiClient.getLeases(),
        ]);
        setBuildings(buildingsData);
        setLeases(leasesData);
        setLoaded(true);
      } catch (error) {
        console.error("Failed to fetch dependencies:", error);
        setLoaded(true);
      }
    };

    fetchData();
  }, []);

  const getParkingWithRelations = async () => {
    const parking = await apiClient.getParkingSpaces();
    const buildingMap = new Map(buildings.map((b) => [b.id, b]));
    const leaseMap = new Map(leases.map((l) => [l.id, l]));

    return parking.map((p) => ({
      ...p,
      building: p.buildingId ? buildingMap.get(p.buildingId) : undefined,
      lease: p.leaseId ? leaseMap.get(p.leaseId) : undefined,
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
      name: "slotNumber",
      label: "Slot Number",
      type: "text",
      required: true,
      placeholder: "e.g. P1-01",
    },
    {
      name: "monthlyFee",
      label: "Monthly Fee",
      type: "number",
      required: true,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { label: "Available", value: "available" },
        { label: "Assigned", value: "assigned" },
        { label: "Reserved", value: "reserved" },
      ],
    },
  ];

  if (!loaded) {
    return (
      <PageLayout title="Parking Spaces" breadcrumbs={["Dashboard", "Parking Spaces"]}>
        <div className="flex justify-center items-center h-64">Loading...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Parking Spaces" breadcrumbs={["Dashboard", "Parking Spaces"]}>
      <CrudPage
        title="Parking Spaces"
        columns={columns}
        formFields={formFields}
        api={{
          getAll: getParkingWithRelations,
          create: (data) => apiClient.post("/parking-spaces", data),
          update: (id, data) => apiClient.patch(`/parking-spaces/${id}`, data),
          delete: (id) => apiClient.delete(`/parking-spaces/${id}`),
        }}
        searchPlaceholder="Search parking spaces..."
      />
    </PageLayout>
  );
}
