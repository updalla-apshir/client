"use client";

import { useEffect, useState } from "react";
import { CrudPage } from "@/components/crud/crud-page";
import { PageLayout } from "@/components/page-layout";
import { apiClient } from "@/lib/api-client";
import { Column } from "@/components/crud/data-table";
import { FormFieldConfig } from "@/components/crud/form-modal";
import { Badge } from "@/components/ui/badge";

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
  lease?: { id: number; leaseNumber: string };
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
      render: (value) => value?.leaseNumber || "N/A",
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
  const [leases, setLeases] = useState<{ id: number; leaseNumber: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const leasesData = await apiClient.getLeases();
        setLeases(leasesData);
        setLoaded(true);
      } catch (error) {
        console.error("Failed to fetch leases:", error);
        setLoaded(true);
      }
    };

    fetchData();
  }, []);

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `INV-${year}-${random}`;
  };

  const getFormFields = (item: Invoice | null): FormFieldConfig[] => [
    {
      name: "leaseId",
      label: "Lease",
      type: "select",
      required: true,
      options: leases.map((l) => ({ label: l.leaseNumber, value: l.id })),
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

    // Get invoice items for each invoice
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
