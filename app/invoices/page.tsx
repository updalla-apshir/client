"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { CrudPage } from "@/components/crud/crud-page";
import { PageLayout } from "@/components/page-layout";
import { apiClient } from "@/lib/api-client";
import { Column } from "@/components/crud/data-table";
import { FormFieldConfig } from "@/components/crud/form-modal";
import { Badge } from "@/components/ui/badge";

interface LeaseOption {
  id: number;
  leaseNumber: string;
  tenant?: { id: number; name: string };
  unit?: { id: number; unitNumber: string; baseRent?: number; building?: { name: string } };
}

interface Invoice {
  id: number;
  leaseId: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: "pending" | "paid" | "overdue";
  createdAt: string;
  lease?: LeaseOption;
  items?: any[];
}

const columns: Column<Invoice>[] = [
  {
    key: "invoiceNumber",
    header: "Invoice #",
    sortable: true,
    filterable: true,
    filterType: "text",
  },
  {
    key: "lease",
    header: "Lease",
    render: (value) => {
      if (!value) return "N/A";
      const parts = [value.leaseNumber];
      if (value.tenant?.name) parts.push(value.tenant.name);
      if (value.unit?.unitNumber) parts.push(value.unit.unitNumber);
      return parts.join(" - ");
    },
  },
  {
    key: "issueDate",
    header: "Issue Date",
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString(),
  },
  {
    key: "dueDate",
    header: "Due Date",
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString(),
  },
  {
    key: "totalAmount",
    header: "Total (Auto-calculated)",
    sortable: true,
    render: (value) => `$${value}`,
  },
  {
    key: "paidAmount",
    header: "Paid",
    sortable: true,
    render: (value) => `$${value}`,
  },
  {
    key: "balanceAmount",
    header: "Remaining Balance",
    sortable: true,
    render: (value) => `$${value}`,
  },
  {
    key: "items",
    header: "Items Breakdown",
    render: (value, row) => {
      if (!row.items || row.items.length === 0) return "No items";

      const itemTypes = row.items.reduce((acc: any, item: any) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {});

      const breakdown = Object.entries(itemTypes)
        .map(([type, count]) => `${count} ${type.replace('_', ' ')}`)
        .join(', ');

      return `${row.items.length} items (${breakdown})`;
    },
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    filterable: true,
    filterType: "select",
    render: (value, row) => {
      const total = Number(row.totalAmount);
      const paid = Number(row.paidAmount);
      const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
      return (
        <div className="flex items-center gap-2">
          <Badge variant={value === "paid" ? "default" : value === "overdue" ? "destructive" : "secondary"}>
            {value ? (value.charAt(0).toUpperCase() + value.slice(1)) : "N/A"}
          </Badge>
          <span className="text-xs text-muted-foreground">{pct}%</span>
        </div>
      );
    },
  },
];

export default function InvoicesPage() {
  const [leases, setLeases] = useState<LeaseOption[]>([]);
  const [leaseSearch, setLeaseSearch] = useState("");
  const [leasePage, setLeasePage] = useState(1);
  const [leaseTotal, setLeaseTotal] = useState(0);
  const [leaseLoading, setLeaseLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchLeases = useCallback(async (search: string, page: number, append = false) => {
    setLeaseLoading(true);
    try {
      const response = await apiClient.searchLeases(search, page);
      const data = (response as any).data || response;
      const total = (response as any).total || data.length;
      setLeases(prev => append ? [...prev, ...data] : data);
      setLeaseTotal(total);
      setLeasePage(page);
    } catch (error) {
      console.error("Failed to fetch leases:", error);
    } finally {
      setLeaseLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchLeases("", 1);
      setLoaded(true);
    };
    init();
  }, [fetchLeases]);

  const handleLeaseSearch = useCallback((value: string) => {
    setLeaseSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchLeases(value, 1);
    }, 300);
  }, [fetchLeases]);

  const handleLoadMore = useCallback(() => {
    fetchLeases(leaseSearch, leasePage + 1, true);
  }, [fetchLeases, leaseSearch, leasePage]);

  const hasMore = leases.length < leaseTotal;

  const formatLeaseLabel = (lease: LeaseOption) => {
    const parts = [lease.leaseNumber];
    if (lease.tenant?.name) parts.push(lease.tenant.name);
    if (lease.unit?.unitNumber) parts.push(`Unit ${lease.unit.unitNumber}`);
    return parts.join(" - ");
  };

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `INV-${year}-${random}`;
  };

  const getFormFields = (item: Invoice | null): FormFieldConfig[] => [
    {
      name: "leaseId",
      label: "Lease",
      type: "searchable-select",
      required: true,
      options: leases.map((l) => ({
        label: formatLeaseLabel(l),
        value: l.id,
      })),
      searchableConfig: {
        onSearch: handleLeaseSearch,
        onLoadMore: handleLoadMore,
        loading: leaseLoading,
        hasMore,
        detailsPanel: (val) => {
          const lease = leases.find((l) => String(l.id) === String(val));
          if (!lease) return null;
          return (
            <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
              <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Lease Details</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-muted-foreground">Tenant:</span>
                <span className="font-medium">{lease.tenant?.name || "N/A"}</span>
                <span className="text-muted-foreground">Unit:</span>
                <span className="font-medium">{lease.unit?.unitNumber || "N/A"}</span>
                <span className="text-muted-foreground">Building:</span>
                <span className="font-medium">{lease.unit?.building?.name || "N/A"}</span>
                <span className="text-muted-foreground">Rent:</span>
                <span className="font-medium">$${lease.unit?.baseRent ?? "0"}</span>
              </div>
            </div>
          );
        },
      },
    },
    {
      name: "invoiceNumber",
      label: "Invoice Number",
      type: "text",
      required: false,
      disabled: true,
      placeholder: "Auto-generated",
    },
    {
      name: "issueDate",
      label: "Issue Date",
      type: "date",
      required: true,
    },
    {
      name: "dueDate",
      label: "Due Date",
      type: "date",
      required: true,
    },
  ];

  const getInvoicesWithRelations = async () => {
    const invoices = await apiClient.getInvoices();
    const invoiceItemsPromises = invoices.map(invoice =>
      apiClient.getInvoiceItems(invoice.id)
    );
    const invoiceItemsResults = await Promise.all(invoiceItemsPromises);
    const leaseMap = new Map(leases.map((l) => [l.id, l]));

    return invoices.map((invoice, index) => ({
      ...invoice,
      lease: invoice.leaseId ? leaseMap.get(invoice.leaseId) : undefined,
      items: invoiceItemsResults[index] || [],
    }));
  };

  if (!loaded) {
    return (
      <PageLayout title="Invoices" breadcrumbs={["Dashboard", "Invoices"]}>
        <div className="flex justify-center items-center h-64">Loading...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Invoices" breadcrumbs={["Dashboard", "Invoices"]}>
      <CrudPage
        title="Invoices"
        columns={columns}
        formFields={getFormFields}
        api={{
          getAll: getInvoicesWithRelations,
          create: (data) => apiClient.post("/invoices", {
            ...data,
            invoiceNumber: data.invoiceNumber || generateInvoiceNumber(),
          }),
          update: (id, data) => apiClient.patch(`/invoices/${id}`, data),
          delete: (id) => apiClient.delete(`/invoices/${id}`),
        }}
        searchPlaceholder="Search invoices..."
      />
    </PageLayout>
  );
}
