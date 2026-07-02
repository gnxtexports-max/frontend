import { useState, useEffect } from "react";
import { format } from "date-fns";
import axios from "axios";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardStatsGrid } from "./DashboardStatsGrid";
import { DashboardChart } from "./DashboardChart";
import { PendingPODsPanel } from "./PendingPODsPanel";
import { StatDetailView } from "./StatDetailView";
import { ViewShipmentSheet } from "../shipments/ViewShipmentSheet";
import { getPODConfig } from "../shipments/utils/shipmentStyles";

// We'll use our API base URL
const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

export function DashboardPage() {
  const [activeStatView, setActiveStatView] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [podFilter, setPodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(undefined);
  const [showHistory, setShowHistory] = useState(true);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  // Data states
  const [stats, setStats] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [currentShipments, setCurrentShipments] = useState([]);
  const [historicalShipments, setHistoricalShipments] = useState([]);
  const [pendingPODs, setPendingPODs] = useState([]);
  const [cancelledInvoices, setCancelledInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen for api-cache-updated events to do silent refresh
  useEffect(() => {
    const handler = () => fetchDashboardData(true);
    window.addEventListener("api-cache-updated", handler);
    return () => window.removeEventListener("api-cache-updated", handler);
  }, []);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [statsRes, weeklyRes, shipmentsRes, invoicesRes, cancelledInvoicesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard/stats`).catch(() => ({ data: { success: false } })),
        axios.get(`${API_BASE_URL}/dashboard/weekly`).catch(() => ({ data: { success: false } })),
        axios.get(`${API_BASE_URL}/shipments?limit=100`).catch(() => ({ data: { success: false } })),
        axios.get(`${API_BASE_URL}/invoices?status=Pending`).catch(() => ({ data: { success: false } })),
        axios.get(`${API_BASE_URL}/invoices?status=Cancelled&all=true&limit=100`).catch(() => ({ data: { success: false } }))
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (weeklyRes.data?.success) setWeeklyData(weeklyRes.data.data);

      if (shipmentsRes.data?.success) {
        const shipments = shipmentsRes.data.data;
        const active = shipments
          .filter(s => s.status !== "Delivered" && s.status !== "Cancelled")
          .map(formatShipmentForTable);
        const history = shipments
          .filter(s => ["Delivered", "Cancelled", "Closed"].includes(s.status))
          .map(formatShipmentForTable);

        setCurrentShipments(active);
        setHistoricalShipments(history);
      }

      if (invoicesRes.data?.success) {
        const pods = invoicesRes.data.data.map(inv => ({
          id: inv.invoiceNumber,
          dealer: inv.customerName,
          date: format(new Date(inv.invoiceDate || inv.createdAt), "MMM d, yyyy"),
          shipmentId: inv.plantReferenceNumber || "N/A",
          status: inv.status === "Pending" ? "Awaiting Upload" : "Verification Pending"
        }));
        setPendingPODs(pods);
      }

      if (cancelledInvoicesRes.data?.success) {
        setCancelledInvoices(cancelledInvoicesRes.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatShipmentForTable = (s) => ({
    id: s.shipmentId,
    vehicle: s.vehicleNumber || "Unknown",
    driver: s.driverName || "Unknown",
    destination: s.destinations?.[0]?.customerName || s.destinations?.[0]?.deliveryLocation || "Unknown",
    customer: s.destinations?.[0]?.customerName || "Unknown",
    location: s.destinations?.[0]?.deliveryLocation || "—",
    status: s.status,
    progress: s.status === "Delivered" ? 100 : (s.status === "In Transit" ? 60 : 10),
    eta: s.deliveryDate ? format(new Date(s.deliveryDate), "MMM d, yyyy h:mm a") : "Pending",
    items: `${s.totalQuantity || 0} Items`,
    podConfig: getPODConfig(s),
    podStatus: getPODConfig(s).label,
    originalDate: s.dispatchDate || s.createdAt,
    originalData: s
  });

  // Filter the current shipments dynamically based on selected card view
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let baseData = [];
  if (activeStatView === "Active Shipments") {
    baseData = currentShipments.filter(s => s.status === "In Transit" && new Date(s.originalDate) >= sevenDaysAgo);
  } else if (activeStatView === "Pending Dispatch") {
    baseData = currentShipments.filter(s => s.status === "Pending" && new Date(s.originalDate) >= sevenDaysAgo);
  } else if (activeStatView === "Cancelled Invoices") {
    baseData = cancelledInvoices.map(plant => ({
      id: plant.invoices?.[0]?.invoiceNumber || "—",
      originalDate: plant.cancelledAt || plant.createdAt,
      customer: plant.customerName,
      location: plant.location || "—",
      status: plant.status,
      allInvoices: plant.invoices
    })).filter(item => new Date(item.originalDate) >= sevenDaysAgo);
  } else if (activeStatView === "Deliveries Today") {
    const todayStr = new Date().toDateString();
    baseData = historicalShipments.filter(s => {
      const isCorrectStatus = ["Delivered", "Closed"].includes(s.status);
      const deliveryDate = new Date(s.originalData.deliveryDate || s.originalDate).toDateString();
      return isCorrectStatus && deliveryDate === todayStr;
    }).map(s => ({
      ...s,
      customer: s.originalData?.destinations?.[0]?.customerName || s.customer,
      location: s.originalData?.destinations?.[0]?.deliveryLocation || s.location,
    }));
  } else if (activeStatView) {
    baseData = showHistory ? historicalShipments : currentShipments;
  }

  // Apply search filter
  const tableData = baseData.filter((item) => {
    const matchesSearch =
      (item.id?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.driver?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.vehicle?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.customer?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.location?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPod =
      podFilter === "all" ||
      item.podStatus === podFilter;
    let matchesDate = true;
    if (showHistory && dateFilter) {
      const filterDateStr = dateFilter.toDateString();
      const itemDateStr = new Date(item.originalDate).toDateString();
      matchesDate = filterDateStr === itemDateStr;
    }

    return matchesSearch && matchesPod && matchesDate;
  });

  return (
    <>
      {activeStatView && !loading ? (
        <StatDetailView
          activeStatView={activeStatView}
          onBack={() => setActiveStatView(null)}
          tableData={tableData}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          podFilter={podFilter}
          setPodFilter={setPodFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          onView={(item) => {
            if (item.originalData) {
              setSelectedShipment(item.originalData);
              setViewSheetOpen(true);
            }
          }}
        />
      ) : (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
          <DashboardHeader />
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          ) : (
            <>
              <DashboardStatsGrid onStatClick={setActiveStatView} stats={stats} />
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <DashboardChart weeklyData={weeklyData} />
                <PendingPODsPanel />
              </div>
            </>
          )}
        </div>
      )}
      <ViewShipmentSheet
        open={viewSheetOpen}
        onOpenChange={setViewSheetOpen}
        shipment={selectedShipment}
        onStatusChange={() => fetchDashboardData()}
      />
    </>
  );
}
export default DashboardPage;
