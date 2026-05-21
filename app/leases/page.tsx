"use client";

import { useEffect, useState } from "react";
import { CrudPage } from "@/components/crud/crud-page";
import { PageLayout } from "@/components/page-layout";
import { apiClient } from "@/lib/api-client";
import { Column } from "@/components/crud/data-table";
import { FormFieldConfig } from "@/components/crud/form-modal";
import { Badge } from "@/components/ui/badge";

interface Lease {
  id: number;
  leaseNumber: string;
  tenantId: number;
  unitId: number;
  startDate: string;
  endDate: string | null;
  billingCycleMonths: string;
  gracePeriodDays: number;
  depositAmount: number;
  depositStatus: string;
  status: string;
  createdAt: string;
  tenant?: { id: number; name: string };
  unit?: { id: number; unitNumber: string; buildingId: number };
  parkingSpaces?: any[];
  serviceCharges?: any[];
  invoices?: any[];
  parkingSpaceIds?: number[];
}

const columns: Column<Lease>[] = [
  {
    key: "leaseNumber",
    header: "Lease #",
    sortable: true,
    filterable: true,
    filterType: "text",
  },
  {
    key: "tenant",
    header: "Tenant",
    render: (value) => value?.name || "N/A",
  },
  {
    key: "unit",
    header: "Unit",
    render: (value) => value?.unitNumber || "N/A",
  },
  {
    key: "startDate",
    header: "Start Date",
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString(),
  },
  {
    key: "endDate",
    header: "End Date",
    sortable: true,
    render: (value) => value ? new Date(value).toLocaleDateString() : "Open Ended",
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    filterable: true,
    filterType: "select",
    render: (value) => (
      <Badge variant={value === "active" ? "default" : value === "terminated" ? "destructive" : "secondary"}>
        {value ? (value.charAt(0).toUpperCase() + value.slice(1)) : "N/A"}
      </Badge>
    ),
  },
  {
    key: "depositAmount",
    header: "Deposit",
    sortable: true,
    render: (value) => `$${value}`,
  },
  {
    key: "depositStatus",
    header: "Deposit Status",
    sortable: true,
    filterable: true,
    filterType: "select",
    render: (value) => value ? (value.charAt(0).toUpperCase() + value.slice(1)) : "N/A",
  },
  {
    key: "parkingSpaces",
    header: "Parking Spaces",
    render: (value) => value?.length ? `${value.length} assigned` : "None",
  },
  {
    key: "serviceCharges",
    header: "Service Charges",
    render: (value) => value?.length ? `${value.length} applied` : "None",
  },
  {
    key: "invoices",
    header: "Invoices",
    render: (value) => value?.length ? `${value.length} generated` : "None",
  },
];

