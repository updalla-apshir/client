"use client";

import { useEffect, useState } from "react";
import { CrudPage } from "@/components/crud/crud-page";
import { PageLayout } from "@/components/page-layout";
import { DocumentPrint } from "@/components/print/document-print";
import { apiClient } from "@/lib/api-client";
import { Column } from "@/components/crud/data-table";
import { FormFieldConfig } from "@/components/crud/form-modal";

interface Receipt {
  id: number;
  paymentId: number;
  receiptNumber: string;
  issuedAt: string;
  totalAmount: number;
  createdAt: string;
}

const columns: Column<Receipt>[] = [
  {
    key: "receiptNumber",
    header: "Receipt #",
    sortable: true,
    filterable: true,
    filterType: "text",
  },
  {
    key: "paymentId",
    header: "Payment ID",
    sortable: true,
  },
  {
    key: "issuedAt",
    header: "Issued At",
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString(),
  },
  {
    key: "totalAmount",
    header: "Amount",
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

export default function ReceiptsPage() {
  const [payments, setPayments] = useState<{ id: number; referenceNo: string; amount: number }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const paymentsData = await apiClient.getPayments();
        setPayments(paymentsData);
        setLoaded(true);
      } catch (error) {
        console.error("Failed to fetch payments:", error);
        setLoaded(true);
      }
    };

    fetchData();
  }, []);

  const generateReceiptNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `RCT-${year}-${random}`;
  };

  const getFormFields = (item: Receipt | null): FormFieldConfig[] => [
    {
      name: "paymentId",
      label: "Payment",
      type: "select",
      required: true,
      options: payments.map((p) => ({ label: `Payment ${p.id} (${p.referenceNo})`, value: p.id })),
    },
    {
      name: "receiptNumber",
      label: "Receipt Number",
      type: "text",
      required: false,
      disabled: true,
      placeholder: "Auto-generated",
    },
    {
      name: "issuedAt",
      label: "Issued At",
      type: "date",
      required: true,
    },
  ];

  if (!loaded) {
    return (
      <PageLayout title="Receipts" breadcrumbs={["Dashboard", "Receipts"]}>
        <div className="flex justify-center items-center h-64">Loading...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Receipts" breadcrumbs={["Dashboard", "Receipts"]}>
      <CrudPage
        title="Receipts"
        columns={columns}
        formFields={getFormFields}
        api={{
          getAll: apiClient.getReceipts,
          create: (data) => {
            const payment = payments.find(p => p.id === data.paymentId);
            return apiClient.post("/receipts", {
              ...data,
              receiptNumber: data.receiptNumber || generateReceiptNumber(),
              totalAmount: payment?.amount || 0,
            });
          },
          update: (id, data) => apiClient.patch(`/receipts/${id}`, data),
          delete: (id) => apiClient.delete(`/receipts/${id}`),
          print: async (item) => {
            try {
              // Fetch the full payment data with relations for the receipt
              const allPayments = await apiClient.getPayments();
              const tenants = await apiClient.getTenants();
              const accounts = await apiClient.getAccounts();

              const payment = allPayments.find(p => p.id === item.paymentId);
              if (payment) {
                const tenantMap = new Map(tenants.map((t) => [t.id, t]));
                const accountMap = new Map(accounts.map((a) => [a.id, a]));

                const enrichedPayment = {
                  ...payment,
                  tenant: payment.tenantId ? tenantMap.get(payment.tenantId) : undefined,
                  account: payment.accountId ? accountMap.get(payment.accountId) : undefined,
                };

                // Combine receipt data with enriched payment data
                setPrintData({
                  ...item,
                  ...enrichedPayment,
                  receiptNumber: item.receiptNumber,
                  issuedAt: item.issuedAt,
                });
              } else {
                // Fallback to just the receipt data if payment not found
                setPrintData(item);
              }
            } catch (error) {
              console.error("Failed to fetch payment data for receipt:", error);
              setPrintData(item);
            }
          },
        }}
        searchPlaceholder="Search receipts..."
      />

      {printData && (
        <DocumentPrint
          type="receipt"
          data={printData}
          onClose={() => setPrintData(null)}
        />
      )}
    </PageLayout>
  );
}
