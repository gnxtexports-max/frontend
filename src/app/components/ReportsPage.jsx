import { useState, useEffect } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  Car,
  Users,
  CalendarDays,
  Filter,
  BarChart3,
  RefreshCw,
  TrendingUp,
  DollarSign,
  FileText,
  Clock,
  ChevronRight,
  TrendingDown,
  Download,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import { cn } from "./ui/utils";

export function ReportsPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [dealerFilter, setDealerFilter] = useState("all");
  const [groupBy, setGroupBy] = useState("day");
  const [activeTab, setActiveTab] = useState("shipments");
  const [chartMode, setChartMode] = useState("volume"); // "volume" or "expenses"
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [stats, setStats] = useState({
    totalShipments: 0,
    activeShipments: 0,
    completedShipments: 0,
    totalExpenses: 0,
    completedInvoices: 0,
  });

  const [shipments, setShipments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [fleet, setFleet] = useState({ drivers: [], vehicles: [] });
  const [timeline, setTimeline] = useState([]);

  const [filterOptions, setFilterOptions] = useState({
    vehicles: [],
    drivers: [],
    dealers: [],
  });

  const [loading, setLoading] = useState(true);

  // Fetch filter options on mount & refresh
  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await fetch(`${import.meta.env?.VITE_API_URL || "http://localhost:5000/api"}/reports/filters`);
        const json = await res.json();
        if (json.success) setFilterOptions(json.data);
      } catch (err) {
        console.error("Error fetching filters:", err);
      }
    }
    fetchFilters();
  }, [refreshTrigger]);

  // Fetch stats and lists when filters or grouping changes
  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          dateRange,
          vehicle: vehicleFilter,
          driver: driverFilter,
          dealer: dealerFilter,
          groupBy,
        }).toString();

        const res = await fetch(`${import.meta.env?.VITE_API_URL || "http://localhost:5000/api"}/reports/stats?${query}`);
        const json = await res.json();
        if (json.success) {
          setStats(json.data.stats || {
            totalShipments: 0,
            activeShipments: 0,
            completedShipments: 0,
            totalExpenses: 0,
            completedInvoices: 0,
          });
          setShipments(json.data.shipments || []);
          setInvoices(json.data.invoices || []);
          setFleet(json.data.fleet || { drivers: [], vehicles: [] });
          setTimeline(json.data.timeline || []);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [dateRange, vehicleFilter, driverFilter, dealerFilter, groupBy, refreshTrigger]);

  // Live refresh on socket cache update
  useEffect(() => {
    const handler = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("api-cache-updated", handler);
    return () => window.removeEventListener("api-cache-updated", handler);
  }, []);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // ── Excel Export Handlers ──
  const exportShipmentExpenses = () => {
    const rows = shipments.map((s) => ({
      "Shipment ID": s.shipmentId || "—",
      "Date": s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-IN") : "—",
      "Driver Name": s.driverName || "—",
      "Vehicle ID": s.vehicleNumber || "—",
      "Status": s.status || "—",
      "Total Expense (INR)": s.totalExpenses || 0,
      "Fuel Expense": s.expenseBreakdown?.Fuel || 0,
      "Toll Expense": s.expenseBreakdown?.Toll || 0,
      "Maintenance Expense": s.expenseBreakdown?.Maintenance || 0,
      "Loading/Unloading Expense": s.expenseBreakdown?.["Loading/Unloading"] || 0,
      "Driver Allowance": s.expenseBreakdown?.["Driver Allowance"] || 0,
      "Miscellaneous Expense": s.expenseBreakdown?.Miscellaneous || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shipment Expenses");

    worksheet["!cols"] = [
      { wch: 18 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
      { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 18 }
    ];

    XLSX.writeFile(workbook, `GNXT_Shipment_Expenses_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportCompletedInvoices = () => {
    const rows = invoices.map((inv) => ({
      "Invoice No": inv.invoiceNumber || "—",
      "Customer Name": inv.customerName || "—",
      "Destination Location": inv.location || "—",
      "Plant Ref No": inv.plantReferenceNumber || "—",
      "Status": inv.status || "—",
      "Delivery Completed Date": inv.deliveredAt
        ? new Date(inv.deliveredAt).toLocaleString("en-IN")
        : new Date(inv.updatedAt).toLocaleDateString("en-IN"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Completed Invoices");

    worksheet["!cols"] = [
      { wch: 18 }, { wch: 25 }, { wch: 22 }, { wch: 18 }, { wch: 15 }, { wch: 25 }
    ];

    XLSX.writeFile(workbook, `GNXT_Completed_Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportDriverLeaderboard = () => {
    const rows = (fleet.drivers || []).map((drv) => {
      const rate = drv.totalTrips > 0 ? Math.round((drv.completedTrips / drv.totalTrips) * 100) : 0;
      return {
        "Driver Name": drv.driverName || "—",
        "Assigned Trips": drv.totalTrips || 0,
        "Completed Deliveries": drv.completedTrips || 0,
        "Success Rate (%)": `${rate}%`,
        "Incurred Expenses (INR)": drv.totalExpenses || 0,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Driver Performance");

    worksheet["!cols"] = [
      { wch: 22 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 22 }
    ];

    XLSX.writeFile(workbook, `GNXT_Driver_Performance_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExport = () => {
    if (activeTab === "shipments") {
      exportShipmentExpenses();
    } else if (activeTab === "invoices") {
      exportCompletedInvoices();
    } else if (activeTab === "fleet") {
      exportDriverLeaderboard();
    }
  };

  return (
    <div id="printable-report" className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl tracking-tight text-foreground flex items-center gap-2 font-semibold">
              <BarChart3 className="w-6 h-6 text-[#1d4ed8]" />
              Reports & Operational Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analyze shipments volume, invoice dispatch completion, operational expenses, and fleet performance metrics.
            </p>
          </div>
          <div className="flex items-center gap-2 no-print">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs bg-[#1d4ed8] text-white hover:bg-blue-800 border-none rounded-md shadow-sm gap-1.5"
              onClick={handleExport}
            >
              <Download className="w-4 h-4" />
              {activeTab === "shipments" && "Export Expenses (XL)"}
              {activeTab === "invoices" && "Export Invoices (XL)"}
              {activeTab === "fleet" && "Export Drivers (XL)"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs bg-white gap-1.5 border-slate-200 hover:bg-slate-50 rounded-md shadow-sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* ── FILTERS BAR ── */}
        <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm no-print">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </div>

          {/* Date Range */}
          <Select value={dateRange || "7d"} onValueChange={(val) => setDateRange(val || "7d")}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-white border-slate-200 rounded-md">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          {/* Vehicle */}
          <Select value={vehicleFilter || "all"} onValueChange={(val) => setVehicleFilter(val || "all")}>
            <SelectTrigger className="w-[150px] h-9 text-xs bg-white border-slate-200 rounded-md">
              <Car className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {filterOptions.vehicles.filter(Boolean).map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Driver */}
          <Select value={driverFilter || "all"} onValueChange={(val) => setDriverFilter(val || "all")}>
            <SelectTrigger className="w-[150px] h-9 text-xs bg-white border-slate-200 rounded-md">
              <Users className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drivers</SelectItem>
              {filterOptions.drivers.filter(Boolean).map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Dealer */}
          <Select value={dealerFilter || "all"} onValueChange={(val) => setDealerFilter(val || "all")}>
            <SelectTrigger className="w-[160px] h-9 text-xs bg-white border-slate-200 rounded-md">
              <Package className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dealers</SelectItem>
              {filterOptions.dealers.filter(Boolean).map((dl) => (
                <SelectItem key={dl} value={dl}>{dl}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-slate-500 hover:text-slate-900 ml-auto hover:bg-slate-50 rounded-md font-medium"
            onClick={() => {
              setDateRange("7d");
              setVehicleFilter("all");
              setDriverFilter("all");
              setDealerFilter("all");
            }}
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* ── KEY PERFORMANCE INDICATORS (5 SLABS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total Shipments Dispatch",
            value: stats.totalShipments.toLocaleString(),
            trend: "+12%",
            up: true,
            icon: Package,
            iconBg: "bg-blue-50",
            iconColor: "text-[#1d4ed8]",
            borderColor: "border-blue-100",
          },
          {
            label: "In Transit / Active",
            value: stats.activeShipments.toLocaleString(),
            trend: "+5%",
            up: true,
            icon: Clock,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            borderColor: "border-amber-100",
          },
          {
            label: "Completed Deliveries",
            value: stats.completedShipments.toLocaleString(),
            trend: "+8%",
            up: true,
            icon: CheckCircle2,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            borderColor: "border-emerald-100",
          },
          {
            label: "Operational Expenses",
            value: `₹${stats.totalExpenses.toLocaleString("en-IN")}`,
            trend: "-2.5%",
            up: false,
            icon: DollarSign,
            iconBg: "bg-rose-50",
            iconColor: "text-rose-600",
            borderColor: "border-rose-100",
          },
          {
            label: "Invoices Completed",
            value: stats.completedInvoices.toLocaleString(),
            trend: "+15%",
            up: true,
            icon: FileText,
            iconBg: "bg-teal-50",
            iconColor: "text-teal-600",
            borderColor: "border-teal-100",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn(
                "bg-white border rounded-lg p-5 flex items-center gap-4 shadow-sm",
                card.borderColor
              )}
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-md flex items-center justify-center shrink-0",
                  card.iconBg
                )}
              >
                <Icon className={cn("w-5.5 h-5.5", card.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-slate-800 mt-1.5 tracking-tight font-sans">
                  {card.value}
                </p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5",
                    card.up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  )}
                >
                  {card.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── TIME-SERIES VISUAL CHART SECTION ── */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Analytical Trends</h3>
            <p className="text-xs text-slate-400 mt-0.5">Visualize operational volumes or financial costs over time.</p>
          </div>
          <div className="flex items-center gap-4 self-end sm:self-auto">
            {/* Chart mode selection */}
            <div className="bg-slate-100 p-0.5 rounded-md flex">
              <button
                onClick={() => setChartMode("volume")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150",
                  chartMode === "volume"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Dispatch Volume
              </button>
              <button
                onClick={() => setChartMode("expenses")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150",
                  chartMode === "expenses"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Expenses Incurred
              </button>
            </div>

            {/* Interval Group By switcher */}
            <div className="bg-slate-100 p-0.5 rounded-md flex">
              <button
                onClick={() => setGroupBy("day")}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-150",
                  groupBy === "day"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Day
              </button>
              <button
                onClick={() => setGroupBy("week")}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-150",
                  groupBy === "week"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Week
              </button>
              <button
                onClick={() => setGroupBy("month")}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-150",
                  groupBy === "month"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        {/* Recharts container */}
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : timeline.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No trend data available for the selected filters.
            </div>
          ) : chartMode === "volume" ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <ChartTooltip />
                <Legend wrapperStyle={{ fontSize: 11, pt: 10 }} />
                <Line
                  name="Shipments Dispatched"
                  type="monotone"
                  dataKey="shipmentsCount"
                  stroke="#1d4ed8"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
                <Line
                  name="Deliveries Completed"
                  type="monotone"
                  dataKey="completedCount"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  name="Invoices Cleared"
                  type="monotone"
                  dataKey="completedInvoices"
                  stroke="#14b8a6"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <ChartTooltip formatter={(val) => `₹${val.toLocaleString("en-IN")}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar name="Total Expenses (INR)" dataKey="totalExpenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── DETAILED LEGER AND TAB SWITCHING ── */}
      <div className="space-y-4">
        {/* Tabs Headers */}
        <div className="flex border-b border-slate-200 gap-6 no-print">
          {[
            { key: "shipments", icon: DollarSign, label: "Shipments & Expenses" },
            { key: "invoices", icon: FileText, label: "Completed Invoices Ledger" },
            { key: "fleet", icon: Truck, label: "Fleet & Resource Metrics" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "pb-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all flex items-center gap-1.5",
                activeTab === tab.key
                  ? "border-[#1d4ed8] text-[#1d4ed8]"
                  : "border-transparent text-slate-400 hover:text-slate-800"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: SHIPMENTS & EXPENSES TABLE */}
        {activeTab === "shipments" && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Shipment Expenses Auditing</h4>
                <p className="text-xs text-slate-400">Total operational expense costs aggregated per shipment record.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-[#f8f9fb] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Shipment ID</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Driver Name</th>
                    <th className="py-3 px-3">Vehicle ID</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Total Expense</th>
                    <th className="py-3 px-5 text-right w-[260px]">Cost Category Breakdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-300" />
                      </td>
                    </tr>
                  ) : shipments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">No shipments found in selected range.</td>
                    </tr>
                  ) : (
                    shipments.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-5 font-bold text-[#1d4ed8]">{s.shipmentId}</td>
                        <td className="py-3 px-3 text-slate-500">
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{s.driverName}</td>
                        <td className="py-3 px-3">{s.vehicleNumber}</td>
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              "inline-flex text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border",
                              s.status === "Delivered"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : s.status === "Cancelled"
                                ? "bg-slate-50 text-slate-400 border-slate-200"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            )}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800 tabular-nums">
                          ₹{s.totalExpenses.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <div className="flex justify-end gap-1.5">
                            {Object.entries(s.expenseBreakdown || {}).map(([type, amount]) => {
                              const badgeStyle = {
                                Fuel: "bg-orange-50 text-orange-700 border-orange-200",
                                Toll: "bg-indigo-50 text-indigo-700 border-indigo-200",
                                Maintenance: "bg-emerald-50 text-emerald-700 border-emerald-200",
                                Miscellaneous: "bg-slate-50 text-slate-600 border-slate-200",
                              };
                              return (
                                <span
                                  key={type}
                                  className={cn(
                                    "text-[9px] px-1.5 py-0.5 border rounded-sm font-medium",
                                    badgeStyle[type] || badgeStyle.Miscellaneous
                                  )}
                                  title={`${type}: ₹${amount}`}
                                >
                                  {type.slice(0, 4)}: ₹{amount}
                                </span>
                              );
                            })}
                            {Object.keys(s.expenseBreakdown || {}).length === 0 && (
                              <span className="text-[10px] text-slate-300 italic">— No records</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: COMPLETED INVOICES TABLE */}
        {activeTab === "invoices" && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Completed Invoices Historical Ledger</h4>
                <p className="text-xs text-slate-400">Verifiable ledger tracking all completed invoice deliveries.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-[#f8f9fb] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Invoice No</th>
                    <th className="py-3 px-3">Customer Name</th>
                    <th className="py-3 px-3">Destination Location</th>
                    <th className="py-3 px-3">Plant Ref No</th>
                    <th className="py-3 px-3">Completion Status</th>
                    <th className="py-3 px-5 text-right">Delivery Complete Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-300" />
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">No completed invoices matching criteria.</td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-5 font-bold text-[#1d4ed8]">{inv.invoiceNumber}</td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{inv.customerName}</td>
                        <td className="py-3 px-3">{inv.location || "—"}</td>
                        <td className="py-3 px-3">{inv.plantReferenceNumber}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right font-medium text-slate-500">
                          {inv.deliveredAt
                            ? new Date(inv.deliveredAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                            : new Date(inv.updatedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: FLEET PERFORMANCE TABLES (DRIVERS & VEHICLES) */}
        {activeTab === "fleet" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Drivers Performance */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h4 className="font-bold text-slate-800 text-sm">Resource Performance: Drivers Leaderboard</h4>
                <p className="text-xs text-slate-400">Total shipments assigned versus completed per driver.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-[#f8f9fb] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-5">Driver Name</th>
                      <th className="py-3 px-3 text-center">Assigned Trips</th>
                      <th className="py-3 px-3 text-center">Completed Deliveries</th>
                      <th className="py-3 px-3 text-center">Success Rate</th>
                      <th className="py-3 px-5 text-right">Incurred Expenses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-300" />
                        </td>
                      </tr>
                    ) : (fleet.drivers || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400">No driver records found.</td>
                      </tr>
                    ) : (
                      (fleet.drivers || []).map((drv) => {
                        const rate = drv.totalTrips > 0 ? Math.round((drv.completedTrips / drv.totalTrips) * 100) : 0;
                        return (
                          <tr key={drv.driverName} className="hover:bg-slate-50/50">
                            <td className="py-3 px-5 font-bold text-slate-800">{drv.driverName}</td>
                            <td className="py-3 px-3 text-center font-medium tabular-nums">{drv.totalTrips}</td>
                            <td className="py-3 px-3 text-center font-bold text-emerald-600 tabular-nums">
                              {drv.completedTrips}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={cn(
                                  "inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-sm border",
                                  rate >= 90
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : "bg-amber-50 text-amber-700 border-amber-100"
                                )}
                              >
                                {rate}%
                              </span>
                            </td>
                            <td className="py-3 px-5 text-right font-bold text-slate-700 tabular-nums">
                              ₹{drv.totalExpenses.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vehicles Performance */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h4 className="font-bold text-slate-800 text-sm">Resource Performance: Vehicles Leaderboard</h4>
                <p className="text-xs text-slate-400">Active shipment trips run per fleet vehicle resource.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-[#f8f9fb] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-5">Vehicle No</th>
                      <th className="py-3 px-3 text-center">Assigned Trips</th>
                      <th className="py-3 px-3 text-center">Completed Deliveries</th>
                      <th className="py-3 px-3 text-center">Util Rate</th>
                      <th className="py-3 px-5 text-right">Incurred Expenses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-300" />
                        </td>
                      </tr>
                    ) : (fleet.vehicles || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400">No vehicle records found.</td>
                      </tr>
                    ) : (
                      (fleet.vehicles || []).map((veh) => {
                        const rate = veh.totalTrips > 0 ? Math.round((veh.completedTrips / veh.totalTrips) * 100) : 0;
                        return (
                          <tr key={veh.vehicleNumber} className="hover:bg-slate-50/50">
                            <td className="py-3 px-5 font-bold text-slate-800">{veh.vehicleNumber}</td>
                            <td className="py-3 px-3 text-center font-medium tabular-nums">{veh.totalTrips}</td>
                            <td className="py-3 px-3 text-center font-bold text-emerald-600 tabular-nums">
                              {veh.completedTrips}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={cn(
                                  "inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-sm border",
                                  rate >= 90
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : "bg-amber-50 text-amber-700 border-amber-100"
                                )}
                              >
                                {rate}%
                              </span>
                            </td>
                            <td className="py-3 px-5 text-right font-bold text-slate-700 tabular-nums">
                              ₹{veh.totalExpenses.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── PRINT STYLES ── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 15px;
          }
          .no-print {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
export default ReportsPage;
