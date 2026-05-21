"use client";

import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

interface DocumentPrintProps {
  type: "invoice" | "receipt";
  data: any;
  onClose: () => void;
}

export function DocumentPrint({ type, data, onClose }: DocumentPrintProps) {
  useEffect(() => {
    // Small delay to ensure content is rendered before printing
    const timer = setTimeout(() => {
      window.print();
      onClose();
    }, 500);
    return () => clearTimeout(timer);
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
          <div className="mb-4 bg-primary text-white p-3 rounded-xl shadow-lg print:shadow-none">
            <h1 className="text-3xl font-black uppercase tracking-[0.2em]">
              {type === "invoice" ? "Invoice" : "Official Receipt"}
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

        {/* Central Info Bar */}
        <div className="flex justify-between items-center bg-slate-50 px-6 py-4 rounded-lg border mb-10 print:bg-transparent">
          <div>
            <span className="text-[10px] font-black uppercase text-muted-foreground block tracking-widest mb-1">Document Number</span>
            <span className="font-bold text-lg text-primary">{type === "invoice" ? data.invoiceNumber : (data.receiptNumber || data.referenceNo || `RCT-${data.id}`)}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase text-muted-foreground block tracking-widest mb-1">Date Issued</span>
            <span className="font-bold text-lg">{new Date(data.issueDate || data.issuedAt || data.paymentDate || data.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div className="space-y-6">
            <section>
              <h3 className="text-[10px] font-black uppercase text-muted-foreground mb-3 tracking-widest pb-1 border-b">Recipient Details</h3>
              <p className="font-black text-xl text-slate-900">{data.tenant?.name || "Valued Tenant"}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase mt-1">{data.tenant?.type || "Individual"}</p>
            </section>
            
            {(data.unit || data.lease || data.account) && (
              <section className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <h3 className="text-[10px] font-black uppercase text-primary mb-2 tracking-widest">Property Information</h3>
                <div className="space-y-1">
                  {data.unit && <p className="text-sm font-bold">Unit: <span className="text-primary font-black ml-1">{data.unit.unitNumber}</span></p>}
                  {data.lease && <p className="text-xs font-medium text-muted-foreground">Lease Reference: {data.lease.leaseNumber}</p>}
                  {data.account && <p className="text-xs font-medium text-muted-foreground">Payment Account: {data.account.name}</p>}
                </div>
              </section>
            )}
          </div>

          <div className="flex flex-col justify-between">
            <section className="text-right">
              <h3 className="text-[10px] font-black uppercase text-muted-foreground mb-3 tracking-widest pb-1 border-b">Transaction Summary</h3>
              <div className="space-y-3 mt-4">
                <div className="flex justify-end gap-8 items-center">
                  <span className="text-xs font-bold text-muted-foreground">Method:</span>
                  <Badge variant="outline" className="uppercase font-black text-[10px] tracking-wider px-3 bg-white">
                    {data.method || "System Generated"}
                  </Badge>
                </div>
                {data.dueDate && (
                  <div className="flex justify-end gap-8 items-center">
                    <span className="text-xs font-bold text-muted-foreground">Due Date:</span>
                    <span className="font-bold text-destructive">{new Date(data.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </section>

            <div className="mt-8 bg-slate-900 text-white p-6 rounded-2xl shadow-xl print:shadow-none print:text-black print:bg-slate-50 print:border-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] block mb-2 opacity-60">Total Amount Received</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black opacity-60">$</span>
                <span className="text-5xl font-black tracking-tighter">{data.totalAmount || data.amount}</span>
                <span className="text-sm font-bold ml-2 opacity-60">USD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / Proof Message */}
        <div className="mt-16 pt-10 border-t border-slate-200">
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl flex items-center gap-6 print:bg-transparent print:border-emerald-500">
            <div className="h-12 w-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-black text-2xl print:text-emerald-500">
              ✓
            </div>
            <div>
              <h4 className="font-black text-emerald-900 uppercase text-xs tracking-widest mb-1 print:text-emerald-500">Official Proof of Payment</h4>
              <p className="text-xs text-emerald-800 font-medium leading-relaxed opacity-80 print:text-black">
                This document serves as definitive proof that the amount of <strong>${data.totalAmount || data.amount}</strong> was received by 
                <strong> commercial Defence Management</strong>. Transaction verified and recorded in the system on {new Date(data.createdAt).toLocaleString()}.
              </p>
            </div>
          </div>
        </div>

        {/* Signature Areas */}
        <div className="mt-16 grid grid-cols-2 gap-20">
          <div className="text-center">
            <div className="border-b-2 border-slate-300 h-10 mb-2 italic text-slate-400 text-xs flex items-end justify-center pb-1">Electronic Verification</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authorized Signature</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 border-slate-300 h-10 mb-2"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tenant Acknowledgement</p>
          </div>
        </div>
      </div>
      
      {/* Print Instructions - Hidden in Print */}
      <div className="max-w-[800px] mx-auto mt-8 flex justify-between items-center print:hidden">
        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg border">
          <strong className="text-primary mr-1">Note:</strong> The print dialog should have opened automatically. If not, press <kbd className="bg-white border rounded px-1 text-xs">Ctrl + P</kbd>.
        </p>
        <Button onClick={onClose} variant="destructive" className="font-bold uppercase tracking-widest h-12 px-8">
          Close Preview
        </Button>
      </div>
    </div>
  </>
);
}
