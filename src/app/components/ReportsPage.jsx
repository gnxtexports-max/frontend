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
  X,
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
  // ── Common top-level filters (apply across entire report module) ──
  const [dateRange, setDateRange] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [dealerFilter, setDealerFilter] = useState("all");
  const [lrNoFilter, setLrNoFilter] = useState("");
  const [plantNoFilter, setPlantNoFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [podFilter, setPodFilter] = useState("all");

  const [groupBy, setGroupBy] = useState("day");
  const [activeTab, setActiveTab] = useState("shipments");
  const [chartMode, setChartMode] = useState("volume");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [stats, setStats] = useState({
    totalShipments: 0,
    activeShipments: 0,
    completedShipments: 0,
    totalExpenses: 0,
    completedInvoices: 0,
  });

  const [invoiceStatusCounts, setInvoiceStatusCounts] = useState({
    awaitingShipment: 0,
    despatched: 0,
    delivered: 0,
    cancelled: 0,
    total: 0,
  });

  const [shipments, setShipments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [fleet, setFleet] = useState({ drivers: [], vehicles: [] });
  const [timeline, setTimeline] = useState([]);

  const [filterOptions, setFilterOptions] = useState({
    vehicles: [],
    drivers: [],
    dealers: [],
    lrNumbers: [],
    plantNumbers: [],
  });

  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);

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

  // Fetch stats and lists when common filters or grouping changes
  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          dateRange: (fromDate || toDate) ? "custom" : dateRange,
          vehicle: vehicleFilter,
          driver: driverFilter,
          dealer: dealerFilter,
          groupBy,
        });
        if (fromDate) queryParams.append("fromDate", fromDate);
        if (toDate) queryParams.append("toDate", toDate);
        if (lrNoFilter && lrNoFilter.trim()) queryParams.append("lrNo", lrNoFilter.trim());
        if (plantNoFilter && plantNoFilter !== "all") queryParams.append("plantNo", plantNoFilter);
        if (statusFilter && statusFilter !== "all") queryParams.append("status", statusFilter);
        if (podFilter && podFilter !== "all") queryParams.append("pod", podFilter);

        const res = await fetch(`${import.meta.env?.VITE_API_URL || "http://localhost:5000/api"}/reports/stats?${queryParams.toString()}`);
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
          setInvoiceStatusCounts(json.data.invoiceStatusCounts || { awaitingShipment: 0, despatched: 0, delivered: 0, cancelled: 0, total: 0 });
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
  }, [dateRange, fromDate, toDate, vehicleFilter, driverFilter, dealerFilter, groupBy, refreshTrigger,
    lrNoFilter, plantNoFilter, statusFilter, podFilter]);

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

  const getMappedStatus = (statusVal) => {
    const s = String(statusVal || "").trim().toLowerCase();
    if (s === "delivered" || s === "closed") return "closed";
    if (s === "in transit") return "delivery pending";
    if (s === "pending") return "vehicle not arrived";
    return s;
  };

  const getMappedPod = (podSubmitted) => {
    if (podSubmitted === "Yes") return "uploaded";
    return "pending";
  };

  const formatReportDate = (d) => {
    if (!d) return "—";
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return "—";
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yyyy = dateObj.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const exportCompletedInvoices = () => {
    const rows = invoices.map((r) => ({
      "Plant": r.plant || r.plantReferenceNumber || r.plantNumber || "—",
      "Invoice No": r.invoiceNo || r.invoiceNumber || "—",
      "Invoice Dt": formatReportDate(r.invoiceDt || r.invoiceDate),
      "CUSTOMER": r.customer || r.customerName || "—",
      "Customer Location": r.customerLocation || r.location || "—",
      "STATUS": r.status || "AWAITING SHIPMENT",
      "TYRE DESPATCHED": r.tyre ?? 0,
      "TUBE DESPATCHED": r.tube ?? 0,
      "FLAP DESPATCHED": r.flap ?? 0,
      "TOTAL WEIGHT": r.totalWeight ?? r.weight ?? 0,
      "LR No.": r.lrNo || r.lrNumber || "—",
      "DESPATCHED DATE": formatReportDate(r.dispatchDate),
      "VEHICLE NUMBER": r.vehicleNumber || "—",
      "DRIVER NAME": r.driverName || "—",
      "DELIVERED DATE": formatReportDate(r.deliveryDate),
      "POD": r.pod || "NOT GENERATED",
    }));

    rows.sort((a, b) => {
      const pA = String(a["Plant"] || "");
      const pB = String(b["Plant"] || "");
      return pA.localeCompare(pB, undefined, { numeric: true, sensitivity: "base" });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices Historical Ledger");

    worksheet["!cols"] = [
      { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 28 }, { wch: 20 },
      { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 16 }
    ];

    XLSX.writeFile(workbook, `GNXT_Invoices_Historical_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
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

        {/* ── COMMON TOP HEADER FILTERS BAR ── */}
        <div className="flex flex-wrap items-center gap-2.5 bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm no-print">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-1 uppercase tracking-wider shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filters:
          </div>

          {/* Date Range */}
          <Select value={dateRange || "all"} onValueChange={(val) => { setDateRange(val || "all"); setFromDate(""); setToDate(""); }}>
            <SelectTrigger className="w-[130px] h-8 text-xs bg-white border-slate-200 rounded-md">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>

          {/* From Date */}
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200 h-8 text-xs">
            <CalendarDays className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400 font-medium">From:</span>
            <input
              type="date"
              value={fromDate || ""}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent outline-none cursor-pointer text-foreground text-xs"
            />
          </div>

          {/* To Date */}
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200 h-8 text-xs">
            <CalendarDays className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400 font-medium">To:</span>
            <input
              type="date"
              value={toDate || ""}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent outline-none cursor-pointer text-foreground text-xs"
            />
          </div>

          {/* LR No search */}
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-md px-2.5 h-8 bg-white">
            <FileText className="w-3 h-3 text-slate-400" />
            <input
              type="text"
              placeholder="LR No..."
              value={lrNoFilter}
              onChange={(e) => setLrNoFilter(e.target.value)}
              className="outline-none text-xs text-foreground bg-transparent w-[90px]"
            />
          </div>

          {/* Plant No filter */}
          <Select value={plantNoFilter || "all"} onValueChange={(v) => setPlantNoFilter(v || "all")}>
            <SelectTrigger className="w-[125px] h-8 text-xs bg-white border-slate-200 rounded-md">
              <SelectValue placeholder="Plant No" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plants</SelectItem>
              {filterOptions.plantNumbers.filter(Boolean).map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Dealer */}
          <Select value={dealerFilter || "all"} onValueChange={(val) => setDealerFilter(val || "all")}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-white border-slate-200 rounded-md">
              <Package className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <SelectValue placeholder="Dealer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dealers</SelectItem>
              {filterOptions.dealers.filter(Boolean).map((dl) => (
                <SelectItem key={dl} value={dl}>{dl}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Vehicle */}
          <Select value={vehicleFilter || "all"} onValueChange={(val) => setVehicleFilter(val || "all")}>
            <SelectTrigger className="w-[130px] h-8 text-xs bg-white border-slate-200 rounded-md">
              <Car className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <SelectValue placeholder="Vehicle" />
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
            <SelectTrigger className="w-[125px] h-8 text-xs bg-white border-slate-200 rounded-md">
              <Users className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <SelectValue placeholder="Driver" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drivers</SelectItem>
              {filterOptions.drivers.filter(Boolean).map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={statusFilter || "all"} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="w-[135px] h-8 text-xs bg-white border-slate-200 rounded-md">
              <Filter className="w-3 h-3 text-slate-400 mr-1.5" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="AWAITING SHIPMENT">Awaiting Shipment</SelectItem>
              <SelectItem value="DESPATCHED">Despatched</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* POD Status */}
          <Select value={podFilter || "all"} onValueChange={(val) => setPodFilter(val || "all")}>
            <SelectTrigger className="w-[120px] h-8 text-xs bg-white border-slate-200 rounded-md">
              <SelectValue placeholder="POD Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All POD</SelectItem>
              <SelectItem value="not_generated">Not Generated</SelectItem>
              <SelectItem value="pending">POD Pending</SelectItem>
              <SelectItem value="uploaded">POD Uploaded</SelectItem>
            </SelectContent>
          </Select>

          {(dateRange !== "all" || fromDate || toDate || lrNoFilter || plantNoFilter !== "all" || dealerFilter !== "all" || vehicleFilter !== "all" || driverFilter !== "all" || statusFilter !== "all" || podFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 ml-auto font-medium"
              onClick={() => {
                setDateRange("all");
                setFromDate("");
                setToDate("");
                setLrNoFilter("");
                setPlantNoFilter("all");
                setDealerFilter("all");
                setVehicleFilter("all");
                setDriverFilter("all");
                setStatusFilter("all");
                setPodFilter("all");
              }}
            >
              <X className="w-3 h-3 mr-1" />
              Clear Filters
            </Button>
          )}
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
        {activeTab === "invoices" && (() => {
          // Normalize invoices into table rows
          const flatInvoicesList = [];
          invoices.forEach((item) => {
            if (item.invoices && Array.isArray(item.invoices) && item.invoices.length > 0) {
              item.invoices.forEach((inv) => {
                flatInvoicesList.push({
                  plant: inv.plantReferenceNumber || item.plant || item.plantReferenceNumber || "—",
                  invoiceNo: inv.invoiceNumber || item.invoiceNo || item.invoiceNumber || "—",
                  invoiceDt: inv.invoiceDate || item.invoiceDt || item.invoiceDate || null,
                  customer: inv.customerName || item.customer || item.customerName || "—",
                  customerLocation: inv.location || item.customerLocation || item.location || "—",
                  status: item.status || "AWAITING SHIPMENT",
                  tyre: (Number(inv.tyre) || Number(item.tyre) || 0),
                  tube: (Number(inv.tube) || Number(item.tube) || 0),
                  flap: (Number(inv.flap) || Number(item.flap) || 0),
                  totalWeight: (Number(inv.weight) || Number(item.totalWeight) || Number(item.weight) || 0),
                  lrNo: item.lrNo || item.lrNumber || "—",
                  dispatchDate: item.dispatchDate || null,
                  vehicleNumber: item.vehicleNumber || "—",
                  driverName: item.driverName || "—",
                  deliveryDate: item.deliveryDate || null,
                  pod: item.pod || "NOT GENERATED",
                  podImages: item.podImages || [],
                });
              });
            } else {
              flatInvoicesList.push({
                plant: item.plant || item.plantReferenceNumber || item.plantNumber || "—",
                invoiceNo: item.invoiceNo || item.invoiceNumber || "—",
                invoiceDt: item.invoiceDt || item.invoiceDate || null,
                customer: item.customer || item.customerName || "—",
                customerLocation: item.customerLocation || item.location || "—",
                status: item.status || "AWAITING SHIPMENT",
                tyre: Number(item.tyre) || 0,
                tube: Number(item.tube) || 0,
                flap: Number(item.flap) || 0,
                totalWeight: Number(item.totalWeight) || Number(item.weight) || 0,
                lrNo: item.lrNo || item.lrNumber || "—",
                dispatchDate: item.dispatchDate || null,
                vehicleNumber: item.vehicleNumber || "—",
                driverName: item.driverName || "—",
                deliveryDate: item.deliveryDate || null,
                pod: item.pod || "NOT GENERATED",
                podImages: item.podImages || [],
              });
            }
          });

          flatInvoicesList.sort((a, b) =>
            String(a.plant || "").localeCompare(String(b.plant || ""), undefined, { numeric: true, sensitivity: "base" })
          );

          const getStatusBadgeStyle = (statusVal) => {
            const s = String(statusVal || "").trim().toUpperCase();
            if (s === "DELIVERED" || s === "CLOSED") {
              return "bg-emerald-600 text-white border-transparent";
            }
            if (s === "DESPATCHED" || s === "IN TRANSIT") {
              return "bg-blue-600 text-white border-transparent";
            }
            if (s === "CANCELLED") {
              return "bg-rose-600 text-white border-transparent";
            }
            return "bg-[#00875A] text-white border-transparent";
          };

          const getPodBadgeStyle = (podVal) => {
            const p = String(podVal || "").trim().toUpperCase();
            if (p === "UPLOADED" || p === "YES") {
              return "bg-emerald-50 text-emerald-700 border-emerald-200";
            }
            if (p === "PENDING") {
              return "bg-rose-50 text-rose-700 border-rose-200";
            }
            return "bg-[#00875A] text-white border-transparent";
          };

          return (
            <div className="space-y-4">
              {/* Status summary badges */}
              <div className="flex flex-wrap items-center gap-2 no-print">
                {[
                  { label: "Total Invoices", value: invoiceStatusCounts.total, cls: "bg-slate-100 text-slate-700 border-slate-200" },
                  { label: "Awaiting Shipment", value: invoiceStatusCounts.awaitingShipment, cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                  { label: "Despatched", value: invoiceStatusCounts.despatched, cls: "bg-blue-50 text-blue-700 border-blue-200" },
                  { label: "Delivered", value: invoiceStatusCounts.delivered, cls: "bg-teal-50 text-teal-800 border-teal-200" },
                  { label: "Cancelled", value: invoiceStatusCounts.cancelled, cls: "bg-rose-50 text-rose-700 border-rose-200" },
                ].map((s) => (
                  <div key={s.label} className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold", s.cls)}>
                    <span>{s.label}:</span>
                    <span className="font-extrabold">{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Ledger Table - Exact 16 Columns Matching Client Spec */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Completed Invoices Historical Ledger</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Comprehensive audit ledger tracking all invoices across dispatch and delivery milestones.</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{flatInvoicesList.length} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left border-collapse" style={{ fontSize: "11px" }}>
                    <thead className="bg-[#f8f9fb] text-slate-500 uppercase text-[9px] font-extrabold tracking-wider border-b border-slate-200 sticky top-0 z-10">
                      <tr className="divide-x divide-slate-200">
                        <th className="py-2.5 px-3 whitespace-nowrap">Plant</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Invoice No</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Invoice Dt</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">CUSTOMER</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Customer Location</th>
                        <th className="py-2.5 px-3 whitespace-nowrap text-center">STATUS</th>
                        <th className="py-2.5 px-3 whitespace-nowrap text-right">TYRE DESPATCHED</th>
                        <th className="py-2.5 px-3 whitespace-nowrap text-right">TUBE DESPATCHED</th>
                        <th className="py-2.5 px-3 whitespace-nowrap text-right">FLAP DESPATCHED</th>
                        <th className="py-2.5 px-3 whitespace-nowrap text-right">TOTAL WEIGHT</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">LR No.</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">DESPATCHED DATE</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">VEHICLE NUMBER</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">DRIVER NAME</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">DELIVERED DATE</th>
                        <th className="py-2.5 px-3 whitespace-nowrap text-center">POD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {loading ? (
                        <tr>
                          <td colSpan={16} className="text-center py-10">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-300" />
                          </td>
                        </tr>
                      ) : flatInvoicesList.length === 0 ? (
                        <tr>
                          <td colSpan={16} className="text-center py-12 text-slate-400">No records matching the selected filters.</td>
                        </tr>
                      ) : (
                        flatInvoicesList.map((row, idx) => {
                          const statusCls = getStatusBadgeStyle(row.status);
                          const podCls = getPodBadgeStyle(row.pod);

                          return (
                            <tr
                              key={`${row.plant}-${row.invoiceNo}-${idx}`}
                              className="hover:bg-slate-50/70 divide-x divide-slate-100 transition-colors"
                            >
                              {/* 1. Plant */}
                              <td className="py-2 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                                {row.plant || "—"}
                              </td>

                              {/* 2. Invoice No */}
                              <td className="py-2 px-3 font-semibold text-blue-700 whitespace-nowrap tabular-nums">
                                {row.invoiceNo || "—"}
                              </td>

                              {/* 3. Invoice Dt */}
                              <td className="py-2 px-3 text-slate-500 whitespace-nowrap tabular-nums">
                                {formatReportDate(row.invoiceDt)}
                              </td>

                              {/* 4. CUSTOMER */}
                              <td className="py-2 px-3 font-semibold text-slate-800 max-w-[200px] truncate" title={row.customer}>
                                {row.customer || "—"}
                              </td>

                              {/* 5. Customer Location */}
                              <td className="py-2 px-3 text-slate-500 max-w-[130px] truncate" title={row.customerLocation}>
                                {row.customerLocation || "—"}
                              </td>

                              {/* 6. STATUS */}
                              <td className="py-2 px-3 whitespace-nowrap text-center">
                                <span className={cn("inline-flex text-[9px] uppercase font-bold px-2.5 py-0.5 rounded shadow-sm tracking-wide", statusCls)}>
                                  {row.status}
                                </span>
                              </td>

                              {/* 7. TYRE DESPATCHED */}
                              <td className="py-2 px-3 text-right font-medium tabular-nums text-slate-700">
                                {row.tyre ?? 0}
                              </td>

                              {/* 8. TUBE DESPATCHED */}
                              <td className="py-2 px-3 text-right font-medium tabular-nums text-slate-700">
                                {row.tube ?? 0}
                              </td>

                              {/* 9. FLAP DESPATCHED */}
                              <td className="py-2 px-3 text-right font-medium tabular-nums text-slate-700">
                                {row.flap ?? 0}
                              </td>

                              {/* 10. TOTAL WEIGHT */}
                              <td className="py-2 px-3 text-right font-semibold tabular-nums text-slate-800 whitespace-nowrap">
                                {row.totalWeight ? `${Number(row.totalWeight).toFixed(2)} kg` : "0 kg"}
                              </td>

                              {/* 11. LR No. */}
                              <td className="py-2 px-3 font-mono font-bold text-[#1d4ed8] whitespace-nowrap tabular-nums">
                                {row.lrNo || "—"}
                              </td>

                              {/* 12. DESPATCHED DATE */}
                              <td className="py-2 px-3 text-slate-500 whitespace-nowrap tabular-nums">
                                {formatReportDate(row.dispatchDate)}
                              </td>

                              {/* 13. VEHICLE NUMBER */}
                              <td className="py-2 px-3 text-slate-700 font-medium whitespace-nowrap">
                                {row.vehicleNumber || "—"}
                              </td>

                              {/* 14. DRIVER NAME */}
                              <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                                {row.driverName || "—"}
                              </td>

                              {/* 15. DELIVERED DATE */}
                              <td className="py-2 px-3 text-slate-500 whitespace-nowrap tabular-nums">
                                {formatReportDate(row.deliveryDate)}
                              </td>

                              {/* 16. POD */}
                              <td className="py-2 px-3 whitespace-nowrap text-center">
                                <span
                                  className={cn(
                                    "inline-flex text-[9px] uppercase font-bold px-2 py-0.5 rounded shadow-sm tracking-wide",
                                    podCls,
                                    row.podImages && row.podImages.length > 0 && "cursor-pointer hover:opacity-85"
                                  )}
                                  onClick={() => {
                                    if (row.podImages && row.podImages.length > 0) {
                                      setPreviewImage(row.podImages[0]);
                                    }
                                  }}
                                  title={row.podImages && row.podImages.length > 0 ? "Click to view POD proof" : ""}
                                >
                                  {row.pod}
                                </span>
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
          );
        })()}

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

      {/* ── IMAGE PREVIEW MODAL ── */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/80 transition-colors shadow-lg"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="POD Proof" className="max-w-full max-h-[80vh] object-contain rounded-lg" />
          </div>
        </div>
      )}

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
