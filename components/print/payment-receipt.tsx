"use client";

import { useEffect } from "react";

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

interface PaymentReceiptProps {
  data: Payment;
  onClose: () => void;
}

export function PaymentReceipt({ data, onClose }: PaymentReceiptProps) {
  useEffect(() => {
    // Prevent scrolling while receipt is shown
    const body = document.body;
    const originalOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    // Small delay to ensure content is rendered before printing
    const timer = setTimeout(() => {
      window.print();
      // Restore after printing
      body.style.overflow = originalOverflow;
      onClose();
    }, 500);

    return () => {
      clearTimeout(timer);
      // Cleanup in case component unmounts before timeout
      body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  if (!data) return null;

  return (
    <>
      {/* Backdrop to cover entire screen */}
      <div
        className="fixed inset-0 bg-white"
        style={{
          zIndex: 999999,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      />
      <div
        className="fixed inset-0 p-8 overflow-auto print:p-0 print:static"
        style={{
          zIndex: 1000000,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      >
      <div className="max-w-[800px] mx-auto border p-8 bg-white shadow-sm print:border-0 print:shadow-none print:max-w-full">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10 border-b pb-10">
          <div className="mb-4 bg-blue-600 text-white p-3 rounded-xl shadow-lg print:shadow-none">
            <h1 className="text-3xl font-black uppercase tracking-[0.2em]">
              Payment Receipt
            </h1>
          </div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Property Management Excellence</p>
          <div className="mt-4 flex gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>boore@gmail.com</span>
            <span>•</span>
            <span>+252 61 2 01 31 72</span>
            <span>•</span>
            <span>boore.com</span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-black uppercase text-muted-foreground mb-4 tracking-widest">Payment Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Reference Number:</span>
                <p className="font-bold text-lg">{data.referenceNo}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Payment Date:</span>
                <p className="font-medium">{new Date(data.paymentDate).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Payment Method:</span>
                <p className="font-medium capitalize">{data.method}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase text-muted-foreground mb-4 tracking-widest">Tenant & Account</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Tenant:</span>
                <p className="font-bold">{data.tenant?.name || "N/A"}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Account:</span>
                <p className="font-medium">{data.account?.name || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Amount Section */}
        <div className="bg-slate-50 border-2 border-slate-200 p-8 rounded-xl mb-8">
          <div className="text-center">
            <h3 className="text-sm font-black uppercase text-muted-foreground mb-4 tracking-widest">Amount Paid</h3>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-black text-slate-800">$</span>
              <span className="text-6xl font-black text-slate-800">{Number(data.amount).toFixed(2)}</span>
              <span className="text-lg font-bold text-slate-600">USD</span>
            </div>
          </div>
        </div>

        {/* Proof of Payment */}
        <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center text-white font-black text-2xl">
              ✓
            </div>
            <div>
              <h4 className="font-black text-green-900 uppercase text-sm tracking-widest mb-2">Official Proof of Payment</h4>
              <p className="text-sm text-green-800 font-medium">
                This document confirms that payment of <strong>${Number(data.amount).toFixed(2)}</strong> has been received and processed
                for the referenced transaction. Payment recorded in the system on {new Date(data.createdAt).toLocaleDateString()}.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-8 text-center">
            <div>
              <div className="border-b border-slate-300 h-12 mb-2"></div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Authorized Signature</p>
            </div>
            <div>
              <div className="border-b border-slate-300 h-12 mb-2"></div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tenant Acknowledgment</p>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            This is a computer-generated receipt. No signature required.
          </p>
        </div>
      </div>

      {/* Print Instructions - Hidden in Print */}
      <div className="max-w-[800px] mx-auto mt-8 flex justify-center print:hidden">
        <div className="bg-muted p-4 rounded-lg border text-center">
          <p className="text-sm text-muted-foreground mb-2">
            <strong className="text-primary">Printing:</strong> The receipt will be printed automatically.
          </p>
          <p className="text-xs text-muted-foreground">
            If print dialog doesn&apos;t appear, press <kbd className="bg-white border rounded px-1">Ctrl + P</kbd>
          </p>
        </div>
      </div>
      </div>
    </>
  );
}