export default function LeasesPage() {
  const [tenants, setTenants] = useState<{ id: number; name: string }[]>([]);
  const [units, setUnits] = useState<{ id: number; unitNumber: string; buildingId: number }[]>([]);
  const [buildings, setBuildings] = useState<{ id: number; name: string }[]>([]);
  const [leases, setLeases] = useState<{ id: number; unitId: number; status: string }[]>([]);
  const [parkingSpaces, setParkingSpaces] = useState<{ id: number; slotNumber: string; status: string; building?: { name: string }; leaseId?: number; buildingId?: number }[]>([]);
  const [serviceCharges, setServiceCharges] = useState<{ id: number; name: string; monthlyFee: number; buildingId: number }[]>([]);
  const [invoices, setInvoices] = useState<{ id: number; leaseId: number; status: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tenantsData, unitsData, buildingsData, leasesData, parkingData, serviceChargesData, invoicesData] = await Promise.all([
          apiClient.getTenants(),
          apiClient.getUnits(),
          apiClient.getBuildings(),
          apiClient.getLeases(),
          apiClient.getParkingSpaces(),
          apiClient.getServiceCharges(),
          apiClient.getInvoices(),
        ]);



        // Enrich parking spaces with building information
        const buildingMap = new Map(buildingsData.map((b: any) => [b.id, b]));
        const enrichedParkingSpaces = parkingData.map((p: any) => ({
          ...p,
          building: p.buildingId ? buildingMap.get(p.buildingId) : undefined,
        }));

        setTenants(tenantsData);
        setUnits(unitsData);
        setBuildings(buildingsData);
        setLeases(leasesData);
        setParkingSpaces(enrichedParkingSpaces);
        setServiceCharges(serviceChargesData);
        setInvoices(invoicesData);
        setLoaded(true);
      } catch (error) {
        console.error("Failed to fetch dependencies:", error);
        setLoaded(true);
      }
    };

    fetchData();
  }, []);

  const getLeasesWithRelations = async () => {
    const leases = await apiClient.getLeases();
    const tenantMap = new Map(tenants.map((t) => [t.id, t]));
    const unitMap = new Map(units.map((u) => [u.id, u]));

    // Create a map of leased units
    const leasedUnits = new Map();
    leases.filter(l => l.status === 'active').forEach(lease => {
      if (lease.unitId) {
        leasedUnits.set(lease.unitId, lease);
      }
    });

    return leases.map((lease) => {
      const unit = lease.unitId ? unitMap.get(lease.unitId) : undefined;

      // Find connected parking spaces
      const leaseParkingSpaces = parkingSpaces.filter(p => p.leaseId === lease.id);

      // Find service charges for this lease's building
      const buildingServiceCharges = serviceCharges.filter(sc => sc.buildingId === unit?.buildingId);

      // Find invoices for this lease
      const leaseInvoices = invoices.filter(inv => inv.leaseId === lease.id);

      return {
        ...lease,
        tenant: lease.tenantId ? tenantMap.get(lease.tenantId) : undefined,
        unit,
        parkingSpaces: leaseParkingSpaces,
        serviceCharges: buildingServiceCharges,
        invoices: leaseInvoices,
        parkingSpaceIds: leaseParkingSpaces.map(p => p.id), // For form default values
      };
    });
  };

  const getFormFields = (editingItem: Lease | null): FormFieldConfig[] => {
    // Get active leases to determine which units are leased
    const activeLeases = leases.filter(l => l.status === 'active');
    const leasedUnitIds = new Set(activeLeases.map(l => l.unitId));



    const fields: FormFieldConfig[] = [
      {
        name: "tenantId",
        label: "Tenant",
        type: "select",
        required: true,
        options: tenants.map((t) => ({ label: t.name, value: t.id })),
      },
      {
        name: "unitId",
        label: "Unit",
        type: "select",
        required: true,
        options: units.map((u) => {
          const isLeasedByOther = activeLeases.some(l => l.unitId === u.id && l.id !== editingItem?.id);
          return {
            label: `${u.unitNumber}${leasedUnitIds.has(u.id) ? ' (LEASED)' : ''}`,
            value: u.id,
            disabled: editingItem ? isLeasedByOther : leasedUnitIds.has(u.id),
          };
        }),
      },
      {
        name: "parkingSpaceIds",
        label: `Parking Spaces${parkingSpaces.filter((p) => p.status === "available" || (editingItem && p.leaseId === editingItem.id)).length === 0 ? ' (None available - create some in Parking Spaces page)' : ''}`,
        type: "multi-select",
        required: false,
        options: parkingSpaces
          .filter((p) => p.status === "available" || (editingItem && p.leaseId === editingItem.id))
          .map((p) => ({
            label: `${p.slotNumber}${p.building ? ` (${p.building.name})` : ""}${p.leaseId === editingItem?.id ? ' (Currently Assigned)' : ''}`,
            value: p.id
          })),
      },
      {
        name: "startDate",
        label: "Start Date",
        type: "date",
        required: true,
      },
      {
        name: "endDate",
        label: "End Date (Optional)",
        type: "date",
        required: false,
      },
      {
        name: "billingCycleMonths",
        label: "Billing Cycle",
        type: "select",
        required: true,
        options: [
          { label: "1 Month", value: "ONE_MONTH" },
          { label: "3 Months", value: "THREE_MONTHS" },
          { label: "6 Months", value: "SIX_MONTHS" },
          { label: "12 Months", value: "TWELVE_MONTHS" },
        ],
      },
      {
        name: "gracePeriodDays",
        label: "Grace Period (Days)",
        type: "number",
        required: true,
      },
      {
        name: "depositAmount",
        label: "Deposit Amount",
        type: "number",
        required: true,
      },
      {
        name: "depositStatus",
        label: "Deposit Status",
        type: "select",
        required: true,
        options: [
          { label: "Held", value: "held" },
          { label: "Refunded", value: "refunded" },
          { label: "Deducted", value: "deducted" },
        ],
      },
    ];

    // Status logic: active default for new, terminated/draft for update
    if (editingItem) {
      fields.push({
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { label: "Active", value: "active" },
          { label: "Draft", value: "draft" },
          { label: "Terminated", value: "terminated" },
          { label: "Expired", value: "expired" },
        ],
      });
    } else {
      // For new records, we might want to hide the status or just provide 'active'
      fields.push({
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { label: "Active", value: "active" },
        ],
      });
    }

    return fields;
  };

  const handleCreate = async (data: Partial<Lease & { parkingSpaceIds?: number[] }>): Promise<Lease> => {
    const { parkingSpaceIds, ...leaseData } = data;
    const finalData = {
      ...leaseData,
      // Auto-generate lease number if not provided
      leaseNumber: `LS-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`,
      status: leaseData.status || "active",
      ...(parkingSpaceIds && parkingSpaceIds.length > 0 && { parkingSpaceIds }),
    };

    return apiClient.post<Lease>("/leases", finalData);
  };

  if (!loaded) {
    return (
      <PageLayout title="Leases" breadcrumbs={["Dashboard", "Leases"]}>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading lease data...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Leases" breadcrumbs={["Dashboard", "Leases"]}>
      <CrudPage
        title="Leases"
        columns={columns}
        formFields={getFormFields}
        api={{
          getAll: getLeasesWithRelations,
          create: handleCreate,
          update: (id, data) => apiClient.patch<Lease>(`/leases/${id}`, data),
          delete: (id) => apiClient.delete(`/leases/${id}`),
        }}
        searchPlaceholder="Search leases..."
      />
    </PageLayout>
  );
}
