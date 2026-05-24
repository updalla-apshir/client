"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import {
  BuildingIcon, HomeIcon, UsersIcon, FileTextIcon,
  CreditCardIcon, ReceiptIcon,
  DollarSignIcon, CalendarIcon, ActivityIcon,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const COLORS = { paid: "#22c55e", pending: "#eab308", overdue: "#ef4444" };
const PIE_COLORS = ["#22c55e", "#eab308", "#ef4444"];

interface DashboardStats {
  properties: number; buildings: number; units: number; tenants: number;
  activeLeases: number; pendingInvoices: number; overdueInvoices: number;
  monthlyRevenue: number; totalOutstanding: number; occupancyRate: number;
}

interface MonthlyRevenue {
  month: string; revenue: number; unpaid: number;
}

interface RecentPayment {
  id: number; tenantId: number; accountId: number; amount: number;
  paymentDate: string; method: string; referenceNo: string;
  tenant?: { id: number; name: string };
  account?: { id: number; name: string };
  allocations?: { invoice?: { id: number; invoiceNumber: string } }[];
}

interface ActivityLog {
  id: number; userId: number; action: string; tableName: string;
  recordId: number; createdAt: string;
  user?: { id: number; name: string };
}

interface ExpiringLease {
  id: number; leaseNumber: string; endDate: string;
  tenant?: { id: number; name: string };
  unit?: { id: number; unitNumber: string; building?: { name: string } };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<MonthlyRevenue[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [expiringLeases, setExpiringLeases] = useState<ExpiringLease[]>([]);
  const [invoiceStatus, setInvoiceStatus] = useState<{ pending: number; paid: number; overdue: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [
          statsData, revenueData, paymentsData,
          activityData, leasesData, statusData,
        ] = await Promise.all([
          apiClient.getDashboardStats(),
          apiClient.getDashboardMonthlyRevenue(),
          apiClient.getDashboardRecentPayments(8),
          apiClient.getDashboardRecentActivity(8),
          apiClient.getDashboardExpiringLeases(30),
          apiClient.getDashboardInvoiceStatus(),
        ]);
        setStats(statsData);
        setRevenue(revenueData);
        setRecentPayments(paymentsData);
        setActivity(activityData);
        setExpiringLeases(leasesData);
        setInvoiceStatus(statusData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const statCards = [
    { title: "Properties", value: stats?.properties ?? 0, icon: <HomeIcon className="h-4 w-4" />, color: "text-blue-600" },
    { title: "Buildings", value: stats?.buildings ?? 0, icon: <BuildingIcon className="h-4 w-4" />, color: "text-green-600" },
    { title: "Units", value: stats?.units ?? 0, icon: <BuildingIcon className="h-4 w-4" />, color: "text-purple-600" },
    { title: "Tenants", value: stats?.tenants ?? 0, icon: <UsersIcon className="h-4 w-4" />, color: "text-orange-600" },
    { title: "Active Leases", value: stats?.activeLeases ?? 0, icon: <FileTextIcon className="h-4 w-4" />, color: "text-red-600" },
    { title: "Monthly Revenue", value: `$${(stats?.monthlyRevenue ?? 0).toLocaleString()}`, icon: <CreditCardIcon className="h-4 w-4" />, color: "text-emerald-600" },
    { title: "Outstanding", value: `$${(stats?.totalOutstanding ?? 0).toLocaleString()}`, icon: <DollarSignIcon className="h-4 w-4" />, color: "text-rose-600" },
    { title: "Occupancy", value: `${stats?.occupancyRate ?? 0}%`, icon: <ActivityIcon className="h-4 w-4" />, color: "text-cyan-600" },
  ];

  const invoicePieData = invoiceStatus
    ? [
        { name: "Paid", value: invoiceStatus.paid },
        { name: "Pending", value: invoiceStatus.pending },
        { name: "Overdue", value: invoiceStatus.overdue },
      ].filter((d) => d.value > 0)
    : [];

  const totalInvoiceCount = invoiceStatus
    ? invoiceStatus.paid + invoiceStatus.pending + invoiceStatus.overdue
    : 0;

  const formatDate = (d: string) => new Date(d).toLocaleDateString();
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const getActionIcon = (action: string) => {
    if (action.toLowerCase().includes("create")) return "+";
    if (action.toLowerCase().includes("update")) return "~";
    if (action.toLowerCase().includes("delete")) return "✕";
    return "→";
  };

  const getActionColor = (action: string) => {
    if (action.toLowerCase().includes("create")) return "text-green-600 bg-green-100";
    if (action.toLowerCase().includes("update")) return "text-blue-600 bg-blue-100";
    if (action.toLowerCase().includes("delete")) return "text-red-600 bg-red-100";
    return "text-gray-600 bg-gray-100";
  };

  const daysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <PageLayout title="Dashboard" breadcrumbs={["Dashboard"]}>
      <div className="space-y-6">
    
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={card.color}>{card.icon}</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart + Invoice Status Pie */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue vs unpaid balance (12 months)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-72 flex items-center justify-center text-muted-foreground">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" name="Paid" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="unpaid" name="Unpaid" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Status</CardTitle>
              <CardDescription>Overall invoice breakdown</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {loading ? (
                <div className="h-48 flex items-center text-muted-foreground">Loading...</div>
              ) : invoicePieData.length === 0 ? (
                <div className="h-48 flex items-center text-muted-foreground">No invoices</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={invoicePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({ percent }: { percent?: number }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                        {invoicePieData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-2 text-sm">
                    {invoicePieData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                        <span>{d.name}: {d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Payments + Expiring Leases */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Payments</CardTitle>
              <CardDescription>Latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-muted-foreground">Loading...</div>
              ) : recentPayments.length === 0 ? (
                <div className="p-6 text-muted-foreground">No payments yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium text-muted-foreground">Tenant</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Method</th>
                        <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayments.map((p) => (
                        <tr key={p.id} className="border-b border-border hover:bg-muted/50">
                          <td className="p-3 font-medium">{p.tenant?.name || "N/A"}</td>
                          <td className="p-3 text-green-600 font-semibold">${Number(p.amount).toFixed(2)}</td>
                          <td className="p-3 capitalize hidden sm:table-cell">
                            <Badge variant="outline" className="text-xs">
                              {p.method === "cash" ? "💵 Cash" : p.method === "bank" ? "🏦 Bank" : "📱 Mobile"}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground hidden md:table-cell">{formatDate(p.paymentDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Expiring Leases</CardTitle>
                <CardDescription>Next 30 days</CardDescription>
              </div>
              {!loading && expiringLeases.length > 0 && (
                <Badge variant="destructive" className="text-xs">{expiringLeases.length} expiring</Badge>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : expiringLeases.length === 0 ? (
                <div className="text-muted-foreground py-6 text-center">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No leases expiring in the next 30 days</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiringLeases.map((lease) => {
                    const days = daysUntil(lease.endDate);
                    return (
                      <div key={lease.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{lease.tenant?.name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">
                            {lease.unit?.building?.name} - Unit {lease.unit?.unitNumber}
                          </p>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <p className="text-sm font-semibold">{formatDate(lease.endDate)}</p>
                          <Badge variant={days <= 7 ? "destructive" : days <= 14 ? "secondary" : "outline"} className="text-xs mt-1">
                            {days === 0 ? "Today!" : `${days} days`}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest system actions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : activity.length === 0 ? (
              <div className="text-muted-foreground py-4 text-center">No recent activity</div>
            ) : (
              <div className="space-y-1">
                {activity.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{log.user?.name || "System"}</span>
                        {" "}{log.action.toLowerCase()}{" "}
                        <span className="font-medium text-muted-foreground">{log.tableName}</span>
                        {log.recordId && <span className="text-muted-foreground"> #{log.recordId}</span>}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
