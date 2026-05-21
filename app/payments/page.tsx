"use client";

import { useEffect, useState } from "react";
import { CrudPage } from "@/components/crud/crud-page";
import { PageLayout } from "@/components/page-layout";
import { apiClient } from "@/lib/api-client";
import { Column } from "@/components/crud/data-table";
import { FormFieldConfig } from "@/components/crud/form-modal";
import { Badge } from "@/components/ui/badge";

interface Payment {
  id: number;
  tenantId: number;
  accountId: number;
  amount: number;
  paymentDate: string;
  method: "cash" | "bank" | "mobile";
  referenceNo: string;
  createdAt: string;
  invoiceId?: number;
  tenant?: { id: number; name: string };
  account?: { id: number; name: string };
  invoice?: { id: number; invoiceNumber: string; totalAmount: number; balanceAmount: number; status: string };
}

const columns: Column<Payment>[] = [
  {
    key: "tenant",
    header: "Tenant",
    render: (value) => value?.name || "N/A",
  },
  {
    key: "account",
    header: "Account",
    render: (value) => value?.name || "N/A",
  },
  {
    key: "amount",
    header: "Amount",
    sortable: true,
    render: (value) => `$${value}`,
  },
  {
    key: "paymentDate",
    header: "Date",
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString(),
  },
  {
    key: "method",
    header: "Method",
    sortable: true,
    render: (value) => (
      <Badge variant={value === "completed" ? "default" : value === "pending" ? "secondary" : "destructive"}>
        {value ? (value.charAt(0).toUpperCase() + value.slice(1)) : "N/A"}
      </Badge>
    ),
  },
  {
    key: "referenceNo",
    header: "Ref #",
    sortable: true,
  },
];

export default function PaymentsPage() {
  const [tenants, setTenants] = useState<{ id: number; name: string; type: string }[]>([]);
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);
  const [invoices, setInvoices] = useState<{ id: number; invoiceNumber: string; totalAmount: number; balanceAmount: number; status: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tenantsData, accountsData, invoicesData] = await Promise.all([
          apiClient.getTenants(),
          apiClient.getAccounts(),
          apiClient.getInvoices(),
        ]);
        setTenants(tenantsData);
        setAccounts(accountsData);
        setInvoices(invoicesData);
        setLoaded(true);
      } catch (error) {
        console.error("Failed to fetch dependencies:", error);
        setLoaded(true);
      }
    };

    fetchData();
  }, []);

  const getPaymentsWithRelations = async () => {
    const payments = await apiClient.getPayments();
    const tenantMap = new Map(tenants.map((t) => [t.id, t]));
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    return payments.map((payment) => ({
      ...payment,
      tenant: payment.tenantId ? tenantMap.get(payment.tenantId) : undefined,
      account: payment.accountId ? accountMap.get(payment.accountId) : undefined,
    }));
  };

  const generateReferenceNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `REF-${year}-${random}`;
  };

  const getFormFields = (item: Payment | null): FormFieldConfig[] => [
    {
      name: "tenantId",
      label: "Tenant",
      type: "select",
      required: true,
      options: tenants.map((t) => ({ label: t.name, value: t.id })),
    },
    {
      name: "accountId",
      label: "Account",
      type: "select",
      required: true,
      options: accounts.map((a) => ({ label: a.name, value: a.id })),
    },
    {
      name: "amount",
      label: "Amount",
      type: "number",
      required: true,
    },
    {
      name: "paymentDate",
      label: "Payment Date",
      type: "date",
      required: true,
    },
    {
      name: "method",
      label: "Method",
      type: "select",
      required: true,
      options: [
        { label: "Cash", value: "cash" },
        { label: "Bank Transfer", value: "bank" },
        { label: "Mobile Payment", value: "mobile" },
      ],
    },
    {
      name: "referenceNo",
      label: "Reference Number",
      type: "text",
      required: false,
      disabled: true,
      placeholder: "Auto-generated",
    },
    {
      name: "invoiceId",
      label: "Invoice",
      type: "select",
      required: false,
      options: invoices
        .filter((inv) => Number(inv.balanceAmount) > 0)
        .map((inv) => ({
          label: `${inv.invoiceNumber} - $${Number(inv.balanceAmount).toFixed(2)} balance`,
          value: inv.id,
        })),
    },
  ];

  if (!loaded) {
    return (
      <PageLayout title="Payments" breadcrumbs={["Dashboard", "Payments"]}>
        <div className="flex justify-center items-center h-64">Loading...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Payments" breadcrumbs={["Dashboard", "Payments"]}>
      <CrudPage
        title="Payments"
        columns={columns}
        formFields={getFormFields}
        api={{
          getAll: getPaymentsWithRelations,
          create: (data) => apiClient.post("/payments", {
            ...data,
            referenceNo: data.referenceNo || generateReferenceNumber(),
          }),
          update: (id, data) => apiClient.patch(`/payments/${id}`, data),
          delete: (id) => apiClient.delete(`/payments/${id}`),
        }}
        searchPlaceholder="Search payments..."
      />
    </PageLayout>
  );
}
